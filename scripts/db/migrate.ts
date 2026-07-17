import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'
import '../seed/loadEnv'

const SQL_DIR = path.join(process.cwd(), 'docs', 'sql')
const STATUS_ONLY = process.argv.includes('--status')

function listMigrationFiles(): string[] {
  return readdirSync(SQL_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort()
}

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    create table if not exists public._migrations (
      filename text primary key,
      applied_at timestamptz not null default timezone('utc', now())
    );
  `)
}

async function getAppliedFilenames(client: Client): Promise<Set<string>> {
  const result = await client.query<{ filename: string }>('select filename from public._migrations')
  return new Set(result.rows.map((row) => row.filename))
}

async function applyMigration(client: Client, filename: string) {
  const filePath = path.join(SQL_DIR, filename)
  const sql = readFileSync(filePath, 'utf8')

  console.log(`[migrate] Aplicando ${filename}...`)

  try {
    await client.query('begin')
    await client.query(sql)
    await client.query('insert into public._migrations (filename) values ($1)', [filename])
    await client.query('commit')
    console.log('[migrate] OK')
  } catch (error) {
    await client.query('rollback')
    throw error
  }
}

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL

  if (!connectionString) {
    console.error(
      '[migrate] Falta SUPABASE_DB_URL en .env.local. ' +
        'Copiala desde Supabase Dashboard > Settings > Database > Connection string > pestaña "URI" (conexion directa, no el pooler).'
    )
    process.exit(1)
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    await ensureMigrationsTable(client)

    const allFiles = listMigrationFiles()
    const applied = await getAppliedFilenames(client)
    const pending = allFiles.filter((filename) => !applied.has(filename))

    console.log(`[migrate] Migraciones ya aplicadas: ${applied.size}`)
    console.log(`[migrate] Pendientes: ${pending.length}`)

    for (const filename of pending) {
      console.log(`[migrate]   - ${filename}`)
    }

    if (STATUS_ONLY) {
      return
    }

    if (pending.length === 0) {
      console.log('[migrate] Nada para aplicar.')
      return
    }

    for (const filename of pending) {
      await applyMigration(client, filename)
    }

    console.log(`[migrate] Listo. ${pending.length} migracion(es) aplicada(s).`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('[migrate] Error:', error instanceof Error ? error.message : error)
  process.exit(1)
})
