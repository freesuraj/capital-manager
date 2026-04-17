export function Input({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-[#94a3b8]">{label}</label>}
      <input
        className="w-full bg-[#0f172a] border border-[#1e2a3a] rounded-lg px-3 py-2 text-[#e2e8f0] placeholder-[#475569] focus:border-[#3b82f6] focus:outline-none transition-colors"
        {...props}
      />
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  )
}

export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-[#94a3b8]">{label}</label>}
      <select
        className="w-full bg-[#0f172a] border border-[#1e2a3a] rounded-lg px-3 py-2 text-[#e2e8f0] focus:border-[#3b82f6] focus:outline-none transition-colors"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

export function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-[#94a3b8]">{label}</label>}
      <textarea
        className="w-full bg-[#0f172a] border border-[#1e2a3a] rounded-lg px-3 py-2 text-[#e2e8f0] placeholder-[#475569] focus:border-[#3b82f6] focus:outline-none transition-colors resize-none"
        {...props}
      />
    </div>
  )
}
