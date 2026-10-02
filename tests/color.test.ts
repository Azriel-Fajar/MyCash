import { expect, test } from 'vitest'
import { isLight } from '../src/lib/color'

test('isLight picks dark text for light card colors and light text for dark ones', () => {
  expect(isLight('#DDF35A')).toBe(true) // lime
  expect(isLight('#F9E0D2')).toBe(true) // peach
  expect(isLight('#1F2630')).toBe(false) // ink
  expect(isLight('#E07338')).toBe(true) // brand orange: ink 4.9:1 beats white 3.1:1
})
