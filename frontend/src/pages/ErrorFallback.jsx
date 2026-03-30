import { useRouteError, useNavigate } from "react-router-dom"
import { AlertTriangle } from "lucide-react"

const ErrorFallback = () => {
  const error = useRouteError()
  const navigate = useNavigate()

  return (
    <div className="absolute inset-0 z-50 bg-[var(--sc-bg-primary)] flex items-center justify-center font-[Inter]">
      <div className="bg-[var(--sc-bg-elevated)] border border-[var(--sc-border)] rounded-xl p-8 max-w-md w-full text-center shadow-sm mx-4">
        <AlertTriangle className="w-10 h-10 text-[var(--sc-danger)] mx-auto mb-4" />
        <h2 className="text-[var(--sc-text-primary)] font-semibold text-lg mb-1">
          Something went wrong
        </h2>
        <p className="text-[var(--sc-text-secondary)] text-sm mb-1">
          Status: {error?.status ?? 'Unknown'}
        </p>
        <p className="text-[var(--sc-text-muted)] text-xs mb-6 break-words">
          {error?.message ?? error?.data ?? 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => navigate('/chats')}
          className="bg-[var(--sc-accent)] hover:bg-[var(--sc-accent-hover)] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default ErrorFallback