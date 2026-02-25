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
            // Perform cleanup actions here, e.g., update user list in database
        });
        socket.on("custom-event", (props)=>{
            console.log(chalk.yellow(`recieved from client:`),props)
        })

        socket.on("join_room", async (props)=>{
            console.log("room_join params: ", props)
            const {router, worker, WebRTCServer}=await getOrCreateRoom(props.communityId, props.channelId, socket)
            // console.log(router.rtpCapabilities)
            socket.emit("getRtpCapabilities", router.rtpCapabilities)
        })

        socket.on("createWebRtcTransport", async (props)=>{
            const {router, worker, WebRTCServer}=await getOrCreateRoom(props.communityId, props.channelId, socket)
            // console.log(router, worker, WebRTCServer)
            const transport=await webrtc_funcs.createWebRtcTransport(router, WebRTCServer, socket.id)
            socket.emit("createSendTransport", {
                id             : transport.id,
                iceParameters  : transport.iceParameters ,
                iceCandidates  : transport.iceCandidates ,
                dtlsParameters : transport.dtlsParameters,
                sctpParameters : transport.sctpParameters
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

        
    });
}


async function getOrCreateRoom(communityid, channelid, joined_socket){
    let room=Rooms.get(`${communityid}${channelid}`)
    if(room) return room

    const {router, worker, WebRTCServer}=await webrtc_funcs.create_router()
    const peers=new Map()
    peers.set(joined_socket.id, joined_socket)
    Rooms.set(`${communityid}${channelid}`, {router, worker, WebRTCServer, peers})

    return {router, worker, WebRTCServer, peers}

}


module.exports={initialize_socketio_Server}