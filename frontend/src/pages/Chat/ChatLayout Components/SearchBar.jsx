import { Search } from 'lucide-react'
import { useContext, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ChatLayout_Context } from "../../../contexts/ChatLayout-context-provider"
import { search_channels } from '../../../services/channel_services'

const SearchBar = ({joined_Channels}) => {
  const { CommunityChannels } = useContext(ChatLayout_Context)
  const {communityId}=useParams()
  const [query, setQuery] = useState("");

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [channelList, setChannelList]=useState([])
  const Empty_Input=()=>{
    setQuery("")
    setChannelList([])
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
    <div className="px-2 py-2 bg-[var(--sc-bg-secondary)] border-b border-[var(--sc-border)] flex-shrink-0 relative">
          
      <div className="relative flex items-center">
        <Search className="absolute left-2 w-3 h-3 text-[var(--sc-text-muted)] pointer-events-none" />
        <input
          type="text"
          placeholder="Find a channel..."
          // onChange={(e) => setChannelFilter(e.target.value)}
          className="w-full h-7 pl-6 pr-2 rounded-md text-xs bg-[var(--sc-bg-tertiary)] border border-[var(--sc-border)] text-[var(--sc-text-primary)] placeholder:text-[var(--sc-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--sc-accent)] focus:border-transparent transition-shadow"
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
        />
      </div>

      <div className={` flex flex-col top-10 left-0 right-0 px-1.5 py-1 mx-2 rounded-[0.3rem] bg-[#0f0f10] z-[10] ${debouncedQuery.length===0?" hidden":"absolute"}`}>
        {joined_Channels &&
          channelList.length>0?(
          channelList.map((value, index)=>{
            let joined_channel=false
            for(const joined_chann of joined_Channels){
              if(joined_chann.channel_id===value.channel_id){
                joined_channel=true
                break
              }
            }
            return(
              <div className="flex items-center px-3 py-1 rounded-md text-sm text-[var(--sc-text-primary)] select-none w-full bg-[#212124] my-1 border  border-[var(--sc-border)]"
              key={index}
              >
                <span className="mr-auto">{value.channel_name}</span>
                {!joined_channel && 
                  (
                    <div className="w-fit bg-blue-400 px-1.5 py-1 rounded-[0.5rem]">
                      Join
                    </div>
                  )
                }
              </div>
            )
          })):(
            <div className="flex items-center px-3 py-1 rounded-md text-sm text-[var(--sc-text-primary)] select-none w-full bg-[#212124] my-1 border  border-[var(--sc-border)]"
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