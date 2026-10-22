// Typed configuration model for the configurator. Every option the UI shows
// is defined here, and every option maps to geometry or material behaviour in
// src/viewer/car. If an option has no 3D backing it is not listed.

export type CategoryId =
  | 'exterior'
  | 'wheels'
  | 'front'
  | 'rear'
  | 'side'
  | 'lighting'
  | 'interior'
  | 'stance'

export type ComponentId =
  | 'body'
  | 'hood'
  | 'frontBumper'
  | 'grille'
  | 'splitter'
  | 'headlights'
  | 'wheels'
  | 'mirrors'
  | 'sideSkirts'
  | 'windowTrim'
  | 'rearBumper'
  | 'diffuser'
  | 'exhaust'
  | 'spoiler'
  | 'taillights'
  | 'interior'
  | 'engine'

export type CameraPresetId =
  | 'exterior'
  | 'front'
  | 'rear'
  | 'side'
  | 'rearQuarter'
  | 'top'
  | 'wheels'
  | 'fascia'
  | 'diffuser'
  | 'interior'
  | 'engine'

export type ViewMode = 'studio' | 'technical' | 'exploded'
export type LightingPresetId = 'darkStudio' | 'arctic' | 'blueHour' | 'urbanNight' | 'sunset'

/** Illustrative relative-cost tier. Never a price: no accessory prices were verified. */
export type CostTier = 0 | 1 | 2 | 3

export interface OptionBase<Id extends string> {
  id: Id
  label: string
  note?: string
  /** true when the option is our own visual concept, not a known factory item */
  concept?: boolean
  tier: CostTier
}

// ---------- Paint ----------
export type PaintId = 'alpineWhite' | 'blackSapphire' | 'brooklynGrey' | 'portimaoBlue' | 'torontoRed' | 'frozenGrey' | 'custom'
export interface PaintOption extends OptionBase<PaintId> {
  color: string
  metalness: number
  roughness: number
  clearcoat: number
  finish: 'Solid' | 'Metallic' | 'Matte'
}
export const PAINTS: PaintOption[] = [
  { id: 'alpineWhite', label: 'Alpine White', color: '#e8e9e6', metalness: 0.05, roughness: 0.28, clearcoat: 1, finish: 'Solid', tier: 0 },
  { id: 'blackSapphire', label: 'Black Sapphire Metallic', color: '#0b0d11', metalness: 0.75, roughness: 0.32, clearcoat: 1, finish: 'Metallic', tier: 1 },
  { id: 'brooklynGrey', label: 'Brooklyn Grey Metallic', color: '#8a8f93', metalness: 0.7, roughness: 0.34, clearcoat: 1, finish: 'Metallic', tier: 1 },
  { id: 'portimaoBlue', label: 'Portimao Blue Metallic', color: '#1a4fa8', metalness: 0.72, roughness: 0.3, clearcoat: 1, finish: 'Metallic', tier: 1 },
  { id: 'torontoRed', label: 'Toronto Red Metallic', color: '#8c1420', metalness: 0.7, roughness: 0.3, clearcoat: 1, finish: 'Metallic', tier: 1 },
  { id: 'frozenGrey', label: 'Frozen-inspired Matte Grey', color: '#5f6366', metalness: 0.45, roughness: 0.62, clearcoat: 0.15, finish: 'Matte', concept: true, note: 'Visual concept. Not verified as an available factory finish.', tier: 3 },
  { id: 'custom', label: 'Custom colour', color: '#2a7f74', metalness: 0.65, roughness: 0.32, clearcoat: 1, finish: 'Metallic', concept: true, note: 'Pick any colour to preview. Not a factory option.', tier: 3 },
]

