import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useConfigurator } from '../../store/configurator'
import { HL, noseX } from './geometry'
import { useMat } from './materials'

// Visual effects that sit on top of the model. They never change geometry or
// configuration; they only animate light and add see-through overlays.

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    // brightest at the lamp (cone tip), fading along the throw
    float a = pow(vUv.y, 2.2) * uStrength;
    gl_FragColor = vec4(uColor, a);
  }
`

function radialTexture(inner: string, outer: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  if (g) {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, inner)
    grad.addColorStop(1, outer)
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
  }
  return new THREE.CanvasTexture(c)
}

/** Light show: pulsing signatures, headlight beams, light pools and underglow */
export function LightShow() {
  const on = useConfigurator((s) => s.lightShow)
  const m = useMat()
  const t0 = useRef(0)
  const base = useRef<Map<THREE.Material, number>>(new Map())
  const group = useRef<THREE.Group>(null)

  const beamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        uniforms: { uColor: { value: new THREE.Color('#dfe9ff') }, uStrength: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const beamGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.95, 5.2, 40, 1, true)
    // tip at the origin, opening towards +x and slightly down
    g.translate(0, -2.6, 0)
    g.rotateZ(Math.PI / 2)
    g.rotateZ(-0.06)
    return g
  }, [])
  const pool = useMemo(() => {
    const tex = radialTexture('rgba(220,232,255,1)', 'rgba(220,232,255,0)')
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
  }, [])
  const underglow = useMemo(() => {
    const tex = radialTexture('rgba(47,123,255,1)', 'rgba(47,123,255,0)')
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
  }, [])
  const redPool = useMemo(() => {
    const tex = radialTexture('rgba(255,40,60,1)', 'rgba(255,40,60,0)')
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
  }, [])

  useEffect(
    () => () => {
      beamMat.dispose()
      beamGeo.dispose()
      for (const mat of [pool, underglow, redPool]) {
        mat.map?.dispose()
        mat.dispose()
      }
    },
    [beamMat, beamGeo, pool, underglow, redPool],
  )

  const lampX = noseX(0.59, 0.58)
  const animated = [m.get('drl'), m.get('tailGlow'), m.get('ambient')] as THREE.MeshStandardMaterial[]

  useEffect(() => {
    if (on) t0.current = 0
    else {
      // restore the resting intensities the configuration set
      for (const [mat, v] of base.current) (mat as THREE.MeshStandardMaterial).emissiveIntensity = v
      base.current.clear()
    }
  }, [on])

  useFrame((_, dt) => {
    const target = on ? 1 : 0
    const s = beamMat.uniforms.uStrength
    s.value = THREE.MathUtils.lerp(s.value, target * 0.22, 1 - Math.exp(-dt * 4))
    pool.opacity = THREE.MathUtils.lerp(pool.opacity, target * 0.32, 1 - Math.exp(-dt * 4))
    redPool.opacity = THREE.MathUtils.lerp(redPool.opacity, target * 0.35, 1 - Math.exp(-dt * 4))
    if (group.current) group.current.visible = s.value > 0.002
    if (!on) {
      underglow.opacity = THREE.MathUtils.lerp(underglow.opacity, 0, 1 - Math.exp(-dt * 4))
      return
    }
    t0.current += dt
    const t = t0.current
    for (const mat of animated) {
      if (!('emissiveIntensity' in mat)) continue
      if (!base.current.has(mat)) base.current.set(mat, mat.emissiveIntensity)
    }
    // ignition: lamps sweep up in the first 1.2 s, then breathe
    const ignite = Math.min(1, t / 1.2)
    const breathe = 0.8 + 0.35 * Math.sin(t * 3.2)
    const [drl, tail, amb] = animated
    if (drl.emissiveIntensity !== undefined) drl.emissiveIntensity = (base.current.get(drl) ?? 3) * (0.4 + ignite * 1.1)
    if (tail.emissiveIntensity !== undefined) tail.emissiveIntensity = (base.current.get(tail) ?? 2.6) * ignite * breathe * 1.3
    if (amb.emissiveIntensity !== undefined) amb.emissiveIntensity = 2.4 * (0.6 + 0.6 * Math.sin(t * 2))
    underglow.opacity = ignite * (0.45 + 0.2 * Math.sin(t * 2))
  })

  return (
    <>
      <group ref={group}>
        {[1, -1].map((s) => (
          <mesh key={s} geometry={beamGeo} material={beamMat} position={[lampX + 0.02, 0.59, s * 0.58]} renderOrder={4} raycast={() => null} />
        ))}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[HL + 2.6, 0.006, 0]} material={pool} raycast={() => null}>
        <planeGeometry args={[4.2, 3.4]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-HL - 0.9, 0.006, 0]} material={redPool} raycast={() => null}>
        <planeGeometry args={[2.2, 2.6]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 0]} material={underglow} raycast={() => null}>
        <planeGeometry args={[5.4, 2.6]} />
      </mesh>
    </>
  )
}

const scanFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float edge = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
    float grid = step(0.94, fract(vUv.y * 24.0)) * 0.35;
    float a = (0.16 + grid) * edge;
    gl_FragColor = vec4(0.32, 0.6, 1.0, a);
  }
`

/** Technical view: a scanning plane that sweeps along the car */
export function ScanBeam() {
  const ref = useRef<THREE.Group>(null)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: scanFragment,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  )
  useEffect(() => () => mat.dispose(), [mat])
  useFrame(({ clock }) => {
    if (!ref.current) return
    const p = (clock.elapsedTime * 0.28) % 1
    ref.current.position.x = -HL - 0.3 + p * (2 * HL + 0.6)
  })
  return (
    <group ref={ref}>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0.78, 0]} material={mat} raycast={() => null}>
        <planeGeometry args={[2.3, 1.56]} />
      </mesh>
      <mesh position={[0, 0.78, 0]} raycast={() => null}>
        <boxGeometry args={[0.006, 1.56, 2.3]} />
        <meshBasicMaterial color="#8fc0ff" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}
