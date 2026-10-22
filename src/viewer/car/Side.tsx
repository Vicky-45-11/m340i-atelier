import * as THREE from 'three'
import { MIRROR_CAPS, WINDOW_TRIMS, finishOf, type MirrorCapId, type SkirtId, type VentId, type WindowTrimId } from '../../lib/configuration'
import { windowTrimGeometry } from './Body'
import { ARCH_RADIUS, AXLE_FRONT, AXLE_REAR, seamPoint, sideRibbon, surfaceZ } from './geometry'
import { useMat } from './materials'
import { Part } from './Part'

const once = <T,>(fn: () => T) => {
  let v: T | undefined
  return () => (v ??= fn())
}
const MIRROR_Z: [number, number, number] = [1, 1, -1]
const SKIRT_X0 = AXLE_REAR + ARCH_RADIUS + 0.01
const SKIRT_X1 = AXLE_FRONT - ARCH_RADIUS - 0.01

const MIRROR_X = 0.6
const mirrorGeometry = once(() => {
  const [ys, zs] = seamPoint(MIRROR_X)
  const centre = new THREE.Vector3(MIRROR_X - 0.02, ys + 0.075, zs + 0.15)
  // front half of an ellipsoid is the cap; the flattened back half carries the glass
  const cap = new THREE.SphereGeometry(1, 32, 16, Math.PI / 2, Math.PI)
  cap.scale(0.075, 0.058, 0.118)
  const back = new THREE.SphereGeometry(1, 32, 16, -Math.PI / 2, Math.PI)
  back.scale(0.022, 0.058, 0.118)
  const glass = new THREE.CircleGeometry(1, 32)
  glass.scale(0.104, 0.048, 1)
  glass.rotateY(-Math.PI / 2)
  glass.translate(-0.0225, 0, 0)
  const arm = new THREE.BoxGeometry(0.07, 0.028, 0.12)
  return { centre, cap, back, glass, arm, armPos: new THREE.Vector3(MIRROR_X, ys + 0.045, zs + 0.06) }
})

// Front-wing air breather: a recessed opening with two horizontal blades, behind the front arch
const VENT_X0 = AXLE_FRONT - ARCH_RADIUS - 0.2
const VENT_X1 = AXLE_FRONT - ARCH_RADIUS - 0.03
const ventGeometry = once(() => ({
  opening: sideRibbon(VENT_X0, VENT_X1, 0.56, 0.66, 0.002, 20),
  frame: [
    sideRibbon(VENT_X0 - 0.012, VENT_X1 + 0.012, 0.548, 0.56, 0.006, 20),
    sideRibbon(VENT_X0 - 0.012, VENT_X1 + 0.012, 0.66, 0.672, 0.006, 20),
    sideRibbon(VENT_X0, VENT_X1, 0.592, 0.6, 0.01, 20),
    sideRibbon(VENT_X0, VENT_X1, 0.622, 0.63, 0.01, 20),
  ],
}))

const skirtGeometry = once(() => {
  const blade = (y: number, out: number, thick: number) => {
    const xs: number[] = []
    for (let i = 0; i <= 40; i++) xs.push(SKIRT_X0 + ((SKIRT_X1 - SKIRT_X0) * i) / 40)
    const shape = new THREE.Shape()
    // plan view outline, x along the car, y = outward from the sill
    xs.forEach((x, i) => {
      const z = surfaceZ(x, y + 0.03) - 0.02
      if (i === 0) shape.moveTo(x, z)
      else shape.lineTo(x, z)
    })
    for (let i = xs.length - 1; i >= 0; i--) {
      const x = xs[i]
      const taper = Math.min(1, Math.min(x - SKIRT_X0, SKIRT_X1 - x) / 0.12)
      shape.lineTo(x, surfaceZ(x, y + 0.03) + out * taper)
    }
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 })
    g.rotateX(Math.PI / 2)
    g.translate(0, y + thick, 0)
    return g
  }
  return {
    stock: sideRibbon(SKIRT_X0, SKIRT_X1, 0.2, 0.27, 0.01, 50),
    blade: blade(0.192, 0.04, 0.012),
    bladeSill: sideRibbon(SKIRT_X0, SKIRT_X1, 0.2, 0.26, 0.01, 50),
    extendedSill: sideRibbon(SKIRT_X0, SKIRT_X1, 0.175, 0.28, 0.018, 50),
    extended: blade(0.168, 0.065, 0.014),
  }
})

