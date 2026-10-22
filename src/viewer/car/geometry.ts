import * as THREE from 'three'

// Procedural body for the prototype car. All values are metres in a frame
// where +x points forward, +y up and +z to the car's right-hand side.
// Overall length, width, wheelbase and height follow the published G20
// dimensions; the surfaces themselves are an approximation, not BMW CAD data.

export const DIM = {
  length: 4.713,
  width: 1.827,
  height: 1.44,
  wheelbase: 2.851,
}
export const HL = DIM.length / 2
export const HW = DIM.width / 2
export const AXLE_FRONT = HL - 0.84
export const AXLE_REAR = AXLE_FRONT - DIM.wheelbase
export const TYRE_RADIUS = 0.333
export const TYRE_WIDTH = 0.235
export const ARCH_RADIUS = 0.388
export const TRACK_HALF = 0.8

/** x where the windscreen meets the bonnet / the rear screen meets the boot */
export const COWL_X = 0.72
export const DECK_X = -1.55
export const HOOD_FRONT_X = 2.1
export const REAR_BUMPER_X = -2.05

// ---------- interpolation ----------
type Pt = [number, number]

/** Monotone cubic interpolation (Fritsch-Carlson) over points sorted by x */
function monotone(points: Pt[]): (x: number) => number {
  const pts = [...points].sort((a, b) => a[0] - b[0])
  const n = pts.length
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const d: number[] = []
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]))
  const m: number[] = new Array(n)
  m[0] = d[0]
  m[n - 1] = d[n - 2]
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / d[i]
    const b = m[i + 1] / d[i]
    const s = a * a + b * b
    if (s > 9) {
      const t = 3 / Math.sqrt(s)
      m[i] = t * a * d[i]
      m[i + 1] = t * b * d[i]
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0]
    if (x >= xs[n - 1]) return ys[n - 1]
    let i = 0
    while (x > xs[i + 1]) i++
    const h = xs[i + 1] - xs[i]
    const t = (x - xs[i]) / h
    const t2 = t * t
    const t3 = t2 * t
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]
    )
  }
}

// ---------- body profiles ----------
const topProfile = monotone([
  [-HL, 0.88],
  [-2.32, 0.965],
  [-2.22, 0.995],
  [-1.9, 1.0],
  [DECK_X, 0.975],
  [-0.6, 0.955],
  [COWL_X, 0.935],
  [1.3, 0.885],
  [1.8, 0.825],
  [2.1, 0.76],
  [2.28, 0.7],
  [HL, 0.645],
])

const baseBottom = monotone([
  [-HL, 0.3],
  [-2.25, 0.22],
  [-2.0, 0.2],
  [1.9, 0.19],
  [2.2, 0.2],
  [HL, 0.27],
])

function archBottom(x: number, axle: number): number {
  const dx = x - axle
  if (Math.abs(dx) >= ARCH_RADIUS) return -1
  return TYRE_RADIUS + Math.sqrt(ARCH_RADIUS * ARCH_RADIUS - dx * dx)
}

export function bodyTop(x: number) {
  return topProfile(x)
}

export function bodyBottom(x: number) {
  return Math.max(baseBottom(x), archBottom(x, AXLE_FRONT), archBottom(x, AXLE_REAR))
}

/** Plan-view half width, squared off towards the nose and tail */
export function bodyHalfWidth(x: number) {
  const front0 = 1.75
  const rear0 = -1.85
  let f = 1
  if (x > front0) {
    const u = Math.min(1, (x - front0) / (HL - front0))
    f = 0.6 + 0.4 * Math.pow(1 - Math.pow(u, 2.6), 1 / 2.6)
  } else if (x < rear0) {
    const u = Math.min(1, (rear0 - x) / (rear0 + HL))
    f = 0.76 + 0.24 * Math.pow(1 - Math.pow(u, 3), 1 / 3)
  }
  // slight waist between the arches
  const waist = x < AXLE_FRONT - 0.4 && x > AXLE_REAR + 0.4 ? 0.012 * Math.sin(((x - (AXLE_REAR + 0.4)) / (AXLE_FRONT - AXLE_REAR - 0.8)) * Math.PI) : 0
  return HW * f - waist
}

const N_TOP = 3.8
const N_BOTTOM = 5.5
const spow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e)

/** Point on the lower body cross-section. theta runs from -PI/2 (bottom) through 0 (side, +z) to PI/2 (top) */
export function bodyPoint(x: number, theta: number): [number, number] {
  const top = bodyTop(x)
  const bottom = bodyBottom(x)
  const cy = (top + bottom) / 2
  const ay = (top - bottom) / 2
  const hw = bodyHalfWidth(x)
  const s = Math.sin(theta)
  const c = Math.cos(theta)
  const n = s >= 0 ? N_TOP : N_BOTTOM
  const y = cy + ay * spow(s, 2 / n)
  // gentle tumblehome above the widest point, tuck under below it
  const tuck = s > 0 ? 1 - 0.07 * s * s : 1 - 0.035 * s * s
  const z = hw * spow(c, 2 / n) * tuck
  return [y, z]
}

