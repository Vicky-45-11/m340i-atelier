import * as THREE from 'three'
import { REAR_TRIMS, finishOf, type DiffuserId, type RearTrimId, type SpoilerId } from '../../lib/configuration'
import { RearBumperShell } from './Body'
import { deckLoft, endOutline, endPatch, roundedRectShape, surfaceY, tailX } from './geometry'
import { useMat } from './materials'
import { Part } from './Part'

type Pt = [number, number]
const once = <T,>(fn: () => T) => {
  let v: T | undefined
  return () => (v ??= fn())
}
const MIRROR_Z: [number, number, number] = [1, 1, -1]

const TAIL: Pt[] = [
  [0.3, 0.9],
  [0.6, 0.868],
  [0.86, 0.85],
  [0.9, 0.915],
  [0.82, 0.958],
  [0.32, 0.962],
]
const TAIL_BAR: Pt[] = [
  [0.36, 0.938],
  [0.82, 0.93],
  [0.82, 0.94],
  [0.36, 0.948],
]
const TAIL_HOOK: Pt[] = [
  [0.8, 0.868],
  [0.818, 0.866],
  [0.826, 0.935],
  [0.808, 0.935],
]
const TAIL_LOWER: Pt[] = [
  [0.42, 0.9],
  [0.78, 0.876],
  [0.78, 0.883],
  [0.42, 0.907],
]
const TRIM: Pt[] = [
  [-0.84, 0.3],
  [0.84, 0.3],
  [0.86, 0.39],
  [-0.86, 0.39],
]
const PLATE: Pt[] = [
  [-0.25, 0.51],
  [0.25, 0.51],
  [0.25, 0.625],
  [-0.25, 0.625],
]
const PLATE_RECESS: Pt[] = [
  [-0.285, 0.495],
  [0.285, 0.495],
  [0.28, 0.64],
  [-0.28, 0.64],
]
const REFLECTOR: Pt[] = [
  [0.68, 0.4],
  [0.82, 0.4],
  [0.82, 0.414],
  [0.68, 0.414],
]
const DIFFUSER: Pt[] = [
  [-0.42, 0.245],
  [0.42, 0.245],
  [0.4, 0.335],
  [-0.4, 0.335],
]

const rearGeometry = once(() => {
  const tipOuter = roundedRectShape(0.135, 0.08, 0.034)
  const tipInner = roundedRectShape(0.121, 0.066, 0.028)
  const ring = new THREE.Shape(tipOuter.getPoints(16))
  ring.holes.push(new THREE.Path(tipInner.getPoints(16).reverse()))
  const tip = new THREE.ExtrudeGeometry(ring, { depth: 0.11, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 })
  tip.rotateY(-Math.PI / 2)
  const tipBack = new THREE.ShapeGeometry(tipInner, 8)
  tipBack.rotateY(-Math.PI / 2)
  return {
    lens: endPatch('rear', TAIL, 0.012),
    housing: endPatch('rear', TAIL, 0.003),
    rim: endOutline('rear', TAIL, 0.005, 0.0045),
    glow: [endPatch('rear', TAIL_BAR, 0.007, 2, 24), endPatch('rear', TAIL_HOOK, 0.007, 6, 2), endPatch('rear', TAIL_LOWER, 0.007, 2, 18)],
    trim: endPatch('rear', TRIM, 0.003, 6, 60),
    plate: endPatch('rear', PLATE, 0.01, 2, 20),
    plateRecess: endPatch('rear', PLATE_RECESS, 0.004, 4, 20),
    reflector: endPatch('rear', REFLECTOR, 0.004, 2, 6),
    diffuser: endPatch('rear', DIFFUSER, 0.006, 6, 40),
    tip,
    tipBack,
  }
})

const FINS: Record<DiffuserId, { z: number[]; h: number; len: number }> = {
  stock: { z: [-0.2, 0.2], h: 0.06, len: 0.1 },
  performance: { z: [-0.32, -0.11, 0.11, 0.32], h: 0.075, len: 0.14 },
  track: { z: [-0.36, -0.22, -0.075, 0.075, 0.22, 0.36], h: 0.095, len: 0.2 },
}

const spoilerGeometry = once(() => {
  const ends = (u: number) => 1 - Math.pow(u, 8)
  const wingFoil = new THREE.Shape()
  wingFoil.moveTo(0, 0)
  wingFoil.bezierCurveTo(0.06, 0.035, 0.2, 0.03, 0.26, 0.004)
  wingFoil.lineTo(0.26, -0.004)
  wingFoil.bezierCurveTo(0.2, 0.004, 0.06, -0.01, 0, 0)
  const wing = new THREE.ExtrudeGeometry(wingFoil, { depth: 1.36, bevelEnabled: false, curveSegments: 16 })
  wing.translate(-0.26, 0, -0.68)
  return {
    lip: deckLoft(0.58, [[-2.16, 0], [-2.25, 0.017], [-2.296, 0.03], [-2.302, 0.012], [-2.29, 0]], ends),
    ducktail: deckLoft(0.6, [[-2.08, 0], [-2.2, 0.028], [-2.296, 0.068], [-2.306, 0.036], [-2.29, 0]], ends),
    wing,
  }
})

