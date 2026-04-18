import { useRef, useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowRight, Play, Check } from "lucide-react"
import { useAuth } from "../hooks/user_hooks"

const WORDS = ["Smart", "Collaborative", "Shared"]

const useHeroAnimation = () => {
  const [wordIndex, setWordIndex] = useState(0)
  const [letterCount, setLetterCount] = useState(0)
  const [clicked, setClicked] = useState(false)

  const LETTER_DELAY = 80
  const WORD_PAUSE = 1200

  useEffect(() => {
    const currentWord = WORDS[wordIndex]

    if (letterCount < currentWord.length) {
      const t = setTimeout(() => setLetterCount(l => l + 1), LETTER_DELAY)
      return () => clearTimeout(t)
    }

    if (letterCount === currentWord.length) {
      const t = setTimeout(() => {
        setLetterCount(0)
        setWordIndex(i => (i + 1) % WORDS.length)
      }, WORD_PAUSE)
      return () => clearTimeout(t)
    }
  }, [letterCount, wordIndex])

  return { word: WORDS[wordIndex], letterCount, clicked, setClicked }
}

const IntroCanvas = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const DRAW_DURATION = 950
    const ZOOM_DURATION = 1200
    let W, H, oX, oY, oRX, oRY
    let camX, camY, startCamX, startCamY
    let zoom = 1, textAlpha = 1, holeAlpha = 0
    let phase = 'writing'
    let drawProgress = 0
    let animStart = null
    let rafId = null

    const resize = () => {
      W = canvas.width = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
      measureO()
    }

    const measureO = () => {
      const FONT_SIZE = Math.min(W, 900) * 0.11
      ctx.font = `600 ${FONT_SIZE}px 'Manrope', sans-serif`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      const text = 'Smart Collab'
      const fullW = ctx.measureText(text).width
      const beforeO = ctx.measureText('Smart C').width
      const oWidth = ctx.measureText('o').width
      oX = W / 2 - fullW / 2 + beforeO + oWidth * 0.5
      oY = H / 2
      oRX = oWidth * 0.28
      oRY = FONT_SIZE * 0.28
      if (phase === 'writing') { camX = W / 2; camY = H / 2 }
    }

    const drawBackground = () => {
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#F6ECD7')
      grad.addColorStop(1, '#e7e2dd')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    }

    const drawFrame = () => {
      ctx.clearRect(0, 0, W, H)
      const FONT_SIZE = Math.min(W, 900) * 0.11

      drawBackground()

      if (holeAlpha > 0) {
        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'
        ctx.globalAlpha = holeAlpha
        ctx.beginPath()
        const scaledOX = (oX - camX) * zoom + W / 2
        const scaledOY = (oY - camY) * zoom + H / 2
        ctx.ellipse(scaledOX, scaledOY, oRX * zoom, oRY * zoom, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      ctx.save()
      ctx.translate(W / 2, H / 2)
      ctx.scale(zoom, zoom)
      ctx.translate(-camX, -camY)
      const text = 'Smart Collab'
      const textWidth = ctx.measureText(text).width
      const startX = (W - textWidth) / 2
      if (phase === 'writing') {
        ctx.beginPath()
        ctx.rect(startX, -H, textWidth * drawProgress, H * 3)
        ctx.clip()
      }
      ctx.font = `600 ${FONT_SIZE}px 'Manrope', sans-serif`
      ctx.fillStyle = `rgba(71, 53, 14, ${textAlpha})`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, W / 2, H / 2)
      ctx.restore()
    }

    const animate = (ts) => {
      if (!animStart) animStart = ts

      if (phase === 'writing') {
        const elapsed = ts - animStart
        drawProgress = Math.min(elapsed / DRAW_DURATION, 1)
        holeAlpha = 0
        drawFrame()
        if (drawProgress >= 1) {
          phase = 'zooming'
          animStart = null
          startCamX = camX; startCamY = camY
          rafId = requestAnimationFrame(animate)
          return
        }
      } else {
        if (!animStart) animStart = ts
        const t = Math.min((ts - animStart) / ZOOM_DURATION, 1)
        const shiftE = 1 - Math.pow(1 - t, 4)
        camX = startCamX + (oX - startCamX) * shiftE
        camY = startCamY + (oY - startCamY) * shiftE
        zoom = Math.pow(220, t)
        holeAlpha = Math.min(t / 0.8, 1)
        if (t > 0.4) textAlpha = Math.max(0, 1 - (t - 0.4) * 3)
        drawFrame()
        if (t >= 1) { canvas.style.display = 'none'; return }
      }
      rafId = requestAnimationFrame(animate)
    }

    const handleResize = () => { resize(); if (phase === 'writing' && drawProgress === 0) drawFrame() }
    window.addEventListener('resize', handleResize)

    document.fonts.ready.then(() => { resize(); rafId = requestAnimationFrame(animate) })

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-50" style={{ cursor: 'default' }} />
  )
}

