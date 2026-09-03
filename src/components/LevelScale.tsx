import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoveHorizontal } from 'lucide-react'
import { Item, RackUnit, SectionHeader, Stagger, Tip } from './ui'

type Cat = 'capture' | 'mix' | 'delivery'

interface Band {
  id: string
  label: string
  cat: Cat
  lo: number
  hi: number
  unit: string
  tone: 'safe' | 'caution' | 'clip' | 'info'
  what: string
  why: string
}

const MIN = -60
const MAX = 0
const pos = (db: number) => ((Math.max(MIN, Math.min(MAX, db)) - MIN) / (MAX - MIN)) * 100

const BANDS: Band[] = [
  {
    id: 'nofloor',
    label: 'Noise floor',
    cat: 'capture',
    lo: -60,
    hi: -52,
    unit: 'dBFS',
    tone: 'info',
    what: 'Room, preamp and cable hiss sitting at the bottom of a well-tracked signal.',
    why: 'If your floor is higher than about -70 dBFS, raise the source level or fix the room. Adding gain later raises the noise with the signal — it does not separate them.',
  },
  {
    id: 'convref',
    label: 'Converter reference point',
    cat: 'capture',
    lo: -19,
    hi: -17,
    unit: 'dBFS RMS',
    tone: 'info',
    what: 'The level many converters are calibrated so that -18 dBFS RMS equals their nominal operating level.',
    why: 'Track near it. It is the region where your analogue-modelled plugins and your converter both behave the way their designers intended.',
  },
  {
    id: 'recquiet',
    label: 'Recording peak — quiet sources',
    cat: 'capture',
    lo: -18,
    hi: -12,
    unit: 'dBFS',
    tone: 'safe',
    what: 'Vocals between phrases, room mics, whispered or fingerpicked takes.',
    why: 'Capturing these well above the noise floor without wasting headroom on material that rarely gets loud.',
  },
  {
    id: 'rectypical',
    label: 'Recording peak — typical',
    cat: 'capture',
    lo: -12,
    hi: -6,
    unit: 'dBFS',
    tone: 'safe',
    what: 'The everyday working range for most sources, set on the loudest moment of the performance.',
    why: 'Six or more decibels of safety margin means a surprise take will not clip, while the signal stays far above the noise floor.',
  },
  {
    id: 'recloud',
    label: 'Recording peak — loud sources',
    cat: 'capture',
    lo: -6,
    hi: -3,
    unit: 'dBFS',
    tone: 'caution',
    what: 'Drums, brass, shouted vocals — anything with a large transient-to-average ratio.',
    why: 'Set for the single worst moment of the take. Peaks here are fine; sustained levels here are not.',
  },
  {
    id: 'recceiling',
    label: 'Absolute recording ceiling',
    cat: 'capture',
    lo: -1,
    hi: 0,
    unit: 'dBFS',
    tone: 'clip',
    what: 'Digital full scale. The wall.',
    why: 'One red flash means the converter has already clipped. No plugin downstream can undo it — re-stage the gain and take it again.',
  },
  {
    id: 'plugin',
    label: 'Plug-in input sweet spot',
    cat: 'mix',
    lo: -18,
    hi: -12,
    unit: 'dBFS',
    tone: 'safe',
    what: 'Where analogue-modeled EQs, consoles and compressors expect to receive signal.',
    why: 'Push a modelled processor far above this and its saturation and gain-reduction behaviour change. Use a trim plugin at the top of the strip rather than moving the fader.',
  },
  {
    id: 'returns',
    label: 'FX / reverb returns',
    cat: 'mix',
    lo: -20,
    hi: -12,
    unit: 'dBFS',
    tone: 'safe',
    what: 'Reverb and delay returns sitting in the mix.',
    why: 'Always far quieter than they appear when soloed. Bring a return down until it disappears, then back up until you notice it — that is the right level.',
  },
  {
    id: 'trackpeak',
    label: 'Individual track peaks',
    cat: 'mix',
    lo: -12,
    hi: -6,
    unit: 'dBFS',
    tone: 'safe',
    what: 'Channel peaks on the way into the mix.',
    why: 'Leaves fader travel and plug-in headroom in both directions, and keeps the sum landing where the mix bus expects it.',
  },
  {
    id: 'lufss',
    label: 'Mix loudness (short-term)',
    cat: 'mix',
    lo: -18,
    hi: -14,
    unit: 'LUFS-S',
    tone: 'info',
    what: 'A rough loudness anchor while mixing.',
    why: 'Not a target — a sanity check. If the mix is reading -6 LUFS-S at this stage, something downstream is doing work it should not be doing yet.',
  },
  {
    id: 'mixbus',
    label: 'Mix bus peak',
    cat: 'mix',
    lo: -6,
    hi: -3,
    unit: 'dBFS',
    tone: 'safe',
    what: 'The summed peak of the whole mix, before mastering.',
    why: 'The single most important number in this guide. Set it once during editing and never touch it again — every stage after this assumes it.',
  },
  {
    id: 'premaster',
    label: 'Pre-master peak',
    cat: 'delivery',
    lo: -6,
    hi: -1,
    unit: 'dBFS',
    tone: 'safe',
    what: 'The level of the bounce handed to the mastering engineer.',
    why: 'Universally safe, and enough headroom for mastering to be a creative job rather than a rescue operation.',
  },
  {
    id: 'tp',
    label: 'True peak ceiling (streaming)',
    cat: 'delivery',
    lo: -2,
    hi: -1,
    unit: 'dBTP',
    tone: 'caution',
    what: 'The real analogue-domain ceiling after oversampled reconstruction.',
    why: 'Inter-sample peaks push past the sample peak during lossy encoding. -1.0 dBTP is the standard delivery spec; use -2.0 dBTP if the master is louder than -14 LUFS.',
  },
  {
    id: 'sampleceil',
    label: 'Sample peak ceiling',
    cat: 'delivery',
    lo: -0.5,
    hi: 0,
    unit: 'dBFS',
    tone: 'clip',
    what: 'The hard digital maximum on any delivered file.',
    why: 'Nothing at or above this on a finished master. A limiter ceiling of -1.0 dBTP satisfies both this and the true-peak spec.',
  },
]

