import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Carga .env.local a process.env sin depender de Next.js (que solo lo hace
 * para su propio dev/build server) ni de una libreria externa. Necesario
 * porque estos scripts corren como proceso Node/tsx suelto
 * (`npm run seed:marketplace`), no dentro del runtime de Next.
 * No pisa variables ya seteadas en el entorno (ej. por PowerShell $env:).
 */
function loadEnvFile(fileName: string) {
  const filePath = path.join(process.cwd(), fileName)

  let content: string
  try {
    content = readFileSync(filePath, 'utf8')
  } catch {
    return
  }

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')
