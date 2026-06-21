import { Application, Container, Graphics } from 'pixi.js'
import { buildMeadowLayers } from './MeadowBackground'
import { Sunflower } from './plants/Sunflower'

// How far the camera can wander (px in world space)
const BOUNDS_X = 900
const BOUNDS_Y = 180

// Parallax multipliers per layer (sky → foreground)
const PARALLAX = [0.02, 0.06, 0.18, 0.45, 1.0]

const MOVE_SPEED = 2.8   // px per frame at 60fps
const EASE       = 0.055  // smoothing (lower = more glide)

export class GardenScene {
  private app: Application
  private layers: Container[] = []
  private plants: Sunflower[] = []
  private vignette!: Graphics

  private camX = 0
  private camY = 0
  private targetX = 0
  private targetY = 0

  private keys = new Set<string>()
  private drag = { active: false, startX: 0, startY: 0, camX: 0, camY: 0 }

  constructor(container: HTMLElement) {
    this.app = new Application({
      resizeTo: container,
      backgroundColor: 0xc8e8f2,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    })

    container.appendChild(this.app.view as HTMLCanvasElement)

    this.buildScene()
    this.buildVignette()
    this.bindInput()
    this.app.ticker.add(this.update.bind(this))
  }

  // ── Scene construction ─────────────────────────────────────────────────────

  private buildScene() {
    const { width: w, height: h } = this.app.screen

    for (let i = 0; i < 5; i++) {
      const layer = new Container()
      this.layers.push(layer)
      this.app.stage.addChild(layer)
    }

    buildMeadowLayers(this.layers, w, h)
    this.placePlants(w, h)
  }

  private placePlants(w: number, h: number) {
    // Sunflower lives in the mid-grass layer (index 3)
    const plantLayer = this.layers[3]
    const horizon = h * 0.26

    // Place one sunflower slightly right of center
    const sf = new Sunflower()
    sf.position.set(w * 0.52, horizon + h * 0.40)
    plantLayer.addChild(sf)
    this.plants.push(sf)
  }

  private buildVignette() {
    const { width: w, height: h } = this.app.screen
    const g = new Graphics()
    this.vignette = g

    // Soft dark border — gives the painting-canvas feel
    g.beginFill(0x000000, 0)
    g.drawRect(0, 0, w, h)
    g.endFill()

    // Four edge strips for a soft canvas vignette
    const depth = Math.min(w, h) * 0.18
    const edgeAlpha = 0.12

    g.beginFill(0x000000, edgeAlpha)
    g.drawRect(0, 0, w, depth)             // top
    g.drawRect(0, h - depth, w, depth)     // bottom
    g.drawRect(0, 0, depth, h)             // left
    g.drawRect(w - depth, 0, depth, h)     // right
    g.endFill()

    this.app.stage.addChild(g)
  }

  // ── Tick ───────────────────────────────────────────────────────────────────

  private update() {
    const dt = this.app.ticker.deltaTime

    // Key movement
    if (this.keys.has('ArrowLeft')  || this.keys.has('KeyA')) this.targetX -= MOVE_SPEED * dt
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) this.targetX += MOVE_SPEED * dt
    if (this.keys.has('ArrowUp')    || this.keys.has('KeyW')) this.targetY -= MOVE_SPEED * 0.45 * dt
    if (this.keys.has('ArrowDown')  || this.keys.has('KeyS')) this.targetY += MOVE_SPEED * 0.45 * dt

    // Clamp
    this.targetX = Math.max(-BOUNDS_X, Math.min(BOUNDS_X, this.targetX))
    this.targetY = Math.max(-BOUNDS_Y, Math.min(BOUNDS_Y, this.targetY))

    // Smooth easing
    this.camX += (this.targetX - this.camX) * EASE
    this.camY += (this.targetY - this.camY) * EASE

    // Apply parallax to each layer
    this.layers.forEach((layer, i) => {
      layer.x = -this.camX * PARALLAX[i]
      layer.y = -this.camY * PARALLAX[i] * 0.35
    })

    // Tick plants
    this.plants.forEach(p => p.tick(dt))
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  private bindInput() {
    window.addEventListener('keydown', e => this.keys.add(e.code))
    window.addEventListener('keyup',   e => this.keys.delete(e.code))

    const canvas = this.app.view as HTMLCanvasElement
    canvas.style.cursor = 'grab'

    // Mouse drag
    canvas.addEventListener('mousedown', e => {
      this.drag = { active: true, startX: e.clientX, startY: e.clientY, camX: this.targetX, camY: this.targetY }
      canvas.style.cursor = 'grabbing'
    })
    window.addEventListener('mousemove', e => {
      if (!this.drag.active) return
      this.targetX = this.drag.camX - (e.clientX - this.drag.startX) * 1.6
      this.targetY = this.drag.camY - (e.clientY - this.drag.startY) * 0.8
    })
    window.addEventListener('mouseup', () => {
      this.drag.active = false
      canvas.style.cursor = 'grab'
    })

    // Touch drag
    canvas.addEventListener('touchstart', e => {
      const t = e.touches[0]
      this.drag = { active: true, startX: t.clientX, startY: t.clientY, camX: this.targetX, camY: this.targetY }
    }, { passive: true })
    window.addEventListener('touchmove', e => {
      if (!this.drag.active) return
      const t = e.touches[0]
      this.targetX = this.drag.camX - (t.clientX - this.drag.startX) * 1.6
      this.targetY = this.drag.camY - (t.clientY - this.drag.startY) * 0.8
    }, { passive: true })
    window.addEventListener('touchend', () => { this.drag.active = false })
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  destroy() {
    this.app.destroy(true, { children: true, texture: true })
  }
}
