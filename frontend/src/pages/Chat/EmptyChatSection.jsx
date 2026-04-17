import { MessageSquare } from 'lucide-react'

const EmptyChatSection = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#F5F3EF]">
      <MessageSquare className="text-[#E8E4DE]" style={{ fontSize: '5rem', opacity: 0.5 }} />
      <p className="text-[#8A817C] text-sm mt-4 font-medium">Select a channel to start collaborating</p>
    </div>
  )
}

export { EmptyChatSection }