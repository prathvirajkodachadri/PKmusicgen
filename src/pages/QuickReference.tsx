import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, X } from 'lucide-react'
import { quickRef, principles, type RefItem } from '../data/quickref'
import { platformTargets } from '../data/measurements'
import { Item, RackUnit, SectionHeader, Stagger } from '../components/ui'

const toneColor = { safe: '#35E08A', caution: '#F5A524', clip: '#FF4D4D' } as const

export default function QuickReference() {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()

  const filtered = useMemo(
    () =>
      quickRef
        .map((g) => ({
          ...g,
          items: query
            ? g.items.filter((i) =>
                `${i.item} ${i.value} ${i.unit} ${i.note}`.toLowerCase().includes(query),
              )
            : g.items,
        }))
        .filter((g) => g.items.length > 0),
    [query],
  )

  const count = filtered.reduce((a, g) => a + g.items.length, 0)

  return (
    <div className="py-14 sm:py-20">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <Link
          to="/"
          className="legend inline-flex items-center gap-2 text-[9.5px] text-legend-dim transition-colors hover:text-amber"
        >
          <ArrowLeft size={12} /> Back to the field guide
        </Link>

        <div className="mt-6">
          <SectionHeader
            eyebrow="Quick reference · desk card"
            title="Every number, one screen"
            subtitle="Built to sit beside your DAW. Search a value, a stage or an instrument — the results stay grouped so you can see the number in context."
          />
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-legend-dim"
              aria-hidden="true"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search:  LUFS, headroom, drums, vocal, ECTS, true peak…"
              aria-label="Search the quick reference"
              className="panel-input h-12 w-full rounded-[3px] pr-24 pl-10 text-[14px] placeholder:text-legend-dim"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5 rounded-[2px] border border-etch px-2 py-1 text-[10px] text-legend transition-colors hover:border-amber hover:text-amber"
              >
                <X size={10} /> Clear
              </button>
            )}
          </div>
          <p className="mono mt-2.5 text-[10.5px] tracking-[0.05em] text-legend-dim" aria-live="polite">
            {count} {count === 1 ? 'entry' : 'entries'} shown
          </p>
        </div>

        {/* Groups */}
        {filtered.length === 0 ? (
          <RackUnit className="p-10 text-center">
            <p className="num text-[15px] text-ink">Nothing matches “{q}”.</p>
            <p className="mt-2 text-[12.5px] text-legend-dim">
              Try a number (“-6”), a stage (“mastering”), or an instrument (“bass”).
            </p>
          </RackUnit>
        ) : (
          <Stagger className="space-y-6">
            {filtered.map((g) => (
              <Item key={g.id}>
                <RackUnit className="overflow-hidden">
                  <div
                    className="relative z-10 h-[2px] w-full"
                    style={{ background: `linear-gradient(90deg, ${g.color}, transparent 65%)` }}
                    aria-hidden="true"
                  />
                  <div className="relative z-10 p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-[7px] w-[7px] rounded-full"
                        style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }}
                        aria-hidden="true"
                      />
                      <h2 className="num text-[16px] font-bold tracking-[-0.01em] text-ink">
                        {g.title}
                      </h2>
                      <span className="mono ml-auto text-[10px] text-legend-dim">
                        {g.items.length}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-x-8 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
                      {g.items.map((i: RefItem) => (
                        <div
                          key={i.item}
                          className="group flex items-baseline gap-3 border-b border-etch/50 py-2.5 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] leading-snug text-ink">{i.item}</p>
                            <p className="mt-0.5 text-[11px] leading-snug text-legend-dim">
                              {i.note}
                            </p>
                          </div>
                          <span
                            className="num shrink-0 text-right text-[14px] leading-none font-bold tabular-nums"
                            style={{ color: toneColor[i.tone] }}
                          >
                            {i.value}
                            <span className="mono mt-1 block text-[9px] font-normal text-legend-dim">
                              {i.unit}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </RackUnit>
              </Item>
            ))}
          </Stagger>
        )}

        {/* Platform strip */}
        {!query && (
          <div className="mt-12">
            <div className="mb-4 flex items-center gap-3">
              <span className="legend">Platform delivery targets</span>
              <span className="hairline h-px flex-1" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {platformTargets.map((p) => (
                <RackUnit key={p.platform} className="p-4">
                  <div className="relative z-10">
                    <p className="num text-[13px] font-semibold text-ink">{p.platform}</p>
                    <p className="num mt-2 text-[20px] leading-none font-bold tabular-nums text-amber">
                      {p.lufs}
                    </p>
                    <p className="num mt-1.5 text-[13px] leading-none font-semibold tabular-nums text-clip">
                      {p.tp}
                    </p>
                    <p className="mt-3 text-[11px] leading-relaxed text-legend-dim">
                      {p.behaviour}
                    </p>
                  </div>
                </RackUnit>
              ))}
            </div>
          </div>
        )}

        {/* Principles */}
        {!query && (
          <div className="mt-12">
            <div className="mb-4 flex items-center gap-3">
              <span className="legend">The six principles that do not bend</span>
              <span className="hairline h-px flex-1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {principles.map((p) => (
                <RackUnit key={p.n} className="p-5">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="num text-[20px] leading-none font-bold text-amber/35 tabular-nums">
                        {p.n}
                      </span>
                      <h3 className="num text-[14px] leading-tight font-semibold text-ink">{p.t}</h3>
                    </div>
                    <p className="mt-3 text-[12.5px] leading-relaxed text-legend">{p.d}</p>
                  </div>
                </RackUnit>
              ))}
            </div>
          </div>
        )}

        <p className="mt-12 max-w-[85ch] text-[12.5px] leading-relaxed text-legend-dim">
          <span className="text-amber">Reminder:</span> these are calibration anchors drawn from
          common professional practice and current published platform documentation. Actual levels
          vary with source material, genre, DAW metering, converter calibration, plug-in behaviour,
          monitoring environment and artistic intent. Measure, listen, and decide.
        </p>
      </div>
    </div>
  )
}
