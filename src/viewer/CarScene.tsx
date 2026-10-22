import { Environment, Lightformer, MeshReflectorMaterial, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { STOCK_CONFIG } from '../lib/configuration'
import { sceneBridge, useConfigurator } from '../store/configurator'
import { CameraRig } from './CameraRig'
import { CarModel } from './car/CarModel'
import { lightingOf, type LightingPreset } from './lighting'

function useIsMobile() {
  return useMemo(() => typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760), [])
}

function groundTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  if (g) {
    const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128)
    grad.addColorStop(0, 'rgba(0,0,0,0.85)')
    grad.addColorStop(0.45, 'rgba(0,0,0,0.5)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 256, 256)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Studio({ preset, mobile }: { preset: LightingPreset; mobile: boolean }) {
  const key = useRef<THREE.DirectionalLight>(null)
  const ao = useMemo(groundTexture, [])
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.toneMappingExposure = preset.exposure
  }, [gl, preset.exposure])
  useEffect(() => () => ao.dispose(), [ao])
  useEffect(() => {
    // shadows must see both cars in the split view, which live on layers 1 and 2
    key.current?.shadow.camera.layers.enableAll()
  }, [])

  return (
    <>
      <color attach="background" args={[preset.background]} />
      <fog attach="fog" args={[preset.background, preset.fog[0], preset.fog[1]]} />
      <hemisphereLight args={[preset.hemi.sky, preset.hemi.ground, preset.hemi.intensity]} />
      <directionalLight
        ref={key}
        position={preset.key.position}
        color={preset.key.color}
        intensity={preset.key.intensity}
        castShadow
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      <directionalLight position={[-4, 3, -5]} color={preset.fill.color} intensity={preset.fill.intensity} />
      <Environment key={preset.id} resolution={mobile ? 128 : 256} frames={1}>
        <color attach="background" args={[preset.envBackground]} />
        {preset.formers.map((f, i) => (
          <Lightformer key={i} form={f.form ?? 'rect'} color={f.color} intensity={f.intensity} position={f.position} scale={f.scale} rotation={f.rotation} />
        ))}
      </Environment>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[30, 64]} />
        {mobile ? (
          <meshStandardMaterial color={preset.floor} roughness={preset.floorRoughness} metalness={0.2} envMapIntensity={0.6} />
        ) : (
          // glossy studio floor with a soft, blurred reflection of the car
          <MeshReflectorMaterial
            color={preset.floor}
            roughness={preset.floorRoughness + 0.25}
            metalness={0.4}
            blur={[400, 120]}
            resolution={1024}
            mixBlur={1}
            mixStrength={preset.id === 'arctic' ? 1.2 : 2.4}
            mirror={0}
            depthScale={0.6}
            minDepthThreshold={0.6}
            maxDepthThreshold={1.3}
          />
        )}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} renderOrder={1}>
        <planeGeometry args={[6.2, 2.9]} />
        <meshBasicMaterial map={ao} transparent depthWrite={false} opacity={preset.id === 'arctic' ? 0.55 : 0.9} />
      </mesh>
      {/* studio floor ring, echoes the brand accent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[3.55, 3.57, 128]} />
        <meshBasicMaterial color="#2f7bff" transparent opacity={preset.id === 'arctic' ? 0.5 : 0.35} />
      </mesh>
    </>
  )
}

/** Renders stock (left) and custom (right) cars with a scissor split. */
function SplitRenderer() {
  const split = useConfigurator((s) => s.compareSplit)
  useFrame(({ gl, scene, camera, size }) => {
    const w = size.width
    const h = size.height
    const sx = Math.round(w * split)
    gl.setScissorTest(true)
    camera.layers.set(0)
    camera.layers.enable(1)
    gl.setScissor(0, 0, sx, h)
    gl.render(scene, camera)
    camera.layers.set(0)
    camera.layers.enable(2)
    gl.setScissor(sx, 0, w - sx, h)
    gl.render(scene, camera)
    gl.setScissorTest(false)
    camera.layers.set(0)
  }, 1)
  return null
}

function Bridge() {
  const { gl, scene, camera } = useThree()
  const setReady = useConfigurator((s) => s.setSceneReady)
  const frames = useRef(0)
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __scene: scene, __camera: camera })
    sceneBridge.capture = () => {
      gl.render(scene, camera)
      return gl.domElement.toDataURL('image/png')
    }
    return () => {
      sceneBridge.capture = null
    }
  }, [gl, scene, camera])
  useFrame(() => {
    if (frames.current++ === 2) setReady()
  })
  return null
}

export default function CarScene({ reducedMotion }: { reducedMotion: boolean }) {
  const config = useConfigurator((s) => s.config)
  const viewMode = useConfigurator((s) => s.viewMode)
  const lighting = useConfigurator((s) => s.lighting)
  const compare = useConfigurator((s) => s.compare)
  const camera = useConfigurator((s) => s.camera)
  const autoRotate = useConfigurator((s) => s.autoRotate)
  const introDone = useConfigurator((s) => s.introDone)
  const select = useConfigurator((s) => s.select)
  const mobile = useIsMobile()
  const preset = lightingOf(lighting)
  const hoodOpen = camera === 'engine'

  return (
    <Canvas
      shadows
      dpr={mobile ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
      camera={{ position: [7.2, 1.4, 4.5], fov: 34, near: 0.04, far: 80 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
      onPointerMissed={(e) => {
        if (e.type === 'click') select(null)
      }}
    >
      <Suspense fallback={null}>
        <Studio preset={preset} mobile={mobile} />
        <CarModel
          config={config}
          mode={compare ? 'studio' : viewMode}
          interactive={!compare}
          hoodOpen={hoodOpen && !compare}
          reducedMotion={reducedMotion}
          layer={compare ? 2 : 0}
        />
        {compare && <CarModel config={STOCK_CONFIG} mode="studio" interactive={false} hoodOpen={false} reducedMotion={reducedMotion} layer={1} />}
        {compare && <SplitRenderer />}
        {!compare && !mobile && (
          <EffectComposer multisampling={4}>
            <Bloom luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.85} mipmapBlur />
            <Vignette offset={0.25} darkness={0.55} />
          </EffectComposer>
        )}
      </Suspense>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2.2}
        maxDistance={14}
        maxPolarAngle={Math.PI / 2 - 0.03}
        autoRotate={autoRotate && introDone}
        autoRotateSpeed={0.6}
        enablePan
        screenSpacePanning
      />
      <CameraRig reducedMotion={reducedMotion} intro={!introDone} />
      <Bridge />
    </Canvas>
  )
}
