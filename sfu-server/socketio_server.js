const chalk=require("chalk")
const webrtc_funcs=require("./webrtc_functions")
const Rooms=new Map()

function initialize_socketio_Server(allowed_origins, server){
    const io=require("socket.io")(server, {
        cors:{
            origin: allowed_origins
        }
    })

    io.on('connection', (socket) => {
        console.log(chalk.green(`client ${socket.id} connected to sfu`))
        socket.emit("get_peerid",socket.id)

        socket.on('disconnect', (reason) => {
            console.log(chalk.red(`${socket.id} disconnected because: ${reason}`));
            
        });
        socket.on("custom-event", (props)=>{
            console.log(chalk.yellow(`recieved from client:`),props)
        })

        socket.on("join_room", async (props)=>{
            const {communityId, channelId}=props
            console.log("room_join params: ", props)
            const {router, worker, WebRTCServer, peers}=await getOrCreateRoom(communityId, channelId)
            socket.join(`${communityId}${channelId}`)
            peers.set(socket.id, {socket: socket})
            // console.log(router.rtpCapabilities)
            socket.emit("getRtpCapabilities", router.rtpCapabilities)
        })

        socket.on("createWebRtcTransport", async (props)=>{
            const {communityId, channelId}=props
            const {router, worker, WebRTCServer, peers}=await getOrCreateRoom(communityId, channelId)
            // console.log(router, worker, WebRTCServer)
            const transport=await webrtc_funcs.createWebRtcTransport(router, WebRTCServer, socket.id)
            socket.emit("createSendTransport", {
                id             : transport.id,
                iceParameters  : transport.iceParameters ,
                iceCandidates  : transport.iceCandidates ,
                dtlsParameters : transport.dtlsParameters,
                sctpParameters : transport.sctpParameters
            })

            socket.on("transport-produce", async (props, callback)=>{
                const {
                    kind,
                    rtpParameters,
                    appData       
                }=props

                try{
                    const producer=await transport.produce(
                        {
                            kind: kind,
                            rtpParameters: rtpParameters
                        }
                    )
                    let peerInfo=peers.get(socket.id)
                    if(!peerInfo.producerIds || Array.isArray(peerInfo.producerIds)){
                        peerInfo.producerIds=[producer.id]
                    }else{
                        peerInfo.producerIds.push(producer.id)
                    }
                    peers.set(socket.id, peerInfo)
                    
                    callback({success: true, producerid:producer.id})

                    socket.broadcast.to(`${communityId}${channelId}`).emit("createConsumer",{yup:"yup"})
                    const ProducerIdsforRoom=getRoomProducerIds(communityId, channelId, socket.id)
                    if(ProducerIdsforRoom.length>0){
                        socket.emit("createConsumer",{yup:"yup"})
                    }
                }catch(e){
                    console.log(e)
                }

            })

            transport.on("icestatechange", state => {
                console.log("SERVER ICE:", state);
            });

            transport.on("dtlsstatechange", state => {
                console.log("SERVER DTLS:", state);
            });

            socket.on("connectSendTransport",async (props, callback)=>{
                await transport.connect({dtlsParameters:props.dtlsParameters})
                callback({success: true})
                console.log(chalk.magenta("connected sendTransport"))
            })


        })

        socket.on("createWebRtcTransport-recv", async (props)=>{
            const {communityId, channelId, rtpCapabilities}=props
            const {router, worker, WebRTCServer}=await getOrCreateRoom(communityId, channelId)

            // socket.on("getDeviceRtpCapabilities", (rtpCapabilities)=>{
            
            // })
            
            const recvTransport=await webrtc_funcs.createWebRtcTransport(router, WebRTCServer, socket.id)

            recvTransport.on("icestatechange", state => {
                console.log("SERVER RECV ICE:", state);
            });

            recvTransport.on("dtlsstatechange", state => {
                console.log("SERVER RECV DTLS:", state);
            });

            socket.emit("createRecvTransport", {
                id             : recvTransport.id,
                iceParameters  : recvTransport.iceParameters ,
                iceCandidates  : recvTransport.iceCandidates ,
                dtlsParameters : recvTransport.dtlsParameters,
                sctpParameters : recvTransport.sctpParameters
            })

            const producerIds=getRoomProducerIds(communityId, channelId, socket.id)
            const consumers=[]
            for(const producerid of producerIds){
                if(router.canConsume({
                    producerId:producerid,
                    rtpCapabilities:rtpCapabilities
                })){
                    const consumer=await recvTransport.consume({
                                        producerId:producerid,
                                        rtpCapabilities:rtpCapabilities
                                    });
                    consumers.push({
                        consumerid: consumer.id,
                        producerid: producerid,
                        kind: consumer.kind,
                        rtpParameters: consumer.rtpParameters
                    })
                    console.log(chalk.magenta("Consumer Created"))
                }
            }

            socket.emit("getConsumers", consumers)

            socket.on("connectRecvTransport",async (props, callback)=>{
                await recvTransport.connect({dtlsParameters:props.dtlsParameters})
                callback({success: true})
                console.log(chalk.magenta("connected RecvTransport"))
            })

        })

        
    });
}


async function getOrCreateRoom(communityid, channelid){
    let room=Rooms.get(`${communityid}${channelid}`)
    if(room) return room

    const {router, worker, WebRTCServer}=await webrtc_funcs.create_router()
    const peers=new Map()
    Rooms.set(`${communityid}${channelid}`, {router, worker, WebRTCServer, peers})
    return {router, worker, WebRTCServer, peers}

}

function getRoomProducerIds(communityid, channelid, ownPeerId){
    let room=Rooms.get(`${communityid}${channelid}`)
    if(!room) throw new Error("Trying to consume in a room that doesnt exist")
    const ProducerIds=[]
    for(const [peerId, peer] of room.peers){
        if(peerId!=ownPeerId){
            for(const producerId of peer.producerIds){
                ProducerIds.push(producerId)
            }
        }
    }

    return ProducerIds
}


module.exports={initialize_socketio_Server}