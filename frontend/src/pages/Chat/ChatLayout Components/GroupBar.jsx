import { useRef, useContext, useEffect, useState } from "react"
import UserProfile from "./GroupBar Components/UserProfile"
import CommunityTab from "./GroupBar Components/CommunityTab"
import ScrollBar from "../../common components/ScrollBar"
import { Sun, Moon, PlusIcon, SearchIcon } from "lucide-react"
import { Global_Context } from "../../../contexts/Global-context-provider"
import { ChatLayout_Context } from "../../../contexts/ChatLayout-context-provider"
import FloatingDiv from "../../common components/FloatingDiv"
import { create_community } from "../../../services/community_services"
import { useNavigate } from "react-router-dom"
import {get_communities} from "../../../services/user_services"
import { search_communities } from "../../../services/community_services"

const SearchCommunities=({already_joined_communities})=>{
  
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [communityList, setCommunityList]=useState([])
  const Empty_Input=()=>{
    setQuery("")
    setCommunityList([])
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms delay

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
    <div className="w-8 h-8 rounded-lg bg-[#02a1ac] flex items-center justify-center mb-3 flex-shrink-0 select-none"
      >

      <FloatingDiv
        ToggleButtonComponent={() => (
          <SearchIcon className="!size-[1.3rem] cursor-pointer"/>
        )}
        content_parent_classes=""
        button_parent_styles=""
        cleanup_method={Empty_Input}
      >
        {/* Dropdown panel */}
        <div className="mx-3 my-1 flex flex-col items-center bg-[var(--sc-bg-elevated)] border border-[var(--sc-border)] rounded-lg shadow-sm p-1 min-w-fit">
        
          <input type="text" placeholder=" ...Search Communities" className="mx-1 my-1.5 px-2 py-1 outline-0 bg-[#464646] rounded-[0.4rem]"
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          />

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
                <div className="flex items-center px-3 py-1 rounded-md text-sm text-[var(--sc-text-primary)] select-none transition-colors w-full bg-[var(--sc-bg-tertiary)] my-1"
                key={index}
                >
                  <span className="mr-auto">{value.community_name}</span>
                  {!joined_community?
                    (
                      <div className="w-fit bg-blue-400 px-1.5 py-1 rounded-[0.5rem]">
                        Join
                      </div>
                    ):(
                      <div className="w-fit text-[#006eff] px-1.5 py-1 rounded-[0.5rem]">
                        Joined
                      </div>
                    )
                  }
                </div>
              )
            })
          }

        </div>
      </FloatingDiv>

      </div>
  )
}


const CreateCommunity=({AddedCommunity, setAddedCommunity})=>{

  const InputRef=useRef("")
  const [InputString, setInputString]=useState('')
  const TextUpdate=(e)=>{
    // console.log(InputRef.current.value.length)
    setInputString(e.target.value)
  }

  const navigate=useNavigate()
  // console.log("hi")
  return (
    <div className="w-8 h-8 rounded-lg bg-[var(--sc-accent)] flex items-center justify-center mb-3 flex-shrink-0 select-none"
      >

      <FloatingDiv
        ToggleButtonComponent={() => (
          <PlusIcon className="cursor-pointer"/>
        )}
        content_parent_classes=""
        button_parent_styles=""
      >
        {/* Dropdown panel */}
        <div className="mx-3 my-1 flex flex-col items-center bg-[var(--sc-bg-elevated)] border border-[var(--sc-border)] rounded-lg shadow-sm p-1 min-w-fit">
        
          <div
            className="flex flex-row"
          >
            <input ref={InputRef} type="text" placeholder="Community name" className="mx-1 my-1.5 px-2 py-1 outline-0 bg-[#464646] rounded-[0.4rem]"
            onChange={(e)=>{TextUpdate(e)}}
            />
            <button
              className={`px-2 py-0.5 mx-1 rounded-lg flex items-center justify-center bg-[var(--sc-bg-tertiary)] transition-colors cursor-pointer
              ${InputString.length>0?"text-green-400":"text-red-400"}  
              `}
              disabled={InputString.length>0?false:true}
              onClick={()=>{
                setInputString('')
                create_community(InputString).then((response)=>{
                  if(response.Success==true){
                    navigate(`/chats/${response.NewCommId}`)
                    setAddedCommunity(!AddedCommunity)
                    console.log("Community Created")
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
      </FloatingDiv>

      </div>
  )
}



const GroupBar = ({ username, email }) => {
  const scrollbarRef = useRef(null)
  const [communities, setUserCommunities]=useState(null)
  const [AddedCommunity, setAddedCommunity]=useState(false)
  const { theme, toggleTheme } = useContext(Global_Context)
  const {LeftCommunity}=useContext(ChatLayout_Context)

  useEffect(()=>{
    get_communities().then(
            (comms)=>{
                // console.log("fetched communities: ",comms.UserCommunities)
                setUserCommunities(comms.UserCommunities)
            }
        ).catch((e)=>{
            console.log("Error getting communities: ")
            console.error(e)
        })
    
    // console.log("First Mount")
  },[AddedCommunity, LeftCommunity])

  return (
    <div className="w-[72px] bg-[#F9F7F4] border-r border-[#E8E4DE] border-opacity-60 flex flex-col items-center py-4 h-full">

      {/* AddCommunity */}
      <CreateCommunity
        AddedCommunity={AddedCommunity}
        setAddedCommunity={setAddedCommunity}
      />

      {/* Search Communities */}
      <SearchCommunities
        already_joined_communities={communities}
      />
      {/* Logo */}
      <div className="mb-6">
        <svg className="w-8 h-8 fill-[#2F5D50]" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="12" r="3" />
          <circle cx="12" cy="18" r="3" />
        </svg>
      </div>

      {/* Community tabs */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col items-center gap-3">
        <ScrollBar ref={scrollbarRef} className="w-[72px]">
          {communities && 
          communities.map((community, index) => (
            <CommunityTab key={index} communityId={community.community_id} communityName={community.community_name} />
          ))}
        </ScrollBar>
      </div>

      {/* User profile */}
      <div className="mt-auto flex flex-col items-center pb-2">
        <UserProfile username={username} email={email} />
      </div>

    </div>
  )
}

export default GroupBar
