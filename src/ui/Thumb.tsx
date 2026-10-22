import type { ReactNode } from 'react'
import {
  PAINTS,
  WHEEL_STYLES,
  type Configuration,
  type OptionBase,
  type OptionGroup,
  type WheelStyle,
} from '../lib/configuration'

// Option previews are drawn from the same parameters the 3D parts use
// (spoke counts, fin counts, colours), so a thumbnail always matches the model.

const FINISH_FILL: Record<string, string> = {
  glossBlack: 'radial-gradient(circle at 35% 30%, #4a4d55 0%, #0b0c0e 55%, #000 100%)',
  matteBlack: 'radial-gradient(circle at 35% 30%, #34363b 0%, #1a1b1e 70%)',
  chrome: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #b7bcc4 35%, #5b6068 70%, #e6e9ee 100%)',
  carbon: 'repeating-linear-gradient(45deg, #24262b 0 3px, #121316 3px 6px), #1a1b1e',
}

function swatch(color: string, metallic = true) {
  return metallic
    ? `radial-gradient(circle at 32% 28%, ${mix(color, '#ffffff', 0.55)} 0%, ${color} 42%, ${mix(color, '#000000', 0.6)} 100%)`
    : color
}

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (s: number) => [(s >> 16) & 255, (s >> 8) & 255, s & 255]
  const [r1, g1, b1] = ch(pa)
  const [r2, g2, b2] = ch(pb)
  const c = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `rgb(${c(r1, r2)}, ${c(g1, g2)}, ${c(b1, b2)})`
}

export function WheelIcon({ style, size = 56 }: { style: WheelStyle; size?: number }) {
  const angles: number[] = []
  for (let i = 0; i < style.spokes; i++) {
    const base = (i / style.spokes) * Math.PI * 2 - Math.PI / 2
    if (style.perGroup === 2) angles.push(base - style.pairSpread / 2, base + style.pairSpread / 2)
    else angles.push(base)
  }
  const hub = 7
  const rim = 21
  const w0 = Math.max(1.2, style.hubWidth * 140)
  const w1 = Math.max(1.4, style.rimWidth * 140)
  return (
    <svg viewBox="-30 -30 60 60" width={size} height={size} aria-hidden>
      <circle r="29" fill="#0c0d0f" />
      <circle r="23.5" fill="#1d1f23" stroke={style.color} strokeWidth="2.5" />
      {angles.map((a, i) => {
        const c = Math.cos(a)
        const s = Math.sin(a)
        const px = -s
        const py = c
        const pts = [
          [c * hub + px * w0 / 2, s * hub + py * w0 / 2],
          [c * rim + px * w1 / 2, s * rim + py * w1 / 2],
          [c * rim - px * w1 / 2, s * rim - py * w1 / 2],
          [c * hub - px * w0 / 2, s * hub - py * w0 / 2],
        ]
        return <polygon key={i} points={pts.map((p) => p.join(',')).join(' ')} fill={style.faceColor ?? style.color} />
      })}
      <circle r={hub + 1} fill={style.color} />
      <circle r="3" fill="#0b0c0e" />
    </svg>
  )
}

const ink = '#c9ced6'
const accent = '#2f7bff'

