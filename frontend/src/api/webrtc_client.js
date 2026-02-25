import { Device } from "mediasoup-client"


class WebRTCAPI{

    stream=null
    device=null

    async getLocalStream(){
        await navigator.mediaDevices.getUserMedia({
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
        }).then((stream)=>{
            this.stream=stream
        }).catch((error)=>{
            console.error(error)
        })
    }

    async create_device(routerRtpCapabilities){
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

    create_SendTransport(transportParams){
        try{
            const sendTransport=this.device.createSendTransport(transportParams)
            return sendTransport
        }catch(e){
            throw e
        }
    }
    
}

export const webrtc_client=new WebRTCAPI()