// Scripted interaction checks against a running dev server.
// node scripts/e2e.mjs http://localhost:5173/
import { chromium } from 'playwright-core'
const url = process.argv[2] ?? 'http://localhost:5173/'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const results = []
const errors = []
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)

async function open(viewport, path = '') {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(url + path, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector('canvas', { timeout: 60000 })
  await page.waitForFunction(() => window.__atelier?.getState().sceneReady, null, { timeout: 60000 })
  return { ctx, page }
}
const st = (page, expr) => page.evaluate(`(() => { const s = __atelier.getState(); return ${expr} })()`)
const meshCount = (page) => page.evaluate(() => { let n = 0; window.__scene.traverse((o) => { if (o.isMesh && !o.userData.overlay) n++ }); return n })
const paintColor = (page) => page.evaluate(() => {
  let c = null
  window.__scene.traverse((o) => { if (o.isMesh && o.material?.clearcoat === 1 && o.material.type === 'MeshPhysicalMaterial' && o.material.metalness > 0.6 && !c) c = '#' + o.material.color.getHexString() })
  return c
})

// ---------- desktop ----------
{
  const { ctx, page } = await open({ width: 1440, height: 900 })
  check('page loads and scene reports ready', true)
  check('intro is shown with a skip action', await page.isVisible('.intro >> text=Skip intro'))
  await page.click('.intro >> text=Skip intro')
  check('intro can be skipped', !(await page.isVisible('.intro')))

  const glassBefore = await page.evaluate(() => { let c = null; window.__scene.traverse((o) => { if (o.isMesh && o.material?.transparent && o.material.opacity > 0.4 && o.material.opacity < 0.45) c = o.material.color.getHexString() }); return c })
  await page.click('button.option:has-text("Toronto Red Metallic")')
  await page.waitForTimeout(400)
  check('paint option updates state', (await st(page, 's.config.paint')) === 'torontoRed')
  check('paint option updates the paint material', (await paintColor(page)) === '#8c1420', await paintColor(page))
  const glassAfter = await page.evaluate(() => { let c = null; window.__scene.traverse((o) => { if (o.isMesh && o.material?.transparent && o.material.opacity > 0.4 && o.material.opacity < 0.45) c = o.material.color.getHexString() }); return c })
  check('glass material untouched by paint change', glassBefore === glassAfter, `${glassBefore} -> ${glassAfter}`)
  check('stage title shows paint name', (await page.textContent('.paint-name')).includes('Toronto Red'))

  await page.click('.category:has-text("Wheels")')
  check('category switch changes panel', (await page.textContent('.panel-title')) === 'Wheels')
  check('category switch moves camera', (await st(page, 's.camera')) === 'wheels')
  const before = await meshCount(page)
  await page.click('button.option:has-text("Sport five-spoke")')
  await page.waitForTimeout(600)
  const after = await meshCount(page)
  check('wheel option rebuilds wheel geometry', (await st(page, 's.config.wheelStyle')) === 'fiveSpoke' && after === before - 20, `meshes ${before} -> ${after}`)

  await page.click('button[aria-label="Undo"]')
  check('undo restores previous wheel', (await st(page, 's.config.wheelStyle')) === 'multispoke')
  await page.click('button[aria-label="Redo"]')
  check('redo re-applies wheel', (await st(page, 's.config.wheelStyle')) === 'fiveSpoke')
  await page.keyboard.press('Control+z')
  check('Ctrl+Z undoes', (await st(page, 's.config.wheelStyle')) === 'multispoke')

  await page.click('.category:has-text("Rear")')
  await page.click('button.option:has-text("Track wing on stands")')
  await page.waitForTimeout(500)
  check('spoiler option applies', (await st(page, 's.config.spoiler')) === 'wing')
  await page.click('button:has-text("Reset rear to stock")')
  check('reset category restores stock rear', (await st(page, 's.config.spoiler')) === 'lip')

  await page.click('.segmented >> text=Technical view')
  check('technical mode', (await st(page, 's.viewMode')) === 'technical' && (await page.isVisible('.mode-note')))
  await page.click('.segmented >> text=Exploded view')
  check('exploded mode', (await st(page, 's.viewMode')) === 'exploded')
  await page.click('.segmented >> text=Stock vs custom')
  check('compare mode shows split handle', (await st(page, 's.compare')) && (await page.isVisible('.compare-handle')))
  await page.click('.segmented >> text=Stock vs custom')
  await page.click('.segmented >> text=Studio render')

  await page.click('.hud-bl >> text=Engine bay')
  check('camera preset buttons', (await st(page, 's.camera')) === 'engine')
  await page.click('button[title="Reset camera"]')
  check('reset camera', (await st(page, 's.camera')) === 'exterior')
  await page.waitForTimeout(2500)
  const hs = page.locator('.hotspot[aria-label="Customise Wheels and brakes"]')
  await hs.click({ force: true })
  check('hotspot selects component and opens category', (await st(page, 's.selected')) === 'wheels' && (await st(page, 's.category')) === 'wheels')

  // click the real wheel mesh in the canvas (hotspots off so the ray hits geometry)
  await page.evaluate(() => window.__atelier.setState({ hotspots: false, selected: null }))
  await page.click('button[title="Reset camera"]')
  await page.waitForTimeout(3500)
  const pt = await page.evaluate(() => {
    const cam = window.__camera
    const v = cam.position.clone().set(1.516, 0.42, 0.93).project(cam)
    const r = document.querySelector('.viewport canvas').getBoundingClientRect()
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height }
  })
  await page.mouse.click(pt.x, pt.y)
  await page.waitForTimeout(300)
  check('clicking the wheel mesh selects it', (await st(page, 's.selected')) === 'wheels', `clicked ${Math.round(pt.x)},${Math.round(pt.y)}`)

  await page.selectOption('select[aria-label="Studio lighting"]', 'sunset')
  check('lighting preset', (await st(page, 's.lighting')) === 'sunset')

  // new component options
  const m0 = await meshCount(page)
  await page.click('.category:has-text("Front")')
  await page.click('button.option:has-text("Carbon-look vented bonnet")')
  check('vented bonnet applies', (await st(page, 's.config.hood')) === 'vented')
  await page.click('.category:has-text("Side")')
  await page.click('button.option:has-text("Carbon-look air breathers")')
  await page.waitForTimeout(400)
  check('wing vents add geometry', (await st(page, 's.config.vents')) === 'carbon' && (await meshCount(page)) > m0, `meshes ${m0} -> ${await meshCount(page)}`)
  await page.click('.category:has-text("Rear")')
  await page.click('button.option:has-text("Quad tips")')
  check('quad exhaust applies', (await st(page, 's.config.exhaustLayout')) === 'quad')
  await page.click('.category:has-text("Wheels")')
  await page.click('button.option:has-text("Cross-drilled and slotted discs")')
  await page.click('button.option:has-text("Raised-letter sidewall")')
  check('discs and tyre lettering apply', (await st(page, 's.config.discs')) === 'drilled' && (await st(page, 's.config.tyres')) === 'lettered')

  // isolate, tour, light show
  await page.evaluate(() => window.__atelier.getState().select('wheels'))
  await page.click('.pill-toggle')
  const ghostCount = () => { let n = 0; window.__scene.traverse((o) => { if (o.isMesh && o.userData.origMaterial && o.material.opacity < 0.05) n++ }); return n }
  const ghostedOn = await page.waitForFunction(`(${ghostCount})() > 50`, null, { timeout: 15000 }).then(() => true, () => false)
  check('isolate ghosts the other parts', (await st(page, 's.isolate')) && ghostedOn)
  await page.click('.pill button[aria-label="Clear selection"]')
  const ghostedOff = await page.waitForFunction(`(${ghostCount})() === 0`, null, { timeout: 15000 }).then(() => true, () => false)
  check('clearing selection restores materials', ghostedOff)
  await page.click('.tour-btn')
  check('parts tour starts on the grille', (await st(page, 's.tour')) === 0 && (await st(page, 's.selected')) === 'grille' && (await page.isVisible('.tour')))
  await page.click('.tour button[aria-label="Next part"]')
  check('tour next moves to headlights', (await st(page, 's.selected')) === 'headlights')
  await page.keyboard.press('Escape')
  check('Esc ends the tour', (await st(page, 's.tour')) === null && !(await page.isVisible('.tour')))
  await page.click('button[title="Light show"]')
  await page.waitForTimeout(1500)
  check('light show turns on', await st(page, 's.lightShow'))
  await page.click('button[title="Light show"]')

  // summary + persistence
  check('summary reflects paint', (await page.textContent('#summary')).includes('Toronto Red Metallic'))
  await page.fill('#build-name', 'Test build')
  await page.click('.save-form button[type=submit]')
  check('save build lists it', await page.isVisible('.saved-row >> text=Test build'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__atelier?.getState().sceneReady, null, { timeout: 60000 })
  check('config restored after reload', (await st(page, 's.config.paint')) === 'torontoRed')
  check('intro not repeated in the same session', !(await page.isVisible('.intro')))
  const share = await page.evaluate(() => import('/src/lib/share.ts').then((m) => m.shareUrl({ ...window.__atelier.getState().config, wheelStyle: 'forged' })))
  await page.click('button:has-text("Reset to factory specification")')
  check('reset all restores stock', (await st(page, 's.config.paint')) === 'portimaoBlue')
  await ctx.close()

  const { ctx: c2, page: p2 } = await open({ width: 1280, height: 800 }, share.slice(share.indexOf('?')))
  check('share link restores build', (await st(p2, 's.config.wheelStyle')) === 'forged' && (await st(p2, 's.config.paint')) === 'torontoRed', share.slice(share.indexOf('?')))
  await c2.close()
}

// ---------- mobile ----------
{
  const { ctx, page } = await open({ width: 390, height: 844 })
  await page.click('.intro >> text=Skip intro')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  check('mobile: no horizontal overflow', overflow <= 0, `overflow ${overflow}px`)
  await page.click('.category:has-text("Interior")')
  await page.click('button.option:has-text("Cognac leather")')
  check('mobile: options work', (await st(page, 's.config.seats')) === 'cognac')
  const stageH = await page.evaluate(() => document.querySelector('.stage').getBoundingClientRect().height)
  check('mobile: stage keeps the car visible', stageH > 300, `${Math.round(stageH)}px`)
  await ctx.close()
}

await browser.close()
console.log(results.join('\n'))
const real = errors.filter((e) => !/fonts\.g|Failed to load resource|ERR_|net::/.test(e))
console.log(real.length ? `Console errors:\n${real.join('\n')}` : 'No console errors')
process.exit(results.some((r) => r.startsWith('FAIL')) || real.length ? 1 : 0)
