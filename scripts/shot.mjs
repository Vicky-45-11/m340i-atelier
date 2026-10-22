// Screenshot helper: node scripts/shot.mjs <url> <out.png> [width] [height] [js-to-run]
import { chromium } from 'playwright-core'
const [url, out, w = '1440', h = '900', js = ''] = process.argv.slice(2)
const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('canvas', { timeout: 60000 }); await page.waitForTimeout(4000)
if (js) {
  for (const step of js.split(';;')) {
    await page.evaluate(step)
    await page.waitForTimeout(1800)
  }
}
await page.waitForTimeout(1500)
await page.screenshot({ path: out })
console.log(logs.filter((l) => !l.includes('Download the React DevTools')).join('\n'))
await browser.close()
