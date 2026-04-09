const fs = require('fs');
class TranscriptionQueue {
  constructor(maxConcurrent = 2, modelPath = 'models/ggml-base.en.bin') {
    this.maxConcurrent = maxConcurrent;
    this.modelPath = modelPath;
    this.pendingJobs = [];
    this.runningJobs = 0;
    this.whisperRunner = new (require('./whisperRunner'))(modelPath);
    this.isProcessing = false;
  }

  async addJob(filePath, userId, roomId, onProcessSpawned) {
    return new Promise((resolve, reject) => {
      const job = {
        filePath,
        userId,
        roomId,
        resolve,
        reject,
        timestamp: Date.now(),
        onProcessSpawned
      };

      this.pendingJobs.push(job);
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this._processQueue();
      }
    });
  }

  async _processQueue() {
    this.isProcessing = true;
    
    while (this.pendingJobs.length > 0 && this.runningJobs < this.maxConcurrent) {
      const job = this.pendingJobs.shift();
      this.runningJobs++;
      
      try {
        console.log(`[TranscriptionQueue] Starting transcription for user ${job.userId} in room ${job.roomId}`);
        
        // Pass the onProcessSpawned callback to track the child process
        const result = await this.whisperRunner.transcribe(job.filePath, job.onProcessSpawned);
        
        // Clean up audio file after successful transcription
        this._cleanupFile(job.filePath);
        
        job.resolve({
          success: true,
          userId: job.userId,
          roomId: job.roomId,
          ...result
        });
        
        console.log(`[TranscriptionQueue] Completed transcription for user ${job.userId} in ${result.processingTime}ms`);
      } catch (error) {
        console.error(`[TranscriptionQueue] Transcription failed for user ${job.userId}:`, error.message);
        
        // Clean up audio file on failure
        this._cleanupFile(job.filePath);
        
        job.reject({
          success: false,
          userId: job.userId,
          roomId: job.roomId,
          error: error.message,
          timestamp: Date.now()
        });
      } finally {
        this.runningJobs--;
        
        // Process next job if available
        if (this.pendingJobs.length > 0 && this.runningJobs < this.maxConcurrent) {
          setTimeout(() => this._processQueue(), 100);
        }
      }
    }
    
    // Mark as not processing when queue is empty
    if (this.pendingJobs.length === 0) {
      this.isProcessing = false;
    }
  }

  _cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('[TranscriptionQueue] Cleaned up audio file: ' + filePath);
      }
    } catch (error) {
      console.error('[TranscriptionQueue] Error cleaning up audio file: ', error.message);
    }
  }

  getQueueStats() {
    return {
      maxConcurrent: this.maxConcurrent,
      runningJobs: this.runningJobs,
      pendingJobs: this.pendingJobs.length,
      isProcessing: this.isProcessing
    };
  }

  clearQueue() {
    const failedJobs = this.pendingJobs.map(job => ({
      success: false,
      userId: job.userId,
      roomId: job.roomId,
      error: 'Queue cleared',
      timestamp: Date.now()
    }));
    
    this.pendingJobs = [];
    return failedJobs;
  }

  updateMaxConcurrent(newMax) {
    this.maxConcurrent = Math.max(1, newMax);
    
    // Process more jobs if capacity increased
    if (this.isProcessing) {
      setTimeout(() => this._processQueue(), 100);
    }
  }

  updateModelPath(newModelPath) {
    if (this.whisperRunner.constructor.validateModelPath(newModelPath)) {
      this.modelPath = newModelPath;
      this.whisperRunner = new (require('./whisperRunner'))(newModelPath);
      return true;
    }
    return false;
  }
}

module.exports = TranscriptionQueue;