// ---------- Wheels ----------
export type WheelStyleId = 'multispoke' | 'fiveSpoke' | 'splitSpoke' | 'forged' | 'graphite' | 'polished'
export interface WheelStyle extends OptionBase<WheelStyleId> {
  spokes: number
  /** spokes per group: 1 = single spoke, 2 = twin/split spoke */
  perGroup: 1 | 2
  /** angular gap between paired spokes, radians */
  pairSpread: number
  /** spoke width at hub and at rim, metres */
  hubWidth: number
  rimWidth: number
  color: string
  metalness: number
  roughness: number
  faceColor?: string
}
export const WHEEL_STYLES: WheelStyle[] = [
  { id: 'multispoke', label: 'OEM-inspired multispoke', spokes: 5, perGroup: 2, pairSpread: 0.34, hubWidth: 0.026, rimWidth: 0.03, color: '#b9bec4', metalness: 0.85, roughness: 0.3, tier: 0, note: 'Default look. Inspired by, not a copy of, a factory design.' },
  { id: 'fiveSpoke', label: 'Sport five-spoke', spokes: 5, perGroup: 1, pairSpread: 0, hubWidth: 0.06, rimWidth: 0.085, color: '#c7cbd0', metalness: 0.9, roughness: 0.25, tier: 1 },
  { id: 'splitSpoke', label: 'Performance split-spoke', spokes: 5, perGroup: 2, pairSpread: 0.2, hubWidth: 0.02, rimWidth: 0.04, color: '#3a3d42', metalness: 0.7, roughness: 0.35, faceColor: '#d9dde2', tier: 2 },
  { id: 'forged', label: 'Forged-style lightweight', spokes: 10, perGroup: 1, pairSpread: 0, hubWidth: 0.018, rimWidth: 0.022, color: '#8a7350', metalness: 0.85, roughness: 0.38, tier: 3, concept: true, note: 'Visual concept of a forged wheel. No weight data.' },
  { id: 'graphite', label: 'Dark graphite twin-spoke', spokes: 7, perGroup: 2, pairSpread: 0.16, hubWidth: 0.02, rimWidth: 0.028, color: '#2b2e33', metalness: 0.75, roughness: 0.42, tier: 2 },
  { id: 'polished', label: 'Polished silver turbine', spokes: 15, perGroup: 1, pairSpread: 0, hubWidth: 0.014, rimWidth: 0.03, color: '#e4e7ea', metalness: 1, roughness: 0.08, tier: 2 },
]

export type RimSizeId = 'r18' | 'r19' | 'r20'
export interface RimSize extends OptionBase<RimSizeId> {
  inches: number
}
export const RIM_SIZES: RimSize[] = [
  { id: 'r18', label: '18-inch, taller sidewall', inches: 18, tier: 0 },
  { id: 'r19', label: '19-inch, sport profile', inches: 19, tier: 1 },
  { id: 'r20', label: '20-inch, low profile', inches: 20, tier: 2, concept: true, note: 'Visual only. Fitment not verified.' },
]

export type CaliperId = 'mBlue' | 'red' | 'black' | 'grey'
export interface ColorOption<Id extends string> extends OptionBase<Id> {
  color: string
}
export const CALIPERS: ColorOption<CaliperId>[] = [
  { id: 'mBlue', label: 'Blue (M Sport-style)', color: '#1f56c9', tier: 0 },
  { id: 'red', label: 'Red', color: '#b3141e', tier: 1 },
  { id: 'black', label: 'Gloss black', color: '#111215', tier: 1 },
  { id: 'grey', label: 'Titanium grey', color: '#6d7177', tier: 1 },
]

// ---------- Finishes shared by trim parts ----------
export type TrimFinishId = 'body' | 'gloss' | 'carbon' | 'chrome' | 'matte'
export interface FinishOption<Id extends string = TrimFinishId> extends OptionBase<Id> {
  /** 'body' means the part takes the paint colour */
  material: 'paint' | 'glossBlack' | 'carbon' | 'chrome' | 'matteBlack'
}
const F = {
  body: { id: 'body', label: 'Body colour', material: 'paint', tier: 0 },
  gloss: { id: 'gloss', label: 'High-gloss black', material: 'glossBlack', tier: 1 },
  carbon: { id: 'carbon', label: 'Carbon-look', material: 'carbon', tier: 3, concept: true, note: 'Procedural carbon weave texture.' },
  chrome: { id: 'chrome', label: 'Chrome', material: 'chrome', tier: 1 },
  matte: { id: 'matte', label: 'Satin black', material: 'matteBlack', tier: 1 },
} satisfies Record<TrimFinishId, FinishOption>

// ---------- Front ----------
export type GrilleId = 'standard' | 'glossBlack' | 'performance'
export const GRILLES: OptionBase<GrilleId>[] = [
  { id: 'standard', label: 'Standard kidney, chrome-look surround', tier: 0 },
  { id: 'glossBlack', label: 'Gloss-black kidney', tier: 1 },
  { id: 'performance', label: 'Performance mesh kidney', tier: 2, concept: true, note: 'Our mesh-insert concept.' },
]
export type SplitterId = 'none' | 'lip' | 'track'
export const SPLITTERS: OptionBase<SplitterId>[] = [
  { id: 'none', label: 'Stock lower edge', tier: 0 },
  { id: 'lip', label: 'Carbon-look lip', tier: 2 },
  { id: 'track', label: 'Track splitter with end plates', tier: 3, concept: true },
]
export type FrontAccentId = 'body' | 'gloss' | 'carbon'
export const FRONT_ACCENTS: FinishOption<FrontAccentId>[] = [F.body, F.gloss, F.carbon]

