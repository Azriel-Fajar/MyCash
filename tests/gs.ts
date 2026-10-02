import fs from 'node:fs'
import vm from 'node:vm'

/** Evaluate apps-script/*.gs files in a fresh context and return the named top-level bindings. */
export function loadGs<T = Record<string, any>>(files: string[], names: string[]): T {
  const code = files.map((f) => fs.readFileSync(new URL(`../apps-script/${f}`, import.meta.url), 'utf8')).join('\n;\n')
  return vm.runInNewContext(`${code}\n;({ ${names.join(', ')} })`, {}) as T
}
