export type GroupKey = string

export type Sync = 'grid' | 'offgrid' | 'sustained' | 'vocal'

export interface BusDef {
  key: GroupKey
  name: string
  label: string
  short: string
  color: string
  purpose: string
  gainStage: string[]
}

export const BUSES: Record<GroupKey, BusDef> = {
  drums: {
    key: 'drums',
    name: 'DRUM BUS',
    label: 'Drums',
    short: 'DR',
    color: '#F5A524',
    purpose:
      'The rhythmic foundation. Kick and snare set the level everything else is judged against, so this bus is balanced first and rarely moved afterwards.',
    gainStage: [
      'Balance the kit on the channel faders before touching the bus. Bus compression cannot fix a kit that was never balanced.',
      'Glue compression: 2–4 dB gain reduction maximum, slow attack so transients survive.',
      'High-pass the bus at 25–30 Hz unless the kick genuinely needs sub content.',
      'Check true peak here, not just sample peak — the kick transient is the loudest event in most mixes.',
    ],
  },
  percussion: {
    key: 'percussion',
    name: 'PERC BUS',
    label: 'Percussion',
    short: 'PC',
    color: '#FFD166',
    purpose:
      'Movement and colour, not the backbeat. Percussion supports the groove — it should be felt as texture rather than heard as individual events.',
    gainStage: [
      'High-pass aggressively at 80–120 Hz. Almost no percussion has useful content below that.',
      'Automate the whole bus out for a section to create energy with subtraction.',
      'Randomise pan and level slightly on programmed parts so the section sounds played.',
    ],
  },
  bass: {
    key: 'bass',
    name: 'BASS BUS',
    label: 'Bass',
    short: 'BS',
    color: '#8BC34A',
    purpose:
      'Low-frequency foundation and harmonic link between drums and music. Bass eats headroom faster than anything else in the session.',
    gainStage: [
      'Check phase between DI and amp layers before blending. Phase inversion is the most common reason a bass sounds thin.',
      'High-pass above 30–40 Hz. Ultra-low rumble costs limiter headroom and is inaudible on most systems.',
      'Automate the bass per section — it needs to move more than any other instrument.',
    ],
  },
  guitars: {
    key: 'guitars',
    name: 'GTR BUS',
    label: 'Guitars',
    short: 'GT',
    color: '#26C6DA',
    purpose:
      'Midrange weight and stereo image. Guitars carry sustained energy and need far less level than they feel like they need.',
    gainStage: [
      'Level-match double-tracked pairs within 1 dB, or the part will read as leaning to one side.',
      'Check mono: panned, phase-shifted doubles can cancel completely.',
      'Automate the bus down in verses — the fastest fix for a vocal that will not sit.',
    ],
  },
  music: {
    key: 'music',
    name: 'MUSIC BUS',
    label: 'Keys / Music',
    short: 'MU',
    color: '#7E57C2',
    purpose:
      'Harmonic bed: keys, synths, piano, pads and orchestral sections. Fills the stereo field and leaves the vocal its space.',
    gainStage: [
      'Pads and strings are always far quieter in the mix than they sound in solo. Trust the mix, not the solo button.',
      'Sub-group this bus once it exceeds about 12 tracks — keys and orchestral sections move at different rates.',
      'Automate the Music Bus down in verses. This single move fixes more buried vocals than any amount of EQ.',
    ],
  },
  vocals: {
    key: 'vocals',
    name: 'VOCAL BUS',
    label: 'Vocals',
    short: 'VX',
    color: '#FF7A9B',
    purpose:
      'The primary focal point in most commercial music. The lead sits at or near the top of the level stack, with everything else clearly behind it.',
    gainStage: [
      'Compress in stages: 2–3 dB on the channel, 2–3 more on the bus. Two gentle stages beat one aggressive one.',
      'Automate level before heavy compression so the compressor is not doing fader work.',
      'Send reverb from a high-passed, de-essed copy so the tail stays clean.',
    ],
  },
  fx: {
    key: 'fx',
    name: 'FX BUS',
    label: 'FX & Ambience',
    short: 'FX',
    color: '#B39DDB',
    purpose:
      'Depth, space and transitions. FX are felt more than heard — most reverb sits far lower in the mix than it appears when soloed.',
    gainStage: [
      'Bus returns rather than inserting reverbs per track. It is cheaper and makes the mix sound like one room.',
      'High-pass returns at 300–600 Hz and low-pass at 8–12 kHz. This single move cleans most muddy mixes.',
      'Automate FX across sections: more space in choruses, drier in verses.',
    ],
  },
  custom: {
    key: 'custom',
    name: 'CUSTOM BUS',
    label: 'Custom',
    short: 'CX',
    color: '#94A3B8',
    purpose:
      'A group you defined yourself. Useful for stems you intend to deliver separately, or for elements that do not belong anywhere else.',
    gainStage: [
      'Name the bus after what it delivers, not after what it contains — future-you has to find it quickly.',
      'If this bus is destined to become a stem, keep mix bus processing off it.',
      'Keep the same headroom target as every other bus.',
    ],
  },
}

