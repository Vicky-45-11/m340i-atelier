// Content and camera choreography for the scroll story. Each beat is one
// scroll step: the camera holds on its shot while the beat's text is on
// screen, then eases to the next shot as the beat scrolls away.

type V3 = [number, number, number]

export interface Beat {
  id: string
  /** scene number shown in the progress rail, 1 to 6 */
  scene: number
  camera: { position: V3; target: V3; fov: number }
  /** stylised x-ray of the prototype instead of paint */
  technical?: boolean
  hoodOpen?: boolean
  /** light streaks running along the body */
  streaks?: boolean
  /** slow turntable spin of the car */
  spin?: boolean
  /** use the visitor's chosen environment instead of the midnight studio */
  useEnvironment?: boolean
  /** lift the roof and glass off to show the cabin */
  cutaway?: boolean
  /** where the car sits on a wide screen, as a fraction of the frame: +x right, +y up.
   *  It keeps the subject clear of the text card. */
  frame?: [number, number]
}

export const BEATS: Beat[] = [
  { id: 'hero', scene: 1, camera: { position: [5.9, 0.7, 4.7], target: [0, 0.62, 0], fov: 30 }, spin: true, frame: [0.16, -0.1] },
  { id: 'machine', scene: 1, camera: { position: [0.3, 0.8, 8.4], target: [0, 0.62, 0], fov: 31 }, frame: [0.17, 0] },
  { id: 'grille', scene: 2, camera: { position: [4.7, 0.78, 1.6], target: [2.15, 0.52, 0.05], fov: 26 }, streaks: true, frame: [-0.18, 0] },
  { id: 'headlights', scene: 2, camera: { position: [3.9, 0.9, 2.5], target: [1.95, 0.6, 0.45], fov: 26 }, streaks: true, frame: [0.1, 0] },
  { id: 'contours', scene: 2, camera: { position: [3.2, 2.9, 5.4], target: [-0.3, 0.68, 0], fov: 30 }, streaks: true, frame: [-0.16, 0] },
  { id: 'wheels', scene: 2, camera: { position: [2.9, 0.5, 2.65], target: [1.45, 0.36, 0.8], fov: 28 }, streaks: true, frame: [0.18, 0] },
  { id: 'rear', scene: 2, camera: { position: [-5.2, 1.1, 3.0], target: [-1.4, 0.6, 0], fov: 29 }, streaks: true, frame: [-0.16, 0] },
  { id: 'engine', scene: 3, camera: { position: [3.9, 2.6, 2.0], target: [1.2, 0.68, 0], fov: 31 }, technical: true, hoodOpen: true, frame: [0.17, 0] },
  { id: 'numbers', scene: 3, camera: { position: [0.2, 1.7, 8.6], target: [0, 0.62, 0], fov: 31 }, technical: true, frame: [0, 0.2] },
  { id: 'cockpit', scene: 4, camera: { position: [1.9, 3.1, -2.3], target: [-0.15, 0.72, 0.05], fov: 30 }, cutaway: true, frame: [-0.17, 0] },
  { id: 'atmosphere', scene: 5, camera: { position: [6.6, 1.35, 5.8], target: [0, 0.6, 0], fov: 33 }, useEnvironment: true, spin: true, frame: [0, 0.2] },
  { id: 'finale', scene: 6, camera: { position: [5.2, 0.45, -3.9], target: [0.1, 0.66, 0], fov: 29 }, useEnvironment: true, frame: [0, 0.16] },
]

export const SCENES = [
  { n: 1, id: 'machine', label: 'The Machine' },
  { n: 2, id: 'design', label: 'Aerodynamics' },
  { n: 3, id: 'performance', label: 'Performance' },
  { n: 4, id: 'cockpit', label: 'Cockpit' },
  { n: 5, id: 'atmosphere', label: 'Atmosphere' },
  { n: 6, id: 'finale', label: 'Reveal' },
] as const

/** Annotations for the design walk-around */
export const DESIGN_NOTES: Record<string, { title: string; text: string; coord: string }> = {
  grille: {
    title: 'Kidney grille',
    text: 'The face of the car. In the configurator it comes in chrome, gloss black or mesh, each modelled as its own frame and insert.',
    coord: 'X 2.21 · Y 0.51 · Z 0.00',
  },
  headlights: {
    title: 'Light signature',
    text: 'Slim lamp units sit on the nose surface. The daytime signature colour and bezel are yours to set.',
    coord: 'X 2.08 · Y 0.59 · Z 0.58',
  },
  contours: {
    title: 'Body contours',
    text: 'Long bonnet, set-back cabin and a shoulder line that runs nose to tail over 4,713 mm.',
    coord: 'L 4,713 · W 1,827 · H 1,440',
  },
  wheels: {
    title: 'Wheels and brakes',
    text: 'Six procedural wheel designs and three rim sizes, rebuilt live. Caliper colour, drilled discs and lettered tyres are concept options.',
    coord: 'WB 2,851 mm',
  },
  rear: {
    title: 'Rear design',
    text: 'Lamps, diffuser, spoiler and exhaust tips: every one of them is a separate part you can change.',
    coord: 'X −2.36 · Y 0.62',
  },
}

/** Figures shown with counters. Power and torque differ by market, so they
 *  stay in the specification table with an unverified label instead. */
export const PERFORMANCE_FIGURES = [
  { value: 4.4, decimals: 1, unit: 's', label: '0–100 km/h', note: 'Manufacturer claim' },
  { value: 2998, decimals: 0, unit: 'cc', label: 'Inline-six displacement' },
  { value: 6, decimals: 0, unit: 'cyl', label: 'Cylinders in line' },
  { value: 8, decimals: 0, unit: 'spd', label: 'Steptronic Sport automatic' },
]

export const COCKPIT_POINTS = [
  { title: 'Steering wheel', text: 'Rim material and the accent colour are configurable.' },
  { title: 'Instrument display', text: 'A display panel sits on the dashboard of the prototype cabin, with a trim strip you can change.' },
  { title: 'Seats', text: 'Choose the upholstery colour from the interior options.' },
  { title: 'Ambient lighting', text: 'The cabin light colour changes the glow across the dashboard.' },
]

export const ENVIRONMENT_INFO = {
  studio: { label: 'Midnight Studio', text: 'Black reflective floor, cool light strips, nothing to distract from the car.' },
  night: { label: 'Neon District', text: 'Wet street, dark towers, lit windows and neon in the reflections.' },
  track: { label: 'Performance Circuit', text: 'Kerbs, floodlights, a grandstand and a start gantry counting down.' },
} as const

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Scroll progress to camera blend. A beat's shot is exact when the beat's
 * middle crosses the middle of the screen, holds a little either side so the
 * text can be read, then eases to the next shot.
 */
export function cameraBlend(progress: number) {
  const q = Math.min(BEATS.length - 1, Math.max(0, progress - 0.5))
  const i = Math.min(BEATS.length - 2, Math.floor(q))
  const e = q >= BEATS.length - 1 ? 1 : smooth(0.3, 0.85, q - i)
  return { i, e, nearest: e > 0.5 ? i + 1 : i }
}
