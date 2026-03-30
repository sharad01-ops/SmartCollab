import React from 'react'

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
      <div className={`w-full flex px-4 py-0.5 ${fromUser ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[70%] flex flex-col">

          {/* Sender label — only for others, not self */}
          {!fromUser && sender_id && (
            <span className="text-[10px] font-medium text-[var(--sc-text-muted)] mb-0.5 ml-1">
              {`User ${sender_id}`}
            </span>
          )}

          {/* Bubble */}
          <div className={`
            px-3 py-2 text-sm leading-relaxed break-words
            ${fromUser
              ? 'bg-[var(--sc-accent)] text-white rounded-2xl rounded-br-sm'
              : 'bg-[var(--sc-bg-elevated)] text-[var(--sc-text-primary)] border border-[var(--sc-border)] rounded-2xl rounded-bl-sm'
            }
          `}>
            {message}
          </div>

          {/* Timestamp */}
          {formatTime(sent_at) && (
            <span className={`text-[10px] text-[var(--sc-text-muted)] mt-0.5 ${fromUser ? 'text-right mr-1' : 'ml-1'}`}>
              {formatTime(sent_at)}
            </span>
          )}

        </div>
      </div>
    )
  )
}

export default TextBox