import { useRef, useContext, useEffect, useState } from "react"
import UserProfile from "./GroupBar Components/UserProfile"
import CommunityTab from "./GroupBar Components/CommunityTab"
import ScrollBar from "../../common components/ScrollBar"
import { Plus, Search as SearchIcon, Users } from "lucide-react"
import { Global_Context } from "../../../contexts/Global-context-provider"
import { ChatLayout_Context } from "../../../contexts/ChatLayout-context-provider"
import FloatingDiv from "../../common components/FloatingDiv"
import CenterFloatingDiv from "../../common components/CenterFloatingDiv"
import { create_community } from "../../../services/community_services"
import { useNavigate } from "react-router-dom"
import { get_communities } from "../../../services/user_services"
import { search_communities, join_community } from "../../../services/community_services"
import { useQuery, useQueryClient } from "@tanstack/react-query"

const SearchCommunitiesModal = ({already_joined_communities, setShowModal}) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [communityList, setCommunityList]=useState([])
  const navigate=useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if(debouncedQuery.length===0){
      setQuery("")
      setCommunityList([])
    }
    if (!debouncedQuery) return;
    search_communities(debouncedQuery).then((response)=>{
      setCommunityList([...response])
    }).catch((e)=>{
      console.error(e)
    })
  }, [debouncedQuery]);

  return (
    <CenterFloatingDiv setOpen={setShowModal} parent_classes="flex flex-col min-w-[400px]">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4 text-[var(--sc-on-surface)] flex items-center gap-2">
          <SearchIcon className="w-5 h-5 text-[var(--sc-primary)]" />
          Search Communities
        </h2>
        <div className="flex flex-col mb-4 bg-[var(--sc-surface-low)] rounded-xl border border-[var(--sc-outline-variant)]">
          <input 
            type="text" 
            placeholder="Type community name..." 
            className="w-full px-4 py-3 outline-none bg-transparent rounded-xl text-sm"
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
        </div>
        
        <div className="max-h-[300px] overflow-y-auto w-full custom-scrollbar flex flex-col gap-2">
          {communityList.length === 0 && debouncedQuery && (
             <div className="text-center text-sm text-[var(--sc-on-surface-variant)] py-4">No communities found.</div>
          )}
          {
            communityList.map((value, index)=>{
              let joined_community=false
              for(const joined_comm of already_joined_communities){
                if(joined_comm.community_id===value.community_id){
                  joined_community=true
                  break
                }
              }
              return(
                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--sc-outline-variant)] hover:bg-[var(--sc-surface-low)] transition-colors"
                key={index}
                >
                  <span className="font-semibold text-[var(--sc-on-surface)] text-sm">{value.community_name}</span>
                  {!joined_community?
                    (
                      <button className="bg-[var(--sc-primary)] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                      onClick={()=>{
                        join_community(value.community_id).then((response)=>{
                          if(response.Success===true){
                            queryClient.invalidateQueries({ queryKey: ["communities"] })
                            navigate(`/chats/${response.NewCommId}`)
                            setShowModal(false)
                          }
                        }).catch((error)=>{
                          console.error(error)
                        })
                      }}
                      >
                        Join
                      </button>
                    ):(
                      <div className="text-[var(--sc-tertiary)] bg-[var(--sc-tertiary)]/10 px-3 py-1.5 text-xs font-bold rounded-lg">
                        Joined
                      </div>
                    )
                  }
                </div>
              )
            })
          }
        </div>
      </div>
    </CenterFloatingDiv>
  )
}

