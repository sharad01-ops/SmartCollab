import { useParams } from "react-router-dom"
import ChannelTag from "./ChannelsPanel Components/ChannelTag"
import { useQuery } from "@tanstack/react-query"
import { get_community_channels } from "../../../services/community_services"
import ScrollBar from "../../common components/ScrollBar"
import { useEffect, useRef, useContext } from "react"
import { ChatLayout_Context } from "../../../contexts/ChatLayout-context-provider"

const ChannelsPanel = () => {
  const {communityId} = useParams()
  const scrollbarRef=useRef(null)

  const { setCommunityChannels } = useContext(ChatLayout_Context)

  const {data, isLoading, isError, error}=useQuery({
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

  if(isError){
    if(error.status==403){
      throw error
    }
    console.log(error.status)
  }



  //isLoading && communityId
  if(isLoading && communityId){
    return(
      <div className="bg-[var(--sc-bg-secondary)] w-full h-full flex flex-col overflow-hidden">
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--sc-text-muted)] flex-shrink-0">
          Channels
        </p>
        <p className="text-[var(--sc-text-muted)] text-xs px-3 py-3">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--sc-bg-secondary)] w-full h-full flex flex-col overflow-hidden">

      <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--sc-text-muted)] flex-shrink-0">
        Channels
      </p>

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
  )
}

export default ChannelsPanel