// ---------- Rear ----------
export type DiffuserId = 'stock' | 'performance' | 'track'
export const DIFFUSERS: OptionBase<DiffuserId>[] = [
  { id: 'stock', label: 'Stock two-fin diffuser', tier: 0 },
  { id: 'performance', label: 'Four-fin performance diffuser', tier: 2 },
  { id: 'track', label: 'Six-fin track diffuser', tier: 3, concept: true },
]
export type ExhaustId = 'blackChrome' | 'chrome' | 'carbon' | 'titanium'
export const EXHAUSTS: ColorOption<ExhaustId>[] = [
  { id: 'blackChrome', label: 'Black chrome tips', color: '#2b2d31', tier: 0 },
  { id: 'chrome', label: 'Polished chrome tips', color: '#d8dce0', tier: 1 },
  { id: 'carbon', label: 'Carbon-look sleeves', color: '#1a1b1e', tier: 2 },
  { id: 'titanium', label: 'Heat-blued titanium-look', color: '#4a5d9a', tier: 3, concept: true },
]
export type SpoilerId = 'lip' | 'carbonLip' | 'ducktail' | 'wing'
export const SPOILERS: OptionBase<SpoilerId>[] = [
  { id: 'lip', label: 'Body-colour lip', tier: 0 },
  { id: 'carbonLip', label: 'Carbon-look lip', tier: 2 },
  { id: 'ducktail', label: 'Raised ducktail', tier: 2, concept: true },
  { id: 'wing', label: 'Track wing on stands', tier: 3, concept: true, note: 'Visual concept. No aero data.' },
]
export type RearTrimId = 'body' | 'gloss' | 'carbon'
export const REAR_TRIMS: FinishOption<RearTrimId>[] = [F.body, F.gloss, F.carbon]

// ---------- Side ----------
export type MirrorCapId = 'body' | 'gloss' | 'carbon'
export const MIRROR_CAPS: FinishOption<MirrorCapId>[] = [F.body, F.gloss, F.carbon]
export type SkirtId = 'stock' | 'blade' | 'extended'
export const SKIRTS: OptionBase<SkirtId>[] = [
  { id: 'stock', label: 'Stock sill', tier: 0 },
  { id: 'blade', label: 'Gloss-black blade', tier: 1 },
  { id: 'extended', label: 'Extended carbon-look skirt', tier: 3, concept: true },
]
export type WindowTrimId = 'gloss' | 'chrome' | 'matte'
export const WINDOW_TRIMS: FinishOption<WindowTrimId>[] = [
  { ...F.gloss, label: 'Shadow-line gloss black' },
  F.chrome,
  F.matte,
]
export type SideAccentId = 'none' | 'tricolour' | 'pinstripe'
export const SIDE_ACCENTS: OptionBase<SideAccentId>[] = [
  { id: 'none', label: 'Clean flanks', tier: 0 },
  { id: 'tricolour', label: 'Tri-colour motorsport stripe', tier: 1, concept: true },
  { id: 'pinstripe', label: 'Electric-blue pinstripe', tier: 1, concept: true },
]

// ---------- Lighting ----------
export type HeadlightId = 'led' | 'shadow' | 'yellow'
export const HEADLIGHTS: OptionBase<HeadlightId>[] = [
  { id: 'led', label: 'LED with white daytime signature', tier: 0 },
  { id: 'shadow', label: 'Dark-bezel shadow look', tier: 1 },
  { id: 'yellow', label: 'Yellow daytime signature', tier: 2, concept: true, note: 'Motorsport-inspired concept.' },
]
export type TaillightId = 'red' | 'smoked' | 'laser'
export const TAILLIGHTS: OptionBase<TaillightId>[] = [
  { id: 'red', label: 'Standard red LED', tier: 0 },
  { id: 'smoked', label: 'Smoked lenses', tier: 1 },
  { id: 'laser', label: 'Bright thin-line signature', tier: 2, concept: true },
]
export type AmbientId = 'off' | 'blue' | 'red' | 'amber' | 'white'
export const AMBIENTS: ColorOption<AmbientId>[] = [
  { id: 'off', label: 'Off', color: '#000000', tier: 0 },
  { id: 'blue', label: 'Electric blue', color: '#2f7bff', tier: 0 },
  { id: 'red', label: 'Performance red', color: '#ff2a3c', tier: 0 },
  { id: 'amber', label: 'Warm amber', color: '#ffae3d', tier: 0 },
  { id: 'white', label: 'Cool white', color: '#dfe9ff', tier: 0 },
]

