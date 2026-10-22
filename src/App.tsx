import { useEffect, useState } from 'react'
import { saveBuild, shareUrl } from './lib/share'
import { useConfigurator } from './store/configurator'
import { CategoryBar, OptionPanel } from './ui/Panel'
import { BuildSummary, Explore, Specifications } from './ui/Sections'
import { Stage } from './ui/Stage'

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

function Logo() {
  return (
    <a href="#configure" className="logo" aria-label="M340i Atelier, back to the configurator">
      <svg viewBox="0 0 40 24" width="34" height="20" aria-hidden>
        <path d="M3 20 L9 4 L20 15 L31 4 L37 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M2 23 H38" stroke="#2f7bff" strokeWidth="1.6" />
      </svg>
      <span>
        M340i <em>//</em> ATELIER
      </span>
    </a>
  )
}

function Nav() {
  const config = useConfigurator((s) => s.config)
  const notify = useConfigurator((s) => s.notify)
  const save = async () => {
    saveBuild(`Build ${new Date().toLocaleString()}`, config)
    try {
      await navigator.clipboard.writeText(shareUrl(config))
      notify('Saved on this device. Share link copied.')
    } catch {
      notify('Saved on this device')
    }
  }
  return (
    <header className="nav">
      <Logo />
      <nav className="nav-links" aria-label="Sections">
        <a href="#configure">Configure</a>
        <a href="#explore">Explore</a>
        <a href="#specs">Specifications</a>
        <a href="#summary">Build summary</a>
      </nav>
      <button type="button" className="btn small" onClick={save}>
        Save configuration
      </button>
    </header>
  )
}

function Intro({ reducedMotion }: { reducedMotion: boolean }) {
  const introDone = useConfigurator((s) => s.introDone)
  const finishIntro = useConfigurator((s) => s.finishIntro)
  if (introDone) return null
  return (
    <div className={`intro${reducedMotion ? ' still' : ''}`} role="dialog" aria-modal="false" aria-label="Welcome">
      <div className="intro-card">
        <p className="eyebrow">An independent configuration studio</p>
        <h2 className="intro-title">
          M340i <em>//</em> Atelier
        </h2>
        <p className="intro-tag">Your machine. Your specification.</p>
        <p className="intro-copy">Rotate, inspect and re-specify a BMW M340i part by part. The car is a procedural 3D prototype built at the real G20 dimensions, not BMW's own model.</p>
        <div className="intro-actions">
          <button type="button" className="btn" onClick={finishIntro} autoFocus>
            Enter configuration studio
          </button>
          <button type="button" className="btn ghost" onClick={finishIntro}>
            Skip intro
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast() {
  const toast = useConfigurator((s) => s.toast)
  return (
    <div className={`toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
      {toast}
    </div>
  )
}

export default function App() {
  const reducedMotion = useReducedMotion()
  const undo = useConfigurator((s) => s.undo)
  const redo = useConfigurator((s) => s.redo)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  return (
    <>
      <Nav />
      <main>
        <section className="configure" id="configure" aria-label="Configurator">
          <Stage reducedMotion={reducedMotion} />
          <div className="sidebar">
            <CategoryBar />
            <OptionPanel />
          </div>
          <Intro reducedMotion={reducedMotion} />
        </section>
        <Explore />
        <Specifications />
        <BuildSummary />
      </main>
      <footer className="footer">
        <p>
          <strong>M340i // Atelier</strong> is an independent concept project. It is not affiliated with, endorsed by or connected to BMW AG or CarWale. BMW and M340i are trademarks of their owner and are used only to identify the vehicle.
        </p>
        <p className="muted">
          The 3D car is a procedural prototype built from published overall dimensions. Shapes, parts and colours are approximations. Options marked Concept are visual ideas, not factory or dealer items. No prices for accessories are shown because none were verified.
        </p>
      </footer>
      <Toast />
    </>
  )
}
