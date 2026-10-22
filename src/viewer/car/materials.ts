import { createContext, useContext, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  AMBIENTS,
  CALIPERS,
  DASH_TRIMS,
  EXHAUSTS,
  SEATS,
  STEERINGS,
  STITCHES,
  colorOf,
  paintOf,
  wheelOf,
  type Configuration,
  type ViewMode,
} from '../../lib/configuration'

export type MatKey =
  | 'paint'
  | 'glossBlack'
  | 'matteBlack'
  | 'carbon'
  | 'chrome'
  | 'rubber'
  | 'glass'
  | 'liner'
  | 'cavity'
  | 'grilleSlat'
  | 'lampHousing'
  | 'lampLens'
  | 'drl'
  | 'tailLens'
  | 'tailGlow'
  | 'mirrorGlass'
  | 'rim'
  | 'rimFace'
  | 'disc'
  | 'caliper'
  | 'exhaust'
  | 'seat'
  | 'seatAccent'
  | 'cabin'
  | 'dashTrim'
  | 'steering'
  | 'ambient'
  | 'screen'
  | 'headliner'
  | 'engine'
  | 'engineAccent'
  | 'stripeBlue'
  | 'stripeDark'
  | 'stripeRed'
  | 'honeycomb'
  | 'plate'
  | 'plateRear'

export type FinishMaterial = 'paint' | 'glossBlack' | 'carbon' | 'chrome' | 'matteBlack'

let carbonTexture: THREE.CanvasTexture | null = null
function getCarbonTexture(): THREE.CanvasTexture | null {
  if (carbonTexture) return carbonTexture
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  if (!g) return null
  g.fillStyle = '#121316'
  g.fillRect(0, 0, 64, 64)
  // 2x2 twill weave
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const on = (x + y) % 4 < 2
      const grad = g.createLinearGradient(x * 8, y * 8, x * 8 + (on ? 8 : 0), y * 8 + (on ? 0 : 8))
      grad.addColorStop(0, on ? '#24262b' : '#17181b')
      grad.addColorStop(0.5, on ? '#3a3d44' : '#26282d')
      grad.addColorStop(1, on ? '#1c1d21' : '#141518')
      g.fillStyle = grad
      g.fillRect(x * 8 + 0.5, y * 8 + 0.5, 7, 7)
    }
  }
  carbonTexture = new THREE.CanvasTexture(c)
  carbonTexture.wrapS = carbonTexture.wrapT = THREE.RepeatWrapping
  carbonTexture.repeat.set(10, 10)
  carbonTexture.colorSpace = THREE.SRGBColorSpace
  carbonTexture.anisotropy = 4
  return carbonTexture
}

let honeycombTexture: THREE.CanvasTexture | null = null
function getHoneycombTexture(): THREE.CanvasTexture | null {
  if (honeycombTexture) return honeycombTexture
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = 60
  c.height = 52
  const g = c.getContext('2d')
  if (!g) return null
  g.fillStyle = '#020203'
  g.fillRect(0, 0, 60, 52)
  g.strokeStyle = '#3a3e45'
  g.lineWidth = 3
  const hex = (cx: number, cy: number) => {
    g.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i
      const x = cx + Math.cos(a) * 9
      const y = cy + Math.sin(a) * 9
      if (i) g.lineTo(x, y)
      else g.moveTo(x, y)
    }
    g.closePath()
    g.stroke()
  }
  for (const [x, y] of [[0, 0], [30, 0], [60, 0], [15, 26], [45, 26], [0, 52], [30, 52], [60, 52]]) hex(x, y)
  honeycombTexture = new THREE.CanvasTexture(c)
  honeycombTexture.wrapS = honeycombTexture.wrapT = THREE.RepeatWrapping
  honeycombTexture.repeat.set(26, 5)
  honeycombTexture.colorSpace = THREE.SRGBColorSpace
  return honeycombTexture
}

function plateTexture(mirror: boolean): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 120
  const g = c.getContext('2d')
  if (!g) return null
  g.fillStyle = '#f4f5f2'
  g.fillRect(0, 0, 512, 120)
  g.strokeStyle = '#1a1b1e'
  g.lineWidth = 6
  g.strokeRect(6, 6, 500, 108)
  g.fillStyle = '#121316'
  g.font = '700 64px "JetBrains Mono", ui-monospace, monospace'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('M340i ATELIER', 256, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  if (mirror) {
    t.wrapS = THREE.RepeatWrapping
    t.repeat.x = -1
  }
  return t
}

const phys = (p: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(p)
const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p)

