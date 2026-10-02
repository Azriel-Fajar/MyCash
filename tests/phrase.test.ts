import { expect, test } from 'vitest'
import { phraseKey } from '../src/lib/phrase'

test('phraseKey lowercases, collapses spaces, strips RTDB-forbidden chars', () => {
  expect(phraseKey('  Parkir   Motor ')).toBe('parkir motor')
  expect(phraseKey('a.b#c$d[e]f/g')).toBe('abcdefg')
})
