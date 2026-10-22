import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { BEATS, cameraBlend } from '../lib/story'
import { useConfigurator, type EnvironmentId } from '../store/configurator'
import { CarModel } from './car/CarModel'
import { storyRig } from './storyRig'
import { ACCENT, Studio, presetFor } from './Studio'

// The showroom canvas behind the scroll story. The car is the same model the
// configurator uses, showing the visitor's current build, but not clickable.

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const vA = new THREE.Vector3()
const vB = new THREE.Vector3()
const goalPos = new THREE.Vector3()
const goalTarget = new THREE.Vector3()
const AXIS_Y = new THREE.Vector3(0, 1, 0)
const frameGoal = new THREE.Vector2()

function StoryCamera({ reducedMotion, spin }: { reducedMotion: boolean; spin: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const target = useRef(new THREE.Vector3(0, 0.6, 0))
  const spinAngle = useRef(0)
  const placed = useRef(false)
  const frame = useRef(new THREE.Vector2())
  const smoothP = useRef(0)
  const pointer = useRef(new THREE.Vector2())
  const shake = useRef(0)

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    // critically damped scroll: wheel notches become a glide instead of a jump
    smoothP.current = reducedMotion ? storyRig.progress : THREE.MathUtils.damp(smoothP.current, storyRig.progress, 7, dt)
    const { i, e, nearest } = cameraBlend(smoothP.current)
    const a = BEATS[i].camera
    const b = BEATS[i + 1].camera
    goalPos.copy(vA.set(...a.position)).lerp(vB.set(...b.position), e)
    goalTarget.copy(vA.set(...a.target)).lerp(vB.set(...b.target), e)
    const fov = THREE.MathUtils.lerp(a.fov, b.fov, e)
    const fa = BEATS[i].frame ?? [0, 0]
    const fb = BEATS[i + 1].frame ?? [0, 0]

    // portrait screens: step back and widen so the whole car stays in frame
    const aspect = size.width / Math.max(1, size.height)
    const inside = goalPos.distanceTo(goalTarget) < 2
    if (!inside && aspect < 1.4) goalPos.sub(goalTarget).multiplyScalar(1 + (1.4 - aspect) * 0.95).add(goalTarget)

    // turntable spin on the hero and atmosphere beats, eased back elsewhere
    const beat = BEATS[nearest]
    if (spin && beat.spin && !reducedMotion) spinAngle.current += dt * 0.12
    else {
      const wrapped = Math.atan2(Math.sin(spinAngle.current), Math.cos(spinAngle.current))
      spinAngle.current = THREE.MathUtils.lerp(wrapped, 0, 1 - Math.exp(-dt * 2))
    }
    if (!storyRig.dragging) {
      storyRig.yaw += storyRig.yawVelocity
      storyRig.yawVelocity *= Math.exp(-dt * 4)
    }
    pointer.current.x = THREE.MathUtils.damp(pointer.current.x, reducedMotion ? 0 : storyRig.pointer.x, 3, dt)
    pointer.current.y = THREE.MathUtils.damp(pointer.current.y, reducedMotion ? 0 : storyRig.pointer.y, 3, dt)
    // the mouse leans the camera a few degrees, so the scene feels deep rather than flat
    const yaw = storyRig.yaw + spinAngle.current - pointer.current.x * 0.05
    goalPos.y += -pointer.current.y * 0.07
    goalPos.applyAxisAngle(AXIS_Y, yaw)
    goalTarget.applyAxisAngle(AXIS_Y, yaw)

    const k = reducedMotion || !placed.current ? 1 : 1 - Math.exp(-dt * 4.5)
    placed.current = true
    // engine load shakes the camera a little
    shake.current = THREE.MathUtils.damp(shake.current, reducedMotion ? 0 : storyRig.rev, 8, dt)
    if (shake.current > 0.02) {
      goalPos.x += (Math.random() - 0.5) * 0.02 * shake.current
      goalPos.y += (Math.random() - 0.5) * 0.015 * shake.current
    }
    camera.position.lerp(goalPos, k)
    target.current.lerp(goalTarget, k)
    camera.fov = THREE.MathUtils.lerp(camera.fov, aspect < 1 ? fov * 1.12 : fov, k)
    // shift the rendered frame so the car clears the text; on portrait screens
    // the text sits at the bottom, so the car moves up instead
    const fx = aspect < 1 ? 0 : THREE.MathUtils.lerp(fa[0], fb[0], e)
    const fy = aspect < 1 ? 0.14 : THREE.MathUtils.lerp(fa[1], fb[1], e)
    frame.current.lerp(frameGoal.set(fx, fy), k)
    camera.setViewOffset(size.width, size.height, -frame.current.x * size.width, frame.current.y * size.height, size.width, size.height)
    camera.updateProjectionMatrix()
    camera.lookAt(target.current)
  })
  return null
}

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vFacing;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    vFacing = abs(dot(n, normalize(-mv.xyz)));
    gl_Position = projectionMatrix * mv;
  }
`
const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec2 vUv;
  varying float vFacing;
  void main() {
    // soft silhouette edges and a gentle fall-off towards the floor
    float a = pow(vFacing, 2.0) * (0.35 + 0.65 * vUv.y) * uStrength;
    gl_FragColor = vec4(uColor, a);
  }
`

