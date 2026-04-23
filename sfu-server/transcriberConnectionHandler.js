const webrtc_funcs=require('./webrtc_functions')
const chalk=require('chalk')
require("dotenv").config()

const TranscriberProps={
    router:null, 
    worker:null, 
    WebRTCServer:null,
    socket:null,
    ProducerConsumerMap:new Map(),
    recvTransport:null
}

class TranscriberConnectionHandler{

    socket=null
    PlainTransport=null

    ready=false

    connect=async (socket)=>{
        this.socket=socket
        this.socket.join("TranscriberRoom")

        const {router, worker, WebRTCServer}=await webrtc_funcs.create_router()

        TranscriberProps.router=router
        TranscriberProps.worker=worker
        TranscriberProps.WebRTCServer=WebRTCServer
        TranscriberProps.socket=this.socket

        await this.connectTransport(router)
        // this.socket.emit("getRtpCapabilities", router.rtpCapabilities)
    }

    connectTransport=async (router)=>{
        this.PlainTransport=await webrtc_funcs.createPlainTransport(router)
        await this.PlainTransport.connect({
            ip:process.env.TRANSCRIBER_IP,
            port:Number(process.env.TRANSCRIBER_LISTEN_PORT)
        })
        this.ready=true
    }

    toggleConsumer=async (producerId, isOn)=>{
        const consumer=TranscriberProps.ProducerConsumerMap.get(producerId)
        if(isOn===false){
            await consumer?.pause()
            console.log(chalk.magenta("Audio Off"))
        }else if(isOn===true){
            await consumer?.resume()
            console.log(chalk.green("Audio On"))
        }
    }

    createConsumer=async (producingRouter, producerId, roomId, UserId, UserName)=>{
        await producingRouter.pipeToRouter({ producerId, router: TranscriberProps.router });
        const consumer=await this.PlainTransport.consume({
            producerId,
            rtpCapabilities: TranscriberProps.router.rtpCapabilities,
            paused: false
        })

        consumer.on("producerclose", ()=>{
            consumer.close()
            TranscriberProps.ProducerConsumerMap.delete(producerId)
            this.socket.emit("consumer-closed", {ssrc, roomId, UserId, UserName} )
        })

        TranscriberProps.ProducerConsumerMap.set(producerId, consumer)
        const ssrc=consumer.rtpParameters.encodings[0].ssrc;
        this.socket.emit("consumer-created", {ssrc, roomId, UserId, UserName})
    }


}

module.exports=new TranscriberConnectionHandler()
