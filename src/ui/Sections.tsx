import { useState } from 'react'
import { CATEGORIES, COMPONENT_LABELS, STOCK_CONFIG, type CameraPresetId, type ComponentId } from '../lib/configuration'
import { TIER_LABEL, tierOf, upgradeScore } from '../lib/pricing'
import { deleteBuild, loadSavedBuilds, saveBuild, shareUrl, type SavedBuild } from '../lib/share'
import { PRICE_NOTE, SPEC_GROUPS, SPEC_SOURCE_NOTE } from '../lib/specs'
import { useConfigurator } from '../store/configurator'

const scrollToStage = () => document.getElementById('configure')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

const EXPLORE: { id: ComponentId; camera: CameraPresetId; text: string }[] = [
  { id: 'grille', camera: 'fascia', text: 'Kidney grille with three treatments, each a separate frame, slat or mesh insert in the model.' },
  { id: 'headlights', camera: 'fascia', text: 'Slim lamp units that sit on the nose surface, with switchable daytime signatures.' },
  { id: 'wheels', camera: 'wheels', text: 'Six wheel designs and three rim sizes rebuilt in real time, plus caliper colours.' },
  { id: 'mirrors', camera: 'exterior', text: 'Mirror caps in body colour, gloss black or carbon-look.' },
  { id: 'spoiler', camera: 'rearQuarter', text: 'From a subtle lip to a concept track wing on stands.' },
  { id: 'diffuser', camera: 'diffuser', text: 'Two, four or six fins, with matching exhaust tip finishes.' },
  { id: 'hood', camera: 'engine', text: 'The bonnet is hinged. Open it to see a simplified engine bay.' },
  { id: 'interior', camera: 'interior', text: 'A prototype cabin with upholstery, trim, wheel and ambient-light options.' },
]

