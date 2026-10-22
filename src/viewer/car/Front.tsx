import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { FRONT_ACCENTS, finishOf, type FrontAccentId, type GrilleId, type SplitterId } from '../../lib/configuration'
import { FrontBumperShell } from './Body'
import { HL, endOutline, endPatch, noseX, polygonShape, roundedRectShape, seamPoint } from './geometry'
import { useMat } from './materials'
import { Part } from './Part'

type Pt = [number, number]
const once = <T,>(fn: () => T) => {
  let v: T | undefined
  return () => (v ??= fn())
}
const MIRROR_Z: [number, number, number] = [1, 1, -1]

const circle = (cz: number, cy: number, r: number, n = 14): Pt[] =>
  Array.from({ length: n }, (_, i) => [cz + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r] as Pt)

const HEADLIGHT: Pt[] = [
  [0.31, 0.55],
  [0.44, 0.538],
  [0.72, 0.556],
  [0.83, 0.6],
  [0.78, 0.636],
  [0.34, 0.624],
]
const DRL_TOP: Pt[] = [
  [0.38, 0.606],
  [0.76, 0.618],
  [0.76, 0.627],
  [0.38, 0.615],
]
const DRL_HOOK_A: Pt[] = [
  [0.385, 0.56],
  [0.396, 0.56],
  [0.396, 0.607],
  [0.385, 0.607],
]
const DRL_HOOK_B: Pt[] = [
  [0.55, 0.56],
  [0.561, 0.56],
  [0.561, 0.611],
  [0.55, 0.611],
]
const INTAKE_CENTRE: Pt[] = [
  [-0.34, 0.27],
  [0.34, 0.27],
  [0.3, 0.4],
  [-0.3, 0.4],
]
const INTAKE_SIDE: Pt[] = [
  [0.46, 0.27],
  [0.7, 0.27],
  [0.74, 0.43],
  [0.6, 0.46],
  [0.5, 0.4],
]
const PLATE: Pt[] = [
  [-0.25, 0.29],
  [0.25, 0.29],
  [0.25, 0.405],
  [-0.25, 0.405],
]
const CURTAIN: Pt[] = [
  [0.765, 0.3],
  [0.79, 0.3],
  [0.8, 0.45],
  [0.775, 0.45],
]

const frontGeometry = once(() => ({
  lamp: {
    housing: endPatch('front', HEADLIGHT, 0.003),
    lens: endPatch('front', HEADLIGHT, 0.016),
    rim: endOutline('front', HEADLIGHT, 0.006, 0.005),
    drl: [endPatch('front', DRL_TOP, 0.008, 2, 20), endPatch('front', DRL_HOOK_A, 0.008, 6, 2), endPatch('front', DRL_HOOK_B, 0.008, 6, 2)],
    projectors: [endPatch('front', circle(0.47, 0.58, 0.025), 0.007, 6, 8), endPatch('front', circle(0.63, 0.585, 0.025), 0.007, 6, 8)],
    lensDots: [endPatch('front', circle(0.47, 0.58, 0.014), 0.009, 4, 6), endPatch('front', circle(0.63, 0.585, 0.014), 0.009, 4, 6)],
  },
  intakeCentre: endPatch('front', INTAKE_CENTRE, 0.002, 8, 40),
  intakeCentreFrame: endOutline('front', INTAKE_CENTRE, 0.004, 0.009),
  intakeSide: endPatch('front', INTAKE_SIDE, 0.002, 10, 12),
  intakeSideFrame: endOutline('front', INTAKE_SIDE, 0.004, 0.009),
  curtain: endPatch('front', CURTAIN, 0.002, 6, 3),
  plate: endPatch('front', PLATE, 0.018, 2, 20),
}))