function Schematic({ group, id }: { group: OptionGroup['key']; id: string }) {
  const svg = (children: ReactNode) => (
    <svg viewBox="0 0 64 40" width="64" height="40" aria-hidden fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
  switch (group) {
    case 'grille':
      return svg(
        <>
          {[14, 34].map((x) => (
            <rect key={x} x={x} y="10" width="16" height="13" rx="4" stroke={id === 'standard' ? '#e6e9ee' : '#555a63'} fill={id === 'performance' ? 'url(#hex)' : '#0b0c0e'} />
          ))}
          {id !== 'performance' && [17, 20, 23, 26, 37, 40, 43, 46].map((x) => <line key={x} x1={x} y1="12" x2={x} y2="21" stroke="#3a3e45" strokeWidth="1" />)}
          <defs>
            <pattern id="hex" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M0 2 L2 0 L4 2 L2 4Z" stroke="#4a4f57" strokeWidth="0.6" />
            </pattern>
          </defs>
        </>,
      )
    case 'splitter':
      return svg(
        <>
          <path d="M6 14 Q32 8 58 14 L58 26 L6 26Z" stroke="#555a63" />
          {id === 'none' && <path d="M12 27 L52 27" stroke="#777" strokeWidth="1.5" />}
          {id === 'lip' && <path d="M8 28 Q32 31 56 28" stroke={accent} strokeWidth="2.6" />}
          {id === 'track' && (
            <>
              <path d="M4 29 Q32 33 60 29" stroke={accent} strokeWidth="3" />
              <path d="M5 23 L5 30 M59 23 L59 30" stroke={accent} strokeWidth="2" />
            </>
          )}
        </>,
      )
    case 'diffuser': {
      const n = id === 'stock' ? 2 : id === 'performance' ? 4 : 6
      return svg(
        <>
          <path d="M8 12 L56 12 L52 28 L12 28Z" stroke="#555a63" />
          {Array.from({ length: n }, (_, i) => {
            const x = 16 + ((i + 0.5) * 32) / n
            return <line key={i} x1={x} y1="18" x2={x} y2={id === 'track' ? 34 : 31} stroke={accent} strokeWidth="2" />
          })}
        </>,
      )
    }
    case 'spoiler':
      return svg(
        <>
          <path d="M4 30 L22 18 L50 16 L60 22 L60 30" stroke="#555a63" />
          {id === 'lip' && <path d="M50 16 L57 13" stroke={ink} strokeWidth="2.4" />}
          {id === 'carbonLip' && <path d="M50 16 L57 13" stroke={accent} strokeWidth="2.4" />}
          {id === 'ducktail' && <path d="M44 16 L58 9" stroke={ink} strokeWidth="3" />}
          {id === 'wing' && (
            <>
              <path d="M44 6 L60 7" stroke={accent} strokeWidth="2.6" />
              <path d="M50 16 L50 7 M54 16 L54 7" stroke="#777" />
            </>
          )}
        </>,
      )
    case 'skirts':
      return svg(
        <>
          <path d="M4 14 L60 14 L60 26 L4 26Z" stroke="#555a63" />
          {id === 'stock' && <path d="M8 27 L56 27" stroke={ink} strokeWidth="2.2" />}
          {id === 'blade' && <path d="M8 28 L56 28" stroke="#0a0a0a" strokeWidth="3.4" />}
          {id === 'extended' && <path d="M6 30 L58 30" stroke={accent} strokeWidth="4" />}
        </>,
      )
    case 'sideAccent':
      return svg(
        <>
          <path d="M4 10 L60 10 L60 30 L4 30Z" stroke="#555a63" />
          {id === 'tricolour' && (
            <>
              <path d="M10 24 L54 24" stroke="#5fa8ff" strokeWidth="1.6" />
              <path d="M10 26 L54 26" stroke="#1c3f9e" strokeWidth="1.6" />
              <path d="M10 28 L54 28" stroke="#d4202f" strokeWidth="1.6" />
            </>
          )}
          {id === 'pinstripe' && <path d="M6 15 L58 15" stroke={accent} strokeWidth="1.4" />}
        </>,
      )
    case 'headlights':
      return svg(
        <>
          <path d="M8 22 L14 14 L56 12 L58 20 L50 26 L14 26Z" fill={id === 'shadow' ? '#050506' : '#1b1e23'} stroke="#555a63" />
          <path d="M16 16 L54 14.5" stroke={id === 'yellow' ? '#ffc533' : '#e8f1ff'} strokeWidth="2.2" />
          <path d="M17 16 L17 24 M33 15 L33 24" stroke={id === 'yellow' ? '#ffc533' : '#e8f1ff'} strokeWidth="1.6" />
        </>,
      )
    case 'taillights':
      return svg(
        <>
          <path d="M6 16 L56 12 L60 22 L54 28 L10 24Z" fill={id === 'smoked' ? '#16080a' : '#3a0710'} stroke="#555a63" />
          <path d="M10 18 L54 15 L56 24" stroke={id === 'laser' ? '#ff6b78' : '#ff2233'} strokeWidth={id === 'laser' ? 1.2 : 2.4} />
        </>,
      )
    case 'rimSize': {
      const r = id === 'r18' ? 9 : id === 'r19' ? 10.5 : 12
      return svg(
        <>
          <circle cx="32" cy="20" r="16" fill="#111" stroke="#333" />
          <circle cx="32" cy="20" r={r} stroke={ink} strokeWidth="2" />
        </>,
      )
    }
    case 'rideHeight': {
      const d = id === 'stock' ? 0 : id === 'sport' ? 2 : 4
      return svg(
        <>
          <path d={`M4 ${18 + d} L18 ${10 + d} L46 ${9 + d} L60 ${16 + d} L60 ${24 + d} L4 ${24 + d}Z`} stroke={ink} />
          <circle cx="16" cy="28" r="6" fill="#111" stroke="#666" />
          <circle cx="48" cy="28" r="6" fill="#111" stroke="#666" />
          <path d="M2 35 L62 35" stroke="#444" />
        </>,
      )
    }
    default:
      return svg(<rect x="12" y="10" width="40" height="20" rx="4" stroke="#555a63" />)
  }
}

export function Thumb({ group, option, config }: { group: OptionGroup; option: OptionBase<string>; config: Configuration }) {
  if (group.kind === 'wheel') {
    const st = WHEEL_STYLES.find((w) => w.id === option.id)
    return st ? <WheelIcon style={st} /> : null
  }
  const anyOpt = option as OptionBase<string> & { color?: string; material?: string }
  if (anyOpt.material) {
    const paint = PAINTS.find((p) => p.id === config.paint)
    const bodyColor = config.paint === 'custom' ? config.customPaint : paint?.color ?? '#888'
    const bg = anyOpt.material === 'paint' ? swatch(bodyColor) : FINISH_FILL[anyOpt.material]
    return <span className="thumb-swatch" style={{ background: bg }} />
  }
  if (anyOpt.color) {
    const color = option.id === 'custom' ? config.customPaint : anyOpt.color
    if (group.key === 'ambient') {
      return (
        <span className="thumb-swatch thumb-glow" style={{ background: option.id === 'off' ? '#141518' : color, boxShadow: option.id === 'off' ? 'none' : `0 0 14px ${color}` }} />
      )
    }
    return <span className="thumb-swatch" style={{ background: swatch(color, group.key !== 'seats' && group.key !== 'steering') }} />
  }
  return <Schematic group={group.key} id={option.id} />
}
