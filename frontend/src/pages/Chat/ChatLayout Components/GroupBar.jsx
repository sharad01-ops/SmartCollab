import { useRef, useContext } from "react"
import UserProfile from "./GroupBar Components/UserProfile"
import CommunityTab from "./GroupBar Components/CommunityTab"
import ScrollBar from "../../common components/ScrollBar"
import { Sun, Moon } from "lucide-react"
import { Global_Context } from "../../../contexts/Global-context-provider"

const GroupBar = ({ username, email, communities }) => {
  const scrollbarRef = useRef(null)
  const { theme, toggleTheme } = useContext(Global_Context)

  return (
    <div className="w-12 h-full bg-[var(--sc-bg-secondary)] flex flex-col items-center py-2 border-r border-[var(--sc-border)] flex-shrink-0">

      {/* Logo */}
      <div className="w-8 h-8 rounded-lg bg-[var(--sc-accent)] flex items-center justify-center mb-3 flex-shrink-0 select-none">
        <span className="font-[Jersey10Regular] text-white text-sm leading-none">SC</span>
      </div>

      {/* Divider */}
      <div className="w-6 h-px bg-[var(--sc-border)] mb-2 flex-shrink-0" />

      {/* Community list */}
      <div className="flex-1 w-full min-h-0 overflow-hidden">
        <ScrollBar ref={scrollbarRef}>
          {communities.map((community, index) => (
            <CommunityTab
              key={index}
              communityId={community.community_id}
              communityName={community.community_name}
            />
          ))}
        </ScrollBar>
      </div>

      {/* Divider */}
      <div className="w-6 h-px bg-[var(--sc-border)] mt-2 mb-2 flex-shrink-0" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-[var(--sc-text-muted)] hover:text-[var(--sc-text-primary)] hover:bg-[var(--sc-bg-tertiary)] transition-colors flex-shrink-0"
      >
        {theme === 'dark'
          ? <Sun className="w-4 h-4" />
          : <Moon className="w-4 h-4" />
        }
      </button>

      {/* User profile */}
      <div className="flex-shrink-0" title={`${username}\n${email}`}>
        <UserProfile username={username} email={email} />
      </div>

    </div>
  )
}

export default GroupBar