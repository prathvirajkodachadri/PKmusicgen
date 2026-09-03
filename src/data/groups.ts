export type GroupId =
  | 'drums'
  | 'bass'
  | 'guitars'
  | 'keys'
  | 'strings'
  | 'vocals'
  | 'fx'
  | 'percussion'

export interface Group {
  id: GroupId
  name: string
  bus: string
  tracks: string
  color: string
  anchor: string
  relationships: { element: string; value: string; note: string }[]
  processing: string[]
  commonMistakes: string[]
  routing: string
}

export const groups: Group[] = [
  {
    id: 'drums',
    name: 'Drums',
    bus: 'DRUM BUS',
    tracks: '6–14',
    color: '#F5A524',
    anchor: 'Kick is the reference point for the whole rhythm section',
    relationships: [
      { element: 'Kick peak', value: 'reference: -8 to -3 dBFS', note: 'Set this first. Everything else in the low end is judged against it.' },
      { element: 'Snare vs kick', value: '+2 to -3 dB relative', note: 'Genre decides this. Pop favours snare above kick; rock often the reverse.' },
      { element: 'Toms vs kick', value: '-2 to -6 dB relative', note: 'Toms should fill, not compete. Gate them if they are bleeding.' },
      { element: 'Hi-hat vs snare', value: '-6 to -12 dB relative', note: 'Hi-hat sits well below the backbeat in most styles.' },
      { element: 'Cymbals / overheads', value: '-8 to -15 dB relative to kick', note: 'Overheads carry the kit tone; cymbal wash should never dominate the top end.' },
      { element: 'Room mics', value: '-12 to -20 dB relative', note: 'Use them for depth and glue, blended in parallel if you want power.' },
      { element: 'Drum bus peak', value: '-6 to -3 dBFS', note: 'Same headroom rule as the mix bus. The bus is not the place to get loud.' },
    ],
    processing: [
      'Bus compression is glue, not level. 2–4 dB gain reduction maximum, slow attack so transients survive.',
      'High-pass the kit bus around 25–30 Hz unless the kick genuinely needs sub content.',
      'Parallel compression on the drum bus adds density without crushing the transient picture.',
    ],
    commonMistakes: [
      'Mixing every drum in solo and losing the relationship between kick, bass and snare.',
      'Pushing cymbals up until they mask the vocal and then EQ-ing the vocal instead.',
      'Applying drum bus limiting so heavily the kit loses all impact on a small speaker.',
    ],
    routing: 'Kick / Snare / Toms / OH / Room → DRUM BUS → MIX BUS',
  },
  {
    id: 'bass',
    name: 'Bass',
    bus: 'BASS BUS',
    tracks: '1–4',
    color: '#8BC34A',
    anchor: 'Bass relates to the kick and the low-mid pocket, not to a fixed number',
    relationships: [
      { element: 'Bass peak vs kick', value: '-3 to +2 dB relative', note: 'The kick usually owns 40–80 Hz; the bass owns 80–250 Hz. Let them take turns.' },
      { element: 'Bass peak level', value: '-12 to -6 dBFS', note: 'Leave room — bass eats headroom faster than anything else.' },
      { element: 'Sub content (<60 Hz)', value: 'high-pass above 30–40 Hz', note: 'Ultra-low rumble costs limiter headroom and is inaudible on most systems.' },
      { element: 'DI + amp blend', value: 'match phase first, then blend', note: 'Blend by ear for tone; a phase inversion is the most common reason a bass sounds thin.' },
    ],
    processing: [
      'Multiband compression or dynamic EQ around 200–400 Hz to stop the bass from swallowing the low mids.',
      'Saturation adds harmonics so the bass is audible on small speakers without raising the fundamental.',
      'Automate the bass level per section. Bass needs to move more than any other instrument.',
    ],
    commonMistakes: [
      'Fighting the kick by pushing bass level instead of carving complementary EQ.',
      'Leaving 25 Hz of inaudible content that costs 2 dB of limiter headroom.',
      'Judging bass on untreated room acoustics and over-correcting for a room problem.',
    ],
    routing: 'DI / Amp / Synth → BASS BUS → MIX BUS',
  },
  {
    id: 'guitars',
    name: 'Guitars',
    bus: 'GTR SUB-BUS',
    tracks: '2–14',
    color: '#26C6DA',
    anchor: 'Guitars shape the stereo image and own the midrange pocket beside the vocal',
    relationships: [
      { element: 'Rhythm guitar peak', value: '-14 to -8 dBFS', note: 'Guitars carry a lot of sustained energy; they need less level than they feel like they need.' },
      { element: 'Guitar vs vocal', value: '-4 to -10 dB relative', note: 'Rhythm guitar must not occupy the 1–4 kHz vocal presence zone at full level.' },
      { element: 'Double-tracked pair', value: 'pan L/R, match within 1 dB', note: 'A mismatch reads as the part leaning to one side, not as width.' },
      { element: 'Acoustic vs electric', value: '-2 to +2 dB relative', note: 'Acoustics often need less level but more presence to compete with electrics.' },
      { element: 'Lead guitar', value: '-12 to -6 dBFS', note: 'Whatever plays the hook is allowed to be the loudest element on this bus.' },
      { element: 'GTR sub-bus peak', value: '-10 to -5 dBFS', note: 'Wide panned content reaches peak faster than a mono channel does. Leave room.' },
    ],
    processing: [
      'Bus the guitar section together so you can automate "the guitars" as one gesture across sections.',
      'Check mono: heavily panned, phase-shifted doubles can cancel completely and vanish.',
      'Automate the guitar bed down during verses — the most common fix for a vocal that will not sit.',
    ],
    commonMistakes: [
      'Stacking six guitar tracks at the same level and calling it a wall of sound. It is a wall of mud.',
      'Narrowing the guitars so much they disappear on a phone speaker.',
      'Adding top end to make guitars brighter while the vocal presence range is already full.',
    ],
    routing: 'Gtr L/R / Lead / Acoustic → GTR SUB-BUS → MUSIC BUS → MIX BUS',
  },
  {
    id: 'keys',
    name: 'Keyboards & Synths',
    bus: 'KEY SUB-BUS',
    tracks: '2–20',
    color: '#7E57C2',
    anchor: 'Keys and synths fill harmonic space — they must leave room for the vocal, not compete with it',
    relationships: [
      { element: 'Piano / electric piano', value: '-18 to -10 dBFS', note: 'A piano has enormous bandwidth; at full level it swallows the whole midrange.' },
      { element: 'Pads', value: '-22 to -14 dBFS', note: 'Pads are felt, not heard. Soloed they always sound too quiet — and they are not.' },
      { element: 'Synth lead / arp', value: '-14 to -6 dBFS', note: 'A synth carrying the hook is the exception, and may sit at vocal level.' },
      { element: 'Keys vs vocal', value: '-6 to -14 dB relative', note: 'The single most common fix for a buried vocal is automating this relationship down in the verse.' },
      { element: 'Sub-heavy synth content', value: 'high-pass 30–40 Hz', note: 'Anything genuinely sub-heavy belongs on the bass bus, not the key bus.' },
      { element: 'KEY sub-bus peak', value: '-10 to -5 dBFS', note: 'Stacked virtual instruments sum fast. Watch the bus, not the individual track.' },
    ],
    processing: [
      'Group pianos, pads and synths separately if the session allows, then bus them together — they move at different rates.',
      'High-pass pads generously; most pad content below 150 Hz is competing with the bass for no benefit.',
      'Automate keyboard level per section. A pad that is right in the chorus will be far too loud in the verse.',
    ],
    commonMistakes: [
      'Leaving a grand piano at full level across the whole arrangement and EQ-ing everything else around it.',
      'Stacking three pads plus a string section in the same octave, then wondering why the mix is cloudy.',
      'Judging a pad in solo and turning it up, when it was already correct in context.',
    ],
    routing: 'Piano / EP / Pads / Synths → KEY SUB-BUS → MUSIC BUS → MIX BUS',
  },
  {
    id: 'strings',
    name: 'Strings, Brass & Winds',
    bus: 'STR SUB-BUS',
    tracks: '2–32',
    color: '#64B5F6',
    anchor: 'Ensemble sections are wide, dynamic and slow — they need level automation far more than compression',
    relationships: [
      { element: 'String section peak', value: '-18 to -10 dBFS', note: 'Sections blend into one texture, so bus balance matters far more than individual mics.' },
      { element: 'Solo string', value: '-14 to -8 dBFS', note: 'A solo instrument is a featured part and sits much closer to the vocal.' },
      { element: 'Brass stabs', value: '-12 to -6 dBFS', note: 'Transient-heavy and loud in short bursts — set level for the stab, not the sustained note.' },
      { element: 'Brass vs vocal', value: '-6 to -12 dB relative', note: 'Brass occupies the same presence range as a vocal. They cannot both lead at once.' },
      { element: 'Choir / gang vox', value: '-16 to -10 dBFS', note: 'Buss to vocals rather than strings if the words are intelligible.' },
      { element: 'STR sub-bus peak', value: '-12 to -6 dBFS', note: 'Wide, sustained sections reach peak quietly and consume headroom unnoticed.' },
    ],
    processing: [
      'Automate section levels per phrase instead of compressing. Compression flattens exactly the crescendo that makes the part work.',
      'High-pass soloed strings and brass gently at 60–100 Hz to clear space for bass and kick.',
      'On large sessions, bus by register (highs / mids / lows) so the section can be moved as a single gesture.',
    ],
    commonMistakes: [
      'Compressing a string crescendo until the arrival has no impact left.',
      'Leaving every string mic at the same level, so the section has no balance and no depth.',
      'Stacking brass and strings in the same octave, then wondering why the mix is harsh.',
    ],
    routing: 'Strings / Brass / Winds / Choir → STR SUB-BUS → MUSIC BUS → MIX BUS',
  },
  {
    id: 'vocals',
    name: 'Vocals',
    bus: 'VOCAL BUS',
    tracks: '2–24',
    color: '#FF7A9B',
    anchor: 'The lead vocal is the primary focal point in most commercial music',
    relationships: [
      { element: 'Lead vocal peak', value: '-10 to -4 dBFS', note: 'Usually the loudest element after the kick. Rides and compression keep it there.' },
      { element: 'Lead vs backing', value: '+4 to +10 dB relative', note: 'Backing vocals sit clearly behind, but audible — not a rumour.' },
      { element: 'Ad-libs', value: '-6 to -14 dB relative', note: 'Panned and treated as punctuation, not as a second lead.' },
      { element: 'Stacks / gang', value: 'grouped, -12 to -8 dBFS', note: 'Bus them together; the stack is a texture, not a set of individuals.' },
      { element: 'De-esser reduction', value: '3–6 dB on peaks', note: 'More than that sounds lispy. Fix sibilance at the mic position first.' },
    ],
    processing: [
      'Compress in stages: 2–3 dB on the channel, 2–3 more on the vocal bus. Two gentle stages beat one aggressive one.',
      'Automate the level *before* heavy compression so the compressor is not doing fader work.',
      'Send reverb from a high-passed, de-essed copy so the tail is not muddy or fizzy.',
    ],
    commonMistakes: [
      'Compressing 10 dB and then EQ-ing the artifacts back out.',
      'Letting the music bed stay at full level through the verse and then boosting the vocal to compete.',
      'Pushing the presence range until the vocal is harsh but somehow still not cutting through.',
    ],
    routing: 'Lead / Backing / Stacks / Ad-libs → VOCAL BUS → MIX BUS',
  },
  {
    id: 'fx',
    name: 'FX & Returns',
    bus: 'FX BUS',
    tracks: '2–16',
    color: '#B39DDB',
    anchor: 'FX create depth and transitions — they are felt more than heard',
    relationships: [
      { element: 'Reverb return peak', value: '-20 to -12 dBFS', note: 'Reverb sits far lower than it appears when soloed. Trust the mix, not the solo.' },
      { element: 'Delay return', value: '-24 to -14 dBFS', note: 'Fed from a high-passed, de-essed send so the repeats stay clear.' },
      { element: 'FX vs dry', value: '-8 to -20 dB relative', note: 'Pull a return down until it disappears, then bring it back up until you notice it.' },
      { element: 'Reverb pre-delay', value: '20–80 ms', note: 'Protects the transient of the source while still placing it in a space.' },
      { element: 'FX bus peak', value: '-14 to -8 dBFS', note: 'A quick way to ruin headroom is a bright, unhigh-passed reverb return.' },
    ],
    processing: [
      'Send to FX buses rather than inserting reverbs per track. It is cheaper, and it makes the whole mix sound like one room.',
      'High-pass reverb returns at 300–600 Hz and low-pass them at 8–12 kHz. This single move cleans most muddy mixes.',
      'Automate FX across sections: more space in choruses, drier in verses.',
    ],
    commonMistakes: [
      'Soloing a reverb and turning it up because it sounds beautiful — then wondering why the vocal is muddy.',
      'A different reverb on every track, so nothing shares a space.',
      'Delay repeats landing on top of the vocal and muddying the lyric.',
    ],
    routing: 'Sends → FX BUS (Reverb / Delay / Ambience) → MIX BUS',
  },
  {
    id: 'percussion',
    name: 'Percussion & Extras',
    bus: 'PERC BUS',
    tracks: '2–20',
    color: '#FFD166',
    anchor: 'Percussion adds movement and colour — it is not the backbeat',
    relationships: [
      { element: 'Percussion vs drums', value: '-6 to -14 dB relative', note: 'Shakers, tambourines and claps support the groove; they do not replace it.' },
      { element: 'Clap / snap layer', value: '-4 to -8 dB vs snare', note: 'Often layered under the snare to thicken it. Usually phase-checked.' },
      { element: 'Shaker / hat layers', value: '-14 to -22 dBFS', note: 'Wide but low. They should be felt as texture, not heard as events.' },
      { element: 'Perc bus peak', value: '-12 to -6 dBFS', note: 'Plenty of headroom — percussion is transient-heavy and eats it quickly.' },
    ],
    processing: [
      'Bus all percussion together so you can drop the whole bus out for a section and create energy with subtraction.',
      'High-pass aggressively: most percussion has no useful content below 80–120 Hz.',
      'Slight randomisation of pan and level makes programmed percussion sound played.',
    ],
    commonMistakes: [
      'Every percussion element at full level, turning the groove into noise.',
      'Double-layering claps without checking phase, so the layer cancels the snare.',
      'Forgetting percussion in the mono check — narrow layers vanish completely.',
    ],
    routing: 'Shaker / Clap / Tamb / Toms / Bells → PERC BUS → MIX BUS',
  },
]

