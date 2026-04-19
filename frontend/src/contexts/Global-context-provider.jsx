import { createContext, useState, useEffect } from "react"

export const Global_Context = createContext(null)

const Global_ContextProvider = ({ children }) => {

  const [LoggedOut, setLoggedOut] = useState(false)

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sc-theme') ?? 'dark'
    }
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('sc-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  // Keep toggle_darkMode as an alias for backward compatibility
  const toggle_darkMode = toggleTheme

  return (
    <Global_Context.Provider value={{ 
                                    toggle_darkMode, theme, toggleTheme,
                                    LoggedOut, setLoggedOut
                                    }}>
      {children}
    </Global_Context.Provider>
  )
}

export { Global_ContextProvider }