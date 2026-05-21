/**
 * Rasterizes SVG app icon sources into public PNGs for PWA + Apple Touch.
 * Run: npm run generate:pwa-icons (requires sharp in devDependencies)
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, "assets", "ftclt-app-icon.svg")
const svg = readFileSync(svgPath)
const pub = join(__dirname, "..", "public")

const base = sharp(svg)

await base.clone().resize(512, 512).png().toFile(join(pub, "icon-512.png"))
await base.clone().resize(192, 192).png().toFile(join(pub, "icon-192.png"))
/** iOS home screen shortcut (recommended 180×180) */
await base.clone().resize(180, 180).png().toFile(join(pub, "apple-touch-icon.png"))

console.info("Wrote public/icon-512.png, icon-192.png, apple-touch-icon.png")
