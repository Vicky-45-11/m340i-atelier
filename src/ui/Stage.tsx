import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import { COMPONENT_LABELS, diffFromStock, paintOf, rimOf, wheelOf, type ViewMode } from '../lib/configuration'
import { sceneBridge, useConfigurator } from '../store/configurator'
import { CAMERA_PRESETS } from '../viewer/CameraRig'
import { LIGHTING } from '../viewer/lighting'
import { TourCard } from './Tour'

const CarScene = lazy(() => import('../viewer/CarScene'))

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

class SceneBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
  render() {
    if (this.state.error) return <Fallback reason={`The 3D scene stopped: ${this.state.error}`} />
    return this.props.children
  }
}

function Fallback({ reason }: { reason: string }) {
  return (
    <div className="fallback">
      <p className="eyebrow">3D view unavailable</p>
      <h3>Your browser could not start the 3D studio.</h3>
      <p>{reason}</p>
      <p>You can still choose options in the panel and read the build summary and specifications below. Try a recent Chrome, Edge, Firefox or Safari with hardware acceleration on.</p>
    </div>
  )
}

const MODES: { id: ViewMode; label: string }[] = [
  { id: 'studio', label: 'Studio render' },
  { id: 'technical', label: 'Technical view' },
  { id: 'exploded', label: 'Exploded view' },
]

const VIEW_BUTTONS = ['exterior', 'front', 'side', 'rear', 'rearQuarter', 'top', 'wheels', 'interior', 'engine'] as const

