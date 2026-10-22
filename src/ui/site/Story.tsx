import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { rev, whoosh } from '../../lib/audio'
import { PAINTS } from '../../lib/configuration'
import { BEATS, COCKPIT_POINTS, cameraBlend, DESIGN_NOTES, ENVIRONMENT_INFO, PERFORMANCE_FIGURES, SCENES } from '../../lib/story'
import { useConfigurator, type EnvironmentId } from '../../store/configurator'
import { storyRig } from '../../viewer/storyRig'
import { Counter, SplitWords } from './Interactions'
import { LaunchControl } from './Launch'

const StoryScene = lazy(() => import('../../viewer/StoryScene'))

export const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

const isMobile = () => typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760)

/** Tracks scroll through the beats and writes the camera progress for the scene */
function useStoryScroll(beatEls: React.MutableRefObject<(HTMLElement | null)[]>, section: React.RefObject<HTMLElement>) {
  const [beat, setBeat] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const mid = window.innerHeight * 0.5
      let p = 0
      beatEls.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.top <= mid) p = i + Math.min(1, (mid - r.top) / r.height)
      })
      p = Math.min(BEATS.length, p)
      storyRig.progress = p
      setBeat(cameraBlend(p).nearest)
      section.current?.style.setProperty('--p', p.toFixed(3))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [beatEls, section])
  return beat
}

/** Horizontal drag orbits the camera; vertical swipes still scroll the page */
function useDragOrbit() {
  const last = useRef<{ x: number; t: number } | null>(null)
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return
      last.current = { x: e.clientX, t: performance.now() }
      storyRig.dragging = true
      storyRig.yawVelocity = 0
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!last.current) return
      const dx = e.clientX - last.current.x
      storyRig.yaw -= dx * 0.006
      storyRig.yawVelocity = -dx * 0.006 * 0.6
      last.current = { x: e.clientX, t: performance.now() }
    },
    onPointerUp: () => {
      last.current = null
      storyRig.dragging = false
    },
  }
}

function EnvironmentSelector({ compact = false }: { compact?: boolean }) {
  const environment = useConfigurator((s) => s.environment)
  const setEnvironment = useConfigurator((s) => s.setEnvironment)
  return (
    <div className={`env-select${compact ? ' compact' : ''}`} role="radiogroup" aria-label="Environment">
      {(Object.keys(ENVIRONMENT_INFO) as EnvironmentId[]).map((id, i) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={environment === id}
          className={`env-option${environment === id ? ' is-active' : ''}`}
          onClick={() => setEnvironment(id)}
          data-tilt={compact ? undefined : ''}
        >
          {!compact && <span className="env-index">0{i + 1}</span>}
          <span className="env-label">{compact ? ENVIRONMENT_INFO[id].label.split(' ').pop() : ENVIRONMENT_INFO[id].label}</span>
          {!compact && <span className="env-text">{ENVIRONMENT_INFO[id].text}</span>}
        </button>
      ))}
    </div>
  )
}
export { EnvironmentSelector }

/** Swap the paint on the car in the showroom. It is the same build the configurator edits. */
function PaintDock() {
  const paint = useConfigurator((s) => s.config.paint)
  const setOption = useConfigurator((s) => s.setOption)
  return (
    <div className="story-dock" role="radiogroup" aria-label="Paint">
      {PAINTS.filter((p) => p.id !== 'custom').map((p) => (
        <button key={p.id} type="button" role="radio" aria-checked={paint === p.id} aria-label={p.label} title={p.label} className={`dock-swatch${paint === p.id ? ' is-active' : ''}`} style={{ background: p.color }} onClick={() => setOption('paint', p.id)} />
      ))}
      <span className="key-hint" aria-hidden>
        1–6 scenes · E world · P pause
      </span>
    </div>
  )
}

function SceneRail({ beat }: { beat: number }) {
  const scene = BEATS[beat].scene
  return (
    <ol className="rail" aria-label="Story progress">
      {SCENES.map((s) => (
        <li key={s.n} className={s.n === scene ? 'is-active' : s.n < scene ? 'is-past' : ''}>
          <a href={`#${s.id}`} aria-current={s.n === scene ? 'step' : undefined}>
            <span className="rail-n">0{s.n}</span>
            <span className="rail-label">{s.label}</span>
          </a>
        </li>
      ))}
      <span className="rail-fill" aria-hidden />
    </ol>
  )
}

function Fallback() {
  return (
    <div className="story-fallback">
      <img src="/showroom-fallback.jpg" alt="A still render of the procedural M340i prototype in the dark studio" />
      <p className="eyebrow">3D view unavailable on this device. Showing a still render of the prototype.</p>
    </div>
  )
}

