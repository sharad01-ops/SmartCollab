const express = require('express');
const http = require('http')
const {SFUConnectionHandler}=require('./SFUConnectionHandler')
require("dotenv").config()
const dgram=require('dgram')
const UserPipeline=require("./Pipeline")
const fs=fs
const PORT=process.env.PORT
const SFU_URL=process.env.SFU_URL

const app = express();
const server = http.createServer(app);
const socket=dgram.createSocket('udp4')
const audioWebSocketHandler=require('./services/audio/audioWebSocketHandler')
const LiveAudioService = require('./services/liveAudioService');
const {writeChunksToWav}=require('./PipelineTest/PipellineTest');
const { default: chalk } = require('chalk');


SFUConnectionHandler.connect({
                                SFU_URL:SFU_URL, 
                                HandleRoomClose, 
                                CreateChunkStoreRoom,
                                ConvertChunksToWav
                              })


const Pipelines=new Map()

const liveAudioService = new LiveAudioService({
  bufferDuration: 8000, // 8 seconds
  maxConcurrent: 2,
  modelPath: 'whisper/models/ggml-base.en.bin'
});

socket.on('message', (msg)=>{
  const ssrc=msg.readUint32BE(8);
  const sequenceNumber = msg.readUInt16BE(2);
  
  const PacketInfo=SFUConnectionHandler.PacketInfo.get(ssrc)
  if(!PacketInfo) return

  let pipeline=Pipelines.get(ssrc)
  if(!pipeline){
    pipeline=new UserPipeline()
    Pipelines.set(ssrc, pipeline)
  }

  pipeline.handleRtpPacket(msg, sequenceNumber)
  
})


socket.bind(PORT)



setInterval(() => {
  for (const [ssrc, pipeline] of Pipelines) {
    pipeline.process(10); // limit work per tick
    const PacketInfo=SFUConnectionHandler.PacketInfo.get(ssrc)
    if(!PacketInfo) return

    const {roomId, UserId, UserName}=PacketInfo
    const TimeStamp=Date.now()
    const chunk = pipeline.getChunkIfReady();

    const AllRoomChunks=AllChunks_Roomwise.get(roomId)
    if (chunk) {

      if(AllRoomChunks){
        AllRoomChunks.push(chunk)
      }

      liveAudioService.handleAudioChunk(
        roomId,
        UserId,
        chunk,
        TimeStamp
      );
    }
  }
}, 10);// call every 10ms


function HandleRoomClose(roomId){
  liveAudioService.handleRoomEnded(roomId)
  //const transcripts=open transcripts.json
  //if(transcripts.participants.length==1){
  //delete transcripts.json
//}
  console.log(chalk.green("Room Closed. Transcriber Closed also"))
}



//Contains Code necesary for Pipeline Test only
//====================================================================
const AllChunks_Roomwise=new Map()

function CreateChunkStoreRoom(roomId){
  AllChunks_Roomwise.set(roomId, [])
}

function ConvertChunksToWav(){
  for(const [roomId, AllChunks] of AllChunks_Roomwise){
    writeChunksToWav(AllChunks, `Room${roomId}_Audio.wav`, 16000);
  }
}

//===================================================================


// // Health check with audio service stats
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     timestamp: new Date().toISOString(),
//     service: 'SmartCollab Backend',
//     stats: {
//       users: users.length,
//       rooms: rooms.length,
//       tasks: tasks.length,
//       messages: chatMessages.length
//     },
//     audioService: audioWebSocketHandler.getAudioServiceStats(),
//     liveAudioService: liveAudioService.getStats()
//   });
// });


server.listen(PORT, () => {
  console.log(`🚀 SmartCollab Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log('🎙️ Audio processing service: READY');
});