const Button = ({ onClickHandler, type = 'primary', className = '', children, hover_effects_apply }) => {

  const base = 'inline-flex items-center justify-center font-medium transition-colors duration-150 cursor-pointer select-none rounded-lg w-fit h-fit font-[Inter]'

  const variants = {
    primary:   'bg-[var(--sc-accent)] hover:bg-[var(--sc-accent-hover)] text-white px-5 py-2.5 text-sm',
    secondary: 'bg-[var(--sc-bg-tertiary)] hover:bg-[var(--sc-border)] text-[var(--sc-text-primary)] border border-[var(--sc-border)] px-5 py-2.5 text-sm',
    ghost:     'hover:bg-[var(--sc-bg-tertiary)] text-[var(--sc-text-secondary)] px-4 py-2 text-sm',
    danger:    'bg-[var(--sc-danger)] hover:opacity-90 text-white px-5 py-2.5 text-sm',
    // Keep 'gradient' for backward compatibility with Home.jsx — restyle it as solid accent
    gradient:  'bg-[var(--sc-accent)] hover:bg-[var(--sc-accent-hover)] text-white px-5 py-2.5 text-sm shadow-sm',
  }

  return (
    <div
      className={`${base} ${variants[type] ?? variants.primary} ${className}`}
      onClick={onClickHandler ? () => onClickHandler() : undefined}
    >
      {children}
    </div>
  )
}

export default Button