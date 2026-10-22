import { CATEGORIES, COMPONENT_LABELS, STOCK_CONFIG, type OptionBase, type OptionGroup } from '../lib/configuration'
import { TIER_LABEL } from '../lib/pricing'
import { useConfigurator } from '../store/configurator'
import { Thumb } from './Thumb'

export function CategoryBar() {
  const category = useConfigurator((s) => s.category)
  const setCategory = useConfigurator((s) => s.setCategory)
  return (
    <nav className="category-bar" aria-label="Component categories">
      {CATEGORIES.map((c, i) => (
        <button
          key={c.id}
          type="button"
          className={`category${category === c.id ? ' is-active' : ''}`}
          aria-pressed={category === c.id}
          onClick={() => setCategory(c.id)}
        >
          <span className="category-index">{String(i + 1).padStart(2, '0')}</span>
          {c.label}
        </button>
      ))}
    </nav>
  )
}

function OptionRow({ group, option }: { group: OptionGroup; option: OptionBase<string> }) {
  const config = useConfigurator((s) => s.config)
  const setOption = useConfigurator((s) => s.setOption)
  const active = config[group.key] === option.id
  const isStock = STOCK_CONFIG[group.key] === option.id
  return (
    <button
      type="button"
      className={`option${active ? ' is-active' : ''} option-${group.kind}`}
      aria-pressed={active}
      onClick={() => setOption(group.key, option.id as never)}
      title={option.note}
    >
      <span className="option-thumb">
        <Thumb group={group} option={option} config={config} />
      </span>
      <span className="option-text">
        <span className="option-label">{option.label}</span>
        <span className="option-meta">
          {isStock ? 'Stock' : option.tier === 0 ? 'Included' : TIER_LABEL[option.tier]}
          {option.concept && <span className="badge">Concept</span>}
        </span>
      </span>
      <span className="option-check" aria-hidden>
        {active ? '●' : ''}
      </span>
    </button>
  )
}

export function OptionPanel() {
  const category = useConfigurator((s) => s.category)
  const selected = useConfigurator((s) => s.selected)
  const config = useConfigurator((s) => s.config)
  const resetGroup = useConfigurator((s) => s.resetGroup)
  const setCustomPaint = useConfigurator((s) => s.setCustomPaint)
  const undo = useConfigurator((s) => s.undo)
  const redo = useConfigurator((s) => s.redo)
  const canUndo = useConfigurator((s) => s.past.length > 0)
  const canRedo = useConfigurator((s) => s.future.length > 0)
  const resetAll = useConfigurator((s) => s.resetAll)
  const cat = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0]
  const keys = cat.groups.map((g) => g.key)
  const changed = keys.some((k) => config[k] !== STOCK_CONFIG[k])

  return (
    <section className="panel" aria-label={`${cat.label} options`}>
      <header className="panel-head">
        <div>
          <p className="eyebrow">{selected ? `Selected · ${COMPONENT_LABELS[selected]}` : 'Customise'}</p>
          <h2 className="panel-title">{cat.label}</h2>
        </div>
        <div className="history" role="group" aria-label="History">
          <button type="button" className="icon-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
            ↶
          </button>
          <button type="button" className="icon-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
            ↷
          </button>
        </div>
      </header>
      <p className="panel-blurb">{cat.blurb}</p>

      <div className="panel-scroll">
        <p className="price-note">Option prices are unavailable. ₹ marks show an illustrative relative cost tier, not a price.</p>
        {cat.groups.map((g) => {
          const current = g.options.find((o) => o.id === config[g.key])
          return (
            <div className="group" key={g.key}>
              <div className="group-head">
                <h3>{g.title}</h3>
                <span className="group-current">{current?.label}</span>
              </div>
              <div className={`options options-${g.kind}`}>
                {g.options.map((o) => (
                  <OptionRow key={o.id} group={g} option={o} />
                ))}
              </div>
              {g.key === 'paint' && (
                <label className="custom-paint">
                  <input type="color" value={config.customPaint} onChange={(e) => setCustomPaint(e.target.value)} />
                  <span>Pick a custom colour (visual concept, not a factory option)</span>
                </label>
              )}
              {current?.note && <p className="note">{current.note}</p>}
            </div>
          )
        })}
      </div>

      <footer className="panel-foot">
        <button type="button" className="btn ghost" onClick={() => resetGroup(keys)} disabled={!changed}>
          Reset {cat.label.toLowerCase()} to stock
        </button>
        <button type="button" className="btn ghost" onClick={resetAll}>
          Reset all
        </button>
      </footer>
    </section>
  )
}
