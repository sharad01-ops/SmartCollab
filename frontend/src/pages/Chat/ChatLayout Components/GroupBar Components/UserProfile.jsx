const UserProfile = ({ username, email }) => {
  return (
    <div className="relative w-8 h-8">
      <div className="w-8 h-8 rounded-full bg-[var(--sc-accent)] flex items-center justify-center text-white text-xs font-semibold cursor-pointer select-none">
        {username?.[0]?.toUpperCase() ?? '?'}
      </div>
      {/* Online indicator */}
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--sc-success)] border-2 border-[var(--sc-bg-secondary)]" />
    </div>
  )
}

export default UserProfile