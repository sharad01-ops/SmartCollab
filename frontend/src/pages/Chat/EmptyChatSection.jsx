import { Hash } from 'lucide-react'

const EmptyChatSection = () => {
  return (
    <div className="flex-1 h-full bg-[var(--sc-bg-primary)] flex flex-col items-center justify-center select-none">
      <div className="flex flex-col items-center gap-3 opacity-40">
        <Hash className="w-12 h-12 text-[var(--sc-text-muted)]" strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-[var(--sc-text-primary)] font-medium text-sm">No channel selected</p>
          <p className="text-[var(--sc-text-muted)] text-xs mt-1">Pick a channel from the sidebar to start chatting</p>
        </div>
      </div>
    </div>
  )
}

export { EmptyChatSection }