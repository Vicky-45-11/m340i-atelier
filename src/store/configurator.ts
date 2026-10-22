import { create } from 'zustand'
import {
  CATEGORIES,
  COMPONENT_CATEGORY,
  STOCK_CONFIG,
  type CameraPresetId,
  type CategoryId,
  type ComponentId,
  type Configuration,
  type LightingPresetId,
  type OptionKey,
  type ViewMode,
} from '../lib/configuration'
import { configFromUrl, loadStoredConfig, storeConfig } from '../lib/share'

const HISTORY_LIMIT = 60

export type EnvironmentId = 'studio' | 'night' | 'track'

interface State {
  config: Configuration
  past: Configuration[]
  future: Configuration[]
  category: CategoryId
  selected: ComponentId | null
  hovered: ComponentId | null
  camera: CameraPresetId
  /** bumps each time a preset is requested so re-selecting the same preset re-animates */
  cameraNonce: number
  viewMode: ViewMode
  lighting: LightingPresetId
  compare: boolean
  compareSplit: number
  hotspots: boolean
  autoRotate: boolean
  introDone: boolean
  sceneReady: boolean
  toast: string | null
  /** show only the selected part, everything else as a ghost */
  isolate: boolean
  lightShow: boolean
  /** index into the parts tour, or null when the tour is off */
  tour: number | null
  /** scenery around the car: midnight studio, neon district or circuit */
  environment: EnvironmentId
  /** Sport mode swaps the blue accent for red across the UI and the scene */
  sport: boolean
  sound: boolean
  /** cinematic camera that cycles through framed shots */
  presentation: boolean
  storyReady: boolean

  setOption: <K extends OptionKey>(key: K, value: Configuration[K]) => void
  setCustomPaint: (hex: string) => void
  applyConfig: (cfg: Configuration) => void
  undo: () => void
  redo: () => void
  resetGroup: (keys: OptionKey[]) => void
  resetAll: () => void
  setCategory: (c: CategoryId, moveCamera?: boolean) => void
  select: (c: ComponentId | null, moveCamera?: CameraPresetId) => void
  hover: (c: ComponentId | null) => void
  setCamera: (c: CameraPresetId) => void
  setViewMode: (m: ViewMode) => void
  setLighting: (l: LightingPresetId) => void
  setCompare: (on: boolean) => void
  setCompareSplit: (v: number) => void
  setHotspots: (on: boolean) => void
  setAutoRotate: (on: boolean) => void
  finishIntro: () => void
  setSceneReady: () => void
  notify: (msg: string) => void
  setIsolate: (on: boolean) => void
  setLightShow: (on: boolean) => void
  setTour: (i: number | null) => void
  setEnvironment: (e: EnvironmentId) => void
  setSport: (on: boolean) => void
  setSound: (on: boolean) => void
  setPresentation: (on: boolean) => void
  setStoryReady: () => void
}

function initialConfig(): Configuration {
  return configFromUrl() ?? loadStoredConfig() ?? { ...STOCK_CONFIG }
}

