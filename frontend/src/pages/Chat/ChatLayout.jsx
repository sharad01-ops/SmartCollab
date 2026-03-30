import { useContext, useEffect, useState } from "react"
import { Outlet, useParams } from "react-router-dom"
import { ChatLayout_Context } from "../../contexts/ChatLayout-context-provider"
import GroupBar from "./ChatLayout Components/GroupBar"
import OptionsBar from "./ChatLayout Components/OptionsBar"
import SearchBar from "./ChatLayout Components/SearchBar"
import ChannelsPanel from "./ChatLayout Components/ChannelsPanel"
import { EmptyChatSection } from "./EmptyChatSection"
import { useAuth, useUserInfo } from "../../hooks/user_hooks"
import { useAsyncError } from "../../hooks/ErrorHooks"

const ChatLayout = () => {
  const { channelId } = useParams()
  const { setUser_id } = useContext(ChatLayout_Context)
  const throwError = useAsyncError()

  const { AutoLogin_user } = useAuth()
  const { getUserProfile, getCommunities } = useUserInfo()

  const [UserProfile, setUserProfile] = useState(null)
  const [UserCommunities, setUserCommunities] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [profile, communities] = await Promise.all([
          getUserProfile(),
          getCommunities(),
        ])
        setUserProfile(profile?.UserInfo ?? profile)
        setUserCommunities(communities?.UserCommunities ?? communities)
        if (profile?.UserInfo?.user_id ?? profile?.user_id) {
          setUser_id(profile?.UserInfo?.user_id ?? profile?.user_id)
        }
      } catch (e) {
        throwError(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !UserProfile || !UserCommunities) {
    return (
      <div className="h-screen w-full bg-[var(--sc-bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--sc-border)] border-t-[var(--sc-accent)] rounded-full animate-spin" />
          <span className="text-[var(--sc-text-muted)] text-sm">Loading workspace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-[var(--sc-bg-primary)] flex flex-row overflow-hidden font-[Inter] text-[var(--sc-text-primary)]">
      <div className="h-full flex flex-row flex-shrink-0">
        <GroupBar
          username={UserProfile.username}
          email={UserProfile.email}
          communities={UserCommunities}
        />
        <div className="flex flex-col w-[200px] h-full border-r border-[var(--sc-border)]">
          <OptionsBar />
          <SearchBar />
          <ChannelsPanel />
        </div>
      </div>
      <div className="flex-1 h-full overflow-hidden">
        {channelId ? <Outlet /> : <EmptyChatSection />}
      </div>
    </div>
  )
}

export { ChatLayout }