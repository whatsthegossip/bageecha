import { Container, Graphics } from 'pixi.js'

// Palette lifted from the reference painting
const SKY_TOP    = 0xe8f4f6
const SKY_BOTTOM = 0xcce4ee
const CLOUD      = 0xf6fafc
const MTN_FAR    = 0x8aaabf
const MTN_MID    = 0x6a8fa8
const TREE_LINE  = 0x4a7a28
const GRASS_HOR  = 0xbcd940  // bright yellow-green at horizon
const GRASS_MID  = 0x7ab82a
const GRASS_NEAR = 0x54a018
const GRASS_FORE = 0x388010

// How far in each direction the camera can wander (px)
const CAMERA_X_BOUND = 900

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff
  return (
    (Math.round(ar + (br - ar) * t) << 16) |
    (Math.round(ag + (bg - ag) * t) << 8) |
     Math.round(ab + (bb - ab) * t)
  )
}

// Returns the x start and width needed so no gap shows when parallaxed
function layerBounds(w: number, parallaxFactor: number) {
  const pad = Math.ceil(CAMERA_X_BOUND * parallaxFactor) + 60
  return { x: -pad, width: w + pad * 2 }
}

export function buildMeadowLayers(
  layers: Container[],
  w: number,
  h: number
) {
  const horizon = Math.round(h * 0.26)

  drawSkyLayer(layers[0], w, h, horizon)
  drawMountainLayer(layers[1], w, h, horizon)
  drawFarGrassLayer(layers[2], w, h, horizon)
  drawMidGrassLayer(layers[3], w, h, horizon)
  drawNearGrassLayer(layers[4], w, h, horizon)
}

// ── Layer 0: Sky ─────────────────────────────────────────────────────────────

function drawSkyLayer(layer: Container, w: number, h: number, horizon: number) {
  const { x, width } = layerBounds(w, 0.02)
  const g = new Graphics()

  // Sky gradient (approximated with horizontal bands)
  const bands = 14
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1)
    const y = lerp(0, horizon + 4, t)
    const nextY = lerp(0, horizon + 4, (i + 1) / (bands - 1))
    g.beginFill(lerpColor(SKY_TOP, SKY_BOTTOM, t))
    g.drawRect(x, y - 1, width, nextY - y + 2)
    g.endFill()
  }

  // Soft clouds — seeded so they look deliberate
  const clouds = [
    { cx: 0.12, cy: 0.28, rx: 70, ry: 18, a: 0.55 },
    { cx: 0.28, cy: 0.18, rx: 95, ry: 22, a: 0.50 },
    { cx: 0.50, cy: 0.22, rx: 80, ry: 20, a: 0.45 },
    { cx: 0.68, cy: 0.14, rx: 110, ry: 25, a: 0.52 },
    { cx: 0.85, cy: 0.30, rx: 65, ry: 16, a: 0.48 },
    { cx: -0.15, cy: 0.20, rx: 85, ry: 20, a: 0.42 },
    { cx: 1.12, cy: 0.16, rx: 90, ry: 22, a: 0.50 },
  ]
  clouds.forEach(({ cx, cy, rx, ry, a }) => {
    const px = cx * w
    const py = cy * horizon
    g.beginFill(CLOUD, a)
    g.drawEllipse(px,           py,           rx,       ry)
    g.drawEllipse(px - rx * 0.45, py + ry * 0.3, rx * 0.7, ry * 0.75)
    g.drawEllipse(px + rx * 0.5,  py + ry * 0.2, rx * 0.6, ry * 0.7)
    g.endFill()
  })

  layer.addChild(g)
}

// ── Layer 1: Mountains + tree-line ───────────────────────────────────────────

function drawMountainLayer(layer: Container, w: number, h: number, horizon: number) {
  const { x, width } = layerBounds(w, 0.06)
  const g = new Graphics()

  // Mountain silhouettes (two passes: far then near)
  const farPeaks = [
    { px: -0.05, height: 0.12 },
    { px: 0.10,  height: 0.16 },
    { px: 0.25,  height: 0.11 },
    { px: 0.38,  height: 0.14 },
    { px: 0.52,  height: 0.12 },
    { px: 0.65,  height: 0.17 },
    { px: 0.80,  height: 0.13 },
    { px: 0.95,  height: 0.10 },
    { px: 1.10,  height: 0.14 },
  ]

  farPeaks.forEach(({ px, height }) => {
    const bw = w * 0.22
    const mx = px * w
    const peak = horizon - h * height
    g.beginFill(MTN_FAR, 0.75)
    g.moveTo(mx - bw * 0.5, horizon + 2)
    g.lineTo(mx, peak)
    g.lineTo(mx + bw * 0.5, horizon + 2)
    g.endFill()
  })

  const nearPeaks = [
    { px: 0.05,  height: 0.09 },
    { px: 0.20,  height: 0.07 },
    { px: 0.42,  height: 0.08 },
    { px: 0.60,  height: 0.10 },
    { px: 0.78,  height: 0.07 },
    { px: 0.92,  height: 0.09 },
    { px: 1.05,  height: 0.08 },
    { px: -0.08, height: 0.08 },
  ]

  nearPeaks.forEach(({ px, height }) => {
    const bw = w * 0.18
    const mx = px * w
    const peak = horizon - h * height
    g.beginFill(MTN_MID, 0.80)
    g.moveTo(mx - bw * 0.5, horizon + 2)
    g.lineTo(mx, peak)
    g.lineTo(mx + bw * 0.5, horizon + 2)
    g.endFill()
  })

  // Tree line along horizon
  const seed = 42
  for (let i = 0; i < Math.ceil(width / 14); i++) {
    const tx = x + i * 14
    const tHeight = 12 + ((seed * (i + 1) * 7) % 10)
    const col = lerpColor(TREE_LINE, MTN_MID, ((seed * i * 3) % 10) / 20)
    g.beginFill(col, 0.65)
    g.moveTo(tx, horizon + 1)
    g.lineTo(tx + 7, horizon - tHeight)
    g.lineTo(tx + 14, horizon + 1)
    g.endFill()
  }

  layer.addChild(g)
}

