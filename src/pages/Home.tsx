import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Hero from '../components/Hero'
import MeterLiteracy from '../components/MeterLiteracy'
import StageSections from '../components/StageSections'
import SignalFlow from '../components/SignalFlow'
import GroupGuidance from '../components/GroupGuidance'
import SessionPlanner from '../components/SessionPlanner'
import LevelScale from '../components/LevelScale'
import HeadroomChecker from '../components/HeadroomChecker'
import Ects from '../components/Ects'
import { principles } from '../data/quickref'
import { Item, RackUnit, SectionHeader, Stagger } from '../components/ui'

function Principles() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Section 09 · Principles"
          title="What actually matters, once the numbers are set"
          subtitle="Every dB value in this guide can be broken legitimately. These cannot. They are the transferable part — the thing that survives a different DAW, a different room and a different genre."
        />
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => (
            <Item key={p.n} className="h-full">
              <RackUnit className="h-full p-5">
                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-center gap-3">
                    <span className="num text-[22px] leading-none font-bold text-amber/35 tabular-nums">
                      {p.n}
                    </span>
                    <h3 className="num text-[14.5px] leading-tight font-semibold text-ink">{p.t}</h3>
                  </div>
                  <p className="mt-3.5 text-[12.5px] leading-relaxed text-legend">{p.d}</p>
                </div>
              </RackUnit>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="pb-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <RackUnit className="overflow-hidden">
          <div className="relative z-10 flex flex-col items-start gap-7 p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[60ch]">
              <span className="legend">Keep this open next to your DAW</span>
              <h3 className="num mt-4 text-[clamp(1.5rem,3.4vw,2.2rem)] leading-tight font-bold tracking-[-0.02em] text-ink">
                The quick reference card has every number on this site in one screen.
              </h3>
              <p className="mt-3.5 text-[13.5px] leading-relaxed text-legend">
                Peak levels, LUFS targets, headroom, track counts, grouping and ECTS workload —
                searchable, compact, and written to be read at a glance while you are working.
              </p>
            </div>
            <Link
              to="/quick-reference"
              className="group inline-flex shrink-0 items-center gap-2.5 rounded-[3px] border border-amber/50 bg-amber/12 px-6 py-3.5 text-[13.5px] font-medium text-amber transition-colors hover:bg-amber/22"
            >
              Open quick reference
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </RackUnit>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <MeterLiteracy />
      <StageSections />
      <SignalFlow />
      <GroupGuidance />
      <SessionPlanner />
      <LevelScale />
      <HeadroomChecker />
      <Ects />
      <Principles />
      <ClosingCta />
    </>
  )
}
