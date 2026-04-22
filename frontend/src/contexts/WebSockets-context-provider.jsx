import { createContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { wsClient } from "../api/websocket"

const BASE_URL=import.meta.env.VITE_CHATS_WEBSOCKET_BASE_URL

export const WebsocketsContext=createContext(null)



export const WebSockets_ContextProvider = ({children}) => {

    const {communityId, channelId}=useParams()

    

    useEffect(()=>{
        if(!communityId || !channelId) {
            return
        }

        if(wsClient && !wsClient.socket) {   
            return
        }

        wsClient.send({type:"Room", communityId, channelId })
        // return ()=>wsClient.disconnect()
    }, [communityId, channelId])

    useEffect(()=>{
        if(wsClient && !wsClient.socket) {

            wsClient.connect(`${BASE_URL}/ws/socket_test`)
            
            return
        }
    },[])



    return (
        <WebsocketsContext.Provider value={wsClient}>
            {children}
        </WebsocketsContext.Provider>
    )
}

