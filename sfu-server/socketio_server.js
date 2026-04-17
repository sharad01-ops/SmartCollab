const chalk=require("chalk")
const webrtc_funcs=require("./webrtc_functions")
const TranscriberConnectionHandler=require("./transcriberConnectionHandler")

const Rooms=new Map()


function initialize_socketio_Server(allowed_origins, server){
    const io=require("socket.io")(server, {
        cors:{
            origin: "*"
        }
    })

    io.on('connection', (socket) => {
        console.log(chalk.green(`client ${socket.id} connected to sfu`))
        socket.emit("get_peerid",socket.id)

        socket.on('disconnect', (reason) => {
            console.log(chalk.red(`client ${socket.id} disconnected because: ${reason}`));
        })

        socket.on('disconnecting', () => {
            const joined_rooms=Array.from(socket.rooms).filter(
                                    (item) => item !== socket.id
                                );
            for(const roomid of joined_rooms){
                const room=Rooms.get(roomid)
                if(room){
                    const {peers, producers, consumers}=room
                    const peer=peers.get(socket.id)
                    if(peer){
                        peer.sendTransport.close()
                        peer.recvTransport.close()
                        for(const producerId of peer.producerIds){
                            const producer=producers.get(producerId)
                            if(producer){
                                // console.log(chalk.yellow(`${socket.id}: producer with prod_id ${producerId} closed`))
                                producer.close()
                                producers.delete(producerId)
                            }
                        }
                        for(const consumerId of peer.consumerIds){
                            const consumer=consumers.get(consumerId)
                            if(consumer){
                                consumer.close()
                                consumers.delete(consumerId)
                            }
                        }
                        io.in(roomid).emit("closeConsumers",{producerIds: peer.producerIds})

                        peers.delete(socket.id)
                        if(peers.size==0){
                            Rooms.delete(roomid)
                            console.log(chalk.magenta(`deleted room ${roomid}`))
                        }
                    }
                }
            }

        });

        socket.on("custom-event", (props)=>{
            console.log(chalk.yellow(`recieved from client:`),props)
        })

        socket.on("join_room", async (props)=>{
            const {communityId, channelId}=props
            const {router, worker, WebRTCServer, peers}=await getOrCreateRoom(`${communityId}${channelId}`)
            console.log(chalk.yellow(`client ${socket.id} joined room ${communityId}${channelId}`))
            socket.join(`${communityId}${channelId}`)
            peers.set(socket.id, {socket: socket, producerIds:[], consumerIds:[], consumed_ProducerIds:new Map(), sendTransport:null, recvTransport:null} )
            // console.log(router.rtpCapabilities)
            socket.emit("getRtpCapabilities", router.rtpCapabilities)
        })

        socket.on("connect-Transcriber", async (props, callback)=>{
            console.log(chalk.green(`Transcriber client with id ${socket.id} connected`))

            TranscriberConnectionHandler.connect(socket)
            callback("connected Transport")
        })


        socket.on("createWebRtcTransport", async (props)=>{
            
            const {communityId, channelId, rtpCapabilities}=props
            const {router, WebRTCServer, peers, producers, consumers}=await getOrCreateRoom(`${communityId}${channelId}`)
            // console.log(router, worker, WebRTCServer)
            const sendTransport=await webrtc_funcs.createWebRtcTransport(router, WebRTCServer, socket.id)
            const recvTransport=await webrtc_funcs.createWebRtcTransport(router, WebRTCServer, socket.id)
            
            const peer=peers.get(socket.id)
            peer.sendTransport=sendTransport
            peer.recvTransport=recvTransport

            sendTransport.on("close", ()=>{
                console.log(chalk.red(`sendTransport for ${socket.id} closed`))
            })

            recvTransport.on("close", ()=>{
                console.log(chalk.red(`recvTransport for ${socket.id} closed`))
            })

            socket.emit("createTransports", {
                    sendTransportParams:{
                        id             : sendTransport.id,
                        iceParameters  : sendTransport.iceParameters ,
                        iceCandidates  : sendTransport.iceCandidates ,
                        dtlsParameters : sendTransport.dtlsParameters,
                        sctpParameters : sendTransport.sctpParameters
                    },
                    recvTransportParams:{
                        id             : recvTransport.id,
                        iceParameters  : recvTransport.iceParameters ,
                        iceCandidates  : recvTransport.iceCandidates ,
                        dtlsParameters : recvTransport.dtlsParameters,
                        sctpParameters : recvTransport.sctpParameters
                    }
            })


            // transport.on("icestatechange", state => {
            //     console.log("SERVER ICE:", state);
            // });

            // transport.on("dtlsstatechange", state => {
            //     console.log("SERVER DTLS:", state);
            // });

            socket.on("connectSendTransport",async (props, callback)=>{
                const {dtlsParameters}=props
                await sendTransport.connect({dtlsParameters:dtlsParameters})
                callback({success: true})
                console.log(chalk.green(`Connected sendTransport for client: ${socket.id}`))
            })

            socket.on("connectRecvTransport",async (props, callback)=>{
                const {dtlsParameters}=props
                await recvTransport.connect({dtlsParameters:dtlsParameters})
                callback({success: true})
                console.log(chalk.green(`Connected recieveTransport for client: ${socket.id}`))
            })


            socket.on("createProducer", async (props, callback)=>{
                const {
                        kind,
                        rtpParameters,
                        appData       
                    }=props
                try{
                    const producer=await sendTransport.produce(
                        {
                            kind: kind,
                            rtpParameters: rtpParameters
                        }
                    )
                    if(kind=="audio"){
                        TranscriberConnectionHandler.createConsumer(
                            router, 
                            producer.id,
                            `${communityId}${channelId}`,
                            appData.userId, 
                            appData.userName
                        )
                    }
                    console.log(chalk.blue(`${socket.id}: ${kind} Producer Created with prod_id ${producer.id}`))
                    producer.on("transportclose", ()=>{
                        console.log(chalk.yellow(`${socket.id}: producer with prod_id ${producer.id} closed`))
                    })
                    let peerInfo=peers.get(socket.id)
                    peerInfo.producerIds.push(producer.id)
                    producers.set(producer.id, producer)
                    peers.set(socket.id, peerInfo)
                
                    callback({success: true, producerid:producer.id})
                    

                    // emit to all clients in the room `${communityId}${channelId}` excluding the sender
                    socket.to(`${communityId}${channelId}`).emit("producerCreated",{producer_id: producer.id})
                    if(peers.size>1){
                        socket.emit("producerCreated",{own_producer_id: producer.id}) 
                    }
                    // console.log("---------------",socket.id,"createProducer------------------")
                    // console.log(socket.id,"Producers: ",peers.get(socket.id)?.producerIds)
                    // console.log(socket.id,"Consumers: ",peers.get(socket.id)?.consumerIds)
                    // console.log("-----------------------------------------------")
                }catch(e){
                    console.log(e)
                }
            })

            socket.on("ToggleVideoProducer",async (props)=>{
                const {producerId, isOn}=props
                const vidproducer=producers.get(producerId)
                if(isOn===true){
                    await vidproducer?.resume()
                    console.log(chalk.green("Video On"))
                }else if(isOn===false){
                    await vidproducer?.pause()
                    console.log(chalk.magenta("Video Off"))
                }

            })

            socket.on("ToggleAudioProducer",async (props)=>{
                const {producerId, isOn}=props

                const audio_producer=producers.get(producerId)
                if(isOn===true){
                    await audio_producer?.resume()
                    await TranscriberConnectionHandler.toggleConsumer(producerId, isOn)
                }else if(isOn===false){
                    await audio_producer?.pause()
                    await TranscriberConnectionHandler.toggleConsumer(producerId, isOn)
                }

            })

            socket.on("closeScreenShareConsumers", async (props, callback)=>{
                const {producerid}=props
                io.in(`${communityId}${channelId}`).emit("closeConsumers",{producerIds: [producerid]})

                const {peers, producers, consumers}=await getOrCreateRoom(`${communityId}${channelId}`)
                //peers.set(socket.id, 
                //          {socket: socket, 
                //          producerIds:[], 
                //          consumerIds:[], 
                //          consumed_ProducerIds=new Map()
                //          sendTransport:null, 
                //          recvTransport:null} )
                for(const [socketId, peer] of peers){
                    if(socketId==socket.id){
                        if (peer.producerIds.includes(producerid)) {
                            peer.producerIds.splice(peer.producerIds.indexOf(producerid), 1);
                        }
                        const producer=producers.get(producerid)
                        if(producer){
                            producer.close()
                            producers.delete(producerid)
                        }

                    }else{
                        const consumerId=peer.consumed_ProducerIds.get(producerid)
                        if(consumerId){
                            if (peer.consumerIds.includes(consumerId)) {
                                peer.consumerIds.splice(peer.consumerIds.indexOf(consumerId), 1);
                            }

                            peer.consumed_ProducerIds.delete(producerid)
                            const consumer=consumers.get(consumerId)
                            if(consumer){
                                consumer.close()
                                consumers.delete(consumerId)
                            }
                        }
                    }
                }

                callback({success:true})
            })

            socket.on("createConsumers", async (props, callback)=>{
                const ProducerIdsforRoom=getAllRoomProducerIds_ExceptSelf(`${communityId}${channelId}`, socket.id)
                // console.log(chalk.green(`for ${socket.id} producer_ids_being_consumed:`),producer_ids_being_consumed)
                // console.log(chalk.green(`for ${socket.id} producer_ids_self:`),producer_ids_self)
                let peerInfo=peers.get(socket.id)
                const consumable_producerids=ProducerIdsforRoom.filter((producerid)=>{
                                    if(![...peerInfo.consumed_ProducerIds.keys()].includes(producerid)){
                                        return true
                                    }
                                } )
                
                // console.log(chalk.green(`for ${socket.id} consumable_producerids:`),consumable_producerids)
                const consumers_props=[]
                for(const producerid of consumable_producerids){

                    if(router.canConsume({
                        producerId:producerid,
                        rtpCapabilities:rtpCapabilities
                    })){
                        const consumer=await recvTransport.consume({
                                            producerId:producerid,
                                            rtpCapabilities:rtpCapabilities
                                        });
                        consumer.on("producerclose",async ()=>{

                            const {peers, consumers}=await getOrCreateRoom(`${communityId}${channelId}`)
                            const peer=peers.get(socket.id)
                            const consumerId=consumer.id
                            if(peer){
                                if (peer.consumerIds.includes(consumerId)) {
                                    peer.consumerIds.splice(peer.consumerIds.indexOf(consumerId), 1);
                                }
                                peer.consumed_ProducerIds.delete(producerid)
                                consumers.delete(consumerId)
                                console.log(chalk.yellow(`${socket.id}: consumer for prod_id ${producerid} closed`))
                            }
                        })

                        consumer.on("transportclose",async ()=>{
                            console.log(chalk.yellow(`${socket.id}: consumer for prod_id ${producerid} closed`))
                        })
                        
                        let peerInfo=peers.get(socket.id)
                        peerInfo.consumerIds.push(consumer.id)
                        peerInfo.consumed_ProducerIds.set(producerid, consumer.id)
                        consumers.set(consumer.id, consumer)
                        peers.set(socket.id, peerInfo)

                        consumers_props.push({
                            consumerid: consumer.id,
                            producerid: producerid,
                            kind: consumer.kind,
                            rtpParameters: consumer.rtpParameters
                        })

                        console.log(chalk.cyan(`${socket.id}: ${consumer.kind} Consumer Created for prod_id ${producerid}`))
                    }
                }
                // console.log("----------------",socket.id,"createConsumers----------------")
                // console.log(socket.id,"Producers: ",peers.get(socket.id)?.producerIds)
                // console.log(socket.id,"Consumers: ",peers.get(socket.id)?.consumerIds)
                // console.log(socket.id,"Consumed Producerids: ",producer_ids_being_consumed)
                // console.log("-----------------------------------------------")
                callback({consumers_props})

            })



        })


        
    });
}


