import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PulseHighlightProps {
  active: boolean
  position: [number, number, number]
  size?: number
  color?: string
}

export default function PulseHighlight({
  active,
  position,
  size = 0.5,
  color = '#00e5ff',
}: PulseHighlightProps) {
  const ringRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame((_, delta) => {
    if (!active || !materialRef.current || !ringRef.current) return
    // Pulse opacity between 0.3 and 0.8
    const pulse = 0.55 + Math.sin(Date.now() * 0.004) * 0.25
    materialRef.current.opacity = pulse
    // Subtle scale pulse
    const scale = 0.95 + Math.sin(Date.now() * 0.003) * 0.05
    ringRef.current.scale.setScalar(scale)
  })

  if (!active) return null

  return (
    <mesh ref={ringRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[size * 0.6, size, 64]} />
      <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.6} side={THREE.DoubleSide} depthTest={false} />
    </mesh>
  )
}
