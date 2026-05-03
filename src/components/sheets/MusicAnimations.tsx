import { motion } from 'framer-motion'
import { CheckCircle } from '@phosphor-icons/react'

const CHARS = ['♪', '♫', '♬', '字', '中', '福', '越', '汉', '文']
const COLORS = ['#7C3AED', '#2563EB', '#EA580C', '#DB2777', '#0891B2', '#16A34A', '#9333EA', '#DC2626', '#CA8A04', '#059669', '#7C3AED', '#C2410C', '#1D4ED8', '#BE185D', '#0369A1']

const FLOAT_CONFIGS = [
  { char: CHARS[0], x: '5%',  delay: 0,    duration: 2.2, color: COLORS[0]  },
  { char: CHARS[3], x: '14%', delay: 0.5,  duration: 2.6, color: COLORS[1]  },
  { char: CHARS[7], x: '22%', delay: 1.1,  duration: 2.0, color: COLORS[2]  },
  { char: CHARS[1], x: '31%', delay: 0.2,  duration: 2.4, color: COLORS[3]  },
  { char: CHARS[5], x: '40%', delay: 0.8,  duration: 1.9, color: COLORS[4]  },
  { char: CHARS[6], x: '49%', delay: 0.3,  duration: 2.7, color: COLORS[5]  },
  { char: CHARS[2], x: '58%', delay: 1.4,  duration: 2.1, color: COLORS[6]  },
  { char: CHARS[4], x: '67%', delay: 0.6,  duration: 2.3, color: COLORS[7]  },
  { char: CHARS[8], x: '76%', delay: 1.0,  duration: 2.5, color: COLORS[8]  },
  { char: CHARS[0], x: '84%', delay: 0.4,  duration: 2.0, color: COLORS[9]  },
  { char: CHARS[3], x: '92%', delay: 1.7,  duration: 2.2, color: COLORS[10] },
  { char: CHARS[1], x: '27%', delay: 1.9,  duration: 1.8, color: COLORS[11] },
  { char: CHARS[6], x: '54%', delay: 0.7,  duration: 2.6, color: COLORS[12] },
  { char: CHARS[8], x: '71%', delay: 1.5,  duration: 2.1, color: COLORS[13] },
  { char: CHARS[4], x: '43%', delay: 2.1,  duration: 2.3, color: COLORS[14] },
]

const FALL_CONFIGS = [
  { char: CHARS[1], x: '4%',  delay: 0.05, duration: 1.8, color: COLORS[3]  },
  { char: CHARS[4], x: '13%', delay: 0.3,  duration: 2.1, color: COLORS[0]  },
  { char: CHARS[7], x: '22%', delay: 0.1,  duration: 1.6, color: COLORS[5]  },
  { char: CHARS[0], x: '31%', delay: 0.45, duration: 1.9, color: COLORS[1]  },
  { char: CHARS[5], x: '41%', delay: 0,    duration: 2.0, color: COLORS[8]  },
  { char: CHARS[2], x: '51%', delay: 0.2,  duration: 1.7, color: COLORS[2]  },
  { char: CHARS[8], x: '61%', delay: 0.35, duration: 2.2, color: COLORS[9]  },
  { char: CHARS[3], x: '70%', delay: 0.15, duration: 1.8, color: COLORS[4]  },
  { char: CHARS[6], x: '79%', delay: 0.5,  duration: 2.0, color: COLORS[6]  },
  { char: CHARS[1], x: '88%', delay: 0.25, duration: 1.9, color: COLORS[7]  },
  { char: CHARS[0], x: '94%', delay: 0.4,  duration: 1.7, color: COLORS[10] },
  { char: CHARS[4], x: '17%', delay: 0.6,  duration: 2.1, color: COLORS[11] },
  { char: CHARS[7], x: '46%', delay: 0.1,  duration: 1.8, color: COLORS[12] },
  { char: CHARS[2], x: '65%', delay: 0.55, duration: 2.0, color: COLORS[13] },
  { char: CHARS[5], x: '84%', delay: 0.3,  duration: 1.6, color: COLORS[14] },
]