export const GROUP_ORDER: GroupKey[] = [
  'drums',
  'percussion',
  'bass',
  'guitars',
  'music',
  'vocals',
  'fx',
  'custom',
]

/** Built-in bus definitions plus any the user has created. */
export function busDef(key: string, customs: Record<string, BusDef> = {}): BusDef {
  return customs[key] ?? BUSES[key] ?? BUSES.custom
}

export interface TrackType {
  id: string
  name: string
  group: GroupKey
  /** Recommended starting peak in dBFS at the mix. */
  peak: [number, number]
  /** Suggested fader start, dB relative to unity. */
  fader: number
  sync: Sync
  role: string
  note: string
  typical: [number, number]
}

const T = (
  id: string,
  name: string,
  group: GroupKey,
  peak: [number, number],
  fader: number,
  sync: Sync,
  role: string,
  note: string,
  typical: [number, number] = [0, 4],
): TrackType => ({ id, name, group, peak, fader, sync, role, note, typical })

export const TRACK_TYPES: TrackType[] = [
  // ---- Drums
  T('kick', 'Kick', 'drums', [-9, -3], 0, 'grid', 'Rhythmic anchor', 'Usually the loudest single transient in the mix. Set this before anything else in the low end.', [1, 2]),
  T('snare', 'Snare', 'drums', [-12, -6], -1.5, 'grid', 'Backbeat', 'Genre decides whether snare sits above or below the kick. Pop favours snare, rock often the reverse.', [1, 3]),
  T('clap', 'Clap / Snap', 'drums', [-14, -8], -4, 'grid', 'Backbeat layer', 'Usually layered under the snare to thicken it. Phase-check the layer or it cancels the snare instead.', [0, 2]),
  T('tom', 'Tom', 'drums', [-14, -8], -4.5, 'grid', 'Fill element', 'Toms should fill, not compete. Gate them if they are bleeding into the overheads.', [0, 6]),
  T('hihat', 'Hi-Hat', 'drums', [-20, -13], -9, 'grid', 'Timekeeper', 'Sits well below the backbeat in most styles. Watch for masking in the 6–10 kHz vocal sibilance range.', [1, 2]),
  T('cymbal', 'Cymbal / Ride', 'drums', [-18, -12], -8.5, 'offgrid', 'Texture', 'Cymbal wash should never dominate the top end or drown the vocal.', [0, 6]),
  T('overhead', 'Overheads', 'drums', [-16, -10], -7, 'offgrid', 'Kit tone', 'Carries the overall kit tone and stereo image. Balancing the kit against the overheads is faster than balancing every mic.', [2, 4]),
  T('room', 'Room Mic', 'drums', [-22, -14], -11, 'offgrid', 'Depth', 'Blend for depth and glue. Parallel compression on room mics adds power without crushing transients.', [0, 4]),

  // ---- Percussion
  T('shaker', 'Shaker', 'percussion', [-24, -16], -13, 'offgrid', 'Groove texture', 'Wide but low. Felt as texture rather than heard as events.', [0, 4]),
  T('tambourine', 'Tambourine', 'percussion', [-22, -15], -12, 'offgrid', 'Groove texture', 'High-pass hard; it is almost entirely upper-midrange energy.', [0, 3]),
  T('handperc', 'Hand Percussion', 'percussion', [-20, -13], -10, 'offgrid', 'Movement', 'Congas, bongos, shakers and claves. Keep them clear of the kick and snare fundamental ranges.', [0, 6]),
  T('timpani', 'Timpani', 'percussion', [-16, -9], -6, 'grid', 'Orchestral weight', 'Large transient with real sub content. High-pass at 35–45 Hz and set level for the roll, not the hit.', [0, 2]),

  // ---- Bass
  T('bass', 'Bass', 'bass', [-12, -6], -1, 'sustained', 'Low foundation', 'The kick usually owns 40–80 Hz; the bass owns 80–250 Hz. Let them take turns.', [1, 2]),
  T('synthbass', 'Synth Bass', 'bass', [-12, -6], -1, 'sustained', 'Low foundation', 'Check it against the kick for phase. Synth bass and kick often collide rather than complement.', [0, 2]),
  T('sub808', '808 / Sub', 'bass', [-10, -4], -2, 'sustained', 'Sub weight', 'The loudest peak in the session relative to its perceived loudness. Watch true peak carefully.', [0, 2]),

  // ---- Guitars
  T('acousticgtr', 'Acoustic Guitar', 'guitars', [-16, -9], -4, 'sustained', 'Harmonic bed', 'Often needs less level but more presence than electrics to compete.', [0, 4]),
  T('electricgtr', 'Electric Guitar', 'guitars', [-16, -9], -4, 'sustained', 'Harmonic bed', 'Carries a lot of sustained energy. Rhythm guitar must not occupy the 1–4 kHz vocal presence zone at full level.', [0, 8]),

  // ---- Keys / music
  T('piano', 'Piano', 'music', [-18, -10], -6, 'sustained', 'Harmonic bed', 'Enormous bandwidth. At full level a piano swallows the entire midrange.', [0, 4]),
  T('keys', 'Keys / EP', 'music', [-22, -14], -9, 'sustained', 'Harmonic bed', 'Electric piano sits in a narrow band. Cut rather than boost when it fights the vocal.', [0, 4]),
  T('organ', 'Organ', 'music', [-20, -13], -8, 'sustained', 'Harmonic bed', 'Sustained and full-range. Automate it per section or it will flatten the arrangement.', [0, 2]),
  T('synth', 'Synth', 'music', [-18, -10], -6, 'sustained', 'Harmonic / hook', 'A synth carrying the hook is the exception, and may sit at vocal level.', [0, 8]),
  T('pad', 'Pad', 'music', [-24, -16], -12, 'sustained', 'Texture', 'Pads are felt, not heard. Soloed they always sound too quiet — and they are not.', [0, 4]),
  T('harp', 'Harp', 'music', [-22, -15], -11, 'sustained', 'Colour', 'Transient and delicate. Protect it from bus compression on the Music Bus.', [0, 2]),
  T('woodwind', 'Woodwinds', 'music', [-20, -12], -8, 'sustained', 'Orchestral colour', 'Blends into a section texture. Bus balance matters far more than individual mic levels.', [0, 6]),
  T('brass', 'Brass', 'music', [-16, -9], -6, 'grid', 'Orchestral weight', 'Transient-heavy and loud in short bursts. Set level for the stab, not the sustained note.', [0, 8]),
  T('strings', 'Strings', 'music', [-20, -12], -8, 'sustained', 'Orchestral bed', 'Automate per phrase instead of compressing — compression flattens the crescendo that makes the part work.', [0, 12]),

  // ---- Vocals
  T('leadvox', 'Lead Vocal', 'vocals', [-12, -5], 2, 'vocal', 'Focal point', 'Usually the loudest element after the kick. Rides and staged compression keep it there.', [1, 2]),
  T('backingvox', 'Backing Vocal', 'vocals', [-20, -12], -8, 'vocal', 'Harmony', 'Clearly behind the lead, but audible — not a rumour.', [0, 12]),
  T('choirox', 'Choir / Stack', 'vocals', [-22, -14], -10, 'vocal', 'Texture', 'The stack is a texture, not a set of individuals. Bus it and treat it as one element.', [0, 8]),
  T('adlib', 'Ad-lib', 'vocals', [-22, -15], -11, 'vocal', 'Punctuation', 'Panned and treated as punctuation, not as a second lead.', [0, 6]),
  T('talkback', 'Talkback / Narration', 'vocals', [-26, -18], -14, 'vocal', 'Speech', 'Spoken word needs consistency, not loudness. Ride it rather than compressing hard.', [0, 1]),

  // ---- FX
  T('reverbfx', 'Reverb Return', 'fx', [-24, -16], -12, 'offgrid', 'Space', 'Always far quieter than it sounds in solo. Pull it down until it disappears, then back up until you notice it.', [0, 4]),
  T('delayfx', 'Delay Return', 'fx', [-26, -18], -14, 'offgrid', 'Space', 'Fed from a high-passed, de-essed send so repeats stay clear of the lyric.', [0, 3]),
  T('ambience', 'Ambience / Room', 'fx', [-26, -18], -14, 'offgrid', 'Glue', 'Shared ambience makes disparate elements sound like they were recorded in the same place.', [0, 4]),
  T('riser', 'Riser / Sweep', 'fx', [-22, -14], -11, 'offgrid', 'Transition', 'Short, loud and broadband. Automate rather than limit, or it will spike the mix bus.', [0, 4]),
  T('noise', 'Noise / Texture', 'fx', [-28, -20], -16, 'sustained', 'Texture', 'Sits at the very bottom of the level stack. If you can clearly name it, it is probably too loud.', [0, 3]),

  // ---- Custom
  T('custom', 'Custom Track', 'custom', [-16, -9], -4, 'sustained', 'User defined', 'Rename it and set the level by ear — the range here is only a neutral starting point.', [0, 99]),
]