const CreateCommunityModal = ({setShowModal}) => {
  const [InputString, setInputString]=useState('')
  const navigate=useNavigate()
  const queryClient = useQueryClient()

  return (
    <CenterFloatingDiv setOpen={setShowModal} parent_classes="flex flex-col min-w-[350px]">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 text-[var(--sc-on-surface)] flex items-center gap-2">
          <Plus className="w-5 h-5 text-[var(--sc-primary)]" />
          Create Community
        </h2>
        <div className="mb-6">
          <label className="block text-xs font-semibold text-[var(--sc-on-surface-variant)] uppercase tracking-wider mb-2">Community Name</label>
          <input 
            type="text" 
            placeholder="e.g. Acme Design Team" 
            className="w-full px-4 py-3 outline-none bg-[var(--sc-surface-low)] rounded-xl border border-[var(--sc-outline-variant)] focus:border-[var(--sc-primary)] transition-colors text-sm"
            value={InputString}
            onChange={(e)=>{setInputString(e.target.value)}}
          />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button 
            className="px-5 py-2 text-sm font-semibold text-[var(--sc-on-surface-variant)] hover:bg-[var(--sc-surface-low)] rounded-xl transition-colors"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </button>
          <button
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${InputString.length>0 ? 'bg-[var(--sc-primary)] text-white hover:opacity-90' : 'bg-[var(--sc-surface-variant)] text-[var(--sc-on-surface-variant)] cursor-not-allowed opacity-60'}`}
            disabled={InputString.length === 0}
            onClick={()=>{
              create_community(InputString).then((response)=>{
                if(response.Success==true){
                  queryClient.invalidateQueries({ queryKey: ["communities"] })
                  navigate(`/chats/${response.NewCommId}`)
                  setShowModal(false)
                }
              }).catch((error)=>{
                console.error(error)
              })
            }}
          >
            Create
          </button>
        </div>
      </div>
    </CenterFloatingDiv>
  )
}

const GroupBar = ({ username, email }) => {
  const scrollbarRef = useRef(null)
  const { theme, toggleTheme } = useContext(Global_Context)
  const {LeftCommunityRender}=useContext(ChatLayout_Context)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  
  const queryClient = useQueryClient()

  const { data: communitiesData, isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const response = await get_communities()
      return response.UserCommunities || []
    },
    staleTime: 1000 * 60 * 5
  })

  // Re-fetch on global triggers
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["communities"] })
  }, [LeftCommunityRender])

  return (
    <div className="w-full flex flex-col items-center gap-[12px] py-4 h-full overflow-hidden">

      <div className="w-[44px] h-[44px] flex-shrink-0 rounded-[14px] flex items-center justify-center bg-transparent hover:bg-[rgba(255,255,255,0.08)] hover:scale-105 active:bg-[#E6D3B3] active:shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-250 cursor-pointer group">
        <svg className="w-[20px] h-[20px] fill-[#DDE6E0] group-hover:fill-white group-active:fill-[#1F4D3A] transition-colors" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="12" r="3" />
          <circle cx="12" cy="18" r="3" />
        </svg>
      </div>

      <FloatingDiv
        ToggleButtonComponent={() => (
          <div className="w-[52px] h-[52px] flex-shrink-0 rounded-[16px] flex items-center justify-center bg-[rgba(255,255,255,0.08)] backdrop-blur-[8px] shadow-[0_8px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:scale-[1.08] transition-all duration-250 cursor-pointer group">
            <Plus className="w-[20px] h-[20px] flex-shrink-0 text-[#DDE6E0] group-hover:text-white transition-colors" strokeWidth={2} />
          </div>
        )}
        content_parent_classes=""
        button_parent_styles_tailwind=""
      >
        <div className="mx-3 my-1 flex flex-col bg-[rgba(255,255,255,0.85)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.5)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] min-w-[200px] overflow-hidden">
          <button 
            className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(0,0,0,0.04)] transition-colors text-[13px] font-semibold text-gray-800 close-floating text-left"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="w-8 h-8 rounded-full bg-[var(--sc-primary)]/10 flex items-center justify-center text-[var(--sc-primary)]">
              <Plus className="w-4 h-4" />
            </div>
            Create Community
          </button>
          
          <button 
            className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(0,0,0,0.04)] transition-colors border-t border-[rgba(0,0,0,0.05)] text-[13px] font-semibold text-gray-800 close-floating text-left"
            onClick={() => setShowSearchModal(true)}
          >
            <div className="w-8 h-8 rounded-full bg-[var(--sc-tertiary)]/10 flex items-center justify-center text-[var(--sc-tertiary)]">
              <SearchIcon className="w-4 h-4" />
            </div>
            Search Communities
          </button>
        </div>
      </FloatingDiv>

      {/* Community list */}
      <div className="flex-1 w-full min-h-0 overflow-hidden">
        <ScrollBar ref={scrollbarRef}>
          <div className="flex flex-col items-center gap-[12px] w-full">
            {communitiesData && communitiesData.map((community) => (
              <CommunityTab
                key={community.community_id}
                communityId={community.community_id}
                communityName={community.community_name}
              />
            ))}
          </div>
        </ScrollBar>
      </div>

      {/* Divider */}
      <div className="w-6 h-px bg-white/20 mt-2 mb-2 flex-shrink-0" />

      {/* User profile */}
      <div className="flex-shrink-0 mt-auto" title={`${username}\n${email}`}>
        <UserProfile username={username} email={email} />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateCommunityModal 
          setShowModal={setShowCreateModal} 
        />
      )}
      
      {showSearchModal && (
        <SearchCommunitiesModal 
          already_joined_communities={communitiesData || []} 
          setShowModal={setShowSearchModal} 
        />
      )}
    </div>
  )
}

export default GroupBar