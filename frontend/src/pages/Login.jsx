import { useEffect, useRef, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Loader2, Mail, Lock, User } from "lucide-react"
import { useAuth } from "../hooks/user_hooks"
import { get_all_user_credentials } from "../services/dev_services"

const DEV_KEY = import.meta.env.VITE_DEV_MODE_KEY

const Show_Demo_Creds = ({ users_creds, username_input_ref, email_input_ref, password_input_ref }) => {
  if(!DEV_KEY || !users_creds) return null;


  const fill_form=(user_name, user_email, user_password)=>{
    if(!username_input_ref.current
      || !email_input_ref.current
      || !password_input_ref.current
    ) return

    username_input_ref.current.value=user_name
    email_input_ref.current.value=user_email
    password_input_ref.current.value=user_password
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-[var(--sc-surface-highest)] border border-[var(--sc-outline-variant)] rounded-xl p-3 shadow-sm">
      <p className="text-[10px] font-medium text-[var(--sc-on-surface-muted)] uppercase tracking-wider mb-2">
        ALL Accounts
      </p>
      <div className="grid grid-cols-2 gap-1 max-h-[200px] overflow-y-auto">
        {users_creds.map((credentials, i) => (
          <div
            key={i}
            className="bg-[var(--sc-surface-low)] hover:bg-[var(--sc-surface-high)] hover:text-[var(--sc-tertiary)] text-[var(--sc-on-surface-variant)] text-xs px-3 py-1.5 rounded-md cursor-pointer transition-colors select-none"
            onClick={()=>{
              fill_form(credentials.user_name, credentials.user_email, credentials.user_password);
            }}
          >
            {credentials.user_name}
          </div>
        ))}
      </div>
    </div>
  )
}


