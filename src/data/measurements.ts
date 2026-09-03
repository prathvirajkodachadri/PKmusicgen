export type MeterId = 'dbfs' | 'rms' | 'lufs' | 'tp'

export interface Measurement {
  id: MeterId
  name: string
  short: string
  unit: string
  what: string
  reads: string
  useWhen: string
  dontUseWhen: string
  color: string
}

export const measurements: Measurement[] = [
  {
    id: 'dbfs',
    name: 'Peak level (dBFS)',
    short: 'PEAK',
    unit: 'dBFS',
    what: 'The largest instantaneous sample value in a buffer. Digital full scale is 0 dBFS — the absolute ceiling. Anything above it has nowhere to go and becomes clipping.',
    reads: 'The single loudest moment, ignoring how often it happens.',
    useWhen:
      'Setting recording gain, checking for clipping, setting limiter ceilings, and confirming channel faders have room to move up or down.',
    dontUseWhen:
      'Judging how loud something *sounds*. A single kick transient can read -3 dBFS while the track feels quiet.',
    color: '#35E08A',
  },
  {
    id: 'rms',
    name: 'RMS (dB)',
    short: 'RMS',
    unit: 'dB',
    what: 'A time-averaged power measurement over a short window (commonly 100–300 ms). Closer to perceived loudness than peak, but it is not pitch or frequency weighted.',
    reads: 'Average energy, but skewed toward low frequencies because they carry more power.',
    useWhen:
      'Quick A/B comparison between similar material, gain-matching DI sources, and older-style mastering workflows.',
    dontUseWhen:
      'Delivering to streaming platforms, or comparing a bass-heavy mix against a vocal-heavy one.',
    color: '#8BC34A',
  },
  {
    id: 'lufs',
    name: 'Loudness (LUFS)',
    short: 'LUFS',
    unit: 'LUFS',
    what: 'ITU-R BS.1770 loudness: K-weighted, gated, and averaged over time. Three variants exist — momentary (400 ms), short-term (3 s), and integrated (whole programme).',
    reads: 'How loud the material actually feels to a human ear, across a whole song.',
    useWhen:
      'Matching against streaming platform targets, balancing sections, and mastering. Integrated LUFS is the delivery spec.',
    dontUseWhen:
      'Setting recording levels or protecting against clipping — it is far too slow to catch a transient.',
    color: '#F5A524',
  },
  {
    id: 'tp',
    name: 'True Peak (dBTP)',
    short: 'dBTP',
    unit: 'dBTP',
    what: 'Peak level measured on an oversampled reconstruction of the waveform, so it catches inter-sample peaks that a plain dBFS meter misses between sample points.',
    reads: 'The real analogue-domain ceiling after conversion or lossy encoding.',
    useWhen:
      'Final delivery. Every streaming platform specifies a true-peak ceiling, typically -1 dBTP.',
    dontUseWhen:
      'Everyday mixing decisions — it is a delivery spec, not a mixing tool.',
    color: '#FF7A45',
  },
]

export interface PlatformTarget {
  platform: string
  lufs: string
  tp: string
  behaviour: string
}

export const platformTargets: PlatformTarget[] = [
  {
    platform: 'Spotify',
    lufs: '-14 LUFS-I',
    tp: '-1.0 dBTP',
    behaviour:
      'Normalises both up and down. User can pick Loud (-11), Normal (-14) or Quiet (-19). If your master is louder than -14, Spotify asks for a -2 dBTP ceiling.',
  },
  {
    platform: 'Apple Music',
    lufs: '-16 LUFS-I',
    tp: '-1.0 dBTP',
    behaviour:
      'Sound Check uses metadata to playback around -16. Apple publishes -16 LKFS +/- 1 dB as its reference level for loudness-tagged content.',
  },
  {
    platform: 'YouTube / YT Music',
    lufs: '~-14 LUFS-I',
    tp: '-1.0 dBTP',
    behaviour:
      'Turns loud uploads down only — it does not boost quiet ones. YouTube publishes no official number; ~-14 is the measured behaviour.',
  },
  {
    platform: 'TIDAL',
    lufs: '-14 LUFS-I',
    tp: '-1.0 dBTP',
    behaviour: 'Normalisation is on by default but users can disable it, so dynamics survive either way.',
  },
  {
    platform: 'Amazon Music',
    lufs: '-14 LUFS-I',
    tp: '-1.0 dBTP',
    behaviour: 'Normalises to -14 LUFS by default with a user toggle to turn it off.',
  },
  {
    platform: 'Club / DJ play',
    lufs: '-7 to -9 LUFS-I',
    tp: '-0.3 dBTP',
    behaviour:
      'A genuinely different destination. Club masters are often delivered separately and louder, because the room and PA eat dynamic range.',
  },
  {
    platform: 'Broadcast (EBU R128)',
    lufs: '-23 LUFS-I',
    tp: '-1.0 dBTP',
    behaviour: 'A legal, regulated target — not a taste choice. Programme loudness must be maintained across the whole transmission.',
  },
  {
    platform: 'Podcast / spoken word',
    lufs: '-16 LUFS-I',
    tp: '-1.0 dBTP',
    behaviour: 'Apple and Spotify both reference -16 for spoken word. Keep consistent across episodes, not loud within one.',
  },
]
