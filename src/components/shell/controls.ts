import type { ReactElement } from 'react'

export interface ControlButton {
  icon: ReactElement
  label: string
  position: 'left' | 'right'
  onClick: () => void
  variant?: 'primary' | 'secondary'
  indicator?: boolean
}

export const USE_TOOLBAR = true
