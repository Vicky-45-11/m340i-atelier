import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { WheelStyle } from '../../lib/configuration'
import { TYRE_RADIUS, TYRE_WIDTH } from './geometry'
import { tyreLetteringTexture, useMat } from './materials'

// One procedural wheel assembly: tyre, rim barrel, spokes, hub, brake disc
// and caliper. The local axle points along +z, with the outer face at +z.
// Changing the style or rim size rebuilds these geometries; the tyre's outer
// diameter never changes, so the wheel cannot grow into the arch.

export interface WheelGeometry {
  tyre: THREE.BufferGeometry
  barrel: THREE.BufferGeometry
  lip: THREE.BufferGeometry
  backplate: THREE.BufferGeometry
  spoke: THREE.BufferGeometry
  spokeFace: THREE.BufferGeometry | null
  spokeAngles: number[]
  hub: THREE.BufferGeometry
  cap: THREE.BufferGeometry
  nut: THREE.BufferGeometry
  disc: THREE.BufferGeometry
  hat: THREE.BufferGeometry
  caliper: THREE.BufferGeometry
  discFace: THREE.BufferGeometry
  lettering: THREE.BufferGeometry
  letteringRatio: number
  rimRadius: number
}

export function buildWheelGeometry(style: WheelStyle, inches: number): WheelGeometry {
  const R = TYRE_RADIUS
  const w = TYRE_WIDTH
  const rimR = inches * 0.0127 + 0.012
  const face = w / 2 - 0.012

  // tyre: lathe a rounded section around the axle
  const prof: THREE.Vector2[] = []
  const side = R - rimR
  const steps = 10
  prof.push(new THREE.Vector2(rimR - 0.004, -w / 2 + 0.012))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const r = rimR + side * (0.15 + 0.75 * t)
    const bulge = Math.sin(t * Math.PI) * 0.012
    prof.push(new THREE.Vector2(r, -w / 2 - bulge + 0.004 * (1 - t)))
  }
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2)
    prof.push(new THREE.Vector2(R - 0.03 + Math.cos(a) * 0.03, -w / 2 + 0.03 + Math.sin(a) * 0.03))
  }
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2)
    prof.push(new THREE.Vector2(R - 0.03 + Math.cos(a) * 0.03, w / 2 - 0.03 + Math.sin(a) * 0.03))
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps
    const r = rimR + side * (0.15 + 0.75 * t)
    const bulge = Math.sin(t * Math.PI) * 0.012
    prof.push(new THREE.Vector2(r, w / 2 + bulge - 0.004 * (1 - t)))
  }
  prof.push(new THREE.Vector2(rimR - 0.004, w / 2 - 0.012))
  const tyre = new THREE.LatheGeometry(prof, 72)
  tyre.rotateX(Math.PI / 2)

  const barrel = new THREE.CylinderGeometry(rimR, rimR, w * 0.86, 56, 1, true)
  barrel.rotateX(Math.PI / 2)

  const lip = new THREE.TorusGeometry(rimR - 0.006, 0.01, 10, 72)
  lip.translate(0, 0, face)

  const backplate = new THREE.CircleGeometry(rimR - 0.01, 48)
  backplate.translate(0, 0, -w * 0.32)

  // spoke: tapered blade from hub to rim, dished towards the hub
  const r0 = 0.07
  const r1 = rimR - 0.012
  const shape = new THREE.Shape()
  shape.moveTo(r0, -style.hubWidth / 2)
  shape.lineTo(r1, -style.rimWidth / 2)
  shape.lineTo(r1, style.rimWidth / 2)
  shape.lineTo(r0, style.hubWidth / 2)
  shape.closePath()
  const depth = style.spokes >= 10 ? 0.018 : 0.026
  const makeSpoke = (inset: number, thick: number) => {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: thick,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: Math.max(0.001, 0.004 - inset),
      bevelSegments: 2,
      curveSegments: 1,
      steps: 6,
    })
    const p = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const y = p.getY(i)
      const r = Math.hypot(x, y)
      const dish = (1 - (r - r0) / (r1 - r0)) * 0.045
      p.setZ(i, p.getZ(i) + face - 0.03 - thick + dish)
    }
    g.computeVertexNormals()
    return g
  }
  const spoke = makeSpoke(0, depth)
  let spokeFace: THREE.BufferGeometry | null = null
  if (style.faceColor) {
    const fs = new THREE.Shape()
    fs.moveTo(r0 + 0.01, -style.hubWidth * 0.3)
    fs.lineTo(r1 - 0.004, -style.rimWidth * 0.3)
    fs.lineTo(r1 - 0.004, style.rimWidth * 0.3)
    fs.lineTo(r0 + 0.01, style.hubWidth * 0.3)
    fs.closePath()
    spokeFace = new THREE.ShapeGeometry(fs)
    const p = spokeFace.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      const r = Math.hypot(p.getX(i), p.getY(i))
      const dish = (1 - (r - r0) / (r1 - r0)) * 0.045
      p.setZ(i, face - 0.03 + 0.0045 + dish)
    }
    spokeFace.computeVertexNormals()
  }

  const spokeAngles: number[] = []
  for (let i = 0; i < style.spokes; i++) {
    const base = (i / style.spokes) * Math.PI * 2 + Math.PI / 2
    if (style.perGroup === 2) spokeAngles.push(base - style.pairSpread / 2, base + style.pairSpread / 2)
    else spokeAngles.push(base)
  }

  const hub = new THREE.CylinderGeometry(0.078, 0.086, 0.05, 40)
  hub.rotateX(Math.PI / 2)
  hub.translate(0, 0, face - 0.005 + 0.012)
  const cap = new THREE.CylinderGeometry(0.034, 0.034, 0.012, 32)
  cap.rotateX(Math.PI / 2)
  cap.translate(0, 0, face + 0.04)
  const nut = new THREE.CylinderGeometry(0.009, 0.009, 0.016, 6)
  nut.rotateX(Math.PI / 2)
  nut.translate(0, 0, face + 0.04)

  const discR = rimR - 0.045
  const disc = new THREE.CylinderGeometry(discR, discR, 0.03, 56)
  disc.rotateX(Math.PI / 2)
  disc.translate(0, 0, -0.03)
  const hat = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 32)
  hat.rotateX(Math.PI / 2)
  hat.translate(0, 0, -0.005)

  const caliper = new THREE.TorusGeometry(discR - 0.035, 0.034, 10, 18, 1.0)
  caliper.scale(1, 1, 1.5)
  caliper.rotateZ(Math.PI * 0.55)
  caliper.translate(0, 0, 0.012)

  const discFace = new THREE.RingGeometry(0.095, discR, 56)
  discFace.translate(0, 0, -0.03 + 0.0155)

  const letterInner = rimR + 0.018
  const letterOuter = R - 0.03
  const lettering = new THREE.RingGeometry(letterInner, letterOuter, 96, 1)
  lettering.translate(0, 0, w / 2 + 0.0135)

  return {
    tyre, barrel, lip, backplate, spoke, spokeFace, spokeAngles, hub, cap, nut, disc, hat, caliper,
    discFace, lettering, letteringRatio: letterInner / letterOuter, rimRadius: rimR,
  }
}