const CATS: { id: Cat | 'all'; label: string; color: string }[] = [
  { id: 'all', label: 'Everything', color: '#E6E9EC' },
  { id: 'capture', label: 'Capture', color: '#35E08A' },
  { id: 'mix', label: 'Mix', color: '#F5A524' },
  { id: 'delivery', label: 'Delivery', color: '#FF4D4D' },
]

const TONE: Record<Band['tone'], string> = {
  safe: '#35E08A',
  caution: '#F5A524',
  clip: '#FF4D4D',
  info: '#94A3B8',
}

const RULES = [
  { v: '+6 dB', t: 'doubles amplitude', d: 'And -6 dB halves it. The most useful single fact about decibels.' },
  { v: '+3 dB', t: 'doubles power', d: 'Power and amplitude are not the same quantity — this is why the numbers look odd.' },
  { v: '±10 dB', t: '“twice as loud”', d: 'A rough perceptual rule. Ten decibels is roughly a doubling of apparent loudness.' },
  { v: '-20 dB', t: 'one tenth amplitude', d: 'Which is one hundredth of the power. Voltage and power scale differently.' },
  { v: '-40 dB', t: 'one hundredth amplitude', d: 'Beyond this a signal is effectively inaudible against anything else in the mix.' },
  { v: '0 dBFS', t: 'the wall', d: 'Not “maximum loudness” — the point beyond which the converter simply cannot represent the signal.' },
]

