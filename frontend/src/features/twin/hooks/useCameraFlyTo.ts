import { useCallback, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface FlyTarget {
  position: THREE.Vector3
  target: THREE.Vector3
}

export function useCameraFlyTo(controlsRef: React.RefObject<OrbitControlsImpl | null>) {
  const { camera } = useThree()
  const animRef = useRef<{ fromPos: THREE.Vector3; fromTgt: THREE.Vector3; to: FlyTarget; elapsed: number; duration: number } | null>(null)

  useFrame((_, delta) => {
    const anim = animRef.current
    if (!anim) return

    anim.elapsed += delta
    const t = Math.min(1, anim.elapsed / anim.duration)
    // Ease in-out cubic
    const ease = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2

    camera.position.lerpVectors(anim.fromPos, anim.to.position, ease)
    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(anim.fromTgt, anim.to.target, ease)
      controlsRef.current.update()
    }

    if (t >= 1) {
      animRef.current = null
    }
  })

  const flyTo = useCallback((target: THREE.Vector3, position?: THREE.Vector3, duration: number = 1.2) => {
    const toPos = position || new THREE.Vector3(
      target.x + 15,
      target.y + 12,
      target.z + 15,
    )

    animRef.current = {
      fromPos: camera.position.clone(),
      fromTgt: controlsRef.current?.target.clone() || new THREE.Vector3(),
      to: { position: toPos, target: target.clone() },
      elapsed: 0,
      duration,
    }
  }, [camera, controlsRef])

  return { flyTo }
}
