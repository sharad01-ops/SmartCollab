import { useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, MessageSquare, Video, Languages } from "lucide-react"
import { Global_Context } from "../contexts/Global-context-provider"
import { useAuth } from "../hooks/user_hooks"
import Button from "./common components/Button"

// Nav links
const NAV_LINKS = ['Solutions', 'Pricing', 'Resources', 'Enterprise']

const Floating_Header = ({ onSignIn }) => {
  return (
    <header className="w-full sticky top-0 z-50 bg-[var(--sc-bg-primary)] border-b border-[var(--sc-border)] h-14">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-full">
        {/* Logo */}
        <span className="font-[Jersey10Regular] text-xl text-[var(--sc-accent)] tracking-tight select-none">
          SmartCollab
        </span>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <span
              key={link}
              className="text-sm text-[var(--sc-text-secondary)] hover:text-[var(--sc-text-primary)] transition-colors cursor-pointer"
            >
              {link}
            </span>
          ))}
        </nav>

        {/* Sign In button */}
        <Button type="gradient" onClickHandler={onSignIn}>
          Sign In
        </Button>
      </div>
    </header>
  )
}

const Motto_Section = ({ onGetStarted }) => {
  return (
    <section className="max-w-3xl mx-auto flex flex-col items-center pt-24 pb-20 px-6 text-center">
      <h1 className="font-bold text-5xl text-[var(--sc-text-primary)] leading-tight">
        Collaborate Smarter.
      </h1>
      <h1 className="font-bold text-5xl text-[var(--sc-text-primary)] leading-tight mt-1">
        Connect Globally.
      </h1>
      <p className="text-base text-[var(--sc-text-secondary)] max-w-xl mx-auto mt-4 leading-relaxed">
        SmartCollab brings your team together with real-time messaging, HD video calls, and AI-powered translation — all in one workspace.
      </p>
      <div className="mt-8">
        <Button
          type="gradient"
          onClickHandler={onGetStarted}
          className="gap-2 text-base px-6 py-3"
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </section>
  )
}

const HowItWorks_Section = () => {
  const features = [
    {
      icon: MessageSquare,
      title: 'Real-time Chat',
      desc: 'Channels, rooms, and direct messages',
    },
    {
      icon: Video,
      title: 'Video Calls',
      desc: 'HD video powered by WebRTC SFU',
    },
    {
      icon: Languages,
      title: 'AI Translation',
      desc: 'Chat across languages seamlessly',
    },
  ]

  return (
    <section className="w-full bg-[var(--sc-bg-secondary)] border-t border-[var(--sc-border)] py-20">
      <div className="max-w-3xl mx-auto text-center px-6">
        <h2 className="text-3xl font-bold text-[var(--sc-text-primary)]">
          How SmartCollab Works
        </h2>
        <p className="text-[var(--sc-text-secondary)] text-base mt-3">
          Everything your team needs to collaborate without switching apps.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-[var(--sc-bg-elevated)] border border-[var(--sc-border)] rounded-xl p-6 text-left"
            >
              <Icon className="w-8 h-8 text-[var(--sc-accent)] mb-3" />
              <p className="font-semibold text-[var(--sc-text-primary)] text-sm mb-1">{title}</p>
              <p className="text-[var(--sc-text-muted)] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const Home = () => {
  const { toggle_darkMode } = useContext(Global_Context)
  const navigate = useNavigate()
  const { AutoLogin_user } = useAuth()

  useEffect(() => {
    AutoLogin_user().then(authenticated => {
      if (authenticated) navigate('/chats')
    }).catch(() => {})
  }, [])

  const handleSignIn = () => navigate('/login')
  const handleGetStarted = () => navigate('/login')

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--sc-bg-primary)] font-[Inter]">
      <Floating_Header onSignIn={handleSignIn} />
      <Motto_Section onGetStarted={handleGetStarted} />
      <HowItWorks_Section />
    </div>
  )
}

export default Home