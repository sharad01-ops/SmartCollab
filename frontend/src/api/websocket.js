

class WebSocketAPI{
    socket=null
    url=null
    listeners=new Map()
    run_on_start=new Map()

    connect(url){
        if(this.socket) return


        this.url=url
        this.socket=new WebSocket(url)

        this.socket.onopen=()=>{
            console.log("WS Connected")
            this.run_on_start.forEach((fn, key) => {fn()});
        }

        this.socket.onmessage=(event)=>{
            const data= JSON.parse(event.data)
            console.log("data recieved: ",data)
            this.listeners.forEach((fn, key)=>{fn(data)})
        }

        this.socket.onclose=()=>{
            console.log("WS Disconnected")
            this.socket=null
        }

    }

    disconnect(){
        this.socket?.close()
        socket=null
        url=null
        listeners=new Map()
        run_on_start=new Map()
    }


    send(data){
        if(!this.socket || this.socket.readyState!==WebSocket.OPEN){
            console.log("WS not Connected")
            return
        }

        this.socket.send(JSON.stringify(data))
        console.log(`Sent: ${JSON.stringify(data)} `)
    }

    subscribe(key, fn){
        if(!key || !fn){
            console.error(`key:${key} or function:${fn} is undefined, cannot subscribe`)
            return
        }
        console.log(`subscribed the function ${fn.name}`)
        this.listeners.set(key, fn)

        return ()=>this.listeners.delete(key)
    }

    subscribe_initializer(key, fn){
        if(!key || !fn){
            console.error("key or function is undefined, cannot sunscribe")
            return
        }
        this.run_on_start.set(key, fn)

        return ()=>this.run_on_start.delete(key)
    }

}


export const wsClient=new WebSocketAPI()