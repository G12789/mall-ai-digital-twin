import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useCameraFlyTo } from '../hooks/useCameraFlyTo'

interface CameraControllerProps {
  defaultTarget?: [number, number, number]
  defaultPosition?: [number, number, number]
  isOrthographic?: boolean
  searchTarget?: THREE.Vector3 | null
  onReady?: (controls: OrbitControlsImpl) => void
}

const CameraController = forwardRef<OrbitControlsImpl, CameraControllerProps>(
  function CameraController({ defaultTarget = [0, 5, 0], defaultPosition = [25, 15, 25], isOrthographic, searchTarget, onReady }, ref) {
    const localRef = useRef<OrbitControlsImpl>(null)
    const { camera } = useThree()
    const { flyTo } = useCameraFlyTo(localRef)

    useImperativeHandle(ref, () => localRef.current!, [])

    // Set initial camera position
    useEffect(() => {
      camera.position.set(...defaultPosition)
      if (localRef.current) {
        localRef.current.target.set(...defaultTarget)
        localRef.current.update()
      }
    }, [])

    // Apply orthographic changes
    useEffect(() => {
      if (isOrthographic && localRef.current) {
        // In 2D mode, position camera top-down
        const target = new THREE.Vector3(...defaultTarget)
        camera.position.set(target.x, target.y + 35, target.z + 0.5)
        localRef.current.target.copy(target)
        localRef.current.update()
      }
    }, [isOrthographic])

    useEffect(() => {
      if (localRef.current && onReady) {
        onReady(localRef.current)
      }
    }, [onReady])

    useEffect(() => {
      if (searchTarget) {
        flyTo(searchTarget)
      }
    }, [searchTarget, flyTo])

    return (
      <OrbitControls
        ref={localRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={isOrthographic ? 10 : 5}
        maxDistance={isOrthographic ? 60 : 80}
        maxPolarAngle={isOrthographic ? Math.PI / 2.5 : Math.PI / 2.1}
        minPolarAngle={isOrthographic ? 0 : 0.15}
        target={new THREE.Vector3(...defaultTarget)}
      />
    )
  })

export default CameraController
