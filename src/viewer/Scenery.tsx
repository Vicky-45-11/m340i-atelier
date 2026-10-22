import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { EnvironmentId } from '../store/configurator'

// Procedural scenery for the three environments. Everything is built from
// boxes and planes so nothing is downloaded. Lit surfaces use colours above
// 1.0 with tone mapping off so the bloom pass picks them up.

/** Deterministic pseudo-random numbers so the city looks the same on every load */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

interface Box {
  p: [number, number, number]
  s: [number, number, number]
  c?: THREE.ColorRepresentation
  k?: number
}

const tmp = new THREE.Object3D()
const tmpC = new THREE.Color()

/** One instanced mesh of boxes, each with its own transform and optional colour */
function Boxes({ boxes, material, glow = false }: { boxes: Box[]; material: THREE.Material; glow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  useEffect(() => () => geo.dispose(), [geo])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    boxes.forEach((b, i) => {
      tmp.position.set(...b.p)
      tmp.scale.set(...b.s)
      tmp.updateMatrix()
      m.setMatrixAt(i, tmp.matrix)
      if (b.c !== undefined) m.setColorAt(i, tmpC.set(b.c).multiplyScalar(b.k ?? 1))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [boxes])
  return <instancedMesh key={boxes.length} ref={ref} args={[geo, material, boxes.length]} castShadow={false} receiveShadow={!glow} raycast={() => null} />
}

function useMaterials() {
  const mats = useMemo(
    () => ({
      glow: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
      dark: new THREE.MeshStandardMaterial({ color: '#171b26', roughness: 0.55, metalness: 0.3 }),
      concrete: new THREE.MeshStandardMaterial({ color: '#2a2e35', roughness: 0.85 }),
      steel: new THREE.MeshStandardMaterial({ color: '#3a3f47', roughness: 0.4, metalness: 0.8 }),
      paint: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }),
    }),
    [],
  )
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])
  return mats
}

/** Midnight studio: accent floor ring and an arc of tall light strips */
function StudioScenery({ accent, light }: { accent: string; light: boolean }) {
  const m = useMaterials()
  const strips = useMemo<Box[]>(() => {
    const out: Box[] = []
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 0.62 + (i / 8) * Math.PI * 0.76
      out.push({ p: [Math.cos(a) * 13, 3.2, -Math.sin(a) * 13 + 2], s: [0.08, 6.4, 0.08], c: i % 4 === 0 ? accent : '#cfe0ff', k: light ? 0.9 : 1.6 })
    }
    return out
  }, [accent, light])
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} raycast={() => null}>
        <ringGeometry args={[3.55, 3.57, 128]} />
        <meshBasicMaterial color={accent} transparent opacity={light ? 0.5 : 0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} raycast={() => null}>
        <ringGeometry args={[5.2, 5.21, 128]} />
        <meshBasicMaterial color="#c9ced6" transparent opacity={0.12} />
      </mesh>
      <Boxes boxes={strips} material={m.glow} glow />
    </>
  )
}

