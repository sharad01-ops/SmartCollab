import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SendHorizontal, Image, Smile, Loader2 } from 'lucide-react'

// TextArea with mirror-based auto-height — all logic preserved exactly
const TextArea = forwardRef(({ onEnter_callback, placeholder, value, onChange, onKeyDown, className }, ref) => {
  const visibleRef = useRef(null)
  const mirrorRef = useRef(null)

  const syncHeight = () => {
    if (!visibleRef.current || !mirrorRef.current) return
    mirrorRef.current.value = visibleRef.current.value
    visibleRef.current.style.height = mirrorRef.current.scrollHeight + 'px'
  }

  const handleChange = (e) => {
    if (onChange) onChange(e)
    syncHeight()
  }

  const handleKeyDown = (e) => {
    if (onKeyDown) onKeyDown(e)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      EnterText()
    }
  }

  const EnterText = () => {
    if (!visibleRef.current) return
    const value = visibleRef.current.value.trim()
    if (!value) return
    if (onEnter_callback) onEnter_callback(value)
    clearTextArea()
  }

  const clearTextArea = () => {
    if (visibleRef.current) {
      visibleRef.current.value = ''
      visibleRef.current.style.height = 'auto'
    }
    if (mirrorRef.current) {
      mirrorRef.current.value = ''
    }
  }

  const FillTextArea = (text) => {
    if (visibleRef.current) {
      visibleRef.current.value = text
      syncHeight()
    }
  }

  useImperativeHandle(ref, () => ({
    clearTextArea,
    FillTextArea,
    EnterText,
  }))

  return (
    <div className="relative flex-1">
      {/* Mirror textarea — must be rendered (not display:none) for scrollHeight to work */}
      <textarea
        ref={mirrorRef}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute top-0 right-0 -z-50 opacity-0 pointer-events-none bg-transparent text-sm resize-none overflow-hidden w-full border-none outline-none"
        rows={1}
      />
      {/* Visible textarea */}
      <textarea
        ref={visibleRef}
        rows={1}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
      />
    </div>
  )
})

TextArea.displayName = 'TextArea'

const MessageBar = ({ onEnter_callback }) => {
  const textAreaRef = useRef(null)
  const location = useLocation()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  
  useEffect(() => {
    textAreaRef.current?.clearTextArea()
    setMessage('')
  }, [location.pathname])

  const handleSend = () => {
    if (onEnter_callback) onEnter_callback(message)
    setMessage('')
    textAreaRef.current?.clearTextArea()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-full flex justify-center mb-5">
      <div className="flex items-center w-[60%] gap-2.5">
        <div className="flex-1 flex items-center px-4 py-[12px] rounded-[28px] bg-[rgba(255,255,255,0.6)] backdrop-blur-[14px] border-none shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] transition-all">
          <TextArea
            ref={textAreaRef}
            name="message"
            placeholder="Write a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onEnter_callback={onEnter_callback}
            className="w-full bg-transparent outline-none resize-none text-[15px] text-gray-900 placeholder:text-gray-500 font-[Inter] leading-relaxed custom-scrollbar px-1"
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={!message.trim() && !file}
          className="w-[42px] h-[42px] rounded-full bg-[#1F4D3A] text-white flex-shrink-0 flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.25)] hover:scale-[1.08] transition-all duration-250 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <SendHorizontal className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>
    </div>
  )
}

export default MessageBar