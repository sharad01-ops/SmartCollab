import { useParams } from "react-router-dom"
import ChannelTag from "./ChannelsPanel Components/ChannelTag"
import { useQuery } from "@tanstack/react-query"
import { get_community_channels } from "../../../services/community_services"
import ScrollBar from "../../common components/ScrollBar"
import { useEffect, useRef, useContext } from "react"
import { ChatLayout_Context } from "../../../contexts/ChatLayout-context-provider"
import { Search } from "lucide-react"

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
  )
}

export default ChannelsPanel