async function getOrCreateRoom(room_id){
    let room=Rooms.get(room_id)
    if(room) return room

    const {router, worker, WebRTCServer}=await webrtc_funcs.create_router()
    const peers=new Map()
    //peers.set(socket.id, 
    //          {socket: socket, 
    //          producerIds:[]=>stores producerIds of producers of this client 
    //          consumerIds:[]=>stores consumerIds of consumers of this client

    //          consumed_ProducerIds=new Map()=>Map(producerID, consumerID) 
    //          where producerId belongs to the producer of 
    //          the other client's transport and consuemrid  belongs
    //          to this client

    //          sendTransport:null, 
    //          recvTransport:null} )
    const producers=new Map()
    const consumers=new Map()
    Rooms.set(room_id, {router, worker, WebRTCServer, peers, producers, consumers})
    return {router, worker, WebRTCServer, peers, producers, consumers}

}



function getRoomProducerIds(room_id){
    let room=Rooms.get(room_id)
    if(!room) throw new Error("Trying to consume in a room that doesnt exist")
    const ProducerIds=[]
    for(const [peerId, peer] of room.peers){
        ProducerIds.push(...peer.producerIds)
    }

    return ProducerIds
}

function getAllRoomProducerIds_ExceptSelf(room_id, socketid){
    let room=Rooms.get(room_id)
    if(!room) throw new Error("Trying to consume in a room that doesnt exist")
    const ProducerIds=[]
    for(const [peerId, peer] of room.peers){
        if(peerId!=socketid){
            ProducerIds.push(...peer.producerIds)
        }
    }

    return ProducerIds
}


module.exports={initialize_socketio_Server}