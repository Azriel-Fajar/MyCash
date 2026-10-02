// Parser.gs — turns chat text into a transaction. Pure functions only (no Apps Script
// services) so tests/parser.test.ts can run it in Node.

var AMOUNT_SUFFIX = { rb: 1e3, ribu: 1e3, k: 1e3, jt: 1e6, juta: 1e6 }
var TRANSFER_WORDS = ['transfer', 'tf', 'pindah', 'topup', 'top up', 'top-up', 'isi saldo']
var TO_WORDS = ['ke', 'to']
var FROM_WORDS = ['dari', 'dr', 'from']
// Dropped from the note.
var CONNECTOR_WORDS = ['pake', 'pakai', 'via', 'dengan', 'ke', 'dari', 'dr', 'to', 'from', 'using', 'with']
// Also dropped when proposing a phrase to learn.
var FILLER_WORDS = CONNECTOR_WORDS.concat(['beli', 'bayar', 'buat', 'untuk', 'utk', 'di', 'masuk', 'keluar', 'for', 'at', 'the', 'a', 'paid', 'buy'])
// Also dropped from a transaction's note: chatter and action verbs (the verb already picked the category).
var DESC_DROP_WORDS = [
  'aku', 'saya', 'gue', 'gua', 'gw', 'ane', 'i',
  'tadi', 'td', 'barusan', 'abis', 'habis', 'baru', 'udah', 'udh', 'sudah', 'lagi', 'lg',
  'nih', 'dong', 'deh', 'sih', 'ya', 'aja', 'yg', 'yang', 'wkwk', 'wkwkwk', 'hehe',
  'jajan', 'makan', 'minum', 'beli', 'bayar', 'belanja', 'nonton', 'isi', 'di', 'masuk', 'keluar',
  'just', 'bought', 'buy', 'paid', 'pay', 'for', 'at', 'the', 'a',
]
// The note stops here: "bang bang sama temen" → "bang bang".
var DESC_CUT_WORDS = ['sama', 'bareng']

function escapeRegex_(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Every whole-word occurrence of `word` in lowercased `text`: [{ start, end }]. */
function findWord_(text, word) {
  var re = new RegExp('(^|[^a-z0-9])(' + escapeRegex_(word) + ')(?=[^a-z0-9]|$)', 'g')
  var out = []
  var m
  while ((m = re.exec(text))) {
    var start = m.index + m[1].length
    out.push({ start: start, end: start + m[2].length })
    re.lastIndex = start + 1
  }
  return out
}

function overlaps_(a, spans) {
  return spans.some(function (s) {
    return a.start < s.end && s.start < a.end
  })
}

function pad2_(n) {
  return (n < 10 ? '0' : '') + n
}

function addDaysStr_(date, n) {
  var p = date.split('-').map(Number)
  return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10)
}

