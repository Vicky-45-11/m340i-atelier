import { useEffect } from 'react'
import { CATEGORIES, COMPONENT_LABELS, type CameraPresetId, type ComponentId, type Configuration } from '../lib/configuration'
import { useConfigurator } from '../store/configurator'

// Guided tour: flies to one part at a time, isolates it, and lists what it's set to.
export const TOUR: { id: ComponentId; camera: CameraPresetId; blurb: string }[] = [
  { id: 'grille', camera: 'fascia', blurb: 'Twin kidneys with a separate frame, slats and backing. Chrome, gloss black or mesh.' },
  { id: 'headlights', camera: 'fascia', blurb: 'Housing, projectors, daytime light strips and a clear lens, all wrapped onto the nose.' },
  { id: 'hood', camera: 'engine', blurb: 'Hinged at the scuttle. Stock, power-dome or carbon-look with heat extractors.' },
  { id: 'engine', camera: 'engine', blurb: 'Simplified bay: engine cover, strut brace and reservoirs. Not the real B58 layout.' },
  { id: 'splitter', camera: 'fascia', blurb: 'Lower lip that follows the nose curve. Track version adds end plates.' },
  { id: 'wheels', camera: 'wheels', blurb: 'Tyre, barrel, spokes, hub, disc and caliper are all separate meshes.' },
  { id: 'mirrors', camera: 'exterior', blurb: 'Housing, cap and mirror glass. The cap takes its own finish.' },
  { id: 'sideSkirts', camera: 'side', blurb: 'Sill, blade or extended carbon-look skirt between the arches.' },
  { id: 'windowTrim', camera: 'side', blurb: 'Belt-line and roof-line surrounds in gloss, chrome or satin.' },
  { id: 'spoiler', camera: 'rearQuarter', blurb: 'Fitted to the boot-lid surface, from a lip to a wing on stands.' },
  { id: 'taillights', camera: 'rear', blurb: 'L-shaped lamps with glowing light bars under a tinted lens.' },
  { id: 'diffuser', camera: 'diffuser', blurb: 'Two, four or six fins on the lower rear apron.' },
  { id: 'exhaust', camera: 'diffuser', blurb: 'Twin or quad tips in four finishes.' },
  { id: 'interior', camera: 'interior', blurb: 'Prototype cabin: seats, dashboard, wheel and ambient lighting.' },
]

function currentFor(id: ComponentId, config: Configuration): string[] {
  const out: string[] = []
  for (const c of CATEGORIES)
    for (const g of c.groups)
      if (g.component === id) {
        const o = g.options.find((x) => x.id === config[g.key])
        if (o) out.push(`${g.title}: ${o.label}`)
      }
  return out
}

export function TourCard() {
  const tour = useConfigurator((s) => s.tour)
  const setTour = useConfigurator((s) => s.setTour)
  const select = useConfigurator((s) => s.select)
  const setIsolate = useConfigurator((s) => s.setIsolate)
  const config = useConfigurator((s) => s.config)

  useEffect(() => {
    if (tour === null) return
    const step = TOUR[tour]
    select(step.id, step.camera)
    setIsolate(true)
  }, [tour, select, setIsolate])

  useEffect(() => {
    if (tour === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setTour((tour + 1) % TOUR.length)
      if (e.key === 'ArrowLeft') setTour((tour - 1 + TOUR.length) % TOUR.length)
      if (e.key === 'Escape') setTour(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tour, setTour])

  if (tour === null) return null
  const step = TOUR[tour]
  const lines = currentFor(step.id, config)
  return (
    <div className="tour" role="region" aria-label="Parts tour">
      <div className="tour-progress">
        {TOUR.map((t, i) => (
          <button key={t.id} type="button" className={i === tour ? 'is-active' : i < tour ? 'is-done' : ''} onClick={() => setTour(i)} aria-label={`Go to ${COMPONENT_LABELS[t.id]}`} />
        ))}
      </div>
      <p className="eyebrow">
        Part {String(tour + 1).padStart(2, '0')} / {TOUR.length}
      </p>
      <h3 className="tour-title">{COMPONENT_LABELS[step.id]}</h3>
      <p className="tour-blurb">{step.blurb}</p>
      {lines.length > 0 && (
        <ul className="tour-spec">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
      <div className="tour-actions">
        <button type="button" className="icon-btn" onClick={() => setTour((tour - 1 + TOUR.length) % TOUR.length)} aria-label="Previous part">
          ←
        </button>
        <button type="button" className="icon-btn" onClick={() => setTour((tour + 1) % TOUR.length)} aria-label="Next part">
          →
        </button>
        <button type="button" className="btn ghost small" onClick={() => setTour(null)}>
          Exit tour
        </button>
      </div>
    </div>
  )
}
