import { useParams, useNavigate } from 'react-router-dom'
import { Hash } from 'lucide-react'

const ChannelTag = ({ channel_name, channel_id }) => {
  const url_params = useParams()
  const navigate = useNavigate()
  const isActive = url_params.channelId == channel_id

  return (
    <div
      className={`
        flex items-center gap-1.5 h-8 mx-2 my-0.5 px-2 rounded-md
        cursor-pointer select-none transition-colors duration-100 text-sm
        ${isActive
          ? 'bg-[var(--sc-accent-subtle)] text-[var(--sc-accent)] font-medium'
          : 'text-[var(--sc-text-secondary)] hover:bg-[var(--sc-bg-tertiary)] hover:text-[var(--sc-text-primary)]'
        }
      `}
      onClick={() => navigate(`/chats/${url_params.communityId}/${channel_id}`)}
    >
      <Hash className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
      <span className="truncate min-w-0">{channel_name}</span>
    </div>
  )
}

export default ChannelTag