function disposeWheel(g: WheelGeometry) {
  for (const v of Object.values(g)) if (v instanceof THREE.BufferGeometry) v.dispose()
}

export function useWheelGeometry(style: WheelStyle, inches: number) {
  const geo = useMemo(() => buildWheelGeometry(style, inches), [style, inches])
  useEffect(() => () => disposeWheel(geo), [geo])
  return geo
}

const NUT_ANGLES = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2)

/** Sidewall lettering material for one rim size */
export function useLettering(ratio: number) {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tyreLetteringTexture(ratio), transparent: true, alphaTest: 0.4, roughness: 0.7, metalness: 0, depthWrite: false }),
    [ratio],
  )
  useEffect(() => () => {
    mat.map?.dispose()
    mat.dispose()
  }, [mat])
  return mat
}

export function Wheel({
  geo,
  mirrored,
  position,
  drilled,
  lettering,
}: {
  geo: WheelGeometry
  mirrored: boolean
  position: [number, number, number]
  drilled: boolean
  lettering: THREE.Material | null
}) {
  const m = useMat()
  return (
    <group position={position} scale={[1, 1, mirrored ? -1 : 1]}>
      <mesh geometry={geo.tyre} material={m.get('rubber')} />
      <mesh geometry={geo.barrel} material={m.get('rim')} />
      <mesh geometry={geo.lip} material={m.get('rim')} />
      <mesh geometry={geo.backplate} material={m.get('matteBlack')} />
      {geo.spokeAngles.map((a, i) => (
        <group key={i} rotation={[0, 0, a]}>
          <mesh geometry={geo.spoke} material={m.get('rim')} />
          {geo.spokeFace && <mesh geometry={geo.spokeFace} material={m.get('rimFace')} />}
        </group>
      ))}
      <mesh geometry={geo.hub} material={m.get('rim')} />
      <mesh geometry={geo.cap} material={m.get('glossBlack')} />
      {NUT_ANGLES.map((a, i) => (
        <mesh key={i} geometry={geo.nut} material={m.get('chrome')} position={[Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0]} />
      ))}
      <mesh geometry={geo.disc} material={m.get('disc')} />
      {drilled && <mesh geometry={geo.discFace} material={m.get('discFace')} />}
      {lettering && <mesh geometry={geo.lettering} material={lettering} scale={mirrored ? [-1, 1, 1] : undefined} />}
      <mesh geometry={geo.hat} material={m.get('disc')} />
      {/* caliper sits behind the axle, upper rear quadrant; it does not mirror front-to-back */}
      <mesh geometry={geo.caliper} material={m.get('caliper')} />
    </group>
  )
}