export interface SessionSize {
  id: 'small' | 'medium' | 'large'
  name: string
  tracks: string
  count: number
  label: string
  color: string
  description: string
  buses: string[]
  notes: string[]
}

export const sessionSizes: SessionSize[] = [
  {
    id: 'small',
    name: 'Small session',
    tracks: '8 – 20 tracks',
    count: 14,
    label: 'ACOUSTIC / DEMO',
    color: '#35E08A',
    description:
      'A singer-songwriter, a podcast episode, or a demo of a song sketched in an afternoon. Grouping still helps, but a single sub-bus per instrument family is usually enough.',
    buses: ['DRUM BUS', 'BASS BUS', 'MUSIC BUS', 'VOCAL BUS'],
    notes: [
      '4 buses plus 2–3 FX returns is plenty.',
      'Most DAWs handle this without any freezing or bouncing.',
      'Still set the mix bus to -6 dBFS peak — the rule does not scale with size.',
    ],
  },
  {
    id: 'medium',
    name: 'Medium session',
    tracks: '24 – 56 tracks',
    count: 38,
    label: 'STANDARD PRODUCTION',
    color: '#F5A524',
    description:
      'A full band arrangement with layered vocals, doubled guitars and a couple of synth parts. This is where group buses stop being a nicety and start being the thing that keeps you sane.',
    buses: ['DRUM BUS', 'BASS BUS', 'MUSIC BUS', 'VOCAL BUS', 'FX BUS', 'PERC BUS'],
    notes: [
      'Six buses plus 3–5 returns. Colour-code every track by group.',
      'Sub-group drums (kit / OH / room) if the kit alone is over 10 tracks.',
      'Freeze or commit virtual instruments before the mix.',
      'Expect 8–16 dB of gain reduction distributed across the session, never concentrated in one bus.',
    ],
  },
  {
    id: 'large',
    name: 'Large session',
    tracks: '64 – 150+ tracks',
    count: 96,
    label: 'FULL PRODUCTION / ORCHESTRAL',
    color: '#FF4D4D',
    description:
      'Film scoring, orchestral work, or a dense pop production with stacked harmonies and layered synths. Organisation is the actual skill here — the mix is a by-product of it.',
    buses: [
      'DRUM BUS',
      'BASS BUS',
      'MUSIC BUS',
      'VOCAL BUS',
      'FX BUS',
      'PERC BUS',
      'SUB-BUSES',
    ],
    notes: [
      'Two levels of sub-grouping: tracks → sub-bus → group bus → mix bus. Never three levels of insert processing per channel.',
      'Track equivalents / bounce-downs are mandatory — a 150-track session with 60 live plugins will not stay in sync.',
      'Consider committing audio across the mix so the session opens in seconds.',
      'Set a mix bus ceiling of -6 dBFS and verify nothing downstream is adding gain.',
    ],
  },
]

