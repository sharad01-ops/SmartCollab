import { useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

const OptionsBar = () => {
  const { communityId } = useParams()

  return (
    <div className="h-11 flex-shrink-0 bg-[var(--sc-bg-secondary)] border-b border-[var(--sc-border)] flex items-center justify-between px-3">
      <span className="text-[var(--sc-text-primary)] font-semibold text-sm truncate">
        {communityId ? `Community ${communityId}` : 'SmartCollab'}
      </span>
      <ChevronDown className="w-4 h-4 text-[var(--sc-text-muted)] flex-shrink-0 cursor-pointer hover:text-[var(--sc-text-secondary)] transition-colors" />
    </div>
  )
}

export default OptionsBar