/** Overhead light shaft and floor pool that bring the car out of the dark */
function VolumetricLight({ strength, accent }: { strength: React.MutableRefObject<number>; accent: string }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        uniforms: { uColor: { value: new THREE.Color('#cfdcff') }, uStrength: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.5, 3.6, 7, 48, 1, true)
    g.translate(0, 3.5, 0)
    return g
  }, [])
  const pool = useMemo(() => new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), [accent])
  useEffect(() => () => {
    mat.dispose()
    geo.dispose()
  }, [mat, geo])
  useEffect(() => () => pool.dispose(), [pool])
  useFrame(() => {
    mat.uniforms.uStrength.value = strength.current * 0.11
    pool.opacity = strength.current * 0.05
  })
  return (
    <>
      <mesh geometry={geo} material={mat} renderOrder={6} raycast={() => null} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} material={pool} raycast={() => null}>
        <circleGeometry args={[3.6, 64]} />
      </mesh>
    </>
  )
}

const streakFragment = /* glsl */ `
  uniform float uStrength;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying float vFacing;
  void main() {
    float along = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
    float across = 1.0 - abs(vUv.y - 0.5) * 2.0;
    gl_FragColor = vec4(uColor, along * across * uStrength);
  }
`

/** Light streaks that race along the body in the design walk-around */
function LightStreaks({ on, accent }: { on: boolean; accent: string }) {
  const group = useRef<THREE.Group>(null)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: streakFragment,
        uniforms: { uColor: { value: new THREE.Color(accent) }, uStrength: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [accent],
  )
  const streaks = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        y: 0.25 + ((i * 37) % 11) / 11,
        z: (i % 2 ? 1 : -1) * (1.05 + ((i * 13) % 5) * 0.06),
        speed: 3 + ((i * 7) % 5),
        offset: (i * 1.7) % 10,
        len: 1.2 + ((i * 3) % 4) * 0.4,
      })),
    [],
  )
  useEffect(() => () => mat.dispose(), [mat])
  useFrame(({ clock }, dt) => {
    const s = mat.uniforms.uStrength
    s.value = THREE.MathUtils.lerp(s.value, on ? 0.9 : 0, 1 - Math.exp(-dt * 3))
    const g = group.current
    if (!g) return
    g.visible = s.value > 0.01
    g.children.forEach((c, i) => {
      const st = streaks[i]
      c.position.x = 5 - ((clock.elapsedTime * st.speed + st.offset) % 10)
    })
  })
  return (
    <group ref={group}>
      {streaks.map((s, i) => (
        <mesh key={i} position={[0, s.y, s.z]} material={mat} raycast={() => null}>
          <planeGeometry args={[s.len, 0.012]} />
        </mesh>
      ))}
    </group>
  )
}

function Ready() {
  const setReady = useConfigurator((s) => s.setStoryReady)
  const frames = useRef(0)
  useFrame(() => {
    if (frames.current++ === 2) setReady()
  })
  return null
}

/** Brings the scene up from black once the intro hands over */
function Reveal({ exposure, strength, reducedMotion }: { exposure: number; strength: React.MutableRefObject<number>; reducedMotion: boolean }) {
  const gl = useThree((s) => s.gl)
  const introDone = useConfigurator((s) => s.introDone)
  const t = useRef(0)
  useFrame((_, dt) => {
    if (introDone) t.current += reducedMotion ? 10 : Math.min(dt, 0.1)
    // light shaft first, then the car
    const shaft = smooth(0, 0.9, t.current)
    const body = smooth(0.4, 2.4, t.current)
    strength.current = 0.25 + shaft * 0.75
    gl.toneMappingExposure = exposure * (0.04 + body * 0.96)
  })
  return null
}

interface Props {
  reducedMotion: boolean
  active: boolean
  beat: number
  effects: boolean
  spin: boolean
  mobile: boolean
}

export default function StoryScene({ reducedMotion, active, beat, effects, spin, mobile }: Props) {
  const config = useConfigurator((s) => s.config)
  const chosen = useConfigurator((s) => s.environment)
  const sport = useConfigurator((s) => s.sport)
  const b = BEATS[beat]
  const environment: EnvironmentId = b.useEnvironment ? chosen : 'studio'
  const preset = presetFor(environment, 'darkStudio')
  const accent = sport ? ACCENT.red : ACCENT.blue
  const strength = useRef(0)
  // 2 = full, 1 = lighter, 0 = lowest. The monitor steps this down if frames run long.
  const [quality, setQuality] = useState(mobile ? 0 : 2)

  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      shadows
      dpr={quality === 2 ? [1, 1.75] : quality === 1 ? [1, 1.25] : 1}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [5.4, 0.62, 4.3], fov: 30, near: 0.04, far: 120 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMappingExposure = 0
      }}
    >
      <Suspense fallback={null}>
        <Studio preset={preset} environment={environment} mobile={mobile} accent={accent} />
        <CarModel config={config} mode={b.technical ? 'technical' : 'studio'} interactive={false} hoodOpen={!!b.hoodOpen} cutaway={!!b.cutaway} reducedMotion={reducedMotion} />
        {effects && environment === 'studio' && <VolumetricLight strength={strength} accent={accent} />}
        <LightStreaks on={effects && !!b.streaks && !reducedMotion} accent={accent} />
        {quality > 0 && !mobile && (
          <EffectComposer multisampling={quality === 2 ? 4 : 0}>
            <Bloom luminanceThreshold={1} luminanceSmoothing={0.2} intensity={effects ? 0.9 : 0.4} mipmapBlur />
            <Vignette offset={0.2} darkness={0.7} />
          </EffectComposer>
        )}
      </Suspense>
      <PerformanceMonitor flipflops={3} onDecline={() => setQuality((q) => Math.max(0, q - 1))} onFallback={() => setQuality(0)} />
      <StoryCamera reducedMotion={reducedMotion} spin={spin} />
      <Reveal exposure={preset.exposure} strength={strength} reducedMotion={reducedMotion} />
      <Ready />
    </Canvas>
  )
}