function introSeen(): boolean {
  try {
    return sessionStorage.getItem('m340i-atelier:intro') === '1'
  } catch {
    return false
  }
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useConfigurator = create<State>((set, get) => {
  const commit = (next: Configuration) => {
    const { config, past } = get()
    if (JSON.stringify(next) === JSON.stringify(config)) return
    set({ config: next, past: [...past, config].slice(-HISTORY_LIMIT), future: [] })
    storeConfig(next)
  }

  return {
    config: initialConfig(),
    past: [],
    future: [],
    category: 'exterior',
    selected: null,
    hovered: null,
    camera: 'exterior',
    cameraNonce: 0,
    viewMode: 'studio',
    lighting: 'darkStudio',
    compare: false,
    compareSplit: 0.5,
    hotspots: typeof window === 'undefined' || window.innerWidth >= 760,
    autoRotate: false,
    introDone: introSeen(),
    sceneReady: false,
    toast: null,
    isolate: false,
    lightShow: false,
    tour: null,
    environment: 'studio',
    sport: false,
    sound: false,
    presentation: false,
    storyReady: false,

    setOption: (key, value) => commit({ ...get().config, [key]: value }),
    setCustomPaint: (hex) => commit({ ...get().config, paint: 'custom', customPaint: hex }),
    applyConfig: (cfg) => commit(cfg),
    undo: () => {
      const { past, config, future } = get()
      if (!past.length) return
      const prev = past[past.length - 1]
      set({ config: prev, past: past.slice(0, -1), future: [config, ...future].slice(0, HISTORY_LIMIT) })
      storeConfig(prev)
    },
    redo: () => {
      const { past, config, future } = get()
      if (!future.length) return
      const next = future[0]
      set({ config: next, past: [...past, config].slice(-HISTORY_LIMIT), future: future.slice(1) })
      storeConfig(next)
    },
    resetGroup: (keys) => {
      const next = { ...get().config }
      for (const k of keys) (next as unknown as Record<string, unknown>)[k] = STOCK_CONFIG[k]
      if (keys.includes('paint')) next.customPaint = STOCK_CONFIG.customPaint
      commit(next)
    },
    resetAll: () => commit({ ...STOCK_CONFIG }),

    setCategory: (c, moveCamera = true) => {
      const cat = CATEGORIES.find((x) => x.id === c)
      set((s) => ({
        category: c,
        ...(moveCamera && cat ? { camera: cat.camera, cameraNonce: s.cameraNonce + 1 } : {}),
      }))
    },
    select: (c, moveCamera) =>
      set((s) => ({
        selected: c,
        ...(c ? {} : { isolate: false }),
        ...(c ? { category: COMPONENT_CATEGORY[c] } : {}),
        ...(moveCamera ? { camera: moveCamera, cameraNonce: s.cameraNonce + 1 } : {}),
      })),
    hover: (c) => set({ hovered: c }),
    setCamera: (c) => set((s) => ({ camera: c, cameraNonce: s.cameraNonce + 1, presentation: false })),
    setViewMode: (m) => set({ viewMode: m, ...(m !== 'studio' ? { compare: false } : {}) }),
    setLighting: (l) => set({ lighting: l }),
    setCompare: (on) => set({ compare: on, ...(on ? { viewMode: 'studio' as ViewMode, selected: null } : {}) }),
    setCompareSplit: (v) => set({ compareSplit: Math.min(0.95, Math.max(0.05, v)) }),
    setHotspots: (on) => set({ hotspots: on }),
    setAutoRotate: (on) => set({ autoRotate: on }),
    finishIntro: () => {
      try {
        sessionStorage.setItem('m340i-atelier:intro', '1')
      } catch {
        // ignore
      }
      set((s) => ({ introDone: true, camera: 'exterior', cameraNonce: s.cameraNonce + 1 }))
    },
    setSceneReady: () => set({ sceneReady: true }),
    setIsolate: (on) => set({ isolate: on }),
    setLightShow: (on) => set({ lightShow: on }),
    setTour: (i) => set(i === null ? { tour: null, isolate: false, selected: null } : { tour: i, compare: false }),
    setEnvironment: (e) => set({ environment: e }),
    setSport: (on) => set({ sport: on }),
    setSound: (on) => set({ sound: on }),
    setPresentation: (on) => set((s) => (on ? { presentation: true, autoRotate: false, compare: false, tour: null } : { presentation: false, camera: s.camera, cameraNonce: s.cameraNonce + 1 })),
    setStoryReady: () => set({ storyReady: true }),
    notify: (msg) => {
      clearTimeout(toastTimer)
      set({ toast: msg })
      toastTimer = setTimeout(() => set({ toast: null }), 2600)
    },
  }
})

/** Registered by the canvas so UI outside it can grab a still of the scene */
export const sceneBridge: { capture: (() => string | null) | null } = { capture: null }
