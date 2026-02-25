import {useState, useEffect, createContext} from 'react'

export const Global_Context=createContext(null)

export const Global_ContextProvider = ({children}) => {
    
    const toggle_darkMode=()=>{
        document.documentElement.classList.toggle("dark")
    }

  return (
    <Global_Context.Provider value={{toggle_darkMode}}>
        {children}
    </Global_Context.Provider>
  )
}