export interface EctsRow {
  stage: string
  contact: number
  independent: number
  assignment: number
  note: string
}

export const ectsRows: EctsRow[] = [
  {
    stage: 'Recording & Capture',
    contact: 12,
    independent: 20,
    assignment: 18,
    note: 'Mic technique, gain staging, room treatment and signal flow — practised heavily in the lab.',
  },
  {
    stage: 'Editing & Production',
    contact: 10,
    independent: 24,
    assignment: 16,
    note: 'Timing, pitch, comping and arrangement. The most self-directed stage — most of the hours are solo DAW time.',
  },
  {
    stage: 'Mixing',
    contact: 14,
    independent: 34,
    assignment: 22,
    note: 'Balance, buses, automation and translation. Highest total workload: listening is slow work.',
  },
  {
    stage: 'Pre-Master & Delivery',
    contact: 6,
    independent: 12,
    assignment: 10,
    note: 'Bouncing, stem delivery, documentation. Short stage, but errors here are expensive downstream.',
  },
  {
    stage: 'Mastering',
    contact: 12,
    independent: 28,
    assignment: 20,
    note: 'Loudness, dynamics, tonal balance and delivery specifications across platforms.',
  },
]

export const ectsNotes = [
  '1 ECTS is conventionally taken as 25–30 hours of total student workload. Both figures are shown throughout so you can apply whichever your institution uses.',
  'ECTS measures workload, not ability or achievement. Ten hours spent struggling with one EQ move counts exactly the same as ten fluent ones.',
  'These are planning estimates for a full module, not a promise. Studio time is genuinely slow — critically listening to a mix twenty times takes the hours it takes.',
  'Contact hours usually cover demonstration; the independent hours are where the skill actually develops. Budget for them from the start.',
  'Your institution\'s published module descriptor always takes precedence over any figure on this page.',
]
