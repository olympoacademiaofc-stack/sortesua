const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

let ok = true

console.log('=== Build de produção ===')
console.log('')

if (!fs.existsSync(path.join(__dirname, 'public/uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'public/uploads'), { recursive: true })
  console.log('✓ public/uploads criado')
} else {
  console.log('✓ public/uploads existe')
}

const files = ['server.js', 'database.js', 'public/app.js']
for (const f of files) {
  try {
    execSync(`node -c "${path.join(__dirname, f)}"`, { stdio: 'pipe' })
    console.log(`✓ ${f} - sintaxe OK`)
  } catch (e) {
    console.error(`✗ ${f} - ERRO de sintaxe`)
    ok = false
  }
}

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'APP_SECRET']
const missing = requiredEnvVars.filter(v => !process.env[v])
if (missing.length > 0) {
  console.log(`\n⚠ Variáveis de ambiente faltando (ok para dev, obrigatório em produção): ${missing.join(', ')}`)
} else {
  console.log('✓ Variáveis de ambiente configuradas')
}

console.log('')
if (ok) {
  console.log('✓ Build concluído com sucesso')
  process.exit(0)
} else {
  console.log('✗ Build falhou')
  process.exit(1)
}