// ── Layer 2: Far grass band ───────────────────────────────────────────────────

function drawFarGrassLayer(layer: Container, w: number, h: number, horizon: number) {
  const { x, width } = layerBounds(w, 0.18)
  const g = new Graphics()

  const yTop = horizon - 2
  const yBot = horizon + h * 0.22

  const bands = 10
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1)
    const y = lerp(yTop, yBot, t)
    const ny = lerp(yTop, yBot, (i + 1) / (bands - 1))
    g.beginFill(lerpColor(GRASS_HOR, GRASS_MID, t))
    g.drawRect(x, y - 1, width, ny - y + 2)
    g.endFill()
  }

  // Subtle color variation patches
  for (let i = 0; i < 12; i++) {
    const px = x + (i / 12) * width + 40
    const py = lerp(yTop + 10, yBot - 20, (i * 7 % 10) / 10)
    const pr = 60 + (i * 13 % 30)
    g.beginFill(lerpColor(GRASS_HOR, GRASS_MID, 0.3 + (i % 3) * 0.2), 0.12)
    g.drawEllipse(px, py, pr * 2.5, pr * 0.6)
    g.endFill()
  }

  layer.addChild(g)
}

// ── Layer 3: Mid grass — the plant zone ──────────────────────────────────────

function drawMidGrassLayer(layer: Container, w: number, h: number, horizon: number) {
  const { x, width } = layerBounds(w, 0.45)
  const g = new Graphics()

  const yTop = horizon + h * 0.18
  const yBot = horizon + h * 0.52

  const bands = 10
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1)
    const y = lerp(yTop, yBot, t)
    const ny = lerp(yTop, yBot, (i + 1) / (bands - 1))
    g.beginFill(lerpColor(GRASS_MID, GRASS_NEAR, t))
    g.drawRect(x, y - 1, width, ny - y + 2)
    g.endFill()
  }

  // Organic patches
  for (let i = 0; i < 16; i++) {
    const px = x + (i / 16) * width + 30
    const py = lerp(yTop + 15, yBot - 25, (i * 11 % 10) / 10)
    g.beginFill(lerpColor(GRASS_MID, GRASS_NEAR, (i % 4) * 0.25), 0.10)
    g.drawEllipse(px, py, 90, 30)
    g.endFill()
  }

  layer.addChild(g)
}

// ── Layer 4: Near grass — foreground ─────────────────────────────────────────

function drawNearGrassLayer(layer: Container, w: number, h: number, horizon: number) {
  const { x, width } = layerBounds(w, 1.0)
  const g = new Graphics()

  const yTop = horizon + h * 0.46
  const yBot = h + 4

  const bands = 8
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1)
    const y = lerp(yTop, yBot, t)
    const ny = lerp(yTop, yBot, (i + 1) / (bands - 1))
    g.beginFill(lerpColor(GRASS_NEAR, GRASS_FORE, t))
    g.drawRect(x, y - 1, width, ny - y + 2)
    g.endFill()
  }

  // Foreground grass blades
  const bladeCount = Math.ceil(width / 9)
  for (let i = 0; i < bladeCount; i++) {
    const bx = x + i * 9
    const baseY = yTop + 10 + Math.sin(bx * 0.04) * 18
    const bladeH = 22 + Math.sin(bx * 0.07 + 1) * 10 + Math.sin(bx * 0.13) * 6
    const lean = Math.sin(bx * 0.05) * 7
    const col = lerpColor(GRASS_NEAR, GRASS_FORE, Math.abs(Math.sin(bx * 0.03)))

    g.lineStyle(1.8, col, 0.70)
    g.moveTo(bx, baseY)
    g.quadraticCurveTo(bx + lean, baseY - bladeH * 0.6, bx + lean * 0.5, baseY - bladeH)
    g.lineStyle(0)
  }

  layer.addChild(g)
}
