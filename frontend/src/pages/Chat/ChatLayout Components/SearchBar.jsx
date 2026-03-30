import { Search } from 'lucide-react'
import { useContext } from 'react'
import { ChatLayout_Context } from "../../../contexts/ChatLayout-context-provider"

const SearchBar = () => {
  const { CommunityChannels } = useContext(ChatLayout_Context)

  return (
    <div className="px-2 py-2 bg-[var(--sc-bg-secondary)] border-b border-[var(--sc-border)] flex-shrink-0">
      <div className="relative flex items-center">
        <Search className="absolute left-2 w-3 h-3 text-[var(--sc-text-muted)] pointer-events-none" />
        <input
          type="text"
          placeholder="Find a channel..."
          // onChange={(e) => setChannelFilter(e.target.value)}
          className="w-full h-7 pl-6 pr-2 rounded-md text-xs bg-[var(--sc-bg-tertiary)] border border-[var(--sc-border)] text-[var(--sc-text-primary)] placeholder:text-[var(--sc-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--sc-accent)] focus:border-transparent transition-shadow"
        />
      </div>
    </div>
  )
}

export default SearchBar