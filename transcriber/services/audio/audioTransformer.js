const { Transform } = require('stream');

class AudioTransformer extends Transform {
  constructor(targetSampleRate = 16000, channels = 1) {
    super({ objectMode: true });
    this.targetSampleRate = targetSampleRate;
    this.channels = channels;
    this.sampleRate = null;
    this.buffer = [];
    this.totalSamples = 0;
  }

  _transform(audioChunk, encoding, callback) {
    try {
      // Convert to Float32Array if not already
      const audioData = new Float32Array(audioChunk);
      
      if (this.sampleRate === null) {
        // Detect sample rate from first chunk (simplified)
        this.sampleRate = 48000; // WebRTC typically provides 48kHz
        console.log('Detected sample rate:', this.sampleRate);
      }

      // Resample if needed (simplified - in production use proper resampler)
      if (this.sampleRate !== this.targetSampleRate) {
        const resampled = this._resample(audioData, this.sampleRate, this.targetSampleRate);
        this.buffer.push(resampled);
        this.totalSamples += resampled.length;
      } else {
        this.buffer.push(audioData);
        this.totalSamples += audioData.length;
      }

      // Flush buffer if it gets too large
      if (this.totalSamples > 480000) { // ~5 seconds at 16kHz
        this._flushBuffer();
      }

      callback();
    } catch (error) {
      console.error('Audio transformation error:', error.message);
      callback(error);
    }
  }

  _flushBuffer() {
    if (this.buffer.length === 0) return;

    // Combine all buffers
    const combinedLength = this.buffer.reduce((sum, buf) => sum + buf.length, 0);
    const combined = new Float32Array(combinedLength);
    let offset = 0;

    this.buffer.forEach(buf => {
      combined.set(buf, offset);
      offset += buf.length;
    });

    // Emit combined buffer
    this.push(combined);
    
    // Reset buffer
    this.buffer = [];
    this.totalSamples = 0;
  }

  _flush(callback) {
    this._flushBuffer();
    callback();
  }

  _resample(input, fromRate, toRate) {
    // Simple linear interpolation for resampling
    // Note: This is a simplified implementation for demonstration
    // Production should use proper resampling library
    const output = new Float32Array(Math.round(input.length * toRate / fromRate));
    
    for (let i = 0; i < output.length; i++) {
      const x = i * fromRate / toRate;
      const x1 = Math.floor(x);
      const x2 = Math.min(x1 + 1, input.length - 1);
      const y1 = input[x1];
      const y2 = input[x2];
      output[i] = y1 + (y2 - y1) * (x - x1);
    }
    
    return output;
  }
}

module.exports = AudioTransformer;