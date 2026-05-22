/**
 * Rasterizes `scripts/assets/ftclt-app-icon.png` (brand master — CLT food truck on red tile)
 * into public PNG sizes + Next.js `app/favicon.ico`.
 * Run: npm run generate:pwa-icons (requires sharp + png-to-ico devDependencies)
 */
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import pngToIco from "png-to-ico"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const masterPath = join(__dirname, "assets", "ftclt-app-icon.png")
const master = readFileSync(masterPath)
const pub = join(__dirname, "..", "public")
const appDir = join(__dirname, "..", "app")

const base = sharp(master)

await base.clone().resize(512, 512).png().toFile(join(pub, "icon-512.png"))
await base.clone().resize(192, 192).png().toFile(join(pub, "icon-192.png"))
/** iOS home screen shortcut (recommended 180×180) */
await base.clone().resize(180, 180).png().toFile(join(pub, "apple-touch-icon.png"))

/** Multi-resolution tab icon — served at `/favicon.ico` via `app/favicon.ico` */
const icoSizes = [256, 48, 32, 16]
const pngForIco = await Promise.all(icoSizes.map((s) => sharp(master).resize(s, s).png().toBuffer()))
const ico = await pngToIco(pngForIco)
writeFileSync(join(appDir, "favicon.ico"), ico)

console.info("Wrote public/icon-512.png, icon-192.png, apple-touch-icon.png; app/favicon.ico")
