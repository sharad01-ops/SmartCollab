import ChatHeader from "./MessageSection Components/ChatHeader"
import TextBox from "./MessageSection Components/TextBox"
import MessageBar from "./MessageSection Components/MessageBar"
import { useParams } from "react-router-dom"
import { useContext, useEffect, useRef, useState } from "react"
import { ChatLayout_Context } from "../../contexts/ChatLayout-context-provider"
import { get_channel_messages } from "../../services/channel_services"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import ScrollBar from "../common components/ScrollBar"
import { WebsocketsContext } from "../../contexts/WebSockets-context-provider"
import { wsClient } from "../../api/websocket"
import useAppStore from "../../store/useAppStore"
import { MessageArray_translate } from "../../services/translation_service"



const ChatMessagesSection = () => {
  const {communityId, channelId}=useParams()

  const scrollbarRef=useRef(null)

  const {setCommunityChannelMap, user_id}=useContext(ChatLayout_Context)

  const wesocket=useContext(WebsocketsContext)
  const queryClient=useQueryClient()
  const [showScrollDown, setShowScrollDown] = useState(false)
  
  const language = useAppStore((state) => state.language)
  const [translatedMessages, setTranslatedMessages] = useState([])
  const translationCache = useRef({})

  console.log("Current user language (Zustand):", language)

  const {data, isLoading, isError, error, refetch}=useQuery({
    queryKey: ["messages", communityId, channelId],
    queryFn: ()=>{return get_channel_messages(communityId, channelId)},
    enabled: !!channelId && !!communityId,
    staleTime: 1000*60*1
  })

  // Force re-translate when language changes
  useEffect(() => {
    console.log("Language changed - Clearing cache and re-translating")
    translationCache.current = {}
  }, [language])

  useEffect(() => {
    const messages = data?.Messages
    if (!messages || messages.length === 0) {
      setTranslatedMessages([])
      return
    }

    async function handleTranslation() {
      // Find messages that are NOT in the cache
      const uncachedMessages = messages.filter(msg => !translationCache.current[`${msg.message}::${language}`])

      if (uncachedMessages.length === 0) {
        // All messages are in cache, just update the state
        const cachedResults = messages.map(msg => ({
          ...msg,
          message: translationCache.current[`${msg.message}::${language}`]
        }))
        setTranslatedMessages(cachedResults)
        return
      }

      try {
        const result = await MessageArray_translate(uncachedMessages, language)
        
        // Update cache with new results
        result.forEach((res, index) => {
          translationCache.current[`${uncachedMessages[index].message}::${language}`] = res.message
        })

        // Construct final translated list using the cache
        const finalMessages = messages.map(msg => ({
          ...msg,
          message: translationCache.current[`${msg.message}::${language}`] || msg.message
        }))

        setTranslatedMessages(finalMessages)
      } catch (err) {
        console.error("Translation error:", err)
        setTranslatedMessages(messages)
      }
    }

    handleTranslation()
  }, [data?.Messages, language])


  const update_message_list=({type, sender_id, sender_name, community_id, channel_id, message, sent_at})=>{
    if(!type || !sender_id || !community_id || !channel_id || !message) return
    
    const state = queryClient.getQueryState(["messages", String(community_id), String(channel_id)])

    if(!state) return

    queryClient.setQueryData(
      ["messages", String(community_id), String(channel_id)],
      (old) => {
        const prev = old?.Messages ?? []
        
        return {
          ...old,
          Messages: [...prev, {type, sender_id:sender_id==user_id?"user":sender_id, sender_name, community_id, channel_id, sent_at, message, is_new_message:true} ],
        }
      }
    )

  }



  useEffect(()=>{
    if(!communityId) return
    if(isError){
      setCommunityChannelMap( (prev)=>{
          return {...prev, [communityId]:null }
      } )
    }

  },[isError, error])


  useEffect(()=>{

    if(wsClient && communityId && channelId){
      console.log("subscribing")
      wsClient.subscribe("session_messages", update_message_list)
    }
    
    
  },[communityId, channelId])

  useEffect(()=>{

    if(scrollbarRef.current){ 
      scrollbarRef.current.scrollToBottom()
      setShowScrollDown(false)
    }
  }, [translatedMessages])

  const handleScroll = (e) => {
    const el = e.target
    if (!el) return
    const isNotBottom = el.scrollHeight - el.scrollTop - el.clientHeight > 150
    setShowScrollDown(isNotBottom)
  }

  const handleScrollToBottom = () => {
    if(scrollbarRef.current){ 
      scrollbarRef.current.scrollToBottom()
      setShowScrollDown(false)
    }
  }



  const sendMessage=(value)=>{
    if(!value || !wsClient) return
    wsClient.send(
      { 'type': 'message', 
        'communityId': communityId, 
        'channelId': channelId, 
        "message":value})
    console.log("message Sent: ", value)
  }

  let prev_sent_date=" "
  let date_change=false

  if(isError){
    throw error
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        <ChatHeader />
        <div className="flex-1 bg-[#F5F3EF] flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-[#2F5D50]/20 border-t-[#2F5D50] rounded-full animate-spin" />
        </div>
        <MessageBar onEnter_callback={sendMessage} />
      </div>
    )
  }

  return (
    <div className="bg-transparent w-full h-full flex flex-col items-center">
      <div className="w-full flex-shrink-0">
        <ChatHeader 
          queryClient={queryClient}
        />
      </div>

      <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col pt-4 relative">
        <ScrollBar ref={scrollbarRef} onScroll={handleScroll}>
          <div className="w-full flex flex-col items-center justify-center min-h-full">
            <div className="space-y-0 flex flex-col py-6 px-8 w-full bg-transparent">
              {
              translatedMessages.map((msg, i) => {
                    const CurrentSentDate=new Date(msg.sent_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    if(prev_sent_date && CurrentSentDate!=prev_sent_date && CurrentSentDate!="Invalid Date"){
                      date_change=true
                      prev_sent_date=CurrentSentDate
                    }else{
                      date_change=false
                    }
                    return (
                      <div key={i}>
                        {
                          date_change && prev_sent_date &&
                          <div className="text-[var(--sc-on-surface-muted)] py-4 w-full flex justify-center text-xs font-medium">
                            <div className="bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                              {
                                prev_sent_date
                              }
                            </div>
                          </div>
                        }
                        <TextBox
                          fromUser={msg.sender_id == "user"}
                          message={msg.message}
                          sender_id={msg.sender_id}
                          sender_name={msg.sender_name}
                          sent_at={msg.sent_at}
                          is_new_message={msg.is_new_message}
                        />
                      </div>
                    )
                  }
                )
              }
            </div>
          </div>
        </ScrollBar>


        {showScrollDown && (
          <div 
            onClick={handleScrollToBottom}
            className="absolute bottom-[20px] right-[40px] w-[44px] h-[44px] rounded-full flex items-center justify-center bg-[rgba(31,77,58,0.8)] backdrop-blur-[10px] text-white text-[18px] shadow-[0_8px_20px_rgba(0,0,0,0.2)] cursor-pointer transition-all hover:scale-105 z-10"
          >
            ↓
          </div>
        )}
      </div>

      <div className="w-full flex-shrink-0 bg-transparent relative z-10 before:absolute before:inset-x-0 before:-top-16 before:h-16 before:bg-gradient-to-t before:from-[var(--sc-surface-low)] before:to-transparent before:-z-10 pt-2">
        <MessageBar onEnter_callback={sendMessage} />
      </div>
    </div>
  )
}

export default ChatMessagesSection