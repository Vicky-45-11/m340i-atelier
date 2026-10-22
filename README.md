# M340i // Atelier

*Your machine. Your specification.*

This is an independent, interactive 3D configuration studio for the BMW M340i (G20 LCI). You can orbit the car, fly the camera to each part, click a part to customise it, and see each change on the model straight away.

> Not affiliated with BMW AG or CarWale. The car is a **procedural prototype**. It is built from the published overall dimensions (4,713 × 1,827 × 1,440 mm, 2,851 mm wheelbase), not from BMW CAD data or a scanned model.

## The showroom

The page opens as a cinematic, scroll-driven showroom. The configurator sits below it.

- **Opening sequence:** a black screen, an abstract insignia (not a BMW mark), a technical read-out and a sound-wave graphic. Then a light shaft brings the car up from black. The sequence can be skipped, runs once per session, and lasts only as long as the scene takes to load (about 1.7 s at minimum, 9 s at most).
- **Hero:** "Engineered to be felt." with *Explore the machine* and *Enter the configurator*.
- **Six scenes, one persistent 3D canvas:**
  1. The Machine (front three-quarter to side profile)
  2. Sculpted by aerodynamics (grille, lamps, contours, wheels and rear, with light streaks and coordinate callouts)
  3. Performance DNA (technical x-ray with the bonnet up, then animated counters)
  4. The Cockpit (the roof and glass lift off for a cutaway)
  5. Choose your atmosphere: Midnight Studio, Neon District or Performance Circuit (procedural scenery with animated start lights)
  6. Final reveal: "Built for the moment before the launch."
- **How it works:** the camera holds on each shot while its text is on screen, then eases to the next one. The frame shifts so the car stays clear of the text, and on portrait screens the car moves up. Dragging sideways orbits the car while vertical swipes still scroll. The showroom controls let you switch environment, pause the turntable, toggle light effects and reset the view.
- **Site-wide:** a navigation bar with a sliding active indicator, and a Sport mode that turns the blue accent red in the UI and in the scene. Ambient sound is muted by default and synthesised with Web Audio, so there are no audio files. There is also a progress rail, a trailing cursor ring on desktop, magnetic CTAs, card tilt, masked text reveals and counters.
- **In the configurator:** a Studio / Night / Track switch (scenic environments set their own light), a *Presentation* camera that cuts between framed shots until you drag, and everything from before.
- **Performance:**
  - Both canvases stop drawing when they are off screen.
  - The showroom is lazy-loaded.
  - Phones get a lower pixel ratio, no reflections and no bloom.
  - Reduced motion skips the camera easing, the turntable and the reveals.
  - Without WebGL, the showroom shows `public/showroom-fallback.jpg`, a still render of this procedural model.
