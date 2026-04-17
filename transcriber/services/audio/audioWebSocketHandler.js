const AudioProcessingService = require('./audioProcessingService.js');
const AudioTransformer = require('./audioTransformer.js');

class AudioWebSocketHandler {
  constructor() {
    this.audioService = new AudioProcessingService();
    this.transformers = new Map();
  }

  // handleConnection(socket, io) {
  //   console.log('Audio WebSocket connected:', socket.id);

  //   socket.on('join-room-audio', (roomId, userId, userName) => {
  //     console.log('User joining audio room:', userId, 'in', roomId);
      
  //     // Initialize audio processing for room if not already
  //     this._initializeRoom(roomId);
      
  //     // Handle user join
  //     this.audioService.handleUserJoined(roomId, userId, userName);
      
  //     // Create transformer for this user
  //     this._createTransformer(roomId, userId);
      
  //     // Notify other users
  //     socket.to(roomId).emit('user-joined-audio', { userId, userName, roomId });
  //   });

  //   // socket.on('leave-room-audio', (roomId, userId) => {
  //   //   console.log('User leaving audio room:', userId, 'in', roomId);
      
  //   //   // Handle user leave
  //   //   this.audioService.handleUserLeft(roomId, userId);
      
  //   //   // Cleanup transformer
  //   //   this._cleanupTransformer(roomId, userId);
      
  //   //   // Notify other users
  //   //   socket.to(roomId).emit('user-left-audio', { userId, roomId });
  //   // });

  //   socket.on('audio-chunk', (roomId, userId, audioChunk) => {
  //     try {
  //       // Process audio chunk
  //       this._processAudioChunk(roomId, userId, audioChunk);
  //     } catch (error) {
  //       console.error('Error processing audio chunk:', error.message);
  //     }
  //   });

  //   // socket.on('call-ended', (roomId) => {
  //   //   console.log('Call ended in room:', roomId);
      
  //   //   // Finalize room processing
  //   //   this.audioService.handleCallEnd(roomId)
  //   //     .then(summary => {
  //   //       if (summary) {
  //   //         // io.to(roomId).emit('meeting-summary-ready', summary);
  //   //         console.log('Meeting summary sent to room:', roomId);
  //   //       }
  //   //     })
  //   //     .catch(error => {
  //   //       console.error('Error finalizing call:', error.message);
  //   //     });
  //   // });

  //   // socket.on('disconnect', () => {
  //   //   console.log('Audio WebSocket disconnected:', socket.id);
  //   //   // Cleanup any associated resources
  //   //   // (This would require tracking which rooms the socket was in)
  //   // });

  //   // socket.on('error', (error) => {
  //   //   console.error('Audio WebSocket error:', error);
  //   // });
  // }


  OnNewUserJoined(roomId, userId, userName){
    console.log('User joining audio room:', userId, 'in', roomId);
      
    // Initialize audio processing for room if not already
    this._initializeRoom(roomId, {UserId:userId, UserName:userName});
    
    // Handle user join
    this.audioService.handleUserJoined(roomId, userId, userName);
    
    // Create transformer for this user
    this._createTransformer(roomId, userId);
    
  }




  _initializeRoom(roomId, user_props) {
    // Get participants from existing room data
    // This would need to be implemented based on your existing room management
    // For now, we'll assume participants are available from socket.io rooms
    const {UserId, UserName}=user_props
    const participants=[{userId:UserId, name:UserName, avatar:null}]

    this.audioService.initializeAudioProcessing(roomId, participants);
  }

  _createTransformer(roomId, userId) {
    const transformer = new AudioTransformer(16000, 1);
    this.transformers.set(`${roomId}-${userId}`, transformer);
    
    // transformer.on('data', (transformedAudio) => {
    //   // Send transformed audio to other users in the room
    //   this._broadcastAudio(roomId, userId, transformedAudio);
    // });
  }

  _cleanupTransformer(roomId, userId) {
    const key = `${roomId}-${userId}`;
    const transformer = this.transformers.get(key);
    if (transformer) {
      transformer.destroy();
      this.transformers.delete(key);
    }
  }

  _processAudioChunk(roomId, userId, audioChunk) {
    const key = `${roomId}-${userId}`;
    const transformer = this.transformers.get(key);
    
    if (transformer) {
      // Process through transformer
      transformer.write(audioChunk);
      
      // Also send to audio processing service
      console.log("handleAudioChunk")
      this.audioService.handleAudioChunk(userId, roomId, audioChunk);
    }
  }

  // _broadcastAudio(roomId, fromUserId, audioData) {
  //   // Broadcast to all users in the room except the sender
  //   globalThis.io.to(roomId).emit('remote-audio', {
  //     fromUserId,
  //     audioData: Array.from(audioData),
  //     timestamp: Date.now()
  //   });
  // }

  getAudioServiceStats() {
    return this.audioService.getQueueStats();
  }


  handleCallEnd(){
    console.log('Call ended in room:', roomId);
      
    // Finalize room processing
    this.audioService.handleCallEnd(roomId)
      .then(summary => {
        if (summary) {
          // io.to(roomId).emit('meeting-summary-ready', summary);
          console.log('Meeting summary sent to room:', roomId);
        }
      })
      .catch(error => {
        console.error('Error finalizing call:', error.message);
      });
  }

}

module.exports = new AudioWebSocketHandler();