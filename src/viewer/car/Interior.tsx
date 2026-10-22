import { RoundedBox } from '@react-three/drei'
import { seamPoint } from './geometry'
import { useMat } from './materials'
import { Part } from './Part'

// Simplified prototype cabin, right-hand drive as sold in India. It exists so
// that the interior options have real geometry to act on; it is not modelled
// on BMW's actual interior.

function Seat({ x, z, width = 0.5 }: { x: number; z: number; width?: number }) {
  const m = useMat()
  return (
    <group position={[x, 0, z]}>
      <RoundedBox args={[0.5, 0.12, width]} radius={0.04} smoothness={3} position={[0, 0.43, 0]} material={m.get('seat')} />
      <RoundedBox args={[0.13, 0.6, width]} radius={0.05} smoothness={3} position={[-0.27, 0.74, 0]} rotation={[0, 0, -0.18]} material={m.get('seat')} />
      <mesh position={[-0.205, 0.72, 0]} rotation={[0, 0, -0.18]} material={m.get('seatAccent')}>
        <boxGeometry args={[0.005, 0.46, 0.02]} />
      </mesh>
      <RoundedBox args={[0.09, 0.15, Math.min(0.26, width * 0.55)]} radius={0.035} smoothness={3} position={[-0.36, 1.12, 0]} rotation={[0, 0, -0.12]} material={m.get('seat')} />
    </group>
  )
}

export function Interior() {
  const m = useMat()
  const zs = seamPoint(-0.3)[1]
  return (
    <Part id="interior" explode={[0, 0.42, 0]} hotspot={{ position: [-0.2, 1.24, 0.36], normal: [0, 1, 0.35], camera: 'interior' }}>
      <pointLight position={[-0.4, 1.25, 0]} intensity={0.9} distance={2.2} decay={2} color="#dfe6ff" />
      <mesh position={[-0.45, 0.3, 0]} material={m.get('cabin')}>
        <boxGeometry args={[2.1, 0.02, 1.5]} />
      </mesh>
      <Seat x={-0.12} z={0.37} />
      <Seat x={-0.12} z={-0.37} />
      <Seat x={-1.0} z={0.33} width={0.52} />
      <Seat x={-1.0} z={-0.33} width={0.52} />

      {/* dashboard, trim strip and the ambient light line */}
      <RoundedBox args={[0.4, 0.24, 1.5]} radius={0.06} smoothness={3} position={[0.55, 0.8, 0]} material={m.get('cabin')} />
      <mesh position={[0.348, 0.79, 0]} material={m.get('dashTrim')}>
        <boxGeometry args={[0.012, 0.04, 1.36]} />
      </mesh>
      <mesh position={[0.344, 0.817, 0]} material={m.get('ambient')}>
        <boxGeometry args={[0.006, 0.005, 1.36]} />
      </mesh>
      <mesh position={[0.45, 0.975, 0.14]} rotation={[0, 0, -0.25]} material={m.get('screen')}>
        <boxGeometry args={[0.018, 0.11, 0.66]} />
      </mesh>

      {/* centre console */}
      <RoundedBox args={[0.9, 0.16, 0.2]} radius={0.04} smoothness={3} position={[-0.05, 0.46, 0]} material={m.get('cabin')} />
      <mesh position={[-0.05, 0.545, 0]} material={m.get('dashTrim')}>
        <boxGeometry args={[0.6, 0.008, 0.14]} />
      </mesh>
      <RoundedBox args={[0.07, 0.07, 0.05]} radius={0.02} smoothness={2} position={[0.12, 0.58, 0]} material={m.get('glossBlack')} />

      {/* steering wheel on the right-hand side */}
      <group position={[0.22, 0.86, 0.37]} rotation={[0, 0, 0.32]}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={m.get('steering')}>
          <torusGeometry args={[0.18, 0.019, 12, 48]} />
        </mesh>
        <mesh position={[0, 0.18, 0]} material={m.get('seatAccent')}>
          <boxGeometry args={[0.042, 0.012, 0.012]} />
        </mesh>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((a) => (
          <mesh key={a} position={[0.005, Math.cos(a + Math.PI) * 0.09, Math.sin(a + Math.PI) * 0.09]} rotation={[a + Math.PI, 0, 0]} material={m.get('steering')}>
            <boxGeometry args={[0.02, 0.18, 0.03]} />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.get('steering')}>
          <cylinderGeometry args={[0.055, 0.055, 0.05, 24]} />
        </mesh>
        <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.get('cabin')}>
          <cylinderGeometry args={[0.03, 0.04, 0.25, 12]} />
        </mesh>
      </group>

      {/* door ambient strips */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[-0.3, 0.8, s * (zs - 0.045)]} material={m.get('ambient')}>
          <boxGeometry args={[1.5, 0.006, 0.006]} />
        </mesh>
      ))}
    </Part>
  )
}
