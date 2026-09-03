import { useMemo, useState } from 'react'
import { BookOpen, Info } from 'lucide-react'
import { ectsNotes, ectsRows } from '../data/groups'
import { Item, RackUnit, SectionHeader, Stagger } from './ui'

const HOURS_PER_ECTS = [25, 30] as const

function Cell({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="bg-unit px-4 py-3.5">
      <p className="legend text-[8.5px]">{label}</p>
      <p
        className="num mt-1.5 text-[20px] leading-none font-bold tabular-nums"
        style={{ color }}
      >
        {value}
        <span className="mono ml-1 text-[9.5px] font-normal text-legend-dim">h</span>
      </p>
    </div>
  )
}

export default function Ects() {
  const [contact, setContact] = useState(14)
  const [independent, setIndependent] = useState(34)
  const [assignment, setAssignment] = useState(22)

  const total = contact + independent + assignment

  const moduleTotals = useMemo(
    () =>
      ectsRows.reduce(
        (acc, r) => ({
          contact: acc.contact + r.contact,
          independent: acc.independent + r.independent,
          assignment: acc.assignment + r.assignment,
        }),
        { contact: 0, independent: 0, assignment: 0 },
      ),
    [],
  )
  const moduleTotal =
    moduleTotals.contact + moduleTotals.independent + moduleTotals.assignment

  const split = [
    { k: 'Contact', v: contact, c: '#38BDF8' },
    { k: 'Independent', v: independent, c: '#7DD3FC' },
    { k: 'Assignment', v: assignment, c: '#BAE6FD' },
  ]

  return (
    <section id="ects" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Section 08 · Academic workload"
          title="ECTS workload by stage"
          accent="#38BDF8"
          subtitle="The European Credit Transfer and Accumulating System measures student workload, not attendance. 1 ECTS is conventionally taken as 25–30 hours of total work, which is why this whole section shows both figures side by side."
        />

        <div className="mb-8 flex items-start gap-3 rounded-[2px] border border-ects/25 bg-ects/[0.06] p-4">
          <Info size={15} className="mt-[2px] shrink-0 text-ects" aria-hidden="true" />
          <p className="text-[13px] leading-relaxed text-ink">
            <span className="font-medium text-ects">Planning guideline, not a rule.</span> The 25–30
            hour convention is an academic planning standard used to make programmes comparable
            across institutions. It is not a measure of ability, and your institution's published
            module descriptor always takes precedence over any figure on this page.
          </p>
        </div>

        <Stagger className="grid gap-5 lg:grid-cols-5">
          {/* Per-stage table */}
          <Item className="lg:col-span-3">
            <RackUnit className="h-full overflow-hidden">
              <div className="relative z-10 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-etch">
                      <th className="legend px-5 py-3.5 text-[9px]">Stage</th>
                      <th className="legend px-3 py-3.5 text-right text-[9px] text-ects">Contact</th>
                      <th className="legend px-3 py-3.5 text-right text-[9px] text-ects">Independent</th>
                      <th className="legend px-3 py-3.5 text-right text-[9px] text-ects">Project</th>
                      <th className="legend px-5 py-3.5 text-right text-[9px]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ectsRows.map((r, i) => {
                      const t = r.contact + r.independent + r.assignment
                      return (
                        <tr
                          key={r.stage}
                          className={`border-b border-etch/60 last:border-0 ${
                            i % 2 ? 'bg-black/15' : ''
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <p className="text-[13px] font-medium text-ink">{r.stage}</p>
                            <p className="mt-1 max-w-[34ch] text-[11.5px] leading-snug text-legend-dim">
                              {r.note}
                            </p>
                          </td>
                          <td className="num px-3 py-3.5 text-right text-[13px] tabular-nums text-ink">
                            {r.contact}
                          </td>
                          <td className="num px-3 py-3.5 text-right text-[13px] tabular-nums text-ink">
                            {r.independent}
                          </td>
                          <td className="num px-3 py-3.5 text-right text-[13px] tabular-nums text-ink">
                            {r.assignment}
                          </td>
                          <td className="num px-5 py-3.5 text-right text-[13px] font-semibold tabular-nums text-ects">
                            {t} h
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="border-t border-etch bg-ects/[0.05]">
                      <td className="legend px-5 py-3.5 text-[9px]">Module total</td>
                      <td className="num px-3 py-3.5 text-right text-[13px] font-semibold tabular-nums text-ink">
                        {moduleTotals.contact}
                      </td>
                      <td className="num px-3 py-3.5 text-right text-[13px] font-semibold tabular-nums text-ink">
                        {moduleTotals.independent}
                      </td>
                      <td className="num px-3 py-3.5 text-right text-[13px] font-semibold tabular-nums text-ink">
                        {moduleTotals.assignment}
                      </td>
                      <td className="num px-5 py-3.5 text-right text-[13px] font-bold tabular-nums text-ects">
                        {moduleTotal} h
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="border-t border-etch px-5 py-4">
                  <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                    <span className="legend text-[9px]">Module workload</span>
                    {HOURS_PER_ECTS.map((h) => (
                      <span key={h} className="flex items-baseline gap-2">
                        <span className="mono text-[11px] text-legend-dim">@ {h} h / ECTS</span>
                        <span className="num text-[22px] leading-none font-bold tabular-nums text-ects">
                          {(moduleTotal / h).toFixed(1)}
                        </span>
                        <span className="mono text-[10px] text-legend-dim">ECTS</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </RackUnit>
          </Item>

          {/* Calculator */}
          <Item className="lg:col-span-2">
            <RackUnit className="h-full p-5 sm:p-6">
              <div className="relative z-10">
                <div className="flex items-center gap-2.5">
                  <BookOpen size={14} className="text-ects" aria-hidden="true" />
                  <span className="legend text-[9px] text-ects">ECTS workload calculator</span>
                </div>
                <p className="mt-3 text-[12.5px] leading-relaxed text-legend">
                  Estimate the workload for your own assignment. Enter hours honestly — studio work is
                  slower than it looks on a timetable.
                </p>

                <div className="mt-5 space-y-4">
                  {(
                    [
                      ['Contact / practical hours', contact, setContact, '#38BDF8'],
                      ['Independent study hours', independent, setIndependent, '#7DD3FC'],
                      ['Assignment / project hours', assignment, setAssignment, '#BAE6FD'],
                    ] as const
                  ).map(([label, val, set, c]) => (
                    <label key={label} className="block">
                      <span className="mb-2 flex items-baseline justify-between">
                        <span className="legend text-[9px]">{label}</span>
                        <span className="num text-[13px] font-semibold tabular-nums" style={{ color: c }}>
                          {val} h
                        </span>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={120}
                        step={1}
                        value={val}
                        onChange={(e) => set(Number(e.target.value))}
                        aria-label={label}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#12161a] accent-[#38BDF8] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ects"
                      />
                    </label>
                  ))}
                </div>

                {/* Split bar */}
                <div className="mt-6">
                  <p className="legend mb-2 text-[9px]">Workload split</p>
                  <div className="flex h-[9px] w-full overflow-hidden rounded-full bg-[#12161a]">
                    {split.map((s) => (
                      <span
                        key={s.k}
                        className="h-full transition-[width] duration-300 ease-out"
                        style={{ width: `${total ? (s.v / total) * 100 : 0}%`, background: s.c }}
                        title={`${s.k}: ${s.v} h`}
                      />
                    ))}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                    {split.map((s) => (
                      <span key={s.k} className="flex items-center gap-1.5">
                        <span
                          className="h-[6px] w-[6px] rounded-full"
                          style={{ background: s.c }}
                          aria-hidden="true"
                        />
                        <span className="mono text-[10px] text-legend-dim">
                          {s.k} {total ? Math.round((s.v / total) * 100) : 0}%
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Results */}
                <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-etch bg-etch">
                  <Cell label="Total workload" value={total} color="#E6E9EC" />
                  <div className="bg-unit px-4 py-3.5">
                    <p className="legend text-[8.5px]">ECTS range</p>
                    <p className="num mt-1.5 text-[20px] leading-none font-bold tabular-nums text-ects">
                      {(total / 30).toFixed(1)}
                      <span className="mx-1 text-legend-dim">–</span>
                      {(total / 25).toFixed(1)}
                    </p>
                    <p className="mono mt-1 text-[9px] text-legend-dim">25–30 h assumption</p>
                  </div>
                  <div className="col-span-2 bg-unit px-4 py-3.5">
                    <p className="legend text-[8.5px]">At 25 h per ECTS (upper bound)</p>
                    <p className="num mt-1.5 text-[26px] leading-none font-bold tabular-nums text-ects">
                      {(total / 25).toFixed(2)}
                      <span className="mono ml-1.5 text-[10px] font-normal text-legend-dim">ECTS</span>
                    </p>
                  </div>
                  <div className="col-span-2 bg-unit px-4 py-3.5">
                    <p className="legend text-[8.5px]">At 30 h per ECTS (lower bound)</p>
                    <p className="num mt-1.5 text-[26px] leading-none font-bold tabular-nums text-ects">
                      {(total / 30).toFixed(2)}
                      <span className="mono ml-1.5 text-[10px] font-normal text-legend-dim">ECTS</span>
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[11.5px] leading-relaxed text-legend-dim">
                  Independent study is deliberately the largest slice in a production module. Listening,
                  iterating and re-listening cannot be compressed, and most of the learning happens
                  there rather than in supervised lab time.
                </p>
              </div>
            </RackUnit>
          </Item>
        </Stagger>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ectsNotes.slice(0, 3).map((n, i) => (
            <Item key={i}>
              <div className="h-full rounded-[2px] border border-etch bg-unit/60 p-4">
                <p className="mono text-[10px] text-ects">0{i + 1}</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-legend">{n}</p>
              </div>
            </Item>
          ))}
        </div>
      </div>
    </section>
  )
}
