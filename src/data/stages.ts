export type StageId = 'record' | 'edit' | 'mix' | 'premaster' | 'master'

export interface LevelRow {
  parameter: string
  target: string
  note: string
  tone: 'safe' | 'caution' | 'clip'
}

export interface Stage {
  id: StageId
  index: number
  name: string
  tagline: string
  purpose: string
  targetRange: string
  targetLabel: string
  tracks: string
  headroom: string
  rows: LevelRow[]
  gainStage: string[]
  checklist: string[]
  pitfalls: string[]
  monitoring: string
}

export const stages: Stage[] = [
  {
    id: 'record',
    index: 1,
    name: 'Recording / Capture',
    tagline: 'Get it right at the source',
    purpose:
      'Capture the performance with maximum signal-to-noise ratio and zero clipping. Nothing later in the chain can repair a distorted preamp, a saturated converter or a performance that was played badly.',
    targetRange: '-18 → -6',
    targetLabel: 'dBFS peak',
    tracks: '1–32',
    headroom: 'min. 6 dB below 0 dBFS',
    rows: [
      { parameter: 'Peak level (typical)', target: '-12 to -6 dBFS', note: 'Aim for the loudest transient of the take.', tone: 'safe' },
      { parameter: 'Peak level (loud sources)', target: '-6 to -3 dBFS', note: 'Drums, brass, screaming vocals — set for the worst moment, not the average.', tone: 'caution' },
      { parameter: 'Peak level (quiet sources)', target: '-18 to -12 dBFS', note: 'Vocals between phrases, room mics, whispered takes.', tone: 'safe' },
      { parameter: 'Absolute ceiling', target: '-0.1 dBFS', note: 'Never touch 0. A single red flash means re-take or re-stage gain.', tone: 'clip' },
      { parameter: 'A/D converter sweet spot', target: 'around -18 dBFS', note: 'Many converters are calibrated so -18 dBFS RMS equals their reference level. Track near it, not far above.', tone: 'safe' },
      { parameter: 'Noise floor', target: '<-70 dBFS', note: 'Room, preamp and cable hiss. Raise source level or improve the room rather than adding gain later.', tone: 'safe' },
      { parameter: 'Monitoring level', target: '~79–83 dB SPL C-weighted', note: 'Calibrate your monitors once and leave the faders alone. Balance is judged relative to a fixed reference.', tone: 'safe' },
    ],
    gainStage: [
      'Set the preamp (or interface gain) so the loudest passage of the performance peaks around -12 dBFS. Do not touch the DAW input fader.',
      'Leave the DAW channel fader at unity (0 dB). Use the preamp — it is before the converter and is the only gain that improves signal-to-noise.',
      'Do not rely on "it can be fixed in the mix". Digital clipping is already baked into the file.',
      'Set up an input monitoring path with plugins bypassed so you hear the true capture, not a low-latency illusion.',
      'Record a reference take at performance level, then check it against a -18 dBFS test tone to confirm your metering is honest.',
    ],
    checklist: [
      'Input gain set for the loudest moment of the performance',
      'No clipping on any take — check the peak readout, not just the meter colours',
      'Sample rate and bit depth chosen and correct for the project',
      'Phantom power off before connecting/disconnecting condensers',
      'Room noise, HVAC and fridge switched off or gated out',
      'Safety take captured before moving on',
    ],
    pitfalls: [
      'Tracking too hot because "louder equals better quality". It does not — it equals less headroom and more clipping risk.',
      'Relying on a limiter on the input bus. It hides the problem and permanently changes the transient shape.',
      'Mixing with the monitoring level at wildly different volumes between sessions. Your balance will not translate.',
    ],
    monitoring:
      'Calibrate once at roughly 79–83 dB SPL (C-weighted pink noise at -20 dBFS). Write the fader position down. Every balance decision you make is relative to that fixed volume.',
  },
  {
    id: 'edit',
    index: 2,
    name: 'Editing / Production',
    tagline: 'Structure, timing and preparation',
    purpose:
      'Fix timing and pitch, arrange, comp the best takes, clean up noise, and build a session you can actually navigate. This is where track count usually grows — and where organisation stops being optional.',
    targetRange: '-6 → -3',
    targetLabel: 'dBFS peak per region',
    tracks: '8–96',
    headroom: 'unchanged from capture',
    rows: [
      { parameter: 'Region peak level', target: 'unchanged from capture', note: 'Editing is not a gain stage. Do not normalise regions on the way through.', tone: 'safe' },
      { parameter: 'Clip gain / region gain', target: '-6 to +6 dB', note: 'Small corrective moves only. More than that means the take should have been tracked differently.', tone: 'caution' },
      { parameter: 'Crossfade length', target: '2–20 ms', note: 'Short enough to hide the edit, long enough to avoid a click.', tone: 'safe' },
      { parameter: 'De-noise reduction', target: '6–12 dB', note: 'More starts to sound watery and destroys the room tone.', tone: 'caution' },
      { parameter: 'Temp mix bus level', target: '-6 to -3 dBFS peak', note: 'Set it once here and do not touch it again. Everything after assumes this.', tone: 'safe' },
      { parameter: 'Vocal comp lead-in/lead-out', target: '200–500 ms', note: 'Enough context for breaths and reverb tails to sound natural.', tone: 'safe' },
    ],
    gainStage: [
      'Do not normalise every region to 0 dBFS. Normalising is a level change, not a quality change, and it wrecks relative balance.',
      'Use clip gain for ride-ups and ride-downs *before* the channel strip, so plugins receive a consistent level.',
      'Bounce a rough mix with the mix bus at -6 dBFS peak and listen for arrangement problems — this is far cheaper to fix than with EQ later.',
      'Name and colour every track. Colour-code by group (drums / bass / music / vocals / FX) so the mixer reads at a glance.',
      'Freeze or commit CPU-heavy instruments before the mix stage so latency and buffer problems disappear.',
    ],
    checklist: [
      'Best takes comped; alternatives muted but not deleted',
      'Timing and pitch corrected where needed, taste applied',
      'Noise, clicks and headphone bleed removed',
      'Tracks named, coloured and grouped consistently',
      'Tempo map and any click/timing edits final',
      'Session saved, consolidated and backed up to two places',
    ],
    pitfalls: [
      'Over-editing until the performance loses its feel and micro-timing that gave it life.',
      'Adding more and more tracks to compensate for an arrangement that has no space in it.',
      'Destructive editing without a version history.',
    ],
    monitoring:
      'Switch to a reference track at matched perceived loudness and A/B the arrangement. If yours sounds thinner, it is usually arrangement, not EQ.',
  },
  {
    id: 'mix',
    index: 3,
    name: 'Mixing',
    tagline: 'Balance, space and depth',
    purpose:
      'Turn a collection of tracks into one coherent piece: relative levels, frequency placement, stereo image, depth, and movement. The single most important technical constraint is leaving headroom for mastering.',
    targetRange: '-12 → -6',
    targetLabel: 'dBFS mix peak',
    tracks: '16–120',
    headroom: '6–10 dB below 0 dBFS',
    rows: [
      { parameter: 'Mix bus peak', target: '-6 to -3 dBFS', note: 'The classic, safe starting point. Aim for peaks here, not averages.', tone: 'safe' },
      { parameter: 'Mix bus RMS / LUFS-S', target: '-18 to -14 LUFS-S', note: 'Rough loudness anchor. Not a target — a sanity check.', tone: 'safe' },
      { parameter: 'Individual track peaks', target: '-12 to -6 dBFS', note: 'Leaves room for fader moves and plugin headroom in both directions.', tone: 'safe' },
      { parameter: 'Plugin input levels', target: '-18 to -12 dBFS', note: 'Analogue-modeled plugins are designed around this region. Push far above it and their behaviour changes.', tone: 'caution' },
      { parameter: 'Kick peak', target: '-8 to -3 dBFS', note: 'Often the loudest single transient in the mix. Do not clip it.', tone: 'caution' },
      { parameter: 'Vocal peak', target: '-10 to -4 dBFS', note: 'Lead vocal usually sits at or near the top of the level stack.', tone: 'safe' },
      { parameter: 'Master fader', target: 'leave at 0 dB', note: 'Use it for the final trim only. If it is compensating for something, fix the something.', tone: 'clip' },
      { parameter: 'Ambience / FX returns', target: '-20 to -12 dBFS', note: 'Most reverb is far quieter in the mix than it feels when soloed.', tone: 'safe' },
    ],
    gainStage: [
      'Start every fader at -infinity and bring tracks up, never down from unity. Mixing upward makes balance decisions easier to hear.',
      'Aim for roughly -6 dBFS peak on the mix bus and stop adjusting there. Resist the urge to "just push it a bit".',
      'Use a gain-trim plugin at the top of every channel strip so level is set before EQ and compression, not after.',
      'Insert a loudness meter on the mix bus and leave it there. Check integrated LUFS, but make decisions with your ears.',
      'Use a reference track: match perceived loudness before comparing, or the louder one will always sound better.',
      'Automation is a gain stage too. Ride the vocal and the FX returns rather than stacking more compression.',
    ],
    checklist: [
      'Mix bus peaking between -6 and -3 dBFS with no limiter engaged',
      'Gain staging consistent: plugins seeing sensible input levels',
      'Group buses doing broad balance work (drums / bass / music / vocals / FX)',
      'Mono compatibility checked — nothing essential disappears',
      'Low end controlled: nothing below ~40 Hz except the intended sub',
      'Automation passes written for vocal, FX and section dynamics',
      'Reference A/B at matched loudness confirms the balance translates',
    ],
    pitfalls: [
      'Mixing into a limiter so you can hear it "finished". It hides every balance error and cannot be undone.',
      'Committing bus compression before the balance is right — then re-balancing faders against the compressor and losing the plot.',
      'Solo-button ear: solving problems in solo that do not exist in context.',
    ],
    monitoring:
      'Check on at least three systems: your mains, headphones, and a small speaker or phone. If the balance only works on your mains, it is not a mix yet.',
  },
  {
    id: 'premaster',
    index: 4,
    name: 'Mix Bus / Pre-Master',
    tagline: 'The handover point',
    purpose:
      'The final clean, uncoloured bounce of the mix with proper headroom, plus all the stems and metadata a mastering engineer needs. Get this wrong and mastering becomes a rescue operation.',
    targetRange: '-6 → -1',
    targetLabel: 'dBFS peak',
    tracks: '6–12 stems',
    headroom: 'min. -6 dBFS peak',
    rows: [
      { parameter: 'Pre-master peak', target: '-6 to -3 dBFS', note: 'The universally safe handover level. When in doubt, this.', tone: 'safe' },
      { parameter: 'Pre-master LUFS-I', target: '-18 to -14 LUFS-I', note: 'If it arrives already at -8 LUFS, there is nothing left to master.', tone: 'caution' },
      { parameter: 'True peak', target: '≤ -3 dBTP', note: 'Leaves the mastering engineer limiter headroom to work with.', tone: 'safe' },
      { parameter: 'Mixer master fader', target: '0 dB', note: 'Send at unity with the mix bus trimmed, not with a negative master fader.', tone: 'caution' },
      { parameter: 'Mix bus processing', target: 'off / minimal', note: 'No limiter, no loudness maximiser, no heavy bus compression unless agreed.', tone: 'clip' },
      { parameter: 'DC offset', target: '<0.1%', note: 'Check it. Offset eats headroom silently and reduces limiter effectiveness.', tone: 'safe' },
      { parameter: 'Dither / word length', target: 'none applied at this stage', note: 'Dither is the mastering engineer\'s decision, applied once at the very end.', tone: 'safe' },
      { parameter: 'Deliverable', target: '24-bit WAV, session sample rate', note: 'Plus stems, a reference, and a one-page note of what you did.', tone: 'safe' },
    ],
    gainStage: [
      'Bounce the mix through a neutral master bus. If you must keep mix bus glue, state it clearly in the handover notes.',
      'Trim the mix bus — not the master fader — to land around -6 dBFS peak. Some DAWs sum the master fader post-bounce and it will silently reintroduce the level.',
      'Send the mastering engineer a reference: what you balanced against, and the rough loudness you were working at.',
      'Provide stems (drums / bass / music / vocals / FX) as well as the full mix. They are often worth more than a mix note.',
      'Label every file with artist, track, version and date. Unlabelled files cause real, avoidable mistakes.',
    ],
    checklist: [
      'Peak between -6 and -3 dBFS, true peak at or below -3 dBTP',
      'No limiter or maximiser on the master bus',
      'Integrated LUFS roughly -18 to -14',
      'Stems exported at identical length and start time',
      'File names, sample rate and bit depth documented',
      'Second set of ears has approved the balance',
    ],
    pitfalls: [
      'Bouncing at 0 dBFS peak and calling it "loud enough". There is no room left to master.',
      'Applying dither twice, or applying it here and again at mastering.',
      'Sending only a MP3 as the source. Always send a lossless bounce.',
    ],
    monitoring:
      'One last full listen at your calibrated level, then one pass on headphones and one on a phone speaker. Anything that survives all three is ready to send.',
  },
  {
    id: 'master',
    index: 5,
    name: 'Mastering',
    tagline: 'Final polish and delivery',
    purpose:
      'Tonal balance, dynamics, glue and level — brought to a specification that works across every playback system and streaming platform. Mastering is a delivery job first and a creative job second.',
    targetRange: '-14 → -8',
    targetLabel: 'LUFS integrated',
    tracks: '1–8',
    headroom: '-1.0 dBTP ceiling',
    rows: [
      { parameter: 'Integrated loudness (streaming)', target: '-14 LUFS-I', note: 'The centre of the Spotify / TIDAL / Amazon / YouTube cluster.', tone: 'safe' },
      { parameter: 'Integrated loudness (Apple)', target: '-16 LUFS-I', note: 'Apple Sound Check references -16. Publish at -14 and it simply gets turned down.', tone: 'safe' },
      { parameter: 'Short-term loudness range', target: '-10 to -16 LUFS-S', note: 'Watch the loudest section, not just the whole-song average.', tone: 'caution' },
      { parameter: 'True peak ceiling', target: '-1.0 dBTP', note: 'Non-negotiable for streaming. Use -2 dBTP if your master is louder than -14 LUFS.', tone: 'caution' },
      { parameter: 'Absolute ceiling', target: '-0.1 dBFS', note: 'Sample peak must never touch 0.', tone: 'clip' },
      { parameter: 'Loudness range (LRA)', target: '4–10 LU', note: 'Under 4 sounds squashed; over 12 means quiet sections disappear in a car or gym.', tone: 'safe' },
      { parameter: 'Dynamic range (PLR)', target: '≥ 8 dB', note: 'Programme loudness range: integrated loudness minus true peak. Below ~6 it sounds fatiguing.', tone: 'caution' },
      { parameter: 'Master file', target: '16-bit / 44.1 kHz WAV or 320 kbps MP3', note: 'Dither down from 24-bit exactly once, at the final conversion.', tone: 'safe' },
      { parameter: 'Album sequencing gap', target: '2–4 s between tracks', note: 'Or seamless, if the record is continuous. Decide deliberately.', tone: 'safe' },
    ],
    gainStage: [
      'Trim the incoming pre-master to a comfortable working level, then set your limiter ceiling to -1 dBTP before touching any drive control.',
      'Work in small moves: 0.5–1.5 dB of broad EQ either side of the mids, 1–3 dB of gentle compression at 1.5:1–2:1 ratio.',
      'Raise level with a limiter only after the tonal balance is right. Loudness changes perceived balance and will mislead you mid-process.',
      'Check loudness on the integrated meter and let it settle — the gated measurement needs the whole song to be honest.',
      'A/B against a commercial reference at matched loudness, then at different loudness. If it only works at one, keep going.',
      'Final dither: 16-bit only if you are delivering 16-bit. Never dither a 24-bit deliverable.',
    ],
    checklist: [
      'Integrated LUFS matched to the intended destination',
      'True peak at or below the platform ceiling',
      'Tonally balanced against a genre-appropriate reference',
      'Mono and small-speaker checks passed',
      'Album sequencing and spacing decided',
      'All deliverable formats exported, named and archived',
    ],
    pitfalls: [
      'Chasing -8 LUFS because it is louder than the reference. You will hear the compression, not the loudness.',
      'Mastering a mix that arrives with no headroom — the limiter is doing the mixing.',
      'Mastering in a poorly treated room or on uncalibrated headphones and making tonal decisions you cannot trust.',
    ],
    monitoring:
      'Level-match everything. Mastering decisions made at unmatched volume are decisions about loudness, not about sound.',
  },
]

export const workflow = [
  { id: 'record', label: 'REC', name: 'Recording', value: '-12 dBFS pk', color: '#35E08A' },
  { id: 'edit', label: 'EDT', name: 'Editing', value: 'unchanged', color: '#8BC34A' },
  { id: 'mix', label: 'MIX', name: 'Mixing', value: '-6 dBFS pk', color: '#F5A524' },
  { id: 'premaster', label: 'PRE', name: 'Pre-Master', value: '-3 dBTP', color: '#FF7A45' },
  { id: 'master', label: 'MST', name: 'Mastering', value: '-14 LUFS-I', color: '#FF4D4D' },
] as const