export function Explore() {
  const select = useConfigurator((s) => s.select)
  const setViewMode = useConfigurator((s) => s.setViewMode)
  return (
    <section className="section" id="explore">
      <div className="section-head">
        <p className="eyebrow">Explore</p>
        <h2>Every part, one at a time.</h2>
        <p className="lede">Pick a component to fly the camera to it, highlight it, and open its options. Or switch to the exploded view to see how the separately modelled parts fit together.</p>
        <button type="button" className="btn" onClick={() => { setViewMode('exploded'); select(null, 'exterior'); scrollToStage() }}>
          Open exploded view
        </button>
      </div>
      <div className="explore-grid">
        {EXPLORE.map((e, i) => (
          <button
            key={e.id}
            type="button"
            className="explore-card"
            onClick={() => {
              select(e.id, e.camera)
              scrollToStage()
            }}
          >
            <span className="explore-index">{String(i + 1).padStart(2, '0')}</span>
            <span className="explore-name">{COMPONENT_LABELS[e.id]}</span>
            <span className="explore-text">{e.text}</span>
            <span className="explore-cta">Inspect →</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function Specifications() {
  return (
    <section className="section" id="specs">
      <div className="section-head">
        <p className="eyebrow">Specifications</p>
        <h2>The machine underneath.</h2>
        <p className="lede warn">{SPEC_SOURCE_NOTE}</p>
      </div>
      <div className="spec-grid">
        {SPEC_GROUPS.map((g) => (
          <div className="spec-card" key={g.title}>
            <h3>{g.title}</h3>
            <dl>
              {g.specs.map((s) => (
                <div className="spec-row" key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>
                    {s.value}
                    {s.detail && <small>{s.detail}</small>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        <div className="spec-card price-card">
          <h3>{PRICE_NOTE.label}</h3>
          <p className="price">{PRICE_NOTE.value}</p>
          <p className="muted">{PRICE_NOTE.detail}</p>
          <span className="badge">Unverified</span>
        </div>
      </div>
    </section>
  )
}

export function BuildSummary() {
  const config = useConfigurator((s) => s.config)
  const resetAll = useConfigurator((s) => s.resetAll)
  const applyConfig = useConfigurator((s) => s.applyConfig)
  const notify = useConfigurator((s) => s.notify)
  const setCategory = useConfigurator((s) => s.setCategory)
  const [saved, setSaved] = useState<SavedBuild[]>(loadSavedBuilds)
  const [name, setName] = useState('')
  const score = upgradeScore(config)

  const copyLink = async () => {
    const url = shareUrl(config)
    try {
      await navigator.clipboard.writeText(url)
      notify('Share link copied')
    } catch {
      window.prompt('Copy this link', url)
    }
  }
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ ...config, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'm340i-atelier-build.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <section className="section" id="summary">
      <div className="section-head">
        <p className="eyebrow">Build summary</p>
        <h2>Your specification.</h2>
        <p className="lede">
          Base vehicle: BMW M340i xDrive (G20 LCI). {PRICE_NOTE.value} ex-showroom, unverified. Accessory prices are not available, so no total is shown. The tiers below are a rough, illustrative indication of relative cost only.
        </p>
      </div>
      <div className="summary-layout">
        <div className="summary-list">
          {CATEGORIES.map((c) => (
            <div className="summary-cat" key={c.id}>
              <button type="button" className="summary-cat-head" onClick={() => { setCategory(c.id); scrollToStage() }}>
                {c.label} <span>Edit →</span>
              </button>
              {c.groups.map((g) => {
                const opt = g.options.find((o) => o.id === config[g.key])
                const changed = config[g.key] !== STOCK_CONFIG[g.key]
                const tier = tierOf(config, g.key)
                return (
                  <div className={`summary-row${changed ? ' is-changed' : ''}`} key={g.key}>
                    <span className="summary-key">{g.title}</span>
                    <span className="summary-val">
                      {g.key === 'paint' && config.paint === 'custom' ? `Custom ${config.customPaint}` : opt?.label}
                      {opt?.concept && <span className="badge">Concept</span>}
                    </span>
                    <span className="summary-tier">{changed ? (tier ? `${TIER_LABEL[tier]} · price unavailable` : 'No extra cost tier') : 'Stock'}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <aside className="summary-side">
          <div className="score">
            <span className="eyebrow">Upgrade intensity (illustrative)</span>
            <span className="score-val">{score}</span>
            <span className="score-bar">
              <span style={{ width: `${Math.min(100, (score / 40) * 100)}%` }} />
            </span>
            <span className="muted">Sum of relative cost tiers. Not a price.</span>
          </div>
          <form
            className="save-form"
            onSubmit={(e) => {
              e.preventDefault()
              setSaved(saveBuild(name.trim() || `Build ${new Date().toLocaleDateString()}`, config))
              setName('')
              notify('Build saved on this device')
            }}
          >
            <label htmlFor="build-name">Name this build</label>
            <div className="save-row">
              <input id="build-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Track-day spec" />
              <button className="btn" type="submit">
                Save
              </button>
            </div>
          </form>
          <div className="summary-actions">
            <button type="button" className="btn ghost" onClick={copyLink}>
              Copy share link
            </button>
            <button type="button" className="btn ghost" onClick={exportJson}>
              Export JSON
            </button>
            <button type="button" className="btn ghost" onClick={resetAll}>
              Reset to factory specification
            </button>
          </div>
          {saved.length > 0 && (
            <div className="saved">
              <h3>Saved on this device</h3>
              {saved.map((b, i) => (
                <div className="saved-row" key={`${b.savedAt}-${i}`}>
                  <button type="button" onClick={() => { applyConfig(b.config); notify(`Loaded “${b.name}”`) }}>
                    <strong>{b.name}</strong>
                    <small>{new Date(b.savedAt).toLocaleString()}</small>
                  </button>
                  <button type="button" className="icon-btn" aria-label={`Delete ${b.name}`} onClick={() => setSaved(deleteBuild(i))}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
