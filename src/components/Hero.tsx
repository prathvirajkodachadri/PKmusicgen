import { motion } from 'framer-motion'
import { ArrowDown, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { workflow } from '../data/stages'
import { Item, Stagger } from './ui'

export default function Hero() {
  const go = (id: string) => {
    const el = document.getElementById(`stage-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="relative overflow-hidden border-b border-etch">
      {/* Machine-room texture, deliberately at texture-weight not photo-weight */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <img
          src="/images/rack-hero.jpg"
          alt=""
          className="h-full w-full object-cover object-center opacity-[0.28]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b0d0f_0%,rgba(11,13,15,0.86)_42%,rgba(11,13,15,0.96)_78%,#0b0d0f_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_22%,rgba(245,165,36,0.14),transparent_58%)]" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20">
        <Stagger>
          <Item>
            <div className="flex flex-wrap items-center gap-3">
              <span className="legend rounded-[2px] border border-etch bg-unit/70 px-2.5 py-1.5 text-legend">
                Audio Engineering Reference
              </span>
              <span className="mono text-[10.5px] tracking-[0.08em] text-legend-dim">
                v2.6 · BS.1770 / EBU R128
              </span>
            </div>
          </Item>

          <Item>
            <h1 className="num mt-7 max-w-[19ch] text-[clamp(2.6rem,8vw,5.6rem)] leading-[0.93] font-bold tracking-[-0.035em] text-ink">
              Every level in
              <br />
              the session has a
              <span className="relative ml-3 inline-block text-amber">
                reason.
                <svg
                  className="absolute -bottom-2 left-0 h-[10px] w-full"
                  viewBox="0 0 200 10"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 7 Q 50 1 100 5 T 198 4"
                    fill="none"
                    stroke="#F5A524"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                </svg>
              </span>
            </h1>
          </Item>

          <Item>
            <p className="mt-9 max-w-[62ch] text-[16px] leading-[1.7] text-legend sm:text-[17px]">
              A working reference for recommended dB levels, headroom, track counts and ECTS workload
              across the whole production chain — from the first microphone to the final streaming
              deliverable. Every figure is a documented starting point calibrated to current platform
              specifications.{' '}
              <span className="text-ink">None of them are universal rules.</span>
            </p>
          </Item>

          <Item>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#workflow"
                className="group inline-flex items-center gap-2 rounded-[3px] border border-amber/50 bg-amber/12 px-5 py-3 text-[13px] font-medium text-amber transition-colors hover:bg-amber/20"
              >
                Open the workflow
                <ArrowDown size={14} className="transition-transform group-hover:translate-y-0.5" />
              </a>
              <Link
                to="/quick-reference"
                className="inline-flex items-center gap-2 rounded-[3px] border border-etch bg-unit px-5 py-3 text-[13px] font-medium text-ink transition-colors hover:border-legend-dim"
              >
                Quick reference card
                <ExternalLink size={13} className="text-legend-dim" />
              </Link>
            </div>
          </Item>
        </Stagger>

        {/* ---------------- Meter bridge: the workflow dashboard ---------------- */}
        <div id="workflow" className="mt-16 scroll-mt-24 sm:mt-20">
          <div className="mb-4 flex items-center gap-3">
            <span className="legend">Signal chain · 5 stages</span>
            <span className="hairline h-px flex-1" />
            <span className="mono hidden text-[10px] tracking-[0.08em] text-legend-dim sm:block">
              0 dBFS = ABSOLUTE CEILING
            </span>
          </div>

          <div className="rack rounded-[3px] p-1.5">
            <div className="relative z-10 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
              {workflow.map((s, i) => (
                <motion.button
                  key={s.id}
                  type="button"
                  onClick={() => go(s.id)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative overflow-hidden rounded-[2px] border border-etch bg-[linear-gradient(180deg,#1b2026,#141819)] px-4 py-4 text-left transition-colors hover:border-[color:var(--c)] sm:px-5 sm:py-5"
                  style={{ ['--c' as string]: s.color }}
                >
                  <span
                    className="absolute top-0 left-0 h-[2px] w-full origin-left scale-x-[0.16] transition-transform duration-500 group-hover:scale-x-100"
                    style={{ background: s.color }}
                    aria-hidden="true"
                  />

                  <div className="flex items-center justify-between">
                    <span className="legend text-[9.5px]" style={{ color: s.color }}>
                      {s.label}
                    </span>
                    <span
                      className="h-[5px] w-[5px] rounded-full opacity-70 transition-opacity group-hover:opacity-100"
                      style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="num mt-3 text-[15px] leading-tight font-semibold text-ink">{s.name}</p>

                  {/* mini level meter per stage */}
                  <div className="mt-4 flex gap-[2px]" aria-hidden="true">
                    {Array.from({ length: 14 }, (_, k) => {
                      const on = k < 14 - i * 2 - 2
                      return (
                        <span
                          key={k}
                          className="h-2 flex-1 rounded-[1px]"
                          style={{ background: on ? s.color : '#1d2227', opacity: on ? 0.85 : 1 }}
                        />
                      )
                    })}
                  </div>

                  <p className="mono mt-3 text-[12px] font-medium tabular-nums" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-[10.5px] tracking-[0.04em] text-legend-dim">
                    {s.id === 'record'
                      ? 'track this level'
                      : s.id === 'edit'
                        ? 'no gain change'
                        : s.id === 'mix'
                          ? 'bus peak'
                          : s.id === 'premaster'
                            ? 'true peak ceiling'
                            : 'delivery target'}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>

          <p className="mono mt-4 text-[11px] leading-relaxed tracking-[0.03em] text-legend-dim">
            ↑ Each stage hands the next one a specific level. Break the chain and the following stage
            inherits the problem.
          </p>
        </div>
      </div>
    </section>
  )
}