/** theta at which the bonnet / cabin opening starts on the +z side */
export const SEAM_THETA = 0.78

export function seamPoint(x: number): [number, number] {
  return bodyPoint(x, SEAM_THETA)
}

/** z of the body surface at height y on the +z side (lower body only) */
export function surfaceZ(x: number, y: number): number {
  let prevY = -Infinity
  let prevZ = 0
  for (let i = 0; i <= 96; i++) {
    const th = -Math.PI / 2 + (Math.PI * i) / 96
    const [py, pz] = bodyPoint(x, th)
    if (py >= y) {
      if (prevY === -Infinity) return pz
      const t = (y - prevY) / (py - prevY || 1)
      return prevZ + (pz - prevZ) * t
    }
    prevY = py
    prevZ = pz
  }
  return prevZ
}

/** Front-most x of the body at height y and lateral offset z. Used to sit lamps and grilles on the nose. */
export function frontSurfaceX(y: number, z: number): number {
  for (let x = HL; x > HL - 0.8; x -= 0.004) if (surfaceZ(x, y) >= Math.abs(z)) return x
  return HL - 0.8
}
export function rearSurfaceX(y: number, z: number): number {
  for (let x = -HL; x < -HL + 0.8; x += 0.004) if (surfaceZ(x, y) >= Math.abs(z)) return x
  return -HL + 0.8
}
/** Plan-view yaw of the body side at (x, y): positive when the surface turns towards the centreline going forward */
export function surfaceYaw(x: number, y: number): number {
  const e = 0.01
  return Math.atan2(surfaceZ(x - e, y) - surfaceZ(x + e, y), 2 * e)
}

// ---------- greenhouse ----------
const roofProfile = monotone([
  [DECK_X, 0.0],
  [-1.42, 1.1],
  [-1.25, 1.26],
  [-1.0, 1.375],
  [-0.7, 1.43],
  [-0.4, 1.44],
  [-0.15, 1.42],
  [0.05, 1.37],
  [0.3, 1.22],
  [0.52, 1.07],
  [COWL_X, 0.0],
])

export function greenhouseHeight(x: number): number {
  const [ys] = seamPoint(x)
  if (x >= COWL_X || x <= DECK_X) return 0
  // ends of the profile are pinned to the seam height
  const r = roofProfile(x)
  const nearFront = x > 0.52 ? (x - 0.52) / (COWL_X - 0.52) : 0
  const nearRear = x < -1.42 ? (-1.42 - x) / (-1.42 - DECK_X) : 0
  let roof = r
  if (nearFront > 0) roof = THREE.MathUtils.lerp(1.07, ys, nearFront)
  if (nearRear > 0) roof = THREE.MathUtils.lerp(1.1, ys, nearRear)
  return Math.max(0, roof - ys)
}

const N_GH = 3.4
/** Point on the greenhouse cross-section. phi runs from 0 (+z belt) through PI/2 (roof centre) to PI (-z belt) */
export function greenhousePoint(x: number, phi: number, inflate = 0): [number, number] {
  const [ys, zs] = seamPoint(x)
  const h = greenhouseHeight(x)
  const u = Math.cos(phi)
  const v = Math.sin(phi)
  const vy = Math.pow(Math.max(0, v), 2 / N_GH)
  const halfW = THREE.MathUtils.lerp(zs, zs * 0.76, vy)
  const z = spow(u, 2 / N_GH) * halfW * (1 + inflate)
  const y = ys - 0.02 + (h + 0.02) * vy + inflate * 0.6
  return [y, z]
}

// ---------- geometry builders ----------
export function stations(x0: number, x1: number, step = 0.02, extra: number[] = []): number[] {
  const out: number[] = []
  const n = Math.max(2, Math.ceil((x1 - x0) / step))
  for (let i = 0; i <= n; i++) out.push(x0 + ((x1 - x0) * i) / n)
  for (const e of extra) if (e > x0 && e < x1) out.push(e)
  return [...new Set(out.map((v) => +v.toFixed(5)))].sort((a, b) => a - b)
}

/** Stations along the full body, refined around the wheel arch edges */
export function bodyStations(x0: number, x1: number): number[] {
  const extra: number[] = []
  for (const a of [AXLE_FRONT, AXLE_REAR]) {
    for (const d of [-1, 1]) {
      const edge = a + d * ARCH_RADIUS
      for (const o of [-0.012, -0.004, 0.004, 0.012]) extra.push(edge + o)
    }
    for (let i = -16; i <= 16; i++) extra.push(a + (i / 16) * ARCH_RADIUS * 0.98)
  }
  return stations(x0, x1, 0.022, extra)
}

