import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { rideOf, rimOf, wheelOf, type Configuration, type ViewMode } from '../../lib/configuration'
import { BodyShell, Hood } from './Body'
import { LightShow, ScanBeam } from './Effects'
import { EngineBay, FrontEnd } from './Front'
import { AXLE_FRONT, AXLE_REAR, TRACK_HALF, TYRE_RADIUS } from './geometry'
import { Interior } from './Interior'
import { CarMaterialsContext, useCarMaterials } from './materials'
import { CarContext, Part, type CarContextValue } from './Part'
import { RearEnd } from './Rear'
import { SideParts } from './Side'
import { Wheel, useLettering, useWheelGeometry } from './Wheel'

interface Props {
  config: Configuration
  mode: ViewMode
  interactive: boolean
  hoodOpen: boolean
  reducedMotion: boolean
  /** render layer, used by the stock/custom split view */
  layer?: number
  /** lift the roof and glass off to show the cabin */
  cutaway?: boolean
}

const WHEELS: { pos: [number, number, number]; mirrored: boolean; front: boolean }[] = [
  { pos: [AXLE_FRONT, TYRE_RADIUS, TRACK_HALF], mirrored: false, front: true },
  { pos: [AXLE_FRONT, TYRE_RADIUS, -TRACK_HALF], mirrored: true, front: true },
  { pos: [AXLE_REAR, TYRE_RADIUS, TRACK_HALF], mirrored: false, front: false },
  { pos: [AXLE_REAR, TYRE_RADIUS, -TRACK_HALF], mirrored: true, front: false },
]

export function CarModel({ config, mode, interactive, hoodOpen, reducedMotion, layer = 0, cutaway = false }: Props) {
  const materials = useCarMaterials(config, mode)
  const root = useRef<THREE.Group>(null)
  const tick = useRef(0)
  const body = useRef<THREE.Group>(null)
  const exploded = mode === 'exploded'
  const ctx = useMemo<CarContextValue>(() => ({ interactive, exploded, reducedMotion }), [interactive, exploded, reducedMotion])
  const wheelGeo = useWheelGeometry(wheelOf(config), rimOf(config).inches)
  const drop = rideOf(config).drop
  const letteringMat = useLettering(wheelGeo.letteringRatio)

  // new parts must get their layer and shadow flags straight away
  useEffect(() => {
    tick.current = 0
  }, [config, mode, hoodOpen, cutaway, layer])

  useFrame((_, dt) => {
    const r = root.current
    if (!r) return
    if (body.current) {
      const y = body.current.position.y
      body.current.position.y = reducedMotion ? -drop : THREE.MathUtils.lerp(y, -drop, 1 - Math.exp(-dt * 6))
    }
    // walking ~300 meshes every frame is wasteful; options change rarely
    if (tick.current++ % 15 !== 0) return
    r.traverse((o) => {
      if (o.layers.mask !== 1 << layer) o.layers.set(layer)
      if ((o as THREE.Mesh).isMesh && !o.userData.overlay) {
        const mesh = o as THREE.Mesh
        const mat = mesh.material as THREE.Material
        const cast = !mat.transparent
        if (mesh.castShadow !== cast) mesh.castShadow = cast
      }
    })
  })

  return (
    <CarContext.Provider value={ctx}>
      <CarMaterialsContext.Provider value={materials}>
        <group ref={root}>
          <group ref={body}>
            <BodyShell accent={config.sideAccent} roof={config.roof} cutaway={cutaway} />
            <Hood open={hoodOpen || exploded} variant={config.hood} />
            <EngineBay />
            <FrontEnd grille={config.grille} splitter={config.splitter} accent={config.frontAccent} />
            <RearEnd diffuser={config.diffuser} spoiler={config.spoiler} trim={config.rearTrim} layout={config.exhaustLayout} />
            <SideParts mirrorCaps={config.mirrorCaps} skirts={config.skirts} windowTrim={config.windowTrim} vents={config.vents} cutaway={cutaway} />
            <Interior />
          </group>
          {interactive && <LightShow />}
          {interactive && mode === 'technical' && <ScanBeam />}
          <Part
            id="wheels"
            hotspot={{ position: [AXLE_FRONT, TYRE_RADIUS + 0.12, TRACK_HALF + 0.16], normal: [0.2, 0.2, 1], camera: 'wheels' }}
          >
            {WHEELS.map((w, i) => (
              <WheelSlot key={i} pos={w.pos} mirrored={w.mirrored} exploded={exploded} reducedMotion={reducedMotion}>
                <Wheel
                  geo={wheelGeo}
                  mirrored={w.mirrored}
                  position={[0, 0, 0]}
                  drilled={config.discs === 'drilled'}
                  lettering={config.tyres === 'lettered' && mode !== 'technical' ? letteringMat : null}
                />
              </WheelSlot>
            ))}
          </Part>
        </group>
      </CarMaterialsContext.Provider>
    </CarContext.Provider>
  )
}

/** Moves a wheel outwards in exploded view */
function WheelSlot({
  pos,
  mirrored,
  exploded,
  reducedMotion,
  children,
}: {
  pos: [number, number, number]
  mirrored: boolean
  exploded: boolean
  reducedMotion: boolean
  children: ReactNode
}) {
  const g = useRef<THREE.Group>(null)
  const placed = useRef(false)
  useFrame((_, dt) => {
    if (!g.current) return
    const target = pos[2] + (exploded ? (mirrored ? -0.45 : 0.45) : 0)
    g.current.position.z = reducedMotion || !placed.current ? target : THREE.MathUtils.lerp(g.current.position.z, target, 1 - Math.exp(-dt * 5))
    placed.current = true
  })
  return (
    <group ref={g} position-x={pos[0]} position-y={pos[1]}>
      {children}
    </group>
  )
}
