const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = __dirname
const IGNORE = ['node_modules', '.git', 'dist', '.env']
const DEBOUNCE_MS = 3000

let timer = null
let changedFiles = new Set()

function shouldIgnore(name) {
  return IGNORE.some(i => name === i || name.startsWith(i + path.sep))
}

function onChange(event, filename) {
  if (!filename || shouldIgnore(filename)) return
  changedFiles.add(filename)
  clearTimeout(timer)
  timer = setTimeout(commitAndPush, DEBOUNCE_MS)
}

function commitAndPush() {
  if (changedFiles.size === 0) return
  const files = Array.from(changedFiles)
  changedFiles = new Set()

  const msg = `auto: ${files.slice(0, 3).join(', ')}${files.length > 3 ? ` +${files.length - 3}` : ''}`

  try {
    execSync('git add .', { cwd: ROOT, stdio: 'pipe' })
    const status = execSync('git status --porcelain', { cwd: ROOT, stdio: 'pipe' }).toString().trim()
    if (!status) {
      console.log(`[watch] sem alterações para commit`)
      return
    }
    execSync(`git commit -m "${msg}"`, { cwd: ROOT, stdio: 'pipe' })
    console.log(`[watch] commit: ${msg}`)
    execSync('git push', { cwd: ROOT, stdio: 'pipe' })
    console.log(`[watch] push feito com sucesso`)
  } catch (e) {
    console.error(`[watch] erro: ${e.message}`)
  }
}

console.log('')
console.log('═══════════════════════════')
console.log('  WATCH - Push Automático')
console.log('═══════════════════════════')
console.log('')
console.log('  Observando alterações...')
console.log('  (Ctrl+C para parar)')
console.log('')

const watcher = fs.watch(ROOT, { recursive: true }, onChange)

process.on('SIGINT', () => {
  watcher.close()
  console.log('\n  Watch encerrado.')
  process.exit(0)
})