// Confetti: radial burst from center in all directions
const CONFETTI_CONFIGS = [
  { char: CHARS[0], angle: 0,    dist: 90,  delay: 0,     color: COLORS[0]  },
  { char: CHARS[3], angle: 25,   dist: 70,  delay: 0.1,   color: COLORS[1]  },
  { char: CHARS[1], angle: 50,   dist: 100, delay: 0.05,  color: COLORS[2]  },
  { char: CHARS[6], angle: 75,   dist: 75,  delay: 0.15,  color: COLORS[3]  },
  { char: CHARS[2], angle: 100,  dist: 95,  delay: 0.025, color: COLORS[4]  },
  { char: CHARS[7], angle: 125,  dist: 65,  delay: 0.125, color: COLORS[5]  },
  { char: CHARS[4], angle: 150,  dist: 85,  delay: 0.075, color: COLORS[6]  },
  { char: CHARS[8], angle: 175,  dist: 80,  delay: 0.175, color: COLORS[7]  },
  { char: CHARS[0], angle: 200,  dist: 95,  delay: 0,     color: COLORS[8]  },
  { char: CHARS[5], angle: 225,  dist: 70,  delay: 0.1,   color: COLORS[9]  },
  { char: CHARS[1], angle: 250,  dist: 100, delay: 0.05,  color: COLORS[10] },
  { char: CHARS[3], angle: 275,  dist: 75,  delay: 0.15,  color: COLORS[11] },
  { char: CHARS[6], angle: 300,  dist: 90,  delay: 0.025, color: COLORS[12] },
  { char: CHARS[2], angle: 325,  dist: 65,  delay: 0.125, color: COLORS[13] },
  { char: CHARS[8], angle: 350,  dist: 85,  delay: 0.075, color: COLORS[14] },
  { char: CHARS[4], angle: 13,   dist: 110, delay: 0.2,   color: COLORS[0]  },
  { char: CHARS[7], angle: 38,   dist: 60,  delay: 0.15,  color: COLORS[3]  },
  { char: CHARS[0], angle: 63,   dist: 105, delay: 0.225, color: COLORS[6]  },
  { char: CHARS[5], angle: 113,  dist: 80,  delay: 0.175, color: COLORS[9]  },
  { char: CHARS[3], angle: 188,  dist: 95,  delay: 0.125, color: COLORS[12] },
]

interface LoadingNotesProps {
  label?: string
  sublabel?: string
}

export function LoadingNotes({ label = 'Sending contribution…', sublabel = 'Creating your PR on GitHub' }: LoadingNotesProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-10 overflow-hidden min-h-[160px]">
      {FLOAT_CONFIGS.map((n, i) => (
        <motion.span
          key={i}
          className="absolute bottom-0 text-sm select-none pointer-events-none"
          style={{ left: n.x, color: n.color }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -140, opacity: [0, 0.85, 0.85, 0] }}
          transition={{
            delay: n.delay,
            duration: n.duration,
            repeat: Infinity,
            repeatDelay: 0.4,
            ease: 'easeOut',
          }}
        >
          {n.char}
        </motion.span>
      ))}
      <p className="text-sm font-medium text-[#0F0F0F] mt-auto pt-28">{label}</p>
      <p className="text-xs text-[#AAA] mt-1">{sublabel}</p>
    </div>
  )
}

interface SuccessFallProps {
  title?: string
  subtitle?: string
}

export function SuccessFall({ title = 'Done!', subtitle }: SuccessFallProps) {
  return (
    <div className="relative flex flex-col items-center gap-3 py-8 text-center overflow-hidden min-h-[180px]">
      {FALL_CONFIGS.map((n, i) => (
        <motion.span
          key={i}
          className="absolute top-0 text-sm select-none pointer-events-none"
          style={{ left: n.x, color: n.color }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 160, opacity: [0, 0.9, 0.9, 0] }}
          transition={{ delay: n.delay, duration: n.duration, ease: 'easeIn' }}
        >
          {n.char}
        </motion.span>
      ))}
      <div className="relative z-10 flex flex-col items-center gap-3 mt-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 }}
        >
          <CheckCircle size={40} weight="fill" className="text-green-500" />
        </motion.div>
        <motion.p
          className="text-sm font-semibold text-[#0F0F0F]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {title}
        </motion.p>
        {subtitle && (
          <motion.p
            className="text-xs text-[#888]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </div>
  )
}

interface SuccessConfettiProps {
  title?: string
  subtitle?: string
}

export function SuccessConfetti({ title = 'Done!', subtitle }: SuccessConfettiProps) {
  return (
    <div className="relative flex flex-col items-center gap-3 py-8 text-center overflow-hidden min-h-[200px]">
      <div className="relative flex items-center justify-center w-16 h-16 mt-6">
        {CONFETTI_CONFIGS.map((item, i) => {
          const rad = (item.angle * Math.PI) / 180
          const tx = Math.cos(rad) * item.dist
          const ty = Math.sin(rad) * item.dist
          return (
            <motion.span
              key={i}
              className="absolute text-sm select-none pointer-events-none"
              style={{ color: item.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ x: tx, y: ty, opacity: 0, scale: 1.2 }}
              transition={{ delay: item.delay, duration: 1.75, ease: [0.2, 0.8, 0.4, 1] }}
            >
              {item.char}
            </motion.span>
          )
        })}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.125 }}
        >
          <CheckCircle size={40} weight="fill" className="text-green-500" />
        </motion.div>
      </div>
      <motion.p
        className="text-sm font-semibold text-[#0F0F0F]"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.875 }}
      >
        {title}
      </motion.p>
      {subtitle && (
        <motion.p
          className="text-xs text-[#888]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}
