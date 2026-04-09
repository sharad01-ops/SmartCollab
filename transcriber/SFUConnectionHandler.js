const {io}=require('socket.io-client')
const chalk=require('chalk').chalkStderr
// import {io} from "socket.io-client"
// import chalk from "chalk"
const audioWebSocketHandler=require('./services/audio/audioWebSocketHandler')

class SFUConnectionHandler{
    socket=null
    //{ SSRC:{roomId, UserId, UserName},... }
    //used to identify roomid, userid, and username of the user that sent the packet
    PacketInfo=new Map()
    
    //{ roomId:{ {UserId:UserName} },... }
    //Stores DECODED, RTP packets with correct sequence in ascending order, i.e. [fisrt packet, second packet, third packet,...]
    Rooms=new Map()

    SFU_URL=null
    HandleRoomClose=null
    CreateChunkStoreRoom=null
    ConvertChunksToWav=null

    connect=({SFU_URL, HandleRoomClose, CreateChunkStoreRoom, ConvertChunksToWav})=>{
        this.socket=io(SFU_URL,{rejectUnauthorized: false})
        this.SFU_URL=SFU_URL
        this.HandleRoomClose=HandleRoomClose
        this.CreateChunkStoreRoom=CreateChunkStoreRoom
        this.ConvertChunksToWav=ConvertChunksToWav
        
        this.socket.on("connect",()=>{
            console.log(chalk.magenta("Socket Connected to SFU"))
            this.socket.emit("connect-Transcriber",{}, (response)=>{
                console.log(response)
            })
            this.socket.on("consumer-created", (props)=>{
                const {ssrc, roomId, UserId, UserName}=props
                this.PacketInfo.set(ssrc, {roomId, UserId, UserName})
                const room=this.Rooms.get(roomId)
                if(room){
                    room.set(UserId, UserName)
                    console.log(chalk.green(`Added ${UserName} to Room ${roomId}`))
                }else{
                    this.Rooms.set(roomId, new Map([ [UserId, UserName] ]))
                    if(this.CreateChunkStoreRoom){
                        this.CreateChunkStoreRoom(roomId)
                    }
                    // audioWebSocketHandler.OnNewUserJoined(roomId, UserId, UserName)
                    console.log(chalk.green(`Added ${UserName} to Room ${roomId}, Initialized Room ${roomId}`))
                }



            })

            this.socket.on("consumer-closed", (props)=>{
                const {ssrc, roomId, UserId, UserName}=props
                this.PacketInfo.delete(ssrc)
                const room=this.Rooms.get(roomId)
                if(room){
                    room.delete(UserId)
                    console.log(chalk.magenta(`Removed ${UserName} from Room ${roomId}`))
                    if(room.size==0){
                        this.Rooms.delete(roomId)
                        this.HandleRoomClose(roomId)

                        if(this.Rooms.size==0){
                            if(this.ConvertChunksToWav){
                                this.ConvertChunksToWav()
                            }
                        }
                        console.log(chalk.magenta(`Deleted Room ${roomId}`))
                    }
                }
            })

        })
        
    }
}

// export const SFUConnectionHandler = new SFUConnectionHandler()
module.exports={SFUConnectionHandler: new SFUConnectionHandler()}