import { useRef } from "react"
import UserProfile from "./GroupBar Components/UserProfile"
import CommunityTab from "./GroupBar Components/CommunityTab"
import ScrollBar from "../../common components/ScrollBar"

const GroupBar = ({ username, email, communities }) => {
  const scrollbarRef = useRef(null)

  return (
    <div className="w-[72px] bg-[#F9F7F4] border-r border-[#E8E4DE] border-opacity-60 flex flex-col items-center py-4 h-full">

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
          {communities.map((community, index) => (
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
