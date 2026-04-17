import { Search } from 'lucide-react'
import { useContext } from 'react'
import { ChatLayout_Context } from "../../../contexts/ChatLayout-context-provider"

const SearchBar = () => {
  const { CommunityChannels } = useContext(ChatLayout_Context)

  return (
    <div className="px-3 py-3 bg-[var(--sc-surface-low)] flex-shrink-0">
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Find a channel..."
          className="w-full h-9 pl-10 pr-3 rounded-2xl text-sm bg-gray-50/50 text-[var(--sc-on-surface)] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/5 transition-all"
        />
      </div>
    </div>
  )
}

export default SearchBar
