const TitleBanner = ({ title, subtitle }) => {
  return (
    <div className="w-full py-16 bg-[var(--sc-bg-secondary)] border-b border-[var(--sc-border)] text-center px-6">
      <h1 className="text-4xl font-bold text-[var(--sc-text-primary)] font-[Inter]">{title}</h1>
      {subtitle && (
        <p className="text-[var(--sc-text-secondary)] text-base mt-3 max-w-xl mx-auto">{subtitle}</p>
      )}
    </div>
  )
}

export default TitleBanner