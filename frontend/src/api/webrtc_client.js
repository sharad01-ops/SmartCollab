import { Device } from "mediasoup-client"
import { socketio_client } from "./socketio_client"
import { Socket } from "socket.io-client"
import chalk from "chalk"



class WebRTCAPI{

    device=null

    //producer objects of your own producers
    producers=new Map()
    //consumer objects of your own consumers
    consumers=new Map()

    //Video+Aduio+Screen Share streams ONLY FROM THIS CLIENT are stored in this map.
    LocalStreams=new Map()
    //Video Streams(including screen share streams) ONLY FROM OTHER CLIENTS are stored in this map.
    RemoteVideoStreams=new Map()
    //Audio streams ONLY FROM OTHER CLIENTS are stored in this map.
    RemoteAudioStreams=new Map()

    //Setters for setting new streams in the video call ui
    setLocalStreams=null
    setVideoStreams=null
    setAudioStreams=null
    setScreenShareToggle=null

    //Stores tracks from video and audio streams.
    Local_Tracks={"video":null, "audio":null}

    //producerids taken from SFU server which the SFU server assigns to
    //server side producers for THIS CLIENT.
    own_producerids=new Map()
    
    //rtpCapabilities of server side mediasoup router, 
    // all the clients in the room are connected to 
    router_rtpCapabilities=null

    //references to send and recieve Transports for THIS CLIENT.
    sendTransport=null
    recieveTransport=null

    //community and channel id for the current channel of the
    //community, this video call is being held in.
    community_id=null
    channel_id=null
    userid=null
    username=null


    connect=(commid, channelid, userid, username, setLocalStreams, setVideoStreams, setAudioStreams, setScreenShareToggle)=>{
        console.log("CALL STARTED");
        console.log("Connecting to room:", commid, channelid);
        
        this.community_id=commid
        this.channel_id=channelid
        this.userid=userid
        this.username=username
        this.setLocalStreams=setLocalStreams
        this.setVideoStreams=setVideoStreams
        this.setAudioStreams=setAudioStreams
        this.setScreenShareToggle=setScreenShareToggle
        
        socketio_client.connect()

        socketio_client.on("getRtpCapabilities", this.get_rtpCapabilities)
        socketio_client.on("createTransports", this.create_Transports)
    }

    disconnect=()=>{
        //closing all producers, consumers and transports opened during video call.
        for(const producer of this.producers.values()){
            producer.close()
        }
        for(const consumer of this.consumers.values()){
            consumer.consumer.close()
        }
        if(this.sendTransport){
            this.sendTransport.close()
        }
        if(this.recieveTransport){
            this.recieveTransport.close()
        }

        for (const stream of this.LocalStreams.values()) {
            stream.getTracks().forEach(track => track.stop())
        }

        //resetting the value of all properties used. 
        this.device=null

        this.producers=new Map()
        this.consumers=new Map()

        this.LocalStreams=new Map()
        this.RemoteVideoStreams=new Map()
        this.RemoteAudioStreams=new Map()

        this.setLocalStreams=null
        this.setVideoStreams=null
        this.setAudioStreams=null

        this.Local_Tracks={"video":null, "audio":null}

        this.own_producerids=new Map()

        this.router_rtpCapabilities=null
        this.sendTransport=null
        this.recieveTransport=null
        this.community_id=null
        this.channel_id=null

        //disconnecting the socketio connection
        socketio_client.disconnect()
    }

    get_rtpCapabilities=async (capabilities)=>{
        this.router_rtpCapabilities=capabilities

        console.log(chalk.yellow("recieved rtpCapabilities: "),capabilities)
        try{
            const device_rtpcap=await this.create_device(capabilities)
            console.log(chalk.green("device rtpCapabilities created: "),device_rtpcap)

            console.log("Emitting createWebRtcTransport...");
            socketio_client.emit("createWebRtcTransport", {communityId:this.community_id, channelId:this.channel_id, rtpCapabilities:device_rtpcap})

        }catch(e){
            console.error("Error in get_rtpCapabilities:", e)
            if (e.name === 'UnsupportedError'){
                console.warn('browser not supported')
            }
        }
    }

    getLocalStream =async (stream_config)=>{
        let err=null
        const stream=await navigator.mediaDevices.getUserMedia(stream_config)
        .then((stream)=>{
            return stream
        }).catch((error)=>{
            console.error(error)
            err=error
            return null
        })

        if(!stream){
            throw new Error(err)
        }

        return stream
    }


    getScreenDisplayStream=async (stream_config)=>{
        let err=null
        const stream=await navigator.mediaDevices.getDisplayMedia(stream_config)
        .then((stream)=>{
            return stream
        }).catch((error)=>{
            console.error(error)
            err=error
            return null
        })

        if(!stream){
            throw new Error(err)
        }

        return stream
    }


