import { sanitizeConfig, STOCK_CONFIG, type Configuration } from './configuration'

const STORAGE_KEY = 'm340i-atelier:config'
const SAVED_KEY = 'm340i-atelier:saved'
const PARAM = 'build'

// Only option keys that differ from stock go into the URL, so links stay short.
export function encodeConfig(cfg: Configuration): string {
  const diff: Record<string, string> = {}
  for (const [k, v] of Object.entries(cfg)) {
    if (k === 'version' || k === 'model') continue
    if ((STOCK_CONFIG as unknown as Record<string, unknown>)[k] !== v) diff[k] = String(v)
  }
  return btoa(JSON.stringify(diff)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeConfig(s: string): Configuration | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    return sanitizeConfig(JSON.parse(atob(b64)))
  } catch {
    return null
  }
}

export function shareUrl(cfg: Configuration): string {
  const url = new URL(window.location.href)
  url.hash = ''
  url.searchParams.set(PARAM, encodeConfig(cfg))
  return url.toString()
}

export function configFromUrl(): Configuration | null {
  try {
    const v = new URL(window.location.href).searchParams.get(PARAM)
    return v ? decodeConfig(v) : null
  } catch {
    return null
  }
}

export function loadStoredConfig(): Configuration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? sanitizeConfig(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function storeConfig(cfg: Configuration) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  } catch {
    // storage blocked: the build still works for this visit
  }
}

export interface SavedBuild {
  name: string
  savedAt: string
  config: Configuration
}

export function loadSavedBuilds(): SavedBuild[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(list)) return []
    return list
      .filter((b): b is SavedBuild => !!b && typeof b === 'object' && typeof (b as SavedBuild).name === 'string')
      .map((b) => ({ name: b.name.slice(0, 40), savedAt: String(b.savedAt), config: sanitizeConfig(b.config) }))
      .slice(0, 8)
  } catch {
    return []
  }
}

export function saveBuild(name: string, cfg: Configuration): SavedBuild[] {
  const list = [{ name: name.slice(0, 40), savedAt: new Date().toISOString(), config: cfg }, ...loadSavedBuilds()].slice(0, 8)
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
  return list
}

export function deleteBuild(index: number): SavedBuild[] {
  const list = loadSavedBuilds().filter((_, i) => i !== index)
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
  return list
}
