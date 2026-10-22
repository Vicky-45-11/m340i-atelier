import type { LightingPresetId } from '../lib/configuration'

export interface Lightformer {
  color: string
  intensity: number
  position: [number, number, number]
  scale: [number, number, number]
  rotation?: [number, number, number]
  form?: 'rect' | 'ring' | 'circle'
}

export interface LightingPreset {
  id: LightingPresetId
  label: string
  background: string
  floor: string
  floorRoughness: number
  fog: [number, number]
  exposure: number
  key: { color: string; intensity: number; position: [number, number, number] }
  fill: { color: string; intensity: number }
  hemi: { sky: string; ground: string; intensity: number }
  envBackground: string
  formers: Lightformer[]
}

// Each preset is built from local light panels rendered into a cube map,
// so reflections change with the lighting and nothing is fetched remotely.
export const LIGHTING: LightingPreset[] = [
  {
    id: 'darkStudio',
    label: 'Dark Studio',
    background: '#07080a',
    floor: '#0d0f12',
    floorRoughness: 0.32,
    fog: [9, 24],
    exposure: 1.0,
    key: { color: '#ffffff', intensity: 2.4, position: [3, 7, 4] },
    fill: { color: '#9fb8ff', intensity: 0.5 },
    hemi: { sky: '#c9d4ff', ground: '#0b0c0e', intensity: 0.35 },
    envBackground: '#050608',
    formers: [
      { color: '#ffffff', intensity: 3.2, position: [0, 6, 0], scale: [10, 3.2, 1], rotation: [Math.PI / 2, 0, 0] },
      { color: '#ffffff', intensity: 1.6, position: [0, 2.2, 7], scale: [12, 0.6, 1] },
      { color: '#ffffff', intensity: 1.6, position: [0, 2.2, -7], scale: [12, 0.6, 1] },
      { color: '#cfe0ff', intensity: 1.2, position: [-8, 1.6, 0], scale: [6, 1, 1], rotation: [0, Math.PI / 2, 0] },
      { color: '#2f7bff', intensity: 1.4, position: [8, 0.6, 0], scale: [8, 0.25, 1], rotation: [0, -Math.PI / 2, 0] },
    ],
  },
  {
    id: 'arctic',
    label: 'Arctic White',
    background: '#d9dde2',
    floor: '#e4e7eb',
    floorRoughness: 0.55,
    fog: [10, 30],
    exposure: 0.95,
    key: { color: '#ffffff', intensity: 2.2, position: [2, 8, 3] },
    fill: { color: '#ffffff', intensity: 0.9 },
    hemi: { sky: '#ffffff', ground: '#b8bec6', intensity: 0.9 },
    envBackground: '#c7ccd2',
    formers: [
      { color: '#ffffff', intensity: 2.6, position: [0, 6, 0], scale: [14, 8, 1], rotation: [Math.PI / 2, 0, 0] },
      { color: '#ffffff', intensity: 1.8, position: [0, 2, 8], scale: [16, 3, 1] },
      { color: '#ffffff', intensity: 1.8, position: [0, 2, -8], scale: [16, 3, 1] },
      { color: '#f2f5f8', intensity: 1.4, position: [-9, 2, 0], scale: [10, 3, 1], rotation: [0, Math.PI / 2, 0] },
      { color: '#f2f5f8', intensity: 1.4, position: [9, 2, 0], scale: [10, 3, 1], rotation: [0, -Math.PI / 2, 0] },
    ],
  },
  {
    id: 'blueHour',
    label: 'Blue Hour',
    background: '#0d1726',
    floor: '#111a28',
    floorRoughness: 0.28,
    fog: [9, 26],
    exposure: 1.05,
    key: { color: '#b7c9ff', intensity: 1.6, position: [-4, 6, 3] },
    fill: { color: '#ffb36b', intensity: 0.5 },
    hemi: { sky: '#6f8fd6', ground: '#0a0f18', intensity: 0.6 },
    envBackground: '#0e1a2e',
    formers: [
      { color: '#5b7fd1', intensity: 1.8, position: [0, 7, 0], scale: [14, 8, 1], rotation: [Math.PI / 2, 0, 0] },
      { color: '#ff9e57', intensity: 2.2, position: [0, 0.8, -9], scale: [20, 0.8, 1] },
      { color: '#8fb0ff', intensity: 1.2, position: [0, 2, 8], scale: [14, 1.2, 1] },
      { color: '#ffffff', intensity: 0.8, position: [8, 2, 0], scale: [6, 0.4, 1], rotation: [0, -Math.PI / 2, 0] },
    ],
  },
  {
    id: 'urbanNight',
    label: 'Urban Night',
    background: '#050507',
    floor: '#08090c',
    floorRoughness: 0.2,
    fog: [7, 20],
    exposure: 1.1,
    key: { color: '#ffd9a8', intensity: 1.3, position: [4, 6, -2] },
    fill: { color: '#4a7dff', intensity: 0.9 },
    hemi: { sky: '#26324d', ground: '#050507', intensity: 0.35 },
    envBackground: '#030305',
    formers: [
      { color: '#ffb35c', intensity: 3, position: [-5, 4, 4], scale: [0.6, 0.6, 1], form: 'circle' },
      { color: '#ffb35c', intensity: 3, position: [5, 4, -4], scale: [0.6, 0.6, 1], form: 'circle' },
      { color: '#2f7bff', intensity: 2.4, position: [0, 1.2, 7], scale: [14, 0.15, 1] },
      { color: '#2f7bff', intensity: 2, position: [0, 1.2, -7], scale: [14, 0.15, 1] },
      { color: '#ffffff', intensity: 1.2, position: [0, 6, 0], scale: [6, 0.4, 1], rotation: [Math.PI / 2, 0, 0] },
      { color: '#e8467a', intensity: 0.8, position: [-8, 1, 0], scale: [6, 0.15, 1], rotation: [0, Math.PI / 2, 0] },
    ],
  },
  {
    id: 'sunset',
    label: 'Warm Sunset',
    background: '#1c110d',
    floor: '#1d1410',
    floorRoughness: 0.38,
    fog: [9, 26],
    exposure: 1.0,
    key: { color: '#ffb070', intensity: 2.6, position: [-6, 2.4, -3] },
    fill: { color: '#7b6cff', intensity: 0.35 },
    hemi: { sky: '#ffcf9e', ground: '#1a0f0b', intensity: 0.5 },
    envBackground: '#2a1710',
    formers: [
      { color: '#ff8a3d', intensity: 3.2, position: [-9, 1.2, -2], scale: [16, 1.6, 1], rotation: [0, Math.PI / 2, 0] },
      { color: '#ffd2a1', intensity: 1.4, position: [0, 7, 0], scale: [12, 6, 1], rotation: [Math.PI / 2, 0, 0] },
      { color: '#6a4dff', intensity: 0.8, position: [9, 3, 0], scale: [12, 4, 1], rotation: [0, -Math.PI / 2, 0] },
      { color: '#ffb36b', intensity: 1, position: [0, 1.5, 8], scale: [14, 0.6, 1] },
    ],
  },
]

export const lightingOf = (id: LightingPresetId) => LIGHTING.find((l) => l.id === id) ?? LIGHTING[0]
