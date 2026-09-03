import { AlertTriangle, Check, Radio } from 'lucide-react'
import { stages, type Stage } from '../data/stages'
import { Item, LevelBar, RackUnit, SectionHeader, Stagger, Tip } from './ui'


function StageRow({ stage }: { stage: Stage }) {
  const accent = ['#35E08A', '#8BC34A', '#F5A524', '#FF7A45', '#FF4D4D'][stage.index - 1]

  return (
    <Item className="scroll-mt-24" >
      <RackUnit id={`stage-${stage.id}`} className="overflow-hidden scroll-mt-24">
        {/* Left LED status rail */}
        <div className="relative z-10 flex flex-col lg:flex-row">
          <div
            className="flex shrink-0 items-center gap-4 border-b border-etch px-5 py-4 lg:w-[62px] lg:flex-col lg:justify-between lg:border-r lg:border-b-0 lg:px-0 lg:py-6"
            style={{ background: `linear-gradient(180deg, ${accent}12, transparent 70%)` }}
          >
            <span
              className="num text-[26px] leading-none font-bold tabular-nums lg:text-[32px]"
              style={{ color: accent }}
            >
              {String(stage.index).padStart(2, '0')}
            </span>
            <span
              className="h-[7px] w-[7px] shrink-0 rounded-full"
              style={{ background: accent, boxShadow: `0 0 9px ${accent}` }}
              aria-hidden="true"
            />
            <span className="vertical-legend legend hidden text-[8.5px] text-legend-dim lg:block">
              {stage.id.toUpperCase()}
            </span>
          </div>

          <div className="min-w-0 flex-1 p-5 sm:p-7">
            {/* Header */}
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h3 className="num text-[clamp(1.4rem,3vw,2rem)] leading-tight font-bold tracking-[-0.02em] text-ink">
                {stage.name}
              </h3>
              <span className="legend text-[9px]" style={{ color: accent }}>
                {stage.tagline}
              </span>
            </div>
            <p className="mt-3.5 max-w-[74ch] text-[14px] leading-[1.75] text-legend">
              {stage.purpose}
            </p>

            {/* Spec strip */}
            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-etch bg-etch sm:grid-cols-4">
              {[
                { k: 'Primary target', v: stage.targetRange, u: stage.targetLabel, c: accent },
                { k: 'Typical track count', v: stage.tracks, u: 'tracks', c: '#E6E9EC' },
                { k: 'Headroom required', v: stage.headroom.split(' ').slice(0, 2).join(' '), u: stage.headroom.split(' ').slice(2).join(' '), c: '#E6E9EC' },
                { k: 'Stage role', v: stage.id === 'record' ? 'CAPTURE' : stage.id === 'edit' ? 'PREPARE' : stage.id === 'mix' ? 'CREATE' : stage.id === 'premaster' ? 'HANDOVER' : 'DELIVER', u: 'function', c: '#E6E9EC' },
              ].map((s) => (
                <div key={s.k} className="bg-unit px-3.5 py-3.5">
                  <p className="legend text-[8.5px]">{s.k}</p>
                  <p
                    className="num mt-1.5 text-[17px] leading-none font-semibold tabular-nums"
                    style={{ color: s.c }}
                  >
                    {s.v}
                  </p>
                  <p className="mono mt-1 text-[9.5px] tracking-[0.04em] text-legend-dim">{s.u}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 grid gap-7 lg:grid-cols-12">
              {/* Left: targets */}
              <div className="lg:col-span-5">
                <div className="mb-3.5 flex items-center gap-2">
                  <span className="legend text-[9px]">Target levels</span>
                  <Tip
                    text="Ranges are drawn from common professional practice. Where your source material, genre or converter chain differs, the range that matters is the one your meters and ears agree on."
                  />
                  <span className="hairline h-px flex-1" />
                </div>
                <div className="space-y-4">
                  {stage.rows.map((r) => (
                    <LevelBar
                      key={r.parameter}
                      label={r.parameter}
                      value={r.target}
                      tone={r.tone}
                      note={r.note}
                      unit={r.target.includes('LUFS') || r.target.includes('SPL') ? '' : 'dB'}
                    />
                  ))}
                </div>
              </div>

              {/* Right: guidance */}
              <div className="space-y-6 lg:col-span-7">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="legend text-[9px]">Gain staging procedure</span>
                    <span className="hairline h-px flex-1" />
                  </div>
                  <ol className="space-y-2.5">
                    {stage.gainStage.map((g, i) => (
                      <li key={i} className="flex gap-3">
                        <span
                          className="num mt-[3px] shrink-0 text-[10px] font-semibold tabular-nums"
                          style={{ color: accent }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[12.5px] leading-relaxed text-ink">{g}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="legend text-[9px]">Stage checklist</span>
                    <span className="hairline h-px flex-1" />
                  </div>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {stage.checklist.map((c) => (
                      <li
                        key={c}
                        className="flex items-start gap-2 rounded-[2px] border border-etch/70 bg-black/20 px-2.5 py-2"
                      >
                        <Check
                          size={12}
                          strokeWidth={3}
                          className="mt-[3px] shrink-0 text-signal"
                          aria-hidden="true"
                        />
                        <span className="text-[12px] leading-snug text-legend">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[2px] border border-clip/30 bg-clip/[0.06] p-4">
                  <p className="flex items-center gap-2">
                    <AlertTriangle size={12} className="text-clip" aria-hidden="true" />
                    <span className="legend text-[9px] text-clip">Common failures</span>
                  </p>
                  <ul className="mt-2.5 space-y-1.5">
                    {stage.pitfalls.map((p) => (
                      <li key={p} className="flex gap-2 text-[12.5px] leading-relaxed text-ink">
                        <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-clip" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3 rounded-[2px] border border-etch bg-black/25 p-4">
                  <Radio size={14} className="mt-[2px] shrink-0 text-amber" aria-hidden="true" />
                  <div>
                    <p className="legend text-[9px] text-amber">Monitoring</p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink">{stage.monitoring}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RackUnit>
    </Item>
  )
}

export default function StageSections() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Section 02 · Stage by stage"
          title="The five stages, with their numbers"
          subtitle="Each stage hands the next one a specific level and a specific set of problems. These are working ranges used across professional practice — check them, calibrate to them, then move past them deliberately."
        />
        <Stagger className="space-y-6">
          {stages.map((s) => (
            <StageRow key={s.id} stage={s} />
          ))}
        </Stagger>

        <p className="mt-8 max-w-[80ch] text-[12.5px] leading-relaxed text-legend-dim">
          <span className="text-amber">Context note:</span> all of the figures above shift with source
          material, genre conventions, DAW metering ballistics, converter calibration, plug-in
          headroom modelling and artistic intent. A club single and a chamber string quartet share
          almost no numbers — but they share every principle on this page.
        </p>
      </div>
    </section>
  )
}
