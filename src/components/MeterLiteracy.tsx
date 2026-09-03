import { useEffect, useRef, useState } from 'react'
import { measurements, platformTargets } from '../data/measurements'
import { Item, RackUnit, SectionHeader, SegmentedMeter, Stagger, Tip } from './ui'
import { usePrefersReducedMotion } from '../lib/hooks'

interface Profile {
  id: string
  name: string
  desc: string
  /** Programme loudness the material would read at, integrated. */
  lufs: number
  /** Peak-to-loudness ratio: how far the transient peaks sit above the loudness. */
  plr: number
  jitter: number
  transient: number
}

const PROFILES: Profile[] = [
  {
    id: 'sparse',
    name: 'Sparse acoustic',
    desc: 'Fingerpicked guitar and voice, minimal processing, wide dynamics.',
    lufs: -24,
    plr: 20,
    jitter: 0.1,
    transient: 0.55,
  },
  {
    id: 'band',
    name: 'Live band mix',
    desc: 'Full kit, bass, guitars and vocal, gentle bus compression.',
    lufs: -16,
    plr: 11,
    jitter: 0.14,
    transient: 0.7,
  },
  {
    id: 'edm',
    name: 'Dense EDM master',
    desc: 'Heavy limiting, stacked layers, very low crest factor.',
    lufs: -8,
    plr: 7,
    jitter: 0.07,
    transient: 0.35,
  },
  {
    id: 'orch',
    name: 'Orchestral',
    desc: 'Wide dynamic range, long crescendos, quiet passages.',
    lufs: -27,
    plr: 24,
    jitter: 0.16,
    transient: 0.8,
  },
]

const BARS = 88

/** Envelope for the rolling waveform display: dense material reads as a block, sparse as spikes. */
function envelope(t: number, p: Profile) {
  const density = 1 - Math.min(1, p.plr / 26)
  const slow = Math.sin(t * 0.6) * 0.5 + 0.5
  const mid = Math.sin(t * 2.7 + 1.3) * 0.5 + 0.5
  const body =
    0.28 + density * 0.62 + (slow * 0.28 + mid * 0.12) * (0.4 + density * 0.6)
  const transient =
    Math.pow(Math.max(0, Math.sin(t * 4.1)), 22) *
    (0.85 - density * 0.55) *
    (0.5 + p.transient * 0.6)
  const noise = Math.sin(t * 53.1) * Math.sin(t * 31.7 + 2) * p.jitter
  return Math.min(1, Math.max(0.02, body * 0.8 + transient + noise))
}

function readouts(p: Profile, t: number) {
  const wander = Math.sin(t * 0.9) * 0.5
  const lufsI = p.lufs + wander * 0.35
  const lufsS = lufsI + Math.sin(t * 2.1) * 2.4
  const peak = lufsI + p.plr + wander * 0.4
  const tp = peak + 0.25 + Math.abs(Math.sin(t * 3.3)) * 0.45
  const rms = lufsI + 0.8
  return { peak, rms, lufsI, lufsS, tp }
}