const Login = () => {
  const navigate = useNavigate()
  const { AutoLogin_user, handleLogin, login_loading } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [users_list, setUsers_list] = useState([])

  const usernameRef = useRef(null)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  useEffect(() => {
    AutoLogin_user().then(authenticated => {
      if (authenticated) navigate('/chats')
    }).catch(() => {})

    if (DEV_KEY) {
      get_all_user_credentials(DEV_KEY)
      .then((res)=>{
        const user_cred_list=res?.user_credentials 
        if(Array.isArray(user_cred_list)){
          setUsers_list(user_cred_list)
        }

      }).catch((err)=>{
        console.error("Error in dev get:",err)
      })
    }
  }, [])

  const handleFormSubmision= (formData)=>{
    const username=formData.get("username")
    const email=formData.get("email")
    const password=formData.get("password")
    console.log(`
        Username: ${username}
        Email: ${email}
        Password: ${password}
      `)  

      handleLogin({
        username: username, 
        email: email, 
        password: password
      }).then((login_result)=>{

        console.log( `Login Result:`,login_result )
        if(login_result.AccessToken){
          setIsAuthenticated(true)
        }

      }).catch((e)=>{

        setIsAuthenticated(false) 
        console.error(e)

      })

  }



  useEffect( ()=>{

    //redirect user if refresh token exists
    AutoLogin_user().then(
      ()=>{
        navigate("/chats")
      }
    ).catch((e)=>{
    })

    if(isAuthenticated){
      console.log("User Authenticate, navigating to chats")
      navigate("/chats")
    }else{
      console.log("user not authenticated")
    }

  },[isAuthenticated] )



  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row relative overflow-hidden bg-[var(--sc-surface)]">

      {/* LEFT PANEL */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-[var(--sc-surface-low)]">
        {/* Background image */}
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5vO0awJfK6VNF1Y_wkx1rH1CVwni7MJ_Y-r6lzzLl7RXThuUuTgmhLsvfsKLnT5qn7kythD4AYjg6Ga8Smvn0SzffhxPoM8Ge4_-Kj5ne6WYvfBvwuyvVa7mdvK3DogBFP39RrpGZT9lefS5-WMkO12QaBAkL5Pd8rnPFXuI8G3DzgON1jcsLJzQsUPVy3Ozz44Ye_apkwh1g9SOif5Mx54HiOhXY5dG_EZPAOAkxh_bI10ZEO0PWVJN4NJQqklyzeyALtyB_OS0"
          className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-multiply grayscale"
          alt="Workspace background"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--sc-surface-low)] via-transparent to-transparent" />
        
        {/* Navbar */}
        <div className="relative flex items-center">
          <span className="font-['Manrope'] font-bold text-xl text-[var(--sc-on-surface)]">Smart <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic">Collab</span></span>
        </div>

        <div className="relative">
          <h1 className="font-['Manrope'] text-4xl md:text-5xl font-bold text-[var(--sc-on-surface)] leading-tight">
            The Curated <span className="font-['Playfair_Display'] italic text-[var(--sc-tertiary)]">Workspace</span> experience.
          </h1>
        </div>

        <div className="relative flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--sc-tertiary)]" />
          <span className="text-sm text-[var(--sc-on-surface-variant)]">Precision</span>
          <span className="w-2 h-2 rounded-full bg-[var(--sc-tertiary)] ml-4" />
          <span className="text-sm text-[var(--sc-on-surface-variant)]">Aesthetics</span>
          <span className="w-2 h-2 rounded-full bg-[var(--sc-tertiary)] ml-4" />
          <span className="text-sm text-[var(--sc-on-surface-variant)]">Flow</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-16 bg-[var(--sc-surface)]">

        {/* Mobile navbar */}
        <div className="md:hidden w-full max-w-md flex items-center justify-center mb-12">
          <span className="font-['Manrope'] font-bold text-xl text-[var(--sc-on-surface)]">Smart <span className="text-[var(--sc-tertiary)] font-['Playfair_Display'] italic">Collab</span></span>
        </div>

        {/* Demo credentials panel */}
        {DEV_KEY && 
          <Show_Demo_Creds 
            users_creds={users_list}
            username_input_ref={usernameRef}
            email_input_ref={emailRef}
            password_input_ref={passwordRef}
          />
        }

        {/* Login card */}
        <div className="bg-[rgba(255,255,255,0.4)] backdrop-blur-2xl shadow-[0_20px_40px_rgba(27,28,28,0.06)] p-8 md:p-10 rounded-xl border border-white/20 w-full max-w-md">
          {/* Form heading */}
          <div className="mb-8">
            <h2 className="font-['Manrope'] text-2xl font-semibold text-[var(--sc-on-surface)]">Welcome Back</h2>
            <p className="mt-2 text-sm text-[var(--sc-on-surface-variant)]">Please enter your credentials to access your workspace.</p>
          </div>

          {/* Form */}
          <form action={handleFormSubmision}>
            <div className="space-y-5 mb-6">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-[var(--sc-on-surface-variant)] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--sc-on-surface-muted)]" />
                  <input
                    ref={emailRef}
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="w-full py-4 pl-12 pr-4 rounded-lg bg-[var(--sc-surface-highest)] focus:bg-[var(--sc-surface-lowest)] text-[var(--sc-on-surface)] text-sm placeholder:text-[var(--sc-on-surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sc-tertiary)]/40 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-[var(--sc-on-surface-variant)]">
                    Password
                  </label>
                  <a href="#" className="text-xs text-[var(--sc-tertiary)] hover:underline">Forgot Password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--sc-on-surface-muted)]" />
                  <input
                    ref={passwordRef}
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className="w-full py-4 pl-12 pr-4 rounded-lg bg-[var(--sc-surface-highest)] focus:bg-[var(--sc-surface-lowest)] text-[var(--sc-on-surface)] text-sm placeholder:text-[var(--sc-on-surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sc-tertiary)]/40 transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-[var(--sc-on-surface-variant)] mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--sc-on-surface-muted)]" />
                  <input
                    ref={usernameRef}
                    type="text"
                    name="username"
                    placeholder="your_username"
                    className="w-full py-4 pl-12 pr-4 rounded-lg bg-[var(--sc-surface-highest)] focus:bg-[var(--sc-surface-lowest)] text-[var(--sc-on-surface)] text-sm placeholder:text-[var(--sc-on-surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sc-tertiary)]/40 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={login_loading}
              className="w-full py-4 bg-[var(--sc-tertiary)] text-[var(--sc-on-tertiary)] rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {login_loading && <Loader2 className="w-5 h-5 animate-spin text-white" />}
              Enter Workspace
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-8 text-center text-sm text-[var(--sc-on-surface-variant)]">
            New to the sanctuary?{' '}
            <Link to="/signup" className="text-[var(--sc-tertiary)] hover:underline font-medium">
              Create Account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-16 flex flex-col items-center gap-6 w-full max-w-md">
          <div className="flex gap-8 text-[0.65rem] uppercase tracking-[0.2em] text-[var(--sc-on-surface-variant)]/40">
            <a href="#" className="hover:text-[var(--sc-tertiary)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--sc-tertiary)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[var(--sc-tertiary)] transition-colors">Workspace Support</a>
          </div>
          <div className="text-[0.65rem] uppercase tracking-widest text-[var(--sc-on-surface-variant)]/30">
            &copy; 2025 Smart Collab. The Curated Workspace.
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Login