function createMaterials(): Record<MatKey, THREE.Material> {
  const carbon = getCarbonTexture()
  return {
    paint: phys({ color: '#1a4fa8', metalness: 0.7, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.2 }),
    glossBlack: phys({ color: '#060708', metalness: 0.2, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05 }),
    matteBlack: std({ color: '#141518', metalness: 0.1, roughness: 0.75 }),
    carbon: phys({ color: '#ffffff', map: carbon, metalness: 0.35, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.06 }),
    chrome: std({ color: '#e6e9ee', metalness: 1, roughness: 0.06 }),
    rubber: std({ color: '#121314', metalness: 0, roughness: 0.88, side: THREE.DoubleSide }),
    glass: phys({ color: '#0d1117', metalness: 0.1, roughness: 0.03, transparent: true, opacity: 0.42, depthWrite: false, envMapIntensity: 1.6, side: THREE.DoubleSide }),
    liner: std({ color: '#0b0c0d', metalness: 0, roughness: 0.95, side: THREE.BackSide }),
    cavity: std({ color: '#0a0b0c', metalness: 0, roughness: 0.9, side: THREE.BackSide }),
    grilleSlat: phys({ color: '#0b0c0e', metalness: 0.4, roughness: 0.25, clearcoat: 0.6 }),
    lampHousing: std({ color: '#15171b', metalness: 0.85, roughness: 0.25 }),
    lampLens: phys({ color: '#ffffff', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.18, depthWrite: false, envMapIntensity: 2 }),
    drl: std({ color: '#ffffff', emissive: '#e8f1ff', emissiveIntensity: 3.2, toneMapped: false }),
    tailLens: phys({ color: '#5a0710', metalness: 0.1, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.5 }),
    tailGlow: std({ color: '#ff2233', emissive: '#ff1428', emissiveIntensity: 2.6, toneMapped: false }),
    mirrorGlass: std({ color: '#c8d0dc', metalness: 1, roughness: 0.02 }),
    rim: std({ color: '#b9bec4', metalness: 0.85, roughness: 0.3 }),
    rimFace: std({ color: '#d9dde2', metalness: 0.95, roughness: 0.15 }),
    disc: std({ color: '#5d6066', metalness: 0.9, roughness: 0.45 }),
    caliper: phys({ color: '#1f56c9', metalness: 0.3, roughness: 0.3, clearcoat: 1 }),
    exhaust: std({ color: '#2b2d31', metalness: 1, roughness: 0.18, side: THREE.DoubleSide }),
    seat: std({ color: '#141416', metalness: 0, roughness: 0.62 }),
    seatAccent: std({ color: '#2f6bff', metalness: 0, roughness: 0.5 }),
    cabin: std({ color: '#121315', metalness: 0, roughness: 0.8, side: THREE.DoubleSide }),
    dashTrim: std({ color: '#9da2a8', metalness: 0.8, roughness: 0.3 }),
    steering: std({ color: '#121214', metalness: 0, roughness: 0.6 }),
    ambient: std({ color: '#000000', emissive: '#2f7bff', emissiveIntensity: 2.4, toneMapped: false }),
    screen: std({ color: '#05070b', emissive: '#16304f', emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.1 }),
    headliner: std({ color: '#2a2b2e', metalness: 0, roughness: 0.95, side: THREE.BackSide }),
    engine: std({ color: '#1b1c1f', metalness: 0.5, roughness: 0.5 }),
    engineAccent: std({ color: '#2f6bff', metalness: 0.4, roughness: 0.4 }),
    stripeBlue: std({ color: '#5fa8ff', metalness: 0.2, roughness: 0.4 }),
    stripeDark: std({ color: '#1c3f9e', metalness: 0.2, roughness: 0.4 }),
    stripeRed: std({ color: '#d4202f', metalness: 0.2, roughness: 0.4 }),
    plate: std({ color: '#ffffff', map: plateTexture(true), roughness: 0.4, metalness: 0, side: THREE.DoubleSide }),
    plateRear: std({ color: '#ffffff', map: plateTexture(false), roughness: 0.4, metalness: 0, side: THREE.DoubleSide }),
    honeycomb: std({ color: '#ffffff', map: getHoneycombTexture(), metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }),
  }
}