// ---------- Interior ----------
export type SeatId = 'black' | 'cognac' | 'oyster' | 'mocha'
export const SEATS: ColorOption<SeatId>[] = [
  { id: 'black', label: 'Black leather', color: '#141416', tier: 0 },
  { id: 'cognac', label: 'Cognac leather', color: '#8a4a24', tier: 1 },
  { id: 'oyster', label: 'Oyster leather', color: '#c9bba6', tier: 1 },
  { id: 'mocha', label: 'Mocha leather', color: '#4a3226', tier: 1 },
]
export type DashTrimId = 'aluminium' | 'carbon' | 'wood'
export const DASH_TRIMS: ColorOption<DashTrimId>[] = [
  { id: 'aluminium', label: 'Brushed aluminium', color: '#9da2a8', tier: 0 },
  { id: 'carbon', label: 'Carbon-look', color: '#1b1c1f', tier: 2 },
  { id: 'wood', label: 'Open-pore wood', color: '#5b3a22', tier: 1 },
]
export type SteeringId = 'leather' | 'alcantara'
export const STEERINGS: ColorOption<SteeringId>[] = [
  { id: 'leather', label: 'Leather rim', color: '#121214', tier: 0 },
  { id: 'alcantara', label: 'Alcantara-style rim', color: '#2c2d31', tier: 1 },
]
export type StitchId = 'blue' | 'red' | 'silver'
export const STITCHES: ColorOption<StitchId>[] = [
  { id: 'blue', label: 'Blue accents', color: '#2f6bff', tier: 0 },
  { id: 'red', label: 'Red accents', color: '#d91c2b', tier: 0 },
  { id: 'silver', label: 'Silver accents', color: '#c3c8ce', tier: 0 },
]

// ---------- Stance ----------
export type RideHeightId = 'stock' | 'sport' | 'lowered'
export interface RideHeight extends OptionBase<RideHeightId> {
  drop: number
}
export const RIDE_HEIGHTS: RideHeight[] = [
  { id: 'stock', label: 'Stock', drop: 0, tier: 0 },
  { id: 'sport', label: 'Sport (-20 mm, visual)', drop: 0.02, tier: 2 },
  { id: 'lowered', label: 'Lowered (-40 mm, visual)', drop: 0.04, tier: 3, note: 'Visual preview only. Not a fitment or legality check.' },
]

// ---------- Configuration ----------
export interface Configuration {
  version: 1
  model: 'M340i xDrive'
  paint: PaintId
  customPaint: string
  wheelStyle: WheelStyleId
  rimSize: RimSizeId
  caliper: CaliperId
  grille: GrilleId
  splitter: SplitterId
  frontAccent: FrontAccentId
  diffuser: DiffuserId
  exhaust: ExhaustId
  spoiler: SpoilerId
  rearTrim: RearTrimId
  mirrorCaps: MirrorCapId
  skirts: SkirtId
  windowTrim: WindowTrimId
  sideAccent: SideAccentId
  headlights: HeadlightId
  taillights: TaillightId
  ambient: AmbientId
  seats: SeatId
  dashTrim: DashTrimId
  steering: SteeringId
  stitching: StitchId
  rideHeight: RideHeightId
}

export const STOCK_CONFIG: Configuration = {
  version: 1,
  model: 'M340i xDrive',
  paint: 'portimaoBlue',
  customPaint: '#2a7f74',
  wheelStyle: 'multispoke',
  rimSize: 'r19',
  caliper: 'mBlue',
  grille: 'standard',
  splitter: 'none',
  frontAccent: 'body',
  diffuser: 'stock',
  exhaust: 'blackChrome',
  spoiler: 'lip',
  rearTrim: 'gloss',
  mirrorCaps: 'body',
  skirts: 'stock',
  windowTrim: 'gloss',
  sideAccent: 'none',
  headlights: 'led',
  taillights: 'red',
  ambient: 'blue',
  seats: 'black',
  dashTrim: 'aluminium',
  steering: 'leather',
  stitching: 'blue',
  rideHeight: 'stock',
}

