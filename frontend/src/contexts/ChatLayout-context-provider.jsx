import { createContext, useState } from "react"

export const ChatLayout_Context = createContext(null)

const ChatLayout_Context_Provider = ({ children }) => {

  const [CurrentCommunity, setCurrentCommunity] = useState(null)
  const [CurrentChannel, setCurrentChannel] = useState(null)
  const [CommunityChannelMap, setCommunityChannelMap] = useState({})
  const [user_id, setUser_id] = useState(null)
  const [channelFilter, setChannelFilter] = useState('')

  return (
    <ChatLayout_Context.Provider value={{
      CurrentCommunity, setCurrentCommunity,
      CurrentChannel, setCurrentChannel,
      CommunityChannelMap, setCommunityChannelMap,
      user_id, setUser_id,
      channelFilter, setChannelFilter,
    }}>
      {children}
    </ChatLayout_Context.Provider>
  )
}

export { ChatLayout_Context_Provider }