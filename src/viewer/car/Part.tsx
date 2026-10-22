import { Html } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { COMPONENT_LABELS, type CameraPresetId, type ComponentId } from '../../lib/configuration'
import { useConfigurator } from '../../store/configurator'

export interface CarContextValue {
  interactive: boolean
  exploded: boolean
  reducedMotion: boolean
}
export const CarContext = createContext<CarContextValue>({ interactive: false, exploded: false, reducedMotion: false })

const highlight = new THREE.MeshBasicMaterial({
  color: '#3d8bff',
  transparent: true,
  opacity: 0.22,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  depthFunc: THREE.LessEqualDepth,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
})
const hoverHighlight = highlight.clone()
hoverHighlight.opacity = 0.1
const noRaycast = () => null

// Isolate mode: every part except the selected one is swapped to this ghost
const ghost = new THREE.MeshBasicMaterial({ color: '#5b95ff', transparent: true, opacity: 0.035, depthWrite: false })

function syncGhost(root: THREE.Object3D, on: boolean) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || o.userData.overlay) return
    if (on && mesh.material !== ghost) {
      mesh.userData.origMaterial = mesh.material
      mesh.material = ghost
    } else if (!on && mesh.material === ghost && mesh.userData.origMaterial) {
      mesh.material = mesh.userData.origMaterial
    }
  })
}

function syncOverlays(root: THREE.Object3D, mat: THREE.Material | null) {
  const meshes: THREE.Mesh[] = []
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && !o.userData.overlay) meshes.push(o as THREE.Mesh)
  })
  for (const m of meshes) {
    let ov = m.children.find((c) => c.userData.overlay) as THREE.Mesh | undefined
    if (!mat) {
      if (ov) m.remove(ov)
      continue
    }
    if (!ov || ov.geometry !== m.geometry) {
      if (ov) m.remove(ov)
      ov = new THREE.Mesh(m.geometry, mat)
      ov.userData.overlay = true
      ov.raycast = noRaycast
      ov.renderOrder = 5
      m.add(ov)
    } else if (ov.material !== mat) ov.material = mat
  }
}

export interface HotspotDef {
  position: [number, number, number]
  /** outward direction; the marker hides when it faces away from the camera */
  normal: [number, number, number]
  camera: CameraPresetId
}

interface PartProps {
  id: ComponentId
  children: ReactNode
  /** offset applied in exploded view */
  explode?: [number, number, number]
  hotspot?: HotspotDef
  position?: [number, number, number]
}

export function Part({ id, children, explode, hotspot, position }: PartProps) {
  const { interactive, exploded, reducedMotion } = useContext(CarContext)
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const state = useRef<'none' | 'hover' | 'selected'>('none')
  const ghosted = useRef(false)
  const select = useConfigurator((s) => s.select)
  const hover = useConfigurator((s) => s.hover)
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dt) => {
    const g = inner.current
    if (!g) return
    if (explode && exploded) target.set(...explode)
    else target.set(0, 0, 0)
    if (reducedMotion) g.position.copy(target)
    else g.position.lerp(target, 1 - Math.exp(-dt * 5))

    if (!interactive) return
    const s = useConfigurator.getState()
    const ghostNow = s.isolate && s.selected !== null && s.selected !== id
    if (ghostNow || ghosted.current) {
      syncGhost(g, ghostNow)
      ghosted.current = ghostNow
    }
    const next = s.selected === id ? 'selected' : s.hovered === id ? 'hover' : 'none'
    if (next !== 'none' || state.current !== 'none') {
      syncOverlays(g, next === 'selected' ? highlight : next === 'hover' ? hoverHighlight : null)
      state.current = next
    }
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || e.delta > 6) return
    e.stopPropagation()
    select(id)
  }
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return
    e.stopPropagation()
    hover(id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    if (!interactive) return
    if (useConfigurator.getState().hovered === id) hover(null)
    document.body.style.cursor = ''
  }

  return (
    <group ref={group} position={position}>
      <group ref={inner} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        {children}
        {interactive && hotspot && <Hotspot id={id} def={hotspot} />}
      </group>
    </group>
  )
}

const tmpV = new THREE.Vector3()
const tmpN = new THREE.Vector3()

function Hotspot({ id, def }: { id: ComponentId; def: HotspotDef }) {
  const anchor = useRef<THREE.Group>(null)
  const el = useRef<HTMLButtonElement>(null)
  const show = useConfigurator((s) => (s.hotspots || s.viewMode === 'exploded') && !s.compare && s.introDone && !(s.isolate && s.selected !== id))
  const callout = useConfigurator((s) => s.viewMode === 'exploded')
  const isSelected = useConfigurator((s) => s.selected === id)
  const select = useConfigurator((s) => s.select)
  const normal = useMemo(() => new THREE.Vector3(...def.normal).normalize(), [def.normal])

  useFrame(({ camera }) => {
    if (!anchor.current || !el.current) return
    anchor.current.getWorldPosition(tmpV)
    tmpN.copy(normal)
    const toCam = camera.position.clone().sub(tmpV).normalize()
    const facing = toCam.dot(tmpN)
    const dist = camera.position.distanceTo(tmpV)
    const visible = facing > 0.15 && dist > 0.9
    el.current.style.opacity = visible ? String(Math.min(1, (facing - 0.15) * 4)) : '0'
    el.current.style.pointerEvents = visible ? 'auto' : 'none'
  })

  if (!show) return null
  return (
    <group ref={anchor} position={def.position}>
      <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <button
          ref={el}
          type="button"
          className={`hotspot${isSelected ? ' is-active' : ''}${callout ? ' is-callout' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            select(id, def.camera)
          }}
          aria-label={`Customise ${COMPONENT_LABELS[id]}`}
        >
          <span className="hotspot-dot" />
          <span className="hotspot-label">{COMPONENT_LABELS[id]}</span>
        </button>
      </Html>
    </group>
  )
}
