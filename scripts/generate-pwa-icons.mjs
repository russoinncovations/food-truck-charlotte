/**
 * Rasterizes `scripts/assets/ftclt-app-icon.png` (brand master — CLT food truck on red tile)
 * into public PNG sizes + Next.js `app/favicon.ico`.
 * Run: npm run generate:pwa-icons (requires sharp + png-to-ico devDependencies)
 *
 * Outputs: exact 512×512, 192×192, 180×180 PNG (truecolor + alpha); ICO with 16,32,48,256.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const masterPath = join(__dirname, 'assets', 'ftclt-app-icon.png')
const master = readFileSync(masterPath)
const pub = join(__dirname, '..', 'public')
const appDir = join(__dirname, '..', 'app')

/** Normalize to exact square output and standard PNG for PWAs / iOS Safari. */
function toAppIcon(size) {
  return sharp(master)
    .rotate()
    .resize(size, size, {
      fit: 'cover',
      position: 'centre',
    })
    /** iOS prefers standard 32‑bit PNG; avoids odd palette/bit-depth edge cases */
    .ensureAlpha()
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      force: true,
    })
}

await toAppIcon(512).toFile(join(pub, 'icon-512.png'))
await toAppIcon(192).toFile(join(pub, 'icon-192.png'))
/** iOS “Add to Home Screen” canonical size */
await toAppIcon(180).toFile(join(pub, 'apple-touch-icon.png'))

/** Multi-resolution favicon.ico — ascending sizes (png-to-ico / Windows-friendly order) */
const icoSizes = [16, 32, 48, 256]
const pngForIco = await Promise.all(icoSizes.map((s) => toAppIcon(s).toBuffer()))
const ico = await pngToIco(pngForIco)
writeFileSync(join(appDir, 'favicon.ico'), ico)

console.info('Wrote public/icon-512.png, icon-192.png, apple-touch-icon.png; app/favicon.ico')
