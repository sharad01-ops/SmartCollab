import { useContext, useRef, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChatLayout_Context } from "../../../contexts/ChatLayout-context-provider"
import { useCommunityInfo } from "../../../hooks/community_hooks"
import { useAsyncError } from "../../../hooks/ErrorHooks"
import ScrollBar from "../../common components/ScrollBar"
import ChannelTag from "./ChannelsPanel Components/ChannelTag"

const ChannelsPanel = () => {
  const { communityId } = useParams()
  const { channelFilter, setCommunityChannelMap } = useContext(ChatLayout_Context)
  const scrollbarRef = useRef(null)
  const throwError = useAsyncError()

  const { getCommunityChannels, loading_channels } = useCommunityInfo()
  const [channels, setChannels] = useState([])

  useEffect(() => {
    if (!communityId) return
    getCommunityChannels(communityId)
      .then((data) => {
        const list = data?.Channels ?? []
        setChannels(list)
        if (list.length > 0) {
          setCommunityChannelMap(prev => ({
            ...prev,
            [communityId]: list[0].channel_id,
          }))
        }
      })
      .catch((e) => throwError(e))
  }, [communityId])

  const filteredChannels = channels.filter(ch =>
    !channelFilter || ch.channel_name.toLowerCase().includes(channelFilter.toLowerCase())
  )

  return (
    <div className="bg-[var(--sc-bg-secondary)] w-full h-full flex flex-col overflow-hidden">

      <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--sc-text-muted)] flex-shrink-0">
        Channels
      </p>

      {loading_channels && (
        <p className="text-[var(--sc-text-muted)] text-xs px-3 py-3">Loading...</p>
      )}

      {!loading_channels && filteredChannels.length === 0 && (
        <p className="text-[var(--sc-text-muted)] text-xs px-3 py-2">No channels found</p>
      )}

      <div className="flex-1 overflow-hidden">
        <ScrollBar ref={scrollbarRef}>
          {filteredChannels.map((channel) => (
            <ChannelTag
              key={channel.channel_id}
              channel_name={channel.channel_name}
              channel_id={channel.channel_id}
            />
          ))}
        </ScrollBar>
      </div>

    </div>
  )
}

export default ChannelsPanel