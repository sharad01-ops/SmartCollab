const OpusEncoder=require('@discordjs/opus').OpusEncoder


class JitterBuffer {
  constructor() {
    this.buffer = new Map(); // seq → { packet, time }
    this.expectedSeq = null;
    this.waitStart = null;
    this.maxWaitMs = 50; // tweak: 20–100ms typical
  }

  insert(packet, seq) {
    this.buffer.set(seq, {
      packet,
      time: Date.now()
    });

    if (this.expectedSeq === null) {
      this.expectedSeq = seq;
    }
  }

  getNext() {
    if (this.expectedSeq === null) return null;

    const entry = this.buffer.get(this.expectedSeq);

    if (entry) {
      // packet exists → normal case
      this.buffer.delete(this.expectedSeq);
      this.expectedSeq = (this.expectedSeq + 1) & 0xffff;
      this.waitStart = null;
      return entry.packet;
    }

    // packet missing
    if (!this.waitStart) {
      this.waitStart = Date.now();
      return null;
    }

    const waited = Date.now() - this.waitStart;


    if (waited > this.maxWaitMs) {
      // 🔥 declare packet lost
      this.expectedSeq = (this.expectedSeq + 1) & 0xffff;
      this.waitStart = null;

      return 'MISSING_PACKET';
    }

    return null;
  }
}





class RingBuffer {
  constructor(size) {
    this.buffer = new Int16Array(size); // or Int16Array
    this.size = size;

    this.readPtr = 0;
    this.writePtr = 0;
    this.length = 0; // number of samples currently stored
  }

  write(data) {
    for (let i = 0; i < data.length; i++) {
      this.buffer[this.writePtr] = data[i];
      this.writePtr = (this.writePtr + 1) % this.size;

      if (this.length < this.size) {
        this.length++;
      } else {
        // overwrite oldest → move read pointer
        this.readPtr = (this.readPtr + 1) % this.size;
      }
    }
  }

  read(numSamples) {
    if (numSamples > this.length) return null;

    const output = new Int16Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      output[i] = this.buffer[this.readPtr];
      this.readPtr = (this.readPtr + 1) % this.size;
    }

    this.length -= numSamples;

    return output;
  }

  available() {
    return this.length;
  }
}

class DownsampledChunkBuffer {
  /**
   * @param {number} inputSampleRate - Sample rate of decoded PCM (e.g., 48000)
   * @param {number} outputSampleRate - Target sample rate (e.g., 16000)
   * @param {number} chunkSize - Size of output chunks in samples (e.g., 16000 for 1 sec at 16kHz)
   */
  constructor(inputSampleRate = 48000, outputSampleRate = 16000, chunkSize = 16000) {
    this.inputSampleRate = inputSampleRate;
    this.outputSampleRate = outputSampleRate;
    this.ratio = inputSampleRate / outputSampleRate; // e.g., 3
    this.chunkSize = chunkSize;

    this.currentChunk = new Int16Array(chunkSize);
    this.currentIndex = 0;           // index inside currentChunk
    this.downsampleCounter = 0;      // tracks skipping for decimation

    this.chunks = [];                // completed downsampled chunks
  }

  write(samples) {
    // simple decimation: take every Nth sample
    for (let i = 0; i < samples.length; i++) {
      this.downsampleCounter++;
      if (this.downsampleCounter >= this.ratio) {
        // take this sample
        this.downsampleCounter = 0;
        this.currentChunk[this.currentIndex++] = samples[i];

        if (this.currentIndex === this.chunkSize) {
          // full downsampled chunk ready
          this.chunks.push(this.currentChunk);
          this.currentChunk = new Int16Array(this.chunkSize);
          this.currentIndex = 0;
        }
      }
    }
  }

  readChunk() {
    // Return first ready chunk if available
    if (this.chunks.length === 0) return null;
    return this.chunks.shift();
  }

  availableChunks() {
    return this.chunks.length;
  }
}



class DownsampledChunkBuffer_Improved {
  /**
   * @param {number} inputSampleRate - e.g., 48000
   * @param {number} outputSampleRate - e.g., 16000
   * @param {number} chunkSize - size of downsampled output chunks in samples (e.g., 16000 = 1 sec @16kHz)
   */
  constructor(inputSampleRate = 48000, outputSampleRate = 16000, chunkSize = 16000) {
    this.inputSampleRate = inputSampleRate;
    this.outputSampleRate = outputSampleRate;
    this.chunkSize = chunkSize;
    this.ratio = inputSampleRate / outputSampleRate;

    this.inputBuffer = [];
    this.chunks = [];
    this.resampleOffset = 0;
  }

