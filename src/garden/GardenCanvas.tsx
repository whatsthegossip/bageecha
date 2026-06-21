import { useEffect, useRef } from 'react'
import { GardenScene } from './GardenScene'

export default function GardenCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<GardenScene | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new GardenScene(containerRef.current)
    sceneRef.current = scene

    return () => {
      scene.destroy()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
    />
  )
}