// ---------- kidney grille ----------
const KIDNEY = { w: 0.25, h: 0.19, r: 0.055, z: 0.15, y: 0.505 }
const grilleGeometry = once(() => {
  const outer = roundedRectShape(KIDNEY.w, KIDNEY.h, KIDNEY.r)
  const inner = roundedRectShape(KIDNEY.w - 0.03, KIDNEY.h - 0.03, KIDNEY.r - 0.014)
  const ring = new THREE.Shape(outer.getPoints(24))
  ring.holes.push(new THREE.Path(inner.getPoints(24).reverse()))
  const frame = new THREE.ExtrudeGeometry(ring, { depth: 0.028, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 })
  frame.rotateY(Math.PI / 2)
  const backing = new THREE.ShapeGeometry(inner, 16)
  backing.rotateY(Math.PI / 2)
  const slat = new THREE.BoxGeometry(0.03, KIDNEY.h - 0.04, 0.009)
  return { frame, backing, slat }
})
const SLATS = [-0.088, -0.059, -0.029, 0, 0.029, 0.059, 0.088]

// ---------- splitters ----------
function splitterShape(halfWidth: number, protrude: number, depth: number) {
  const pts: Pt[] = []
  const n = 24
  for (let i = 0; i <= n; i++) {
    const z = -halfWidth + (2 * halfWidth * i) / n
    pts.push([noseX(0.3, z) + protrude, z])
  }
  for (let i = n; i >= 0; i--) {
    const z = -halfWidth + (2 * halfWidth * i) / n
    pts.push([noseX(0.3, z) - depth, z])
  }
  const g = new THREE.ExtrudeGeometry(polygonShape(pts), { depth: 0.014, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.003, bevelSegments: 2 })
  g.rotateX(Math.PI / 2)
  return g
}
const splitterGeometry = once(() => ({
  none: splitterShape(0.62, 0.012, 0.12),
  lip: splitterShape(0.74, 0.045, 0.2),
  track: splitterShape(0.82, 0.09, 0.26),
}))

export function FrontEnd({
  grille,
  splitter,
  accent,
}: {
  grille: GrilleId
  splitter: SplitterId
  accent: FrontAccentId
}) {
  const m = useMat()
  const f = frontGeometry()
  const accentMat = m.finish(finishOf(FRONT_ACCENTS, accent))
  return (
    <>
      <Part
        id="frontBumper"
        explode={[0.45, 0, 0]}
        hotspot={{ position: [noseX(0.36, 0.6) + 0.03, 0.36, 0.6], normal: [1, 0, 0.6], camera: 'fascia' }}
      >
        <FrontBumperShell />
        <mesh geometry={f.intakeCentre} material={m.get('honeycomb')} />
        <mesh geometry={f.intakeCentreFrame} material={accentMat} />
        <mesh geometry={f.plate} material={m.get('plate')} />
        {[1, -1].map((s) => (
          <group key={s} scale={s === 1 ? undefined : MIRROR_Z}>
            <mesh geometry={f.intakeSide} material={m.get('honeycomb')} />
            <mesh geometry={f.intakeSideFrame} material={accentMat} />
            <mesh geometry={f.curtain} material={m.get('glossBlack')} />
          </group>
        ))}
      </Part>
      <Grille grille={grille} />
      <Part
        id="splitter"
        explode={[0.75, -0.06, 0]}
        hotspot={{ position: [HL + 0.04, 0.215, 0.45], normal: [1, -0.1, 0.3], camera: 'fascia' }}
      >
        <mesh
          geometry={splitterGeometry()[splitter]}
          material={splitter === 'none' ? m.get('glossBlack') : m.get('carbon')}
          position={[0, 0.232, 0]}
        />
        {splitter === 'track' &&
          [1, -1].map((s) => (
            <mesh key={s} position={[noseX(0.3, 0.8) - 0.02, 0.255, s * 0.815]} material={m.get('carbon')}>
              <boxGeometry args={[0.2, 0.07, 0.012]} />
            </mesh>
          ))}
      </Part>
      <Headlights />
    </>
  )
}

