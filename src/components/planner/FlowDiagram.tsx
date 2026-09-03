import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import type { BusRec, Selection, SessionRec } from '../../data/planner'

function Arrow() {
  return (
    <div className="flex items-center justify-center py-1 lg:py-0" aria-hidden="true">
      <ChevronRight
        size={18}
        className="rotate-90 text-[#3d464f] lg:rotate-0"
        strokeWidth={2.5}
      />
    </div>
  )
}

function Node({
  label,
  legend,
  color,
  active,
  onClick,
  children,
  className = '',
}: {
  label: string
  legend: string
  color: string
  active: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative overflow-hidden rounded-[3px] border bg-[linear-gradient(180deg,#1a1f24,#141819)] p-4 text-left transition-colors ${
        active ? 'border-[color:var(--c)]' : 'border-etch hover:border-[#39424b]'
      } ${className}`}
      style={{ ['--c' as string]: color }}
    >
      <span
        className="absolute inset-x-0 top-0 h-[2px] origin-left transition-transform"
        style={{ background: color, transform: active ? 'scaleX(1)' : 'scaleX(0.18)' }}
        aria-hidden="true"
      />
      <span className="legend block text-[8.5px]" style={{ color }}>
        {legend}
      </span>
      <span className="num mt-2 block text-[15px] leading-tight font-bold text-ink">{label}</span>
      <div className="mt-3">{children}</div>
    </button>
  )
}

function Stat({ k, v, c }: { k: string; v: string; c?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-etch/50 py-1.5 last:border-0">
      <span className="mono text-[9.5px] tracking-[0.04em] text-legend-dim">{k}</span>
      <span
        className="num text-[12px] font-semibold tabular-nums"
        style={{ color: c ?? '#E6E9EC' }}
      >
        {v}
      </span>
    </div>
  )
}

export default function FlowDiagram({
  rec,
  selected,
  onSelect,
}: {
  rec: SessionRec
  selected: Selection | null
  onSelect: (s: Selection) => void
}) {
  const isBus = (k: string) => selected?.kind === 'bus' && selected.key === k
  const isStage = (id: string) => selected?.kind === 'stage' && selected.id === id

  const activeBuses: BusRec[] = rec.buses

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-1">
      <Node
        label={`${rec.total} tracks`}
        legend="01 · Individual tracks"
        color="#E6E9EC"
        active={isStage('tracks')}
        onClick={() => onSelect({ kind: 'stage', id: 'tracks' })}
        className="lg:flex-1"
      >
        <Stat k="Peak range" v={`${rec.trackPeak[0]} … ${rec.trackPeak[1]}`} />
        <Stat k="Fader starts" v="per element" />
        <Stat k="Set at" v="preamp / trim" c="#35E08A" />
      </Node>

      <Arrow />

      <Node
        label={`${activeBuses.length} group buses`}
        legend="02 · Group buses"
        color="#F5A524"
        active={false}
        onClick={() => onSelect({ kind: 'stage', id: 'tracks' })}
        className="lg:flex-[1.6]"
      >
        <div className="space-y-1">
          {activeBuses.length === 0 && (
            <p className="mono text-[10px] text-legend-dim">No buses — no tracks yet.</p>
          )}
          {activeBuses.map((b) => (
            <span
              key={b.def.key}
              className={`flex items-center gap-2 rounded-[2px] border px-2 py-1.5 transition-colors ${
                isBus(b.def.key) ? 'border-[color:var(--c)] bg-white/[0.04]' : 'border-etch/70'
              }`}
              style={{ ['--c' as string]: b.def.color }}
            >
              <span
                className="h-[6px] w-[6px] shrink-0 rounded-full"
                style={{ background: b.def.color }}
                aria-hidden="true"
              />
              <span className="mono flex-1 truncate text-[9.5px] text-ink">{b.def.name}</span>
              <span className="num text-[10px] font-semibold tabular-nums text-legend">
                {b.count}
              </span>
              <span
                className="num text-[9.5px] font-semibold tabular-nums"
                style={{ color: b.def.color }}
              >
                {b.peak[0]}…{b.peak[1]}
              </span>
            </span>
          ))}
        </div>
      </Node>

      <Arrow />

      <Node
        label="Mix Bus"
        legend="03 · Mix bus"
        color="#F5A524"
        active={isStage('mixbus')}
        onClick={() => onSelect({ kind: 'stage', id: 'mixbus' })}
        className="lg:flex-1"
      >
        <Stat k="Peak" v={`${rec.busPeak[0]} … ${rec.busPeak[1]}`} c="#F5A524" />
        <Stat k="Loudness" v={rec.mixBus.loudness.replace('LUFS-S', '')} />
        <Stat k="Limiter" v="off" c="#FF4D4D" />
      </Node>

      <Arrow />

      <Node
        label="Pre-Master"
        legend="04 · Handover"
        color="#FF7A45"
        active={isStage('premaster')}
        onClick={() => onSelect({ kind: 'stage', id: 'premaster' })}
        className="lg:flex-1"
      >
        <Stat k="Peak" v="-6 … -3" c="#FF7A45" />
        <Stat k="True peak" v="≤ -3 dBTP" />
        <Stat k="Loudness" v="-18 … -14" />
      </Node>

      <Arrow />

      <Node
        label="Master"
        legend="05 · Delivery"
        color="#FF4D4D"
        active={isStage('master')}
        onClick={() => onSelect({ kind: 'stage', id: 'master' })}
        className="lg:flex-1"
      >
        <Stat k="Loudness" v="-14 LUFS-I" c="#FF4D4D" />
        <Stat k="True peak" v="-1.0 dBTP" />
        <Stat k="File" v="16-bit WAV" />
      </Node>
    </div>
  )
}
