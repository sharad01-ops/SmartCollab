import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Video, VideoOff, Mic, MicOff, ScreenShare, ScreenShareOff, Camera, CameraOff } from "lucide-react"
import { socketio_client } from "../../api/socketio_client"
import { useEffect, useRef, useCallback, useState, useContext } from "react"
import { webrtc_client } from "../../api/webrtc_client"
import chalk from "chalk"
import { ChatLayout_Context } from "../../contexts/ChatLayout-context-provider"

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

const LocalVideoPlayer=({streamName, stream, setScreenShareToggle, ScreenShareToggle, callback})=>{

    const [MicMuted, setMicMuted]=useState(false)
    const [CamOff, setCamOff]=useState(false)

    console.log(chalk.magenta(`${streamName}`))
    callback()
    if(!(stream instanceof MediaStream)) {
        return
    }


    useEffect(()=>{
        const muteMic=async ()=>{
            await webrtc_client.ToggleAudio(MicMuted)
        }
        muteMic()
    },[MicMuted])

    useEffect(()=>{
        const camOff=async ()=>{
            await webrtc_client.ToggleVideo(CamOff)
        }
        camOff()
    },[CamOff])

    const videoRef=useCallback((node)=>{
        if(node){
            node.srcObject=stream
        }
    },[stream])

    return(
        <div className="p-1 flex flex-col rounded-2xl relative">
            <video className="w-full h-full" ref={videoRef} autoPlay muted></video>
            {
                streamName==="videoCall" && (
                <div className="flex flex-row">
                    <div onClick={async ()=>{
                            setMicMuted(!MicMuted)
                            }}>
                        {MicMuted? 
                            (
                                <MicOff/>
                            ):(
                                <Mic/>
                            )
                        }
                    </div>
                    <div onClick={async ()=>{
                            setCamOff(!CamOff)
                            }}>
                        {CamOff? 
                            (
                                <CameraOff/>
                            ):(
                                <Camera/>
                            )
                        }
                    </div>
                    <div onClick={async ()=>{
                            await webrtc_client.ToggleScreenShare(!ScreenShareToggle)
                            setScreenShareToggle(!ScreenShareToggle)
                            }}>
                        {ScreenShareToggle?
                            (
                                <ScreenShareOff/>
                            ):(
                                <ScreenShare/>
                            )
                        }
                    </div>
                </div>)
            }
        </div>
    )
}

const RemoteVideoPlayer=({stream, callback})=>{

    console.log(stream)
    callback()
    if(!(stream instanceof MediaStream)) {
        return
    }


    const videoRef=useCallback((node)=>{
        if(node){
            node.srcObject=stream
        }
    },[stream])

    return(
        <div className="p-1 rounded-2xl">
            <video  ref={videoRef} autoPlay></video>
        </div>
    )
}


const RemoteAudioPlayer=({stream, callback})=>{

    console.log(stream)
    callback()
    if(!(stream instanceof MediaStream)) {
        return
    }


    const audioRef=useCallback((node)=>{
        if(node){
            node.srcObject=stream
        }
    },[stream])

    return(
        <audio ref={audioRef} autoPlay></audio>
    )
}



const VideoPanel=()=>{
    const url_params=useParams()

    const {user_id, user_name}=useContext(ChatLayout_Context)

    const [LocalStreams, setLocalStreams]=useState(new Map())
    const [RemoteVideoStreams, setRemoteVideoStreams]=useState([])
    const [RemoteAudioStreams, setRemoteAudioStreams]=useState([])
    const [ScreenShareToggle, setScreenShareToggle]=useState(false)


    function cleanup(){
        webrtc_client.disconnect();
        console.log(chalk.green("Cleaned up"))
    }
    useEffect(()=>{
        if(!socketio_client || !webrtc_client) return
        webrtc_client.connect(
            url_params.communityId, 
            url_params.channelId, 
            user_id, 
            user_name,
            setLocalStreams, 
            setRemoteVideoStreams, 
            setRemoteAudioStreams,
            setScreenShareToggle
        )
        console.log("mounted")
        // socketio_client.on("getRtpCapabilities",LogRtpCapabilities)
        // socketio_client.on("createSendTransport", LogTransportParams)

        // socketio_client.on("createRecvTransport", createRecieveTransport)
        
        return ()=>cleanup()
    },[])

    useEffect(()=>{
        console.log(chalk.red("Local Streams Updated: "),LocalStreams)
    },[LocalStreams])


    return(
        <div className="w-full h-full bg-amber-300 min-h-0 overflow-auto">
            <div className="flex flex-row w-fit">
                <div className="flex flex-col">
                    <button
                        className="bg-black text-white rounded-2xl px-3 py-1 m-1 hover:bg-gray-800 h-fit w-fit"
                        onClick={()=>{
                            if(webrtc_client.device) return
                            socketio_client.emit("join_room", {communityId:url_params.communityId, channelId:url_params.channelId})
                        }}
                    >
                        connect
                    </button>
                    
                </div>
                {/* <span className="p-1 bg-white w-[200px] max-w-[200px] h-[200px] max-h-[200px] overflow-y-auto whitespace-pre-wrap">{SocketLogs}</span> */}
            </div>
            <div
                className="w-full flex flex-col bg-green-500 justify-center"
            >
                
                {
                    LocalStreams.length>0 &&
                    (
                        <>
                        <div>You</div>
                        {
                            LocalStreams.map(([key, value], index)=>{
                                return(
                                    <LocalVideoPlayer 
                                        streamName={key} 
                                        stream={value} 
                                        setScreenShareToggle={setScreenShareToggle} 
                                        ScreenShareToggle={ScreenShareToggle} 
                                        key={index} 
                                        callback={()=>{console.log(chalk.green("Mounted Local Stream"))}}/>
                                )
                            })
                        }
                        </>
                    )
                }
            </div>
            
            <div
                className="w-full flex flex-col bg-orange-500 justify-center"
            >
                {
                    RemoteVideoStreams.length>0 &&
                    (
                        <>
                        <div>others</div>
                        {
                            RemoteVideoStreams.map((video_stream, index)=>{
                                return(
                                    <RemoteVideoPlayer stream={video_stream} key={index} callback={()=>{console.log(chalk.green("Mounted Remote Video Stream"))}}/>
                                )
                            })
                        }
                        </>
                    )
                }
 
            </div>
            <>
            {
                RemoteAudioStreams.length>0 &&
                <>
                { RemoteAudioStreams.map((audio_stream, index)=>{
                    return(
                        <RemoteAudioPlayer 
                            stream={audio_stream} key={index} callback={()=>{console.log(chalk.green("Mounted Remote Video Stream"))}}
                        />
                    )
                }) }
                </>
            }
            </>

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
