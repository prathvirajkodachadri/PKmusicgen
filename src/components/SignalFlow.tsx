import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CornerDownRight } from 'lucide-react'
import { groups } from '../data/groups'
import { RackUnit, SectionHeader } from './ui'

type NodeKind = 'source' | 'bus' | 'mix' | 'pre' | 'master'

interface Node {
  id: string
  label: string
  sub: string
  kind: NodeKind
  color: string
  x: number
  y: number
  w: number
  h: number
  detail: {
    title: string
    target: string
    targetUnit: string
    tracks: string
    routing: string
    notes: string[]
    mistakes: string[]
  }
}

const G = (id: string) => groups.find((g) => g.id === id)!

const sourceNodes: { gid: string; bus: string; label: string; sub: string; y: number }[] = [
  { gid: 'drums', bus: 'drums', label: 'Drum Kit', sub: 'kick · snare · toms · OH', y: 52 },
  { gid: 'bass', bus: 'bass', label: 'Bass', sub: 'DI · amp · synth bass', y: 102 },
  { gid: 'guitars', bus: 'music', label: 'Guitars', sub: 'rhythm · lead · acoustic', y: 152 },
  { gid: 'keys', bus: 'music', label: 'Keys & Synths', sub: 'piano · EP · pads', y: 202 },
  { gid: 'strings', bus: 'music', label: 'Strings & Brass', sub: 'section · solo · winds', y: 252 },
  { gid: 'vocals', bus: 'vocals', label: 'Vocals', sub: 'lead · backing · stacks', y: 302 },
  { gid: 'percussion', bus: 'percussion', label: 'Percussion', sub: 'shaker · clap · tamb', y: 352 },
  { gid: 'fx', bus: 'fx', label: 'FX Sends', sub: 'verb · delay · ambience', y: 402 },
]

interface BusNode {
  key: string
  gid: string | null
  label: string
  color: string
  y: number
  detail?: {
    title: string
    target: string
    targetUnit: string
    tracks: string
    routing: string
    notes: string[]
    mistakes: string[]
  }
}

const busNodes: BusNode[] = [
  { key: 'drums', gid: 'drums', label: 'DRUM BUS', color: '#F5A524', y: 75 },
  { key: 'bass', gid: 'bass', label: 'BASS BUS', color: '#8BC34A', y: 135 },
  {
    key: 'music',
    gid: null,
    label: 'MUSIC BUS',
    color: '#4DD0E1',
    y: 195,
    detail: {
      title: 'Music Bus (GTR / KEY / STR)',
      target: '-10 to -5',
      targetUnit: 'dBFS peak',
      tracks: '6–66',
      routing: 'GTR / KEY / STR sub-buses → MUSIC BUS → MIX BUS',
      notes: [
        'Guitars, keys and strings each get their own sub-bus, then feed one Music Bus. Three levels of gain control, one fader for “the music”.',
        'Automate the Music Bus down in verses — this single move fixes more buried vocals than any amount of EQ.',
        'Watch true peak here: wide, sustained content sums to peak faster than any mono channel.',
        'On small sessions the three sub-buses can collapse straight into this bus with no loss of control.',
      ],
      mistakes: [
        'Leaving all three sub-buses at identical level, so nothing in the arrangement can breathe.',
        'Compressing the Music Bus hard before the vocal balance is right, then fighting it with faders.',
      ],
    },
  },
  { key: 'vocals', gid: 'vocals', label: 'VOCAL BUS', color: '#FF7A9B', y: 255 },
  { key: 'percussion', gid: 'percussion', label: 'PERC BUS', color: '#FFD166', y: 315 },
  { key: 'fx', gid: 'fx', label: 'FX BUS', color: '#B39DDB', y: 375 },
]

const MIX_Y = 210
const MIX_CY = MIX_Y + 37

