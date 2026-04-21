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
      className={`w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-[14px] flex items-center justify-center cursor-pointer transition-all duration-250 my-2 border ${isActive ? 'bg-[#E6D3B3] border-transparent shadow-[0_4px_12px_rgba(0,0,0,0.2)]' : 'bg-transparent border-[rgba(255,255,255,0.1)] shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:bg-[rgba(255,255,255,0.08)] hover:scale-105'}`} 
      onClick={() => {
        if (url_params.communityId == communityId) return
        const channel_id = CommunityChannelMap[communityId]
        navigate(`/chats/${communityId}/${channel_id ? channel_id : ''}`)
      }}
    >
      <span className={`text-[20px] font-bold uppercase select-none ${isActive ? 'text-[#1F4D3A]' : 'text-[#DDE6E0]'}`}>
        {communityName ? communityName[0].toUpperCase() : 'C'}
      </span>
    </div>
  )
}

export default CommunityTab
