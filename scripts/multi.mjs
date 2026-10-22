// node scripts/multi.mjs <url> <outdir> <w> <h> name=js [name=js ...]  (one browser, many shots)
import { chromium } from 'playwright-core'
const [url, dir, w, h, ...shots] = process.argv.slice(2)
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const logs = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('canvas', { timeout: 60000 })
await page.waitForTimeout(4000)
await page.evaluate("window.__atelier && (__atelier.getState().finishIntro(), __atelier.setState({hotspots:false}))")
for (const s of shots) {
  const i = s.indexOf('=')
  const name = s.slice(0, i)
  const js = s.slice(i + 1)
  for (const step of js.split(';;')) if (step.trim()) { await page.evaluate(step); await page.waitForTimeout(600) }
  await page.waitForTimeout(2600)
  await page.screenshot({ path: `${dir}/${name}.png` })
}
console.log(logs.slice(0, 30).join('\n'))
await browser.close()
