import type { ReactNode } from 'react'

interface FABProps {
  onClick: () => void
  children: ReactNode
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  label?: string
}

export function FAB({ onClick, children, variant = 'primary', disabled, label }: FABProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed ${
        variant === 'primary'
          ? 'bg-[#0F0F0F] text-white hover:bg-[#2a2a2a]'
          : 'bg-white text-[#0F0F0F] border border-[#E0E0DC] hover:bg-[#F0F0EC]'
      }`}
    >
      {children}
    </button>
  )
}