export default function LevelScale() {
  const [cat, setCat] = useState<Cat | 'all'>('all')
  const [selected, setSelected] = useState('mixbus')

  const visible = BANDS.filter((b) => cat === 'all' || b.cat === cat)
  const band = BANDS.find((b) => b.id === selected)

  return (
    <section id="scale" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Section 06 · dB / LUFS reference tool"
          title="Every target on one scale"
          subtitle="Numbers in isolation are hard to hold in your head. Laid out on a single -60 to 0 dB scale, the pattern becomes obvious: capture low, mix in the middle, deliver just under the ceiling — and never touch the wall."
        />

        <RackUnit className="p-5 sm:p-7">
          <div className="relative z-10">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CATS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCat(c.id)}
                  aria-pressed={cat === c.id}
                  className={`legend rounded-[2px] border px-3 py-2 text-[9px] transition-colors ${
                    cat === c.id ? 'border-amber/60 bg-amber/12 text-amber' : 'border-etch bg-unit text-legend hover:border-legend-dim hover:text-ink'
                  }`}
                >
                  {c.label}
                </button>
              ))}
              <span className="ml-auto hidden items-center gap-2 sm:flex">
                <MoveHorizontal size={13} className="text-legend-dim" aria-hidden="true" />
                <span className="mono text-[10px] tracking-[0.06em] text-legend-dim">
                  -60 dB ← → 0 dBFS
                </span>
              </span>
            </div>

            {/* The scale */}
            <div className="mt-6">
              {/* Axis */}
              <div className="grid grid-cols-[minmax(0,1fr)] gap-y-2 sm:grid-cols-[210px_1fr] sm:gap-x-5">
                <div className="hidden sm:block" />
                <div className="relative h-6">
                  {[-60, -48, -36, -24, -12, -6, -3, 0].map((t) => (
                    <span
                      key={t}
                      className={`mono absolute top-0 -translate-x-1/2 text-[9.5px] tabular-nums text-legend-dim ${
                        t === -3 || t === -6 ? 'hidden sm:inline' : ''
                      }`}
                      style={{ left: `${pos(t)}%` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                {visible.map((b, i) => {
                  const left = pos(b.lo)
                  const width = Math.max(pos(b.hi) - left, 0.9)
                  const nearRight = left + width > 68
                  const color = TONE[b.tone]
                  const isSel = selected === b.id
                  return (
                    <motion.button
                      key={b.id}
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      onClick={() => setSelected(b.id)}
                      aria-pressed={isSel}
                      aria-label={`${b.label}: ${b.lo} to ${b.hi} ${b.unit}`}
                      className={`grid w-full grid-cols-1 items-center gap-y-1 rounded-[2px] border px-2 py-2 text-left transition-colors sm:grid-cols-[210px_1fr] sm:gap-x-5 sm:px-2.5 ${
                        isSel ? 'border-[color:var(--c)] bg-white/[0.045]' : 'border-transparent hover:bg-white/[0.025]'
                      }`}
                      style={{ ['--c' as string]: color }}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-[6px] w-[6px] shrink-0 rounded-full"
                          style={{ background: color, opacity: isSel ? 1 : 0.65 }}
                          aria-hidden="true"
                        />
                        <span
                          className={`truncate text-[12px] ${isSel ? 'text-ink' : 'text-legend'}`}
                        >
                          {b.label}
                        </span>
                      </span>

                      <span className="relative block h-[18px]">
                        {/* Track */}
                        <span className="absolute top-1/2 right-0 left-0 h-[3px] -translate-y-1/2 rounded-full bg-[#141a1f]" />
                        {/* Gridlines */}
                        {[-48, -36, -24, -12, -6, -3].map((t) => (
                          <span
                            key={t}
                            className={`absolute top-0 bottom-0 w-px bg-white/[0.045] ${
                              t === -3 || t === -6 ? 'hidden sm:block' : ''
                            }`}
                            style={{ left: `${pos(t)}%` }}
                            aria-hidden="true"
                          />
                        ))}
                        {/* The band */}
                        <span
                          className="absolute top-1/2 h-[9px] -translate-y-1/2 rounded-[2px] transition-all duration-300"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            background: color,
                            opacity: isSel ? 1 : 0.72,
                            boxShadow: isSel ? `0 0 12px -2px ${color}` : 'none',
                          }}
                        />
                        <span
                          className={`num absolute top-1/2 -translate-y-1/2 text-[10px] font-semibold whitespace-nowrap tabular-nums ${
                            nearRight ? 'text-right' : ''
                          }`}
                          style={{
                            ...(nearRight
                              ? { right: `calc(${100 - left}% + 8px)` }
                              : { left: `calc(${left + width}% + 8px)` }),
                            color: isSel ? color : '#626b75',
                          }}
                        >
                          {b.lo === b.hi || b.hi - b.lo < 1.5
                            ? `${b.lo}`
                            : `${b.lo} … ${b.hi}`}
                          <span className="mono ml-1 font-normal text-legend-dim">{b.unit}</span>
                        </span>
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Detail */}
            <AnimatePresence mode="wait">
              {band && (
                <motion.div
                  key={band.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 rounded-[2px] border border-etch bg-[#12161a] p-5 sm:p-6"
                >
                  <div className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-[7px] w-[7px] rounded-full"
                          style={{ background: TONE[band.tone], boxShadow: `0 0 8px ${TONE[band.tone]}` }}
                          aria-hidden="true"
                        />
                        <h3 className="num text-[17px] font-bold tracking-[-0.01em] text-ink">
                          {band.label}
                        </h3>
                      </div>
                      <p
                        className="num mt-4 text-[30px] leading-none font-bold tabular-nums"
                        style={{ color: TONE[band.tone] }}
                      >
                        {band.lo === band.hi || band.hi - band.lo < 1.5
                          ? `${band.lo}`
                          : `${band.lo} … ${band.hi}`}
                        <span className="mono ml-2 text-[11px] font-normal text-legend-dim">
                          {band.unit}
                        </span>
                      </p>
                      <p className="legend mt-3 text-[9px]">
                        {band.cat === 'capture'
                          ? 'Capture stage'
                          : band.cat === 'mix'
                            ? 'Mixing stage'
                            : 'Delivery stage'}
                        <Tip text="Ranges come from common professional practice. Your source material, genre, converter chain and artistic intent all move them — the principle stays, the exact number flexes." />
                      </p>
                    </div>
                    <div className="lg:col-span-8">
                      <p className="legend text-[9px]">What it is</p>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-ink">{band.what}</p>
                      <p className="legend mt-5 text-[9px]">Why it matters</p>
                      <p className="mt-2 text-[13px] leading-relaxed text-legend">{band.why}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </RackUnit>

        {/* dB rules of thumb */}
        <div className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <span className="legend">Decibels, in plain terms</span>
            <span className="hairline h-px flex-1" />
          </div>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RULES.map((r) => (
              <Item key={r.v} className="h-full">
                <RackUnit className="h-full p-5">
                  <div className="relative z-10">
                    <div className="flex items-baseline gap-3">
                      <span className="num text-[20px] leading-none font-bold text-amber tabular-nums">
                        {r.v}
                      </span>
                      <span className="num text-[13px] leading-none font-semibold text-ink">
                        {r.t}
                      </span>
                    </div>
                    <p className="mt-3 text-[12.5px] leading-relaxed text-legend">{r.d}</p>
                  </div>
                </RackUnit>
              </Item>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  )
}
