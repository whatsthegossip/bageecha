import { Container, Graphics } from 'pixi.js'

const STEM      = 0x4a7a1a
const LEAF      = 0x3a6812
const PETAL_A   = 0xf5c832
const PETAL_B   = 0xe8a818
const CENTER    = 0x5a3010
const CENTER_DK = 0x3a1a06

export class Sunflower extends Container {
  private head: Container
  private elapsed = 0

  constructor() {
    super()
    this.head = new Container()
    this.build()
  }

  private build() {
    const g = new Graphics()

    // Stem
    g.lineStyle(4, STEM, 1, 0.5)
    g.moveTo(0, 0)
    g.bezierCurveTo(2, -40, -3, -80, 0, -128)
    g.lineStyle(0)

    // Left leaf
    g.beginFill(LEAF)
    g.moveTo(-1, -62)
    g.bezierCurveTo(-44, -78, -56, -50, -20, -46)
    g.bezierCurveTo(-12, -44, -1, -56, -1, -62)
    g.endFill()
    // Leaf vein
    g.lineStyle(1, 0x2a5008, 0.5)
    g.moveTo(-1, -62)
    g.lineTo(-28, -52)
    g.lineStyle(0)

    // Right leaf
    g.beginFill(LEAF)
    g.moveTo(1, -88)
    g.bezierCurveTo(44, -104, 56, -76, 20, -72)
    g.bezierCurveTo(12, -70, 1, -84, 1, -88)
    g.endFill()
    g.lineStyle(1, 0x2a5008, 0.5)
    g.moveTo(1, -88)
    g.lineTo(28, -78)
    g.lineStyle(0)

    this.addChild(g)

    // ── Flower head ───────────────────────────────────────────────────────────
    this.head.position.set(0, -130)

    // Back petals (offset ring)
    const petalCount = 14
    const petalLen = 26
    const petalRad = 20

    for (let i = 0; i < petalCount; i++) {
      const angle = ((i + 0.5) / petalCount) * Math.PI * 2 - Math.PI / 2
      const pc = new Container()
      pc.rotation = angle + Math.PI / 2
      const pg = new Graphics()
      pg.beginFill(PETAL_B, 0.85)
      pg.drawEllipse(0, -(petalRad + petalLen * 0.5), 7, petalLen * 0.5)
      pg.endFill()
      pc.addChild(pg)
      this.head.addChild(pc)
    }

    // Front petals
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2
      const pc = new Container()
      pc.rotation = angle + Math.PI / 2
      const pg = new Graphics()
      pg.beginFill(i % 3 === 0 ? PETAL_B : PETAL_A)
      pg.drawEllipse(0, -(petalRad + petalLen * 0.5 + 3), 8, petalLen * 0.5)
      pg.endFill()
      pc.addChild(pg)
      this.head.addChild(pc)
    }

    // Center disc
    const center = new Graphics()
    center.beginFill(CENTER)
    center.drawCircle(0, 0, 19)
    center.endFill()

    // Seed pattern (Fibonacci-ish rings)
    center.beginFill(CENTER_DK)
    const rings = [
      { r: 4,  n: 5 },
      { r: 8,  n: 10 },
      { r: 12, n: 15 },
      { r: 16, n: 18 },
    ]
    rings.forEach(({ r, n }) => {
      for (let d = 0; d < n; d++) {
        const a = (d / n) * Math.PI * 2
        center.drawCircle(Math.cos(a) * r, Math.sin(a) * r, 1.4)
      }
    })
    center.endFill()

    this.head.addChild(center)
    this.addChild(this.head)
  }

  // Gentle idle sway — call from the scene ticker
  tick(deltaTime: number) {
    this.elapsed += deltaTime * 0.012
    this.head.rotation = Math.sin(this.elapsed) * 0.045
    this.rotation      = Math.sin(this.elapsed * 0.7 + 0.5) * 0.018
  }
}
