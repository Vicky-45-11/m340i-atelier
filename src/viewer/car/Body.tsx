import { useFrame } from '@react-three/fiber'
import { useContext, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { ROOFS, finishOf, type HoodId, type RoofId, type SideAccentId } from '../../lib/configuration'
import {
  ARCH_RADIUS,
  AXLE_FRONT,
  AXLE_REAR,
  COWL_X,
  DECK_X,
  HL,
  HOOD_FRONT_X,
  REAR_BUMPER_X,
  TYRE_RADIUS,
  bodyHalfWidth,
  bodyStations,
  greenhousePoint,
  gridSurface,
  lidSection,
  loft,
  openSection,
  ringSection,
  seamPoint,
  shutLine,
  sideRibbon,
  stations,
  surfaceY,
  surfaceZ,
  tubeAlong,
} from './geometry'
import { useMat } from './materials'
import { CarContext, Part } from './Part'

const RING_STEPS = 88
const once = <T,>(fn: () => T) => {
  let v: T | undefined
  return () => (v ??= fn())
}

export const shellGeometry = once(() => ({
  frontBumper: loft(bodyStations(HOOD_FRONT_X, HL), 0, 1, RING_STEPS, ringSection, { capEnd: true }),
  frontBody: loft(bodyStations(COWL_X, HOOD_FRONT_X), 0, 1, 64, openSection),
  hood: loft(bodyStations(COWL_X + 0.012, HOOD_FRONT_X - 0.006), 0, 1, 28, lidSection(0.006, 0.0015)),
  cabin: loft(bodyStations(DECK_X, COWL_X), 0, 1, 64, openSection),
  rearBody: loft(bodyStations(REAR_BUMPER_X, DECK_X), 0, 1, RING_STEPS, ringSection),
  rearBumper: loft(bodyStations(-HL, REAR_BUMPER_X), 0, 1, RING_STEPS, ringSection, { capStart: true }),
}))

// Greenhouse bands, in the phi parameter of greenhousePoint
const PHI_WINDOW_TOP = 0.5
const PHI_ROOF = 0.64
const ROOF_FRONT = 0.1
const ROOF_REAR = -1.02
const C_PILLAR = -1.18
const B_PILLAR: [number, number] = [-0.44, -0.37]

const greenhouseGeometry = once(() => {
  const xs = stations(DECK_X, COWL_X, 0.02)
  const sec = (inflate: number, a: number, b: number) => (x: number, t: number) => greenhousePoint(x, a + (b - a) * t, inflate)
  const rail = (a: number, b: number) => loft(xs, 0, 1, 6, sec(0.004, a, b))
  return {
    glass: loft(xs, 0, 1, 64, sec(0, 0, Math.PI)),
    railL: rail(PHI_WINDOW_TOP, PHI_ROOF),
    railR: rail(Math.PI - PHI_ROOF, Math.PI - PHI_WINDOW_TOP),
    roof: loft(stations(ROOF_REAR, ROOF_FRONT, 0.02), 0, 1, 32, sec(0.004, PHI_ROOF - 0.02, Math.PI - PHI_ROOF + 0.02)),
    cL: loft(stations(DECK_X, C_PILLAR, 0.02), 0, 1, 10, sec(0.004, 0, PHI_WINDOW_TOP + 0.01)),
    cR: loft(stations(DECK_X, C_PILLAR, 0.02), 0, 1, 10, sec(0.004, Math.PI - PHI_WINDOW_TOP - 0.01, Math.PI)),
    bL: loft(stations(B_PILLAR[0], B_PILLAR[1], 0.01), 0, 1, 10, sec(0.005, 0, PHI_WINDOW_TOP)),
    bR: loft(stations(B_PILLAR[0], B_PILLAR[1], 0.01), 0, 1, 10, sec(0.005, Math.PI - PHI_WINDOW_TOP, Math.PI)),
    sailL: loft(stations(0.5, COWL_X - 0.01, 0.01), 0, 1, 10, sec(0.005, 0, PHI_WINDOW_TOP)),
    sailR: loft(stations(0.5, COWL_X - 0.01, 0.01), 0, 1, 10, sec(0.005, Math.PI - PHI_WINDOW_TOP, Math.PI)),
    headliner: loft(stations(-1.3, 0.35, 0.03), 0, 1, 24, sec(-0.03, 0.3, Math.PI - 0.3)),
  }
})

/** Window surround tubes on the +z side; the -z side is mirrored */
export const windowTrimGeometry = once(() => {
  const belt: THREE.Vector3[] = []
  const top: THREE.Vector3[] = []
  for (const x of stations(C_PILLAR, 0.56, 0.04)) {
    const [ys, zs] = seamPoint(x)
    belt.push(new THREE.Vector3(x, ys + 0.004, zs + 0.004))
  }
  for (const x of stations(C_PILLAR, 0.5, 0.04)) {
    const [y, z] = greenhousePoint(x, PHI_WINDOW_TOP, 0.008)
    top.push(new THREE.Vector3(x, y, z))
  }
  return { belt: tubeAlong(belt, 0.009), top: tubeAlong(top, 0.007) }
})

const detailGeometry = once(() => {
  const seam = (x: number) => seamPoint(x)[0] - 0.01
  const lines = [
    shutLine(COWL_X - 0.04, 0.26, seam(COWL_X - 0.04)),
    shutLine(-0.41, 0.215, seam(-0.41)),
    shutLine(-1.16, 0.66, seam(-1.16)),
  ]
  const sill = sideRibbon(-0.95, COWL_X - 0.04, 0.232, 0.238, 0.0015, 40)
  const handle = new THREE.CapsuleGeometry(0.012, 0.11, 4, 10)
  handle.rotateZ(Math.PI / 2)
  return { lines, sill, handle }
})

export const accentGeometry = once(() => ({
  tri: [
    sideRibbon(AXLE_REAR + ARCH_RADIUS + 0.04, AXLE_FRONT - ARCH_RADIUS - 0.04, 0.3, 0.314, 0.0035, 50),
    sideRibbon(AXLE_REAR + ARCH_RADIUS + 0.04, AXLE_FRONT - ARCH_RADIUS - 0.04, 0.318, 0.332, 0.0035, 50),
    sideRibbon(AXLE_REAR + ARCH_RADIUS + 0.04, AXLE_FRONT - ARCH_RADIUS - 0.04, 0.336, 0.35, 0.0035, 50),
  ],
  pin: sideRibbon(-2.05, 2.0, 0.742, 0.749, 0.0035, 120),
}))

const linerGeometry = once(() => {
  const g = new THREE.CylinderGeometry(ARCH_RADIUS - 0.004, ARCH_RADIUS - 0.004, bodyHalfWidth(AXLE_FRONT) * 2 - 0.02, 40, 1, true, Math.PI / 2, Math.PI)
  g.rotateX(Math.PI / 2)
  return g
})

const MIRROR_Z: [number, number, number] = [1, 1, -1]

const finFin = once(() => {
  const sh = new THREE.Shape()
  sh.moveTo(0.075, 0)
  sh.quadraticCurveTo(0.0, 0.02, -0.055, 0.062)
  sh.lineTo(-0.085, 0.058)
  sh.quadraticCurveTo(-0.095, 0.03, -0.095, 0)
  sh.closePath()
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.01, bevelSegments: 3, curveSegments: 10 })
  g.translate(0, 0, -0.015)
  return g
})
const FIN_X = -0.98