function Grille({ grille }: { grille: GrilleId }) {
  const m = useMat()
  const g = grilleGeometry()
  const frameMat = grille === 'standard' ? m.get('chrome') : m.get('glossBlack')
  return (
    <Part id="grille" explode={[0.7, 0.05, 0]} hotspot={{ position: [HL + 0.05, KIDNEY.y + 0.1, 0], normal: [1, 0.2, 0], camera: 'fascia' }}>
      {[1, -1].map((s) => (
        <group key={s} position={[HL - 0.012, KIDNEY.y, s * KIDNEY.z]}>
          <mesh geometry={g.frame} material={frameMat} />
          <mesh geometry={g.backing} position={[0.014, 0, 0]} material={grille === 'performance' ? m.get('honeycomb') : m.get('matteBlack')} />
          {grille !== 'performance' &&
            SLATS.map((z) => (
              <mesh key={z} geometry={g.slat} position={[0.008, 0, z]} material={grille === 'glossBlack' ? m.get('glossBlack') : m.get('grilleSlat')} />
            ))}
        </group>
      ))}
    </Part>
  )
}

function Headlights() {
  const m = useMat()
  const l = frontGeometry().lamp
  return (
    <Part
      id="headlights"
      explode={[0.32, 0.06, 0.12]}
      hotspot={{ position: [noseX(0.62, 0.6) + 0.04, 0.63, 0.6], normal: [1, 0.1, 0.6], camera: 'fascia' }}
    >
      {[1, -1].map((s) => (
        <group key={s} scale={s === 1 ? undefined : MIRROR_Z}>
          <mesh geometry={l.housing} material={m.get('lampHousing')} />
          <mesh geometry={l.rim} material={m.get('glossBlack')} />
          {l.drl.map((g, i) => (
            <mesh key={i} geometry={g} material={m.get('drl')} />
          ))}
          {l.projectors.map((g, i) => (
            <mesh key={i} geometry={g} material={m.get('chrome')} />
          ))}
          {l.lensDots.map((g, i) => (
            <mesh key={i} geometry={g} material={m.get('glossBlack')} />
          ))}
          <mesh geometry={l.lens} material={m.get('lampLens')} renderOrder={3} />
        </group>
      ))}
    </Part>
  )
}

/** Simplified engine bay. It shows that the bonnet is a real separate part; it is not the B58's actual layout. */
export function EngineBay() {
  const m = useMat()
  const [ys] = seamPoint(1.4)
  return (
    <Part id="engine" hotspot={{ position: [1.45, ys + 0.05, -0.25], normal: [0, 1, 0], camera: 'engine' }}>
      <mesh position={[1.42, ys - 0.28, 0]} material={m.get('cavity')}>
        <boxGeometry args={[1.25, 0.32, 1.3]} />
      </mesh>
      <RoundedBox args={[0.82, 0.16, 0.5]} radius={0.05} smoothness={3} position={[1.38, ys - 0.15, -0.05]} material={m.get('engine')} />
      {[-0.25, -0.15, -0.05, 0.05, 0.15, 0.25].map((x) => (
        <mesh key={x} position={[1.38 + x, ys - 0.065, -0.05]} material={m.get('engineAccent')}>
          <boxGeometry args={[0.04, 0.01, 0.36]} />
        </mesh>
      ))}
      <mesh position={[1.0, ys - 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.get('chrome')}>
        <cylinderGeometry args={[0.018, 0.018, 1.2, 12]} />
      </mesh>
      <mesh position={[1.75, ys - 0.12, 0.45]} material={m.get('engine')}>
        <cylinderGeometry args={[0.07, 0.07, 0.14, 20]} />
      </mesh>
      <mesh position={[1.82, ys - 0.12, -0.48]} material={m.get('engine')}>
        <boxGeometry args={[0.16, 0.12, 0.14]} />
      </mesh>
    </Part>
  )
}
