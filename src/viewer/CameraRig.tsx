import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { CameraPresetId } from '../lib/configuration'
import { useConfigurator } from '../store/configurator'

export interface CameraPreset {
  id: CameraPresetId
  label: string
  position: [number, number, number]
  target: [number, number, number]
  minDistance?: number
}

export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'exterior', label: '3/4 front', position: [5.0, 1.55, 4.6], target: [0, 0.62, 0] },
  { id: 'front', label: 'Front', position: [6.6, 1.0, 0], target: [0, 0.6, 0] },
  { id: 'side', label: 'Side', position: [0.2, 0.95, 6.8], target: [0, 0.65, 0] },
  { id: 'rear', label: 'Rear', position: [-6.6, 1.15, 0], target: [0, 0.65, 0] },
  { id: 'rearQuarter', label: '3/4 rear', position: [-4.9, 1.7, 4.5], target: [0, 0.65, 0] },
  { id: 'top', label: 'Top', position: [0.01, 9.2, 0.6], target: [0, 0.5, 0] },
  { id: 'wheels', label: 'Wheels', position: [2.9, 0.55, 2.55], target: [1.45, 0.33, 0.8], minDistance: 0.8 },
  { id: 'fascia', label: 'Front fascia', position: [4.4, 0.95, 1.5], target: [2.1, 0.5, 0], minDistance: 0.8 },
  { id: 'diffuser', label: 'Rear diffuser', position: [-4.3, 0.75, 1.5], target: [-2.1, 0.42, 0], minDistance: 0.8 },
  { id: 'interior', label: 'Interior', position: [-1.08, 1.2, -0.05], target: [0.35, 0.86, 0.16], minDistance: 0.05 },
  { id: 'engine', label: 'Engine bay', position: [3.4, 2.3, 1.7], target: [1.35, 0.7, 0], minDistance: 0.8 },
]

type V3 = [number, number, number]
/** Presentation camera: each shot drifts from one framing to another */
const SHOTS: { from: V3; to: V3; target: V3 }[] = [
  { from: [4.6, 0.45, 3.2], to: [3.4, 0.5, 4.4], target: [0.6, 0.55, 0] },
  { from: [2.6, 0.75, 5.6], to: [-2.6, 0.75, 5.6], target: [0, 0.6, 0] },
  { from: [2.6, 0.42, 1.9], to: [2.2, 0.38, 2.4], target: [1.45, 0.34, 0.8] },
  { from: [-5.2, 1.0, 2.6], to: [-4.2, 1.6, 4.4], target: [-0.6, 0.6, 0] },
  { from: [0.4, 7.5, 2.4], to: [-0.4, 6.8, -2.4], target: [0, 0.4, 0] },
  { from: [6.2, 0.9, -1.4], to: [6.2, 0.9, 1.4], target: [0, 0.6, 0] },
]
const SHOT_SECONDS = 6

export const presetOf = (id: CameraPresetId) => CAMERA_PRESETS.find((p) => p.id === id) ?? CAMERA_PRESETS[0]

/** Animates camera and orbit target to the active preset; hands control back as soon as the user drags. */
export function CameraRig({ reducedMotion, intro }: { reducedMotion: boolean; intro: boolean }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const size = useThree((s) => s.size)
  const preset = useConfigurator((s) => s.camera)
  const presentation = useConfigurator((s) => s.presentation)
  const showClock = useRef(0)
  const tmpPos = useRef(new THREE.Vector3())
  const tmpTarget = useRef(new THREE.Vector3())
  const nonce = useConfigurator((s) => s.cameraNonce)
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  const introClock = useRef(0)

  useEffect(() => {
    if (!controls) return
    const p = presetOf(preset)
    const target = new THREE.Vector3(...p.target)
    const pos = new THREE.Vector3(...p.position)
    // narrow screens: step back so the whole car stays in frame
    const aspect = size.width / Math.max(1, size.height)
    if (p.id !== 'interior' && aspect < 1.5) pos.sub(target).multiplyScalar(1 + (1.5 - aspect) * 0.75).add(target)
    controls.minDistance = p.minDistance ?? 2.2
    goal.current = { pos, target }
    if (reducedMotion) {
      camera.position.copy(pos)
      controls.target.copy(target)
      controls.update()
      goal.current = null
    }
    const stop = () => (goal.current = null)
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [preset, nonce, controls, camera, reducedMotion, size.width, size.height])

  useEffect(() => {
    if (!controls || !presentation) return
    showClock.current = 0
    controls.minDistance = 0.8
    const stop = () => useConfigurator.getState().setPresentation(false)
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls, presentation])

  useFrame((_, dt) => {
    if (!controls) return
    if (presentation) {
      showClock.current += dt
      const n = Math.floor(showClock.current / SHOT_SECONDS)
      const shot = SHOTS[n % SHOTS.length]
      const u = (showClock.current % SHOT_SECONDS) / SHOT_SECONDS
      const e = u * u * (3 - 2 * u)
      const pos = tmpPos.current.set(...shot.from).lerp(new THREE.Vector3(...shot.to), e)
      const target = tmpTarget.current.set(...shot.target)
      const aspect = size.width / Math.max(1, size.height)
      if (aspect < 1.2) pos.sub(target).multiplyScalar(1 + (1.2 - aspect) * 0.9).add(target)
      // a hard cut between shots reads as cinematic; within a shot the drift is smooth
      if (u < dt / SHOT_SECONDS + 0.001 || reducedMotion) {
        camera.position.copy(pos)
        controls.target.copy(target)
      } else {
        const k = 1 - Math.exp(-dt * 6)
        camera.position.lerp(pos, k)
        controls.target.lerp(target, k)
      }
      controls.update()
      return
    }
    if (intro && !reducedMotion) {
      // slow orbit behind the intro card
      introClock.current += dt
      const a = 0.9 + introClock.current * 0.12
      camera.position.set(Math.cos(a) * 7.2, 1.3 + Math.sin(introClock.current * 0.3) * 0.25, Math.sin(a) * 7.2)
      controls.target.set(0, 0.6, 0)
      controls.update()
      return
    }
    const g = goal.current
    if (!g) return
    const k = 1 - Math.exp(-dt * 3.2)
    camera.position.lerp(g.pos, k)
    controls.target.lerp(g.target, k)
    controls.update()
    if (camera.position.distanceTo(g.pos) < 0.005 && controls.target.distanceTo(g.target) < 0.005) goal.current = null
  })

  return null
}
