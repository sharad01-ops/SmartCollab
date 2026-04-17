import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const Signup = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/login')
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[var(--sc-surface)]/70 backdrop-blur-3xl">
        <div className="flex justify-between items-center px-6 py-6 w-full max-w-7xl mx-auto">
          <span className="font-headline font-bold text-xl text-[var(--sc-primary)] tracking-tight">Smart Collab</span>
          <Link to="/login" className="font-label text-[0.75rem] uppercase font-semibold tracking-wider text-[var(--sc-on-surface)]/60 hover:text-[var(--sc-primary)] transition-all">Log In</Link>
        </div>
      </nav>

      <div className="min-h-screen flex flex-col md:flex-row">

        {/* LEFT PANEL */}
        <div className="hidden md:flex flex-1 relative overflow-hidden bg-[var(--sc-surface-low)]">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcwp_ygtrbMA1KMco4A8g1MdoWmTJ2vqsUlbjshypgoiEjFuicO_yTYStOjD0_I1s6HebWpi5lqHtvpyyyVViYLQ67H7WTPEODpWmktFnnjA207mSmaVeKYUF4EIe224trZCXKAsNKrDTpygWj2-vvXo3Hc0MoY8uV4DcVKxNrzsl-AA3n4yhv6DqUmplKPbjSeLtAEBHtLfaX4__6QPBrA27qwHZ_MwpSu67OAn6rkEg_TXT9jWm2lV43dtVIDbuENVNG9IggHBY"
            className="absolute inset-0 w-full h-full object-cover opacity-10"
            alt="Workspace background"
          />
          <div className="relative z-10 flex items-center justify-center w-full h-full px-6 md:px-12 lg:px-20">
            <div className="max-w-md">
              <h1 className="font-headline text-[3.5rem] leading-tight font-bold tracking-tight mb-6 text-[var(--sc-on-surface)]">
                Elevate your <span className="text-[var(--sc-tertiary)]">Smart</span> flow.
              </h1>
              <p className="text-[var(--sc-on-surface-variant)] text-lg leading-relaxed mb-12">
                Join the curated workspace designed for teams who prioritize intentionality over noise.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--sc-surface-lowest)] p-6 rounded-xl shadow-sm">
                  <span className="material-symbols-outlined text-[var(--sc-tertiary)] mb-3 block">auto_awesome</span>
                  <div className="text-sm font-semibold mb-1 text-[var(--sc-on-surface)]">Curated Focus</div>
                  <div className="text-xs text-[var(--sc-on-surface)]/60">Eliminate digital clutter.</div>
                </div>
                <div className="bg-[var(--sc-surface-lowest)] p-6 rounded-xl shadow-sm mt-8">
                  <span className="material-symbols-outlined text-[var(--sc-primary)] mb-3 block">group_work</span>
                  <div className="text-sm font-semibold mb-1 text-[var(--sc-on-surface)]">Deep Sync</div>
                  <div className="text-xs text-[var(--sc-on-surface)]/60">Real-time collaboration.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-20 py-12 md:py-24 bg-[var(--sc-surface)]" style={{ paddingTop: '96px' }}>
          <div className="w-full max-w-md">

            {/* Mobile header */}
            <div className="md:hidden text-center mb-12">
              <span className="font-headline font-bold text-xl text-[var(--sc-primary)] tracking-tight">Smart Collab</span>
            </div>

            <div className="mb-10">
              <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight whitespace-nowrap mb-2 text-[var(--sc-on-surface)]">Create your account</h2>
              <p className="text-[var(--sc-on-surface-variant)]">Experience the editorial approach to collaboration.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-label uppercase font-semibold tracking-wider text-[var(--sc-on-surface)]/60 mb-2" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="E.g. Julianne Moore"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-[var(--sc-surface-highest)] border-none rounded-xl focus:ring-0 focus:bg-[var(--sc-surface-lowest)] focus:shadow-sm transition-all duration-300 text-[var(--sc-on-surface)] placeholder:text-[var(--sc-on-surface)]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-label uppercase font-semibold tracking-wider text-[var(--sc-on-surface)]/60 mb-2" htmlFor="email">
                  Work Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-[var(--sc-surface-highest)] border-none rounded-xl focus:ring-0 focus:bg-[var(--sc-surface-lowest)] focus:shadow-sm transition-all duration-300 text-[var(--sc-on-surface)] placeholder:text-[var(--sc-on-surface)]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-label uppercase font-semibold tracking-wider text-[var(--sc-on-surface)]/60 mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-[var(--sc-surface-highest)] border-none rounded-xl focus:ring-0 focus:bg-[var(--sc-surface-lowest)] focus:shadow-sm transition-all duration-300 text-[var(--sc-on-surface)] placeholder:text-[var(--sc-on-surface)]/30"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 bg-[var(--sc-primary)] text-[var(--sc-on-primary)] rounded-xl font-headline font-bold text-lg hover:opacity-95 active:scale-[0.98] transition-all shadow-lg"
                >
                  Create Workspace
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-[var(--sc-on-surface)]/60">
              Already have an account?{" "}
              <Link to="/login" className="text-[var(--sc-tertiary)] font-semibold hover:underline underline-offset-4">
                Log in
              </Link>
            </p>
          </div>
        </div>

      </div>

      <footer className="w-full py-12 bg-[var(--sc-surface)] border-t border-[var(--sc-outline-variant)]/10">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 max-w-7xl mx-auto">
          <div className="font-label text-[0.75rem] uppercase font-semibold tracking-wider text-[var(--sc-on-surface)]/60 mb-4 md:mb-0">
            &copy; 2025 Smart Collab. The Curated Workspace.
          </div>
          <div className="flex gap-8">
            <a href="#" className="font-label text-[0.75rem] uppercase font-semibold tracking-wider text-[var(--sc-on-surface)]/60 hover:text-[var(--sc-primary)] transition-all">Privacy</a>
            <a href="#" className="font-label text-[0.75rem] uppercase font-semibold tracking-wider text-[var(--sc-on-surface)]/60 hover:text-[var(--sc-primary)] transition-all">Terms</a>
            <a href="#" className="font-label text-[0.75rem] uppercase font-semibold tracking-wider text-[var(--sc-on-surface)]/60 hover:text-[var(--sc-primary)] transition-all">Support</a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Signup