export const TYPE_BY_ID: Record<string, TrackType> = Object.fromEntries(
  TRACK_TYPES.map((t) => [t.id, t]),
)

export const typeOf = (id: string): TrackType => TYPE_BY_ID[id] ?? TYPE_BY_ID.custom

export const SYNC_WEIGHT: Record<Sync, number> = {
  grid: 1,
  vocal: 0.75,
  offgrid: 0.6,
  sustained: 0.4,
}

/* ------------------------------------------------------------------ Tracks */

export interface Track {
  uid: string
  typeId: string
  name: string
  group: GroupKey
  fader: number
  pan: number
}

let uidSeq = 0
export const nextUid = () => `t${++uidSeq}`

export function makeTrack(typeId: string, group?: GroupKey, name?: string): Track {
  const t = typeOf(typeId)
  return {
    uid: nextUid(),
    typeId: t.id,
    name: name ?? t.name,
    group: group ?? t.group,
    fader: t.fader,
    pan: 0,
  }
}

/* ----------------------------------------------------------------- Presets */

export interface PresetSpec {
  typeId: string
  count: number
  labels?: string[]
}

export interface Preset {
  id: string
  name: string
  desc: string
  color: string
  scale: 'small' | 'medium' | 'large'
  spec: PresetSpec[]
}