/** The painted shell, glass and fixed details. Paint never touches glass, rubber or trim. */
export function BodyShell({ accent, roof }: { accent: SideAccentId; roof: RoofId }) {
  const m = useMat()
  const shell = shellGeometry()
  const gh = greenhouseGeometry()
  const det = detailGeometry()
  const acc = accentGeometry()
  const paint = m.get('paint')
  const cavity = m.get('cavity')
  const roofMat = m.finish(finishOf(ROOFS, roof))
  const finY = greenhousePoint(FIN_X, Math.PI / 2, 0.004)[0] - 0.004
  const handleZ = (x: number, y: number) => surfaceZ(x, y) + 0.006

  return (
    <Part id="body" hotspot={{ position: [-0.15, 0.62, surfaceZ(-0.15, 0.62) + 0.02], normal: [0, 0.2, 1], camera: 'side' }}>
      {(['frontBody', 'cabin', 'rearBody'] as const).map((k) => (
        <group key={k}>
          <mesh geometry={shell[k]} material={paint} />
          <mesh geometry={shell[k]} material={cavity} />
        </group>
      ))}
      <mesh geometry={linerGeometry()} position={[AXLE_FRONT, TYRE_RADIUS, 0]} material={m.get('liner')} />
      <mesh geometry={linerGeometry()} position={[AXLE_REAR, TYRE_RADIUS, 0]} material={m.get('liner')} />

      {/* greenhouse: glass all round, painted roof and pillars over it */}
      <mesh geometry={gh.glass} material={m.get('glass')} renderOrder={2} />
      <mesh geometry={gh.headliner} material={m.get('headliner')} />
      {[gh.railL, gh.railR, gh.cL, gh.cR].map((g, i) => (
        <mesh key={i} geometry={g} material={paint} />
      ))}
      <mesh geometry={gh.roof} material={roofMat} />
      <mesh geometry={finFin()} position={[FIN_X, finY, 0]} material={roof === 'body' ? m.get('glossBlack') : roofMat} />
      {[gh.bL, gh.bR, gh.sailL, gh.sailR].map((g, i) => (
        <mesh key={i} geometry={g} material={m.get('glossBlack')} />
      ))}

      {[1, -1].map((s) => (
        <group key={s} scale={s === 1 ? undefined : MIRROR_Z}>
          {det.lines.map((g, i) => (
            <mesh key={i} geometry={g} material={m.get('matteBlack')} />
          ))}
          <mesh geometry={det.sill} material={m.get('matteBlack')} />
          <mesh geometry={det.handle} material={paint} position={[0.16, 0.815, handleZ(0.16, 0.815)]} />
          <mesh geometry={det.handle} material={paint} position={[-0.86, 0.825, handleZ(-0.86, 0.825)]} />
          {accent === 'tricolour' && (
            <>
              <mesh geometry={acc.tri[0]} material={m.get('stripeBlue')} />
              <mesh geometry={acc.tri[1]} material={m.get('stripeDark')} />
              <mesh geometry={acc.tri[2]} material={m.get('stripeRed')} />
            </>
          )}
          {accent === 'pinstripe' && <mesh geometry={acc.pin} material={m.get('ambient')} />}
        </group>
      ))}
    </Part>
  )
}