- **Libraries:** no new dependencies. Scroll choreography is a small hand-written controller in `ui/site/Story.tsx` and `lib/story.ts`, not GSAP.
- **Figures:** the story's figures are 0–100 km/h 4.4 s (manufacturer claim, as given in the brief), 2,998 cc, six cylinders and eight speeds. Power and torque differ by market, so they appear only in the specification table and are labelled unverified there.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm run lint
npm run test:e2e     # scripted browser checks; needs the dev server running and CHROME=<path to a Chromium binary>
```

To deploy on Vercel, import the repo and keep the defaults: the Vite preset, `npm run build`, and `dist` as the output folder.

## What works

| Area | Behaviour |
| --- | --- |
| Viewer | 360° orbit, zoom, pan, damped controls, 11 camera presets with animated transitions, reset, fullscreen, auto-rotate, PNG snapshot. The camera is kept above the floor. |
| Paint | 6 named paints plus a custom colour picker. Only the clearcoat paint material changes. Glass, rubber, lamps and trim keep their own materials. |
| Wheels | 6 procedural designs, 3 rim sizes, 4 caliper colours, plain or cross-drilled discs, plain or raised-letter tyres (our own ATELIER lettering). Each choice rebuilds the wheel geometry. The tyre's outer diameter stays fixed, so wheels never cut into the arches. |
| Front | Kidney grille (chrome, gloss black, mesh), splitter (stock, lip, track with end plates), intake surround finish, bonnet (stock, power dome, carbon-look vented with twin heat extractors). |
| Rear | Diffuser (2, 4 or 6 fins), twin or quad exhaust tips and their finish, spoiler (lip, carbon lip, ducktail, wing on stands), lower trim finish. |
| Side | Mirror caps, side skirts, front-wing air breathers (none, gloss black, carbon look), window trim, stripe graphics. |
| Exterior | Roof finish (body colour, gloss black, carbon look) with a matching shark-fin antenna. |
| Lighting | Daytime signature colour and bezel, taillight lens, cabin ambient light. |
| Interior | Seats, dashboard trim, steering wheel rim and accent colour, all on a simplified prototype cabin. |
| Stance | Stock, -20 mm and -40 mm. The body drops over fixed wheels and geometry is never stretched. |
| Modes | Studio render, Technical (labelled as a stylised x-ray), Exploded (only separately modelled parts move), Stock vs custom split slider rendered from one camera. |
| One part at a time | Isolate turns every other part into a faint ghost. The 14-step parts tour walks through grille, lamps, bonnet, engine, splitter, wheels, mirrors, skirts, trim, spoiler, taillights, diffuser, exhausts and cabin, isolating each one with its current options (arrow keys and Esc work). Exploded view shows labelled callouts. |
| Effects | Bloom glow on lamps, a reflective studio floor (desktop), a light show (ignition sweep, headlight beams, light pools, blue underglow) and a scanning beam in Technical view. Effects are off in compare mode, and bloom and reflections are off on mobile. |
| Hotspots | Markers that follow the parts and hide when the part faces away. Clicking one focuses the camera, highlights the part and opens its options. Clicking a mesh does the same. |
| Lighting presets | Dark Studio, Arctic White, Blue Hour, Urban Night, Warm Sunset. Reflections come from local light panels, so nothing is downloaded. |
| State | One typed configuration with undo/redo (buttons and Ctrl+Z / Ctrl+Shift+Z), reset per category, reset all, autosave to localStorage, named saved builds, share links (`?build=`), JSON export. |
| Info | Specifications and price are marked unverified. Option prices are never invented: options show an illustrative relative cost tier instead. |
| Resilience | WebGL detection with a fallback panel, an error boundary around the scene, `prefers-reduced-motion` support, capped pixel ratio and smaller shadow maps on mobile. |

## Structure

```
src/
  lib/configuration.ts   typed options, categories, stock spec, validation
  lib/pricing.ts         illustrative cost tiers (no prices)
  lib/share.ts           localStorage, saved builds, share URLs
  lib/specs.ts           specification data, flagged as unverified
  store/configurator.ts  zustand store: config, history, camera, modes
  viewer/CarScene.tsx    canvas, studio lighting, floor, split renderer
  viewer/CameraRig.tsx   camera presets and transitions
  viewer/lighting.ts     lighting presets
  viewer/car/            procedural model: geometry, body, front, rear, side, interior, wheels, materials, selectable Part
  lib/story.ts           story beats, camera shots, copy, figures
  lib/audio.ts           synthesised ambience, whoosh and rev (Web Audio)
  viewer/StoryScene.tsx  showroom canvas: scroll camera, light shaft reveal, streaks
  viewer/Studio.tsx      shared lights, reflections, floor
  viewer/Scenery.tsx     Midnight Studio, Neon District and Performance Circuit scenery
  ui/site/               loading screen, navigation, story sections, micro-interactions
  ui/                    stage HUD, option panel, thumbnails, sections
scripts/                 screenshot and e2e helpers (playwright-core)
```

## Limits and what production would need

- **No licensed BMW model was available.** The body is lofted from cross-sections and is an approximation. For production fidelity, add a licensed G20 M340i glTF/GLB with separately named meshes (body panels, bumpers, grille, lamps, mirrors, wheels, calipers, interior). Swap `viewer/car/*` for a loader that maps mesh names to the same `ComponentId`s. The store, UI and options would not need to change.
- The doors, wings and body sides are one surface, so they don't separate in exploded view.
- Options marked **Concept** are visual ideas, not factory or dealer parts. There is no fitment or legality checking.
- CarWale, 3DTuning and the REA repository could not be reached from the build environment. The specifications (2022+ LCI, European power figure) and the approximate India price come from general knowledge and are labelled unverified in the UI.
