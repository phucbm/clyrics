interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-12 h-7 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-40 ${
        checked ? 'bg-[#0F0F0F]' : 'bg-[#D0D0CC]'
      }`}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

interface ToggleRowProps {
  label: string
  sublabel?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

export function ToggleRow({ label, sublabel, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#0F0F0F]">{label}</p>
        {sublabel && <p className="text-xs text-[#888] mt-0.5">{sublabel}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}
