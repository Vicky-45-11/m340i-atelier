import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { STOCK_CONFIG } from '../lib/configuration'
import { sceneBridge, useConfigurator } from '../store/configurator'
import { CameraRig } from './CameraRig'
import { CarModel } from './car/CarModel'
import { ACCENT, Studio, presetFor } from './Studio'

function useIsMobile() {
  return useMemo(() => typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760), [])
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

export default function CarScene({ reducedMotion, active = true }: { reducedMotion: boolean; active?: boolean }) {
  const config = useConfigurator((s) => s.config)
  const viewMode = useConfigurator((s) => s.viewMode)
  const lighting = useConfigurator((s) => s.lighting)
  const compare = useConfigurator((s) => s.compare)
  const camera = useConfigurator((s) => s.camera)
  const autoRotate = useConfigurator((s) => s.autoRotate)
  const introDone = useConfigurator((s) => s.introDone)
  const select = useConfigurator((s) => s.select)
  const environment = useConfigurator((s) => s.environment)
  const sport = useConfigurator((s) => s.sport)
  const presentation = useConfigurator((s) => s.presentation)
  const mobile = useIsMobile()
  const preset = presetFor(environment, lighting)
  const hoodOpen = camera === 'engine'

  return (
    <Canvas
      // stop drawing while the configurator is scrolled out of view
      frameloop={active ? 'always' : 'never'}
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
        <Studio preset={preset} environment={environment} mobile={mobile} accent={sport ? ACCENT.red : ACCENT.blue} />
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
        maxDistance={presentation ? 30 : 14}
        maxPolarAngle={Math.PI / 2 - 0.03}
        autoRotate={autoRotate && introDone && !presentation}
        autoRotateSpeed={0.6}
        enablePan
        screenSpacePanning
      />
      <CameraRig reducedMotion={reducedMotion} intro={!introDone} />
      <Bridge />
    </Canvas>
  )
}
