import { useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChatLayout_Context } from '../../contexts/ChatLayout-context-provider'
import { WebsocketsContext } from '../../contexts/WebSockets-context-provider'
import { useChannels } from '../../hooks/channel_hooks'
import { useAsyncError } from '../../hooks/ErrorHooks'
import ChatHeader from './MessageSection Components/ChatHeader'
import MessageBar from './MessageSection Components/MessageBar'
import TextBox from './MessageSection Components/TextBox'
import ScrollBar from '../common components/ScrollBar'

const ChatMessagesSection = () => {
  const { communityId, channelId } = useParams()
  const { user_id } = useContext(ChatLayout_Context)
  const wsClient = useContext(WebsocketsContext)  // value IS the wsClient directly
  const scrollbarRef = useRef(null)
  const throwError = useAsyncError()

  const { getMessages, loading_messages } = useChannels()
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (!communityId || !channelId) return
    getMessages(communityId, channelId)
      .then((data) => {
        setMessages(data?.Messages ?? [])
      })
      .catch((e) => throwError(e))
  }, [communityId, channelId])

  // Scroll to bottom when messages load or update
  useEffect(() => {
    scrollbarRef.current?.scrollToBottom()
  }, [messages])

  // WebSocket subscription
  useEffect(() => {
    if (!wsClient || !channelId) return
    const unsubscribe = wsClient.subscribe?.((message) => {
      update_message_list(message)
    })
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [wsClient, channelId])

  const update_message_list = (newMessage) => {
    setMessages(prev => [...prev, newMessage])
    scrollbarRef.current?.scrollToBottom()
  }

  const sendMessage = (text) => {
    if (!text.trim()) return
    wsClient?.send?.({
      type: 'message',
      message: text,
      channel_id: channelId,
      community_id: communityId,
    })
    // Optimistic update
    update_message_list({
      sender_id: user_id,
      message: text,
      sent_at: null,
    })
  }

  if (loading_messages) {
    return (
      <div className="w-full h-full flex flex-col">
        <ChatHeader />
        <div className="flex-1 bg-[var(--sc-bg-primary)] flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-[var(--sc-border)] border-t-[var(--sc-accent)] rounded-full animate-spin" />
        </div>
        <MessageBar onEnter_callback={sendMessage} />
      </div>
    )
  }

  return (
    <div className="bg-[var(--sc-bg-primary)] w-full h-full flex flex-col">
      <ChatHeader />

      <div className="flex-1 bg-[var(--sc-bg-primary)] overflow-y-hidden flex flex-col">
        <ScrollBar ref={scrollbarRef}>
          <div className="pt-4 pb-2">
            <div className="space-y-0.5">
              {messages.map((msg, i) => (
                <TextBox
                  key={msg.message_id ?? i}
                  fromUser={msg.sender_id == user_id}
                  message={msg.message}
                  sender_id={msg.sender_id}
                  sent_at={msg.sent_at}
                />
              ))}
            </div>
          </div>
        </ScrollBar>
      </div>

      <MessageBar onEnter_callback={sendMessage} />
    </div>
  )
}

export default ChatMessagesSection