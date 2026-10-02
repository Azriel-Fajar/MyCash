/** Phrase as stored under /phrases. RTDB keys can't contain . # $ [ ] / */
export function phraseKey(phrase: string): string {
  return phrase.toLowerCase().replace(/[.#$[\]/]/g, '').replace(/\s+/g, ' ').trim()
}
