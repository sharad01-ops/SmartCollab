const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const TranscriptionQueue = require('./transcription/transcriptionQueue.js');
const WAVWriter = require('./audio/WAVWriter.js');
const { addSegment, getRoomTranscript, getRoomTranscriptText, clearRoom, getSegmentCount, getAllRooms, saveRoomTranscriptToFile } = require('./transcriptStore.js');

class LiveAudioService {
  constructor(options = {}) {
    this.bufferDuration = options.bufferDuration || 8000; // 8 seconds default
    this.sampleRate = options.sampleRate || 16000;
    this.channels = options.channels || 1;
    this.bitDepth = options.bitDepth || 16;
    
    // Per-room, per-user audio buffers
    // Structure: { roomId: { userId: { 
    //   chunks: [], 
    //   timer: null, 
    //   lastActivity: timestamp,
    //   isActive: boolean,
    //   transcriptionInProgress: boolean,
    //   activeWhisperProcess: ChildProcess | null
    // } } }
    this.audioBuffers = new Map();
    
    // Cleanup interval for stale buffers
    this.cleanupInterval = setInterval(() => this._cleanupStaleBuffers(), 30000);
    
    // Use consistent temp directory path (relative to process.cwd())
    this.tempDir = path.resolve(process.cwd(), 'storage', 'temp');
    
    // Ensure temp directory exists
    this._ensureTempDir();
    
    // Transcription queue
    this.transcriptionQueue = new TranscriptionQueue(
      options.maxConcurrent || 2,
      options.modelPath || 'whisper/models/ggml-base.en.bin'
    );
    
    console.log('[LiveAudioService] initialized:', {
      bufferDuration: this.bufferDuration,
      sampleRate: this.sampleRate,
      channels: this.channels,
      tempDir: this.tempDir
    });
  }