const p = (typeId: string, count: number, labels?: string[]): PresetSpec => ({
  typeId,
  count,
  labels,
})

export const PRESETS: Preset[] = [
  {
    id: 'small',
    name: 'Small Session',
    desc: 'Acoustic demo or sketch. Four buses, no sub-grouping, everything editable in one screen.',
    color: '#35E08A',
    scale: 'small',
    spec: [
      p('kick', 1), p('snare', 1), p('hihat', 1), p('overhead', 2), p('bass', 1),
      p('acousticgtr', 1), p('electricgtr', 1), p('piano', 1), p('leadvox', 1),
      p('backingvox', 1), p('reverbfx', 1),
    ],
  },
  {
    id: 'medium',
    name: 'Medium Session',
    desc: 'A standard band production with layered vocals and a couple of synth parts.',
    color: '#F5A524',
    scale: 'medium',
    spec: [
      p('kick', 1), p('snare', 1), p('tom', 2), p('hihat', 1), p('cymbal', 2),
      p('room', 2), p('shaker', 2), p('bass', 1), p('acousticgtr', 2),
      p('electricgtr', 2), p('piano', 1), p('keys', 1), p('synth', 1),
      p('leadvox', 1, ['Lead Vocal']), p('backingvox', 4), p('strings', 2),
      p('reverbfx', 2), p('delayfx', 1), p('ambience', 1),
    ],
  },
  {
    id: 'large',
    name: 'Large Session',
    desc: 'Dense pop production or film score. Sub-grouping and bouncing are mandatory at this size.',
    color: '#FF4D4D',
    scale: 'large',
    spec: [
      p('kick', 2), p('snare', 2), p('tom', 4), p('hihat', 2), p('cymbal', 4),
      p('room', 4), p('shaker', 4), p('tambourine', 2), p('handperc', 4), p('timpani', 2),
      p('bass', 2), p('acousticgtr', 4), p('electricgtr', 6), p('piano', 2),
      p('keys', 2), p('organ', 1), p('synth', 4), p('pad', 4), p('harp', 1),
      p('woodwind', 6), p('brass', 6), p('strings', 12), p('leadvox', 2),
      p('backingvox', 12), p('choirox', 6), p('adlib', 4), p('reverbfx', 4),
      p('delayfx', 3), p('ambience', 4), p('riser', 3), p('noise', 2),
    ],
  },
  {
    id: 'pop',
    name: 'Pop',
    desc: 'Vocal-forward, layered, synth-heavy. The vocal bus does most of the work.',
    color: '#FF7A9B',
    scale: 'medium',
    spec: [
      p('kick', 1), p('snare', 1), p('clap', 1), p('hihat', 1), p('cymbal', 2),
      p('overhead', 2), p('shaker', 2), p('bass', 1), p('electricgtr', 2),
      p('synth', 4), p('keys', 2), p('pad', 3), p('leadvox', 1, ['Lead Vocal']),
      p('backingvox', 8), p('adlib', 4), p('reverbfx', 3), p('delayfx', 2),
      p('riser', 2),
    ],
  },
  {
    id: 'rock',
    name: 'Rock',
    desc: 'Live band, double-tracked guitars, big kit. The drum and guitar buses carry the song.',
    color: '#EF5350',
    scale: 'medium',
    spec: [
      p('kick', 2), p('snare', 2), p('tom', 4), p('hihat', 1), p('cymbal', 4),
      p('room', 4), p('bass', 2, ['Bass DI', 'Bass Amp']), p('electricgtr', 6),
      p('acousticgtr', 2), p('organ', 1), p('piano', 1), p('leadvox', 2),
      p('backingvox', 4), p('reverbfx', 2), p('delayfx', 1), p('ambience', 1),
    ],
  },
  {
    id: 'hiphop',
    name: 'Hip-Hop',
    desc: 'Programmed drums, 808 sub, sparse harmony, vocal front and centre.',
    color: '#B39DDB',
    scale: 'medium',
    spec: [
      p('kick', 2), p('snare', 1), p('clap', 2), p('hihat', 2), p('handperc', 4),
      p('sub808', 1), p('bass', 1), p('synth', 3), p('keys', 3), p('pad', 2),
      p('leadvox', 1, ['Lead Vocal']), p('backingvox', 2), p('adlib', 2),
      p('reverbfx', 3), p('delayfx', 2), p('ambience', 2), p('noise', 2),
    ],
  },
  {
    id: 'electronic',
    name: 'Electronic',
    desc: 'Synth-driven, heavy layering, many FX. The FX bus and the sub are the pressure points.',
    color: '#26C6DA',
    scale: 'medium',
    spec: [
      p('kick', 1), p('clap', 1), p('hihat', 2), p('cymbal', 2), p('shaker', 2),
      p('handperc', 4), p('bass', 2), p('synthbass', 1), p('synth', 6), p('pad', 4),
      p('leadvox', 1), p('backingvox', 2), p('reverbfx', 4), p('delayfx', 3),
      p('riser', 4), p('ambience', 3), p('noise', 3),
    ],
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    desc: 'Orchestral scoring. Huge track count, wide sustained content, almost no compression.',
    color: '#64B5F6',
    scale: 'large',
    spec: [
      p('timpani', 2), p('handperc', 6), p('strings', 16), p('brass', 8),
      p('woodwind', 8), p('choirox', 6), p('harp', 1), p('piano', 1), p('synth', 4),
      p('pad', 4), p('reverbfx', 6), p('ambience', 6), p('riser', 4), p('noise', 3),
    ],
  },
  {
    id: 'podcast',
    name: 'Podcast / Voice',
    desc: 'Spoken word. Consistency beats loudness — the vocal bus is the whole mix.',
    color: '#94A3B8',
    scale: 'small',
    spec: [
      p('leadvox', 2, ['Host', 'Guest']), p('talkback', 1, ['Room']),
      p('keys', 1, ['Music Bed']), p('reverbfx', 1, ['De-ess Send']),
      p('delayfx', 1, ['Ducking Send']), p('ambience', 1, ['Tone Bed']),
    ],
  },
]

