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
import { MessageArray_translate, translate } from "../../services/translation_service"



const ChatMessagesSection = () => {
  const {communityId, channelId}=useParams()

  const scrollbarRef=useRef(null)

  const {setCommunityChannelMap, user_id}=useContext(ChatLayout_Context)

  const wesocket=useContext(WebsocketsContext)
  const queryClient=useQueryClient()
  const [showScrollDown, setShowScrollDown] = useState(false)
  
  const language = useAppStore((state) => state.language)
  const globalCache = useAppStore((state) => state.translationCache)
  const addToGlobalCache = useAppStore((state) => state.addToCache)

  const [translatedMessages, setTranslatedMessages] = useState([])
  const [isTranslating, setIsTranslating] = useState(false)

  const {data, isLoading, isError, error, refetch}=useQuery({
    queryKey: ["messages", communityId, channelId],
    queryFn: ()=>{
      if (!communityId || !channelId) return null;
      return get_channel_messages(communityId, channelId)
    },
    enabled: !!channelId && !!communityId,
    staleTime: 1000*60*1,
    retry: (failureCount, error) => {
      if (error.status === 403 && failureCount < 1) return true;
      return false;
    }
  })

  useEffect(() => {
    let isCancelled = false
    const messages = data?.Messages
    if (!messages || messages.length === 0) {
      setTranslatedMessages([])
      return
    }

    // 1. IMMEDIATELY show what we have (either original or from global cache)
    const initialRender = messages.map(msg => ({
      ...msg,
      message: globalCache[`${msg.message}::${language}`] || msg.message
    }))
    setTranslatedMessages(initialRender)

    // 2. Skip translation if English or all messages are already cached
    if (language === 'en') {
      setIsTranslating(false)
      return
    }

    const uncachedMessages = messages.filter(msg => !globalCache[`${msg.message}::${language}`])
    if (uncachedMessages.length === 0) {
      setIsTranslating(false)
      return
    }

    async function handleTranslation() {
      setIsTranslating(true)
      try {
        const result = await MessageArray_translate(uncachedMessages, language)
        
        if (isCancelled) return 

        // Update global cache
        result.forEach((res, index) => {
          addToGlobalCache(uncachedMessages[index].message, res.message, language)
        })

        // Construct final list from global cache
        const finalMessages = messages.map(msg => ({
          ...msg,
          message: globalCache[`${msg.message}::${language}`] || res.message // Note: using res.message here is a bit tricky, better to re-access cache but the state update is async
        }))
        // To be safe, we reconstruct using the results we just got plus existing cache
        const resultsMap = {}
        result.forEach((res, index) => {
          resultsMap[`${uncachedMessages[index].message}::${language}`] = res.message
        })

        const combinedMessages = messages.map(msg => ({
          ...msg,
          message: resultsMap[`${msg.message}::${language}`] || globalCache[`${msg.message}::${language}`] || msg.message
        }))

        setTranslatedMessages(combinedMessages)
      } catch (err) {
        console.error("Translation error:", err)
      } finally {
        if (!isCancelled) setIsTranslating(false)
      }
    }

    handleTranslation()

    return () => { isCancelled = true }
  }, [data?.Messages, language, globalCache])


  const [pendingTranslations, setPendingTranslations] = useState(new Set())

  const update_message_list = async ({ type, sender_id, sender_name, community_id, channel_id, message, sent_at }) => {
    if (!type || !sender_id || !community_id || !channel_id || !message) return

    // 1. Show original message IMMEDIATELY (Zero Delay)
    queryClient.setQueryData(
      ["messages", String(community_id), String(channel_id)],
      (old) => {
        const prev = old?.Messages ?? []
        return {
          ...old,
          Messages: [...prev, { type, sender_id: sender_id == user_id ? "user" : sender_id, sender_name, community_id, channel_id, sent_at, message, is_new_message: true }],
        }
      }
    )

    // 2. Background translation for this specific message
    if (language !== 'en') {
      const cacheKey = `${message}::${language}`
      if (!globalCache[cacheKey]) {
        try {
          const messageId = `${sent_at}-${sender_id}`; // Pseudo-id
          setPendingTranslations(prev => new Set(prev).add(messageId))
          
          const res = await translate(message, language)
          addToGlobalCache(message, res.translated, language)
          
          // Re-update the UI with translated text
          queryClient.setQueryData(
            ["messages", String(community_id), String(channel_id)],
            (old) => ({
              ...old,
              Messages: (old?.Messages ?? []).map(m => 
                (m.sent_at === sent_at && m.message === message) ? { ...m, message: res.translated } : m
              )
            })
          )
          setPendingTranslations(prev => {
             const next = new Set(prev);
             next.delete(messageId);
             return next;
          })
        } catch (e) {
          console.error("BG translation failed:", e)
        }
      }
    }
  }

  useEffect(() => {
    if (!communityId) return
    if (isError) {
      setCommunityChannelMap((prev) => {
        return { ...prev, [communityId]: null }
      })
    }
  }, [isError, error])

  useEffect(() => {
    if (wsClient && communityId && channelId) {
      wsClient.subscribe("session_messages", update_message_list)
    }
  }, [communityId, channelId, language])

  useEffect(() => {
    if (scrollbarRef.current) {
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
    if (scrollbarRef.current) {
      scrollbarRef.current.scrollToBottom()
      setShowScrollDown(false)
    }
  }

  const sendMessage = (value) => {
    if (!value || !wsClient) return
    wsClient.send({ 'type': 'message', 'communityId': communityId, 'channelId': channelId, "message": value })
  }

  let prev_sent_date = " "
  let date_change = false

  if (isError) {
    throw error
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        <ChatHeader />
        <div className="flex-1 bg-[#F5F3EF] flex flex-col justify-center items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#2F5D50]/20 border-t-[#2F5D50] rounded-full animate-spin" />
        </div>
        <MessageBar onEnter_callback={sendMessage} />
      </div>
    )
  }

  return (
    <div className="chat-section bg-transparent w-full">
      <div className="w-full flex-shrink-0 relative">
        <ChatHeader queryClient={queryClient} />
      </div>

      <div className="messages-container flex-1 w-full pt-4 relative">
        <ScrollBar ref={scrollbarRef} onScroll={handleScroll}>
          <div className="w-full flex flex-col items-center justify-center min-h-full">
            <div className="space-y-0 flex flex-col py-6 px-8 w-full bg-transparent">
              {translatedMessages.map((msg, i) => {
                const messageId = `${msg.sent_at}-${msg.sender_id}`;
                const isPending = pendingTranslations.has(messageId);
                
                const CurrentSentDate = new Date(msg.sent_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })
                if (prev_sent_date && CurrentSentDate != prev_sent_date && CurrentSentDate != "Invalid Date") {
                  date_change = true
                  prev_sent_date = CurrentSentDate
                } else {
                  date_change = false
                }
                return (
                  <div key={i} className={isPending ? "opacity-70 animate-pulse" : ""}>
                    {date_change && prev_sent_date && (
                      <div className="text-[var(--sc-on-surface-muted)] py-4 w-full flex justify-center text-xs font-medium">
                        <div className="bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                          {prev_sent_date}
                        </div>
                      </div>
                    )}
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
              })}
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