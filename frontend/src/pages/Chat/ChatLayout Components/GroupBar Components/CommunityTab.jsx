import { useContext } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChatLayout_Context } from "../../../../contexts/ChatLayout-context-provider"

const CommunityTab = ({ communityId, communityName }) => {
  const { CommunityChannelMap } = useContext(ChatLayout_Context)
  const navigate = useNavigate()
  const url_params = useParams()

  const isActive = url_params.communityId == communityId

  return (
    <div
      title={communityName}
      className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${isActive ? 'bg-[#2F5D50]' : 'bg-[#E8E4DE]'}`}
      onClick={() => {
        if (url_params.communityId == communityId) return
        const channel_id = CommunityChannelMap[communityId]
        navigate(`/chats/${communityId}/${channel_id ? channel_id : ''}`)
      }}
    >
      <span className={`text-base font-bold uppercase select-none ${isActive ? 'text-white' : 'text-gray-600'}`}>
        {communityName ? communityName[0].toUpperCase() : 'C'}
      </span>
    </div>
  )
}

export default CommunityTab