export function Stage({ reducedMotion }: { reducedMotion: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [webgl] = useState(hasWebGL)
  const [fullscreen, setFullscreen] = useState(false)
  const [dragged, setDragged] = useState(false)
  const config = useConfigurator((s) => s.config)
  const viewMode = useConfigurator((s) => s.viewMode)
  const setViewMode = useConfigurator((s) => s.setViewMode)
  const camera = useConfigurator((s) => s.camera)
  const setCamera = useConfigurator((s) => s.setCamera)
  const lighting = useConfigurator((s) => s.lighting)
  const setLighting = useConfigurator((s) => s.setLighting)
  const compare = useConfigurator((s) => s.compare)
  const setCompare = useConfigurator((s) => s.setCompare)
  const split = useConfigurator((s) => s.compareSplit)
  const setSplit = useConfigurator((s) => s.setCompareSplit)
  const hotspots = useConfigurator((s) => s.hotspots)
  const setHotspots = useConfigurator((s) => s.setHotspots)
  const autoRotate = useConfigurator((s) => s.autoRotate)
  const setAutoRotate = useConfigurator((s) => s.setAutoRotate)
  const hovered = useConfigurator((s) => s.hovered)
  const selected = useConfigurator((s) => s.selected)
  const select = useConfigurator((s) => s.select)
  const ready = useConfigurator((s) => s.sceneReady)
  const notify = useConfigurator((s) => s.notify)
  const isolate = useConfigurator((s) => s.isolate)
  const setIsolate = useConfigurator((s) => s.setIsolate)
  const lightShow = useConfigurator((s) => s.lightShow)
  const setLightShow = useConfigurator((s) => s.setLightShow)
  const tour = useConfigurator((s) => s.tour)
  const setTour = useConfigurator((s) => s.setTour)

  const paint = paintOf(config)
  const changes = diffFromStock(config).length

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === stageRef.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await stageRef.current?.requestFullscreen()
    } catch {
      notify('Fullscreen is not available in this browser')
    }
  }

  const snapshot = () => {
    const url = sceneBridge.capture?.()
    if (!url) return notify('Snapshot unavailable')
    const a = document.createElement('a')
    a.href = url
    a.download = 'm340i-atelier-build.png'
    a.click()
    notify('Snapshot saved as PNG')
  }

  const dragSplit = (e: React.PointerEvent) => {
    const el = stageRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const move = (ev: PointerEvent) => setSplit((ev.clientX - rect.left) / rect.width)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    e.preventDefault()
  }

  return (
    <div className={`stage${fullscreen ? ' is-fullscreen' : ''} mode-${viewMode}`} ref={stageRef} onPointerDown={() => setDragged(true)}>
      <div className="viewport">
        {webgl ? (
          <SceneBoundary>
            <Suspense fallback={null}>
              <CarScene reducedMotion={reducedMotion} />
            </Suspense>
          </SceneBoundary>
        ) : (
          <Fallback reason="WebGL is not available on this device or is turned off." />
        )}
      </div>

      {webgl && !ready && (
        <div className="loader" role="status">
          <span className="loader-bar" />
          <span>Building the studio and procedural model…</span>
        </div>
      )}

      {/* identity and current build */}
      <div className="hud hud-tl">
        <p className="eyebrow">BMW M340i xDrive · G20 LCI</p>
        <h1 className="paint-name">{paint.label}</h1>
        <p className="hud-sub">
          {wheelOf(config).label} · {rimOf(config).inches}" · {changes === 0 ? 'Factory specification' : `${changes} change${changes > 1 ? 's' : ''} from stock`}
        </p>
        <ul className="annotations" aria-hidden>
          <li>
            <span>Length</span>4,713 mm
          </li>
          <li>
            <span>Wheelbase</span>2,851 mm
          </li>
          <li>
            <span>Model</span>Procedural prototype
          </li>
        </ul>
      </div>

      <div className="hud hud-tc" role="group" aria-label="Render mode">
        <div className="segmented">
          {MODES.map((m) => (
            <button key={m.id} type="button" className={viewMode === m.id && !compare ? 'is-active' : ''} aria-pressed={viewMode === m.id && !compare} onClick={() => setViewMode(m.id)}>
              {m.label}
            </button>
          ))}
          <button type="button" className={compare ? 'is-active' : ''} aria-pressed={compare} onClick={() => setCompare(!compare)}>
            Stock vs custom
          </button>
        </div>
        {viewMode === 'technical' && !compare && <p className="mode-note">Stylised visualisation of the prototype geometry. Not an internal scan.</p>}
        {viewMode === 'exploded' && !compare && <p className="mode-note">Separately modelled parts move apart. The doors and body sides are one piece and stay put.</p>}
      </div>

      <div className="hud hud-tr" role="toolbar" aria-label="Viewer tools">
        <label className="select">
          <span className="sr-only">Lighting</span>
          <select value={lighting} onChange={(e) => setLighting(e.target.value as typeof lighting)} aria-label="Studio lighting">
            {LIGHTING.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={`btn small tour-btn${tour !== null ? ' is-on' : ''}`} onClick={() => setTour(tour === null ? 0 : null)} aria-pressed={tour !== null}>
          {tour === null ? 'Parts tour' : 'End tour'}
        </button>
        <button type="button" className={`icon-btn${lightShow ? ' is-on' : ''}`} onClick={() => setLightShow(!lightShow)} title="Light show" aria-pressed={lightShow}>
          ✦
        </button>
        <button type="button" className={`icon-btn${hotspots ? ' is-on' : ''}`} onClick={() => setHotspots(!hotspots)} title="Toggle hotspots" aria-pressed={hotspots}>
          ◎
        </button>
        <button type="button" className={`icon-btn${autoRotate ? ' is-on' : ''}`} onClick={() => setAutoRotate(!autoRotate)} title="Auto-rotate" aria-pressed={autoRotate}>
          ⟳
        </button>
        <button type="button" className="icon-btn" onClick={snapshot} title="Save a snapshot">
          ⧉
        </button>
        <button type="button" className="icon-btn" onClick={() => setCamera('exterior')} title="Reset camera">
          ⌖
        </button>
        <button type="button" className="icon-btn" onClick={toggleFullscreen} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} aria-pressed={fullscreen}>
          {fullscreen ? '⤡' : '⤢'}
        </button>
      </div>

      <div className="hud hud-bl" role="group" aria-label="Camera views">
        {VIEW_BUTTONS.map((id) => {
          const p = CAMERA_PRESETS.find((c) => c.id === id)
          return (
            <button key={id} type="button" className={`chip${camera === id ? ' is-active' : ''}`} onClick={() => setCamera(id)}>
              {p?.label}
            </button>
          )
        })}
      </div>

      <TourCard />

      {(hovered || selected) && !compare && tour === null && (
        <div className="hud hud-bc">
          {selected ? (
            <span className="pill">
              <strong>{COMPONENT_LABELS[selected]}</strong> selected
              <button type="button" className={`pill-toggle${isolate ? ' is-on' : ''}`} onClick={() => setIsolate(!isolate)} aria-pressed={isolate}>
                {isolate ? 'Show all' : 'Isolate'}
              </button>
              <button type="button" onClick={() => select(null)} aria-label="Clear selection">
                ✕
              </button>
            </span>
          ) : (
            hovered && (
              <span className="pill">
                {COMPONENT_LABELS[hovered]} · click to customise
              </span>
            )
          )}
        </div>
      )}

      {!dragged && ready && tour === null && <div className="drag-hint" aria-hidden>Drag to rotate · scroll or pinch to zoom · right-drag to pan</div>}

      {compare && (
        <div className="compare" aria-label="Stock versus custom comparison">
          <div className="compare-line" style={{ left: `${split * 100}%` }} onPointerDown={dragSplit}>
            <span className="compare-handle" role="slider" aria-valuemin={5} aria-valuemax={95} aria-valuenow={Math.round(split * 100)} aria-label="Comparison split" tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') setSplit(split - 0.05)
                if (e.key === 'ArrowRight') setSplit(split + 0.05)
              }}
            >
              ⇆
            </span>
          </div>
          <span className="compare-tag left">Stock</span>
          <span className="compare-tag right">Your build</span>
        </div>
      )}
    </div>
  )
}
