const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Transform } = require('stream');
const WAVWriter = require('./WAVWriter.js');
const TranscriptionQueue = require('../transcription/transcriptionQueue.js');
const TranscriptMerger = require('../transcription/transcriptMerger.js');
const SummaryService = require('../summary/summaryService.js');

class AudioProcessingService {
  constructor() {
    this.transcriptionQueue = new TranscriptionQueue(2, 'models/ggml-base.en.bin');
    this.summaryService = new SummaryService();
    this.activeRooms = new Map();
    this.audioWriters = new Map();
    this.roomTimers = new Map();
  }

  initializeAudioProcessing(roomId, participants) {
    if (this.activeRooms.has(roomId)) {
      console.warn('Room already initialized:', roomId);
      return;
    }

    const roomData = {
      id: roomId,
      participants: new Map(),
      startTime: new Date(),
      wavWriters: new Map(),
      transcriptions: [],
      isRecording: true
    };

    // Initialize participants
    participants.forEach(participant => {
      roomData.participants.set(participant.userId, {
        userId: participant.userId,
        name: participant.name,
        avatar: participant.avatar,
        joinedAt: new Date()
      });
    });

    this.activeRooms.set(roomId, roomData);
    console.log('Initialized audio processing for room:', roomId);
  }

  createAudioWriter(userId, roomId) {
    const roomData = this.activeRooms.get(roomId);
    if (!roomData) {
      throw new Error('Room not initialized');
    }

    if (roomData.wavWriters.has(userId)) {
      console.warn('Audio writer already exists for user:', userId);
      return roomData.wavWriters.get(userId);
    }

    const userDir = path.join('storage/rooms', roomId);
    const filePath = path.join(userDir, `${userId}.wav`);
    
    const wavWriter = new WAVWriter(filePath, 16000, 1);
    roomData.wavWriters.set(userId, wavWriter);
    
    console.log('Created audio writer for user:', userId, 'in room:', roomId);
    return wavWriter;
  }

  appendAudioChunk(userId, roomId, audioChunk) {
    const roomData = this.activeRooms.get(roomId);
    if (!roomData || !roomData.isRecording) {
      return;
    }

    const wavWriter = roomData.wavWriters.get(userId);
    if (!wavWriter) {
      console.warn('No audio writer for user:', userId);
      return;
    }

    try {
      // Convert Float32 audio chunk to Int16 PCM
      const pcmData = new Float32Array(audioChunk);
      wavWriter.appendPCM(pcmData);
    } catch (error) {
      console.error('Error appending audio chunk:', error.message);
    }
  }

  finalizeRoom(roomId) {
    const roomData = this.activeRooms.get(roomId);
    if (!roomData) {
      console.warn('Room not found for finalization:', roomId);
      return Promise.resolve(null);
    }

    // Mark room as not recording
    roomData.isRecording = false;

    // Finalize all WAV files
    const finalizePromises = [];
    
    roomData.wavWriters.forEach((wavWriter, userId) => {
      finalizePromises.push(this._finalizeUserAudio(userId, roomId, wavWriter, roomData));
    });

    return Promise.all(finalizePromises)
      .then(() => this._processTranscriptions(roomId, roomData))
      .then(transcripts => this._generateSummary(roomId, roomData, transcripts))
      .then(summary => {
        this._cleanupRoom(roomId);
        return summary;
      })
      .catch(error => {
        console.error('Room finalization failed:', error.message);
        this._cleanupRoom(roomId);
        throw error;
      });
  }

  async _finalizeUserAudio(userId, roomId, wavWriter, roomData) {
    try {
      console.log('Finalizing audio for user:', userId);
      const filePath = wavWriter.finalize();
      
      // Add to transcription queue
      const transcriptionPromise = this.transcriptionQueue.addJob(
        filePath,
        userId,
        roomId
      );
      
      roomData.transcriptions.push({
        userId,
        promise: transcriptionPromise,
        filePath
      });
      
      return { userId, filePath, status: 'finalized' };
      
    } catch (error) {
      console.error('Failed to finalize audio for user:', userId, error.message);
      return { userId, error: error.message, status: 'failed' };
    }
  }

