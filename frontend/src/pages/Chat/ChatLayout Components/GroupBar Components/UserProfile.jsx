import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoutUser } from '../../../../services/user_services'
import { Languages, LogOut, ChevronDown, Check, X } from 'lucide-react'
import FloatingDiv from '../../../common components/FloatingDiv'
import { Global_Context } from '../../../../contexts/Global-context-provider'
import { change_preferred_language } from '../../../../services/user_services'
import useAppStore from '../../../../store/useAppStore'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  {code: 'as', label: "Assamese"},
  {code: 'bn', label: "Bengali"},
  {code: 'doi', label: "Dogri"},
  {code: 'gu', label: "Gujarati"},
  {code: 'hi', label: "Hindi"},
  {code: 'kn', label: "Kannada"},
  {code: 'gom', label: "Konkani"},
  {code: 'mai', label: "Maithili"},
  {code: 'ml', label: "Malayalam"},
  {code: 'mni-Mtei', label: "Meiteilon (Manipuri)"},
  {code: 'mr', label: "Marathi"},
  {code: 'ne', label: "Nepali"},
  {code: 'or', label: "Odia (Oriya)"},
  {code: 'sa', label: "Sanskrit"},
  {code: 'sat-Latn', label: "Santali (Latin)"},
  {code: 'sd', label: "Sindhi"},
  {code: 'ta', label: "Tamil"},
  {code: 'te', label: "Telugu"},
  {code: 'ur', label: "Urdu"},
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'nl', label: 'Dutch' },
  { code: 'ja', label: 'Japanese' },
]

const UserProfile = ({ username, email }) => {
  const navigate = useNavigate()
  const { setLoggedOut } = useContext(Global_Context)
  const language = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)

  const [showLangConfirm, setShowLangConfirm] = useState(false)
  const [pendingLang, setPendingLang] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = () => {
    LogoutUser()
      .then(() =>{
        setLoggedOut(true)
        navigate('/')
      })
      .catch(() => {
        setLoggedOut(true)
        navigate('/')
      })
  }

  const handleLanguageChange = (newLangCode) => {
    setIsDropdownOpen(false)
    if (newLangCode === language) return
    setPendingLang(newLangCode)
    setShowLangConfirm(true)
  }

  const confirmLanguageChange = () => {
    const newLang = pendingLang
    setShowLangConfirm(false)
    setPendingLang(null)
    
    // 1. Update local state and localStorage IMMEDIATELY (Smooth Transition)
    setLanguage(newLang)
    
    // 2. Sync with backend in the background (no reload needed)
    change_preferred_language(newLang).catch((error) => {
      console.error('Failed to sync language preference with backend:', error)
    })
  }

  return (
    <FloatingDiv
      ToggleButtonComponent={() => (
        <div
          className="w-[44px] h-[44px] bg-[#2E6A52] rounded-[12px] flex items-center justify-center cursor-pointer shadow-[0_6px_16px_rgba(0,0,0,0.3),0_0_0_2px_rgba(255,255,255,0.1)] hover:opacity-80 hover:scale-105 transition-all duration-250"
          title={`${username}\n${email}`}
        >
          <span className="text-white font-[600] text-base uppercase select-none">
            {username?.[0] ?? '?'}
          </span>
        </div>
      )}
    >
      <div className="mb-2 ml-2 bg-white border border-[#E8E4DE] rounded-xl shadow-xl p-3 w-[220px] flex flex-col gap-1 relative overflow-visible">
        
        {/* User Info */}
        <div className="px-2 py-2 mb-1 border-b border-[#F0EBE5]">
          <p className="text-xs font-bold text-gray-900 truncate">{username}</p>
          <p className="text-[10px] text-[#8A817C] truncate">{email}</p>
        </div>

        {/* Language Section */}
        <div className="px-2 py-2 relative">
          <div className="flex items-center gap-2 mb-1.5">
            <Languages className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Language</span>
          </div>
          
          <div className="relative w-full">
            <div 
              className="w-full text-xs bg-[#F9F7F4] border border-[#E8E4DE] rounded-lg px-2.5 py-2 flex items-center justify-between cursor-pointer hover:border-[#2F5D50] hover:bg-white transition-all group"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="text-gray-700 font-medium">{LANGUAGES.find(l => l.code === language)?.label || 'Select'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Language Dropdown - Fixed to open upward and no glassmorphism */}
            {isDropdownOpen && (
              <div 
                className="absolute z-[1000] bottom-[110%] left-0 w-full bg-white border border-[#E8E4DE] rounded-lg shadow-2xl max-h-[160px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200"
                style={{ position: 'absolute', bottom: '110%', left: 0 }}
              >
                {LANGUAGES.map(l => (
                  <div 
                    key={l.code}
                    className={`px-3 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between ${l.code === language ? 'bg-[#F0F7F4] text-[#2F5D50] font-semibold' : 'text-gray-600 hover:bg-[#F9F7F4]'}`}
                    onClick={() => handleLanguageChange(l.code)}
                  >
                    {l.label}
                    {l.code === language && <Check className="w-3 h-3" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Overlay */}
        {showLangConfirm && (
          <div className="absolute inset-x-0 bottom-full mb-2 mx-2 bg-[#2F5D50] rounded-xl shadow-2xl p-3 z-[2000] animate-in fade-in zoom-in-95 duration-200">
            <p className="text-[11px] font-bold text-white mb-0.5">Change Language?</p>
            <p className="text-[10px] text-white/80 mb-3">To {LANGUAGES.find(l => l.code === pendingLang)?.label}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLangConfirm(false)}
                className="flex-1 px-2 py-1.5 text-[10px] font-bold text-white/90 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
              <button
                onClick={confirmLanguageChange}
                className="flex-1 px-2 py-1.5 text-[10px] font-bold text-[#2F5D50] bg-white rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 close-floating"
              >
                <Check className="w-3 h-3" /> Confirm
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-[#F0EBE5] my-1" />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-500 transition-all w-full text-left group close-floating"
        >
          <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-500 transition-colors" />
          <span className="text-xs font-semibold">Sign Out</span>
        </button>

      </div>
    </FloatingDiv>
  )
}

export default UserProfile

