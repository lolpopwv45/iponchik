import { readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const imagesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images')

async function toWebp(inputPath, outputPath, width) {
  const image = sharp(inputPath, { failOn: 'none' }).rotate()
  const meta = await image.metadata()
  const resizeWidth = meta.width && meta.width > width ? width : undefined

  await image
    .resize({ width: resizeWidth, withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toFile(outputPath)

  const bytes = (await stat(outputPath)).size
  console.log(
    `${path.basename(inputPath)} → ${path.basename(outputPath)} ${Math.round(bytes / 1024)} KB`,
  )
}

const files = (await readdir(imagesDir)).filter((name) => name.endsWith('.png'))
if (files.length === 0) {
  console.log('No PNGs to optimize')
  process.exit(0)
}

for (const file of files) {
  const inputPath = path.join(imagesDir, file)
  const width = file.startsWith('hero-') ? 1600 : 900
  await toWebp(inputPath, path.join(imagesDir, file.replace(/\.png$/i, '.webp')), width)
}

const heroPng = path.join(imagesDir, 'hero-donuts.png')
await sharp(heroPng, { failOn: 'none' })
  .rotate()
  .resize({ width: 1200, height: 630, fit: 'cover' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(path.join(imagesDir, 'og.jpg'))
console.log('og.jpg written')

for (const file of files) {
  await unlink(path.join(imagesDir, file))
  console.log(`removed ${file}`)
}