/** { date, spans }: an explicit dd/mm[/yyyy] wins over kemarin / hari ini; all are consumed. */
function findDate_(lower, today) {
  var spans = []
  var date = null
  var rel = /(^|\s)(kemarin|yesterday|hari ini|today)(?=\s|$)/g
  var m
  while ((m = rel.exec(lower))) {
    spans.push({ start: m.index + m[1].length, end: m.index + m[0].length })
    if (!date) date = /kemarin|yesterday/.test(m[2]) ? addDaysStr_(today, -1) : today
  }
  m = /(^|\s)(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?(?=\s|$)/.exec(lower)
  if (m) {
    var d = Number(m[2])
    var mo = Number(m[3])
    var y = m[4] ? Number(m[4].length === 2 ? '20' + m[4] : m[4]) : Number(today.slice(0, 4))
    var check = new Date(Date.UTC(y, mo - 1, d))
    if (check.getUTCMonth() === mo - 1 && check.getUTCDate() === d) {
      var explicit = y + '-' + pad2_(mo) + '-' + pad2_(d)
      if (!m[4] && explicit > today) explicit = y - 1 + explicit.slice(4)
      date = explicit
      spans.push({ start: m.index + m[1].length, end: m.index + m[0].length })
    }
  }
  return date ? { date: date, spans: spans } : null
}

function toAmount_(num, suffix) {
  if (!suffix) return parseInt(num.replace(/[.,]/g, ''), 10)
  var seps = num.match(/[.,]/g) || []
  // "1,5jt" / "1.5jt": one separator = decimal point. "1.250rb": thousands.
  var n = seps.length === 1 && !/[.,]\d{3}$/.test(num) ? parseFloat(num.replace(',', '.')) : parseInt(num.replace(/[.,]/g, ''), 10)
  return Math.round(n * AMOUNT_SUFFIX[suffix])
}

/** First suffixed amount, else the largest number. Ignores spans already used (dates). */
function findAmount_(lower, used) {
  var re = /(^|[^a-z0-9])(\d+(?:[.,]\d+)*)(?:\s?(rb|ribu|k|jt|juta))?(?![a-z0-9])/g
  var best = null
  var m
  while ((m = re.exec(lower))) {
    var start = m.index + m[1].length
    var span = { start: start, end: m.index + m[0].length }
    if (overlaps_(span, used)) continue
    var value = toAmount_(m[2], m[3])
    if (!value) continue
    var cand = { value: value, suffixed: Boolean(m[3]), start: span.start, end: span.end }
    if (!best || (cand.suffixed && !best.suffixed) || (cand.suffixed === best.suffixed && !best.suffixed && cand.value > best.value)) best = cand
    if (best.suffixed) break
  }
  return best
}

/** Wallet mentions in text order: [{ walletId, start, end }]. */
function findWallets_(lower, wallets, aliases) {
  var names = []
  wallets.forEach(function (w) {
    names.push({ word: w.name.toLowerCase(), walletId: w.id })
  })
  Object.keys(aliases || {}).forEach(function (alias) {
    var target = aliases[alias].toLowerCase()
    var w = wallets.filter(function (x) {
      return x.name.toLowerCase() === target
    })[0]
    if (w) names.push({ word: alias.toLowerCase(), walletId: w.id })
  })
  names.sort(function (a, b) {
    return b.word.length - a.word.length
  })
  var found = []
  names.forEach(function (n) {
    findWord_(lower, n.word).forEach(function (s) {
      if (!overlaps_(s, found)) found.push({ walletId: n.walletId, start: s.start, end: s.end })
    })
  })
  return found.sort(function (a, b) {
    return a.start - b.start
  })
}

function findFirst_(lower, words, used) {
  var hit = null
  words.forEach(function (w) {
    findWord_(lower, w).forEach(function (s) {
      if (!overlaps_(s, used) && (!hit || s.start < hit.start)) hit = s
    })
  })
  return hit
}

/** Longest phrase present as whole words, outside used spans. */
function findPhrase_(lower, phrases, used) {
  var keys = Object.keys(phrases).sort(function (a, b) {
    return b.length - a.length
  })
  for (var i = 0; i < keys.length; i++) {
    var spans = findWord_(lower, keys[i]).filter(function (s) {
      return !overlaps_(s, used)
    })
    if (spans.length) return { phrase: keys[i], entry: phrases[keys[i]], start: spans[0].start, end: spans[0].end }
  }
  return null
}

function leftoverWords_(text, used, drop) {
  var chars = text.split('')
  used.forEach(function (s) {
    for (var i = s.start; i < s.end; i++) chars[i] = ' '
  })
  return chars
    .join('')
    .replace(/^\s*[+-]/, ' ')
    .split(/\s+/)
    .filter(function (w) {
      return w && drop.indexOf(w.toLowerCase()) === -1
    })
}

/**
 * Transaction note from leftover words: chatter dropped, cut at DESC_CUT_WORDS, Title Cased
 * (words typed with capitals stay as typed). A multi-word phrase ("makan siang") is kept whole.
 * Nothing left → the matched phrase.
 */
function describe_(words, phrase) {
  var keep = phrase && phrase.indexOf(' ') !== -1 ? phrase.split(' ') : []
  var out = []
  for (var i = 0; i < words.length; i++) {
    var w = words[i].toLowerCase()
    if (DESC_CUT_WORDS.indexOf(w) !== -1) break
    if (DESC_DROP_WORDS.indexOf(w) === -1 || keep.indexOf(w) !== -1) out.push(words[i])
  }
  if (!out.length && phrase) out = phrase.split(' ')
  return out
    .map(function (w) {
      return w === w.toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w
    })
    .join(' ')
}

/**
 * ctx: { today, wallets: [{id, name}], aliases: {alias: walletName}, defaultWalletId,
 *        phrases: {phrase: {type, categoryId}} }
 */
function parseMessage(text, ctx) {
  var raw = String(text || '').trim()
  var lower = raw.toLowerCase()
  var used = []

  var date = findDate_(lower, ctx.today)
  if (date) used = used.concat(date.spans)

  var amount = findAmount_(lower, used)
  if (!amount) return { ok: false, reason: 'no_amount' }
  used.push(amount)

  var mentions = findWallets_(lower, ctx.wallets, ctx.aliases).filter(function (m) {
    return !overlaps_(m, used)
  })
  mentions.forEach(function (m) {
    used.push(m)
  })

  var phrase = findPhrase_(lower, ctx.phrases || {}, used)
  var transferWord = findFirst_(lower, TRANSFER_WORDS, used)
  var forced = /^\+/.test(raw) ? 'income' : /^-/.test(raw) ? 'expense' : null

  var base = { ok: true, amount: amount.value, date: date ? date.date : ctx.today }

  if (transferWord && (mentions.length >= 2 || (mentions.length === 1 && !phrase))) {
    used.push(transferWord)
    var toWord = findFirst_(lower, TO_WORDS, used)
    var fromWord = findFirst_(lower, FROM_WORDS, used)
    var after = function (w) {
      return mentions.filter(function (m) {
        return m.start > w.start
      })[0]
    }
    var from = null
    var to = null
    if (toWord && after(toWord)) {
      to = after(toWord)
      from = mentions.filter(function (m) { return m !== to })[0] || null
    } else if (fromWord && after(fromWord)) {
      from = after(fromWord)
      to = mentions.filter(function (m) { return m !== from })[0] || null
    } else if (mentions.length === 1) {
      to = mentions[0] // "topup gopay 50rb": the named wallet receives
    } else {
      from = mentions[0]
      to = mentions[1]
    }
    return Object.assign(base, {
      kind: 'transfer',
      fromWalletId: from ? from.walletId : null,
      toWalletId: to ? to.walletId : null,
      note: leftoverWords_(raw, used, CONNECTOR_WORDS).join(' '),
    })
  }

  var matched = phrase && (!forced || forced === phrase.entry.type) ? phrase : null
  var note = describe_(leftoverWords_(raw, used, CONNECTOR_WORDS), matched ? matched.phrase : null)
  return Object.assign(base, {
    kind: 'tx',
    type: matched ? matched.entry.type : forced,
    categoryId: matched ? matched.entry.categoryId : null,
    matched: matched ? matched.phrase : null,
    walletId: mentions.length ? mentions[0].walletId : ctx.defaultWalletId,
    walletExplicit: mentions.length > 0,
    note: note,
    learnPhrase: leftoverWords_(lower, used, FILLER_WORDS).slice(0, 3).join(' '),
  })
}

/**
 * Base PHRASES (phrase → category key, from Config.gs) + learned /phrases (phrase → {type, categoryId}).
 * Learned entries win. Keys that match no category are skipped.
 */
function mergePhrases(base, learned, categories) {
  var byKey = {}
  Object.keys(categories || {}).forEach(function (id) {
    var c = categories[id]
    if (c.key && !c.archived) byKey[c.key] = { type: c.type, categoryId: id }
  })
  var out = {}
  Object.keys(base || {}).forEach(function (p) {
    if (byKey[base[p]]) out[p.toLowerCase()] = byKey[base[p]]
  })
  Object.keys(learned || {}).forEach(function (p) {
    out[p.toLowerCase()] = { type: learned[p].type, categoryId: learned[p].categoryId }
  })
  return out
}

/** Key under /phrases — same rules as src/lib/phrase.ts (RTDB keys can't contain . # $ [ ] /). */
function phraseKey(phrase) {
  return String(phrase).toLowerCase().replace(/[.#$[\]/]/g, '').replace(/\s+/g, ' ').trim()
}
