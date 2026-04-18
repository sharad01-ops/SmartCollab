import { useParams, useNavigate } from "react-router-dom"
import ChannelTag from "./ChannelsPanel Components/ChannelTag"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { get_community_channels } from "../../../services/community_services"
import ScrollBar from "../../common components/ScrollBar"
import { useEffect, useRef, useContext, useState } from "react"
import { ChevronDown } from "lucide-react"
import { ChatLayout_Context } from "../../../contexts/ChatLayout-context-provider"
import SearchBar from "./SearchBar"
import FloatingDiv from "../../common components/FloatingDiv"
import { leave_community } from "../../../services/community_services"
import { create_channel } from "../../../services/channel_services"
import CenterFloatingDiv from "../../common components/CenterFloatingDiv"

const OptionsBar = ({CommunityName, CommunityId, setLeftCommunity, LeftCommunity, queryClient, refetchChannels}) => {
  const navigate=useNavigate()
  const [centerdivmounted, setCenterDivMounted] = useState(null)
  const [channel_name, setChannelName]=useState('')
  const ChannelNameInputUpdate=(e)=>{
    setChannelName(e.target.value)
  }

  return (
    <div className="h-11 flex-shrink-0 bg-[var(--sc-bg-secondary)] border-b border-[var(--sc-border)] flex items-center justify-between px-3">
      <span className="text-[var(--sc-text-primary)] font-semibold text-sm truncate">
        {CommunityName}
      </span>
      {
        centerdivmounted && 
        <CenterFloatingDiv 
        parent_classes={"flex flex-col"}
        setOpen={setCenterDivMounted}>
          <div className="w-full px-1 py-1">
            <input  type="text" placeholder="Channel name" className="w-full px-2 py-1 outline-0 bg-[#464646] rounded-[0.4rem]"
            onChange={(e)=>{ChannelNameInputUpdate(e)}}
          />
          </div>
          <button
            className={`px-3 py-1 m-1 w-fit rounded-lg flex items-center justify-center bg-[var(--sc-bg-tertiary)] transition-colors cursor-pointer close-centered-div
            ${channel_name.length>0?"text-green-400":"text-red-400"}  
            `}
            disabled={channel_name.length>0?false:true}
            onClick={()=>{
                setChannelName('')
                create_channel(CommunityId, channel_name).then((response)=>{
                  if(response.Success===true){
                    refetchChannels()
                  }
                }).catch((e)=>{
                  console.error(e)
                })

            }}
          >
            Create
          </button>

        </CenterFloatingDiv>
      }
      { CommunityId &&
      <FloatingDiv
        ToggleButtonComponent={() => (
          <ChevronDown className="w-4 h-4 text-[var(--sc-text-muted)] flex-shrink-0 cursor-pointer hover:text-[var(--sc-text-secondary)] transition-colors" />
        )}
        content_parent_classes=""
        button_parent_styles=""
        
      >
        {/* Dropdown panel */}
        <div className="mx-3 my-1 flex flex-col items-center bg-[var(--sc-bg-elevated)] border border-[var(--sc-border)] rounded-lg shadow-sm p-1 min-w-fit">
        
          <button
            className="px-3 py-2 hover:bg-[#212124] rounded-[0.5rem] text-[Inter] text-[0.8rem] w-full text-start mx-2 my-1 cursor-pointer close-floating"
            onClick={()=>{
              setCenterDivMounted(true)
            }}
          >Create Channel</button>

          <button
            className="px-3 py-2 hover:bg-[#212124] rounded-[0.5rem] text-[Inter] text-[0.8rem] w-full text-start mx-2 my-1 cursor-pointer text-[#ff0000] close-floating"
            onClick={async ()=>{
              await navigate("/chats")
              if(CommunityId){
                leave_community(CommunityId).then( (response)=>{
                  if(response.Success===true){
                    setLeftCommunity(!LeftCommunity)
                    queryClient.removeQueries({queryKey: ["community_channels", CommunityId]})
                    queryClient.removeQueries({queryKey: ["messages", CommunityId]})
                  }
                }).catch((e)=>{
                  console.error(e)
                })
              }
            }}
          >Leave Community</button>

        </div>
      </FloatingDiv>
      }
    </div>
  )
}




const ChannelsPanel = () => {
  const {communityId, channelId} = useParams()
  const scrollbarRef=useRef(null)

  const { setCommunityChannels, setLeftCommunity, LeftCommunity, setLeaveChannel_cb } = useContext(ChatLayout_Context)

  const queryClient=useQueryClient()

  const {data, isLoading, isError, error, refetch}=useQuery({
    queryKey:["community_channels", communityId],
    queryFn: ()=>{return get_community_channels(communityId)},
    enabled:!!communityId,
    retry: false,
    staleTime:1000*60*5
  })


  useEffect(()=>{
    if(!data) return
    setCommunityChannels(data.Channels)
  },[data])

  useEffect(()=>{
    console.log("Registered Refetch")
    setLeaveChannel_cb(function(){return refetch})
  },[communityId, channelId])



  if(isError){
    if(error.status==403){
      throw error
    }
    console.log(error.status)
  }


  //isLoading && communityId
  if(isLoading && communityId){
    return(
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search channels..."
            className="w-full bg-[#F9F7F4] border-none rounded-xl py-3 pl-12 pr-4 text-sm text-gray-900 placeholder:text-[#8A817C]"
            disabled
          />
        </div>
        <p className="text-lg font-semibold text-gray-900 mb-4">Community</p>
        <p className="text-[#8A817C] text-sm">Loading...</p>
      </div>
    )
  }

  return (
  <div className="flex flex-col w-[200px] h-full border-r border-[var(--sc-border)]">
    
    <OptionsBar CommunityName={data?.CommunityName||"Community"} CommunityId={communityId} 
    setLeftCommunity={setLeftCommunity}
    LeftCommunity={LeftCommunity}
    queryClient={queryClient}
    refetchChannels={refetch}
    />

    <SearchBar joined_Channels={data?.Channels}/>

    <div className="bg-[var(--sc-bg-secondary)] w-full h-full flex flex-col overflow-hidden">

      <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--sc-text-muted)] flex-shrink-0">
        Channels
      </p>

    <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col">

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search channels..."
          className="w-full bg-[#F9F7F4] border-none rounded-xl py-3 pl-12 pr-4 text-sm text-gray-900 placeholder:text-[#8A817C]"
        />
      </div>

      {/* Community heading */}
      <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Community</p>

      {/* Channel list */}
      <div className="flex-1 overflow-hidden">
        <ScrollBar ref={scrollbarRef}>
          {
            data && Array.isArray(data.Channels) && 
              (
                data.Channels.map((channel) => (
                  <ChannelTag
                    key={channel.channel_id}
                    channel_name={channel.channel_name}
                    channel_id={channel.channel_id}
                  />
                ))
              )
          }
        </ScrollBar>
      </div>

    </div>
  </div>
  </div>
  )
}

export default ChannelsPanel