/**
 * Lofts a surface through cross-sections. section(x, t) returns [y, z] for t in [t0, t1].
 * Faces point outward when t runs counter-clockwise seen from +x.
 */
export function loft(
  xs: number[],
  t0: number,
  t1: number,
  tSteps: number,
  section: (x: number, t: number) => [number, number],
  opts: { capStart?: boolean; capEnd?: boolean } = {},
): THREE.BufferGeometry {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const cols = tSteps + 1
  xs.forEach((x, i) => {
    for (let j = 0; j <= tSteps; j++) {
      const t = t0 + ((t1 - t0) * j) / tSteps
      const [y, z] = section(x, t)
      pos.push(x, y, z)
      uv.push(x, j / tSteps)
    }
    if (i > 0) {
      for (let j = 0; j < tSteps; j++) {
        const a = (i - 1) * cols + j
        const b = i * cols + j
        idx.push(a, b, a + 1, a + 1, b, b + 1)
      }
    }
  })
  const cap = (xi: number, flip: boolean) => {
    const x = xs[xi]
    const centre = pos.length / 3
    let cy = 0
    for (let j = 0; j <= tSteps; j++) cy += pos[(xi * cols + j) * 3 + 1]
    pos.push(x, cy / cols, 0)
    uv.push(0.5, 0.5)
    // a duplicated ring keeps the cap's normals flat
    const ring = pos.length / 3
    for (let j = 0; j <= tSteps; j++) {
      const k = (xi * cols + j) * 3
      pos.push(pos[k], pos[k + 1], pos[k + 2])
      uv.push(j / tSteps, 0)
    }
    for (let j = 0; j < tSteps; j++) {
      if (flip) idx.push(centre, ring + j + 1, ring + j)
      else idx.push(centre, ring + j, ring + j + 1)
    }
  }
  if (opts.capStart) cap(0, false)
  if (opts.capEnd) cap(xs.length - 1, true)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Full lower-body ring section with a seam at the bottom centre */
export const ringSection = (x: number, t: number) => bodyPoint(x, -Math.PI / 2 + t * Math.PI * 2)

/** Ring section with the top band removed: an open U from the -z seam, under the car, to the +z seam */
export const openSection = (x: number, t: number) =>
  bodyPoint(x, Math.PI - SEAM_THETA + t * (Math.PI + 2 * SEAM_THETA))

/** The bonnet or cabin lid: the band of the section between the two seams */
export function lidSection(inset: number, lift = 0) {
  return (x: number, t: number): [number, number] => {
    const th = SEAM_THETA + inset + (Math.PI - 2 * SEAM_THETA - 2 * inset) * t
    const [y, z] = bodyPoint(x, th)
    return [y + lift, z * (1 + lift)]
  }
}

/** A ribbon that follows the side surface between two heights over an x range */
export function sideRibbon(x0: number, x1: number, y0: number, y1: number, offset = 0.003, steps = 60): THREE.BufferGeometry {
  const xs = stations(x0, x1, (x1 - x0) / steps)
  return loft(xs, 0, 1, 2, (x, t) => {
    const y = y0 + (y1 - y0) * t
    return [y, surfaceZ(x, y) + offset]
  })
}

/** A vertical ribbon at fixed x, used for panel shut lines */
export function shutLine(x: number, y0: number, y1: number, width = 0.006): THREE.BufferGeometry {
  return loft([x - width / 2, x + width / 2], 0, 1, 24, (xx, t) => {
    const y = y0 + (y1 - y0) * t
    return [y, surfaceZ(xx, y) + 0.0015]
  })
}

/** Curve through a list of points, as a tube */
export function tubeAlong(points: THREE.Vector3[], radius: number, closed = false): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal')
  return new THREE.TubeGeometry(curve, Math.max(24, points.length * 3), radius, 8, closed)
}

export function roundedRectShape(w: number, h: number, r: number, cx = 0, cy = 0): THREE.Shape {
  const s = new THREE.Shape()
  const x = cx - w / 2
  const y = cy - h / 2
  r = Math.min(r, w / 2, h / 2)
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

export function polygonShape(pts: [number, number][]): THREE.Shape {
  const s = new THREE.Shape()
  pts.forEach(([a, b], i) => (i ? s.lineTo(a, b) : s.moveTo(a, b)))
  s.closePath()
  return s
}

// ---------- conforming patches for lamps, intakes and trim ----------

/** Front-most x of the body surface at (y, z), found by bisection. Positive x side only. */
export function noseX(y: number, z: number): number {
  const az = Math.abs(z)
  if (surfaceZ(HL, y) >= az) return HL
  let lo = HL - 0.9
  let hi = HL
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2
    if (surfaceZ(mid, y) >= az) lo = mid
    else hi = mid
  }
  return lo
}