const nodes: Node[] = [
  ...sourceNodes.map((s, i) => {
    const g = G(s.gid)
    return {
      id: `src-${i}`,
      label: s.label,
      sub: s.sub,
      kind: 'source' as NodeKind,
      color: g.color,
      x: 6,
      y: s.y,
      w: 168,
      h: 44,
      detail: {
        title: s.label,
        target: g.relationships[0].value.replace(/^.*?:\s*/, ''),
        targetUnit: 'dB',
        tracks: g.tracks,
        routing: g.routing,
        notes: g.relationships.slice(0, 3).map((r) => `${r.element}: ${r.value} — ${r.note}`),
        mistakes: g.commonMistakes.slice(0, 2),
      },
    }
  }),
  ...busNodes.map((b) => {
    const g = b.gid ? G(b.gid) : null
    return {
      id: `bus-${b.key}`,
      label: b.label,
      sub: g ? `${g.tracks} tracks · grouped` : 'GTR + KEY + STR',
      kind: 'bus' as NodeKind,
      color: b.color,
      x: 246,
      y: b.y,
      w: 168,
      h: 44,
      detail: b.detail ?? {
        title: g!.bus,
        target:
          g!.relationships.find((r) => r.element.includes('bus peak'))?.value ?? '-8 to -4 dBFS',
        targetUnit: 'dBFS peak',
        tracks: g!.tracks,
        routing: g!.routing,
        notes: g!.processing,
        mistakes: g!.commonMistakes,
      },
    }
  }),
  {
    id: 'mixbus',
    label: 'MIX BUS',
    sub: 'all groups summed',
    kind: 'mix',
    color: '#F5A524',
    x: 500,
    y: MIX_Y,
    w: 160,
    h: 74,
    detail: {
      title: 'Mix Bus',
      target: '-6 to -3',
      targetUnit: 'dBFS peak',
      tracks: '6 group buses',
      routing: 'DRUM / BASS / MUSIC / VOCAL / PERC / FX → MIX BUS',
      notes: [
        'Set once during editing and never touched again. Every stage after this assumes this level.',
        'Intended loudness at this point is roughly -18 to -14 LUFS-S — an anchor, not a target.',
        'No limiter and no loudness maximiser. Glue compression only, and only if the balance is already right.',
        'Automate group buses here rather than stacking more plugins on individual channels.',
      ],
      mistakes: [
        'Mixing into a limiter to hear the mix "finished". It hides every balance error.',
        'Master fader pulled down to compensate — some DAWs sum it post-bounce and it silently disappears.',
      ],
    },
  },
  {
    id: 'premaster',
    label: 'PRE-MASTER',
    sub: 'clean bounce + stems',
    kind: 'pre',
    color: '#FF7A45',
    x: 740,
    y: MIX_Y,
    w: 160,
    h: 74,
    detail: {
      title: 'Pre-Master / Handover',
      target: '-6 to -1',
      targetUnit: 'dBFS peak',
      tracks: '1 mix + 6–12 stems',
      routing: 'MIX BUS → PRE-MASTER (24-bit WAV, session sample rate)',
      notes: [
        'Trim the mix bus — not the master fader — to land at -6 dBFS peak.',
        'True peak at or below -3 dBTP so the mastering engineer has limiter headroom.',
        'No dither applied at this stage. Dither belongs to the final word-length conversion only.',
        'Send stems, a reference, and a short note describing what you balanced against.',
      ],
      mistakes: [
        'Bouncing at 0 dBFS peak and calling it loud enough. There is nothing left to master.',
        'Sending only an MP3 as the source material.',
      ],
    },
  },
  {
    id: 'master',
    label: 'MASTER',
    sub: 'delivery formats',
    kind: 'master',
    color: '#FF4D4D',
    x: 980,
    y: MIX_Y,
    w: 168,
    h: 74,
    detail: {
      title: 'Mastering & Delivery',
      target: '-14 LUFS-I',
      targetUnit: 'streaming target',
      tracks: '1–8 tracks',
      routing: 'PRE-MASTER → MASTER → WAV / MP3 / platform deliverables',
      notes: [
        'Integrated loudness -14 LUFS-I for streaming; -16 if targeting Apple Sound Check specifically.',
        'True peak ceiling -1.0 dBTP, or -2.0 dBTP if the master is louder than -14 LUFS.',
        'Loudness range 4–10 LU and programme loudness range of at least 8 dB keep it listenable.',
        'Dither once, from 24-bit down to 16-bit, at the very last conversion.',
      ],
      mistakes: [
        'Chasing -8 LUFS. You will hear the compression, not the loudness.',
        'Mastering a pre-master that arrived with no headroom — the limiter ends up doing the mix.',
      ],
    },
  },
]

const NODE_BY_ID = (id: string) => nodes.find((n) => n.id === id)