export function SideParts({
  mirrorCaps,
  skirts,
  windowTrim,
  vents,
}: {
  mirrorCaps: MirrorCapId
  skirts: SkirtId
  windowTrim: WindowTrimId
  vents: VentId
}) {
  const m = useMat()
  const mg = mirrorGeometry()
  const sk = skirtGeometry()
  const wt = windowTrimGeometry()
  const capMat = m.finish(finishOf(MIRROR_CAPS, mirrorCaps))
  const trimMat = m.finish(finishOf(WINDOW_TRIMS, windowTrim))
  const sideZ = surfaceZ(0, 0.24)

  return (
    <>
      <Part
        id="mirrors"
        explode={[0.05, 0.12, 0.32]}
        hotspot={{ position: [mg.centre.x + 0.06, mg.centre.y + 0.05, mg.centre.z + 0.05], normal: [0.6, 0.3, 1], camera: 'exterior' }}
      >
        {[1, -1].map((s) => (
          <group key={s} scale={s === 1 ? undefined : MIRROR_Z}>
            <group position={mg.centre}>
              <mesh geometry={mg.cap} material={capMat} />
              <mesh geometry={mg.back} material={m.get('paint')} />
              <mesh geometry={mg.glass} material={m.get('mirrorGlass')} />
            </group>
            <mesh geometry={mg.arm} position={mg.armPos} rotation={[0.25, 0, 0]} material={m.get('glossBlack')} />
          </group>
        ))}
      </Part>

      <Part
        id="sideSkirts"
        explode={[0, -0.05, 0.28]}
        hotspot={{ position: [0.1, 0.24, sideZ + 0.06], normal: [0, -0.1, 1], camera: 'side' }}
      >
        {[1, -1].map((s) => (
          <group key={s} scale={s === 1 ? undefined : MIRROR_Z}>
            {skirts === 'stock' && <mesh geometry={sk.stock} material={m.get('paint')} />}
            {skirts === 'blade' && (
              <>
                <mesh geometry={sk.bladeSill} material={m.get('paint')} />
                <mesh geometry={sk.blade} material={m.get('glossBlack')} />
              </>
            )}
            {skirts === 'extended' && (
              <>
                <mesh geometry={sk.extendedSill} material={m.get('carbon')} />
                <mesh geometry={sk.extended} material={m.get('carbon')} />
              </>
            )}
          </group>
        ))}
      </Part>

      {vents !== 'none' && (
        <Part
          id="vents"
          explode={[0.05, 0.05, 0.22]}
          hotspot={{ position: [(VENT_X0 + VENT_X1) / 2, 0.69, surfaceZ((VENT_X0 + VENT_X1) / 2, 0.61) + 0.04], normal: [0, 0.2, 1], camera: 'wheels' }}
        >
          {[1, -1].map((s) => (
            <group key={s} scale={s === 1 ? undefined : MIRROR_Z}>
              <mesh geometry={ventGeometry().opening} material={m.get('cavity')} />
              <mesh geometry={ventGeometry().opening} material={m.get('matteBlack')} />
              {ventGeometry().frame.map((g, i) => (
                <mesh key={i} geometry={g} material={vents === 'carbon' ? m.get('carbon') : m.get('glossBlack')} />
              ))}
            </group>
          ))}
        </Part>
      )}

      <Part
        id="windowTrim"
        explode={[0, 0.1, 0.18]}
        hotspot={{ position: [-0.3, seamPoint(-0.3)[0] + 0.02, seamPoint(-0.3)[1] + 0.03], normal: [0, 0.3, 1], camera: 'side' }}
      >
        {[1, -1].map((s) => (
          <group key={s} scale={s === 1 ? undefined : MIRROR_Z}>
            <mesh geometry={wt.belt} material={trimMat} />
            <mesh geometry={wt.top} material={trimMat} />
          </group>
        ))}
      </Part>
    </>
  )
}
