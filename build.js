const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = __dirname
const DIST = path.join(ROOT, 'dist')

const ITEMS = [
  'server.js',
  'database.js',
  'package.json',
  'package-lock.json',
  'Procfile',
  '.nvmrc',
  '.env.example'
]

let ok = true

console.log('')
console.log('═══════════════════════════')
console.log('  BUILD DE PRODUÇÃO')
console.log('═══════════════════════════')
console.log('')

console.log('▶ Verificando sintaxe...')
;['server.js', 'database.js', 'public/app.js'].forEach(f => {
  try {
    execSync(`node -c "${path.join(ROOT, f)}"`, { stdio: 'pipe' })
    console.log(`  ✓ ${f}`)
  } catch {
    console.error(`  ✗ ${f} - ERRO de sintaxe`)
    ok = false
  }
})
console.log('')
if (!ok) { console.log('✗ Build falhou'); process.exit(1) }

console.log('▶ Limpando dist/ ...')
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true })
fs.mkdirSync(DIST)
console.log('  ✓ dist/ criada')
console.log('')

console.log('▶ Copiando arquivos...')
ITEMS.forEach(item => {
  const src = path.join(ROOT, item)
  if (!fs.existsSync(src)) {
    console.log(`  - ${item} (ignorado)`)
    return
  }
  const dest = path.join(DIST, item)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.cpSync(src, dest, { recursive: true })
  console.log(`  ✓ ${item}`)
})

if (fs.existsSync(path.join(ROOT, 'config.json'))) {
  fs.cpSync(path.join(ROOT, 'config.json'), path.join(DIST, 'config.json'))
  console.log('  ✓ config.json')
}

console.log('  ✓ public/')
execSync(`Copy-Item -Path "${path.join(ROOT, 'public')}" -Destination "${path.join(DIST, 'public')}" -Recurse -Force`, { shell: 'powershell.exe' })

const uploads = path.join(DIST, 'public', 'uploads')
if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true })
console.log('  ✓ public/uploads/')
console.log('')

console.log('▶ Instalando dependências de produção...')
try {
  execSync('npm install --production --no-audit --no-fund', { cwd: DIST, stdio: 'pipe' })
  console.log('  ✓ node_modules instalado')
} catch (e) {
  execSync('npm install --production', { cwd: DIST, stdio: 'inherit' })
}
console.log('')

console.log('═══════════════════════════')
console.log('  BUILD CONCLUÍDO COM SUCESSO')
console.log('═══════════════════════════')
console.log('')
console.log(`  📁 ${DIST}`)
console.log('')
console.log('  Para testar localmente:')
console.log('    cd dist && npm start')
console.log('')
