import { describe, expect, test } from 'vitest'
import { ICONS } from '../src/lib/icons'
import { buildCategorySeed, CATEGORY_TREE, WALLET_PRESETS } from '../src/lib/seed'

let n = 0
const newId = () => `id${n++}`

describe('buildCategorySeed', () => {
  const seed = buildCategorySeed(newId)
  const cats = Object.values(seed)

  test('creates one category per tree node, keys unique', () => {
    const nodes = CATEGORY_TREE.flatMap((p) => [p, ...(p.children ?? [])])
    expect(cats).toHaveLength(nodes.length)
    expect(new Set(cats.map((c) => c.key)).size).toBe(cats.length)
  })

  test('children point at an existing parent of the same type', () => {
    for (const c of cats.filter((c) => c.parentId)) {
      const parent = seed[c.parentId as string]
      expect(parent).toBeDefined()
      expect(parent.parentId).toBeNull()
      expect(parent.type).toBe(c.type)
    }
  })

  test('children inherit parent color', () => {
    for (const c of cats.filter((c) => c.parentId)) {
      expect(c.color).toBe(seed[c.parentId as string].color)
    }
  })

  test('has both expense and income roots', () => {
    const roots = cats.filter((c) => !c.parentId)
    expect(roots.some((c) => c.type === 'expense')).toBe(true)
    expect(roots.some((c) => c.type === 'income')).toBe(true)
  })

  test('every icon exists in the icon map', () => {
    for (const c of cats) expect(ICONS[c.icon], c.icon).toBeDefined()
  })
})

describe('WALLET_PRESETS', () => {
  test('names unique', () => {
    expect(new Set(WALLET_PRESETS.map((w) => w.name)).size).toBe(WALLET_PRESETS.length)
  })
})