  write(samples) {
    // push new samples into buffer
    this.inputBuffer.push(...samples);

    // try to downsample
    while (true) {
      const inputLength = this.inputBuffer.length - this.resampleOffset;
      const expectedOutputLength = Math.floor(inputLength / this.ratio);

      if (expectedOutputLength < 1) break; // not enough samples yet

      const output = new Int16Array(expectedOutputLength);

      for (let i = 0; i < expectedOutputLength; i++) {
        const inputIndex = this.resampleOffset + i * this.ratio;
        const idxFloor = Math.floor(inputIndex);
        const idxCeil = Math.min(idxFloor + 1, this.inputBuffer.length - 1);
        const frac = inputIndex - idxFloor;

        // linear interpolation
        output[i] = this.inputBuffer[idxFloor] * (1 - frac) + this.inputBuffer[idxCeil] * frac;
      }

      // accumulate into chunkSize
      if (!this.currentChunk) {
        this.currentChunk = new Int16Array(this.chunkSize);
        this.currentIndex = 0;
      }

      const toCopy = Math.min(output.length, this.chunkSize - this.currentIndex);
      this.currentChunk.set(output.subarray(0, toCopy), this.currentIndex);
      this.currentIndex += toCopy;

      if (this.currentIndex === this.chunkSize) {
        this.chunks.push(this.currentChunk);
        this.currentChunk = new Int16Array(this.chunkSize);
        this.currentIndex = 0;
      }

      // remove used input samples
      this.resampleOffset += toCopy * this.ratio;
      if (this.resampleOffset >= this.inputBuffer.length) {
        this.inputBuffer = [];
        this.resampleOffset = 0;
      } else {
        this.inputBuffer = this.inputBuffer.slice(Math.floor(this.resampleOffset));
        this.resampleOffset -= Math.floor(this.resampleOffset);
      }
    }
  }

  readChunk() {
    if (this.chunks.length === 0) return null;
    return this.chunks.shift();
  }

  availableChunks() {
    return this.chunks.length;
  }
}

class PCMStitcher {
  /**
   * @param {number} sampleRate - PCM sample rate, e.g., 48000
   * @param {number} chunkSize - number of samples per output chunk, e.g., 48000 = 1 sec
   */
  constructor(sampleRate = 48000, chunkSize = 48000) {
    this.sampleRate = sampleRate;
    this.chunkSize = chunkSize;

    this.buffer = [];      // array of Int16 samples
    this.chunks = [];      // completed 1-sec chunks
  }

  write(pcmFrame) {
    // pcmFrame is Int16Array from Opus decode
    this.buffer.push(...pcmFrame);//pcmFrame length 1920

    // create full 1-sec chunks
    while (this.buffer.length >= this.chunkSize) {
      const chunk = new Buffer.alloc(this.chunkSize);
      for (let i = 0; i < this.chunkSize; i++) {
        chunk[i] = this.buffer[i];
      }
      this.chunks.push(chunk);

      // remove used samples
      this.buffer = this.buffer.slice(this.chunkSize);
    }
  }

  readChunk() {
    if (this.chunks.length === 0) return null;
    return this.chunks.shift();
  }

  available() {
    return this.chunks.length;
  }
}



class UserPipeline {
    constructor(ssrc) {
        this.ssrc = ssrc;
        this.resampleOffset=0
        this.jitterBuffer = new JitterBuffer();//stores RTP packets in correct sequence, required for decoder
        this.decoder = new OpusEncoder(16000, 1);//decoder instance
        this.pcmBuffer = new PCMStitcher(16000,16000)//buffer that stores PCM packets, for 16000Hz,each PCM packet of length 640
        // this.pcmBuffer = new DownsampledChunkBuffer_Improved(48000, 16000, 16000) // creates PCM chunks for PCM packets worth 1 sec of audio
    }

    handleRtpPacket(packet, seq) {
        this.jitterBuffer.insert(packet, seq);
    }


    process(maxPackets = 10) {
        let count = 0;
        let result;

        while (count < maxPackets && (result = this.jitterBuffer.getNext()) !== null) {
            if (result === 'MISSING_PACKET') {
                const samplesPerPacket = 960;
                const pcm = new Int16Array(samplesPerPacket); // zeros
                this.pcmBuffer.write(pcm);
            } else {
                const payload = this.getRtpPayload(result);
                try{
                    const pcm = this.decoder.decode(payload);
                    // console.log(pcm.length)
                    this.pcmBuffer.write(pcm);
                }catch(e){
                    console.error(e)
                    break
                }
            }

            count++;
        }
    }

    getChunkIfReady() {
        const chunk=this.pcmBuffer.readChunk()
        return chunk

    }


    getRtpPayload(packet) {
        const firstByte = packet[0];

        const csrcCount = firstByte & 0x0f;
        const hasExtension = (firstByte & 0x10) !== 0;

        let offset = 12 + (csrcCount * 4);

        if (hasExtension) {
            const extLength = packet.readUInt16BE(offset + 2);
            offset += 4 + (extLength * 4);
        }

        return packet.slice(offset);
    }


    downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
        if (inputSampleRate === outputSampleRate) {
            return buffer;
        }
        

        const ratio = inputSampleRate / outputSampleRate;
        const outputLength = Math.floor((buffer.length - this.resampleOffset) / ratio);
        const output = new Int16Array(outputLength);

        let outputIndex = 0;

        while (outputIndex < outputLength) {
            const inputIndex = this.resampleOffset;
            const indexFloor = Math.floor(inputIndex);
            const indexCeil = Math.min(indexFloor + 1, buffer.length - 1);
            const fraction = inputIndex - indexFloor;

            const sample =
            buffer[indexFloor] * (1 - fraction) +
            buffer[indexCeil] * fraction;

            output[outputIndex++] = sample;

            this.resampleOffset += ratio;
        }

        this.resampleOffset -= buffer.length;

        return output;
    }

    downsampleBuffer_For16kHz(buffer){
        const outputLength = Math.floor(buffer.length / 3);
        const output = new Int16Array(outputLength);

        for (let i = 0, j = 0; j < outputLength; i += 3, j++) {
            output[j] = buffer[i];
        }

        return output;
    }

}

module.exports=UserPipeline