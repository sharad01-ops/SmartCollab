import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SendHorizonal } from 'lucide-react'

// TextArea with mirror-based auto-height — all logic preserved exactly
const TextArea = forwardRef(({ onEnter_callback }, ref) => {
  const visibleRef = useRef(null)
  const mirrorRef = useRef(null)

  const syncHeight = () => {
    if (!visibleRef.current || !mirrorRef.current) return
    mirrorRef.current.value = visibleRef.current.value
    visibleRef.current.style.height = mirrorRef.current.scrollHeight + 'px'
  }

  const handleChange = (e) => {
    syncHeight()
  }

  const handleKeyDown = (e) => {
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
        placeholder="Message..."
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-[#8A817C] resize-none"
      />
    </div>
  )
})

TextArea.displayName = 'TextArea'

const MessageBar = ({ onEnter_callback }) => {
  const textAreaRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    textAreaRef.current?.clearTextArea()
  }, [location.pathname])

  const sendText = (text) => {
    if (onEnter_callback) onEnter_callback(text)
  }

  return (
    <div className="w-full flex justify-center pb-4 bg-transparent">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8E4DE] shadow-sm">

          <TextArea
            ref={textAreaRef}
            onEnter_callback={sendText}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={() => textAreaRef.current?.EnterText()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2F5D50] text-white hover:opacity-90 transition"
          >
            <SendHorizonal className="w-4 h-4" />
          </button>

        </div>
      </div>
    </div>
  )
}

export default MessageBar