function createTechMaterials() {
  return {
    wire: new THREE.MeshBasicMaterial({ color: '#4c9bff', wireframe: true, transparent: true, opacity: 0.32, depthWrite: false }),
    ghost: new THREE.MeshPhysicalMaterial({
      color: '#7fb4ff',
      emissive: '#1d4fbf',
      emissiveIntensity: 0.6,
      metalness: 0,
      roughness: 0.4,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
    glass: new THREE.MeshBasicMaterial({ color: '#4c9bff', transparent: true, opacity: 0.05, depthWrite: false }),
  }
}

const SHELL: MatKey[] = ['paint', 'cavity', 'liner', 'headliner', 'cabin']

export interface CarMaterials {
  get: (key: MatKey) => THREE.Material
  finish: (f: FinishMaterial) => THREE.Material
}

export function useCarMaterials(cfg: Configuration, mode: ViewMode): CarMaterials {
  const mats = useMemo(createMaterials, [])
  const tech = useMemo(createTechMaterials, [])

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose())
      Object.values(tech).forEach((m) => m.dispose())
    },
    [mats, tech],
  )

  // Paint only touches the paint material, so glass, rubber and trim keep their own response.
  const paint = paintOf(cfg)
  useEffect(() => {
    const m = mats.paint as THREE.MeshPhysicalMaterial
    m.color.set(paint.color)
    m.metalness = paint.metalness
    m.roughness = paint.roughness
    m.clearcoat = paint.clearcoat
    m.clearcoatRoughness = paint.finish === 'Matte' ? 0.5 : 0.04
    m.needsUpdate = true
  }, [mats, paint.color, paint.metalness, paint.roughness, paint.clearcoat, paint.finish])

  const wheel = wheelOf(cfg)
  useEffect(() => {
    const r = mats.rim as THREE.MeshStandardMaterial
    r.color.set(wheel.color)
    r.metalness = wheel.metalness
    r.roughness = wheel.roughness
    ;(mats.rimFace as THREE.MeshStandardMaterial).color.set(wheel.faceColor ?? wheel.color)
  }, [mats, wheel])

  useEffect(() => {
    ;(mats.caliper as THREE.MeshPhysicalMaterial).color.set(colorOf(CALIPERS, cfg.caliper))
    const ex = mats.exhaust as THREE.MeshStandardMaterial
    ex.color.set(colorOf(EXHAUSTS, cfg.exhaust))
    ex.map = cfg.exhaust === 'carbon' ? getCarbonTexture() : null
    ex.roughness = cfg.exhaust === 'carbon' ? 0.35 : cfg.exhaust === 'chrome' ? 0.05 : 0.2
    ex.metalness = cfg.exhaust === 'carbon' ? 0.3 : 1
    if (cfg.exhaust === 'carbon') ex.color.set('#ffffff')
    ex.needsUpdate = true
  }, [mats, cfg.caliper, cfg.exhaust])

  useEffect(() => {
    const drl = mats.drl as THREE.MeshStandardMaterial
    const housing = mats.lampHousing as THREE.MeshStandardMaterial
    drl.emissive.set(cfg.headlights === 'yellow' ? '#ffc533' : '#e8f1ff')
    drl.color.set(cfg.headlights === 'yellow' ? '#ffd56a' : '#ffffff')
    housing.color.set(cfg.headlights === 'shadow' ? '#050506' : '#1b1e23')
    housing.metalness = cfg.headlights === 'shadow' ? 0.4 : 0.85
    const lens = mats.tailLens as THREE.MeshPhysicalMaterial
    const glow = mats.tailGlow as THREE.MeshStandardMaterial
    lens.color.set(cfg.taillights === 'smoked' ? '#16080a' : '#5a0710')
    glow.emissiveIntensity = cfg.taillights === 'smoked' ? 1.6 : cfg.taillights === 'laser' ? 4.5 : 2.6
    glow.emissive.set(cfg.taillights === 'laser' ? '#ff3a4a' : '#ff1428')
  }, [mats, cfg.headlights, cfg.taillights])

  useEffect(() => {
    ;(mats.seat as THREE.MeshStandardMaterial).color.set(colorOf(SEATS, cfg.seats))
    ;(mats.seatAccent as THREE.MeshStandardMaterial).color.set(colorOf(STITCHES, cfg.stitching))
    ;(mats.engineAccent as THREE.MeshStandardMaterial).color.set(colorOf(STITCHES, cfg.stitching))
    const dash = mats.dashTrim as THREE.MeshStandardMaterial
    dash.color.set(cfg.dashTrim === 'carbon' ? '#ffffff' : colorOf(DASH_TRIMS, cfg.dashTrim))
    dash.map = cfg.dashTrim === 'carbon' ? getCarbonTexture() : null
    dash.metalness = cfg.dashTrim === 'aluminium' ? 0.85 : cfg.dashTrim === 'carbon' ? 0.3 : 0
    dash.roughness = cfg.dashTrim === 'wood' ? 0.7 : 0.3
    dash.needsUpdate = true
    const st = mats.steering as THREE.MeshStandardMaterial
    st.color.set(colorOf(STEERINGS, cfg.steering))
    st.roughness = cfg.steering === 'alcantara' ? 0.95 : 0.55
    const amb = mats.ambient as THREE.MeshStandardMaterial
    amb.emissive.set(colorOf(AMBIENTS, cfg.ambient))
    amb.emissiveIntensity = cfg.ambient === 'off' ? 0 : 2.4
  }, [mats, cfg.seats, cfg.stitching, cfg.dashTrim, cfg.steering, cfg.ambient])

  return useMemo<CarMaterials>(() => {
    const get = (key: MatKey): THREE.Material => {
      if (mode !== 'technical') return mats[key]
      if (key === 'glass' || key === 'lampLens') return tech.glass
      if (SHELL.includes(key)) return tech.wire
      return tech.ghost
    }
    return { get, finish: (f) => get(f) }
  }, [mats, tech, mode])
}

export const CarMaterialsContext = createContext<CarMaterials | null>(null)

export function useMat(): CarMaterials {
  const m = useContext(CarMaterialsContext)
  if (!m) throw new Error('useMat must be used inside a car')
  return m
}
