import { useContext } from 'react'
import { ChatLayout_Context } from '../../../contexts/ChatLayout-context-provider'
import { useNavigate, useParams } from 'react-router-dom'
import { EllipsisVertical, Video, Hash, LogOut } from 'lucide-react'
import FloatingDiv from '../../common components/FloatingDiv'
import { leave_channel } from '../../../services/channel_services'

const ChatHeader = ({queryClient}) => {
  const navigate = useNavigate()
  const url_params = useParams()
  const {LeaveChannel_cb}=useContext(ChatLayout_Context)

  return (
    <div className="h-12 flex-shrink-0 bg-[var(--sc-bg-elevated)] border-b border-[var(--sc-border)] flex items-center px-4 justify-between">

      {/* Left: channel name */}
      <div className="flex items-center gap-2">
        <Hash className="w-4 h-4 text-[var(--sc-text-muted)]" />
        <span className="text-[var(--sc-text-primary)] font-semibold text-sm">
          {url_params.channelId ? `Channel ${url_params.channelId}` : 'Channel'}
        </span>
      </div>

      {/* Right: FloatingDiv trigger — all FloatingDiv logic preserved */}
      <FloatingDiv
        ToggleButtonComponent={() => (
          <div className="p-1.5 rounded-md hover:bg-[var(--sc-bg-tertiary)] text-[var(--sc-text-muted)] hover:text-[var(--sc-text-secondary)] transition-colors cursor-pointer">
            <EllipsisVertical className="w-4 h-4" />
          </div>
        )}
        content_parent_classes=""
        button_parent_styles=""
      >
        {/* Dropdown panel */}
        <div className="bg-[var(--sc-bg-elevated)] border border-[var(--sc-border)] rounded-lg shadow-sm p-1 min-w-[160px] m-1">
          {/* Video Call menu item — exact onClick preserved */}
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[var(--sc-text-primary)] hover:bg-[var(--sc-bg-tertiary)] cursor-pointer select-none transition-colors"
            onClick={() => navigate(`/chats/${url_params.communityId}/${url_params.channelId}/videocall`)}
          >
            <Video className="w-4 h-4 text-[var(--sc-text-secondary)]" />
            <span>Video Call</span>
          </div>

          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[var(--sc-text-primary)] hover:bg-[var(--sc-bg-tertiary)] cursor-pointer select-none transition-colors close-floating"
            onClick={() =>{
              navigate(`/chats/${url_params.communityId}/`)
              leave_channel(url_params.communityId, url_params.channelId).then((response)=>{
                if(response.Success===true){
                  if(typeof(LeaveChannel_cb)==="function" && LeaveChannel_cb.name==="bound refetch"){
                    LeaveChannel_cb()
                    queryClient?.removeQueries({queryKey:["messages", url_params.communityId, url_params.channelId]})
                  }
                }
              }).catch((e)=>{
                console.error(e)
              })
            }}
          >
            <LogOut className="w-4 h-4 text-[#ea0000]" />
            <span className='text-[#ea0000]'>Leave Channel</span>
          </div>

        </div>
      </FloatingDiv>

    </div>
  )
}

export default ChatHeader