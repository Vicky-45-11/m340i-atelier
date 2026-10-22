import { useEffect, useRef, useState } from 'react'
import { rev } from '../../lib/audio'
import { useConfigurator } from '../../store/configurator'
import { storyRig } from '../../viewer/storyRig'

type Phase = 'idle' | 'lights' | 'go' | 'result' | 'false'

const BEST_KEY = 'm340i-atelier:best-reaction'
const readBest = () => {
  try {
    const v = Number(localStorage.getItem(BEST_KEY))
    return v > 0 ? v : null
  } catch {
    return null
  }
}

const rating = (ms: number) => (ms < 250 ? 'Race-ready' : ms < 350 ? 'Sharp' : ms < 500 ? 'Getting there' : 'Asleep at the lights')

/**
 * Launch-control game. Hold the button to load the engine, wait for the five
 * red lights to go out, then let go. Your reaction time is shown. The car
 * spins its wheels and the camera shakes while you hold. It is a game, not a
 * measure of any real car's launch control or performance.
 */
export function LaunchControl({ reducedMotion }: { reducedMotion: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [lit, setLit] = useState(0)
  const [ms, setMs] = useState<number | null>(null)
  const [best, setBest] = useState<number | null>(readBest)
  const setEnvironment = useConfigurator((s) => s.setEnvironment)
  const timers = useRef<number[]>([])
  const goAt = useRef(0)
  const phaseRef = useRef<Phase>('idle')
  const decay = useRef(0)

  const set = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  // a timer that keeps the rig values in step with what the game is doing
  const drive = (revTarget: number, wheel: number) => {
    window.clearInterval(decay.current)
    decay.current = window.setInterval(() => {
      storyRig.rev += (revTarget - storyRig.rev) * 0.12
      storyRig.wheelSpeed += (wheel - storyRig.wheelSpeed) * 0.1
      if (Math.abs(storyRig.rev - revTarget) < 0.01 && Math.abs(storyRig.wheelSpeed - wheel) < 0.4) {
        storyRig.rev = revTarget
        storyRig.wheelSpeed = wheel
        window.clearInterval(decay.current)
      }
    }, 33)
  }
  useEffect(
    () => () => {
      clear()
      window.clearInterval(decay.current)
      storyRig.rev = 0
      storyRig.wheelSpeed = 0
    },
    [],
  )

  const press = () => {
    if (phaseRef.current === 'lights' || phaseRef.current === 'go') return
    clear()
    setEnvironment('track')
    setMs(null)
    setLit(0)
    set('lights')
    rev()
    drive(1, reducedMotion ? 0 : 14)
    for (let i = 1; i <= 5; i++) timers.current.push(window.setTimeout(() => setLit(i), 700 * i))
    // lights out after a random pause, so it cannot be timed by rhythm
    timers.current.push(
      window.setTimeout(() => {
        setLit(0)
        goAt.current = performance.now()
        set('go')
      }, 700 * 5 + 600 + Math.random() * 1400),
    )
  }

  const release = () => {
    const p = phaseRef.current
    if (p === 'lights') {
      clear()
      set('false')
      setLit(0)
      drive(0, 0)
    } else if (p === 'go') {
      const t = Math.round(performance.now() - goAt.current)
      setMs(t)
      set('result')
      drive(0, reducedMotion ? 0 : 70)
      // let the wheels spin down after the launch
      timers.current.push(window.setTimeout(() => drive(0, 0), 2200))
      if (best === null || t < best) {
        setBest(t)
        try {
          localStorage.setItem(BEST_KEY, String(t))
        } catch {
          // ignore
        }
      }
    }
  }

  const label =
    phase === 'idle'
      ? 'Hold to load the engine'
      : phase === 'lights'
        ? 'Hold… wait for the lights to go out'
        : phase === 'go'
          ? 'Release now'
          : 'Hold to try again'

  return (
    <div className={`launch is-${phase}`} data-reveal>
      <p className="launch-eyebrow">Launch control · a mini-game</p>
      <div className="launch-lights" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={lit >= i ? 'is-lit' : ''} />
        ))}
      </div>
      <button
        type="button"
        className="btn primary launch-btn"
        data-magnetic
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          press()
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault()
            press()
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') release()
        }}
      >
        {label}
      </button>
      <p className="launch-out" role="status" aria-live="polite">
        {phase === 'result' && ms !== null && (
          <>
            <strong>{ms} ms</strong> · {rating(ms)}
          </>
        )}
        {phase === 'false' && <strong>False start.</strong>}
        {phase === 'go' && <strong>GO</strong>}
        {(phase === 'idle' || phase === 'lights') && (best ? <>Best on this device: {best} ms</> : <>Release when all five lights go out.</>)}
        {(phase === 'result' || phase === 'false') && best ? <span> · best {best} ms</span> : null}
      </p>
    </div>
  )
}
