import { Link } from 'react-router-dom'
import { ArrowRight, SlidersHorizontal } from 'lucide-react'
import { sessionSizes } from '../data/groups'
import { Item, RackUnit, SectionHeader, Stagger } from './ui'

export default function SessionPlanner() {
  return (
    <section id="sessions" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Section 05 · Session architecture"
          title="Small, medium and large sessions"
          subtitle="Track count changes the job. A 14-track acoustic demo and a 120-track production need different routing depth, different buffering, and a different attitude toward bouncing and committing audio."
        />

        <Stagger className="grid gap-5 lg:grid-cols-3">
          {sessionSizes.map((s) => (
            <Item key={s.id}>
              <RackUnit className="h-full p-5 sm:p-6">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="legend text-[9px]" style={{ color: s.color }}>
                      {s.label}
                    </span>
                    <span
                      className="h-[6px] w-[6px] rounded-full"
                      style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="num mt-3 text-[19px] font-bold text-ink">{s.name}</h3>
                  <p
                    className="num mt-1 text-[26px] leading-none font-bold tabular-nums"
                    style={{ color: s.color }}
                  >
                    {s.tracks}
                  </p>
                  <p className="mt-3.5 text-[12.5px] leading-relaxed text-legend">
                    {s.description}
                  </p>

                  <p className="legend mt-5 text-[9px]">Buses</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.buses.map((b) => (
                      <span
                        key={b}
                        className="mono rounded-[2px] border border-etch bg-black/25 px-2 py-1 text-[9.5px] tracking-[0.05em] text-legend"
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  <ul className="mt-5 space-y-1.5 border-t border-etch/70 pt-4">
                    {s.notes.map((n) => (
                      <li key={n} className="flex gap-2 text-[12px] leading-relaxed text-legend-dim">
                        <span
                          className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full"
                          style={{ background: s.color }}
                        />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              </RackUnit>
            </Item>
          ))}
        </Stagger>

        {/* CTA into the full planner */}
        <div className="mt-10">
          <RackUnit className="overflow-hidden">
            <div className="relative z-10 flex flex-col items-start gap-6 p-6 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-[62ch]">
                <span className="legend flex items-center gap-2 text-amber">
                  <SlidersHorizontal size={12} /> Interactive tool
                </span>
                <h3 className="num mt-4 text-[clamp(1.4rem,3.2vw,2.05rem)] leading-tight font-bold tracking-[-0.02em] text-ink">
                  Plan your own session, track by track.
                </h3>
                <p className="mt-3.5 text-[13.5px] leading-relaxed text-legend">
                  The full Track & Group Planner builds a live session structure from whatever you
                  feed it: a visual mixer with channel strips, meters and faders, buses that appear
                  and re-target themselves as tracks are added, custom groups you can create and
                  reassign tracks into, and warnings when the cumulative level, headroom or
                  complexity is likely to become a problem.
                </p>
              </div>
              <Link
                to="/planner"
                className="group inline-flex shrink-0 items-center gap-2.5 rounded-[3px] border border-amber/50 bg-amber/12 px-6 py-3.5 text-[13.5px] font-medium text-amber transition-colors hover:bg-amber/22"
              >
                Open the planner
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </RackUnit>
        </div>
      </div>
    </section>
  )
}
