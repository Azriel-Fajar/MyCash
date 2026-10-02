function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
}

const INK_L = luminance('#1F2630')

/** True when ink text has more contrast on this background than white text. */
export function isLight(hex: string): boolean {
  const l = luminance(hex)
  return (l + 0.05) / (INK_L + 0.05) > 1.05 / (l + 0.05)
}
