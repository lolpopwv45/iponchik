import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'app', 'icon.png')
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }
const CREAM = { r: 255, g: 247, b: 237, alpha: 1 }

async function raster(size, background) {
  return sharp(source, { failOn: 'none' })
    .resize(size, size, {
      fit: 'contain',
      background,
      kernel: 'lanczos3',
    })
    .flatten({ background })
    .png()
    .toBuffer()
}

function pngToIco(images) {
  const headerSize = 6 + 16 * images.length
  let offset = headerSize
  const entries = images.map((png) => {
    const entry = { png, offset }
    offset += png.length
    return entry
  })

  const buf = Buffer.alloc(offset)
  buf.writeUInt16LE(0, 0)
  buf.writeUInt16LE(1, 2)
  buf.writeUInt16LE(images.length, 4)

  let cursor = 6
  for (let i = 0; i < images.length; i += 1) {
    const png = images[i]
    const metaOffset = entries[i].offset
    const size = [16, 32, 48][i]
    buf.writeUInt8(size, cursor)
    buf.writeUInt8(size, cursor + 1)
    buf.writeUInt8(0, cursor + 2)
    buf.writeUInt8(0, cursor + 3)
    buf.writeUInt16LE(1, cursor + 4)
    buf.writeUInt16LE(32, cursor + 6)
    buf.writeUInt32LE(png.length, cursor + 8)
    buf.writeUInt32LE(metaOffset, cursor + 12)
    cursor += 16
  }

  for (const entry of entries) {
    entry.png.copy(buf, entry.offset)
  }

  return buf
}

const icon192 = await raster(192, WHITE)
const icon512 = await raster(512, WHITE)
const apple180 = await raster(180, CREAM)
const png16 = await raster(16, WHITE)
const png32 = await raster(32, WHITE)
const png48 = await raster(48, WHITE)

await writeFile(path.join(root, 'app', 'icon.png'), icon192)
await writeFile(path.join(root, 'app', 'apple-icon.png'), apple180)
await writeFile(path.join(root, 'app', 'favicon.ico'), pngToIco([png16, png32, png48]))
await writeFile(path.join(root, 'public', 'apple-icon.png'), apple180)
await writeFile(path.join(root, 'public', 'icon-192.png'), icon192)
await writeFile(path.join(root, 'public', 'icon-512.png'), icon512)
await writeFile(path.join(root, 'public', 'favicon.ico'), pngToIco([png16, png32, png48]))

console.log('icons written')