/** Rear-most x of the body surface at (y, z) */
export function tailX(y: number, z: number): number {
  const az = Math.abs(z)
  if (surfaceZ(-HL, y) >= az) return -HL
  let lo = -HL
  let hi = -HL + 0.9
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2
    if (surfaceZ(mid, y) >= az) hi = mid
    else lo = mid
  }
  return hi
}

/** Height of the upper body surface at (x, z) */
export function surfaceY(x: number, z: number): number {
  const az = Math.abs(z)
  let prev = bodyPoint(x, Math.PI / 2)
  for (let i = 1; i <= 96; i++) {
    const th = Math.PI / 2 - (Math.PI / 2) * (i / 96)
    const p = bodyPoint(x, th)
    if (p[1] >= az) {
      const t = (az - prev[1]) / (p[1] - prev[1] || 1)
      return prev[0] + (p[0] - prev[0]) * t
    }
    prev = p
  }
  return prev[0]
}

/** Build an indexed grid surface from a rows x cols point function */
export function gridSurface(rows: number, cols: number, fn: (i: number, j: number) => THREE.Vector3, flip = false): THREE.BufferGeometry {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const p = fn(i, j)
      pos.push(p.x, p.y, p.z)
      uv.push(j / cols, i / rows)
      if (i > 0 && j > 0) {
        const a = (i - 1) * (cols + 1) + j - 1
        const b = i * (cols + 1) + j - 1
        if (flip) idx.push(a, a + 1, b, a + 1, b + 1, b)
        else idx.push(a, b, a + 1, a + 1, b, b + 1)
      }
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Horizontal extent of a polygon (z, y points) at height y */
function spanAt(poly: Pt[], y: number): [number, number] | null {
  const xs: number[] = []
  for (let i = 0; i < poly.length; i++) {
    const [z0, y0] = poly[i]
    const [z1, y1] = poly[(i + 1) % poly.length]
    if ((y >= Math.min(y0, y1) && y <= Math.max(y0, y1)) && y0 !== y1) xs.push(z0 + ((y - y0) / (y1 - y0)) * (z1 - z0))
  }
  if (xs.length < 2) return null
  return [Math.min(...xs), Math.max(...xs)]
}

/**
 * A patch that sits on the nose ('front') or tail ('rear') of the body, shaped by
 * a y-monotone outline given as [z, y] points on the +z side.
 */
export function endPatch(end: 'front' | 'rear', outline: Pt[], offset: number, rows = 14, cols = 28): THREE.BufferGeometry {
  const ys = outline.map((p) => p[1])
  const y0 = Math.min(...ys) + 1e-4
  const y1 = Math.max(...ys) - 1e-4
  const surf = end === 'front' ? noseX : tailX
  const dir = end === 'front' ? 1 : -1
  return gridSurface(rows, cols, (i, j) => {
    const y = y0 + ((y1 - y0) * i) / rows
    const span = spanAt(outline, y) ?? [0, 0]
    const z = span[0] + ((span[1] - span[0]) * j) / cols
    const x = surf(y, z)
    // push along the local normal: mostly x on the face, mostly z on the corner
    const e = 0.01
    const dx = (surf(y, z + e) - surf(y, z - e)) / (2 * e)
    const nx = dir
    const nz = -dx * dir
    const len = Math.hypot(nx, nz)
    return new THREE.Vector3(x + (nx / len) * offset, y, z + (nz / len) * offset)
  }, end === 'rear')
}

/** Closed tube around an outline on the nose or tail */
export function endOutline(end: 'front' | 'rear', outline: Pt[], offset: number, radius: number): THREE.TubeGeometry {
  const surf = end === 'front' ? noseX : tailX
  const dir = end === 'front' ? 1 : -1
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]
    const b = outline[(i + 1) % outline.length]
    for (let k = 0; k < 6; k++) {
      const t = k / 6
      const z = a[0] + (b[0] - a[0]) * t
      const y = a[1] + (b[1] - a[1]) * t
      pts.push(new THREE.Vector3(surf(y, z) + dir * offset, y, z))
    }
  }
  return tubeAlong(pts, radius, true)
}

/** Loft along z for parts that sit on the boot lid, such as spoilers */
export function deckLoft(
  zHalf: number,
  profile: Pt[],
  taper: (u: number) => number,
  rowsZ = 48,
): THREE.BufferGeometry {
  // profile points are [x, height above the lid surface], walked around the section
  const cols = profile.length - 1
  return gridSurface(rowsZ, cols, (i, j) => {
    const u = i / rowsZ
    const z = -zHalf + 2 * zHalf * u
    const [x, h] = profile[j]
    const k = taper(Math.abs(2 * u - 1))
    return new THREE.Vector3(x, surfaceY(x, z) - 0.006 + h * k, z)
  })
}
