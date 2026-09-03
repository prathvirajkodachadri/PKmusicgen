import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { dbToFraction } from '../lib/hooks'

/* ------------------------------------------------------------------ Rack */

export function RackUnit({
  children,
  className = '',
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <div id={id} className={`rack rounded-[3px] ${className}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3px]">
        <div className="panel-grain absolute inset-0" aria-hidden="true" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/* --------------------------------------------------------- Section header */

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  accent = '#F5A524',
}: {
  eyebrow: string
  title: string
  subtitle?: string
  accent?: string
}) {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3">
        <span
          className="h-[7px] w-[7px] shrink-0 rounded-full"
          style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
          aria-hidden="true"
        />
        <span className="legend">{eyebrow}</span>
        <span className="hairline h-px flex-1" aria-hidden="true" />
      </div>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="num mt-4 text-[clamp(1.75rem,4.2vw,3rem)] leading-[1.05] font-bold tracking-[-0.02em] text-ink"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-legend">{subtitle}</p>
      )}
    </header>
  )
}

/* ------------------------------------------------------------ "not a rule" */

export function NotRule({ children }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-clip/40 bg-clip/10 px-1.5 py-[2px] align-middle font-mono text-[10px] font-semibold tracking-[0.1em] text-clip">
      ≠ RULE
      {children}
    </span>
  )
}

/* ---------------------------------------------------------------- Tooltip */

export function Tip({ text, label }: { text: string; label?: string }) {
  return (
    <span className="group/tip relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label ?? 'More information'}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-etch text-legend-dim transition-colors hover:border-amber hover:text-amber"
      >
        <Info size={10} strokeWidth={2.5} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+9px)] left-1/2 z-50 w-[min(260px,72vw)] -translate-x-1/2 rounded-[3px] border border-etch bg-[#0e1215] p-3 text-[12px] leading-relaxed text-ink opacity-0 shadow-[0_14px_34px_-14px_rgba(0,0,0,0.95)] transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}

/* --------------------------------------------------------- Segmented meter */

export function SegmentedMeter({
  value,
  min = -60,
  max = 0,
  segments = 24,
  vertical = false,
  label,
}: {
  value: number
  min?: number
  max?: number
  segments?: number
  vertical?: boolean
  label?: string
}) {
  const frac = dbToFraction(value, min, max)
  const lit = Math.round(frac * segments)
  const cells = Array.from({ length: segments }, (_, i) => {
    const p = (i + 1) / segments
    const on = vertical ? segments - i <= lit : i < lit
    const color = p > 0.93 ? '#FF4D4D' : p > 0.78 ? '#F5A524' : '#35E08A'
    return (
      <div
        key={i}
        className={on ? 'seg-on' : ''}
        style={{
          background: on ? color : '#1d2227',
          color,
          opacity: on ? 1 : 0.55,
        }}
      />
    )
  })
  return (
    <div
      className={vertical ? 'flex flex-col-reverse gap-[2px]' : 'flex gap-[2px]'}
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(value * 10) / 10}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      {cells}
    </div>
  )
}

/* --------------------------------------------------------------- Level bar */

export function LevelBar({
  label,
  value,
  min = -40,
  max = 0,
  unit = 'dBFS',
  tone = 'safe',
  note,
}: {
  label: string
  value: string
  min?: number
  max?: number
  unit?: string
  tone?: 'safe' | 'caution' | 'clip'
  note?: string
}) {
  const color = tone === 'clip' ? '#FF4D4D' : tone === 'caution' ? '#F5A524' : '#35E08A'
  const nums = value.match(/-?\d+(\.\d+)?/)
  const anchor = nums ? parseFloat(nums[0]) : null
  const frac = anchor === null ? 0.5 : dbToFraction(anchor, min, max)
  const showUnit = anchor !== null && unit

  return (
    <div className="group">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] leading-tight text-ink">{label}</span>
        <span className="mono shrink-0 text-[12.5px] font-medium" style={{ color }}>
          {value}
          {showUnit && <span className="ml-1 text-[10px] text-legend-dim">{unit}</span>}
        </span>
      </div>
      <div className="mt-1.5 h-[5px] w-full overflow-hidden rounded-full bg-[#12161a]">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${frac * 100}%`, background: color, boxShadow: `0 0 8px -1px ${color}` }}
        />
      </div>
      {note && <p className="mt-1.5 text-[12px] leading-snug text-legend-dim">{note}</p>}
    </div>
  )
}

/* ------------------------------------------------------------ Stagger group */

export function Stagger({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.04, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function Item({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  )
}
