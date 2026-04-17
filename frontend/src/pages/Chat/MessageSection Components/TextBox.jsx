const TextBox = ({ fromUser = null, message = null, sender_id = null, sent_at = null }) => {

  const formatTime = (ts) => {
    if (!ts) return ''
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    message && (
      <div className="w-full flex px-4 py-0.5">
        {fromUser ? (
          <div className="flex justify-end w-full">
            <div className="bg-[#F4E6C8] text-[#2F5D50] px-4 py-2 rounded-2xl rounded-br-none max-w-[70%] shadow-sm">
              {message}
            </div>
          </div>
        ) : (
          <div className="flex justify-start w-full">
            <div className="bg-[#2F5D50] text-white px-4 py-2 rounded-2xl rounded-bl-none max-w-[70%] shadow-sm">
              {message}
            </div>
          </div>
        )}
      </div>
    )
  )
}

export default TextBox