    create_device=async (routerRtpCapabilities)=>{
        if(this.device){ 
            return this.device
        }
        try{
            this.device=new Device()
            // get routerRtpCapabilities from the sfu server after creating a router
            await this.device.load({routerRtpCapabilities})
        
            if (!this.device.canProduce('video')) {
                console.warn('cannot produce video');
                // Abort next steps.
            }

            if (!this.device.canProduce('audio')){
                console.warn('cannot produce audio');
            }

            return this.device.recvRtpCapabilities
            //get id, iceParameters, iceCandidates, dtlsParameters, sctpParameters
            //from sfu server
            // const sendTransport=device.createRecvTransport({
            //     id,
            //     iceParameters,
            //     iceCandidates,
            //     dtlsParameters,
            //     sctpParameters,
            // })
            
        }catch(e){
            throw e
        }
    }

    create_SendTransport=(transportParams)=>{
        try{
            const sendTransport=this.device.createSendTransport(transportParams)
            return sendTransport
        }catch(e){
            throw e
        }
    }

    create_RecvTransport=(transportParams)=>{
        try{
            const recvTransport=this.device.createRecvTransport(transportParams)
            return recvTransport
        }catch(e){
            throw e
        }
    }
    
    create_Transports=async (transportParams)=>{
        const {sendTransportParams, recvTransportParams}=transportParams

        try{
            this.sendTransport=this.create_SendTransport(sendTransportParams)
            this.recieveTransport=this.create_RecvTransport(recvTransportParams)
            console.log("TRANSPORT CREATED");


            this.sendTransport.on("connect", ({dtlsParameters}, callback, errback )=>{
                socketio_client.emit("connectSendTransport", 
                    {dtlsParameters}, 
                    (response)=>{
                        console.log(chalk.magenta("Calling SendTransport Callback"))
                        if (response?.error) {
                            errback(response.error);
                        } else {
                            callback();
                        }
                    })
            })
            this.sendTransport.on("connectionstatechange", (state) => {
                console.log(chalk.magenta("Send transport state:"), state);
            });

            this.recieveTransport.on("connect", ({dtlsParameters}, callback, errback )=>{

                socketio_client.emit("connectRecvTransport", 
                    {dtlsParameters}, 
                    (response)=>{
                        console.log(chalk.blue("Calling RecieveTransport Callback"))
                        if (response?.error) {
                            errback(response.error);
                        } else {
                            callback();
                        }
                    })
            })

            this.recieveTransport.on("connectionstatechange", (state) => {
                console.log(chalk.magenta("Recieve transport state:"), state);
            });

            this.sendTransport.on("produce", (parameters, callback, errback)=>{
                socketio_client.emit("createProducer", 
                    {
                        kind          : parameters.kind,
                        rtpParameters : parameters.rtpParameters,
                        appData       : parameters.appData
                    },
                    (response)=>{
                        console.log(chalk.magenta("Calling transport-produce Callback"))
                        if (response?.error || !response?.producerid) {
                            errback(response.error);
                        } else {
                            if(parameters.appData?.type){
                                this.own_producerids.set(parameters.appData.type, response.producerid)
                            }else{
                                this.own_producerids.set(`${this.own_producerids.size}`, response.producerid)
                            }
                            callback({id:response.producerid});
                        }
                    }
                )
            })


            socketio_client.on("producerCreated", (props)=>{
                let own_producer_id=props.own_producer_id
                let own_ProdIds=[...this.own_producerids.values()]
                if(own_producer_id){
                    if(!own_ProdIds.includes(own_producer_id)){
                        own_ProdIds=[...own_ProdIds, own_producer_id]
                        console.log(chalk.blue("own producerid included"))
                    }
                }
                socketio_client.emit("createConsumers", {},
                            async (response)=>{
                                const {consumers_props}=response
                                
                                const streams=[]
                                for(const props of consumers_props){
                                    const {consumerid, producerid, kind, rtpParameters}=props
                                    const consumer = await this.recieveTransport.consume(
                                        {
                                            id            : consumerid,
                                            producerId    : producerid,
                                            kind          : kind,
                                            rtpParameters : rtpParameters
                                        });
                                    this.consumers.set(producerid, {"consumer":consumer,"consumer_id":consumerid})
                                    const stream=new MediaStream()
                                    stream.addTrack(consumer.track)
                                    streams.push(stream)
                                    if(kind=="video"){
                                        this.RemoteVideoStreams.set(producerid, stream)
                                    }
                                    if(kind=="audio"){
                                        this.RemoteAudioStreams.set(producerid, stream)
                                    }
                                }
                                
                                this.setVideoStreams([...this.RemoteVideoStreams.values()]) 
                                this.setAudioStreams([...this.RemoteAudioStreams.values()])

                            }
                )
            })

            // io.in(roomid).emit("closeConsumers",{producerIds: peer.producerIds})
            socketio_client.on("closeConsumers", (props)=>{
                const {producerIds}=props

                for(const producer_id of producerIds){
                    const consumer=this.consumers.get(producer_id)
                    if(consumer?.consumer){
                        consumer.consumer.close()
                        this.consumers.delete(producer_id)
                        this.RemoteVideoStreams.delete(producer_id)
                        this.RemoteAudioStreams.delete(producer_id)
                    }
                }

                this.setVideoStreams([...this.RemoteVideoStreams.values()]) 
                this.setAudioStreams([...this.RemoteAudioStreams.values()])

            })

            
            await this.create_VideoAudio_Producers()
            

        }catch(e){
            console.error(e)
            throw new Error("Creating Transports Failed, reason:", e)
        }
    }

