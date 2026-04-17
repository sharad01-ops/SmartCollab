import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoutUser } from '../../../../services/user_services'
import { Languages, LogOut } from 'lucide-react'
import FloatingDiv from '../../../common components/FloatingDiv'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
]

const UserProfile = ({ username, email }) => {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('en')
  const [showLangConfirm, setShowLangConfirm] = useState(false)
  const [pendingLang, setPendingLang] = useState(null)

  const handleLogout = () => {
    LogoutUser()
      .then(() => navigate('/'))
      .catch(() => navigate('/'))
  }

  const handleLanguageChange = (e) => {
    const newLang = e.target.value
    setPendingLang(newLang)
    setShowLangConfirm(true)
  }

  const confirmLanguageChange = () => {
    setLanguage(pendingLang)
    setShowLangConfirm(false)
    setPendingLang(null)
  }

  return (
    <FloatingDiv
      ToggleButtonComponent={() => (
        <div
          className="w-10 h-10 bg-[#2F5D50] rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          title={`${username}\n${email}`}
        >
          <span className="text-white font-bold text-base uppercase select-none">
            {username?.[0] ?? '?'}
          </span>
        </div>
      )}
      content_parent_classes=""
      button_parent_styles=""
    >
      {/* Language confirmation modal */}
      {showLangConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[280px]">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Change Language?</h3>
            <p className="text-xs text-gray-500 mb-4">Are you sure you want to change the language?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLangConfirm(false)}
                className="flex-1 px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLanguageChange}
                className="flex-1 px-4 py-2 text-xs font-medium text-white bg-[var(--sc-tertiary)] rounded-xl hover:opacity-90 transition-opacity"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-2 ml-2 bg-white rounded-xl shadow-lg border border-[#E8E4DE] border-opacity-60 p-3 w-[220px] flex flex-col gap-1">

        <div className="px-2 py-2 mb-1 border-b border-[#E8E4DE] border-opacity-60">
          <p className="text-xs font-bold text-gray-900 truncate">{username}</p>
          <p className="text-[10px] text-[#8A817C] truncate">{email}</p>
        </div>

        <div className="px-2 py-2">
          <div className="flex items-center gap-2 mb-1">
            <Languages className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Language</span>
          </div>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="w-full text-xs bg-[#F9F7F4] border border-[#E8E4DE] border-opacity-60 rounded-xl px-2 py-1.5 outline-none focus:border-[#2F5D50] cursor-pointer text-gray-700"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="border-t border-[#E8E4DE] border-opacity-60 my-1" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-500 font-medium">Sign Out</span>
        </button>

      </div>
    </FloatingDiv>
  )
}

export default UserProfile