const Navigation = ({ onSignIn }) => {
  return (
    <header className="fixed top-0 w-full z-40">
      <nav className="w-full px-8 py-4 flex items-center justify-between backdrop-blur-2xl bg-white/30 border-b border-white/10 shadow-sm">
        <div className="text-2xl font-bold tracking-tight text-[var(--sc-on-surface)] font-headline">
          Smart <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic font-semibold">Collab</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <a href="#platform" className="text-[var(--sc-tertiary)] font-semibold relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[var(--sc-tertiary)] after:rounded-full text-sm tracking-wide">
            Platform
          </a>
          <a href="#design" className="text-[var(--sc-on-surface)] hover:text-[var(--sc-tertiary)] transition-colors text-sm tracking-wide">
            Design
          </a>
          <a href="#capabilities" className="text-[var(--sc-on-surface)] hover:text-[var(--sc-tertiary)] transition-colors text-sm tracking-wide">
            Capabilities
          </a>
          <a href="#architects" className="text-[var(--sc-on-surface)] hover:text-[var(--sc-tertiary)] transition-colors text-sm tracking-wide">
            Architects
          </a>
        </div>

        <button
          onClick={onSignIn}
          className="bg-[var(--sc-primary)] text-[var(--sc-on-primary)] px-6 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Get Started
        </button>
      </nav>
    </header>
  )
}

const AnimatedWord = ({ onGetStarted }) => {
  const { word, letterCount, clicked, setClicked } = useHeroAnimation()

  return (
    <span
      onClick={() => setClicked(!clicked)}
      className={`inline-block font-['Playfair_Display'] italic text-[var(--sc-tertiary)] cursor-pointer select-none transition-all duration-300 ${clicked ? 'brightness-110 scale-[1.02]' : 'brightness-100 scale-100'} hover:brightness-110`}
      style={{ minWidth: '11ch', userSelect: 'none' }}
    >
      {word.split('').map((letter, i) => (
        <span
          key={i}
          className="inline-block"
          style={{ opacity: i < letterCount ? 1 : 0 }}
        >
          {letter}
        </span>
      ))}
    </span>
  )
}

const Hero = ({ onGetStarted }) => {
  return (
    <section id="platform" className="relative pt-40 pb-20 overflow-hidden bg-[var(--sc-surface)]">
      <div className="max-w-7xl mx-auto px-8">
        {/* flex row: text left, image right */}
        <div className="flex flex-col md:flex-row items-center gap-12">

          {/* LEFT: Text content */}
          <div className="flex-1 max-w-3xl">

            {/* Badge pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--sc-surface-container)] mb-8">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--sc-primary)]">Next-Gen Productivity</span>
              <span className="w-1 h-1 rounded-full bg-[var(--sc-tertiary)]" />
              <span className="text-[10px] font-medium text-[var(--sc-on-surface-variant)] uppercase text-[var(--sc-tertiary)] font-['Playfair_Display'] italic">Live Sync v2.0</span>
            </div>

            {/* 3 clean lines */}
            <h1 className="font-headline text-5xl md:text-6xl font-bold text-[var(--sc-on-surface)] leading-tight tracking-tight mb-8 space-y-1">
              <div>The Future Of</div>
              <div><AnimatedWord onGetStarted={onGetStarted} /></div>
              <div>Work.</div>
            </h1>

            <p className="text-xl text-[var(--sc-on-surface-variant)] leading-relaxed mb-12">
              Unified communication and rhythmic productivity for high-performing teams. Orchestrate projects with intentionality and aesthetic precision.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGetStarted}
                className="bg-[var(--sc-primary)] text-[var(--sc-on-primary)] px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                Explore
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Image */}
          <div className="w-full md:w-1/2 flex-shrink-0">
            <img
              alt="Minimalist modern office interior"
              className="w-full h-80 md:h-[480px] object-cover rounded-2xl shadow-lg"
              src="/assets/Landing.png"
            />
          </div>

        </div>
      </div>
    </section>
  )
}

