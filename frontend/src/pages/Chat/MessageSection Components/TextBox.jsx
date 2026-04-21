const TextBox = ({ fromUser = null, message = null, sender_id = null,sender_name=null, sent_at = null, is_new_message=null }) => {

  const formatTime = (ts) => {
    if (!ts) return ''
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  let sent_time=null
  if(sent_at && typeof(sent_at)=="string"){
    const dateObj = new Date(sent_at);
    const date = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const time = dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    sent_time=time
  }

  return (
    message && (
      <div className={`w-full flex ${fromUser ? 'justify-end' : 'justify-start'} px-2 py-1`}>
        {fromUser ? (
          <div className="flex flex-col items-end w-full">
            <div className="flex items-center justify-end w-full">
              <div className="bg-[#173C2F] text-white px-3.5 py-2.5 rounded-[16px] rounded-tr-[4px] max-w-[420px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[15px] leading-relaxed">
                {message}
              </div>
            </div>
            <div className="mt-1 px-1 text-[10px] text-gray-400 font-medium select-none">
              {sent_time}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start w-full">
            <div className="flex items-center justify-start w-full">
              <div className="bg-[#f0f2f1] text-gray-800 px-3.5 py-2.5 rounded-[16px] rounded-tl-[4px] max-w-[420px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[15px] leading-relaxed">
                {message}
              </div>
            </div>
            <div className="mt-1 px-1 text-[10px] text-gray-400 font-medium select-none">
              {sent_time}
            </div>
          </div>
        )}
      </div>
    )
  )
}

export default TextBox