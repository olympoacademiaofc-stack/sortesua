const sharp = require('sharp')
const path = require('path')

const src = path.join(__dirname, '..', 'ICONE.png')
const dest = path.join(__dirname, '..', 'public')

async function main() {
  console.log('Gerando ícones PWA...')
  await sharp(src).resize(192, 192).png().toFile(path.join(dest, 'icon-192.png'))
  console.log('  ✓ icon-192.png')
  await sharp(src).resize(512, 512).png().toFile(path.join(dest, 'icon-512.png'))
  console.log('  ✓ icon-512.png')
  console.log('Ícones gerados com sucesso!')
}

main().catch(err => { console.error(err); process.exit(1) })
