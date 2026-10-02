// Writes database.rules.json from database.rules.template.json, filling OWNER_UID from .env.local.
// Runs before `firebase deploy` and the emulators so the UID never has to live in the repo.
import fs from 'node:fs'
import { loadEnv } from 'vite'

const { OWNER_UID: uid = '' } = loadEnv('production', process.cwd(), '')
const template = fs.readFileSync('database.rules.template.json', 'utf8')

if (!/^[A-Za-z0-9]{10,128}$/.test(uid)) {
  console.warn('⚠ OWNER_UID missing or invalid in .env.local: the database rules will deny everyone.')
  fs.writeFileSync('database.rules.json', template)
} else {
  fs.writeFileSync('database.rules.json', template.replaceAll('OWNER_UID', uid))
  console.log(`database.rules.json written for UID ${uid}`)
}
