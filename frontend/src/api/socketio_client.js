import { io } from "socket.io-client";
import chalk from "chalk";
const SFU_URL=import.meta.env.VITE_SFU_SERVER_PROXY_URL

class SocketIOClient{
    socket=null
    peerid=null

    on_recieve_callbacks=[]

    connect(){
        this.socket=io()

        this.socket.on("connect",()=>{
            console.log(chalk.green("connected to sfu"))
        })

        this.socket.on("get_peerid", (peerid)=>{
            this.peerid=peerid
            console.log(chalk.green("recieved peerid:"), peerid)
        })

        this.socket.on('disconnect', (reason) => {
            console.log(chalk.red(`User disconnected because: ${reason}`));
            // Perform cleanup actions here, e.g., update user list in database
        });
    }

    register_on_recieve_callbacks(callback){
        this.on_recieve_callbacks.push(callback)
    }

    on(event_name, callback){
        if(!event_name || !callback || !this.socket ) return
        console.log(chalk.yellow(`listening to ${event_name}:`),callback?.name)

        for(const cb of this.on_recieve_callbacks){
            this.socket.on(event_name, ()=>{cb(event_name,callback.name)})
        }
        
        this.socket.on(event_name, callback);
    }

    off(event_name, callback){
        if(!event_name || !callback || !this.socket )
        this.socket.off(event_name, callback);
    }

    emit(event_name, msg, cb){
        if(!msg || !this.socket) return
        const message={...msg, peerid:this.socket.id}
        console.log(chalk.yellow(`emitting:- ${event_name}:`), message)

        this.socket.emit(event_name, message, cb)
    }

    disconnect(){
        if(!this.socket) return
        this.socket.disconnect()
        this.socket=null
        this.peerid=null
        this.on_recieve_callbacks=[]
    }
}

export const socketio_client=new SocketIOClient()