/** Neon district: a wet street between dark towers with lit windows and signs */
function NeonScenery({ accent, mobile }: { accent: string; mobile: boolean }) {
  const m = useMaterials()
  const { towers, windows, lane, lamps } = useMemo(() => {
    const r = rng(7)
    const towers: Box[] = []
    const windows: Box[] = []
    const neon = ['#ff2f8f', '#22d3ff', accent, '#7a5cff', '#ffb35c']
    for (const side of [-1, 1]) {
      let x = -36
      while (x < 36) {
        const w = 3 + r() * 4
        const d = 3 + r() * 3
        const h = 6 + r() * (side < 0 ? 20 : 12)
        const z = side * (10 + r() * 2 + d / 2)
        towers.push({ p: [x + w / 2, h / 2, z], s: [w, h, d] })
        const face = z - side * (d / 2 + 0.02)
        // rows of lit windows on the face towards the street
        const rows = Math.floor(h / 1.6)
        for (let j = 1; j < rows; j++) {
          if (r() < (mobile ? 0.55 : 0.35)) continue
          // a run of window panes along the floor
          const panes = Math.floor(w / 0.7)
          const first = Math.floor(r() * panes * 0.5)
          const last = first + 1 + Math.floor(r() * (panes - first))
          const warm = r() < 0.3
          const glow = 0.5 + r() * 0.9
          for (let q = first; q < Math.min(panes, last); q++) {
            windows.push({ p: [x + 0.35 + q * 0.7 + (w - panes * 0.7) / 2, j * 1.6, face], s: [0.46, 0.5, 0.03], c: warm ? '#ffc27a' : '#cfd9ff', k: glow })
          }
        }
        // vertical neon sign on some towers
        if (r() < 0.45) windows.push({ p: [x + 0.4, 3 + r() * 3, face - side * 0.08], s: [0.12, 2.5 + r() * 3, 0.12], c: neon[Math.floor(r() * neon.length)], k: 3 })
        x += w + 0.6 + r() * 1.5
      }
    }
    const lane: Box[] = []
    for (let x = -40; x < 40; x += 3.2) {
      lane.push({ p: [x, 0.004, 2.4], s: [1.4, 0.004, 0.09], c: '#c9ced6', k: 0.5 })
      lane.push({ p: [x + 1.6, 0.004, -2.4], s: [1.4, 0.004, 0.09], c: '#c9ced6', k: 0.5 })
    }
    for (const z of [-5.6, 5.6]) lane.push({ p: [0, 0.004, z], s: [80, 0.004, 0.12], c: accent, k: 1.4 })
    const lamps: Box[] = []
    const heads: Box[] = []
    for (let x = -32; x <= 32; x += 12) {
      for (const z of [-7.4, 7.4]) {
        lamps.push({ p: [x, 2.8, z], s: [0.12, 5.6, 0.12] })
        lamps.push({ p: [x, 5.6, z * 0.9], s: [0.1, 0.1, 1.4] })
        heads.push({ p: [x, 5.52, z * 0.83], s: [0.5, 0.06, 0.24], c: '#ffd9a8', k: 4 })
      }
    }
    return { towers, windows: [...windows, ...heads], lane, lamps }
  }, [accent, mobile])
  return (
    <>
      <Boxes boxes={towers} material={m.dark} />
      <Boxes boxes={lamps} material={m.steel} />
      <Boxes boxes={windows} material={m.glow} glow />
      <Boxes boxes={lane} material={m.glow} glow />
    </>
  )
}

