import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { groups } from '../data/groups'
import { Item, LevelBar, NotRule, RackUnit, SectionHeader, Stagger, Tip } from './ui'

export default function GroupGuidance() {
  const [active, setActive] = useState(groups[0].id)
  const g = groups.find((x) => x.id === active)!

  return (
    <section id="groups" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Section 04 · Instrument groups"
          title="Level relationships, not level rules"
          subtitle="No instrument has a correct dB value. Every instrument has a correct relationship to the things around it. These ranges describe where elements commonly sit relative to a reference — usually the kick and the lead vocal — and why."
        />

        <div className="mb-5 flex items-center gap-3">
          <NotRule>starting points, tuned per song</NotRule>
          <span className="hairline h-px flex-1" />
          <Tip
            text="A rock ballad and a techno track will place snare, bass and vocal at completely different relative levels. What transfers is the method: pick a reference, set it first, then place everything else against it by ear."
          />
        </div>

        {/* Tab strip — colour coded by group */}
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Instrument groups">
          {groups.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={x.id === active}
              onClick={() => setActive(x.id)}
              className={`group relative overflow-hidden rounded-[2px] border px-3.5 py-2.5 text-left transition-colors ${
                x.id === active ? 'border-[color:var(--c)] bg-unit-2' : 'border-etch bg-unit hover:border-legend-dim'
              }`}
              style={{ ['--c' as string]: x.color }}
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-[6px] w-[6px] rounded-full"
                  style={{ background: x.color, opacity: x.id === active ? 1 : 0.45 }}
                  aria-hidden="true"
                />
                <span
                  className="num text-[12.5px] font-semibold"
                  style={{ color: x.id === active ? x.color : '#E6E9EC' }}
                >
                  {x.name}
                </span>
              </span>
              <span className="mono mt-0.5 block text-[9.5px] text-legend-dim">{x.bus}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mt-5"
          >
            <RackUnit className="overflow-hidden">
              <div
                className="relative z-10 h-[2px] w-full"
                style={{ background: `linear-gradient(90deg, ${g.color}, transparent 70%)` }}
                aria-hidden="true"
              />
              <div className="relative z-10 p-5 sm:p-7">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className="num text-[clamp(1.3rem,2.6vw,1.75rem)] font-bold tracking-[-0.02em] text-ink">
                    {g.name}
                  </h3>
                  <span className="mono text-[10.5px] tracking-[0.08em]" style={{ color: g.color }}>
                    {g.bus}
                  </span>
                  <span className="mono ml-auto text-[10.5px] text-legend-dim">
                    {g.tracks} tracks
                  </span>
                </div>
                <p className="mt-3 max-w-[76ch] text-[13.5px] leading-relaxed text-legend">
                  {g.anchor}
                </p>
                <p className="mono mt-3 text-[11px] leading-relaxed text-signal">{g.routing}</p>

                <div className="mt-7 grid gap-7 lg:grid-cols-12">
                  <div className="lg:col-span-6">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="legend text-[9px]">Relative level relationships</span>
                      <span className="hairline h-px flex-1" />
                    </div>
                    <div className="space-y-4">
                      {g.relationships.map((r) => (
                        <LevelBar
                          key={r.element}
                          label={r.element}
                          value={r.value}
                          note={r.note}
                          tone={r.value.includes('reference') ? 'caution' : 'safe'}
                          unit=""
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 lg:col-span-6">
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="legend text-[9px]">Processing approach</span>
                        <span className="hairline h-px flex-1" />
                      </div>
                      <ul className="space-y-2">
                        {g.processing.map((p) => (
                          <li key={p} className="flex gap-2.5">
                            <span
                              className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full"
                              style={{ background: g.color }}
                            />
                            <span className="text-[12.5px] leading-relaxed text-ink">{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-[2px] border border-clip/25 bg-clip/[0.05] p-4">
                      <p className="legend text-[9px] text-clip">Where this goes wrong</p>
                      <ul className="mt-2.5 space-y-2">
                        {g.commonMistakes.map((m) => (
                          <li key={m} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink">
                            <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-clip" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </RackUnit>
          </motion.div>
        </AnimatePresence>

        {/* ---------- Master relationship summary ---------- */}
        <div className="mt-14">
          <div className="mb-5 flex items-center gap-3">
            <span className="legend">All groups at a glance</span>
            <span className="hairline h-px flex-1" />
          </div>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((x) => (
              <Item key={x.id}>
                <RackUnit className="h-full p-5">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="num text-[14px] font-semibold text-ink">{x.name}</span>
                      <span className="mono text-[10px]" style={{ color: x.color }}>
                        {x.tracks}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2.5">
                      {x.relationships.slice(0, 3).map((r) => (
                        <div key={r.element}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[11.5px] text-legend">{r.element}</span>
                            <span
                              className="mono shrink-0 text-[10.5px] font-medium"
                              style={{ color: x.color }}
                            >
                              {r.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActive(x.id)
                        document.getElementById('groups')?.scrollIntoView({ block: 'start' })
                      }}
                      className="legend mt-5 w-full rounded-[2px] border border-etch bg-unit py-2 text-[9px] transition-colors hover:border-amber hover:text-amber"
                    >
                      Open {x.bus}
                    </button>
                  </div>
                </RackUnit>
              </Item>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  )
}
