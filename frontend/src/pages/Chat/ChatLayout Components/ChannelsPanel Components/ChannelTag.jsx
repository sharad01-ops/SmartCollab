import { useParams, useNavigate } from 'react-router-dom'
import { Hash } from 'lucide-react'

const ChannelTag = ({ channel_name, channel_id }) => {
  const url_params = useParams()
  const navigate = useNavigate()
  const isActive = url_params.channelId == channel_id

  return (
    <div
      className={`
        flex items-center justify-between h-10 mx-2 my-1.5 px-3 rounded-[12px]
        cursor-pointer select-none transition-colors duration-200 text-[13px] font-medium
        ${isActive
          ? 'bg-[#F2E8D7] text-[#1c332b]'
          : 'bg-transparent text-gray-500 hover:bg-gray-200/50 hover:text-gray-900'
        }
      `}
      onClick={() => navigate(`/chats/${url_params.communityId}/${channel_id}`)}
    >
      <div className="flex items-center gap-2">
        <Hash className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#1c332b]' : 'text-gray-400'}`} strokeWidth={2} />
        <span className="truncate min-w-0">{channel_name}</span>
      </div>
      {isActive && (
        <div className="w-2.5 h-2.5 rounded-full bg-[#1c332b] flex-shrink-0" />
      )}
    </div>
  )
}

export default ChannelTag