const LIGHT_X = 9
/** Performance circuit: kerbs, start gantry with animated start lights, floodlights and grandstand */
function TrackScenery({ accent, mobile }: { accent: string; mobile: boolean }) {
  const m = useMaterials()
  const lights = useRef<THREE.InstancedMesh>(null)
  const { kerbs, lines, structure, glow } = useMemo(() => {
    const kerbs: Box[] = []
    for (let x = -44, i = 0; x < 44; x += 1, i++) {
      for (const z of [-5.9, 5.9]) kerbs.push({ p: [x + 0.5, 0.02, z], s: [1, 0.04, 0.6], c: i % 2 ? '#e8ecf2' : '#d0202c' })
    }
    const lines: Box[] = []
    for (const z of [-5.45, 5.45]) lines.push({ p: [0, 0.003, z], s: [88, 0.004, 0.12], c: '#e8ecf2', k: 0.8 })
    // chequered start line ahead of the car
    for (let j = 0; j < 22; j++) for (let k = 0; k < 2; k++) if ((j + k) % 2 === 0) lines.push({ p: [3.4 + k * 0.25, 0.004, -5.25 + j * 0.5], s: [0.25, 0.004, 0.5], c: '#e8ecf2', k: 0.9 })
    // grid box around the car
    lines.push({ p: [0, 0.003, 1.25], s: [5.4, 0.004, 0.06], c: '#e8ecf2', k: 0.6 }, { p: [0, 0.003, -1.25], s: [5.4, 0.004, 0.06], c: '#e8ecf2', k: 0.6 })
    const structure: Box[] = [
      // start gantry
      { p: [LIGHT_X, 3, -6.6], s: [0.35, 6, 0.35] },
      { p: [LIGHT_X, 3, 6.6], s: [0.35, 6, 0.35] },
      { p: [LIGHT_X, 6.1, 0], s: [0.5, 0.6, 13.6] },
      { p: [LIGHT_X - 0.05, 5.2, 0], s: [0.3, 0.9, 3.4] },
      // pit wall and grandstand
      { p: [0, 0.55, -8.2], s: [88, 1.1, 0.4] },
      { p: [0, 1.8, -13], s: [60, 3.6, 4] },
      { p: [0, 3.6, -15.5], s: [60, 3.6, 3] },
      { p: [0, 5.4, -17.5], s: [60, 3.6, 2] },
      { p: [0, 9, -18.8], s: [62, 0.3, 4.6] },
      // armco on the far side
      { p: [0, 0.45, 9], s: [88, 0.32, 0.12] },
    ]
    const glow: Box[] = [{ p: [0, 0.9, -7.99], s: [88, 0.08, 0.02], c: accent, k: 2.2 }]
    const towerX = mobile ? [-16, 16] : [-24, -8, 8, 24]
    for (const x of towerX) {
      for (const z of [-11, 12]) {
        structure.push({ p: [x, 7, z], s: [0.3, 14, 0.3] })
        glow.push({ p: [x, 14.2, z - Math.sign(z) * 0.2], s: [2.2, 1.1, 0.08], c: '#f4f7ff', k: 5 })
      }
    }
    return { kerbs, lines, structure, glow }
  }, [accent, mobile])

  // five start lights: on one by one, hold, then lights out
  useFrame(({ clock }) => {
    const l = lights.current
    if (!l) return
    const t = clock.elapsedTime % 9
    for (let i = 0; i < 5; i++) {
      const on = t > 1 + i * 0.8 && t < 6
      l.setColorAt(i, tmpC.set(on ? '#ff2433' : '#2a0b0e').multiplyScalar(on ? 4 : 1))
    }
    if (l.instanceColor) l.instanceColor.needsUpdate = true
  })
  const lamps = useMemo<Box[]>(() => [0, 1, 2, 3, 4].map((i) => ({ p: [LIGHT_X - 0.22, 5.2, -1.2 + i * 0.6], s: [0.06, 0.34, 0.34], c: '#2a0b0e' })), [])

  return (
    <>
      <Boxes boxes={kerbs} material={m.paint} />
      <Boxes boxes={lines} material={m.glow} glow />
      <Boxes boxes={structure} material={m.concrete} />
      <Boxes boxes={glow} material={m.glow} glow />
      <LightsInstanced meshRef={lights} boxes={lamps} material={m.glow} />
    </>
  )
}

function LightsInstanced({ meshRef: ref, boxes, material }: { meshRef: React.RefObject<THREE.InstancedMesh>; boxes: Box[]; material: THREE.Material }) {
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  useEffect(() => () => geo.dispose(), [geo])
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    boxes.forEach((b, i) => {
      tmp.position.set(...b.p)
      tmp.scale.set(...b.s)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
      mesh.setColorAt(i, tmpC.set(b.c ?? '#ffffff'))
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [boxes, ref])
  return <instancedMesh ref={ref} args={[geo, material, boxes.length]} raycast={() => null} />
}

export function Scenery({ environment, accent, light, mobile }: { environment: EnvironmentId; accent: string; light: boolean; mobile: boolean }) {
  if (environment === 'night') return <NeonScenery accent={accent} mobile={mobile} />
  if (environment === 'track') return <TrackScenery accent={accent} mobile={mobile} />
  return <StudioScenery accent={accent} light={light} />
}
