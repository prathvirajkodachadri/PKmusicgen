export interface RefItem {
  item: string
  value: string
  unit: string
  note: string
  tone: 'safe' | 'caution' | 'clip'
}

export interface RefGroup {
  id: string
  title: string
  color: string
  items: RefItem[]
}

export const quickRef: RefGroup[] = [
  {
    id: 'recording',
    title: 'Recording & capture',
    color: '#35E08A',
    items: [
      { item: 'Typical peak level', value: '-12 to -6', unit: 'dBFS', note: 'Set on the loudest moment of the performance.', tone: 'safe' },
      { item: 'Loud sources (drums, brass)', value: '-6 to -3', unit: 'dBFS', note: 'Set for the worst moment, not the average.', tone: 'caution' },
      { item: 'Quiet sources (vocal, room)', value: '-18 to -12', unit: 'dBFS', note: 'Raise source level, not the DAW fader.', tone: 'safe' },
      { item: 'Absolute ceiling', value: '-0.1', unit: 'dBFS', note: 'Never touch 0. One red flash = re-stage gain.', tone: 'clip' },
      { item: 'Converter reference point', value: '≈ -18', unit: 'dBFS', note: 'Common calibration: -18 dBFS RMS = reference level.', tone: 'safe' },
      { item: 'Noise floor', value: '<-70', unit: 'dBFS', note: 'Fix at the source. Do not apply noise reduction later.', tone: 'safe' },
      { item: 'Monitor calibration', value: '79–83', unit: 'dB SPL', note: 'Pink noise at -20 dBFS, C-weighted. Set once.', tone: 'safe' },
    ],
  },
  {
    id: 'mixing',
    title: 'Mixing & mix bus',
    color: '#F5A524',
    items: [
      { item: 'Mix bus peak', value: '-6 to -3', unit: 'dBFS', note: 'The single most important number on this page.', tone: 'safe' },
      { item: 'Mix loudness (sanity check)', value: '-18 to -14', unit: 'LUFS-S', note: 'An anchor, not a target.', tone: 'safe' },
      { item: 'Individual track peaks', value: '-12 to -6', unit: 'dBFS', note: 'Fader room in both directions.', tone: 'safe' },
      { item: 'Plugin input levels', value: '-18 to -12', unit: 'dBFS', note: 'Where analogue-modeled plugins expect to be.', tone: 'safe' },
      { item: 'Kick peak', value: '-8 to -3', unit: 'dBFS', note: 'Usually the loudest transient in the mix.', tone: 'caution' },
      { item: 'Lead vocal peak', value: '-10 to -4', unit: 'dBFS', note: 'Ride it, do not just compress it.', tone: 'safe' },
      { item: 'FX / reverb returns', value: '-20 to -12', unit: 'dBFS', note: 'Far quieter than they sound when soloed.', tone: 'safe' },
      { item: 'Master fader', value: '0', unit: 'dB', note: 'Leave it. Trim the mix bus instead.', tone: 'clip' },
      { item: 'Bus compression (glue)', value: '2–4', unit: 'dB GR', note: 'Slow attack so transients survive.', tone: 'safe' },
    ],
  },
  {
    id: 'premaster',
    title: 'Pre-master handover',
    color: '#FF7A45',
    items: [
      { item: 'Peak level', value: '-6 to -3', unit: 'dBFS', note: 'The universally safe delivery level.', tone: 'safe' },
      { item: 'Integrated loudness', value: '-18 to -14', unit: 'LUFS-I', note: 'If it arrives at -8 LUFS there is nothing to master.', tone: 'caution' },
      { item: 'True peak', value: '≤ -3', unit: 'dBTP', note: 'Leaves limiter headroom for the mastering engineer.', tone: 'safe' },
      { item: 'DC offset', value: '< 0.1', unit: '%', note: 'Silently eats headroom.', tone: 'safe' },
      { item: 'File format', value: '24-bit', unit: 'WAV', note: 'Session sample rate. Plus stems, plus a reference.', tone: 'safe' },
      { item: 'Dither', value: 'none', unit: '—', note: 'Mastering applies it once at the final conversion.', tone: 'safe' },
      { item: 'Mix bus limiter', value: 'off', unit: '—', note: 'Unless explicitly agreed with the mastering engineer.', tone: 'clip' },
    ],
  },
  {
    id: 'mastering',
    title: 'Mastering & delivery',
    color: '#FF4D4D',
    items: [
      { item: 'Integrated loudness (streaming)', value: '-14', unit: 'LUFS-I', note: 'Spotify / TIDAL / Amazon / YouTube cluster.', tone: 'safe' },
      { item: 'Integrated loudness (Apple)', value: '-16', unit: 'LUFS-I', note: 'Sound Check reference level.', tone: 'safe' },
      { item: 'True peak ceiling', value: '-1.0', unit: 'dBTP', note: 'Use -2.0 if louder than -14 LUFS.', tone: 'caution' },
      { item: 'Sample peak ceiling', value: '-0.1', unit: 'dBFS', note: 'Never at or above 0.', tone: 'clip' },
      { item: 'Loudness range (LRA)', value: '4–10', unit: 'LU', note: '<4 sounds squashed, >12 disappears in a car.', tone: 'safe' },
      { item: 'Programme loudness range', value: '≥ 8', unit: 'dB', note: 'Peak minus integrated loudness. Below 6 is fatiguing.', tone: 'caution' },
      { item: 'Delivery file', value: '16-bit / 44.1k', unit: 'WAV', note: 'Or 320 kbps MP3. Dither exactly once.', tone: 'safe' },
      { item: 'Club / DJ master', value: '-7 to -9', unit: 'LUFS-I', note: 'A genuinely different destination.', tone: 'caution' },
      { item: 'Broadcast (EBU R128)', value: '-23', unit: 'LUFS-I', note: 'A regulated legal target, not a taste choice.', tone: 'safe' },
    ],
  },
  {
    id: 'headroom',
    title: 'Headroom & gain staging',
    color: '#8BC34A',
    items: [
      { item: 'Mix bus headroom', value: '≥ 6', unit: 'dB', note: 'Below 0 dBFS at every point in the mix.', tone: 'safe' },
      { item: 'Recording headroom', value: '≥ 6', unit: 'dB', note: 'Below 0 dBFS at the loudest transient.', tone: 'safe' },
      { item: 'Pre-master headroom', value: '≥ 6', unit: 'dB', note: 'Or -3 dBTP true peak, whichever is safer.', tone: 'safe' },
      { item: 'Clip gain correction range', value: '-6 to +6', unit: 'dB', note: 'Beyond this the take should have been tracked differently.', tone: 'caution' },
      { item: 'De-noise reduction', value: '6–12', unit: 'dB', note: 'More sounds watery and destroys room tone.', tone: 'caution' },
      { item: 'Reverb pre-delay', value: '20–80', unit: 'ms', note: 'Protects the source transient.', tone: 'safe' },
      { item: 'Crossfade length', value: '2–20', unit: 'ms', note: 'Hides the edit, avoids the click.', tone: 'safe' },
    ],
  },
  {
    id: 'tracks',
    title: 'Track counts & routing',
    color: '#4DD0E1',
    items: [
      { item: 'Small session', value: '8–20', unit: 'tracks', note: '4 buses + 2–3 FX returns.', tone: 'safe' },
      { item: 'Medium session', value: '24–56', unit: 'tracks', note: '6 buses + 3–5 returns. Colour-code every track.', tone: 'safe' },
      { item: 'Large session', value: '64–150+', unit: 'tracks', note: 'Sub-grouping and bouncing mandatory.', tone: 'caution' },
      { item: 'Drum Kit', value: '6–14', unit: 'tracks', note: 'Sub-group if over 12.', tone: 'safe' },
      { item: 'Bass', value: '1–4', unit: 'tracks', note: 'DI / amp / synth.', tone: 'safe' },
      { item: 'Guitars', value: '2–14', unit: 'tracks', note: 'Feeds the GTR sub-bus → Music Bus.', tone: 'safe' },
      { item: 'Keyboards & synths', value: '2–20', unit: 'tracks', note: 'Feeds the KEY sub-bus → Music Bus.', tone: 'safe' },
      { item: 'Strings, brass & winds', value: '2–32', unit: 'tracks', note: 'Feeds the STR sub-bus → Music Bus.', tone: 'safe' },
      { item: 'Vocals', value: '2–24', unit: 'tracks', note: 'Lead / backing / stacks / ad-libs.', tone: 'safe' },
      { item: 'Percussion', value: '2–20', unit: 'tracks', note: 'High-pass aggressively at 80–120 Hz.', tone: 'safe' },
      { item: 'FX returns', value: '2–16', unit: 'tracks', note: 'High-pass 300–600 Hz, low-pass 8–12 kHz.', tone: 'safe' },
      { item: 'Music Bus total', value: '6–66', unit: 'tracks', note: 'GTR + KEY + STR sub-buses summed.', tone: 'safe' },
      { item: 'Grouping depth', value: '2 levels', unit: 'max', note: 'Tracks → group bus → mix bus. Add a third only over ~60 tracks.', tone: 'safe' },
      { item: 'Suggested buffer', value: '64–512', unit: 'samples', note: '64–128 small, 128–256 medium, 256–512 large.', tone: 'safe' },
    ],
  },
  {
    id: 'ects',
    title: 'ECTS workload',
    color: '#38BDF8',
    items: [
      { item: 'Workload convention', value: '25–30', unit: 'h / ECTS', note: 'An academic planning standard, not a rule.', tone: 'safe' },
      { item: 'Recording & capture', value: '50', unit: 'h', note: '12 contact · 20 independent · 18 assignment.', tone: 'safe' },
      { item: 'Editing & production', value: '50', unit: 'h', note: '10 contact · 24 independent · 16 assignment.', tone: 'safe' },
      { item: 'Mixing', value: '70', unit: 'h', note: '14 contact · 34 independent · 22 assignment. The heaviest stage.', tone: 'caution' },
      { item: 'Pre-master & delivery', value: '28', unit: 'h', note: '6 contact · 12 independent · 10 assignment.', tone: 'safe' },
      { item: 'Mastering', value: '60', unit: 'h', note: '12 contact · 28 independent · 20 assignment.', tone: 'safe' },
      { item: 'Full module total', value: '258', unit: 'h', note: '≈ 8.6–10.3 ECTS depending on the hour assumption.', tone: 'safe' },
    ],
  },
]

export const principles = [
  {
    n: '01',
    t: 'Set the reference first',
    d: 'Pick one anchor — usually kick and lead vocal — and place everything else against it. Without a reference, every level decision is relative to nothing.',
  },
  {
    n: '02',
    t: 'Gain stage before you process',
    d: 'Trim the input to a plugin before reaching for its threshold. Analogue-modeled processors are designed around roughly -18 dBFS and behave differently outside it.',
  },
  {
    n: '03',
    t: 'Protect the ceiling, protect the mix',
    d: 'A mix that arrives at the mastering stage with 6 dB of headroom can be finished. One that arrives at 0.5 dB can only be rescued.',
  },
  {
    n: '04',
    t: 'Balance is arrangement, not EQ',
    d: 'If a vocal will not sit, the music bed is usually too loud in the verse. Fix it by moving parts, not by adding 3 kHz.',
  },
  {
    n: '05',
    t: 'Calibrate the room, then forget the volume',
    d: 'Set your monitoring level once at 79–83 dB SPL and never change it. Every balance decision is only meaningful at a fixed listening level.',
  },
  {
    n: '06',
    t: 'Check mono, check small speakers',
    d: 'A mix that only works on your mains is not finished. Anything essential must survive mono and a phone speaker.',
  },
]
