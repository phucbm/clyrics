import { motion } from 'framer-motion'
import type { ControlButton } from './controls'

// ── ToolBarButton ─────────────────────────────────────────────────────────────

interface ToolBarButtonProps {
  btn: ControlButton
  showLabel: boolean
}

function ToolBarButton({ btn, showLabel }: ToolBarButtonProps) {
  const isPrimary = btn.variant === 'primary'
  return (
    <button
      onClick={btn.onClick}
      aria-label={btn.label}
      className={`flex flex-col items-center justify-center gap-1 w-12 h-12 transition-all active:scale-90 ${
        isPrimary ? 'text-[#0F0F0F]' : 'text-[#888]'
      }`}
    >
      {btn.icon}
      {showLabel && (
        <span className="text-[10px] font-medium leading-none text-current">{btn.label}</span>
      )}
    </button>
  )
}

// ── ToolBarGroup ──────────────────────────────────────────────────────────────

interface ToolBarGroupProps {
  buttons: ControlButton[]
  showLabel: boolean
}

function ToolBarGroup({ buttons, showLabel }: ToolBarGroupProps) {
  return (
    <div className="flex items-center rounded-full bg-white border border-[#E0E0DC] shadow-md px-1 gap-0.5">
      {buttons.map((btn, i) => (
        <ToolBarButton key={i} btn={btn} showLabel={showLabel} />
      ))}
    </div>
  )
}

// ── ToolBar ───────────────────────────────────────────────────────────────────

interface ToolBarProps {
  buttons: ControlButton[]
  visible?: boolean
  showLabel?: boolean
}

export function ToolBar({ buttons, visible = true, showLabel = false }: ToolBarProps) {
  const left = buttons.filter((b) => b.position === 'left')
  const right = buttons.filter((b) => b.position === 'right')

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={visible ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
      className="absolute bottom-0 inset-x-0 flex items-end justify-between px-5 pb-6 z-20"
    >
      <div>{left.length > 0 ? <ToolBarGroup buttons={left} showLabel={showLabel} /> : <div className="w-12" />}</div>
      <div>{right.length > 0 ? <ToolBarGroup buttons={right} showLabel={showLabel} /> : null}</div>
    </motion.div>
  )
}