export function RearEnd({
  diffuser,
  spoiler,
  trim,
}: {
  diffuser: DiffuserId
  spoiler: SpoilerId
  trim: RearTrimId
}) {
  const m = useMat()
  const g = rearGeometry()
  const fins = FINS[diffuser]
  const tipX = tailX(0.27, 0.52)
  return (
    <>
      <Part
        id="rearBumper"
        explode={[-0.45, 0, 0]}
        hotspot={{ position: [tailX(0.5, 0.6) - 0.03, 0.5, 0.6], normal: [-1, 0, 0.5], camera: 'diffuser' }}
      >
        <RearBumperShell />
        <mesh geometry={g.trim} material={m.finish(finishOf(REAR_TRIMS, trim))} />
        <mesh geometry={g.plateRecess} material={m.get('matteBlack')} />
        <mesh geometry={g.plate} material={m.get('plateRear')} />
        {[1, -1].map((s) => (
          <mesh key={s} geometry={g.reflector} material={m.get('tailLens')} scale={s === 1 ? undefined : MIRROR_Z} />
        ))}
      </Part>

      <Part
        id="diffuser"
        explode={[-0.75, -0.06, 0]}
        hotspot={{ position: [tailX(0.29, 0) - 0.06, 0.28, 0], normal: [-1, -0.2, 0], camera: 'diffuser' }}
      >
        <mesh geometry={g.diffuser} material={diffuser === 'stock' ? m.get('glossBlack') : m.get('carbon')} />
        {fins.z.map((z) => (
          <mesh key={z} position={[tailX(0.29, z) - fins.len / 2 + 0.05, 0.245 + fins.h / 2, z]} material={diffuser === 'stock' ? m.get('glossBlack') : m.get('carbon')}>
            <boxGeometry args={[fins.len, fins.h, 0.008]} />
          </mesh>
        ))}
      </Part>

      <Part
        id="exhaust"
        explode={[-0.95, 0, 0.1]}
        hotspot={{ position: [tipX - 0.12, 0.27, 0.52], normal: [-1, 0, 0.3], camera: 'diffuser' }}
      >
        {[1, -1].map((s) => (
          <group key={s} position={[tipX + 0.05, 0.27, s * 0.52]}>
            <mesh geometry={g.tip} material={m.get('exhaust')} />
            <mesh geometry={g.tipBack} position={[0.02, 0, 0]} material={m.get('matteBlack')} />
          </group>
        ))}
      </Part>

      <Part
        id="spoiler"
        explode={[-0.1, 0.32, 0]}
        hotspot={{ position: [-2.26, (spoiler === 'wing' ? 1.2 : surfaceY(-2.26, 0) + 0.05), 0.35], normal: [-0.4, 1, 0.2], camera: 'rearQuarter' }}
      >
        {spoiler === 'lip' && <mesh geometry={spoilerGeometry().lip} material={m.get('paint')} />}
        {spoiler === 'carbonLip' && <mesh geometry={spoilerGeometry().lip} material={m.get('carbon')} />}
        {spoiler === 'ducktail' && <mesh geometry={spoilerGeometry().ducktail} material={m.get('paint')} />}
        {spoiler === 'wing' && (
          <>
            <mesh geometry={spoilerGeometry().lip} material={m.get('paint')} />
            <mesh geometry={spoilerGeometry().wing} position={[-2.02, 1.17, 0]} rotation={[0, 0, -0.08]} material={m.get('carbon')} />
            {[1, -1].map((s) => (
              <group key={s}>
                <mesh position={[-2.17, (surfaceY(-2.17, 0.42) + 1.17) / 2, s * 0.42]} rotation={[0, 0, 0.18]} material={m.get('glossBlack')}>
                  <boxGeometry args={[0.07, 1.17 - surfaceY(-2.17, 0.42) + 0.02, 0.012]} />
                </mesh>
                <mesh position={[-2.15, 1.175, s * 0.685]} material={m.get('carbon')}>
                  <boxGeometry args={[0.3, 0.09, 0.008]} />
                </mesh>
              </group>
            ))}
          </>
        )}
      </Part>

      <Part
        id="taillights"
        explode={[-0.3, 0.06, 0.1]}
        hotspot={{ position: [tailX(0.94, 0.62) - 0.04, 0.94, 0.62], normal: [-1, 0.1, 0.5], camera: 'rear' }}
      >
        {[1, -1].map((s) => (
          <group key={s} scale={s === 1 ? undefined : MIRROR_Z}>
            <mesh geometry={g.housing} material={m.get('glossBlack')} />
            <mesh geometry={g.rim} material={m.get('glossBlack')} />
            {g.glow.map((gg, i) => (
              <mesh key={i} geometry={gg} material={m.get('tailGlow')} />
            ))}
            <mesh geometry={g.lens} material={m.get('tailLens')} renderOrder={3} />
          </group>
        ))}
      </Part>
    </>
  )
}

