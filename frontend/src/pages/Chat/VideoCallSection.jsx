import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { socketio_client } from "../../api/socketio_client"
import { useEffect, useRef } from "react"
import { webrtc_client } from "../../api/webrtc_client"
import chalk from "chalk"

const Header=()=>{
    const navigate=useNavigate()
    const url_params=useParams()
    return(
        <div className="w-full h-full flex flex-row justify-start items-center bg-gray-800 max-h-[2.5rem] ">
            <button
                className="ml-1 text-white p-1 select-none cursor-pointer rounded-full hover:bg-gray-600"
                onClick={()=>{
                    if(!url_params
                        || !url_params.communityId || !url_params.channelId
                    ) return
                    navigate(`/chats/${url_params.communityId}/${url_params.channelId}`)
                }}
            >
                <ArrowLeft className="h-[20px] w-[20px]"/>
            </button>
        </div>
    )
}


const Footer=()=>{
    return(
        <div className="w-full h-full bg-gray-800 max-h-[2.5rem] ">
            
        </div>
    )
}


const VideoPanel=()=>{
    const LocalVideoRef=useRef(null)
    const RemoteVideoRef=useRef(null)
    const url_params=useParams()
    useEffect(()=>{
        if(!socketio_client) return
        socketio_client.connect()
        console.log("mounted")
        socketio_client.on("getRtpCapabilities",LogRtpCapabilities)
        socketio_client.on("createSendTransport", LogTransportParams)

        socketio_client.on("createRecvTransport", createRecieveTransport)

        return ()=>socketio_client.disconnect()
    },[])

    const mountVideo=()=>{
        if(!LocalVideoRef.current || !webrtc_client.stream) return

        LocalVideoRef.current.srcObject=webrtc_client.stream
    }

    const mountRemoteVideo=(stream)=>{
        if(!RemoteVideoRef.current || !stream) return

        RemoteVideoRef.current.srcObject=stream
    }


    const LogRtpCapabilities=async (capabilities)=>{
        if(!webrtc_client) return

        console.log(chalk.yellow("recieved rtpCapabilities: "),capabilities)
        try{
            const device_rtpcap=await webrtc_client.create_device(capabilities)
            console.log(chalk.green("device rtpCapabilities: "),device_rtpcap)

            socketio_client.on(
                "createConsumer", 
                ()=>{
                    socketio_client.emit(
                        "createWebRtcTransport-recv", 
                        {
                            communityId     :url_params.communityId, 
                            channelId       :url_params.channelId, 
                            rtpCapabilities :device_rtpcap
                        }
                    )
                }
            )
            
            if(!socketio_client) return
            socketio_client.emit("createWebRtcTransport", {communityId:url_params.communityId, channelId:url_params.channelId})

        }catch(e){
            console.error(e)
            if (error.name === 'UnsupportedError'){
                console.warn('browser not supported')
            }
        }
    }

    const LogTransportParams=async (params)=>{

        try{

            const sendTransport=webrtc_client.create_SendTransport(params)

            sendTransport.on("connect", ({dtlsParameters}, callback, errback )=>{
                socketio_client.emit("connectSendTransport", 
                    {dtlsParameters}, 
                    (response)=>{
                        console.log(chalk.magenta("Calling Callback"))
                        if (response?.error) {
                            errback(response.error);
                        } else {
                            callback();
                        }
                    })
            })

            sendTransport.on("produce", (parameters, callback, errback)=>{
                socketio_client.emit("transport-produce", 
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
                            webrtc_client.producerids.push(response.producerid)
                            callback({id:response.producerid});
                        }
                    }
                )
            })

            sendTransport.on("connectionstatechange", (state) => {
                console.log(chalk.magenta("Send transport state:"), state);
            });

            sendTransport.on("icegatheringstatechange", state => {
                console.log(chalk.magenta("ICE gathering:"), state);
            });

            sendTransport.on("iceconnectionstatechange", (state) => {
                console.log(chalk.magenta("ICE connection state:"), state);
            });

            await webrtc_client.getLocalStream()
            mountVideo()
            const stream=webrtc_client.stream
            
            const producer=await sendTransport.produce({
                track       : stream.getVideoTracks()[0],
                encodings   :
                    [
                        { maxBitrate: 100000 },
                        { maxBitrate: 300000 },
                        { maxBitrate: 900000 }
                    ],
                codecOptions :
                    {
                        videoGoogleStartBitrate : 1000
                    }
            })

        }catch(e){
            console.error(e)
        }
    }

    const createRecieveTransport=async (params)=>{
        if(!webrtc_client || !webrtc_client.device) return
        
        try{
            const recvTransport=webrtc_client.create_RecvTransport(params)

            console.log(chalk.blue("created recieve transport"))

            recvTransport.on("connect", ({dtlsParameters}, callback, errback )=>{

                socketio_client.emit("connectRecvTransport", 
                    {dtlsParameters}, 
                    (response)=>{
                        console.log(chalk.blue("Calling Recv Callback"))
                        if (response?.error) {
                            errback(response.error);
                        } else {
                            callback();
                        }
                    })
            })


            recvTransport.on("connectionstatechange", (state) => {
                console.log(chalk.blue("Recv transport state:"), state);
            });

            // recvTransport.on("icegatheringstatechange", state => {
            //     console.log(chalk.magenta("ICE gathering:"), state);
            // });

            // recvTransport.on("iceconnectionstatechange", (state) => {
            //     console.log(chalk.magenta("ICE connection state:"), state);
            // });

            socketio_client.on("getConsumers",async (consumers)=>{
                const streams=[]
                for(const consumer_props of consumers){
                    const {consumerid, producerid, kind, rtpParameters}=consumer_props
                    const consumer = await recvTransport.consume(
                        {
                            id            : consumerid,
                            producerId    : producerid,
                            kind          : kind,
                            rtpParameters : rtpParameters
                        });
                    const stream=new MediaStream()
                    stream.addTrack(consumer.track)
                    streams.push(stream)
                }
                mountRemoteVideo(streams[0])

            })

        }catch(e){
            console.log(e)
        }

    }
    
    return(
        <div className="w-full h-full bg-amber-300 min-h-0 overflow-auto">
            <div className="flex flex-col w-fit">
                <button
                    className="bg-black text-white rounded-2xl px-3 py-1 m-1 hover:bg-gray-800"
                    onClick={()=>{
                        socketio_client.emit("join_room", {communityId:url_params.communityId, channelId:url_params.channelId})
                    }}
                >
                    connect
                </button>
                <button
                    className="bg-black text-white rounded-2xl px-3 py-1 m-1 hover:bg-gray-800"
                    onClick={()=>{
                        socketio_client.emit("custom-event", {"hi":"bye"})
                    }}
                >
                    send
                </button>
                <button
                    className="bg-black text-white rounded-2xl px-3 py-1 m-1 hover:bg-gray-800"
                    onClick={async ()=>{
                        await webrtc_client.getLocalStream();
                        mountVideo();
                    }}
                >
                    open video
                </button>
            </div>
            <div
                className="w-full flex flex-col bg-green-500 justify-center"
            >
                <video ref={LocalVideoRef} id="LocalVideo" autoPlay className="video"></video>
                <video ref={RemoteVideoRef} id="RemoteVideo" autoPlay className="video"></video>
            </div>
        </div>
    )
}


const VideoCallSection = () => {
  return (
    <div className="w-full h-full flex flex-col bg-green-500 font-[Inter] text-black">
      <Header/>
      <VideoPanel/>
      <Footer/>
    </div>
  )
}

export default VideoCallSection
