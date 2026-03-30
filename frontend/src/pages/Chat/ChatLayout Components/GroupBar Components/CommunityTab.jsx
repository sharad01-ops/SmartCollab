import { useState, useEffect, useContext } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChatLayout_Context } from "../../../../contexts/ChatLayout-context-provider"

// Preserved utility — keep even if not directly called in JSX
function hslToRgb(h, s, l) {
  s /= 100
  l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))]
}

const CommunityTab = ({ communityId, communityName }) => {
  const [tab_hsl_color, setTab_hsl_color] = useState('')
  const [tab_hsl_dim, setTab_hsl_dim] = useState('')
  const { CommunityChannelMap } = useContext(ChatLayout_Context)
  const navigate = useNavigate()
  const url_params = useParams()

  useEffect(() => {
    const h = Math.floor(Math.random() * 360)
    const s = 60 + Math.floor(Math.random() * 20)
    const l = 45 + Math.floor(Math.random() * 15)
    setTab_hsl_color(`hsl(${h}, ${s}%, ${l}%)`)
    setTab_hsl_dim(`hsl(${h}, ${s}%, ${l - 15}%)`)
  }, [])

  return (
    <div className="relative w-full flex items-center justify-center py-1">

      {/* Left active indicator bar */}
      <div
        className={`
          absolute left-0 w-0.5 rounded-r-full bg-[var(--bg-color)] transition-all duration-150
          ${url_params.communityId == communityId ? 'h-6 opacity-100' : 'h-0 opacity-0'}
        `}
        style={{ '--bg-color': tab_hsl_color }}
      />

      {/* Community avatar */}
      <div
        title={communityName}
        className={`
          w-8 h-8 flex items-center justify-center
          cursor-pointer select-none font-bold text-sm text-white
          transition-all duration-150
          ${url_params.communityId == communityId
            ? 'rounded-xl'
            : 'rounded-full hover:rounded-xl'
          }
        `}
        style={{
          backgroundColor: url_params.communityId == communityId
            ? tab_hsl_dim
            : tab_hsl_color,
          '--bg-color': tab_hsl_color,
          '--bg-color-dim': tab_hsl_dim,
        }}
        onClick={() => {
          if (url_params.communityId == communityId) return
          const channel_id = CommunityChannelMap[communityId]
          navigate(`/chats/${communityId}/${channel_id ? channel_id : ''}`)
        }}
      >
        {communityName[0]?.toUpperCase()}
      </div>

    </div>
  )
}

export default CommunityTab