const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const DEST = path.join(__dirname, '..', 'public')

function crc32(buf) {
  let crc = 0xFFFFFFFF
  const table = new Int32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[i] = c
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const t = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([t, data])
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(crcData))
  return Buffer.concat([len, t, data, crcVal])
}

function createPNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const raw = Buffer.alloc(size * (1 + size * 3))
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2, cy = y - size / 2
      const dist = Math.sqrt(cx * cx + cy * cy)
      const angle = Math.atan2(cy, cx)
      let isClover = false
      for (let i = 0; i < 3; i++) {
        const a = angle - i * 2 * Math.PI / 3
        const r2 = dist * dist
        const leaf = r2 < (size * 0.18) * (size * 0.18) + (size * 0.08) * Math.cos(3 * a) * size * 0.12
        if (leaf) { isClover = true; break }
      }
      const center = dist < size * 0.05
      const pix = (isClover || center) ? 255 : r
      const pixG = (isClover || center) ? 215 : g
      const pixB = (isClover || center) ? 0 : b
      const offset = y * (1 + size * 3) + 1 + x * 3
      raw[offset] = pix
      raw[offset + 1] = pixG
      raw[offset + 2] = pixB
    }
  }

  const idat = zlib.deflateSync(raw)
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

console.log('Gerando ícones PWA...')
fs.writeFileSync(path.join(DEST, 'icon-192.png'), createPNG(192, 15, 15, 15))
console.log('  ✓ icon-192.png')
fs.writeFileSync(path.join(DEST, 'icon-512.png'), createPNG(512, 15, 15, 15))
console.log('  ✓ icon-512.png')
console.log('Ícones gerados com sucesso!')