export default function MeterLiteracy() {
  const [profileId, setProfileId] = useState('band')
  const reduced = usePrefersReducedMotion()
  const profile = PROFILES.find((p) => p.id === profileId) ?? PROFILES[1]

  const [vals, setVals] = useState(() => readouts(profile, 0))
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: BARS }, () => 0.1))
  const [playing, setPlaying] = useState(true)

  const tRef = useRef(0)
  const playingRef = useRef(true)
  const smooth = useRef({ peak: -60, rms: -60, lufsI: -60, lufsS: -60, tp: -60 })
  const barsRef = useRef<number[]>(Array.from({ length: BARS }, () => 0.1))
  const profileRef = useRef(profile)

  useEffect(() => {
    profileRef.current = profile
    playingRef.current = playing
  }, [profile, playing])

  useEffect(() => {
    smooth.current = { peak: -60, rms: -60, lufsI: -60, lufsS: -60, tp: -60 }
    barsRef.current = Array.from({ length: BARS }, () => 0.1)
  }, [profileId])

  useEffect(() => {
    if (reduced) {
      const p = profileRef.current
      const r = readouts(p, 1.2)
      setVals(r)
      setBars(Array.from({ length: BARS }, (_, i) => envelope(i * 0.42, p)))
      return
    }
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (now - last < 33) return
      const dt = (now - last) / 1000
      last = now
      if (!playingRef.current) return
      tRef.current += dt
      const t = tRef.current
      const p = profileRef.current
      const target = readouts(p, t)

      // Real-ish meter ballistics: fast attack, slow decay.
      const attack = 1 - Math.exp(-dt / 0.12)
      const decay = 1 - Math.exp(-dt / 0.7)
      const s = smooth.current
      for (const k of ['peak', 'rms', 'lufsI', 'lufsS', 'tp'] as const) {
        const gap = target[k] - s[k]
        s[k] += gap * (gap > 0 ? attack : decay)
      }

      barsRef.current = [...barsRef.current.slice(1), envelope(t * 2.6, p)]

      setVals({ ...s })
      setBars([...barsRef.current])
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, playing])

  const peakSafe = vals.peak > -1

  const rows = [
    { key: 'peak', label: 'Peak (dBFS)', v: vals.peak, color: peakSafe ? '#FF4D4D' : '#35E08A', max: 0 },
    { key: 'rms', label: 'RMS (dB)', v: vals.rms, color: '#8BC34A', max: -6 },
    { key: 'lufsI', label: 'Integrated (LUFS-I)', v: vals.lufsI, color: '#F5A524', max: -6 },
    { key: 'lufsS', label: 'Short-term (LUFS-S)', v: vals.lufsS, color: '#FF7A45', max: -6 },
    { key: 'tp', label: 'True peak (dBTP)', v: vals.tp, color: '#FF7A9B', max: 0 },
  ]

  return (
    <section id="measurements" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Section 01 · Measurement literacy"
          title="Four meters, four different questions"
          subtitle="The single most common error in a student session is treating dBFS, RMS, LUFS and true peak as the same measurement. They answer different questions, they move at different speeds, and they are correct at different points in the chain."
        />

        <div className="grid gap-5 lg:grid-cols-5">
          {/* ------------------------------------------------ Simulator */}
          <RackUnit className="p-5 sm:p-7 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="legend">Live meter simulator</span>
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="legend rounded-[2px] border border-etch bg-unit px-2.5 py-1.5 text-[9px] transition-colors hover:border-amber hover:text-amber"
              >
                {playing ? 'Hold' : 'Run'}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Programme material">
              {PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={p.id === profileId}
                  onClick={() => setProfileId(p.id)}
                  className={`rounded-[2px] border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors ${
                    p.id === profileId
                      ? 'border-amber/60 bg-amber/12 text-amber'
                      : 'border-etch bg-unit text-legend hover:border-legend-dim hover:text-ink'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[12px] leading-relaxed text-legend-dim">{profile.desc}</p>

            {/* Waveform display */}
            <div className="mt-5 rounded-[2px] border border-etch bg-[#0a0d10] p-3">
              <div className="flex h-[92px] items-center gap-[2px]" aria-hidden="true">
                {bars.map((b, i) => {
                  const h = Math.max(2, b * 84)
                  const c = i > BARS - 3 ? '#F5A524' : i % 12 === 0 ? '#3a434c' : '#2f7f5c'
                  return (
                    <span
                      key={i}
                      className="flex-1 rounded-[1px]"
                      style={{ height: `${h}px`, background: c, opacity: 0.55 + b * 0.45 }}
                    />
                  )
                })}
              </div>
              <div className="mt-2 flex justify-between">
                <span className="mono text-[9.5px] tracking-[0.06em] text-legend-dim">-3.0 s</span>
                <span className="mono text-[9.5px] tracking-[0.06em] text-legend-dim">NOW</span>
              </div>
            </div>

            {/* Meters */}
            <div className="mt-5 space-y-3.5" aria-live="polite">
              {rows.map((r) => (
                <div key={r.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12.5px] text-ink">{r.label}</span>
                    <span
                      className="num text-[15px] font-semibold tabular-nums"
                      style={{ color: r.color }}
                    >
                      {r.v > -0.05 ? '0.0' : r.v.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <SegmentedMeter
                      segments={30}
                      min={-60}
                      max={r.max}
                      value={r.v}
                      label={`${r.label} meter`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[2px] border border-amber/25 bg-amber/[0.07] p-3.5">
              <p className="legend text-[9px] text-amber">Read this</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink">
                Switch between <em className="text-signal not-italic">Sparse acoustic</em> and{' '}
                <em className="text-signal not-italic">Dense EDM master</em>. Peak moves by only about
                3 dB between them — yet integrated loudness swings by roughly 16 LU. That widening gap
                between peak and loudness is crest factor, and it is the whole reason one number can
                never describe a mix.
              </p>
            </div>
          </RackUnit>

          {/* ------------------------------------------------ Reference cards */}
          <div className="grid gap-5 lg:col-span-2">
            <Stagger className="grid gap-5">
              {measurements.map((m) => (
                <Item key={m.id}>
                  <RackUnit className="p-5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-[7px] w-[7px] rounded-full"
                        style={{ background: m.color, boxShadow: `0 0 7px ${m.color}` }}
                        aria-hidden="true"
                      />
                      <h3 className="num text-[14px] font-semibold text-ink">{m.name}</h3>
                      <span className="mono ml-auto text-[10px] tracking-[0.08em] text-legend-dim">
                        {m.unit}
                      </span>
                    </div>
                    <p className="mt-3 text-[12.5px] leading-relaxed text-legend">{m.what}</p>
                    <dl className="mt-3.5 space-y-2.5">
                      <div>
                        <dt className="legend text-[9px] text-signal">Use it for</dt>
                        <dd className="mt-1 text-[12.5px] leading-relaxed text-ink">{m.useWhen}</dd>
                      </div>
                      <div>
                        <dt className="legend text-[9px] text-clip">Not for</dt>
                        <dd className="mt-1 text-[12.5px] leading-relaxed text-legend">
                          {m.dontUseWhen}
                        </dd>
                      </div>
                    </dl>
                  </RackUnit>
                </Item>
              ))}
            </Stagger>
          </div>
        </div>

        {/* -------------------------------------------- Platform targets */}
        <div className="mt-14">
          <div className="mb-5 flex items-center gap-3">
            <span className="legend">
              Platform delivery targets{' '}
              <Tip text="Values verified against published service documentation. Platforms change these figures; always confirm before a commercial release. Spotify in particular offers user-selectable loud/normal/quiet modes." />
            </span>
            <span className="hairline h-px flex-1" />
          </div>

          <RackUnit className="overflow-hidden">
            <div className="relative z-10 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-etch">
                    <th className="legend px-5 py-3.5 text-[9px]">Destination</th>
                    <th className="legend px-5 py-3.5 text-[9px]">Integrated loudness</th>
                    <th className="legend px-5 py-3.5 text-[9px]">True peak ceiling</th>
                    <th className="legend px-5 py-3.5 text-[9px]">How normalisation behaves</th>
                  </tr>
                </thead>
                <tbody>
                  {platformTargets.map((p, i) => (
                    <tr
                      key={p.platform}
                      className={`border-b border-etch/60 transition-colors last:border-0 hover:bg-white/[0.025] ${
                        i % 2 ? 'bg-black/15' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 text-[13px] font-medium whitespace-nowrap text-ink">
                        {p.platform}
                      </td>
                      <td className="num px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap text-amber tabular-nums">
                        {p.lufs}
                      </td>
                      <td className="num px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap text-clip tabular-nums">
                        {p.tp}
                      </td>
                      <td className="px-5 py-3.5 text-[12.5px] leading-relaxed text-legend">
                        {p.behaviour}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RackUnit>
          <p className="mt-3 text-[12px] leading-relaxed text-legend-dim">
            Master at roughly -14 LUFS-I with a -1.0 dBTP ceiling and you are compatible with every
            music service in this list. Apple's -16 reference simply means your -14 master is turned
            down slightly rather than up.
          </p>
        </div>
      </div>
    </section>
  )
}