export function tracksFromPreset(preset: Preset): Track[] {
  const out: Track[] = []
  for (const s of preset.spec) {
    const t = typeOf(s.typeId)
    for (let i = 0; i < s.count; i++) {
      const label = s.labels?.[i]
      const auto = s.count === 1 ? t.name : `${t.name} ${i + 1}`
      out.push(makeTrack(t.id, undefined, label ?? auto))
    }
  }
  return out
}

/* ---------------------------------------------------------------- Analysis */

export type Risk = 'low' | 'medium' | 'high'

export interface BusRec {
  def: BusDef
  tracks: Track[]
  count: number
  peak: [number, number]
  headroom: string
  /** Theoretical worst-case sum if every track peaked simultaneously. */
  worstCase: number
  /** How much of that bound is realistic given the material. */
  coherence: number
  risk: Risk
  trim: string
  subBuses: string[] | null
  gainStage: string[]
  purpose: string
}

export interface Warning {
  id: string
  level: 'info' | 'caution' | 'alert'
  title: string
  body: string
  scope?: string
  color?: string
}

export interface SessionRec {
  buses: BusRec[]
  total: number
  busPeak: [number, number]
  busHeadroom: string
  mixBus: { peak: [number, number]; loudness: string; headroom: string; purpose: string; gainStage: string[] }
  preMaster: { peak: [number, number]; tp: string; loudness: string; purpose: string; gainStage: string[] }
  trackPeak: [number, number]
  warnings: Warning[]
  riskScore: number
  scale: 'small' | 'medium' | 'large'
  levels: { track: string; bus: string; mix: string; pre: string; master: string }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const log10 = Math.log10

function busPeakTarget(count: number, hottest: number): [number, number] {
  // Anchor the bus to the hottest element feeding it, plus a little room for
  // summing. A bus can legitimately sit slightly above any single channel —
  // that is what summing does — but never so high there is nothing left.
  let hi = Math.min(-3, hottest + 3)
  // More tracks feeding the bus means more margin, because more elements can
  // coincide. This is a headroom rule, not a level calculation.
  if (count > 8) hi -= 1
  if (count > 16) hi -= 1
  hi = Math.max(hi, -24)
  const lo = Math.max(hi - 3, -28)
  return [lo, hi]
}

export function analyse(
  tracks: Track[],
  customs: Record<string, BusDef> = {},
): SessionRec {
  const total = tracks.length

  const byGroup = new Map<string, Track[]>()
  for (const t of tracks) {
    const list = byGroup.get(t.group) ?? []
    list.push(t)
    byGroup.set(t.group, list)
  }

  const buses: BusRec[] = []
  const warnings: Warning[] = []
  const order = [...GROUP_ORDER, ...Object.keys(customs)]

  for (const key of order) {
    const list = byGroup.get(key)
    if (!list || list.length === 0) continue
    const def = busDef(key, customs)
    const count = list.length

    const peaks = list.map((t) => typeOf(t.typeId).peak)
    const hottest = Math.max(...peaks.map((p) => p[1]))
    const coldest = Math.min(...peaks.map((p) => p[0]))

    const sumW = list.reduce((a, t) => a + SYNC_WEIGHT[typeOf(t.typeId).sync], 0)
    const coherence = count > 0 ? sumW / count : 0

    // Worst-case sum: uncorrelated bound is +10·log10(N); a perfectly correlated
    // group is +20·log10(N). Interpolate by how grid-aligned the group is.
    const worstCase = count > 1 ? hottest + (10 + 10 * coherence) * log10(count) : hottest

    const peak = busPeakTarget(count, hottest)
    const headroom = `≥ ${Math.abs(peak[1]).toFixed(0)} dB below 0 dBFS`

    // Practical risk is about how many hot, grid-aligned elements share the bus —
    // not about the theoretical bound, which exceeds 0 dBFS on almost any real bus.
    const hotCount = list.filter((t) => typeOf(t.typeId).peak[1] >= -4).length
    const risk: Risk =
      count >= 10 && coherence >= 0.65 && hotCount >= 6
        ? 'high'
        : count >= 6 || hotCount >= 4
          ? 'medium'
          : 'low'

    const trim =
      worstCase > peak[1]
        ? `If this bus meter reaches ${(worstCase).toFixed(0)} dBFS, trim the bus fader by ~${(worstCase - peak[1]).toFixed(1)} dB to land back at the target. In practice you will land well below that — not every element peaks at once.`
        : 'No bus trim needed at these counts. Set the level by balance, not by arithmetic.'

    let subBuses: string[] | null = null
    if (key === 'drums' && count >= 12) subBuses = ['KIT', 'OVERHEADS', 'ROOM']
    if (key === 'music' && count >= 14) subBuses = ['KEYS SUB', 'ORCH SUB']
    if (key === 'vocals' && count >= 12) subBuses = ['LEAD', 'BACKING', 'STACKS']
    if (key === 'fx' && count >= 8) subBuses = ['VERB', 'DELAY', 'TRANSITION']

    const gainStage = [...def.gainStage]
    if (subBuses) {
      gainStage.unshift(
        `At ${count} tracks, split this into ${subBuses.join(' / ')} sub-buses before the ${def.name}. Two levels of grouping, not three levels of insert processing.`,
      )
    }
    gainStage.unshift(
      `Target ${peak[0]} to ${peak[1]} dBFS on the bus. ${count} track${count === 1 ? '' : 's'} feeding it, peaking individually between ${coldest} and ${hottest} dBFS.`,
    )

    buses.push({
      def,
      tracks: list,
      count,
      peak,
      headroom,
      worstCase,
      coherence,
      risk,
      trim,
      subBuses,
      gainStage,
      purpose: def.purpose,
    })

    // ---- Warnings
    if (risk === 'high') {
      warnings.push({
        id: `sum-${key}`,
        level: 'alert',
        scope: def.name,
        color: def.color,
        title: `${def.name}: hot and grid-aligned`,
        body: `${count} tracks, ${hotCount} of which peak at -4 dBFS or above, and the group is heavily grid-aligned — these elements genuinely do hit together. A bound of about ${worstCase > 0 ? '+' : ''}${worstCase.toFixed(0)} dBFS is theoretical, but the practical risk is real: pull the group back at the bus, or set fewer elements to their maximum peak. The relative balance inside the group stays exactly the same.`,
      })
    } else if (hotCount >= 4) {
      warnings.push({
        id: `hot-${key}`,
        level: 'caution',
        scope: def.name,
        color: def.color,
        title: `${def.name}: several very hot elements`,
        body: `${hotCount} tracks in this group peak at -4 dBFS or above. Watch the bus meter rather than the channels — the sum, not any single track, is what reaches the mix bus. Trimming the bus preserves the balance completely.`,
      })
    }

    if (key === 'vocals') {
      const hasLead = list.some((t) => t.typeId === 'leadvox' || t.typeId === 'talkback')
      const backing = list.filter((t) => t.typeId === 'backingvox' || t.typeId === 'choirox').length
      if (!hasLead && backing > 0) {
        warnings.push({
          id: 'vox-nolead',
          level: 'caution',
          scope: def.name,
          color: def.color,
          title: 'Vocal bus has no lead',
          body: `${backing} backing or choir part${backing === 1 ? '' : 's'} and no lead or spoken element. If that is intentional — a gang-vocal section, a pad of voices — fine. Otherwise the bus has nothing to be behind.`,
        })
      }
    }

    if (key === 'drums') {
      const hasKick = list.some((t) => t.typeId === 'kick')
      if (!hasKick && count >= 4) {
        warnings.push({
          id: 'drums-nokick',
          level: 'caution',
          scope: def.name,
          color: def.color,
          title: 'Drum bus has no kick',
          body: 'Without a kick the rhythm section has no low-frequency anchor. Either add one, or move this group to the Percussion bus — it is a different job.',
        })
      }
    }
  }

  // ---- One clear explanation of the cumulative bound, on the busiest bus.
  const worstBus = [...buses].sort((a, b) => b.worstCase - a.worstCase)[0]
  if (worstBus && worstBus.count >= 6 && worstBus.worstCase > -1) {
    warnings.push({
      id: 'bound-explainer',
      level: 'info',
      scope: worstBus.def.name,
      color: worstBus.def.color,
      title: 'What the worst-case bound means',
      body: `${worstBus.def.name} shows a bound of about ${worstBus.worstCase > 0 ? '+' : ''}${worstBus.worstCase.toFixed(0)} dBFS. That assumes every one of its ${worstBus.count} tracks peaks at its maximum in the same instant, which never happens in a real arrangement. It is a ceiling calculation, not a prediction — its job is to tell you how much headroom the structure needs. Balance the group by ear and watch the bus meter, not the arithmetic.`,
    })
  }

  // ---- Session-level warnings
  const busCount = buses.length
  if (busCount > 8) {
    warnings.push({
      id: 'many-buses',
      level: 'caution',
      title: 'Routing is more complicated than it needs to be',
      body: `${busCount} group buses is more than most mixes can balance in one pass. Merge any bus holding fewer than 2 tracks into a neighbouring group — an extra bus with one fader on it is overhead, not control.`,
    })
  }
  const lonely = buses.filter((b) => b.count === 1)
  if (lonely.length >= 3) {
    warnings.push({
      id: 'single-buses',
      level: 'info',
      title: `${lonely.length} buses hold a single track`,
      body: `${lonely.map((b) => b.def.label).join(', ')} each contain one track. A bus with one track is a second fader, not a group. Merge them unless you need them as delivery stems.`,
    })
  }
  if (total > 90) {
    warnings.push({
      id: 'big-session',
      level: 'info',
      title: `${total} tracks — commit or bounce before mixing`,
      body: 'At this size, freeze or bounce virtual instruments and audio-heavy tracks. Session load time and latency stop being a background problem and start being the main one.',
    })
  }
  if (total > 0 && total <= 6) {
    warnings.push({
      id: 'tiny',
      level: 'info',
      title: 'Grouping is optional at this size',
      body: 'With this few tracks, buses buy you very little. Set the balance on the channel faders and keep the mix bus clean — you can always group later once the arrangement is settled.',
    })
  }
  const fxBus = buses.find((b) => b.def.key === 'fx')
  if (fxBus && fxBus.count >= 6) {
    warnings.push({
      id: 'many-fx',
      level: 'info',
      scope: fxBus.def.name,
      color: fxBus.def.color,
      title: 'Many FX returns',
      body: `${fxBus.count} returns is a lot of space to manage. Check that each one is doing something the others are not — six reverbs rarely sound like more space than two well-chosen ones.`,
    })
  }
  if (total === 0) {
    warnings.push({
      id: 'empty',
      level: 'info',
      title: 'No tracks yet',
      body: 'Choose a preset above, or add tracks one at a time. The structure rebuilds itself as you go.',
    })
  }

  // ---- Mix bus
  const busPeak: [number, number] =
    busCount <= 4 ? [-6, -3] : busCount <= 7 ? [-7, -4] : [-8, -5]
  const busHeadroom = `≥ ${Math.abs(busPeak[1])} dB below 0 dBFS at all times`

  const highRisk = buses.filter((b) => b.risk === 'high').length
  const riskScore = clamp(
    Math.round(
      (total / 120) * 35 +
        (busCount / 10) * 25 +
        highRisk * 12 +
        buses.filter((b) => b.risk === 'medium').length * 5,
    ),
    0,
    100,
  )

  const scale: 'small' | 'medium' | 'large' =
    total <= 20 ? 'small' : total <= 56 ? 'medium' : 'large'

  const trackLo = tracks.length ? Math.min(...tracks.map((t) => typeOf(t.typeId).peak[0])) : -20
  const trackHi = tracks.length ? Math.max(...tracks.map((t) => typeOf(t.typeId).peak[1])) : -6

  return {
    buses,
    total,
    busPeak,
    busHeadroom,
    scale,
    riskScore,
    trackPeak: [trackLo, trackHi],
    mixBus: {
      peak: busPeak,
      loudness: '-18 to -14 LUFS-S',
      headroom: busHeadroom,
      purpose:
        'The single point where every group becomes one signal. Set once during editing and never touched again — every stage after this assumes this level.',
      gainStage: [
        `Sum of ${busCount} group bus${busCount === 1 ? '' : 'es'}, targeting ${busPeak[0]} to ${busPeak[1]} dBFS peak.`,
        'No limiter and no loudness maximiser at this stage. Glue compression only, and only once the balance is right.',
        'Automate group buses here rather than stacking more plugins on individual channels.',
        'Leave the master fader at unity. If it is compensating for something, fix the something.',
      ],
    },
    preMaster: {
      peak: [-6, -3],
      tp: '≤ -3 dBTP',
      loudness: '-18 to -14 LUFS-I',
      purpose:
        'The handover. A clean, uncoloured bounce with proper headroom, plus the stems and notes a mastering engineer needs.',
      gainStage: [
        'Trim the mix bus — not the master fader — to land between -6 and -3 dBFS peak.',
        'True peak at or below -3 dBTP so mastering has limiter headroom to work with.',
        'No dither at this stage. Dither belongs to the final word-length conversion only.',
        'Deliver 24-bit WAV at the session sample rate, plus stems, a reference and a short note.',
      ],
    },
    warnings,
    levels: {
      track: `${trackLo} to ${trackHi} dBFS peak`,
      bus: `${busPeak[0] - 4} to ${busPeak[1]} dBFS peak`,
      mix: `${busPeak[0]} to ${busPeak[1]} dBFS peak`,
      pre: '-6 to -3 dBFS peak, ≤ -3 dBTP',
      master: '-14 LUFS-I, -1.0 dBTP',
    },
  }
}

export type Selection =
  | { kind: 'bus'; key: string }
  | { kind: 'stage'; id: 'tracks' | 'mixbus' | 'premaster' | 'master' }