  async _processTranscriptions(roomId, roomData) {
    console.log('Processing transcriptions for room:', roomId);
    
    const results = [];
    const failedJobs = [];
    
    for (const job of roomData.transcriptions) {
      try {
        const result = await job.promise;
        results.push(result);
        console.log('Transcription completed for user:', job.userId);
      } catch (error) {
        console.error('Transcription failed for user:', job.userId, error.message);
        failedJobs.push({
          userId: job.userId,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
    
    return { results, failedJobs };
  }

  async _generateSummary(roomId, roomData, transcriptionResults) {
    console.log('Generating summary for room:', roomId);
    
    const successfulTranscripts = transcriptionResults.results.filter(r => r.success);
    
    if (successfulTranscripts.length === 0) {
      console.warn('No successful transcriptions for summary generation');
      return null;
    }

    // Create meeting data
    const meetingData = {
      meetingId: roomId,
      title: `Meeting - ${roomData.participants.size} participants`,
      participants: Array.from(roomData.participants.values()).map(p => p.name),
      startTime: roomData.startTime,
      endTime: new Date(),
      duration: (new Date() - roomData.startTime) / 1000,
      timeline: [],
      transcriptText: ''
    };

    // Merge transcripts
    const transcriptMerger = new TranscriptMerger();
    const mergedResult = transcriptMerger.mergeTranscripts(successfulTranscripts);
    
    meetingData.timeline = mergedResult.timeline;
    meetingData.transcriptText = mergedResult.text;

    // Generate summary
    const summary = await this.summaryService.generateSummary(meetingData, {
      includeDecisions: true,
      includeActionItems: true,
      includeQuestions: true,
      includeKeyPoints: true,
      includeSentiment: true,
      includeConversationFlow: true,
      savePath: path.join('storage/summaries', `${roomId}.json`)
    });

    console.log('Summary generated for room:', roomId);
    return summary;
  }

  _cleanupRoom(roomId) {
    const roomData = this.activeRooms.get(roomId);
    if (!roomData) return;

    // Close all WAV writers
    roomData.wavWriters.forEach(wavWriter => {
      try {
        wavWriter.close();
      } catch (error) {
        console.error('Error closing WAV writer:', error.message);
      }
    });

    // Clear timers
    const timer = this.roomTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.roomTimers.delete(roomId);
    }

    // Remove from active rooms
    this.activeRooms.delete(roomId);
    console.log('Cleaned up room:', roomId);
  }

  getRoomStatus(roomId) {
    const roomData = this.activeRooms.get(roomId);
    if (!roomData) {
      return null;
    }

    return {
      id: roomData.id,
      participantCount: roomData.participants.size,
      isRecording: roomData.isRecording,
      startTime: roomData.startTime,
      transcriptionQueue: this.transcriptionQueue.getQueueStats(),
      participants: Array.from(roomData.participants.values()).map(p => ({
        userId: p.userId,
        name: p.name,
        joinedAt: p.joinedAt
      })),
      audioFiles: Array.from(roomData.wavWriters.entries()).map(([userId, writer]) => ({
        userId,
        fileSize: fs.existsSync(writer.filePath) ? 
          fs.statSync(writer.filePath).size : 0,
        status: roomData.isRecording ? 'recording' : 'finalizing'
      }))
    };
  }

  getQueueStats() {
    return {
      activeRooms: this.activeRooms.size,
      transcriptionQueue: this.transcriptionQueue.getQueueStats(),
      summaryService: {
        model: this.summaryService.model,
        apiAvailable: this.summaryService.apiKey !== null
      }
    };
  }

  // WebRTC integration methods
  handleUserJoined(roomId, userId, userName) {
    const roomData = this.activeRooms.get(roomId);
    if (!roomData) {
      console.warn('Room not initialized for user join:', roomId);
      return;
    }

    if (!roomData.participants.has(userId)) {
      roomData.participants.set(userId, {
        userId,
        name: userName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`,
        joinedAt: new Date()
      });
      console.log('User joined room:', userId, 'in', roomId);
    }
  }

  handleUserLeft(roomId, userId) {
    const roomData = this.activeRooms.get(roomId);
    if (roomData) {
      roomData.participants.delete(userId);
      console.log('User left room:', userId, 'in', roomId);
    }
  }

  handleCallEnd(roomId) {
    console.log('Call ended in room:', roomId);
    return this.finalizeRoom(roomId);
  }

  handleAudioChunk(userId, roomId, audioChunk) {
    try {
      this.appendAudioChunk(userId, roomId, audioChunk);
    } catch (error) {
      console.error('Error handling audio chunk:', error.message);
    }
  }

  // Cleanup method for server shutdown
  shutdown() {
    console.log('Shutting down audio processing service...');
    
    // Finalize all active rooms
    const roomIds = Array.from(this.activeRooms.keys());
    const shutdownPromises = roomIds.map(roomId => this.finalizeRoom(roomId));
    
    return Promise.all(shutdownPromises)
      .then(() => {
        console.log('Audio processing service shutdown complete');
      })
      .catch(error => {
        console.error('Error during shutdown:', error.message);
      });
  }
}

module.exports = AudioProcessingService;