/** A configuration key whose value is one of a list of options */
export type OptionKey = Exclude<keyof Configuration, 'version' | 'model' | 'customPaint'>

export interface OptionGroup {
  key: OptionKey
  title: string
  component: ComponentId
  options: OptionBase<string>[]
  kind: 'swatch' | 'wheel' | 'list'
}

export interface Category {
  id: CategoryId
  label: string
  camera: CameraPresetId
  blurb: string
  groups: OptionGroup[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'exterior', label: 'Exterior', camera: 'exterior',
    blurb: 'Clearcoat paint on the body panels only. Glass, rubber, lights and trim keep their own materials.',
    groups: [{ key: 'paint', title: 'Paint', component: 'body', options: PAINTS, kind: 'swatch' }],
  },
  {
    id: 'wheels', label: 'Wheels', camera: 'wheels',
    blurb: 'Each choice rebuilds the wheel geometry. The overall tyre diameter stays fixed so nothing rubs the arches.',
    groups: [
      { key: 'wheelStyle', title: 'Wheel design', component: 'wheels', options: WHEEL_STYLES, kind: 'wheel' },
      { key: 'rimSize', title: 'Rim size and tyre profile', component: 'wheels', options: RIM_SIZES, kind: 'list' },
      { key: 'caliper', title: 'Brake calipers', component: 'wheels', options: CALIPERS, kind: 'swatch' },
    ],
  },
  {
    id: 'front', label: 'Front', camera: 'fascia',
    blurb: 'Kidney grille, lower splitter and the intake surrounds.',
    groups: [
      { key: 'grille', title: 'Kidney grille', component: 'grille', options: GRILLES, kind: 'list' },
      { key: 'splitter', title: 'Front splitter', component: 'splitter', options: SPLITTERS, kind: 'list' },
      { key: 'frontAccent', title: 'Bumper accents', component: 'frontBumper', options: FRONT_ACCENTS, kind: 'list' },
    ],
  },
  {
    id: 'rear', label: 'Rear', camera: 'diffuser',
    blurb: 'Diffuser, exhaust tips, boot-lid spoiler and lower trim.',
    groups: [
      { key: 'diffuser', title: 'Rear diffuser', component: 'diffuser', options: DIFFUSERS, kind: 'list' },
      { key: 'exhaust', title: 'Exhaust tips', component: 'exhaust', options: EXHAUSTS, kind: 'swatch' },
      { key: 'spoiler', title: 'Spoiler', component: 'spoiler', options: SPOILERS, kind: 'list' },
      { key: 'rearTrim', title: 'Rear lower trim', component: 'rearBumper', options: REAR_TRIMS, kind: 'list' },
    ],
  },
  {
    id: 'side', label: 'Side', camera: 'side',
    blurb: 'Mirror caps, side skirts, window surrounds and graphics.',
    groups: [
      { key: 'mirrorCaps', title: 'Mirror caps', component: 'mirrors', options: MIRROR_CAPS, kind: 'list' },
      { key: 'skirts', title: 'Side skirts', component: 'sideSkirts', options: SKIRTS, kind: 'list' },
      { key: 'windowTrim', title: 'Window trim', component: 'windowTrim', options: WINDOW_TRIMS, kind: 'list' },
      { key: 'sideAccent', title: 'Side accent', component: 'body', options: SIDE_ACCENTS, kind: 'list' },
    ],
  },
  {
    id: 'lighting', label: 'Lighting', camera: 'fascia',
    blurb: 'Light signatures are emissive materials on the lamp geometry, not real light simulation.',
    groups: [
      { key: 'headlights', title: 'Headlights', component: 'headlights', options: HEADLIGHTS, kind: 'list' },
      { key: 'taillights', title: 'Taillights', component: 'taillights', options: TAILLIGHTS, kind: 'list' },
      { key: 'ambient', title: 'Interior ambient light', component: 'interior', options: AMBIENTS, kind: 'swatch' },
    ],
  },
  {
    id: 'interior', label: 'Interior', camera: 'interior',
    blurb: 'A simplified prototype cabin: seats, dashboard, steering wheel and door cards. Not a scan of the real interior.',
    groups: [
      { key: 'seats', title: 'Seat upholstery', component: 'interior', options: SEATS, kind: 'swatch' },
      { key: 'dashTrim', title: 'Dashboard trim', component: 'interior', options: DASH_TRIMS, kind: 'swatch' },
      { key: 'steering', title: 'Steering wheel', component: 'interior', options: STEERINGS, kind: 'swatch' },
      { key: 'stitching', title: 'Interior accents', component: 'interior', options: STITCHES, kind: 'swatch' },
    ],
  },
  {
    id: 'stance', label: 'Stance', camera: 'side',
    blurb: 'Lowers the body over fixed wheels. Arch gaps shrink. Geometry is never stretched.',
    groups: [{ key: 'rideHeight', title: 'Ride height', component: 'body', options: RIDE_HEIGHTS, kind: 'list' }],
  },
]