    create_VideoAudio_Producers=async ()=>{
        const stream=await this.getLocalStream(
            {
                audio: true,
                video:{
                    width:{
                        min: 640,
                        max: 1920
                    },
                    height: {
                        min: 400,
                        max:1080
                    }
                }
            }
        )

        this.LocalStreams.set("videoCall",stream)
        this.setLocalStreams([...this.LocalStreams])

        const videoTrack=stream.getVideoTracks()[0]
        const audioTrack=stream.getAudioTracks()[0]

        const video_producer=await this.sendTransport.produce({
            track       : videoTrack,
            encodings   :
                [
                    { maxBitrate: 100000 },
                    { maxBitrate: 300000 },
                    { maxBitrate: 900000 }
                ],
            codecOptions :
                {
                    videoGoogleStartBitrate : 1000
                },
            appData: {type:"cam_feed",userId:this.userid, userName:this.username}
        })

        const audio_producer=await this.sendTransport.produce({
            track       : audioTrack,
            appData: {type:"mic_feed",userId:this.userid, userName:this.username}
        })

        this.Local_Tracks.video=videoTrack
        this.Local_Tracks.audio=audioTrack

        this.producers.set("cam_feed", video_producer)
        this.producers.set("mic_feed", audio_producer)
    }


    create_ScreenShare_Producer=async ()=>{
        const stream=await this.getScreenDisplayStream(
            {
                video:true
            }
        )

        this.LocalStreams.set("screenShare",stream)
        this.setLocalStreams([...this.LocalStreams])

        const videoTrack=stream.getVideoTracks()[0]

        const video_producer=await this.sendTransport.produce({
            track       : videoTrack,
            encodings   :
                [
                    { maxBitrate: 100000 },
                    { maxBitrate: 300000 },
                    { maxBitrate: 900000 }
                ],
            codecOptions :
                {
                    videoGoogleStartBitrate : 1000
                },
            appData: {type: "ScreenCaptureFeed", userId:this.userid, userName:this.username}
        })
        
        videoTrack.onended=()=>{
            this.ToggleScreenShare(false)
            this.setScreenShareToggle(false)
        }

        this.producers.set("screen_capture", video_producer)
    }



    ToggleVideo=async (isOn)=>{
        if(this.Local_Tracks.video){
            this.Local_Tracks.video.enabled=isOn
        }
        const videoProducer=this.producers.get("cam_feed")
        if(!isOn && videoProducer){
            await videoProducer.pause()

            socketio_client.emit("ToggleVideoProducer", {
                producerId:this.own_producerids.get("cam_feed"),
                isOn:false
            })

            console.log(chalk.green("Camera Off"))

        }else if(isOn && videoProducer){
            await videoProducer.resume()

            socketio_client.emit("ToggleVideoProducer", {
                producerId:this.own_producerids.get("cam_feed"),
                isOn:true
            })

            console.log(chalk.green("Camera On"))

        }
    }

    ToggleAudio=async (isOn)=>{
        if(this.Local_Tracks.audio){
            this.Local_Tracks.audio.enabled=isOn
        }
        
        const audioProducer=this.producers.get("mic_feed")
        if(!isOn && audioProducer){
            await audioProducer.pause()

            socketio_client.emit("ToggleAudioProducer", {
                producerId:this.own_producerids.get("mic_feed"),
                isOn:false
            })

            console.log(chalk.green("Mic Paused"))

        }else if(isOn && audioProducer){
            await audioProducer.resume()

            socketio_client.emit("ToggleAudioProducer", {
                producerId:this.own_producerids.get("mic_feed"),
                isOn:true
            })

            console.log(chalk.green("Mic Resumed"))

        }
    }

    async ToggleScreenShare(isStarted){
        if(isStarted===true){
            await this.create_ScreenShare_Producer()
        }else if(isStarted===false){

            const screenShare_producer=this.producers.get("screen_capture")
            if(screenShare_producer){
                screenShare_producer.close()
            }

            const screenShare_stream=this.LocalStreams.get("screenShare")
            if(screenShare_stream){
                screenShare_stream.getTracks().forEach(track => track.stop())
            }

            const screenShare_producerId=this.own_producerids.get("ScreenCaptureFeed")
            if(screenShare_producerId){
                socketio_client.emit("closeScreenShareConsumers", 
                    {producerid:screenShare_producerId},
                    (response)=>{
                        if(response.success===true){
                            this.own_producerids.delete("ScreenCaptureFeed")
                            this.producers.delete("screen_capture")
                            this.LocalStreams.delete("screenShare")
                            this.setLocalStreams([...this.LocalStreams])
                        }
                    })
            }else{
                throw new Error("screenShare_producerId not present in own_producerids")
            }

        }
    }

}


export const webrtc_client=new WebRTCAPI()