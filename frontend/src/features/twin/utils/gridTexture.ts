import * as THREE from 'three'

export function createFloorGridTexture(
  size: number = 1024,
  gridSpacing: number = 64,
  lineColor: string = '#d0d0d0',
  bgColor: string = '#f5f5f5',
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = lineColor
  ctx.lineWidth = 1

  // Draw grid lines
  for (let i = gridSpacing; i < size; i += gridSpacing) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  // Draw thicker major grid lines every 5th
  ctx.strokeStyle = '#c0c0c0'
  ctx.lineWidth = 2
  for (let i = gridSpacing * 5; i < size; i += gridSpacing * 5) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createHeatmapMaterial(
  value: number,
  min: number = 0,
  max: number = 100,
): THREE.MeshStandardMaterial {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  let color: string
  if (t < 0.33) color = '#52c41a'
  else if (t < 0.66) color = '#faad14'
  else color = '#ff4d4f'

  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.1,
    transparent: true,
    opacity: 0.7,
    emissive: color,
    emissiveIntensity: t * 0.3,
  })
}
