import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CircleAlert,
  Info,
  Plus,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import {
  analyse,
  busDef,
  GROUP_ORDER,
  PRESETS,
  TRACK_TYPES,
  makeTrack,
  tracksFromPreset,
  typeOf,
  type BusDef,
  type Selection,
  type Track,
} from '../data/planner'
import ChannelStrip from '../components/planner/ChannelStrip'
import FlowDiagram from '../components/planner/FlowDiagram'
import { Item, NotRule, RackUnit, Stagger, Tip } from '../components/ui'

const CUSTOM_COLORS = ['#F472B6', '#34D399', '#60A5FA', '#FBBF24', '#A78BFA', '#FB923C']

const riskMeta = {
  low: { label: 'Healthy', color: '#35E08A' },
  medium: { label: 'Watch it', color: '#F5A524' },
  high: { label: 'Summing risk', color: '#FF4D4D' },
} as const

function TypeOptions() {
  const groups = [...new Set(TRACK_TYPES.map((t) => t.group))]
  return (
    <>
      {groups.map((g) => (
        <optgroup key={g} label={busDef(g).label}>
          {TRACK_TYPES.filter((t) => t.group === g).map((t) => (
            <option key={t.id} value={t.id} className="bg-[#0e1215]">
              {t.name}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  )
}

export default function Planner() {
  const [tracks, setTracks] = useState<Track[]>(() => tracksFromPreset(PRESETS[1]))
  const [presetId, setPresetId] = useState('medium')
  const [customs, setCustoms] = useState<Record<string, BusDef>>({})
  const [selection, setSelection] = useState<Selection | null>(null)
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [addTypeId, setAddTypeId] = useState('kick')
  const [addCount, setAddCount] = useState(1)
  const [customName, setCustomName] = useState('')

  const rec = useMemo(() => analyse(tracks, customs), [tracks, customs])
  const selectedTrack = tracks.find((t) => t.uid === selectedUid) ?? null

  /* ------------------------------------------------------------ mutations */

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)
    if (!p) return
    setTracks(tracksFromPreset(p))
    setPresetId(id)
    setSelection(null)
    setSelectedUid(null)
  }

  const patch = (uid: string, fn: (t: Track) => Track) =>
    setTracks((ts) => ts.map((t) => (t.uid === uid ? fn(t) : t)))

  const addTracks = () => {
    const t = typeOf(addTypeId)
    const added: Track[] = []
    for (let i = 0; i < addCount; i++) {
      const n = tracks.length + i + 1
      added.push(makeTrack(t.id, undefined, addCount === 1 ? t.name : `${t.name} ${n}`))
    }
    setTracks((ts) => [...ts, ...added])
    setPresetId('')
    setSelectedUid(added[added.length - 1].uid)
    setSelection(null)
  }

  const removeTrack = (uid: string) => {
    setTracks((ts) => ts.filter((t) => t.uid !== uid))
    if (selectedUid === uid) setSelectedUid(null)
  }

  const createGroup = () => {
    const name = customName.trim()
    if (!name) return
    const key = `cx-${Date.now().toString(36)}`
    const short = name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'CX'
    setCustoms((c) => ({
      ...c,
      [key]: {
        key,
        name: `${name.toUpperCase()} BUS`,
        label: name,
        short,
        color: CUSTOM_COLORS[Object.keys(c).length % CUSTOM_COLORS.length],
        purpose:
          'A group you created. Define it by what it delivers — a stem, a stem-to-be, or an element that belongs nowhere else.',
        gainStage: [
          'Keep the same headroom target as every other bus in the session.',
          'If this becomes a delivered stem, keep mix bus processing off it.',
          'Name it after its role, not its contents — future-you has to find it fast.',
        ],
      },
    }))
    setCustomName('')
  }

  const deleteGroup = (key: string) => {
    setTracks((ts) => ts.map((t) => (t.group === key ? { ...t, group: 'custom' } : t)))
    setCustoms((c) => {
      const n = { ...c }
      delete n[key]
      return n
    })
    setSelection(null)
  }

  const selectBus = (key: string) => {
    setSelectedUid(null)
    setSelection({ kind: 'bus', key })
  }
  const selectStage = (id: 'tracks' | 'mixbus' | 'premaster' | 'master') => {
    setSelectedUid(null)
    setSelection({ kind: 'stage', id })
  }
  const selectTrack = (uid: string) => {
    setSelectedUid(uid)
    setSelection(null)
  }

  /* --------------------------------------------------------------- render */

  const warningIcon = { info: Info, caution: TriangleAlert, alert: CircleAlert }

  return (
    <div className="py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <Link
          to="/"
          className="legend inline-flex items-center gap-2 text-[9.5px] text-legend-dim transition-colors hover:text-amber"
        >
          <ArrowLeft size={12} /> Back to the field guide
        </Link>

        {/* ------------------------------------------------------------ Header */}
        <header className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[72ch]">
            <div className="flex items-center gap-3">
              <span className="legend">Interactive planning tool</span>
              <NotRule>every figure is a starting point</NotRule>
            </div>
            <h1 className="num mt-4 text-[clamp(2.1rem,5.4vw,3.6rem)] leading-[1.02] font-bold tracking-[-0.03em] text-ink">
              Track & Group <span className="text-amber">Planner</span>
            </h1>
            <p className="mt-5 text-[15px] leading-[1.75] text-legend">
              Build the session before you open the DAW. Pick a preset or add tracks one type at a
              time — the routing, bus structure, starting levels and headroom targets rebuild
              themselves as you go, and the warnings tell you where the structure is likely to get
              into trouble.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset(presetId || 'medium')}
              className="legend inline-flex items-center gap-2 rounded-[2px] border border-etch bg-unit px-3.5 py-2.5 text-[9px] transition-colors hover:border-amber hover:text-amber"
            >
              <RotateCcw size={12} /> Reset to preset
            </button>
            <button
              type="button"
              onClick={() => {
                setTracks([])
                setPresetId('')
                setSelection(null)
                setSelectedUid(null)
              }}
              className="legend inline-flex items-center gap-2 rounded-[2px] border border-clip/40 bg-clip/10 px-3.5 py-2.5 text-[9px] text-clip transition-colors hover:bg-clip/20"
            >
              <Trash2 size={12} /> Clear session
            </button>
          </div>
        </header>

        {/* ----------------------------------------------------------- Presets */}
        <section className="mt-10" aria-label="Session presets">
          <div className="mb-3 flex items-center gap-3">
            <span className="legend">Presets</span>
            <span className="hairline h-px flex-1" />
            <span className="mono hidden text-[10px] text-legend-dim sm:block">
              fully editable after loading
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                title={p.desc}
                aria-pressed={presetId === p.id}
                className={`group relative overflow-hidden rounded-[2px] border px-3.5 py-2.5 text-left transition-colors ${
                  presetId === p.id
                    ? 'border-[color:var(--c)] bg-white/[0.045]'
                    : 'border-etch bg-unit hover:border-legend-dim'
                }`}
                style={{ ['--c' as string]: p.color }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-[6px] w-[6px] shrink-0 rounded-full"
                    style={{ background: p.color, opacity: presetId === p.id ? 1 : 0.5 }}
                    aria-hidden="true"
                  />
                  <span
                    className="num text-[12.5px] font-semibold"
                    style={{ color: presetId === p.id ? p.color : '#E6E9EC' }}
                  >
                    {p.name}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------- Adders */}
        <section className="mt-6 grid gap-4 lg:grid-cols-12" aria-label="Add tracks and groups">
          <RackUnit className="p-4 lg:col-span-8">
            <div className="relative z-10">
              <span className="legend text-[9px]">Add tracks</span>
              <div className="mt-3 flex flex-wrap items-end gap-2.5">
                <label className="min-w-[180px] flex-1">
                  <span className="mono mb-1.5 block text-[9.5px] text-legend-dim">Track type</span>
                  <select
                    value={addTypeId}
                    onChange={(e) => setAddTypeId(e.target.value)}
                    className="panel-input h-9 w-full rounded-[2px] px-2.5 text-[12.5px]"
                  >
                    <TypeOptions />
                  </select>
                </label>
                <label className="w-[92px]">
                  <span className="mono mb-1.5 block text-[9.5px] text-legend-dim">Count</span>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={addCount}
                    onChange={(e) =>
                      setAddCount(Math.min(32, Math.max(1, Number(e.target.value) || 1)))
                    }
                    className="panel-input h-9 w-full rounded-[2px] px-2.5 text-center text-[13px] tabular-nums"
                  />
                </label>
                <button
                  type="button"
                  onClick={addTracks}
                  className="inline-flex h-9 items-center gap-2 rounded-[2px] border border-amber/50 bg-amber/12 px-4 text-[12.5px] font-medium text-amber transition-colors hover:bg-amber/22"
                >
                  <Plus size={13} strokeWidth={2.5} /> Add
                </button>
                <span className="mono ml-auto text-[11px] tabular-nums text-legend-dim">
                  {rec.total} track{rec.total === 1 ? '' : 's'} · {rec.buses.length} bus
                  {rec.buses.length === 1 ? '' : 'es'} · {rec.scale} session
                </span>
              </div>
            </div>
          </RackUnit>

          <RackUnit className="p-4 lg:col-span-4">
            <div className="relative z-10">
              <span className="legend text-[9px]">Custom group</span>
              <div className="mt-3 flex items-end gap-2.5">
                <label className="min-w-0 flex-1">
                  <span className="mono mb-1.5 block text-[9.5px] text-legend-dim">Group name</span>
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createGroup()}
                    placeholder="e.g. Brass Stems"
                    className="panel-input h-9 w-full rounded-[2px] px-2.5 text-[12.5px] placeholder:text-legend-dim"
                  />
                </label>
                <button
                  type="button"
                  onClick={createGroup}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[2px] border border-etch bg-unit px-3.5 text-[12.5px] text-ink transition-colors hover:border-amber hover:text-amber"
                >
                  <Plus size={13} strokeWidth={2.5} /> Create
                </button>
              </div>
              {Object.keys(customs).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.values(customs).map((c) => (
                    <span
                      key={c.key}
                      className="mono flex items-center gap-1.5 rounded-[2px] border border-etch px-2 py-1 text-[9.5px] text-legend"
                    >
                      <span
                        className="h-[5px] w-[5px] rounded-full"
                        style={{ background: c.color }}
                        aria-hidden="true"
                      />
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </RackUnit>
        </section>

        {/* ---------------------------------------------------- Starting levels */}
        <section className="mt-8" aria-label="Recommended starting levels">
          <div className="mb-4 flex items-center gap-3">
            <span className="legend">Recommended starting levels</span>
            <NotRule>context, not arithmetic</NotRule>
            <span className="hairline h-px flex-1" />
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-5">
              {[
                {
                  k: 'Individual tracks',
                  v: rec.levels.track,
                  c: '#35E08A',
                  n: 'Set at capture, adjusted at the channel. Peak, not fader position.',
                },
                {
                  k: 'Group buses',
                  v: rec.levels.bus,
                  c: '#8BC34A',
                  n: `${rec.buses.length} bus${rec.buses.length === 1 ? '' : 'es'} in the session.`,
                },
                {
                  k: 'Mix bus',
                  v: rec.levels.mix,
                  c: '#F5A524',
                  n: 'No limiter engaged at this stage.',
                },
                {
                  k: 'Pre-master',
                  v: rec.levels.pre,
                  c: '#FF7A45',
                  n: 'The handover to mastering.',
                },
                {
                  k: 'Master',
                  v: rec.levels.master,
                  c: '#FF4D4D',
                  n: 'Streaming delivery target.',
                },
              ].map((s) => (
                <Item key={s.k} className="h-full">
                  <RackUnit className="h-full p-4">
                    <div className="relative z-10">
                      <span className="legend text-[8.5px]">{s.k}</span>
                      <p
                        className="num mt-2.5 text-[16px] leading-tight font-bold tabular-nums"
                        style={{ color: s.c }}
                      >
                        {s.v}
                      </p>
                      <p className="mt-2.5 text-[11.5px] leading-snug text-legend-dim">{s.n}</p>
                    </div>
                  </RackUnit>
                </Item>
              ))}
            </Stagger>

            <RackUnit className="p-5 lg:col-span-3">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="legend text-[9px]">Structural load</span>
                  <span
                    className="num text-[13px] font-bold tabular-nums"
                    style={{ color: riskMeta[
                      rec.riskScore > 66 ? 'high' : rec.riskScore > 33 ? 'medium' : 'low'
                    ].color }}
                  >
                    {rec.riskScore}%
                  </span>
                </div>
                <div className="mt-3 h-[7px] overflow-hidden rounded-full bg-[#12161a]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{
                      width: `${rec.riskScore}%`,
                      background:
                        rec.riskScore > 66
                          ? '#FF4D4D'
                          : rec.riskScore > 33
                            ? '#F5A524'
                            : '#35E08A',
                    }}
                  />
                </div>
                <p className="mt-3.5 text-[12px] leading-relaxed text-legend">
                  A proxy for how much the structure is asking of your headroom, your CPU and your
                  attention. It is not a quality score — a big orchestral session scores high and can
                  still be beautifully organised.
                </p>
                <dl className="mt-4 space-y-1.5 border-t border-etch/70 pt-3">
                  {[
                    ['Tracks', String(rec.total)],
                    ['Group buses', String(rec.buses.length)],
                    ['Mix bus headroom', rec.busHeadroom],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-2">
                      <dt className="mono text-[9.5px] text-legend-dim">{k}</dt>
                      <dd className="num text-[11.5px] font-semibold tabular-nums text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </RackUnit>
          </div>

          <p className="mt-4 max-w-[92ch] text-[12.5px] leading-relaxed text-legend-dim">
            <span className="text-amber">Read this first:</span> nothing below implies that summing a
            given number of tracks requires a particular fader position. Real mix levels come from
            arrangement, source dynamics, processing, panning and musical balance. The figures here
            are calibration anchors and worst-case bounds that tell you how much headroom the
            structure needs — never what the balance should be.
          </p>
        </section>

        {/* ---------------------------------------------------------- Warnings */}
        {rec.warnings.length > 0 && (
          <section className="mt-10" aria-label="Structural warnings">
            <div className="mb-4 flex items-center gap-3">
              <span className="legend">
                Structural notes · {rec.warnings.length}
              </span>
              <span className="hairline h-px flex-1" />
            </div>
            <Stagger className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rec.warnings.map((w) => {
                const Icon = warningIcon[w.level]
                const c =
                  w.level === 'alert' ? '#FF4D4D' : w.level === 'caution' ? '#F5A524' : '#8B949E'
                return (
                  <Item key={w.id} className="h-full">
                    <div
                      className="h-full rounded-[3px] border bg-[#15191d] p-4"
                      style={{ borderColor: `${c}33` }}
                    >
                      <div className="flex items-start gap-2.5">
                        <Icon size={14} className="mt-[2px] shrink-0" style={{ color: c }} />
                        <div className="min-w-0">
                          <p className="text-[13px] leading-snug font-medium text-ink">{w.title}</p>
                          {w.scope && (
                            <span
                              className="mono mt-1 block text-[9px] tracking-[0.06em]"
                              style={{ color: w.color ?? c }}
                            >
                              {w.scope}
                            </span>
                          )}
                          <p className="mt-2 text-[12px] leading-relaxed text-legend">{w.body}</p>
                        </div>
                      </div>
                    </div>
                  </Item>
                )
              })}
            </Stagger>
          </section>
        )}

        {/* ------------------------------------------------------------- Mixer */}
        <section className="mt-12" aria-label="Session mixer">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="legend">Session mixer</span>
            <span className="hairline h-px flex-1" />
            <span className="mono hidden text-[10px] text-legend-dim md:block">
              meters are illustrative — the band shows each element’s recommended peak zone
            </span>
          </div>

          <RackUnit className="overflow-hidden p-3 sm:p-5">
            <div className="relative z-10 space-y-4">
              {rec.total === 0 && (
                <p className="mono py-10 text-center text-[12px] text-legend-dim">
                  Session empty. Load a preset or add tracks above.
                </p>
              )}

              {rec.buses.map((b) => {
                const rm = riskMeta[b.risk]
                return (
                  <div
                    key={b.def.key}
                    className="flex flex-col gap-3 border-b border-etch/50 pb-4 last:border-0 lg:flex-row"
                  >
                    {/* Bus card */}
                    <button
                      type="button"
                      onClick={() => selectBus(b.def.key)}
                      aria-pressed={selection?.kind === 'bus' && selection.key === b.def.key}
                      className={`relative w-full shrink-0 overflow-hidden rounded-[3px] border bg-[linear-gradient(180deg,#1a1f24,#141819)] p-4 text-left transition-colors lg:w-[248px] ${
                        selection?.kind === 'bus' && selection.key === b.def.key
                          ? 'border-[color:var(--c)]'
                          : 'border-etch hover:border-[#39424b]'
                      }`}
                      style={{ ['--c' as string]: b.def.color }}
                    >
                      <span
                        className="absolute inset-y-0 left-0 w-[3px]"
                        style={{ background: b.def.color }}
                        aria-hidden="true"
                      />
                      <div className="flex items-center justify-between gap-2 pl-1.5">
                        <span className="num truncate text-[14px] font-bold text-ink">
                          {b.def.name}
                        </span>
                        <span className="num text-[15px] font-bold tabular-nums text-legend">
                          {b.count}
                        </span>
                      </div>

                      <div className="mt-3.5 pl-1.5">
                        <span className="legend block text-[8px]">Bus peak target</span>
                        <span
                          className="num mt-1 block text-[17px] leading-none font-bold tabular-nums"
                          style={{ color: b.def.color }}
                        >
                          {b.peak[0]} … {b.peak[1]}
                          <span className="mono ml-1.5 text-[9px] font-normal text-legend-dim">
                            dBFS
                          </span>
                        </span>

                        <div className="mt-3 flex items-center gap-2">
                          <span
                            className="h-[6px] w-[6px] shrink-0 rounded-full"
                            style={{ background: rm.color, boxShadow: `0 0 6px ${rm.color}` }}
                            aria-hidden="true"
                          />
                          <span className="mono text-[9.5px]" style={{ color: rm.color }}>
                            {rm.label}
                          </span>
                          <span className="mono ml-auto text-[9px] text-legend-dim">
                            bound {b.worstCase > 0 ? '+' : ''}
                            {b.worstCase.toFixed(0)} dBFS
                          </span>
                        </div>

                        {b.subBuses && (
                          <p className="mono mt-2.5 text-[9px] leading-relaxed text-amber">
                            sub-group → {b.subBuses.join(' / ')}
                          </p>
                        )}
                        <p className="mono mt-2.5 text-[9px] text-legend-dim">
                          headroom {b.headroom}
                        </p>
                      </div>
                    </button>

                    {/* Channel strips */}
                    <div className="min-w-0 flex-1">
                      <div className="mixer-scroll flex gap-2 overflow-x-auto pb-2">
                        {b.tracks.map((t) => {
                          const tt = typeOf(t.typeId)
                          return (
                            <ChannelStrip
                              key={t.uid}
                              track={t}
                              color={b.def.color}
                              busShort={b.def.short}
                              peak={tt.peak}
                              suggestedFader={tt.fader}
                              selected={selectedUid === t.uid}
                              onSelect={() => selectTrack(t.uid)}
                              onFader={(v) => patch(t.uid, (x) => ({ ...x, fader: v }))}
                              onPan={(v) => patch(t.uid, (x) => ({ ...x, pan: v }))}
                              onRemove={() => removeTrack(t.uid)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </RackUnit>
        </section>

        {/* -------------------------------------------------------- Signal flow */}
        <section className="mt-12" aria-label="Signal flow">
          <div className="mb-4 flex items-center gap-3">
            <span className="legend">Signal flow · click any stage</span>
            <span className="hairline h-px flex-1" />
          </div>
          <RackUnit className="p-3 sm:p-5">
            <div className="relative z-10">
              <FlowDiagram rec={rec} selected={selection} onSelect={(s) => {
                setSelectedUid(null)
                setSelection(s)
              }} />
            </div>
          </RackUnit>
        </section>

        {/* ---------------------------------------------------------- Inspector */}
        <section className="mt-8" aria-label="Inspector">
          <div className="mb-4 flex items-center gap-3">
            <span className="legend">Inspector</span>
            <span className="hairline h-px flex-1" />
          </div>

          <RackUnit className="p-5 sm:p-7">
            <div className="relative z-10">
              {/* ---------------- Track ---------------- */}
              {selectedTrack &&
                (() => {
                  const tt = typeOf(selectedTrack.typeId)
                  const bus = busDef(selectedTrack.group, customs)
                  const delta = selectedTrack.fader - tt.fader
                  return (
                    <div className="grid gap-7 lg:grid-cols-12">
                      <div className="lg:col-span-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-[7px] w-[7px] rounded-full"
                            style={{ background: bus.color, boxShadow: `0 0 8px ${bus.color}` }}
                            aria-hidden="true"
                          />
                          <h3 className="num text-[19px] font-bold text-ink">Track</h3>
                        </div>

                        <div className="mt-5 space-y-3.5">
                          <label className="block">
                            <span className="legend mb-1.5 block text-[9px]">Track name</span>
                            <input
                              value={selectedTrack.name}
                              onChange={(e) =>
                                patch(selectedTrack.uid, (x) => ({ ...x, name: e.target.value }))
                              }
                              className="panel-input h-9 w-full rounded-[2px] px-2.5 text-[13px]"
                            />
                          </label>
                          <label className="block">
                            <span className="legend mb-1.5 block text-[9px]">Track type</span>
                            <select
                              value={selectedTrack.typeId}
                              onChange={(e) => {
                                const nt = typeOf(e.target.value)
                                patch(selectedTrack.uid, (x) => ({
                                  ...x,
                                  typeId: nt.id,
                                  fader: nt.fader,
                                  group: nt.group === 'custom' ? x.group : nt.group,
                                }))
                              }}
                              className="panel-input h-9 w-full rounded-[2px] px-2.5 text-[13px]"
                            >
                              <TypeOptions />
                            </select>
                          </label>
                          <label className="block">
                            <span className="legend mb-1.5 block text-[9px]">Assigned bus</span>
                            <select
                              value={selectedTrack.group}
                              onChange={(e) =>
                                patch(selectedTrack.uid, (x) => ({ ...x, group: e.target.value }))
                              }
                              className="panel-input h-9 w-full rounded-[2px] px-2.5 text-[13px]"
                            >
                              {GROUP_ORDER.map((g) => (
                                <option key={g} value={g} className="bg-[#0e1215]">
                                  {busDef(g, customs).name}
                                </option>
                              ))}
                              {Object.values(customs).map((c) => (
                                <option key={c.key} value={c.key} className="bg-[#0e1215]">
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeTrack(selectedTrack.uid)}
                          className="legend mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[2px] border border-clip/40 bg-clip/10 py-2.5 text-[9px] text-clip transition-colors hover:bg-clip/20"
                        >
                          <Trash2 size={12} /> Remove from session
                        </button>
                      </div>

                      <div className="lg:col-span-4">
                        <p className="legend mb-3 text-[9px]">Recommended starting point</p>
                        <dl className="space-y-2.5">
                          {[
                            ['Peak level', `${tt.peak[0]} to ${tt.peak[1]} dBFS`, tt.peak[1] >= -3 ? '#FF4D4D' : '#35E08A'],
                            ['Fader start', `${tt.fader > 0 ? '+' : ''}${tt.fader.toFixed(1)} dB`, '#F5A524'],
                            ['Current fader', `${selectedTrack.fader > 0 ? '+' : ''}${selectedTrack.fader.toFixed(1)} dB`, Math.abs(delta) >= 4 ? '#F5A524' : '#E6E9EC'],
                            ['Role', tt.role, '#E6E9EC'],
                            ['Assigned bus', bus.name, bus.color],
                            ['Typical count', `${tt.typical[0]}–${tt.typical[1]} per session`, '#E6E9EC'],
                          ].map(([k, v, c]) => (
                            <div
                              key={k as string}
                              className="flex items-baseline justify-between gap-3 border-b border-etch/60 pb-2"
                            >
                              <dt className="legend text-[9px]">{k}</dt>
                              <dd
                                className="num text-right text-[13px] font-semibold tabular-nums"
                                style={{ color: c as string }}
                              >
                                {v}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        {Math.abs(delta) >= 4 && (
                          <p className="mt-3 rounded-[2px] border border-amber/30 bg-amber/[0.07] px-3 py-2.5 text-[12px] leading-relaxed text-ink">
                            <span className="text-amber">Fader is {Math.abs(delta).toFixed(1)} dB{' '}{delta > 0 ? 'above' : 'below'} its suggested start.</span>{' '}
                            That is completely fine if the balance is right — the suggestion is only a
                            neutral entry point. If the channel is running out of travel in one
                            direction, trim the input instead.
                          </p>
                        )}
                      </div>

                      <div className="lg:col-span-4">
                        <p className="legend mb-3 text-[9px]">{tt.name} — notes</p>
                        <p className="text-[13px] leading-relaxed text-ink">{tt.note}</p>
                        <div className="mt-5 rounded-[2px] border border-etch bg-black/25 p-4">
                          <p className="legend text-[9px] text-amber">Headroom guidance</p>
                          <ul className="mt-2.5 space-y-2">
                            <li className="flex gap-2 text-[12.5px] leading-relaxed text-legend">
                              <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-amber" />
                              Capture at the preamp so peaks land in range. Do not fix a hot take with
                              the DAW fader.
                            </li>
                            <li className="flex gap-2 text-[12.5px] leading-relaxed text-legend">
                              <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-amber" />
                              At the mix, the channel peak matters more than the fader number. Both
                              feed the same bus.
                            </li>
                            <li className="flex gap-2 text-[12.5px] leading-relaxed text-legend">
                              <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-amber" />
                              Use a trim plugin at the top of the strip rather than pushing plugins
                              hard with the fader.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )
                })()}

              {/* ---------------- Bus ---------------- */}
              {!selectedTrack && selection?.kind === 'bus' &&
                (() => {
                  const b = rec.buses.find((x) => x.def.key === selection.key)
                  if (!b) return <p className="text-[13px] text-legend">That bus is now empty.</p>
                  const rm = riskMeta[b.risk]
                  const isCustom = !!customs[b.def.key]
                  return (
                    <div className="grid gap-7 lg:grid-cols-12">
                      <div className="lg:col-span-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-[7px] w-[7px] rounded-full"
                            style={{ background: b.def.color, boxShadow: `0 0 8px ${b.def.color}` }}
                            aria-hidden="true"
                          />
                          <h3 className="num text-[19px] font-bold text-ink">{b.def.name}</h3>
                        </div>
                        <p className="mt-3.5 text-[13px] leading-relaxed text-legend">
                          {b.def.purpose}
                        </p>

                        <dl className="mt-5 space-y-2.5">
                          {[
                            ['Tracks feeding it', String(b.count), '#E6E9EC'],
                            ['Bus peak target', `${b.peak[0]} to ${b.peak[1]} dBFS`, b.def.color],
                            ['Headroom', b.headroom, '#E6E9EC'],
                            ['Worst-case sum', `${b.worstCase > 0 ? '+' : ''}${b.worstCase.toFixed(1)} dBFS`, rm.color],
                            ['Group coherence', `${Math.round(b.coherence * 100)}% grid-aligned`, '#E6E9EC'],
                            ['Risk', rm.label, rm.color],
                          ].map(([k, v, c]) => (
                            <div
                              key={k}
                              className="flex items-baseline justify-between gap-3 border-b border-etch/60 pb-2"
                            >
                              <dt className="legend text-[9px]">{k}</dt>
                              <dd
                                className="num text-right text-[13px] font-semibold tabular-nums"
                                style={{ color: c }}
                              >
                                {v}
                              </dd>
                            </div>
                          ))}
                        </dl>

                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => deleteGroup(b.def.key)}
                            className="legend mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[2px] border border-clip/40 bg-clip/10 py-2.5 text-[9px] text-clip transition-colors hover:bg-clip/20"
                          >
                            <Trash2 size={12} /> Delete group (tracks move to Custom)
                          </button>
                        )}
                      </div>

                      <div className="lg:col-span-4">
                        <p className="legend mb-3 text-[9px]">Gain staging on this bus</p>
                        <ol className="space-y-2.5">
                          {b.gainStage.map((g, i) => (
                            <li key={i} className="flex gap-3">
                              <span
                                className="num mt-[3px] shrink-0 text-[10px] font-semibold tabular-nums"
                                style={{ color: b.def.color }}
                              >
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span className="text-[12.5px] leading-relaxed text-ink">{g}</span>
                            </li>
                          ))}
                        </ol>
                        <div className="mt-5 rounded-[2px] border border-etch bg-black/25 p-4">
                          <p className="legend text-[9px] text-amber">On the cumulative bound</p>
                          <p className="mt-2 text-[12.5px] leading-relaxed text-legend">
                            {b.trim}
                          </p>
                        </div>
                      </div>

                      <div className="lg:col-span-4">
                        <p className="legend mb-3 text-[9px]">
                          Members · {b.tracks.length}
                        </p>
                        <ul className="space-y-1.5">
                          {b.tracks.map((t) => {
                            const tt = typeOf(t.typeId)
                            return (
                              <li key={t.uid}>
                                <button
                                  type="button"
                                  onClick={() => selectTrack(t.uid)}
                                  className="flex w-full items-baseline gap-3 rounded-[2px] border border-etch/60 px-2.5 py-2 text-left transition-colors hover:border-amber/50"
                                >
                                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                                    {t.name}
                                  </span>
                                  <span className="mono shrink-0 text-[10px] tabular-nums text-legend-dim">
                                    {tt.peak[0]}…{tt.peak[1]}
                                  </span>
                                  <span
                                    className="num w-[46px] shrink-0 text-right text-[11.5px] font-semibold tabular-nums"
                                    style={{ color: t.fader !== tt.fader ? '#F5A524' : '#8B949E' }}
                                  >
                                    {t.fader > 0 ? '+' : ''}
                                    {t.fader.toFixed(1)}
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    </div>
                  )
                })()}

              {/* ---------------- Stage ---------------- */}
              {!selectedTrack && selection?.kind === 'stage' &&
                (() => {
                  const id = selection.id
                  if (id === 'tracks') {
                    return (
                      <div className="grid gap-7 lg:grid-cols-12">
                        <div className="lg:col-span-4">
                          <h3 className="num text-[19px] font-bold text-ink">Individual tracks</h3>
                          <p className="mt-3.5 text-[13px] leading-relaxed text-legend">
                            Track level is a capture decision and a balance decision — never a
                            summing calculation. Set the peak at the preamp so the converter gets a
                            healthy signal, then use the fader to place the element in the mix.
                          </p>
                          <dl className="mt-5 space-y-2.5">
                            {[
                              ['Peak range in this session', rec.levels.track, '#35E08A'],
                              ['Converter reference', 'around -18 dBFS RMS', '#8B949E'],
                              ['Absolute ceiling', '-0.1 dBFS, never 0', '#FF4D4D'],
                              ['Recording headroom', '≥ 6 dB below full scale', '#35E08A'],
                            ].map(([k, v, c]) => (
                              <div
                                key={k}
                                className="flex items-baseline justify-between gap-3 border-b border-etch/60 pb-2"
                              >
                                <dt className="legend text-[9px]">{k}</dt>
                                <dd
                                  className="num text-right text-[12.5px] font-semibold tabular-nums"
                                  style={{ color: c }}
                                >
                                  {v}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                        <div className="lg:col-span-8">
                          <p className="legend mb-3 text-[9px]">Recording vs mixing levels</p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {[
                              {
                                t: 'Recording level',
                                c: '#35E08A',
                                b: 'Set at the preamp, before the converter. Aims for peak headroom and a healthy signal-to-noise ratio. Once the take is captured, this number is baked into the file and does not change.',
                              },
                              {
                                t: 'Mixing level',
                                c: '#F5A524',
                                b: 'Set on the channel fader, and it moves constantly. It expresses balance, not quality. Two tracks at the same fader position can be wildly different loudness — that is the point.',
                              },
                              {
                                t: 'Bus level',
                                c: '#FF7A45',
                                b: 'The sum of a group. It is governed by how many hot elements can coincide, not by a formula. Set it after the group balance is right and leave it.',
                              },
                              {
                                t: 'Delivery level',
                                c: '#FF4D4D',
                                b: 'Integrated loudness and true peak, fixed by the destination. Everything upstream exists to get here without a limiter doing the mixing.',
                              },
                            ].map((x) => (
                              <div
                                key={x.t}
                                className="rounded-[2px] border border-etch bg-black/25 p-4"
                              >
                                <p className="num text-[13px] font-semibold" style={{ color: x.c }}>
                                  {x.t}
                                </p>
                                <p className="mt-2 text-[12.5px] leading-relaxed text-legend">
                                  {x.b}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex items-start gap-3 rounded-[2px] border border-clip/25 bg-clip/[0.05] p-4">
                            <AlertTriangle
                              size={14}
                              className="mt-[2px] shrink-0 text-clip"
                              aria-hidden="true"
                            />
                            <p className="text-[12.5px] leading-relaxed text-ink">
                              No fader position can be derived from track count. Adding a thirtieth
                              track does not mean anything must come down by a fixed amount — it
                              means the arrangement has changed, and the balance has to be
                              re-decided, not recalculated.
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  const src =
                    id === 'mixbus'
                      ? {
                          title: 'Mix Bus',
                          color: '#F5A524',
                          legend: 'Stage 03',
                          peak: `${rec.busPeak[0]} to ${rec.busPeak[1]} dBFS peak`,
                          loudness: rec.mixBus.loudness,
                          headroom: rec.busHeadroom,
                          purpose: rec.mixBus.purpose,
                          gainStage: rec.mixBus.gainStage,
                        }
                      : id === 'premaster'
                        ? {
                            title: 'Pre-Master',
                            color: '#FF7A45',
                            legend: 'Stage 04',
                            peak: `${rec.preMaster.peak[0]} to ${rec.preMaster.peak[1]} dBFS peak`,
                            loudness: rec.preMaster.loudness,
                            headroom: rec.preMaster.tp,
                            purpose: rec.preMaster.purpose,
                            gainStage: rec.preMaster.gainStage,
                          }
                        : {
                            title: 'Master',
                            color: '#FF4D4D',
                            legend: 'Stage 05',
                            peak: '-0.1 dBFS sample peak',
                            loudness: '-14 LUFS-I (streaming) / -16 LUFS-I (Apple)',
                            headroom: '-1.0 dBTP ceiling',
                            purpose:
                              'Tonal balance, dynamics, glue and level, brought to a specification that works on every playback system. Delivery job first, creative job second.',
                            gainStage: [
                              'Set the limiter ceiling to -1.0 dBTP before touching any drive control.',
                              'Work in small moves: 0.5–1.5 dB of broad EQ, 1–3 dB of gentle 1.5:1–2:1 compression.',
                              'Raise level with the limiter only after the tonal balance is right.',
                              'Keep loudness range between 4 and 10 LU so quiet sections still read in a car.',
                              'Dither exactly once, at the final word-length conversion.',
                            ],
                          }

                  return (
                    <div className="grid gap-7 lg:grid-cols-12">
                      <div className="lg:col-span-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-[7px] w-[7px] rounded-full"
                            style={{ background: src.color, boxShadow: `0 0 8px ${src.color}` }}
                            aria-hidden="true"
                          />
                          <span className="legend text-[9px] text-legend-dim">{src.legend}</span>
                        </div>
                        <h3 className="num mt-2 text-[22px] font-bold text-ink">{src.title}</h3>
                        <dl className="mt-5 space-y-2.5">
                          {[
                            ['Peak', src.peak, src.color],
                            ['Loudness', src.loudness, '#F5A524'],
                            ['Headroom / ceiling', src.headroom, '#FF4D4D'],
                          ].map(([k, v, c]) => (
                            <div
                              key={k}
                              className="flex items-baseline justify-between gap-3 border-b border-etch/60 pb-2"
                            >
                              <dt className="legend text-[9px]">{k}</dt>
                              <dd
                                className="num text-right text-[13px] font-semibold tabular-nums"
                                style={{ color: c }}
                              >
                                {v}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <p className="mt-4 text-[13px] leading-relaxed text-legend">
                          {src.purpose}
                        </p>
                      </div>
                      <div className="lg:col-span-8">
                        <p className="legend mb-3 text-[9px]">Gain staging</p>
                        <ol className="space-y-2.5">
                          {src.gainStage.map((g, i) => (
                            <li key={i} className="flex gap-3">
                              <span
                                className="num mt-[3px] shrink-0 text-[10px] font-semibold tabular-nums"
                                style={{ color: src.color }}
                              >
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span className="text-[12.5px] leading-relaxed text-ink">{g}</span>
                            </li>
                          ))}
                        </ol>
                        <div className="mt-5 flex items-start gap-3 rounded-[2px] border border-ects/25 bg-ects/[0.05] p-4">
                          <Info size={14} className="mt-[2px] shrink-0 text-ects" aria-hidden="true" />
                          <p className="text-[12.5px] leading-relaxed text-ink">
                            These figures shift with source material, genre conventions, DAW metering
                            behaviour, converter calibration, plug-in headroom modelling and artistic
                            intent. Check the destination’s published documentation before any
                            commercial release.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

              {/* ---------------- Empty ---------------- */}
              {!selectedTrack && !selection && (
                <div className="py-6">
                  <p className="num text-[15px] font-semibold text-ink">
                    Nothing selected.
                  </p>
                  <p className="mt-2.5 max-w-[70ch] text-[13px] leading-relaxed text-legend">
                    Click a channel strip to inspect a track, a bus card to inspect a group, or a
                    node in the signal flow to inspect a stage. Everything updates instantly as you
                    change the session.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(['tracks', 'mixbus', 'premaster', 'master'] as const).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => selectStage(id)}
                        className="legend rounded-[2px] border border-etch bg-unit px-3 py-2 text-[9px] transition-colors hover:border-amber hover:text-amber"
                      >
                        {id === 'tracks'
                          ? 'Track levels'
                          : id === 'mixbus'
                            ? 'Mix bus'
                            : id === 'premaster'
                              ? 'Pre-master'
                              : 'Mastering'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </RackUnit>
        </section>

        {/* ------------------------------------------------------------- Footer */}
        <section className="mt-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="legend">Where to go next</span>
            <span className="hairline h-px flex-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { to: '/#groups', t: 'Instrument group guidance', d: 'Relative level relationships for every instrument family.' },
              { to: '/#scale', t: 'dB / LUFS reference scale', d: 'Every target on the site, laid out on one axis.' },
              { to: '/quick-reference', t: 'Quick reference card', d: 'All the numbers, searchable, in one screen.' },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-[3px] border border-etch bg-unit p-4 transition-colors hover:border-amber/60"
              >
                <p className="num text-[13.5px] font-semibold text-ink">{l.t}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-legend-dim">{l.d}</p>
              </Link>
            ))}
          </div>
          <p className="mt-8 max-w-[90ch] text-[12.5px] leading-relaxed text-legend-dim">
            <span className="text-amber">Context note:</span> every recommendation on this page is a
            documented starting point calibrated to common professional practice. Actual levels vary
            with source material, genre, DAW metering, converter calibration, plug-in behaviour,
            monitoring environment and artistic intent. The structure is a scaffold — the balance is
            still yours to make.{' '}
            <Tip text="The cumulative figures shown here are upper-bound estimates: they assume every element peaks at its maximum in the same instant, which never happens in a real arrangement. They exist to tell you how much headroom the structure needs, not what your faders should read." />
          </p>
        </section>
      </div>
    </div>
  )
}
