const mediasoup=require("mediasoup")
const config=require("./config")
const os=require("os")
const chalk=require("chalk")

const WorkerList=[]
let current_worker_index=0

async function createWorkers(){
    const numWorkers=Object.keys(os.cpus()).length

    for(let i=0; i<numWorkers; i++){
        const worker=await mediasoup.createWorker({
            rtcMinPort: 40000,
            rtcMaxPort: 49999
        });

        worker.on('died', () => {
            console.log(chalk.red('mediasoup worker died'));
            process.exit(1);
        });


        for(const listeninfo of config.webRtcServerOptions.listenInfos){
            listeninfo.port+=i
        }

        const WebRTCServer=await worker.createWebRtcServer(config.webRtcServerOptions)

        WorkerList.push({worker, WebRTCServer})


        // const router=await worker.createRouter({})
        // router.createWebRtcTransport({webRtcServer})
    }
    console.log(chalk.green("Succesfully created workers"))

}


async function create_router(){
    //creates a router and adds a new entry to Rooms
    const {worker, WebRTCServer}=WorkerList[current_worker_index]
    current_worker_index=(current_worker_index+1)%WorkerList.length

    const router= await worker.createRouter({mediaCodecs:config.routerOptions.mediaCodecs})
    
    return {router,worker,WebRTCServer}
}


async function createWebRtcTransport( router, WebRTCServer, peerId) {

    const transport=await router.createWebRtcTransport({
        webRtcServer:WebRTCServer,
        enableUdp: true,
        enableTcp: true,
        enableSctp: true,
        numSctpStreams: { OS: 1024, MIS: 1024 },
        maxIncomingBitrate: 1500000,
        initialAvailableOutgoingBitrate: 1000000,
        appData: { peerId },
    });

    return transport
}

async function createProducer(transport, ) {
    
}


module.exports={createWorkers, create_router, createWebRtcTransport}