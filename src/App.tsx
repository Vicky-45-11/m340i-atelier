import { useEffect, useState } from 'react'
import { useConfigurator } from './store/configurator'
import { CategoryBar, OptionPanel } from './ui/Panel'
import { BuildSummary, Explore, Specifications } from './ui/Sections'
import { Stage, hasWebGL } from './ui/Stage'
import { Cursor, useMicroInteractions } from './ui/site/Interactions'
import { Insignia, LoadingScreen } from './ui/site/LoadingScreen'
import { NAV_LINKS, SiteNavigation } from './ui/site/SiteNavigation'
import { StoryExperience } from './ui/site/Story'

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
  const [webgl] = useState(hasWebGL)
  const sport = useConfigurator((s) => s.sport)
  const introDone = useConfigurator((s) => s.introDone)
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

  useMicroInteractions(reducedMotion)
  useEffect(() => {
    document.documentElement.dataset.sport = sport ? 'on' : 'off'
  }, [sport])
  // keep the page still behind the opening sequence
  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', !introDone)
  }, [introDone])

  return (
    <>
      <SiteNavigation />
      <main>
        <StoryExperience reducedMotion={reducedMotion} webgl={webgl} />
        <section className="atelier" aria-label="Configurator">
          <div className="atelier-head">
            <p className="scene-head is-in">
              <span>07</span>
              <span className="scene-line" />
              <span>The Atelier</span>
            </p>
            <h2 className="section-title" data-reveal>
              Make it <span className="metal">yours.</span>
            </h2>
            <p className="lede" data-reveal>
              Every change applies to the 3D model as you make it: paint, wheels, calipers, aero, lighting, cabin and the world around the car. Options marked Concept are visual ideas, not factory parts.
            </p>
          </div>
          <div className="configure" id="configure">
            <Stage reducedMotion={reducedMotion} />
            <div className="sidebar">
              <CategoryBar />
              <OptionPanel />
            </div>
          </div>
        </section>
        <Explore />
        <Specifications />
        <BuildSummary />
      </main>
      <footer className="footer">
        <div className="footer-top">
          <a href="#top" className="footer-brand">
            <Insignia size={40} />
            <span>
              M340i <em>//</em> Atelier
            </span>
          </a>
          <nav className="footer-links" aria-label="Footer">
            {NAV_LINKS.map((l) => (
              <a key={l.id} href={`#${l.id}`}>
                {l.label}
              </a>
            ))}
            <a href="#summary">Build summary</a>
          </nav>
        </div>
        <p>
          <strong>M340i // Atelier</strong> is an independent concept project. It is not affiliated with, endorsed by or connected to BMW AG or CarWale. BMW and M340i are trademarks of their owner and are used only to identify the vehicle.
        </p>
        <p className="muted">
          The 3D car is a procedural prototype built from published overall dimensions. Shapes, parts and colours are approximations. The sound is synthesised in the browser, not recorded. No prices for accessories are shown because none were verified.
        </p>
      </footer>
      <LoadingScreen reducedMotion={reducedMotion} webgl={webgl} />
      <Cursor reducedMotion={reducedMotion} />
      <Toast />
    </>
  )
}
