import { useParams, useNavigate } from "react-router-dom"
import ChannelTag from "./ChannelsPanel Components/ChannelTag"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { get_community_channels } from "../../../services/community_services"
import { leave_community } from "../../../services/community_services"
import ScrollBar from "../../common components/ScrollBar"
import { useEffect, useRef, useContext, useState } from "react"
import { ChevronDown,Search, Plus, LogOut, Check } from "lucide-react"
import { ChatLayout_Context } from "../../../contexts/ChatLayout-context-provider"
import SearchBar from "./SearchBar"
import FloatingDiv from "../../common components/FloatingDiv"
import { create_channel } from "../../../services/channel_services"
import CenterFloatingDiv from "../../common components/CenterFloatingDiv"

const OptionsBar = ({CommunityName, CommunityId, queryClient, refetchChannels}) => {
  const navigate=useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [channel_name, setChannelName]=useState('')
  const { setLeftCommunity, setLeftCommunityRender, LeftCommunityRender } = useContext(ChatLayout_Context)
  
  const ChannelNameInputUpdate=(e)=>{
    setChannelName(e.target.value)
  }

  return (
    <div className="h-14 flex-shrink-0 bg-transparent flex items-center justify-between px-6 border-b border-black/[0.05] select-none">
      <p className="text-lg font-bold text-gray-900 truncate">
        {CommunityName || "Channels"}
      </p>
      
      {showCreateModal && (
        <CenterFloatingDiv parent_classes="flex flex-col min-w-[350px]" setOpen={setShowCreateModal}>
          <div className="p-6">
             <h2 className="text-xl font-bold mb-6 text-[var(--sc-on-surface)]">Create Channel</h2>
             <div className="mb-6">
                <label className="block text-xs font-semibold text-[var(--sc-on-surface-variant)] uppercase tracking-wider mb-2">Channel Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. general" 
                  className="w-full px-4 py-3 outline-none bg-[var(--sc-surface-low)] rounded-xl border border-[var(--sc-outline-variant)] focus:border-[var(--sc-primary)] transition-colors text-sm"
                  onChange={(e)=>{ChannelNameInputUpdate(e)}}
                />
             </div>
             <div className="flex justify-end gap-3 mt-4">
                <button 
                  className="px-5 py-2 text-sm font-semibold text-[var(--sc-on-surface-variant)] hover:bg-[var(--sc-surface-low)] rounded-xl transition-colors"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${channel_name.length>0 ? 'bg-[var(--sc-primary)] text-white hover:opacity-90' : 'bg-[var(--sc-surface-variant)] text-[var(--sc-on-surface-variant)] cursor-not-allowed opacity-60'}`}
                  disabled={channel_name.length===0}
                  onClick={()=>{
                      setChannelName('')
                      create_channel(CommunityId, channel_name).then((response)=>{
                        if(response.Success===true){
                          refetchChannels()
                          setShowCreateModal(false)
                        }
                      }).catch((e)=>{
                        console.error(e)
                      })
                  }}
                >
                  Create
                </button>
             </div>
          </div>
        </CenterFloatingDiv>
      )}

      {showLeaveModal && (
        <CenterFloatingDiv parent_classes="flex flex-col min-w-[350px]" setOpen={setShowLeaveModal}>
          <div className="p-6">
             <h2 className="text-xl font-bold mb-2 text-red-500">Leave Community?</h2>
             <p className="text-sm text-[var(--sc-on-surface-variant)] mb-6">Are you sure you want to leave this community? You will lose access to all channels and messages.</p>
             <div className="flex justify-end gap-3 mt-4">
                <button 
                  className="px-5 py-2 text-sm font-semibold text-[var(--sc-on-surface-variant)] hover:bg-[var(--sc-surface-low)] rounded-xl transition-colors"
                  onClick={() => setShowLeaveModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm bg-red-500 text-white hover:bg-red-600"
                  onClick={async ()=>{
                    setShowLeaveModal(false)
                    await navigate("/chats")
                    if(CommunityId){
                      leave_community(CommunityId).then((response)=>{
                        if(response.Success===true){
                          setLeftCommunity(CommunityId)
                          setLeftCommunityRender(!LeftCommunityRender)
                          
                          // Immediate UI removal from sidebar
                          queryClient.setQueryData(["communities"], (old) => 
                            old ? old.filter(c => c.community_id !== CommunityId) : []
                          )

                          queryClient.removeQueries({queryKey: ["community_channels", CommunityId]})
                          queryClient.removeQueries({queryKey: ["messages", CommunityId]})
                        }
                      }).catch((e)=>{
                        console.error(e)
                      })
                    }
                  }}
                >
                  Leave
                </button>
             </div>
          </div>
        </CenterFloatingDiv>
      )}

      { CommunityId &&
      <FloatingDiv
        ToggleButtonComponent={() => (
          <div className="w-8 h-8 rounded-full bg-[#EAEBEA] flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
            <span className="text-lg font-medium text-gray-700 leading-none -mt-0.5">+</span>
          </div>
        )}
        content_parent_classes=""
        button_parent_styles_tailwind="flex justify-center items-center h-full"
      >
        <div className="mx-3 my-1 flex flex-col bg-[rgba(255,255,255,0.6)] backdrop-blur-[12px] border border-black/[0.06] rounded-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] p-1.5 min-w-[200px] overflow-hidden">
          <button
            className="flex items-center gap-2.5 px-[14px] py-[10px] rounded-[10px] hover:bg-black/[0.05] text-[14px] font-medium w-full text-left text-gray-800 close-floating transition-colors cursor-pointer mb-0.5"
            onClick={()=>{
              setShowCreateModal(true)
            }}
          >
            <Plus className="w-4 h-4 text-gray-800" />
            <span>Create Channel</span>
          </button>

          <button
            className="flex items-center gap-2.5 px-[14px] py-[10px] rounded-[10px] hover:bg-black/[0.05] text-[14px] font-medium w-full text-left text-[#dc2626] close-floating transition-colors cursor-pointer"
            onClick={()=>{
              setShowLeaveModal(true)
            }}
          >
            <LogOut className="w-4 h-4 text-[#dc2626]" />
            <span>Leave Community</span>
          </button>
        </div>
      </FloatingDiv>
      }
    </div>
  )
}




const ChannelsPanel = () => {
  const {communityId, channelId} = useParams()
  const scrollbarRef=useRef(null)

  const { setCommunityChannels, LeftChannel, LeftChannelRender } = useContext(ChatLayout_Context)

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
    if(!LeftChannel?.communityId || !LeftChannel?.channelId) return
    queryClient?.removeQueries({queryKey:["messages", LeftChannel.communityId, LeftChannel.channelId]})
    refetch()
  },[LeftChannel, LeftChannelRender])


  if(isError){
    if(error.status==403){
      throw error
    }
    console.log(error.status)
  }


  return (
  <div className="flex flex-col w-[280px] h-full">
    
    <OptionsBar 
    CommunityName={data?.CommunityName||"Community"} 
    CommunityId={communityId} 
    queryClient={queryClient}
    refetchChannels={refetch}
    />

    <SearchBar joined_Channels={data?.Channels} refetchChannels={refetch}/>

    <div className="bg-transparent w-full h-full flex flex-col overflow-hidden pt-4 px-4 pb-2">

      <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--sc-on-surface-variant)] mb-4 ml-2">
        Channels
      </p>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Channel list */}
        {
          (isLoading && communityId)?
          (
            <div className="flex-1 overflow-hidden">
              ...Loading Channels
            </div>
          ):
          (
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
          )
        }

    </div>
  </div>
  </div>
  )
}

export default ChannelsPanel