const TrustedBy = () => {
  const companies = ['LUMINA', 'Atmos.', 'Vanguard', 'NOVA', 'Synthesis']
  return (
    <section className="py-12 bg-[var(--sc-surface-container-low)] border-y border-[var(--sc-outline-variant)]/5">
      <div className="max-w-7xl mx-auto px-8">
        <p className="text-center text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--sc-on-surface-variant)] mb-10">Trusted by World-Class Creative Teams</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale contrast-125">
          {companies.map((company) => (
            <span key={company} className="text-2xl font-bold font-headline text-[var(--sc-on-surface)]">
              {company}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

const Features = () => {
  return (
    <section id="design" className="py-24 bg-[var(--sc-surface)]">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-20">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--sc-primary)]">Architectural Design</span>
          <h2 className="font-headline text-4xl font-semibold mt-4">
            <span className="bg-green-100/60 px-3 py-1 rounded-sm inline-block">Designed for <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic">Clarity</span></span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">

          {/* Main Focus Card */}
          <div className="md:col-span-7 bg-[var(--sc-surface-lowest)] rounded-[2rem] p-10 flex flex-col justify-between shadow-sm border border-[var(--sc-outline-variant)]/10">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[var(--sc-tertiary)]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[var(--sc-tertiary)]">grid_view</span>
              </div>
              <h3 className="text-2xl font-headline font-semibold mb-4 text-[var(--sc-on-surface)]">Unified Productivity Canvas</h3>
              <p className="text-[var(--sc-on-surface-variant)] leading-relaxed max-w-sm">
                Stop context switching. Our unified canvas integrates communication, tasks, and creative assets into a single <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic">rhythmic flow</span>.
              </p>
            </div>
            <div className="mt-8 rounded-2xl overflow-hidden border border-[var(--sc-outline-variant)]/10 shadow-sm">
              <img
                alt="Clean abstract UI dashboard"
                className="w-full aspect-video object-cover"
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
              />
            </div>
          </div>

          {/* Secondary card — chat flow animation */}
          <div className="md:col-span-5 bg-[var(--sc-surface-container-low)] rounded-[2rem] p-10 shadow-sm flex flex-col border border-[var(--sc-outline-variant)]/5">
            <div className="mb-10">
              <div className="w-12 h-12 rounded-2xl bg-[var(--sc-primary)]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[var(--sc-primary)]">auto_awesome</span>
              </div>
              <h3 className="text-2xl font-headline font-semibold mb-4 text-[var(--sc-on-surface)]">Intentional AI</h3>
              <p className="text-[var(--sc-on-surface-variant)] leading-relaxed">
                Beyond simple chat. Our AI surfaces critical communication threads exactly when you need them, preserving your <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic">deep focus</span>.
              </p>
            </div>

            {/* Chat flow: stacked messages */}
            <div className="mt-auto space-y-3">
              {/* Message 1 */}
              <div className="animate-slide-up" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--sc-primary)]/20 flex-shrink-0 mt-0.5" />
                  <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl rounded-tl-sm border border-[var(--sc-outline-variant)]/10">
                    <p className="text-xs text-[var(--sc-on-surface)] leading-relaxed">Hey, did you review the Q4 pipeline update?</p>
                    <p className="text-[10px] text-[var(--sc-on-surface-muted)] mt-1">9:41 AM</p>
                  </div>
                </div>
              </div>
              {/* Message 2 */}
              <div className="animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--sc-tertiary)]/20 flex-shrink-0 mt-0.5" />
                  <div className="bg-[var(--sc-tertiary)]/10 p-4 rounded-2xl rounded-tl-sm border border-[var(--sc-tertiary)]/20">
                    <p className="text-xs text-[var(--sc-on-surface)] leading-relaxed">Yes! The AI surfaced the key risks automatically. Game changer.</p>
                    <p className="text-[10px] text-[var(--sc-on-surface-muted)] mt-1">9:42 AM</p>
                  </div>
                </div>
              </div>
              {/* Message 3 */}
              <div className="animate-slide-up" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--sc-primary)]/20 flex-shrink-0 mt-0.5" />
                  <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl rounded-tl-sm border border-[var(--sc-outline-variant)]/10">
                    <p className="text-xs text-[var(--sc-on-surface)] leading-relaxed">Exactly. This is the workflow we needed.</p>
                    <p className="text-[10px] text-[var(--sc-on-surface-muted)] mt-1">9:43 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

const CoreCapabilities = () => {
  const capabilities = [
    { title: 'Real-time Canvas', description: 'Collaborate on documents and designs with millisecond latency. Visual communication evolved.', icon: 'edit_square', iconColor: 'bg-[var(--sc-primary)]/10 text-[var(--sc-primary)]' },
    { title: 'Async Video', description: 'Record and share context-rich video updates that live alongside your project files.', icon: 'videocam', iconColor: 'bg-[var(--sc-tertiary)]/10 text-[var(--sc-tertiary)]' },
    { title: 'Smart Scheduling', description: 'AI-driven focus blocks that automatically sync across team calendars for deep work.', icon: 'calendar_today', iconColor: 'bg-[var(--sc-primary)]/10 text-[var(--sc-primary)]' },
  ]

  return (
    <section id="capabilities" className="py-24 bg-[var(--sc-surface-container-low)]">
      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-16 text-center mx-auto">
          <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic font-semibold">Core Capabilities</span>
          <h2 className="text-4xl font-headline font-bold text-[var(--sc-on-surface)] mt-2 text-center">Tools for <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic font-semibold">Modern Teams</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {capabilities.map((cap) => (
            <div key={cap.title} className="p-8 bg-[var(--sc-surface)] rounded-[2rem] border border-[var(--sc-outline-variant)]/10 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${cap.iconColor} rounded-xl flex items-center justify-center mb-6`}>
                <span className="material-symbols-outlined">{cap.icon}</span>
              </div>
              <h4 className="text-xl font-bold mb-3 text-[var(--sc-on-surface)]">{cap.title}</h4>
              <p className="text-[var(--sc-on-surface-variant)] text-sm leading-relaxed">{cap.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const HowItWorks = () => {
  const steps = [
    { number: '1', title: 'Curate Your Space', description: 'Design your digital environment using minimalist building blocks tailored for your team\'s unique rhythm.' },
    { number: '2', title: 'Invite & Sync', description: 'Onboard your team in seconds. High-fidelity communication tools keep everyone aligned without the noise.' },
    { number: '3', title: 'Deep Productivity', description: 'Experience a state of flow where technical barriers vanish and your team\'s creative energy thrives.' },
  ]

  return (
    <section className="py-32 bg-[var(--sc-surface)]">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl font-headline font-bold mb-6 text-[var(--sc-on-surface)]">Experience <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic font-semibold">Seamless Flow</span></h2>
          <p className="text-[var(--sc-on-surface-variant)]">Three steps to a more intentional work environment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-stone-200 -z-0" />

          {steps.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-white border-4 border-stone-50 shadow-sm text-[var(--sc-primary)] font-headline font-bold text-xl rounded-full flex items-center justify-center mb-8">
                {step.number}
              </div>
              <h4 className="text-lg font-bold mb-4 text-[var(--sc-on-surface)]">{step.title}</h4>
              <p className="text-sm text-[var(--sc-on-surface-variant)] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const Testimonials = () => {
  return (
    <section className="py-32 bg-[var(--sc-surface-container-low)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row items-center gap-16">
          {/* Editorial photo */}
          <div className="w-full md:w-1/2 rounded-[3rem] overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <img
              alt="A small team of creative professionals collaborating"
              className="w-full h-[500px] object-cover"
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
            />
          </div>

          {/* Quote */}
          <div className="w-full md:w-1/2">
            <span className="text-[var(--sc-tertiary)] font-bold tracking-[0.2em] uppercase text-[10px] mb-6 block font-['Playfair_Display'] italic">The Studio Experience</span>
            <blockquote className="text-3xl font-headline font-bold text-[var(--sc-on-surface)] leading-snug mb-8">
              "Smart Collab has transformed our studio from a collection of individuals into a <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic">unified creative force</span>. It&apos;s the first platform that respects our aesthetic standards as much as our technical ones."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stone-300" />
              <div>
                <p className="font-bold text-[var(--sc-on-surface)]">Julian Aris</p>
                <p className="text-sm text-[var(--sc-on-surface-variant)]">Creative Director, Studio Atmos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-24">
          <div className="bg-[var(--sc-surface)] p-8 rounded-3xl border border-[var(--sc-outline-variant)]/10">
            <p className="text-[var(--sc-on-surface-variant)] italic mb-6">"Finally, a productivity tool that doesn&apos;t feel like a spreadsheet. It&apos;s calm, intentional, and actually makes us <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic">faster</span>."</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--sc-primary)]/10" />
              <span className="text-xs font-bold text-[var(--sc-on-surface)]">Elena Vance, Product Lead @ Lumina</span>
            </div>
          </div>
          <div className="bg-[var(--sc-surface)] p-8 rounded-3xl border border-[var(--sc-outline-variant)]/10">
            <p className="text-[var(--sc-on-surface-variant)] italic mb-6">"The async video features changed how we handle time-zones. No more midnight meetings, just <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic">clear communication</span>."</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--sc-tertiary)]/10" />
              <span className="text-xs font-bold text-[var(--sc-on-surface)]">Mark Thorne, CTO @ Nova Systems</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const TEAM = [
  {
    name: "Sharad Jha",
    role: "Team Lead",
    tagline: "SmartCollab is a platform that provides a one-stop solution for seamless collaboration.",
    description: "I led the vision, architecture planning, and ensured smooth execution across the team.",
    img: "/assets/1.jpeg",
    color: "#6366f1",
    zone: { top: "15%", left: "8%", width: "16%", height: "65%" },
    cardPosition: "left",
  },
  {
    name: "Aditya Dwivedi",
    role: "System Architecture",
    tagline: "I architected the robust backend infrastructure ensuring scalability and performance.",
    description: "Every system component was designed with precision to handle high-volume data flow.",
    img: "/assets/2.jpeg",
    color: "#eab308",
    zone: { top: "15%", left: "26%", width: "18%", height: "65%" },
    cardPosition: "left",
  },
  {
    name: "Krishna Sonawane",
    role: "Backend Engineer",
    tagline: "I crafted seamless server-side logic that powers SmartCollab's real-time capabilities.",
    description: "Optimized APIs and database queries to ensure lightning-fast response times.",
    img: "/assets/3.jpeg",
    color: "#22c55e",
    zone: { top: "15%", left: "46%", width: "18%", height: "65%" },
    cardPosition: "right",
  },
  {
    name: "Aditya Paliwal",
    role: "Frontend Developer",
    tagline: "I designed and built the intuitive user interfaces you see today.",
    description: "Every interaction was crafted to feel natural, responsive, and delightful across all devices.",
    img: "/assets/4.jpeg",
    color: "#3b82f6",
    zone: { top: "15%", left: "66%", width: "18%", height: "65%" },
    cardPosition: "right",
  },
]

const useTypingEffect = (text, active, delay = 25) => {
  const [displayedText, setDisplayedText] = useState("")

  useEffect(() => {
    if (!active) {
      setDisplayedText("")
      return
    }

    setDisplayedText("")
    let index = 0
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text[index])
        index++
      } else {
        clearInterval(interval)
      }
    }, delay)

    return () => clearInterval(interval)
  }, [text, active, delay])

  return displayedText
}

const MeetTheTeam = () => {
  const [activeIndex, setActiveIndex] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveIndex(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <section id="architects" className="py-12 bg-stone-100">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-8">
          <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic font-semibold">Our People</span>
          <h2 className="font-headline text-4xl font-bold text-[var(--sc-on-surface)] mt-2">Meet the <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic font-semibold">Architects</span></h2>
          <p className="text-[var(--sc-on-surface-variant)] mt-4 max-w-xl mx-auto">The visionaries behind the next generation of collaborative craft.</p>
        </div>

        <div ref={containerRef} className="relative max-w-6xl mx-auto">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl">
            <img
              src="/assets/group_photo.jpeg"
              alt="SmartCollab team"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: "grayscale(100%) brightness(0.78)" }}
            />

            {TEAM.map((member, i) => (
              <img
                key={i}
                src={member.img}
                alt={member.name}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: activeIndex === i ? 1 : 0,
                  transition: "opacity 0.45s ease",
                  willChange: "opacity",
                }}
              />
            ))}

            {TEAM.map((member, i) => (
              <div
                key={i}
                className="absolute z-10 cursor-pointer"
                style={member.zone}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIndex((prev) => (prev === i ? null : i))
                }}
              />
            ))}
          </div>

          {TEAM.map((member, i) => {
            const displayedText = useTypingEffect(member.description, activeIndex === i)
            const isLeft = member.cardPosition === "left"
            
            const getPosition = () => {
              if (isLeft) {
                return { left: "-2%", top: "12%" }
              }
              return { right: "-2%", top: "12%" }
            }

            return (
              <div
                key={i}
                className="absolute w-80 select-none"
                style={{
                  ...getPosition(),
                  zIndex: 25,
                  opacity: activeIndex === i ? 1 : 0,
                  transform: activeIndex === i ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
                  transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  pointerEvents: "none",
                }}
              >
                <div 
                  className="absolute inset-0 rounded-2xl blur-xl"
                  style={{ background: member.color, opacity: 0.15 }}
                />
                <div
                  className="relative p-6 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${member.color}20`,
                  }}
                >
                  <span 
                    className="text-[10px] font-bold tracking-widest uppercase mb-2 block"
                    style={{ color: member.color }}
                  >
                    {member.role}
                  </span>
                  <h4 className="font-bold text-xl text-white mb-3">{member.name}</h4>
                  
                  <div className="text-sm text-white/70 leading-relaxed mb-3">
                    {displayedText}
                    <span 
                      className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                      style={{ background: member.color }}
                    />
                  </div>
                  
                  <div 
                    className="h-px w-full my-3 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${member.color}40, transparent)` }}
                  />
                  
                  <p className="text-xs text-white/50 font-['Playfair_Display'] italic">
                    "{member.tagline}"
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-stone-400 text-xs mt-4 font-medium tracking-wide">
          Hover over each person to discover their role
        </p>
      </div>
    </section>
  )
}

const Footer = () => {
  return (
    <footer className="bg-stone-100 border-none transition-all">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 max-w-7xl mx-auto w-full">
        <div className="mb-8 md:mb-0 text-center md:text-left">
          <div className="text-xl font-bold text-[var(--sc-on-surface)] mb-2 font-headline">
            Smart <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic font-semibold">Collab</span>
          </div>
          <p className="text-stone-500 text-sm max-w-xs">
            Redefining digital craftsmanship through <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic">intentional</span> collaboration tools.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-8 md:mb-0">
          <Link to="/privacy" className="text-stone-500 hover:text-[var(--sc-primary)] transition-colors text-xs font-semibold uppercase tracking-widest">Privacy Policy</Link>
          <Link to="/terms" className="text-stone-500 hover:text-[var(--sc-primary)] transition-colors text-xs font-semibold uppercase tracking-widest">Terms of Service</Link>
          <a href="#" className="text-stone-500 hover:text-[var(--sc-primary)] transition-colors text-xs font-semibold uppercase tracking-widest">Careers</a>
          <a href="#" className="text-stone-500 hover:text-[var(--sc-primary)] transition-colors text-xs font-semibold uppercase tracking-widest">Journal</a>
        </div>

        <div className="text-stone-500 text-[10px] font-medium uppercase tracking-[0.2em]">
          &copy; 2025 Smart Collab. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

const Home = () => {
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
    <div className="min-h-screen w-full flex flex-col bg-[var(--sc-surface)] font-headline">
      <IntroCanvas />
      <Navigation onSignIn={handleSignIn} />
      <Hero onGetStarted={handleGetStarted} />
      <TrustedBy />
      <Features />
      <CoreCapabilities />
      <HowItWorks />
      <Testimonials />
      <MeetTheTeam />
      <Footer />
    </div>
  )
}

export default Home