export const COMPONENT_LABELS: Record<ComponentId, string> = {
  body: 'Body shell',
  hood: 'Bonnet',
  frontBumper: 'Front bumper',
  grille: 'Kidney grille',
  splitter: 'Front splitter',
  headlights: 'Headlights',
  wheels: 'Wheels and brakes',
  mirrors: 'Door mirrors',
  sideSkirts: 'Side skirts',
  windowTrim: 'Window trim',
  rearBumper: 'Rear bumper',
  diffuser: 'Rear diffuser',
  exhaust: 'Exhaust tips',
  spoiler: 'Spoiler',
  taillights: 'Taillights',
  interior: 'Cabin',
  engine: 'Engine bay',
}

/** Which category opens when a component is clicked in the scene */
export const COMPONENT_CATEGORY: Record<ComponentId, CategoryId> = {
  body: 'exterior',
  hood: 'exterior',
  frontBumper: 'front',
  grille: 'front',
  splitter: 'front',
  headlights: 'lighting',
  wheels: 'wheels',
  mirrors: 'side',
  sideSkirts: 'side',
  windowTrim: 'side',
  rearBumper: 'rear',
  diffuser: 'rear',
  exhaust: 'rear',
  spoiler: 'rear',
  taillights: 'lighting',
  interior: 'interior',
  engine: 'exterior',
}

export function findOption(key: OptionKey, id: string): OptionBase<string> | undefined {
  for (const c of CATEGORIES) for (const g of c.groups) if (g.key === key) return g.options.find((o) => o.id === id)
  return undefined
}

export function groupFor(key: OptionKey): OptionGroup | undefined {
  for (const c of CATEGORIES) for (const g of c.groups) if (g.key === key) return g
  return undefined
}

export const paintOf = (cfg: Configuration): PaintOption => {
  const p = PAINTS.find((x) => x.id === cfg.paint) ?? PAINTS[0]
  return p.id === 'custom' ? { ...p, color: cfg.customPaint } : p
}
export const wheelOf = (cfg: Configuration) => WHEEL_STYLES.find((w) => w.id === cfg.wheelStyle) ?? WHEEL_STYLES[0]
export const rimOf = (cfg: Configuration) => RIM_SIZES.find((r) => r.id === cfg.rimSize) ?? RIM_SIZES[1]
export const rideOf = (cfg: Configuration) => RIDE_HEIGHTS.find((r) => r.id === cfg.rideHeight) ?? RIDE_HEIGHTS[0]
export const colorOf = <Id extends string>(list: ColorOption<Id>[], id: Id) => (list.find((x) => x.id === id) ?? list[0]).color
export const finishOf = <Id extends string>(list: FinishOption<Id>[], id: Id) => (list.find((x) => x.id === id) ?? list[0]).material

/** Validate an untrusted object (localStorage, share URL) into a Configuration */
export function sanitizeConfig(input: unknown): Configuration {
  const out: Configuration = { ...STOCK_CONFIG }
  if (!input || typeof input !== 'object') return out
  const src = input as Record<string, unknown>
  for (const c of CATEGORIES) {
    for (const g of c.groups) {
      const v = src[g.key]
      if (typeof v === 'string' && g.options.some((o) => o.id === v)) {
        ;(out as unknown as Record<string, string>)[g.key] = v
      }
    }
  }
  if (typeof src.customPaint === 'string' && /^#[0-9a-f]{6}$/i.test(src.customPaint)) out.customPaint = src.customPaint
  return out
}

export function diffFromStock(cfg: Configuration): OptionKey[] {
  const keys: OptionKey[] = []
  for (const c of CATEGORIES) for (const g of c.groups) if (cfg[g.key] !== STOCK_CONFIG[g.key]) keys.push(g.key)
  return keys
}
