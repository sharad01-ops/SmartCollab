import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
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
    <div className="fixed top-4 left-4 z-50 bg-[var(--sc-bg-elevated)] border border-[var(--sc-border)] rounded-xl p-3 shadow-sm">
      <p className="text-[10px] font-medium text-[var(--sc-text-muted)] uppercase tracking-wider mb-2">
        ALL Accounts
      </p>
      <div className="grid grid-cols-2 gap-1 max-h-[200px] overflow-y-auto">
        {users_creds.map((credentials, i) => (
          <div
            key={i}
            className="bg-[var(--sc-bg-secondary)] hover:bg-[var(--sc-accent-subtle)] hover:text-[var(--sc-accent)] text-[var(--sc-text-secondary)] text-xs px-3 py-1.5 rounded-md cursor-pointer transition-colors select-none"
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
    <div className="h-screen w-full bg-[var(--sc-bg-primary)] flex items-center justify-center font-[Inter]">

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
      <div className="bg-[var(--sc-bg-elevated)] border border-[var(--sc-border)] rounded-xl p-8 w-full max-w-[380px] shadow-sm">

        {/* Wordmark */}
        <p className="font-[Jersey10Regular] text-2xl text-[var(--sc-accent)] mb-1 text-center">
          SmartCollab
        </p>
        <p className="text-[var(--sc-text-muted)] text-sm text-center mb-6">
          Sign in to your workspace
        </p>

        {/* Form */}
        <form action={handleFormSubmision}>
          <div className="space-y-4 mb-6">

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-[var(--sc-text-secondary)] mb-1">
                Username
              </label>
              <input
                ref={usernameRef}
                type="text"
                name="username"
                placeholder="your_username"
                className="w-full h-9 px-3 rounded-lg bg-[var(--sc-bg-secondary)] border border-[var(--sc-border)] text-[var(--sc-text-primary)] text-sm placeholder:text-[var(--sc-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sc-accent)] focus:border-transparent transition-shadow"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[var(--sc-text-secondary)] mb-1">
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                name="email"
                placeholder="you@example.com"
                className="w-full h-9 px-3 rounded-lg bg-[var(--sc-bg-secondary)] border border-[var(--sc-border)] text-[var(--sc-text-primary)] text-sm placeholder:text-[var(--sc-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sc-accent)] focus:border-transparent transition-shadow"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[var(--sc-text-secondary)] mb-1">
                Password
              </label>
              <input
                ref={passwordRef}
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full h-9 px-3 rounded-lg bg-[var(--sc-bg-secondary)] border border-[var(--sc-border)] text-[var(--sc-text-primary)] text-sm placeholder:text-[var(--sc-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sc-accent)] focus:border-transparent transition-shadow"
              />
            </div>

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={login_loading}
            className="w-full h-9 bg-[var(--sc-accent)] hover:bg-[var(--sc-accent-hover)] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {login_loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
            Sign In
          </button>
        </form>

      </div>
    </div>
  )
}

export default Login