# 🏎️ M340i // Atelier

<div align="center">

### YOUR MACHINE. YOUR SPECIFICATION.

**A cinematic 3D automotive configuration studio.**

Explore the BMW M340i (G20 LCI) through an immersive digital showroom. Orbit the machine, inspect its details, switch environments, and personalize its appearance in real time.

**Precision in every detail. Performance in every frame.**

![Project](https://img.shields.io/badge/PROJECT-3D%20AUTOMOTIVE-2563EB?style=for-the-badge)
![Framework](https://img.shields.io/badge/FRAMEWORK-REACT-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Build](https://img.shields.io/badge/BUILD-VITE-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Graphics](https://img.shields.io/badge/GRAPHICS-WEBGL-990000?style=for-the-badge)

[Explore the Showroom](#-the-showroom) · [Features](#-key-features) · [Technology](#-technology-stack) · [Getting Started](#-getting-started) · [Performance](#-performance--optimization)

</div>

---

## 🏁 The Vision

A car is more than a collection of specifications. It is a combination of engineering, design, atmosphere, and personal expression.

**M340i // Atelier** reimagines the traditional vehicle configurator as an interactive digital experience, combining procedural 3D modeling, cinematic storytelling, and real-time customization in the browser.

Instead of simply viewing a static vehicle render, visitors can explore the machine from different angles, discover its design language, and experiment with different visual environments.

The result is a digital automotive atelier built around one idea:

**The best way to experience a machine is to get closer to it.**

## 🎬 The Showroom

The experience begins with a cinematic opening sequence and evolves into a scroll-driven automotive presentation, all powered by a persistent 3D scene.

### 01. The Opening Sequence

A minimal black screen introduces an abstract insignia, technical readouts, and a sound-wave graphic. A shaft of light then reveals the car from darkness.

- Skip controls for immediate access.
- Session-aware playback.
- Adaptive timing based on scene readiness.
- Synthesized ambient audio, muted by default.

### 02. The Cinematic Hero

An immersive opening scene introduces the machine with the headline:

> Engineered to be felt.

Visitors can explore the showroom or jump directly into the configurator.

### 03. Six Chapters. One Machine.

| Chapter | Experience |
|---|---|
| The Machine | A cinematic journey from the front three-quarter angle to the side profile. |
| Sculpted by Aerodynamics | Explore the grille, lighting, body contours, wheels, and rear design through technical callouts and light streaks. |
| Performance DNA | Discover an x-ray-inspired technical view with a simulated bonnet reveal and animated specification counters. |
| The Cockpit | Experience a cutaway-style presentation with the roof and glass lifting away. |
| Choose Your Atmosphere | Enter Midnight Studio, Neon District, or Performance Circuit. |
| Final Reveal | A dramatic closing sequence built around the moment before launch. |

### 04. Interactive Camera Choreography

The camera transitions between carefully framed scenes as visitors scroll through the story.

- Smooth camera easing and scene transitions.
- Dynamic framing that keeps the car visible alongside the content.
- Touch-friendly interaction on mobile devices.
- Horizontal dragging for orbit controls.
- Vertical gestures preserved for page scrolling.
- Reduced-motion support for accessibility.

### 05. Three Distinct Environments

- **Midnight Studio** — Dark, refined lighting with a premium showroom atmosphere.
- **Neon District** — A futuristic urban environment with vivid neon accents.
- **Performance Circuit** — A track-inspired setting with dramatic lighting and animated start lights.

Each environment changes the mood of the experience while keeping the vehicle at its center.

## ✨ Key Features

### 🚘 Interactive 3D Viewer

Explore the procedural vehicle model using an interactive camera system.

- 360-degree orbit controls.
- Zoom, pan, and damped camera movement.
- Eleven predefined camera presets.
- Animated camera transitions.
- Reset view and fullscreen modes.
- Automatic turntable rotation.
- PNG snapshots of the current scene.
- Camera constraints that prevent the view from passing below the floor.

### 🎨 Real-Time Customization

Inspect individual vehicle components and customize supported parts directly on the 3D model.

The configurator is designed to make changes immediately visible, creating a more tactile and engaging experience than a conventional options menu.

### 🏎️ Sport Mode

Switch from the default blue accent to a performance-inspired red theme.

The mode updates the interface and corresponding scene accents to create a cohesive visual experience.

### 🎥 Presentation Mode

Let the camera guide the experience through a sequence of framed views. User interaction returns control to the visitor.

### 🎧 Procedural Ambient Audio

Ambient sound is generated through the Web Audio API rather than loaded audio files.

Sound remains muted by default, allowing visitors to enable it when desired.

### 🖥️ Cinematic Interface

The experience combines:

- Scroll progress indicators.
- Navigation with a sliding active-state indicator.
- A trailing cursor ring on desktop.
- Magnetic call-to-action interactions.
- Tilt-responsive cards.
- Masked typography reveals.
- Animated counters and technical callouts.

## ⚙️ Technology Stack

| Technology | Purpose |
|---|---|
| React | Component-driven user interface |
| TypeScript | Type-safe application logic |
| Vite | Development server and production build |
| Three.js / React Three Fiber, if used | 3D rendering and scene management |
| WebGL | Hardware-accelerated graphics |
| Web Audio API | Procedural ambient audio |
| CSS | Responsive layouts, transitions, and visual effects |
| Playwright, if configured | Automated browser testing |

*The exact 3D and testing libraries should reflect the packages installed in the repository. No additional dependencies are required by the documented implementation.*

## 🧱 Procedural Modeling & Technical Accuracy

The vehicle is a **procedural prototype**, not a scanned model or manufacturer-supplied CAD asset.

Its overall proportions are based on the dimensions specified in the project brief:

| Specification | Value |
|---|---:|
| Overall length | 4,713 mm |
| Overall width | 1,827 mm |
| Overall height | 1,440 mm |
| Wheelbase | 2,851 mm |
| Engine displacement shown in the story | 2,998 cc |
| Cylinder count shown in the story | 6 |
| Transmission speeds shown in the story | 8 |
| 0–100 km/h acceleration figure | 4.4 seconds, as stated in the brief |

Dimensions and performance figures can vary by model year, market, and configuration. Verify specifications against the relevant market's official documentation before treating them as definitive.

The model's proportions and technical presentation are intended to support an immersive experience, not to represent an exact reproduction of BMW's engineering data.

## ⚡ Performance & Optimization

A cinematic experience should remain responsive without sacrificing its visual identity.

M340i // Atelier incorporates several performance-conscious design decisions:

- **Lazy loading:** The cinematic showroom is loaded only when needed.
- **Visibility-aware rendering:** 3D canvases stop rendering when off-screen.
- **Mobile optimization:** Lower pixel ratios and reduced-cost effects on phones.
- **Selective visual effects:** Reflections and bloom are disabled on mobile.
- **Reduced-motion support:** Camera easing, turntable animation, and reveal effects are minimized or skipped.
- **WebGL fallback:** A static image can replace the interactive showroom when WebGL is unavailable.
- **Persistent scene:** A single 3D canvas supports multiple storytelling chapters.
- **Lightweight choreography:** Scroll transitions use a small custom controller rather than a heavyweight animation framework.

These choices help balance cinematic presentation, accessibility, and practical browser performance.

## 🚀 Getting Started

### Prerequisites

- Node.js compatible with the project dependencies.
- npm.
- A modern browser with WebGL support for the interactive 3D experience.

### Installation

```bash
# Clone your repository
git clone <YOUR_REPOSITORY_URL>

# Enter the project directory
cd <YOUR_PROJECT_DIRECTORY>

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open the local URL printed by Vite in your terminal. The project brief specifies `http://localhost:5173`.

### Available Commands

```bash
npm run dev
npm run build
npm run lint
npm run test:e2e
```

- `dev` starts the development server.
- `build` generates the production build and performs any configured type checks.
- `lint` runs the configured linting process.
- `test:e2e` runs the browser test suite when configured and supplied with the required Chromium executable.

For browser tests, start the development server if the test configuration expects an already running application, and set `CHROME` to the appropriate Chromium binary path when required.

### Deploying to Vercel

1. Import the Git repository into Vercel.
2. Select the Vite framework preset.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Deploy after verifying the production build.

## 📊 Feature Overview

| Area | Capabilities |
|---|---|
| 3D Viewer | Orbit, zoom, pan, camera presets, reset, fullscreen, rotation, snapshots |
| Showroom | Scroll-driven storytelling, six chapters, cinematic transitions |
| Customization | Component selection and real-time visual changes |
| Environments | Midnight Studio, Neon District, Performance Circuit |
| Interface | Sport mode, navigation indicator, cursor effects, animated text |
| Audio | Optional, procedurally synthesized ambient sound |
| Accessibility | Reduced-motion handling and WebGL fallback |
| Optimization | Lazy loading, visibility-aware rendering, mobile-specific effects |

## 🛣️ Future Possibilities

- [ ] Add more vehicle colors and finish options.
- [ ] Expand wheel, trim, and exterior customization.
- [ ] Add shareable configuration links.
- [ ] Export configuration summaries.
- [ ] Improve material realism and environmental reflections.
- [ ] Add more camera presets and cinematic sequences.
- [ ] Refine mobile touch interactions and accessibility.
- [ ] Improve automated visual regression testing.

## ⚠️ Disclaimer

M340i // Atelier is an independent, unofficial interactive project. It is not affiliated with, endorsed by, or sponsored by BMW AG or CarWale.

BMW, M340i, and related product names and trademarks belong to their respective owners. The procedural vehicle model is an illustrative prototype and does not use official BMW CAD data or a scanned manufacturer model.

Specifications are provided for illustrative purposes and should be independently verified.

## 👨‍💻 Built With Curiosity

Created by [@Vicky-45-11](https://github.com/Vicky-45-11).

An exploration of interactive 3D experiences, automotive design, procedural modeling, and the intersection of engineering and digital storytelling.

---

<div align="center">

### M340i // Atelier

**Your machine. Your specification. Your experience.**

*Designed to be explored. Engineered to be experienced.*

</div>
