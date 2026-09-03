import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Gauge } from 'lucide-react'
import { useScrollProgress } from '../lib/hooks'
import { SegmentedMeter } from './ui'

type NavItem = { label: string; to?: string; hash?: string }

const NAV: NavItem[] = [
  { label: 'Workflow', to: '/' },
  { label: 'Planner', to: '/planner' },
  { label: 'Meters', hash: 'measurements' },
  { label: 'Stages', hash: 'stage-record' },
  { label: 'Signal Flow', hash: 'signal-flow' },
  { label: 'Groups', hash: 'groups' },
  { label: 'Sessions', hash: 'sessions' },
  { label: 'dB Scale', hash: 'scale' },
  { label: 'Headroom', hash: 'headroom' },
  { label: 'ECTS', hash: 'ects' },
  { label: 'Quick Ref', to: '/quick-reference' },
]

const SECTION_IDS = [
  'measurements',
  'stage-record',
  'signal-flow',
  'groups',
  'sessions',
  'scale',
  'headroom',
  'ects',
]

function useSectionScroll(ids: string[]) {
  const { pathname } = useLocation()
  const [active, setActive] = useState('')

  useEffect(() => {
    if (pathname !== '/') return
    let raf = 0
    const read = () => {
      raf = 0
      let best = ''
      let bestDist = Number.POSITIVE_INFINITY
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        const d = Math.abs(el.getBoundingClientRect().top - 150)
        if (d < bestDist) {
          bestDist = d
          best = id
        }
      }
      setActive(best)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [pathname, ids])

  return active
}

function MasterRail({ progress }: { progress: number }) {
  const db = -60 + progress * 57
  return (
    <aside
      aria-hidden="true"
      className="fixed top-0 left-0 z-40 hidden h-screen w-[74px] flex-col items-center justify-between border-r border-etch bg-panel-2/80 py-6 backdrop-blur-sm xl:flex"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-etch bg-unit">
          <Activity size={15} className="text-amber" />
        </div>
        <span className="vertical-legend legend text-[9px] text-legend-dim">MASTER OUT</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
        <div className="h-[46vh] w-[22px]">
          <SegmentedMeter
            vertical
            segments={30}
            min={-60}
            max={0}
            value={db}
            label="Scroll position meter"
          />
        </div>
        <span className="mono text-[10px] tabular-nums text-legend-dim">
          {db > 0 ? '0.0' : db.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="h-[5px] w-[5px] rounded-full bg-signal led-blink" />
        <span className="vertical-legend legend text-[9px] text-legend-dim">SIG OK</span>
      </div>
    </aside>
  )
}

export default function Layout() {
  const progress = useScrollProgress()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const activeSection = useSectionScroll(SECTION_IDS)

  const handleNav = (n: NavItem) => {
    if (n.to) {
      navigate(n.to)
      return
    }
    if (!n.hash) return
    const scroll = () =>
      document.getElementById(n.hash!)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (pathname !== '/') {
      navigate('/')
      window.setTimeout(scroll, 120)
    } else {
      scroll()
    }
  }

  return (
    <div className="min-h-screen bg-panel">
      <MasterRail progress={progress} />

      {/* Mobile / tablet: the same meter as a top progress strip */}
      <div
        className="fixed top-[57px] right-0 left-0 z-40 h-[3px] bg-[#12161a] xl:hidden"
        aria-hidden="true"
      >
        <div
          className="h-full transition-[width] duration-150 ease-out"
          style={{
            width: `${progress * 100}%`,
            background: progress > 0.92 ? '#FF4D4D' : progress > 0.74 ? '#F5A524' : '#35E08A',
          }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-etch bg-panel/88 backdrop-blur-md">
        <div className="mx-auto flex h-[57px] max-w-[1400px] items-center gap-4 px-4 sm:px-6 xl:pl-[98px]">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-[3px] border border-etch bg-unit transition-colors group-hover:border-amber">
              <Gauge size={14} className="text-amber" />
            </span>
            <span className="num hidden text-[13px] font-bold tracking-[-0.01em] text-ink sm:block">
              THE GAIN STAGING <span className="text-amber">FIELD GUIDE</span>
            </span>
            <span className="num text-[13px] font-bold text-ink sm:hidden">GAIN STAGING</span>
          </Link>

          <nav className="ml-auto flex items-center gap-0.5 overflow-x-auto" aria-label="Sections">
            {NAV.map((n) => {
              const isActive = n.to
                ? n.to === pathname
                : n.hash
                  ? pathname === '/' && activeSection === n.hash
                  : false
              return (
                <button
                  key={n.label}
                  type="button"
                  onClick={() => handleNav(n)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`legend shrink-0 border-b-2 px-2.5 py-2 text-[9.5px] whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-amber text-amber'
                      : 'border-transparent text-legend-dim hover:text-ink'
                  }`}
                >
                  {n.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="xl:pl-[74px]">
        <Outlet />

        <footer className="mt-24 border-t border-etch bg-panel-2">
          <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div className="max-w-md">
                <p className="num text-[15px] font-bold text-ink">
                  THE GAIN STAGING <span className="text-amber">FIELD GUIDE</span>
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-legend">
                  An open educational reference for music production students and working engineers.
                  Every number here is a documented starting point, not a rule.
                </p>
              </div>
              <div className="max-w-md">
                <p className="legend mb-3">Important context</p>
                <p className="text-[12.5px] leading-relaxed text-legend-dim">
                  Real levels depend on source material, genre, DAW metering behaviour, converter
                  calibration, plugin headroom modelling, monitoring environment and artistic intent.
                  Use these figures as calibration anchors, then trust your ears and your meters.
                  Platform loudness targets verified against published service documentation.
                </p>
              </div>
            </div>
            <div className="hairline mt-10 h-px" />
            <p className="mono mt-6 text-[10.5px] tracking-[0.06em] text-legend-dim">
              ECTS figures use the standard 1 ECTS ≈ 25–30 h workload convention — an academic
              planning guideline, not a universal rule.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
