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

const ChatMessagesSection = () => {
  const {communityId, channelId}=useParams()

  const scrollbarRef=useRef(null)

  const {setCommunityChannelMap, user_id}=useContext(ChatLayout_Context)

  const wesocket=useContext(WebsocketsContext)
  const queryClient=useQueryClient()
  const [scroll, doScroll]=useState(false)

  const {data, isLoading, isError, error}=useQuery({
    queryKey: ["messages", communityId, channelId],
    queryFn: ()=>{return get_channel_messages(communityId, channelId)},
    enabled: !!channelId && !!communityId,
    staleTime: 1000*60*1
  })


  const update_message_list=({type, sender_id, sender_name, community_id, channel_id, message, sent_at})=>{
    // console.log("on recieve:",type, sender_id, typeof(community_id), typeof(channel_id), message)
    if(!type || !sender_id || !community_id || !channel_id || !message) return
    
    const state = queryClient.getQueryState(["messages", String(community_id), String(channel_id)])

    if(!state) return

    queryClient.setQueryData(
      ["messages", String(community_id), String(channel_id)],
      (old) => {
        const prev = old?.Messages ?? []
        console.log(user_id)
        return {
          ...old,
          Messages: [...prev, {type, sender_id:sender_id==user_id?"user":sender_id, sender_name, community_id, channel_id, sent_at, message} ],
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
    }
  },[data])



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
    <div className="bg-[var(--sc-bg-primary)] w-full h-full flex flex-col">
      <ChatHeader 
        queryClient={queryClient}
      />

      <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col">
        <ScrollBar ref={scrollbarRef}>
          <div className=" w-full flex flex-col items-center ">
            <div className="space-y-0.5 flex flex-col pt-4 pb-2 w-full max-w-[1000px] bg-[#F5F3EF] ">
              {
              data && Array.isArray(data.Messages) &&

              data.Messages.map((msg, i) => {
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
                          <div className="text-[#2F5D50] py-8 w-full flex justify-center">
                            <div className="bg-white px-3 py-1 rounded-xl">
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
                        />
                      </div>
                    )
                  }
                )
              }
            </div>
          </div>
        </ScrollBar>
      </div>

      <MessageBar onEnter_callback={sendMessage} />
    </div>
  )
}

export default ChatMessagesSection