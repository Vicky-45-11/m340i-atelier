import { useEffect, useRef, useState } from 'react'
import { useConfigurator } from '../../store/configurator'

/** Abstract performance insignia: three slanted stripes in a ring. Not a BMW mark. */
export function Insignia({ size = 72 }: { size?: number }) {
  return (
    <svg className="insignia" viewBox="0 0 80 80" width={size} height={size} aria-hidden>
      <circle cx="40" cy="40" r="36" className="insignia-ring" />
      <circle cx="40" cy="40" r="29" className="insignia-ring thin" />
      <path d="M27 54 L37 26" className="insignia-stripe s1" />
      <path d="M36 54 L46 26" className="insignia-stripe s2" />
      <path d="M45 54 L55 26" className="insignia-stripe s3" />
    </svg>
  )
}

const MIN_SHOW_MS = 1700

/**
 * Cinematic opening: black screen, insignia, technical read-out and a sound
 * wave, then hand-over to the showroom. It never waits longer than the scene
 * needs, can be skipped at any time, and is shown once per session.
 */
export function LoadingScreen({ reducedMotion, webgl }: { reducedMotion: boolean; webgl: boolean }) {
  const introDone = useConfigurator((s) => s.introDone)
  const finishIntro = useConfigurator((s) => s.finishIntro)
  const storyReady = useConfigurator((s) => s.storyReady)
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(introDone)
  const shownAt = useRef(performance.now())
  const ready = storyReady || !webgl

  // hand over once the scene has drawn and the insignia has had its moment;
  // a hard cap keeps a slow GPU from holding the visitor here
  useEffect(() => {
    if (introDone) return
    const wait = ready ? Math.max(0, (reducedMotion ? 400 : MIN_SHOW_MS) - (performance.now() - shownAt.current)) : 9000
    const t = setTimeout(finishIntro, wait)
    return () => clearTimeout(t)
  }, [ready, introDone, finishIntro, reducedMotion])

  useEffect(() => {
    if (!introDone || gone) return
    setLeaving(true)
    const t = setTimeout(() => setGone(true), reducedMotion ? 50 : 1300)
    return () => clearTimeout(t)
  }, [introDone, gone, reducedMotion])

  if (gone) return null
  return (
    <div className={`intro${leaving ? ' is-leaving' : ''}${reducedMotion ? ' still' : ''}`} role="dialog" aria-modal="false" aria-label="Loading the showroom">
      <div className="intro-coords" aria-hidden>
        <span>CAM X 5.400 · Y 0.620 · Z 4.300</span>
        <span>FOV 30.0 · ACES · 2,851 WB</span>
      </div>
      <div className="intro-core">
        <Insignia size={84} />
        <p className="intro-title">
          M340i <em>//</em> Atelier
        </p>
        <div className="intro-wave" aria-hidden>
          {Array.from({ length: 28 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${(i % 7) * 90 + i * 12}ms` }} />
          ))}
        </div>
        <div className={`intro-bar${ready ? ' is-ready' : ''}`} role="progressbar" aria-label="Loading" aria-valuetext={ready ? 'Ready' : 'Loading'}>
          <span />
        </div>
        <p className="intro-status" aria-live="polite">
          {ready ? 'Studio ready' : 'Building the studio'}
        </p>
      </div>
      <button type="button" className="intro-skip" onClick={finishIntro}>
        Skip intro
      </button>
      <p className="intro-note">An independent concept. Not affiliated with BMW.</p>
    </div>
  )
}