  /**
   * Ensure temp directory exists
   */
  _ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      console.log(`[LiveAudioService] Created temp directory: ${this.tempDir}`);
    }
  }

  /**
   * Initialize or get user session
   */
  _getOrCreateSession(roomId, userId) {
    if (!this.audioBuffers.has(roomId)) {
      this.audioBuffers.set(roomId, new Map());
    }

    const roomBuffers = this.audioBuffers.get(roomId);
    
    if (!roomBuffers.has(userId)) {
      roomBuffers.set(userId, {
        chunks: [],
        totalDuration: 0,
        lastActivity: Date.now(),
        processingTimer: null,
        bufferStartTime: Date.now(),
        isActive: true,
        transcriptionInProgress: false,
        activeWhisperProcess: null
      });
      
      console.log(`[LiveAudioService] Initialized session for user ${userId} in room ${roomId}`);
    }

    return roomBuffers.get(userId);
  }

  /**
   * Get session if it exists and is active
   */
  _getActiveSession(roomId, userId) {
    const roomBuffers = this.audioBuffers.get(roomId);
    if (!roomBuffers) return null;
    
    const session = roomBuffers.get(userId);
    if (!session) return null;
    if (!session.isActive) return null;
    
    return session;
  }

  /**
   * Check if session can accept new transcription
   */
  _canStartTranscription(session) {
    if (!session) return false;
    if (!session.isActive) return false;
    if (session.transcriptionInProgress) return false;
    if (session.activeWhisperProcess) return false;
    return true;
  }

  /**
   * Handle incoming audio chunk from a user
   */
  async handleAudioChunk(roomId, userId, audioData, timestamp, emitCallback) {
    try {
      // Validate inputs
      if (!roomId || !userId || !audioData) {
        console.error('[LiveAudioService] Invalid audio chunk data:', { roomId, userId, hasAudio: !!audioData });
        return;
      }

      const session = this._getOrCreateSession(roomId, userId);
      
      // Check if session is active
      if (!session.isActive) {
        console.log(`[LiveAudioService] Skipping audio chunk – session inactive for user ${userId}`);
        return;
      }

      // Convert audio data to Float32Array if needed
      const pcmData = this._normalizeAudioData(audioData);
      
      // Add chunk to buffer
      session.chunks.push({
        data: pcmData,
        timestamp: timestamp || Date.now()
      });
      
      // Calculate duration of this chunk
      const chunkDuration = (pcmData.length / this.sampleRate) * 1000; // in ms
      session.totalDuration += chunkDuration;
      session.lastActivity = Date.now();
      
      // Check if buffer is full enough to process
      if (session.totalDuration >= this.bufferDuration && !session.processingTimer) {
        if (this._canStartTranscription(session)) {
          console.log(`[LiveAudioService] Buffer full for user ${userId}, processing...`);
          await this._processBufferedAudio(roomId, userId, emitCallback);
        } else {
          console.log(`[LiveAudioService] Buffer full but transcription in progress for user ${userId}, skipping...`);
          // Reset buffer to prevent accumulation
          session.chunks = [];
          session.totalDuration = 0;
        }
      } else if (!session.processingTimer) {
        // Set timer to process partial buffer if no more chunks received
        session.processingTimer = setTimeout(() => {
          const currentSession = this._getActiveSession(roomId, userId);
          if (currentSession && this._canStartTranscription(currentSession)) {
            console.log(`[LiveAudioService] Processing timeout for user ${userId}`);
            this._processBufferedAudio(roomId, userId, emitCallback);
          } else {
            console.log(`[LiveAudioService] Processing timeout skipped – session inactive or transcription in progress`);
          }
        }, this.bufferDuration);
      }
    } catch (error) {
      console.error('[LiveAudioService] Error handling audio chunk:', error.message);
    }
  }

  /**
   * Normalize audio data to Float32Array
   */
  _normalizeAudioData(audioData) {
    if (audioData instanceof Float32Array) {
      return audioData;
    }
    
    if (Buffer.isBuffer(audioData)) {
      const int16Array = new Int16Array(audioData.buffer, audioData.byteOffset, audioData.length / 2);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      return float32Array;
    }
    
    if (Array.isArray(audioData)) {
      return new Float32Array(audioData);
    }
    
    if (audioData.buffer || audioData instanceof ArrayBuffer) {
      const buffer = audioData.buffer || audioData;
      const int16Array = new Int16Array(buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      return float32Array;
    }
    
    throw new Error(`Unsupported audio data type: ${typeof audioData}`);
  }

  /**
   * Process buffered audio and send to transcription queue
   */
  async _processBufferedAudio(roomId, userId, emitCallback) {
    const session = this._getActiveSession(roomId, userId);
    
    // Guard: Check session exists and is active
    if (!session) {
      console.log(`[LiveAudioService] Skipping processing – no active session for user ${userId}`);
      return;
    }
    
    // Guard: Check not already processing
    if (!this._canStartTranscription(session)) {
      console.log(`[LiveAudioService] Skipping processing – transcription already in progress for user ${userId}`);
      return;
    }
    
    // Guard: Check has chunks
    if (session.chunks.length === 0) {
      console.log(`[LiveAudioService] Skipping processing – no audio chunks for user ${userId}`);
      return;
    }

    try {
      // Clear the timer
      if (session.processingTimer) {
        clearTimeout(session.processingTimer);
        session.processingTimer = null;
      }

      // Combine all chunks
      const totalLength = session.chunks.reduce((sum, chunk) => sum + chunk.data.length, 0);
      
      // Guard: Check minimum duration (at least 0.3 seconds)
      const durationSeconds = totalLength / this.sampleRate;
      if (durationSeconds < 0.3) {
        console.log(`[LiveAudioService] Skipping processing – audio too short (${durationSeconds.toFixed(2)}s < 0.3s)`);
        session.chunks = [];
        session.totalDuration = 0;
        return;
      }
      
      const combinedAudio = new Float32Array(totalLength);
      let offset = 0;
      
      for (const chunk of session.chunks) {
        combinedAudio.set(chunk.data, offset);
        offset += chunk.data.length;
      }
      
      // Clear chunks from buffer
      const bufferStartTime = session.bufferStartTime;
      session.chunks = [];
      session.totalDuration = 0;
      session.bufferStartTime = Date.now();
      
      // Mark transcription as in progress
      session.transcriptionInProgress = true;
      
      // Create temporary WAV file
      const tempFileName = `live_${roomId}_${userId}_${uuidv4()}.wav`;
      const tempFilePath = path.join(this.tempDir, tempFileName);
      
      console.log(`[LiveAudioService] Creating WAV file: ${tempFilePath}`);
      console.log(`[LiveAudioService] Audio duration: ${durationSeconds.toFixed(2)}s`);
      
      // Write WAV file
      const wavWriter = new WAVWriter(tempFilePath, this.sampleRate, this.channels);
      wavWriter.appendPCM(combinedAudio);
      
      // Finalize WAV file
      console.log(`[LiveAudioService] Finalizing WAV file...`);
      const finalizedPath = await wavWriter.finalize();
      console.log(`[LiveAudioService] WAV file finalized: ${finalizedPath}`);
      
      // Verify file exists
      if (!fs.existsSync(finalizedPath)) {
        throw new Error(`WAV file not found after finalize: ${finalizedPath}`);
      }
      
      // Check if session still active before adding to queue
      const currentSession = this._getActiveSession(roomId, userId);
      if (!currentSession) {
        console.log(`[LiveAudioService] Session ended before transcription, cleaning up file`);
        fs.unlinkSync(finalizedPath);
        return;
      }
      
      // Add to transcription queue
      console.log(`[LiveAudioService] Adding to transcription queue: ${finalizedPath}`);
      const jobId = uuidv4();
      
      // Start transcription and track the process
      const transcriptionPromise = this.transcriptionQueue.addJob(
        finalizedPath, 
        userId, 
        roomId,
        (process) => {
          // Callback to track the spawned process
          if (currentSession) {
            currentSession.activeWhisperProcess = process;
            console.log(`[LiveAudioService] Tracking Whisper process ${process.pid} for user ${userId}`);
          }
        }
      );
      
      // Handle transcription result
      transcriptionPromise
        .then(result => {
          console.log(`[LiveAudioService] Transcription completed for user ${userId}`);
          
          // Get fresh session reference
          const resultSession = this._getActiveSession(roomId, userId);
          if (resultSession) {
            resultSession.transcriptionInProgress = false;
            resultSession.activeWhisperProcess = null;
          }
          
          this._handleTranscriptionResult(result, roomId, userId, bufferStartTime, emitCallback);
        })
        .catch(error => {
          console.error(`[LiveAudioService] Transcription failed for user ${userId}:`, error);
          
          // Get fresh session reference
          const errorSession = this._getActiveSession(roomId, userId);
          if (errorSession) {
            errorSession.transcriptionInProgress = false;
            errorSession.activeWhisperProcess = null;
          }
        });
        
    } catch (error) {
      console.error('[LiveAudioService] Error processing buffered audio:', error.message);
      
      // Reset transcription state on error
      const errorSession = this._getActiveSession(roomId, userId);
      if (errorSession) {
        errorSession.transcriptionInProgress = false;
        errorSession.activeWhisperProcess = null;
      }
    }
  }

  /**
   * Handle transcription result and emit updates
   */
  _handleTranscriptionResult(result, roomId, userId, bufferStartTime, emitCallback) {
    // WhisperRunner returns result.transcript with { segments: [...], text: "..." }
    if (!result.success || !result.transcript || !result.transcript.segments || result.transcript.segments.length === 0) {
      console.warn(`[LiveAudioService] Transcription unsuccessful for user ${userId}`);
      return;
    }

    try {
      // WhisperRunner normalizes segments to: { start, end, text }
      const segments = result.transcript.segments;
      const fullText = segments.map(seg => seg.text).join(' ').trim();

      // Create segment from transcription result
      const segment = {
        userId: userId,
        text: fullText,
        start: bufferStartTime,
        end: bufferStartTime + (result.duration || 0)
      };

      // Add segment to transcript store (validates, deduplicates, ignores empty)
      const added = addSegment(roomId, segment);

      // Only log full transcript if segment was successfully added
      if (added) {
        const transcriptText = getRoomTranscriptText(roomId);
        console.log(`\n[ROOM ${roomId} TRANSCRIPT]:\n${transcriptText}\n`);
        
        // Save transcript to JSON file after each segment
        saveRoomTranscriptToFile(roomId);
      }
    } catch (error) {
      console.error('[LiveAudioService] Error handling transcription result:', error.message);
    }
  }

  /**
   * Handle user leaving room - cleanup buffers and kill processes
   */
  handleUserLeft(roomId, userId) {
    try {
      console.log(`[LiveAudioService] User ${userId} leaving room ${roomId}, cleaning up...`);
      
      const roomBuffers = this.audioBuffers.get(roomId);
      if (!roomBuffers) return;
      
      const session = roomBuffers.get(userId);
      if (session) {
        // Mark session as inactive immediately
        session.isActive = false;
        
        // Clear any pending timer
        if (session.processingTimer) {
          clearTimeout(session.processingTimer);
          session.processingTimer = null;
        }
        
        // Kill active Whisper process if exists
        if (session.activeWhisperProcess) {
          try {
            console.log(`[LiveAudioService] Force killing Whisper process ${session.activeWhisperProcess.pid} for user ${userId}`);
            session.activeWhisperProcess.kill('SIGKILL');
            session.activeWhisperProcess = null;
          } catch (killError) {
            console.error(`[LiveAudioService] Error killing Whisper process: ${killError.message}`);
          }
        }
        
        // Clear buffers
        session.chunks = [];
        session.totalDuration = 0;
        session.transcriptionInProgress = false;
        
        // Remove user buffer
        roomBuffers.delete(userId);
        console.log(`[LiveAudioService] Cleaned up session for user ${userId} in room ${roomId}`);
      }
      
      // If room is empty, remove it
      if (roomBuffers.size === 0) {
        this.audioBuffers.delete(roomId);
        console.log(`[LiveAudioService] Removed empty room buffer: ${roomId}`);
      }
    } catch (error) {
      console.error('[LiveAudioService] Error handling user left:', error.message);
    }
  }

  /**
   * Handle room ending - cleanup everything
   */
  handleRoomEnded(roomId) {
    try {
      console.log(`[LiveAudioService] Room ${roomId} ending, cleaning up everything...`);
      
      const roomBuffers = this.audioBuffers.get(roomId);



      if (roomBuffers) {
        // Kill all active Whisper processes
        roomBuffers.forEach((session, userId) => {
          session.isActive = false;
          
          if (session.processingTimer) {
            clearTimeout(session.processingTimer);
          }
          
          if (session.activeWhisperProcess) {
            try {
              console.log(`[LiveAudioService] Force killing Whisper process ${session.activeWhisperProcess.pid} for user ${userId}`);
              session.activeWhisperProcess.kill('SIGKILL');
            } catch (killError) {
              console.error(`[LiveAudioService] Error killing Whisper process: ${killError.message}`);
            }
          }
        });
        
        this.audioBuffers.delete(roomId);
        console.log(`[LiveAudioService] Cleaned up room ${roomId} buffers`);
      }
      
      // Save transcript to JSON file before clearing
      const saved = saveRoomTranscriptToFile(roomId);
      
      // Clear transcript for room
      clearRoom(roomId);
    } catch (error) {
      console.error('[LiveAudioService] Error handling room ended:', error.message);
    }
  }

  /**
   * Get transcript timeline for a room (sorted chronologically)
   */
  getRoomTranscript(roomId) {
    return transcriptStore.getRoomTranscript(roomId);
  }

  /**
   * Save room transcript to JSON file
   * @param {string} roomId - Room identifier
   * @param {string} outputDir - Optional custom output directory
   * @returns {object|null} - Saved file info or null
   */
  saveTranscriptToFile(roomId, outputDir) {
    return saveRoomTranscriptToFile(roomId, outputDir);
  }

  /**
   * Get service statistics
   */
  getStats() {
    let totalUsers = 0;
    let totalBufferedChunks = 0;
    let activeTranscriptions = 0;
    
    this.audioBuffers.forEach(roomBuffers => {
      totalUsers += roomBuffers.size;
      roomBuffers.forEach(session => {
        totalBufferedChunks += session.chunks.length;
        if (session.transcriptionInProgress) activeTranscriptions++;
      });
    });
    
    return {
      activeRooms: this.audioBuffers.size,
      activeUsers: totalUsers,
      totalBufferedChunks,
      activeTranscriptions,
      transcriptionQueue: this.transcriptionQueue.getQueueStats(),
      roomTranscripts: transcriptStore.getAllRooms().map(roomId => ({
        roomId,
        segmentCount: transcriptStore.getSegmentCount(roomId)
      }))
    };
  }

  /**
   * Cleanup stale buffers
   */
  _cleanupStaleBuffers() {
    const now = Date.now();
    const staleThreshold = 60000; // 60 seconds
    
    this.audioBuffers.forEach((roomBuffers, roomId) => {
      roomBuffers.forEach((session, userId) => {
        if (now - session.lastActivity > staleThreshold && 
            session.chunks.length === 0 && 
            !session.transcriptionInProgress) {
          if (session.processingTimer) {
            clearTimeout(session.processingTimer);
          }
          session.isActive = false;
          roomBuffers.delete(userId);
          console.log(`[LiveAudioService] Cleaned up stale buffer for user ${userId} in room ${roomId}`);
        }
      });
      
      if (roomBuffers.size === 0) {
        this.audioBuffers.delete(roomId);
      }
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('[LiveAudioService] Shutting down...');
    
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Kill all active Whisper processes
    this.audioBuffers.forEach((roomBuffers, roomId) => {
      roomBuffers.forEach((session, userId) => {
        session.isActive = false;
        
        if (session.processingTimer) {
          clearTimeout(session.processingTimer);
        }
        
        if (session.activeWhisperProcess) {
          try {
            console.log(`[LiveAudioService] Killing Whisper process ${session.activeWhisperProcess.pid} for user ${userId}`);
            session.activeWhisperProcess.kill('SIGKILL');
          } catch (killError) {
            console.error(`[LiveAudioService] Error killing Whisper process: ${killError.message}`);
          }
        }
      });
    });
    
    // Clear all buffers
    this.audioBuffers.clear();
    
    console.log('[LiveAudioService] Shutdown complete');
  }
}

module.exports = LiveAudioService;
