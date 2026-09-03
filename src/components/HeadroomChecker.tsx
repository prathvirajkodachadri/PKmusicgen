import { useMemo, useState } from 'react'
import { CircleCheck, CircleAlert, TriangleAlert } from 'lucide-react'
import { RackUnit, SectionHeader, SegmentedMeter, Tip } from './ui'

const TARGETS = [
  { id: 'stream', label: 'Streaming (Spotify / TIDAL)', lufs: -14, tp: -1 },
  { id: 'apple', label: 'Apple Music (Sound Check)', lufs: -16, tp: -1 },
  { id: 'loud', label: 'Loud club / DJ master', lufs: -8, tp: -0.3 },
  { id: 'podcast', label: 'Podcast / spoken word', lufs: -16, tp: -1 },
  { id: 'broadcast', label: 'Broadcast (EBU R128)', lufs: -23, tp: -1 },
  { id: 'premaster', label: 'Pre-master handover', lufs: -16, tp: -3 },
]

type Level = 'ok' | 'warn' | 'fail'

interface Finding {
  level: Level
  title: string
  body: string
}

export default function HeadroomChecker() {
  const [peak, setPeak] = useState(-5.4)
  const [lufs, setLufs] = useState(-11.2)
  const [tp, setTp] = useState(-0.6)
  const [targetId, setTargetId] = useState('stream')

  const target = TARGETS.find((t) => t.id === targetId)!

  const { findings, verdict, crest, headroom } = useMemo(() => {
    const list: Finding[] = []
    const headroom = -peak
    const crest = lufs - tp

    if (peak > -0.1) {
      list.push({
        level: 'fail',
        title: 'Sample peak is clipping',
        body: `Peak reads ${peak.toFixed(1)} dBFS. Digital full scale is the ceiling — anything at or above 0 dBFS is already distorted. Trim the mix bus before anything else.`,
      })
    } else if (peak > -1) {
      list.push({
        level: 'warn',
        title: 'Almost no sample headroom',
        body: `Only ${headroom.toFixed(1)} dB below full scale. Any fader move, plugin overshoot or summing coincidence will clip. Aim for at least 3 dB.`,
      })
    } else if (peak < -12) {
      list.push({
        level: 'warn',
        title: 'Unusually quiet peak',
        body: `Peak sits ${headroom.toFixed(1)} dB below full scale. That is safe, but if the material is meant to feel dense you are probably leaving level on the table.`,
      })
    } else {
      list.push({
        level: 'ok',
        title: `Healthy headroom: ${headroom.toFixed(1)} dB`,
        body: 'The mix bus has room to move in both directions and the mastering limiter has somewhere to work. This is the right zone for a pre-master.',
      })
    }

    if (tp > target.tp) {
      list.push({
        level: tp > target.tp + 1.2 ? 'fail' : 'warn',
        title: `True peak ${target.tp - tp > 0 ? (target.tp - tp).toFixed(1) + ' dB over' : 'at'} the ceiling`,
        body: `Measured ${tp.toFixed(1)} dBTP against a ${target.tp.toFixed(1)} dBTP target. Inter-sample peaks will push this into distortion after lossy encoding. Lower the limiter ceiling — do not just turn the output down if the ceiling itself is set high.`,
      })
    } else {
      list.push({
        level: 'ok',
        title: `True peak is safe: ${tp.toFixed(1)} dBTP`,
        body: `${(target.tp - tp).toFixed(1)} dB below the ${target.tp.toFixed(1)} dBTP ceiling. Lossy codecs and D/A conversion will not clip this.`,
      })
    }

    const delta = lufs - target.lufs
    if (Math.abs(delta) <= 1.5) {
      list.push({
        level: 'ok',
        title: `Loudness is on target: ${lufs.toFixed(1)} LUFS-I`,
        body: `Within ${(Math.abs(delta)).toFixed(1)} LU of the ${target.lufs} LUFS target. Streaming normalisation will barely touch this.`,
      })
    } else if (delta > 0) {
      list.push({
        level: delta > 5 ? 'fail' : 'warn',
        title: `Loudness is ${delta.toFixed(1)} LU above target`,
        body: `At ${lufs.toFixed(1)} LUFS-I against ${target.lufs}, the platform will turn this down by about ${delta.toFixed(1)} dB. You gain nothing and lose dynamics — the limiters will be audible for no benefit.`,
      })
    } else {
      list.push({
        level: delta < -8 ? 'fail' : 'warn',
        title: `Loudness is ${Math.abs(delta).toFixed(1)} LU below target`,
        body: `At ${lufs.toFixed(1)} LUFS-I against ${target.lufs}. Platforms that only attenuate will leave this noticeably quieter than everything else. Note that Spotify does turn quiet material up, while YouTube does not.`,
      })
    }

    if (crest < 5) {
      list.push({
        level: 'fail',
        title: `Crest factor is only ${crest.toFixed(1)} dB`,
        body: 'Peak and loudness are almost the same number — the material is heavily limited. Expect fatigue and a flat, small-speaker translation. Back the limiter off and re-balance.',
      })
    } else if (crest < 8) {
      list.push({
        level: 'warn',
        title: `Crest factor is tight: ${crest.toFixed(1)} dB`,
        body: 'Programme loudness range is on the low side. Usable for dense electronic material, but most genres start to sound squashed below about 8 dB.',
      })
    } else {
      list.push({
        level: 'ok',
        title: `Crest factor is healthy: ${crest.toFixed(1)} dB`,
        body: 'Transients still read above the average. This will translate across systems rather than only sounding right on your monitors.',
      })
    }

    const fails = list.filter((f) => f.level === 'fail').length
    const warns = list.filter((f) => f.level === 'warn').length
    return {
      findings: list,
      verdict: fails ? 'fail' : warns ? 'warn' : 'ok',
      crest,
      headroom,
    }
  }, [peak, lufs, tp, target])

  const verdictMeta = {
    ok: { icon: CircleCheck, color: '#35E08A', text: 'Ready to deliver' },
    warn: { icon: TriangleAlert, color: '#F5A524', text: 'Adjust before delivery' },
    fail: { icon: CircleAlert, color: '#FF4D4D', text: 'Will not deliver cleanly' },
  }[verdict as Level]
  const VIcon = verdictMeta.icon

  const field = (
    label: string,
    value: number,
    set: (v: number) => void,
    unit: string,
    min: number,
    max: number,
    color: string,
  ) => (
    <label className="block">
      <span className="legend mb-2 block text-[9px]">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          value={value}
          min={min}
          max={max}
          onChange={(e) => set(Number(e.target.value) || 0)}
          className="panel-input h-10 w-full rounded-[2px] px-3 text-[15px] tabular-nums"
          style={{ color }}
        />
        <span className="mono shrink-0 text-[11px] text-legend-dim">{unit}</span>
      </span>
    </label>
  )

  return (
    <section id="headroom" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Section 07 · Interactive tool"
          title="Headroom & delivery checker"
          subtitle="Enter the three numbers your meter shows at the end of a mix. This returns a plain-English verdict on whether the material is ready to hand over — and what to change if it is not."
        />

        <RackUnit className="p-5 sm:p-7">
          <div className="relative z-10 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="legend text-[9px]">Measured values</span>
                <Tip
                  text="Read peak from your mix bus meter, integrated LUFS from a BS.1770 loudness meter over the whole song, and true peak from a true-peak meter (not a sample-peak meter)."
                />
                <span className="hairline h-px flex-1" />
              </div>
              <div className="space-y-4">
                {field('Sample peak', peak, setPeak, 'dBFS', -60, 6, '#35E08A')}
                {field('Integrated loudness', lufs, setLufs, 'LUFS-I', -60, 0, '#F5A524')}
                {field('True peak', tp, setTp, 'dBTP', -60, 6, '#FF7A45')}
              </div>

              <label className="mt-5 block">
                <span className="legend mb-2 block text-[9px]">Destination</span>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="panel-input h-10 w-full rounded-[2px] px-3 text-[13px]"
                >
                  {TARGETS.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0e1215]">
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-[2px] border border-etch bg-etch">
                {[
                  { k: 'Headroom', v: `${headroom.toFixed(1)}`, u: 'dB' },
                  { k: 'Crest', v: `${crest.toFixed(1)}`, u: 'dB' },
                  { k: 'Target', v: `${target.lufs}`, u: 'LUFS' },
                ].map((s) => (
                  <div key={s.k} className="bg-unit px-3 py-3">
                    <p className="legend text-[8px]">{s.k}</p>
                    <p className="num mt-1 text-[16px] leading-none font-semibold tabular-nums text-ink">
                      {s.v}
                      <span className="mono ml-1 text-[9px] text-legend-dim">{s.u}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8" aria-live="polite">
              {/* Verdict */}
              <div
                className="rounded-[2px] border p-5"
                style={{ borderColor: `${verdictMeta.color}55`, background: `${verdictMeta.color}10` }}
              >
                <div className="flex items-center gap-3">
                  <VIcon size={20} style={{ color: verdictMeta.color }} aria-hidden="true" />
                  <p
                    className="num text-[19px] leading-tight font-bold"
                    style={{ color: verdictMeta.color }}
                  >
                    {verdictMeta.text}
                  </p>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11.5px] text-legend">Sample peak</span>
                      <span className="num text-[12.5px] font-semibold tabular-nums text-signal">
                        {peak.toFixed(1)} dBFS
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <SegmentedMeter segments={26} min={-40} max={0} value={peak} label="Sample peak" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11.5px] text-legend">True peak</span>
                      <span className="num text-[12.5px] font-semibold tabular-nums text-amber">
                        {tp.toFixed(1)} dBTP
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <SegmentedMeter segments={26} min={-40} max={0} value={tp} label="True peak" />
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11.5px] text-legend">
                      Integrated loudness — target {target.lufs} LUFS
                    </span>
                    <span className="num text-[12.5px] font-semibold tabular-nums text-amber">
                      {lufs.toFixed(1)} LUFS-I
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <SegmentedMeter
                      segments={40}
                      min={-40}
                      max={0}
                      value={lufs}
                      label="Integrated loudness"
                    />
                  </div>
                  <div className="relative mt-1 h-3">
                    <span
                      className="absolute -translate-x-1/2 text-[9px] text-amber"
                      style={{ left: `${Math.min(100, Math.max(0, ((target.lufs + 40) / 40) * 100))}%` }}
                      aria-hidden="true"
                    >
                      ▼
                    </span>
                  </div>
                </div>
              </div>

              {/* Findings */}
              <ul className="mt-4 space-y-2.5">
                {findings.map((f) => {
                  const c = f.level === 'ok' ? '#35E08A' : f.level === 'warn' ? '#F5A524' : '#FF4D4D'
                  const I = f.level === 'ok' ? CircleCheck : f.level === 'warn' ? TriangleAlert : CircleAlert
                  return (
                    <li
                      key={f.title}
                      className="flex gap-3 rounded-[2px] border bg-black/25 p-3.5"
                      style={{ borderColor: `${c}33` }}
                    >
                      <I size={14} className="mt-[2px] shrink-0" style={{ color: c }} aria-hidden="true" />
                      <div>
                        <p className="text-[13px] font-medium text-ink">{f.title}</p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-legend">{f.body}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </RackUnit>

        <p className="mt-5 max-w-[82ch] text-[12.5px] leading-relaxed text-legend-dim">
          This tool applies commonly cited professional practice to your numbers. It does not account
          for genre conventions that deliberately sit outside these ranges, nor for material destined
          for a medium with its own regulated specification. When in doubt, check the destination's
          published documentation before a commercial release.
        </p>
      </div>
    </section>
  )
}
