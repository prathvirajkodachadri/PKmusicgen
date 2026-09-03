import type { CSSProperties } from 'react'
import { X } from 'lucide-react'
import type { Track } from '../../data/planner'

const pos = (db: number) => ((Math.max(-60, Math.min(0, db)) + 60) / 60) * 100

const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const peakColor = (hi: number) => (hi >= -3 ? '#FF4D4D' : hi >= -8 ? '#F5A524' : '#35E08A')

function fmt(v: number) {
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}`
}

export default function ChannelStrip({
  track,
  color,
  busShort,
  peak,
  suggestedFader,
  selected,
  onSelect,
  onFader,
  onPan,
  onRemove,
}: {
  track: Track
  color: string
  busShort: string
  peak: [number, number]
  suggestedFader: number
  selected: boolean
  onSelect: () => void
  onFader: (v: number) => void
  onPan: (v: number) => void
  onRemove: () => void
}) {
  const h = hash(track.uid)
  const s0 = (pos(peak[0]) / pos(peak[1])).toFixed(3)
  const led = peakColor(peak[1])
  const delta = track.fader - suggestedFader
  const offSuggestion = Math.abs(delta) >= 4

  const meterStyle: CSSProperties = {
    ['--s0' as string]: s0,
    animationDuration: `${2 + (h % 15) / 10}s`,
    animationDelay: `-${(h % 19) / 10}s`,
  }

  return (
    <div
      className={`group/station relative flex w-[112px] shrink-0 flex-col rounded-[3px] border bg-[linear-gradient(180deg,#1a1f24,#141819)] transition-colors ${
        selected ? 'border-amber' : 'border-etch hover:border-[#39424b]'
      }`}
    >
      <span
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-[2px]"
        style={{ background: color }}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Inspect ${track.name}`}
        className="w-full px-2.5 pt-3.5 pb-2 text-left"
      >
        <span className="flex items-center justify-between gap-1">
          <span className="legend text-[8px]" style={{ color }}>
            {busShort}
          </span>
          <span
            className="h-[6px] w-[6px] shrink-0 rounded-full"
            style={{ background: led, boxShadow: `0 0 6px ${led}` }}
            title={`Peak headroom indicator — target ceiling ${peak[1]} dBFS`}
            aria-hidden="true"
          />
        </span>
        <p className="mt-1.5 truncate text-[11.5px] leading-tight font-medium text-ink">
          {track.name}
        </p>
        <p className="mono mt-1 text-[9px] leading-none tracking-[0.02em] text-legend-dim">
          {peak[0]} … {peak[1]} <span className="text-[8px]">dBFS</span>
        </p>
      </button>

      <div className="flex items-end gap-2 px-2.5 pb-2">
        {/* Meter */}
        <div
          className="meter-ticks relative h-[122px] w-[13px] shrink-0 overflow-hidden rounded-[2px] border border-[#20262c] bg-[#0b0f12]"
          role="img"
          aria-label={`Recommended peak zone ${peak[0]} to ${peak[1]} dBFS`}
        >
          <span
            className="absolute right-0 left-0 rounded-[1px]"
            style={{
              bottom: `${pos(peak[0])}%`,
              height: `${Math.max(2, pos(peak[1]) - pos(peak[0]))}%`,
              background: `${color}2e`,
              borderTop: `1px solid ${color}`,
            }}
            aria-hidden="true"
          />
          <span
            className="meter-bar absolute right-[2px] bottom-0 left-[2px] rounded-[1px]"
            style={{
              height: `${pos(peak[1])}%`,
              background: `linear-gradient(to top, ${color}, ${led})`,
              ...meterStyle,
            }}
            aria-hidden="true"
          />
          {/* -18 dBFS converter reference tick */}
          <span
            className="absolute right-0 left-0 h-px bg-white/20"
            style={{ bottom: `${pos(-18)}%` }}
            aria-hidden="true"
          />
        </div>

        {/* Fader */}
        <div className="relative h-[122px] w-[30px] shrink-0">
          <input
            type="range"
            min={-40}
            max={12}
            step={0.5}
            value={track.fader}
            onChange={(e) => onFader(Number(e.target.value))}
            aria-label={`${track.name} fader`}
            className="fader absolute top-1/2 left-1/2 h-[30px] w-[122px] -translate-x-1/2 -translate-y-1/2 -rotate-90"
          />
          <span className="mono pointer-events-none absolute -right-0.5 top-0 text-[7px] text-legend-dim">
            +
          </span>
          <span className="mono pointer-events-none absolute -right-0.5 bottom-0 text-[7px] text-legend-dim">
            −
          </span>
        </div>
      </div>

      <div className="px-2.5 pb-1.5">
        <div className="flex items-baseline justify-between">
          <span
            className="num text-[12.5px] leading-none font-semibold tabular-nums"
            style={{ color: offSuggestion ? '#F5A524' : '#E6E9EC' }}
          >
            {fmt(track.fader)}
          </span>
          <span className="mono text-[8px] leading-none text-legend-dim">dB</span>
        </div>
        {offSuggestion ? (
          <p className="mono mt-1 text-[8px] leading-tight text-amber">
            {delta > 0 ? '+' : ''}
            {delta.toFixed(1)} vs start
          </p>
        ) : (
          <p className="mono mt-1 text-[8px] leading-tight text-legend-dim">
            start {fmt(suggestedFader)}
          </p>
        )}
      </div>

      <div className="px-2.5 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="mono w-[7px] shrink-0 text-[7px] text-legend-dim">L</span>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={track.pan}
            onChange={(e) => onPan(Number(e.target.value))}
            aria-label={`${track.name} pan`}
            className="mini-range h-[10px] w-full"
          />
          <span className="mono w-[7px] shrink-0 text-right text-[7px] text-legend-dim">R</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${track.name}`}
        className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-[2px] border border-transparent text-legend-dim opacity-0 transition-all group-hover/station:opacity-100 hover:border-clip/50 hover:text-clip focus-visible:opacity-100"
      >
        <X size={11} strokeWidth={2.5} />
      </button>
    </div>
  )
}