function SceneHead({ n, title }: { n: number; title: string }) {
  return (
    <p className="scene-head" data-reveal>
      <span>0{n}</span>
      <span className="scene-line" />
      <span>{title}</span>
    </p>
  )
}

export function StoryExperience({ reducedMotion, webgl }: { reducedMotion: boolean; webgl: boolean }) {
  const section = useRef<HTMLElement>(null)
  const beatEls = useRef<(HTMLElement | null)[]>([])
  const beat = useStoryScroll(beatEls, section)
  const [active, setActive] = useState(true)
  const [effects, setEffects] = useState(true)
  const [spin, setSpin] = useState(!reducedMotion)
  const mobile = useMemo(isMobile, [])
  const drag = useDragOrbit()
  const introDone = useConfigurator((s) => s.introDone)
  const setCategory = useConfigurator((s) => s.setCategory)
  const sound = useConfigurator((s) => s.sound)
  const lastScene = useRef(1)
  const setEnvironment = useConfigurator((s) => s.setEnvironment)

  // pointer position leans the camera; keys jump between scenes
  useEffect(() => {
    const move = (e: PointerEvent) => {
      storyRig.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      storyRig.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.ctrlKey || e.metaKey || e.altKey || (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const n = Number(e.key)
      if (n >= 1 && n <= SCENES.length) scrollToId(SCENES[n - 1].id === 'finale' ? 'finale' : SCENES[n - 1].id)
      else if (e.key.toLowerCase() === 'e') {
        const order: EnvironmentId[] = ['studio', 'night', 'track']
        const cur = useConfigurator.getState().environment
        setEnvironment(order[(order.indexOf(cur) + 1) % order.length])
      } else if (e.key.toLowerCase() === 'p') setSpin((v) => !v)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('keydown', key)
    }
  }, [setEnvironment])

  // only draw the showroom while it is on screen
  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '100px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const scene = BEATS[beat].scene
    if (scene !== lastScene.current && sound) whoosh()
    lastScene.current = scene
  }, [beat, sound])

  const ref = (i: number) => (el: HTMLElement | null) => {
    beatEls.current[i] = el
  }
  const resetView = () => {
    storyRig.yaw = 0
    storyRig.yawVelocity = 0
  }

  return (
    <section className={`story${introDone ? ' is-live' : ''}`} ref={section} aria-label="The M340i story">
      <div className="story-stage" data-cursor="drag" {...drag}>
        {webgl ? (
          <Suspense fallback={null}>
            <StoryScene reducedMotion={reducedMotion} active={active} beat={beat} effects={effects} spin={spin} mobile={mobile} />
          </Suspense>
        ) : (
          <Fallback />
        )}
        <div className="story-shade" aria-hidden />
        <SceneRail beat={beat} />
        <PaintDock />
        <div className="story-hud" role="toolbar" aria-label="Showroom controls">
          <EnvironmentSelector compact />
          <button type="button" className={`icon-btn${spin ? ' is-on' : ''}`} onClick={() => setSpin(!spin)} aria-pressed={spin} title={spin ? 'Pause rotation' : 'Resume rotation'}>
            {spin ? '❚❚' : '▶'}
          </button>
          <button type="button" className={`icon-btn${effects ? ' is-on' : ''}`} onClick={() => setEffects(!effects)} aria-pressed={effects} title="Light effects">
            ✦
          </button>
          <button type="button" className="icon-btn" onClick={resetView} title="Reset view">
            ⌖
          </button>
        </div>
      </div>

      <div className="story-beats">
        {/* 01 hero */}
        <div className="beat beat-hero" ref={ref(0)} id="top">
          <div className="hero">
            <p className="hero-eyebrow">
              <span>BMW M340i xDrive</span>
              <span>G20 LCI</span>
              <span>Independent concept</span>
            </p>
            <h1 className="hero-title">
              <SplitWords text="Engineered" delay={100} />
              <SplitWords text="to be felt." delay={260} className="metal" />
            </h1>
            <p className="hero-sub">The BMW M340i. Precision engineered. Emotion unleashed.</p>
            <div className="hero-ctas">
              <button type="button" className="btn primary" data-magnetic onClick={() => scrollToId('machine')}>
                Explore the machine
              </button>
              <button type="button" className="btn ghost" data-magnetic onClick={() => scrollToId('configure')}>
                Enter the configurator
              </button>
            </div>
            <ul className="hero-tags" aria-label="Key facts">
              <li>
                <span>Drive</span>xDrive AWD
              </li>
              <li>
                <span>Engine</span>3.0 L inline-six
              </li>
              <li>
                <span>0–100 km/h</span>4.4 s<sup>*</sup>
              </li>
            </ul>
            <p className="hero-foot">* Manufacturer claim. Check current BMW India figures for your model year.</p>
          </div>
          <div className="scroll-cue" aria-hidden>
            <span>Scroll</span>
            <i />
          </div>
          <p className="drag-cue" aria-hidden>
            Drag to orbit
          </p>
        </div>

        <div className="beat beat-left" ref={ref(1)} id="machine">
          <div className="beat-card">
            <SceneHead n={1} title="The Machine" />
            <h2 className="beat-title" data-reveal>
              A sports saloon with nothing to prove.
            </h2>
            <p className="beat-text" data-reveal>
              Long bonnet, set-back cabin, short overhangs. The car you see is our procedural model, built at the real G20 dimensions and wearing your current build.
            </p>
            <dl className="dims" data-reveal>
              <div>
                <dt>Length</dt>
                <dd>4,713 mm</dd>
              </div>
              <div>
                <dt>Wheelbase</dt>
                <dd>2,851 mm</dd>
              </div>
              <div>
                <dt>Height</dt>
                <dd>1,440 mm</dd>
              </div>
            </dl>
          </div>
        </div>

        {(['grille', 'headlights', 'contours', 'wheels', 'rear'] as const).map((id, k) => {
          const note = DESIGN_NOTES[id]
          return (
            <div key={id} className={`beat beat-note ${k % 2 ? 'beat-left' : 'beat-right'}`} ref={ref(2 + k)} id={k === 0 ? 'design' : undefined}>
              <div className="beat-card callout">
                {k === 0 && <SceneHead n={2} title="Sculpted by aerodynamics" />}
                <p className="note-coord" data-reveal>
                  <span className="note-dot" /> {note.coord}
                </p>
                <h3 className="note-title" data-reveal>
                  {note.title}
                </h3>
                <p className="beat-text" data-reveal>
                  {note.text}
                </p>
              </div>
            </div>
          )
        })}

        <div className="beat beat-left" ref={ref(7)} id="performance">
          <div className="beat-card">
            <SceneHead n={3} title="Performance DNA" />
            <h2 className="beat-title" data-reveal>
              Inline-six. Twin-scroll turbo.
            </h2>
            <p className="beat-text" data-reveal>
              Technical view of the prototype: the bonnet lifts and the body turns to glass so you can see where the engine sits. The engine itself is simplified, not a model of the real B58.
            </p>
          </div>
        </div>

        <div className="beat beat-wide" ref={ref(8)}>
          <div className="figures">
            {PERFORMANCE_FIGURES.map((f) => (
              <div className="figure" key={f.label} data-reveal data-tilt>
                <p className="figure-value">
                  <Counter value={f.value} decimals={f.decimals} reducedMotion={reducedMotion} />
                  <small>{f.unit}</small>
                </p>
                <p className="figure-label">{f.label}</p>
                {f.note && <p className="figure-note">{f.note}</p>}
              </div>
            ))}
          </div>
          <p className="figures-note" data-reveal>
            Power and torque differ by market, so they are listed in the specifications with an unverified label. Confirm every figure against BMW India for the exact model year and variant.
          </p>
        </div>

        <div className="beat beat-right" ref={ref(9)} id="cockpit">
          <div className="beat-card">
            <SceneHead n={4} title="The Cockpit" />
            <h2 className="beat-title" data-reveal>
              Built around the driver.
            </h2>
            <ul className="points">
              {COCKPIT_POINTS.map((p) => (
                <li key={p.title} data-reveal>
                  <strong>{p.title}</strong>
                  <span>{p.text}</span>
                </li>
              ))}
            </ul>
            <p className="beat-fine" data-reveal>
              Cutaway of the prototype cabin, right-hand drive. It is not BMW&apos;s interior.
            </p>
            <button
              type="button"
              className="btn ghost"
              data-magnetic
              onClick={() => {
                setCategory('interior')
                scrollToId('configure')
              }}
            >
              Configure the interior
            </button>
          </div>
        </div>

        <div className="beat beat-wide beat-atmos" ref={ref(10)} id="atmosphere">
          <div className="beat-card wide">
            <SceneHead n={5} title="Choose your atmosphere" />
            <h2 className="beat-title" data-reveal>
              Same machine. Three worlds.
            </h2>
            <EnvironmentSelector />
          </div>
        </div>

        <div className="beat beat-finale" ref={ref(11)} id="finale">
          <div className="finale">
            <SceneHead n={6} title="The final reveal" />
            <h2 className="finale-title" data-reveal>
              Built for the moment <span className="metal">before the launch.</span>
            </h2>
            <button
              type="button"
              className="btn primary large"
              data-magnetic
              onClick={() => {
                rev()
                scrollToId('configure')
              }}
            >
              Experience the M340i
            </button>
            <LaunchControl reducedMotion={reducedMotion} />
          </div>
        </div>
      </div>
    </section>
  )
}
