import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { setSound as setAudio } from '../../lib/audio'
import { saveBuild, shareUrl } from '../../lib/share'
import { useConfigurator } from '../../store/configurator'
import { Insignia } from './LoadingScreen'

export const NAV_LINKS = [
  { id: 'machine', label: 'Machine' },
  { id: 'design', label: 'Design' },
  { id: 'performance', label: 'Performance' },
  { id: 'cockpit', label: 'Cockpit' },
  { id: 'atmosphere', label: 'Atmosphere' },
  { id: 'configure', label: 'Configure' },
  { id: 'specs', label: 'Specs' },
] as const

/** Which nav section is on screen, by the element nearest the top third */
function useActiveSection() {
  const [active, setActive] = useState<string>('machine')
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const line = window.innerHeight * 0.35
      let current: string = NAV_LINKS[0].id
      for (const l of NAV_LINKS) {
        const el = document.getElementById(l.id)
        if (el && el.getBoundingClientRect().top <= line) current = l.id
      }
      setActive(current)
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
  }, [])
  return active
}

export function SoundToggle() {
  const sound = useConfigurator((s) => s.sound)
  const setSound = useConfigurator((s) => s.setSound)
  const notify = useConfigurator((s) => s.notify)
  const toggle = async () => {
    const next = !sound
    const ok = await setAudio(next)
    if (next && !ok) return notify('Sound is not available in this browser')
    setSound(next)
  }
  return (
    <button type="button" className={`sound-toggle${sound ? ' is-on' : ''}`} onClick={toggle} aria-pressed={sound} aria-label={sound ? 'Mute ambient sound' : 'Play ambient sound'}>
      <span className="sound-bars" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sound-label">{sound ? 'Sound on' : 'Sound off'}</span>
    </button>
  )
}

export function SportToggle() {
  const sport = useConfigurator((s) => s.sport)
  const setSport = useConfigurator((s) => s.setSport)
  return (
    <button type="button" className={`sport-toggle${sport ? ' is-on' : ''}`} onClick={() => setSport(!sport)} aria-pressed={sport} title="Sport mode switches the accent colour to red">
      <span className="sport-dot" aria-hidden />
      {sport ? 'Sport' : 'Comfort'}
    </button>
  )
}

export function SiteNavigation() {
  const active = useActiveSection()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const list = useRef<HTMLDivElement>(null)
  const [bar, setBar] = useState({ left: 0, width: 0 })
  const config = useConfigurator((s) => s.config)
  const notify = useConfigurator((s) => s.notify)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // the indicator slides under the active link
  useLayoutEffect(() => {
    const measure = () => {
      const el = list.current?.querySelector<HTMLElement>(`[data-id="${active}"]`)
      if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [active])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

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
    <header className={`nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <a href="#top" className="logo" aria-label="M340i Atelier, back to the top">
        <Insignia size={26} />
        <span>
          M340i <em>//</em> Atelier
        </span>
      </a>
      <nav className="nav-links" aria-label="Sections" ref={list}>
        {NAV_LINKS.map((l) => (
          <a key={l.id} data-id={l.id} href={`#${l.id}`} className={active === l.id ? 'is-active' : ''} aria-current={active === l.id ? 'true' : undefined} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <span className="nav-indicator" style={{ transform: `translateX(${bar.left}px)`, width: bar.width }} aria-hidden />
      </nav>
      <div className="nav-tools">
        <SportToggle />
        <SoundToggle />
        <button type="button" className="btn small nav-save" onClick={save}>
          Save build
        </button>
        <button type="button" className="nav-menu" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
