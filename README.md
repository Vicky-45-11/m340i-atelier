# M340i // Atelier

*Your machine. Your specification.*

This is an independent, interactive 3D configuration studio for the BMW M340i (G20 LCI). You can orbit the car, fly the camera to each part, click a part to customise it, and see each change on the model straight away.

> Not affiliated with BMW AG or CarWale. The car is a **procedural prototype**. It is built from the published overall dimensions (4,713 × 1,827 × 1,440 mm, 2,851 mm wheelbase), not from BMW CAD data or a scanned model.

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
| Wheels | 6 procedural designs, 3 rim sizes and 4 caliper colours. Each choice rebuilds the wheel geometry. The tyre's outer diameter stays fixed, so wheels never cut into the arches. |
| Front | Kidney grille (chrome, gloss black, mesh), splitter (stock, lip, track with end plates), intake surround finish. |
| Rear | Diffuser (2, 4 or 6 fins), exhaust tip finish, spoiler (lip, carbon lip, ducktail, wing on stands), lower trim finish. |
| Side | Mirror caps, side skirts, window trim, stripe graphics. |
| Lighting | Daytime signature colour and bezel, taillight lens, cabin ambient light. |
| Interior | Seats, dashboard trim, steering wheel rim and accent colour, all on a simplified prototype cabin. |
| Stance | Stock, -20 mm and -40 mm. The body drops over fixed wheels and geometry is never stretched. |
| Modes | Studio render, Technical (labelled as a stylised x-ray), Exploded (only separately modelled parts move), Stock vs custom split slider rendered from one camera. |
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
  ui/                    stage HUD, option panel, thumbnails, sections
scripts/                 screenshot and e2e helpers (playwright-core)
```

## Limits and what production would need

- **No licensed BMW model was available.** The body is lofted from cross-sections and is an approximation. For production fidelity, add a licensed G20 M340i glTF/GLB with separately named meshes (body panels, bumpers, grille, lamps, mirrors, wheels, calipers, interior). Swap `viewer/car/*` for a loader that maps mesh names to the same `ComponentId`s. The store, UI and options would not need to change.
- The doors, wings and body sides are one surface, so they don't separate in exploded view.
- Options marked **Concept** are visual ideas, not factory or dealer parts. There is no fitment or legality checking.
- CarWale, 3DTuning and the REA repository could not be reached from the build environment. The specifications (2022+ LCI, European power figure) and the approximate India price come from general knowledge and are labelled unverified in the UI.
