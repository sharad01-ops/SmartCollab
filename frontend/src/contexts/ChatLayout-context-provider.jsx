import {useState, createContext, useEffect} from 'react'
import { useParams } from 'react-router-dom'

export const ChatLayout_Context=createContext(null)

export const ChatLayout_Context_Provider = ({children}) => {
    const [CurrentCommunity, setCurrentCommunity]=useState(null)
    const [CurrentChannel, setCurrentChannel]=useState(null)
    const [CommunityChannelMap, setCommunityChannelMap]=useState({})
    const [CommunityChannels, setCommunityChannels]=useState([])
    const [user_id, setUserid]=useState(null)
    const [user_name, setUserName]=useState(null)
    const [LeftCommunity, setLeftCommunity]=useState(false)
    const [LeaveChannel_cb, setLeaveChannel_cb] = useState(null)

    const {communityId, channelId}=useParams()
    
    useEffect(()=>{ 

        if(!channelId || !communityId) return
        setCommunityChannelMap( (prev)=>{
            return {...prev, [communityId]:channelId }
        } )

    }, [communityId, channelId])

    
    return (
        <ChatLayout_Context.Provider value={{
                                        CurrentCommunity, setCurrentCommunity,
                                        CurrentChannel, setCurrentChannel,
                                        CommunityChannelMap, setCommunityChannelMap,
                                        user_id, setUserid,
                                        user_name, setUserName,
                                        setCommunityChannels, CommunityChannels,
                                        LeftCommunity, setLeftCommunity,
                                        LeaveChannel_cb, setLeaveChannel_cb
                                        }}>
            {children}
        </ChatLayout_Context.Provider>
    )
}