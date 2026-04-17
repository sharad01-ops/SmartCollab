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



}

module.exports=UserPipeline