import { MessageSquare, Compass, UserPlus } from 'lucide-react'

const EmptyChatSection = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-transparent p-8">
      {/* Soft glassmorphic container */}
      <div className="flex flex-col items-center max-w-2xl w-full bg-white/40 backdrop-blur-md rounded-3xl p-12 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
        
        {/* Icon / Illustration area */}
        <div className="w-24 h-24 mb-6 rounded-[2rem] bg-gradient-to-br from-[var(--sc-tertiary)] to-[var(--sc-primary)] flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-500">
          <MessageSquare className="text-white w-10 h-10" />
        </div>
        
        {/* Text content */}
        <h2 className="text-3xl font-headline font-bold text-[var(--sc-on-surface)] leading-tight mb-3">
          The Canvas Awaits
        </h2>
        <p className="text-[var(--sc-on-surface-variant)] text-center max-w-md mb-10 text-sm leading-relaxed">
          You've entered a new space for collaboration. Select an existing channel from the sidebar or start something entirely new.
        </p>
        
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <button className="flex items-start gap-4 p-5 rounded-2xl bg-white/60 hover:bg-white/90 border border-white/60 hover:border-[var(--sc-outline-variant)] shadow-sm hover:shadow-md transition-all group text-left">
            <div className="w-10 h-10 rounded-xl bg-[var(--sc-primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Compass className="w-5 h-5 text-[var(--sc-primary)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--sc-on-surface)] text-sm mb-1">Browse Channels</h3>
              <p className="text-xs text-[var(--sc-on-surface-variant)]">Discover ongoing conversations</p>
            </div>
          </button>
          
          <button className="flex items-start gap-4 p-5 rounded-2xl bg-white/60 hover:bg-white/90 border border-white/60 hover:border-[var(--sc-outline-variant)] shadow-sm hover:shadow-md transition-all group text-left">
            <div className="w-10 h-10 rounded-xl bg-[var(--sc-tertiary)]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5 text-[var(--sc-tertiary)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--sc-on-surface)] text-sm mb-1">Invite Teammates</h3>
              <p className="text-xs text-[var(--sc-on-surface-variant)]">Bring your team into the fold</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export { EmptyChatSection }