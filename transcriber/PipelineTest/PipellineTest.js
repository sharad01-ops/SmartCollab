const fs = require('fs');
const wav = require('wav');
const path=require('path')

function writeChunksToWav(chunks, filePath, sampleRate = 48000) {
  // Create a writable stream
  const fileWriter = new wav.FileWriter(`./PipelineTest/Output/${filePath}`, {
    channels: 1,            // mono
    sampleRate: sampleRate, // Hz
    bitDepth: 16
  });

  for (const chunk of chunks) {
    fileWriter.write(Buffer.from(chunk.buffer));
  }

  fileWriter.end();
}

module.exports={writeChunksToWav}