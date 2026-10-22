import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { LightingPresetId } from '../lib/configuration'
import type { EnvironmentId } from '../store/configurator'
import { CIRCUIT_LIGHTING, NEON_LIGHTING, lightingOf, type LightingPreset } from './lighting'
import { Scenery } from './Scenery'

export const ACCENT = { blue: '#2f7bff', red: '#ff2a3a' }

/** The scenic environments override the studio lighting choice */
export function presetFor(environment: EnvironmentId, lighting: LightingPresetId): LightingPreset {
  if (environment === 'night') return NEON_LIGHTING
  if (environment === 'track') return CIRCUIT_LIGHTING
  return lightingOf(lighting)
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

interface Props {
  preset: LightingPreset
  environment: EnvironmentId
  mobile: boolean
  accent: string
}

/** Lights, reflections, floor and scenery shared by the showroom and the configurator */
export function Studio({ preset, environment, mobile, accent }: Props) {
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
  const light = preset.id === 'arctic'

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
      <Environment key={`${preset.id}-${accent}`} resolution={mobile ? 128 : 256} frames={1}>
        <color attach="background" args={[preset.envBackground]} />
        {preset.formers.map((f, i) => (
          <Lightformer
            key={i}
            form={f.form ?? 'rect'}
            // the accent panel follows Sport mode in the studio presets
            color={f.color === ACCENT.blue ? accent : f.color}
            intensity={f.intensity}
            position={f.position}
            scale={f.scale}
            rotation={f.rotation}
          />
        ))}
      </Environment>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[60, 64]} />
        {mobile ? (
          <meshStandardMaterial color={preset.floor} roughness={preset.floorRoughness} metalness={0.2} envMapIntensity={0.6} />
        ) : (
          // glossy floor with a soft, blurred reflection of the car
          <MeshReflectorMaterial
            color={preset.floor}
            roughness={preset.floorRoughness + 0.25}
            metalness={0.4}
            blur={[400, 120]}
            resolution={1024}
            mixBlur={1}
            mixStrength={preset.reflect ?? (light ? 1.2 : 2.4)}
            mirror={0}
            depthScale={0.6}
            minDepthThreshold={0.6}
            maxDepthThreshold={1.3}
          />
        )}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} renderOrder={1}>
        <planeGeometry args={[6.2, 2.9]} />
        <meshBasicMaterial map={ao} transparent depthWrite={false} opacity={light ? 0.55 : 0.9} />
      </mesh>
      <Scenery environment={environment} accent={accent} light={light} mobile={mobile} />
    </>
  )
}
