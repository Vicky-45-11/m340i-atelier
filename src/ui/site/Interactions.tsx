import { useEffect, useRef, useState } from 'react'

const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

/**
 * Page-wide micro-interactions driven by data attributes, so each effect has
 * one listener no matter how many elements use it:
 *  - data-reveal: fades and unmasks the element when it scrolls into view
 *  - data-magnetic: the element leans towards the pointer
 *  - data-tilt: a subtle 3D tilt under the pointer
 */
export function useMicroInteractions(reducedMotion: boolean) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )
    const observe = () => document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el))
    observe()
    // sections that mount later (fallbacks, panels) are picked up too
    const mo = new MutationObserver(observe)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  useEffect(() => {
    if (reducedMotion || !finePointer()) return
    let magnet: HTMLElement | null = null
    let tilt: HTMLElement | null = null
    const release = (el: HTMLElement | null) => {
      if (el) el.style.transform = ''
    }
    const move = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null
      const m = t?.closest<HTMLElement>('[data-magnetic]') ?? null
      if (m !== magnet) {
        release(magnet)
        magnet = m
      }
      if (m) {
        const r = m.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        m.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`
      }
      const tl = t?.closest<HTMLElement>('[data-tilt]') ?? null
      if (tl !== tilt) {
        release(tilt)
        tilt = tl
      }
      if (tl) {
        const r = tl.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        tl.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`
      }
    }
    const leave = () => {
      release(magnet)
      release(tilt)
      magnet = tilt = null
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      leave()
    }
  }, [reducedMotion])
}

/** A ring that trails the pointer on desktop. The system cursor stays visible. */
export function Cursor({ reducedMotion }: { reducedMotion: boolean }) {
  const ring = useRef<HTMLDivElement>(null)
  const [enabled] = useState(() => finePointer() && !reducedMotion)
  useEffect(() => {
    if (!enabled) return
    const el = ring.current
    if (!el) return
    let x = -100
    let y = -100
    let tx = -100
    let ty = -100
    let raf = 0
    const move = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      const t = e.target as HTMLElement | null
      const mode = t?.closest('[data-cursor="drag"]') ? 'drag' : t?.closest('a,button,select,input,label,[role="slider"]') ? 'link' : ''
      if (el.dataset.mode !== mode) el.dataset.mode = mode
    }
    const tick = () => {
      x += (tx - x) * 0.22
      y += (ty - y) * 0.22
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    const hide = () => (el.style.opacity = '0')
    const show = () => (el.style.opacity = '')
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', hide)
    document.addEventListener('pointerenter', show)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', hide)
      document.removeEventListener('pointerenter', show)
    }
  }, [enabled])
  if (!enabled) return null
  return (
    <div className="cursor" ref={ring} aria-hidden>
      <span className="cursor-label">Drag</span>
    </div>
  )
}

/** Splits a line into words that rise in one after another */
export function SplitWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={`split ${className ?? ''}`}>
      <span className="sr-only">{text}</span>
      {text.split(' ').map((w, i) => (
        <span className="split-mask" key={i} aria-hidden>
          <span className="split-word" style={{ transitionDelay: `${delay + i * 70}ms` }}>
            {w}
          </span>
        </span>
      ))}
    </span>
  )
}

/** Counts up to a value once it scrolls into view */
export function Counter({ value, decimals, reducedMotion }: { value: number; decimals: number; reducedMotion: boolean }) {
  const [shown, setShown] = useState(reducedMotion ? value : 0)
  const el = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const node = el.current
    if (!node || reducedMotion) return
    let timer = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        // a timer rather than rAF so a busy GPU thread cannot stall the count
        timer = window.setInterval(() => {
          const t = Math.min(1, (performance.now() - start) / 1400)
          setShown(value * (1 - Math.pow(1 - t, 4)))
          if (t >= 1) window.clearInterval(timer)
        }, 40)
      },
      { threshold: 0.3 },
    )
    io.observe(node)
    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [value, reducedMotion])
  return (
    <span ref={el} className="counter">
      {shown.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}