export function FrontBumperShell({ children }: { children?: ReactNode }) {
  const m = useMat()
  const shell = shellGeometry()
  return (
    <>
      <mesh geometry={shell.frontBumper} material={m.get('paint')} />
      <mesh geometry={shell.frontBumper} material={m.get('cavity')} />
      {children}
    </>
  )
}

export function RearBumperShell() {
  const m = useMat()
  const shell = shellGeometry()
  return (
    <>
      <mesh geometry={shell.rearBumper} material={m.get('paint')} />
      <mesh geometry={shell.rearBumper} material={m.get('cavity')} />
    </>
  )
}

// Power dome: a smooth bump that fades into the bonnet at every edge
const domeGeometry = once(() => {
  const x0 = 1.0
  const x1 = 1.98
  return gridSurface(40, 30, (i, j) => {
    const u = i / 40
    const x = x0 + (x1 - x0) * u
    const half = 0.32 - 0.1 * u
    const v = -1 + (2 * j) / 30
    const z = v * half
    const h = 0.032 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.6) * Math.pow(1 - v * v, 1.6)
    return new THREE.Vector3(x, surfaceY(x, z) + 0.0025 + h, z)
  })
})
const extractorGeometry = once(() => {
  const vent = gridSurface(10, 10, (i, j) => {
    const x = 1.46 + (0.3 * i) / 10
    const z = 0.36 + (0.15 * j) / 10 - (i / 10) * 0.03
    return new THREE.Vector3(x, surfaceY(x, z) + 0.006, z)
  })
  const rim: THREE.Vector3[] = []
  const corners: [number, number][] = [
    [1.46, 0.36],
    [1.76, 0.33],
    [1.76, 0.48],
    [1.46, 0.51],
  ]
  for (let k = 0; k < 4; k++) {
    const [ax, az] = corners[k]
    const [bx, bz] = corners[(k + 1) % 4]
    for (let t = 0; t < 1; t += 0.2) {
      const x = ax + (bx - ax) * t
      const z = az + (bz - az) * t
      rim.push(new THREE.Vector3(x, surfaceY(x, z) + 0.007, z))
    }
  }
  return { vent, rim: tubeAlong(rim, 0.006, true) }
})

/** Bonnet on a hinge at the windscreen base; opens for the engine-bay view and exploded mode */
export function Hood({ open, variant }: { open: boolean; variant: HoodId }) {
  const m = useMat()
  const shell = shellGeometry()
  const { reducedMotion } = useContext(CarContext)
  const hinge = useRef<THREE.Group>(null)
  const pivot: [number, number, number] = [COWL_X + 0.02, seamPoint(COWL_X)[0] + 0.05, 0]
  useFrame((_, dt) => {
    if (!hinge.current) return
    const target = open ? 0.95 : 0
    const r = hinge.current.rotation
    r.z = reducedMotion ? target : THREE.MathUtils.lerp(r.z, target, 1 - Math.exp(-dt * 3.5))
  })
  return (
    <Part
      id="hood"
      explode={[0.1, 0.25, 0]}
      hotspot={{ position: [1.45, 0.9, 0], normal: [0.3, 1, 0], camera: 'engine' }}
    >
      <group position={pivot}>
        <group ref={hinge}>
          <group position={[-pivot[0], -pivot[1], 0]}>
            <mesh geometry={shell.hood} material={variant === 'vented' ? m.get('carbon') : m.get('paint')} />
            <mesh geometry={shell.hood} material={m.get('cavity')} />
            {variant !== 'stock' && <mesh geometry={domeGeometry()} material={variant === 'vented' ? m.get('carbon') : m.get('paint')} />}
            {variant === 'vented' &&
              [1, -1].map((s) => (
                <group key={s} scale={s === 1 ? undefined : MIRROR_Z}>
                  <mesh geometry={extractorGeometry().vent} material={m.get('honeycomb')} />
                  <mesh geometry={extractorGeometry().rim} material={m.get('glossBlack')} />
                </group>
              ))}
          </group>
        </group>
      </group>
    </Part>
  )
}