function pathFor(x1: number, y1: number, x2: number, y2: number) {
  const dx = (x2 - x1) * 0.5
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

const links: { d: string; color: string; active: boolean }[] = [
  ...sourceNodes.map((s) => {
    const b = busNodes.find((bb) => bb.key === s.bus)!
    return {
      d: pathFor(174, s.y + 20, 246, b.y + 22),
      color: G(s.gid).color,
      active: false,
    }
  }),
  ...busNodes.map((b) => ({
    d: pathFor(414, b.y + 22, 500, MIX_CY),
    color: b.color,
    active: false,
  })),
  { d: pathFor(660, MIX_CY, 740, MIX_CY), color: '#F5A524', active: true },
  { d: pathFor(900, MIX_CY, 980, MIX_CY), color: '#FF7A45', active: true },
]

export default function SignalFlow() {
  const [selected, setSelected] = useState('mixbus')

  const node = NODE_BY_ID(selected)

  const renderNode = (n: Node) => {
    const isSel = selected === n.id
    const big = n.kind !== 'source' && n.kind !== 'bus'
    return (
      <g
        key={n.id}
        role="button"
        tabIndex={0}
        aria-pressed={isSel}
        aria-label={`${n.label} — ${n.detail.target} ${n.detail.targetUnit}`}
        onClick={() => setSelected(n.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setSelected(n.id)
          }
        }}
        className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-amber [&:focus-visible>rect]:stroke-2"
      >
        <rect
          x={n.x}
          y={n.y}
          width={n.w}
          height={n.h}
          rx={3}
          fill={isSel ? '#1e242a' : '#171b1f'}
          stroke={isSel ? n.color : '#2b333a'}
          strokeWidth={isSel ? 1.8 : 1}
          style={{ transition: 'all 180ms ease' }}
        />
        <rect
          x={n.x}
          y={n.y}
          width={3}
          height={n.h}
          fill={n.color}
          opacity={isSel ? 1 : 0.55}
        />
        <circle
          cx={n.x + n.w - 12}
          cy={n.y + 12}
          r={3}
          fill={n.color}
          opacity={isSel ? 1 : 0.5}
        />
        <text
          x={n.x + 14}
          y={n.y + (big ? 30 : 20)}
          fill="#E6E9EC"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight={600}
          fontSize={big ? 15 : 12.5}
          letterSpacing="0.02em"
        >
          {n.label}
        </text>
        <text
          x={n.x + 14}
          y={n.y + (big ? 50 : 34)}
          fill="#7d868f"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize={big ? 10.5 : 9}
        >
          {n.detail.target} {n.detail.targetUnit}
        </text>
      </g>
    )
  }

  return (
    <section id="signal-flow" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Section 03 · Signal flow"
          title="Where the audio actually goes"
          subtitle="Tracks do not go to the master. They go to groups, groups go to buses, buses go to the mix bus. Click any node to see its target level, its routing, and the mistakes people make at that exact point."
        />

        <RackUnit className="p-3 sm:p-5">
          <div className="relative z-10">
            <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
              <span className="legend text-[9px]">Click a node</span>
              <span className="flex items-center gap-1.5">
                <span className="h-[3px] w-6 rounded bg-[#2f7f5c]" aria-hidden="true" />
                <span className="mono text-[10px] text-legend-dim">track → bus</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-[3px] w-6 rounded bg-amber" aria-hidden="true" />
                <span className="mono text-[10px] text-legend-dim">bus → master chain</span>
              </span>
            </div>

            <div className="overflow-x-auto rounded-[2px] border border-etch bg-[#0a0d10] p-2 sm:p-4">
              <svg
                viewBox="0 0 1160 462"
                className="h-auto w-full min-w-[860px]"
                role="group"
                aria-label="Audio signal flow diagram from individual tracks through group buses to the master"
              >
                <defs>
                </defs>

                {/* Column legends */}
                {[
                  { x: 6, t: '01 · TRACKS' },
                  { x: 246, t: '02 · GROUP BUSES' },
                  { x: 500, t: '03 · MIX BUS' },
                  { x: 740, t: '04 · PRE-MASTER' },
                  { x: 980, t: '05 · MASTER' },
                ].map((c) => (
                  <text
                    key={c.t}
                    x={c.x}
                    y={28}
                    fill="#626b75"
                    fontFamily="'Space Grotesk', sans-serif"
                    fontWeight={600}
                    fontSize={9.5}
                    letterSpacing="2"
                  >
                    {c.t}
                  </text>
                ))}

                {/* Base wiring */}
                {links.map((l, i) => (
                  <path
                    key={`b${i}`}
                    d={l.d}
                    fill="none"
                    stroke={l.color}
                    strokeWidth={1.4}
                    opacity={0.26}
                  />
                ))}

                {/* Traveling signal packets */}
                {links.map((l, i) => (
                  <path
                    key={`p${i}`}
                    d={l.d}
                    fill="none"
                    stroke={l.active ? l.color : '#4ee39f'}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    className="packet-flow"
                    style={{ animationDelay: `${(i % 5) * 0.34}s` }}
                    opacity={0.95}
                  />
                ))}

                {nodes.map(renderNode)}

                {/* Direction markers */}
                {[
                  { x: 690, t: 'bounced' },
                  { x: 930, t: 'mastered' },
                ].map((m) => (
                  <g key={m.t}>
                    <path
                      d={`M ${m.x} ${MIX_CY - 6} l 8 6 l -8 6 z`}
                      fill="#4a545d"
                    />
                    <text
                      x={m.x - 4}
                      y={MIX_CY - 20}
                      fill="#626b75"
                      fontFamily="'IBM Plex Mono', monospace"
                      fontSize={8.5}
                      textAnchor="middle"
                    >
                      {m.t}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* -------------------------------------------------- Detail panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="mt-4 rounded-[2px] border border-etch bg-[#12161a] p-5 sm:p-6"
              >
                {node && (
                  <div className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-[7px] w-[7px] rounded-full"
                          style={{ background: node.color, boxShadow: `0 0 8px ${node.color}` }}
                          aria-hidden="true"
                        />
                        <h3 className="num text-[19px] font-bold tracking-[-0.01em] text-ink">
                          {node.detail.title}
                        </h3>
                      </div>

                      <dl className="mt-5 space-y-3">
                        <div className="flex items-baseline justify-between gap-3 border-b border-etch/70 pb-2.5">
                          <dt className="legend text-[9px]">Target level</dt>
                          <dd
                            className="num text-[16px] font-semibold tabular-nums"
                            style={{ color: node.color }}
                          >
                            {node.detail.target}
                            <span className="mono ml-1.5 text-[10px] text-legend-dim">
                              {node.detail.targetUnit}
                            </span>
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 border-b border-etch/70 pb-2.5">
                          <dt className="legend text-[9px]">Typical tracks</dt>
                          <dd className="num text-[14px] font-medium tabular-nums text-ink">
                            {node.detail.tracks}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-5">
                        <p className="legend mb-2 text-[9px]">Routing</p>
                        <p className="mono flex items-start gap-1.5 text-[11px] leading-relaxed break-words text-signal">
                          <CornerDownRight size={11} className="mt-[3px] shrink-0" aria-hidden="true" />
                          {node.detail.routing}
                        </p>
                      </div>
                    </div>

                    <div className="lg:col-span-4">
                      <p className="legend mb-3 text-[9px]">Level relationships & notes</p>
                      <ul className="space-y-2">
                        {node.detail.notes.map((n) => (
                          <li key={n} className="flex gap-2.5">
                            <ArrowRight
                              size={11}
                              className="mt-[4px] shrink-0 text-legend-dim"
                              aria-hidden="true"
                            />
                            <span className="text-[12.5px] leading-relaxed text-ink">{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="lg:col-span-4">
                      <p className="legend mb-3 text-[9px] text-clip">Common mistakes here</p>
                      <ul className="space-y-2 rounded-[2px] border border-clip/25 bg-clip/[0.05] p-3.5">
                        {node.detail.mistakes.map((m) => (
                          <li key={m} className="flex gap-2.5">
                            <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-clip" />
                            <span className="text-[12.5px] leading-relaxed text-ink">{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </RackUnit>

        <p className="mt-5 max-w-[80ch] text-[12.5px] leading-relaxed text-legend-dim">
          Routing depth is a choice, not a badge of honour. Two levels of grouping (tracks → group bus
          → mix bus) suits almost every production. Add a third only when a session genuinely exceeds
          about 60 tracks, and never add insert processing at every level — it multiplies latency and
          makes the mix impossible to audit.
        </p>
      </div>
    </section>
  )
}
