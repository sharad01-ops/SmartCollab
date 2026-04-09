const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const openAsync = promisify(fs.open);
const writeAsync = promisify(fs.write);
const closeAsync = promisify(fs.close);

class WAVWriter {
  constructor(filePath, sampleRate = 16000, channels = 1) {
    this.filePath = path.resolve(filePath); // Ensure absolute path
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.bitDepth = 16;
    this.byteRate = (sampleRate * channels * this.bitDepth) / 8;
    this.blockAlign = (channels * this.bitDepth) / 8;
    this.dataSize = 0;
    this.fileStream = null;
    this.isFinalized = false;
    
    console.log(`[WAVWriter] Creating file: ${this.filePath}`);
    
    // Create directories if they don't exist
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[WAVWriter] Created directory: ${dir}`);
    }
    
    // Initialize file stream
    this.fileStream = fs.createWriteStream(this.filePath, { flags: 'w' });
    
    // Write WAV header (will be updated later)
    this._writeHeader();
  }

  _writeHeader() {
    const header = Buffer.alloc(44);
    
    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(36, 4); // File size - 8 (placeholder)
    header.write('WAVE', 8);
    
    // fmt sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Sub-chunk size
    header.writeUInt16LE(1, 20); // Audio format (PCM)
    header.writeUInt16LE(this.channels, 22);
    header.writeUInt32LE(this.sampleRate, 24);
    header.writeUInt32LE(this.byteRate, 28);
    header.writeUInt16LE(this.blockAlign, 32);
    header.writeUInt16LE(this.bitDepth, 34);
    
    // data sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(0, 40); // Data size (placeholder)
    
    this.fileStream.write(header);
  }

  appendPCM(pcmData) {
    if (!this.fileStream || this.isFinalized) {
      throw new Error('File stream is not initialized or already finalized');
    }
    
    // Convert to Int16 if needed (assuming Float32 input)
    const int16Data = new Int16Array(pcmData.length);
    let maxFloat = 0;
    let maxInt = 0;
    for (let i = 0; i < pcmData.length; i++) {
      // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
      const floatVal = pcmData[i];
      const absFloat = Math.abs(floatVal);
      if (absFloat > maxFloat) maxFloat = absFloat;
      
      int16Data[i] = Math.max(-32768, Math.min(32767, Math.round(floatVal * 32767)));
      const absInt = Math.abs(int16Data[i]);
      if (absInt > maxInt) maxInt = absInt;
    }
    
    console.log(`[WAVWriter] Writing ${pcmData.length} samples: max float=${maxFloat.toFixed(4)}, max int16=${maxInt}`);
    
    const buffer = Buffer.from(int16Data.buffer);
    this.fileStream.write(buffer);
    this.dataSize += buffer.length;
  }

  /**
   * Finalize the WAV file by closing the stream and updating headers
   * Returns a Promise that resolves when the file is fully written and ready
   */
  async finalize() {
    if (this.isFinalized) {
      console.log(`[WAVWriter] Already finalized: ${this.filePath}`);
      return this.filePath;
    }

    if (!this.fileStream) {
      throw new Error('File stream is not initialized');
    }

    console.log(`[WAVWriter] Starting finalize for: ${this.filePath}`);
    console.log(`[WAVWriter] Data size: ${this.dataSize} bytes`);

    // Close the write stream and wait for it to finish
    await this._closeStream();

    // Update headers after stream is fully closed
    await this._updateHeaders();

    this.isFinalized = true;
    this.fileStream = null;

    console.log(`[WAVWriter] Finalize complete: ${this.filePath}`);
    
    return this.filePath;
  }

  /**
   * Close the write stream and wait for it to finish
   * @returns {Promise<void>}
   */
  _closeStream() {
    return new Promise((resolve, reject) => {
      if (!this.fileStream) {
        resolve();
        return;
      }

      // Listen for finish event
      this.fileStream.once('finish', () => {
        console.log(`[WAVWriter] Write stream finished: ${this.filePath}`);
        resolve();
      });

      // Listen for error event
      this.fileStream.once('error', (error) => {
        console.error(`[WAVWriter] Write stream error: ${error.message}`);
        reject(error);
      });

      // End the stream
      this.fileStream.end();
    });
  }

  /**
   * Update WAV headers with correct sizes
   * Uses a single file descriptor for all operations
   * @returns {Promise<void>}
   */
  async _updateHeaders() {
    const fileSize = 36 + this.dataSize;
    const headerBuffer = Buffer.alloc(8);
    let fd = null;

    try {
      // Open file for reading and writing
      fd = await openAsync(this.filePath, 'r+');
      console.log(`[WAVWriter] Opened file descriptor for header update: ${this.filePath}`);

      // Update RIFF chunk size at offset 4 (4 bytes)
      headerBuffer.writeUInt32LE(fileSize, 0);
      await writeAsync(fd, headerBuffer, 0, 4, 4);
      console.log(`[WAVWriter] Updated RIFF chunk size: ${fileSize} bytes`);

      // Update data chunk size at offset 40 (4 bytes)
      headerBuffer.writeUInt32LE(this.dataSize, 0);
      await writeAsync(fd, headerBuffer, 0, 4, 40);
      console.log(`[WAVWriter] Updated data chunk size: ${this.dataSize} bytes`);

    } catch (error) {
      console.error(`[WAVWriter] Header update error: ${error.message}`);
      throw error;
    } finally {
      // Always close the file descriptor
      if (fd !== null) {
        try {
          await closeAsync(fd);
          console.log(`[WAVWriter] Closed file descriptor: ${this.filePath}`);
        } catch (closeError) {
          console.error(`[WAVWriter] Error closing file descriptor: ${closeError.message}`);
        }
      }
    }
  }

  /**
   * Close the file stream (for error cleanup)
   */
  close() {
    if (this.fileStream && !this.isFinalized) {
      console.log(`[WAVWriter] Closing stream (cleanup): ${this.filePath}`);
      this.fileStream.end();
      this.fileStream = null;
    }
  }

  /**
   * Get file statistics (useful for debugging)
   */
  getStats() {
    return {
      filePath: this.filePath,
      dataSize: this.dataSize,
      isFinalized: this.isFinalized,
      sampleRate: this.sampleRate,
      channels: this.channels
    };
  }
}

module.exports = WAVWriter;
