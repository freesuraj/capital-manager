interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0] tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-[#64748b] mt-1 text-sm leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0 ml-6">{actions}</div>
      )}
    </div>
  )
}
