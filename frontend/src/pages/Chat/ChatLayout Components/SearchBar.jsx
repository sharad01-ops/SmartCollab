import { Search } from 'lucide-react'
import { useContext, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChatLayout_Context } from "../../../contexts/ChatLayout-context-provider"
import { search_channels, join_channel } from '../../../services/channel_services'

const SearchBar = ({joined_Channels, refetchChannels}) => {
  const { CommunityChannels } = useContext(ChatLayout_Context)
  const {communityId}=useParams()
  const [query, setQuery] = useState("");
  const navigate=useNavigate()
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [channelList, setChannelList]=useState([])
  const Empty_Input=()=>{
    setChannelList([])
    setQuery("")
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
      setChannelList([])
    }
    if (!debouncedQuery) return;
    search_channels(communityId,debouncedQuery).then((response)=>{
      setChannelList([...response])
    }).catch((e)=>{
      console.error(e)
    })
  }, [debouncedQuery]);

  return (
    <div className="px-4 py-3 bg-white flex-shrink-0 relative">
      
      <div className="relative flex items-center">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Find a channel..."
          // onChange={(e) => setChannelFilter(e.target.value)}
          className="w-full bg-[#F9F7F4] border-none rounded-xl py-3 pl-12 pr-4 text-sm text-gray-900 placeholder:text-[#8A817C]"
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
        />
      </div>

      <div className={` flex flex-col top-15 left-0 right-0 px-1.5 py-1 mx-2 rounded-[0.3rem] bg-white z-[10] border  ${query.length===0?" hidden":"absolute"}`}>
        {joined_Channels &&
          channelList.length>0 ?(
          channelList.map((value, index)=>{
            console.log(value)
            let joined_channel=false
            for(const joined_chann of joined_Channels){
              if(joined_chann.channel_id===value.channel_id){
                joined_channel=true
                break
              }
            }
            return(
              <div className="flex items-center px-3 py-1 rounded-md text-sm text-[#2f5d50] select-none w-full bg-[#f4e6c8] my-1 border  border-[var(--sc-border)]"
              key={index}
              >
                <span className="mr-auto">{value.channel_name}</span>
                {!joined_channel && 
                  (
                    <div className="w-fit bg-blue-400 px-1.5 py-1 rounded-[0.5rem]"
                    onClick={()=>{
                      Empty_Input()
                      join_channel(value.community_id, value.channel_id).then((response)=>{
                        if(response.Success===true){
                          navigate(`/chats/${value.community_id}/${value.channel_id}`)
                          refetchChannels()
                        }
                      }).catch((err)=>{
                        console.log(err)
                      })
                    }}
                    >
                      Join
                    </div>
                  )
                }
              </div>
            )
          })):(
            <div className="flex items-center px-3 py-1 rounded-md text-sm text-[var(--sc-text-primary)] select-none w-full bg-[#f4e6c8] my-1 border  border-[var(--sc-border)]"
              >
                <span className="mr-auto">No Results</span>
                
              </div>
          )
        }
      </div>


    </div>
  )
}

export default SearchBar
