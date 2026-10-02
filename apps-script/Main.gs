// Main.gs — webhook entry point, message parsing flow and button callbacks.
//
// Callback data (Telegram limit 64 bytes; push ids are 20 chars, pending ids 8):
//   u:<tx>            undo                  ec:<tx>        pick category (roots)
//   er:<tx>:<root>    subcategories         sc:<tx>:<cat>  set category
//   ew:<tx>           pick wallet           sw:<tx>:<w>    set wallet
//   pr:<p>:<root>     pending: subcats      pc:<p>:<cat>   pending: pick category
//   pb:<p>            pending: back         pt:<p>:<type>  pending: switch income/expense
//   pw:<p>:<w>        pending transfer: fill missing wallet
//   lp:<p> / ln:<p>   learn phrase yes / no x  dismiss

var TYPE_ID = { expense: 'Pengeluaran', income: 'Pemasukan', transfer: 'Transfer' }

function doGet() {
  return ContentService.createTextOutput('MyCash bot aktif.')
}

function doPost(e) {
  if (!e || !e.parameter || e.parameter.key !== WEBHOOK_KEY) return ok_()
  var update
  try {
    update = JSON.parse(e.postData.contents)
  } catch (err) {
    return ok_()
  }
  var lock = LockService.getScriptLock()
  if (!lock.tryLock(20000)) return ok_()
  try {
    // Telegram may redeliver (e.g. after a slow reply); handle each update once.
    var cache = CacheService.getScriptCache()
    var seen = 'upd:' + update.update_id
    if (cache.get(seen)) return ok_()
    cache.put(seen, '1', 21600)
    route_(update)
  } catch (err) {
    console.error(err && err.stack ? err.stack : err)
    try {
      send('⚠️ Gagal memproses: ' + escapeHtml(err.message || err))
    } catch (ignored) {}
  } finally {
    lock.releaseLock()
  }
  return ok_()
}

// HtmlService answers 200 directly. ContentService answers with a 302 redirect, which Telegram
// counts as a failed delivery: it retries that update forever and queues every newer one behind it.
function ok_() {
  return HtmlService.createHtmlOutput('ok')
}

function route_(u) {
  if (u.message) {
    var chatId = String(u.message.chat.id)
    var text = (u.message.text || '').trim()
    if (chatId !== String(CHAT_ID)) {
      // Unknown chat: only reveal its own id (needed once for setup), nothing else.
      if (/^\/start/.test(text)) send('Chat ID kamu: <code>' + chatId + '</code>\nIsi CHAT_ID di Config.gs dengan angka ini.', null, chatId)
      return
    }
    if (!text) return send('Kirim pesan teks, contoh: <code>kopi 25rb gopay</code>')
    if (text.charAt(0) === '/') return handleCommand(text)
    return handleText(text)
  }
  if (u.callback_query) {
    var q = u.callback_query
    if (!q.message || String(q.message.chat.id) !== String(CHAT_ID)) return
    answerCallback(q.id)
    handleCallback(q)
  }
}

// ---- Pending parses (cache, 6 h) ----------------------------------------------------------

function savePending(obj, id) {
  var pid = id || Utilities.getUuid().replace(/-/g, '').slice(0, 8)
  CacheService.getScriptCache().put('p:' + pid, JSON.stringify(obj), 21600)
  return pid
}

function loadPending(pid) {
  var v = CacheService.getScriptCache().get('p:' + pid)
  return v ? JSON.parse(v) : null
}

// ---- Rendering ----------------------------------------------------------------------------

function txSummary(st, tx, prefix) {
  var lines = [(prefix || '✅') + ' <b>' + TYPE_ID[tx.type] + '</b> ' + formatIDR(tx.amount)]
  if (tx.type === 'transfer') lines.push(escapeHtml(walletName(st, tx.walletId) + ' → ' + walletName(st, tx.toWalletId)))
  else lines.push(escapeHtml(catLabel(st, tx.categoryId) + ' · ' + walletName(st, tx.walletId)))
  if (tx.note) lines.push('<i>' + escapeHtml(tx.note) + '</i>')
  if (tx.date !== todayWIB()) lines.push('📅 ' + dateLabelId(tx.date))
  return lines.join('\n')
}

function txButtons(id, tx) {
  var b = [btn('↩️ Batal', 'u:' + id)]
  if (tx.type !== 'transfer') b.push(btn('🏷 Kategori', 'ec:' + id))
  b.push(btn('👛 Dompet', 'ew:' + id))
  return [b]
}

function activeChildren_(st, parentId, type) {
  return Object.keys(st.categories)
    .map(function (id) {
      return Object.assign({ id: id }, st.categories[id])
    })
    .filter(function (c) {
      return !c.archived && (c.parentId || null) === parentId && (!type || c.type === type)
    })
    .sort(function (a, b) {
      return a.order - b.order
    })
}

/** Roots of `type`; roots with children drill down, leaves pick. */
function rootKeyboard(st, type, drill, pick, extraRow) {
  var buttons = activeChildren_(st, null, type).map(function (c) {
    return activeChildren_(st, c.id).length ? btn(catName(st, c.id) + ' ›', drill + c.id) : btn(catName(st, c.id), pick + c.id)
  })
  var kb = rows(buttons, 2)
  if (extraRow) kb.push(extraRow)
  return kb
}

function subKeyboard(st, rootId, pick, backData) {
  var buttons = [btn(catName(st, rootId) + ' (umum)', pick + rootId)].concat(
    activeChildren_(st, rootId).map(function (c) {
      return btn(catName(st, c.id), pick + c.id)
    }),
  )
  var kb = rows(buttons, 2)
  kb.push([btn('‹ Kembali', backData)])
  return kb
}

function walletKeyboard(st, prefix, exclude) {
  return rows(
    st.walletList
      .filter(function (w) {
        return (exclude || []).indexOf(w.id) === -1
      })
      .map(function (w) {
        return btn(w.name, prefix + w.id)
      }),
    3,
  )
}

function pendingRoots_(st, pid, type) {
  var other = type === 'expense' ? 'income' : 'expense'
  return rootKeyboard(st, type, 'pr:' + pid + ':', 'pc:' + pid + ':', [btn('⇄ ' + TYPE_ID[other], 'pt:' + pid + ':' + other), btn('✖ Batal', 'x')])
}

// ---- Messages -----------------------------------------------------------------------------

function handleText(text) {
  var st = loadState()
  if (!st.walletList.length) return send('Buka aplikasi MyCash dulu untuk menyiapkan dompet.')
  var p = parseMessage(text, parseContext(st))
  if (!p.ok) return send('Tidak ada jumlah uang di pesan itu.\nContoh: <code>kopi 25rb gopay</code>, <code>gaji 8jt</code>, <code>tf 100rb bca ke gopay</code>. /help')

  if (p.kind === 'transfer') {
    if (p.fromWalletId && p.toWalletId && p.fromWalletId !== p.toWalletId) {
      var t = createTx({ type: 'transfer', amount: p.amount, walletId: p.fromWalletId, toWalletId: p.toWalletId, date: p.date, note: p.note })
      return send(txSummary(st, t.tx), txButtons(t.id, t.tx))
    }
    var tpid = savePending(p)
    var ask = p.fromWalletId ? 'ke dompet mana?' : 'dari dompet mana?'
    return send('Transfer ' + formatIDR(p.amount) + ' ' + ask, walletKeyboard(st, 'pw:' + tpid + ':', [p.fromWalletId, p.toWalletId]))
  }

  if (p.categoryId) {
    var r = createTx({ type: p.type, amount: p.amount, categoryId: p.categoryId, walletId: p.walletId, date: p.date, note: p.note })
    return send(txSummary(st, r.tx), txButtons(r.id, r.tx))
  }

  var type = p.type || 'expense'
  p.type = type
  var pid = savePending(p)
  return send('Kategori untuk “' + escapeHtml(text) + '”?', pendingRoots_(st, pid, type))
}

// ---- Buttons ------------------------------------------------------------------------------

function handleCallback(q) {
  var parts = String(q.data || '').split(':')
  var op = parts[0]
  var msg = q.message.message_id
  if (op === 'x') return edit(msg, 'Dibatalkan.')

  var st = loadState()
  if (op === 'u' || op === 'ec' || op === 'er' || op === 'sc' || op === 'ew' || op === 'sw') return txCallback_(st, op, parts, msg)
  if (op === 'lp' || op === 'ln') return learnCallback_(st, op, parts[1], msg)
  return pendingCallback_(st, op, parts, msg)
}

function txCallback_(st, op, parts, msg) {
  var id = parts[1]
  var tx = dbGet('transactions/' + id)
  if (!tx) return edit(msg, 'Transaksi ini sudah dihapus.')

  if (op === 'u') {
    removeTx(id, tx)
    return edit(msg, txSummary(st, tx, '↩️ Dibatalkan:'))
  }
  if (op === 'ec') return editKeyboard(msg, rootKeyboard(st, tx.type, 'er:' + id + ':', 'sc:' + id + ':', [btn('‹ Kembali', 'sc:' + id + ':' + tx.categoryId)]))
  if (op === 'er') return editKeyboard(msg, subKeyboard(st, parts[2], 'sc:' + id + ':', 'ec:' + id))
  if (op === 'ew') return editKeyboard(msg, walletKeyboard(st, 'sw:' + id + ':', [tx.walletId, tx.toWalletId]))

  var next = Object.assign({}, tx)
  if (op === 'sc') next.categoryId = parts[2]
  if (op === 'sw') next.walletId = parts[2]
  if (next.categoryId !== tx.categoryId || next.walletId !== tx.walletId) updateTx(id, tx, next)
  return edit(msg, txSummary(st, next), txButtons(id, next))
}

function pendingCallback_(st, op, parts, msg) {
  var pid = parts[1]
  var p = loadPending(pid)
  if (!p) return edit(msg, 'Sudah kedaluwarsa. Kirim ulang pesannya.')

  if (op === 'pt') {
    p.type = parts[2]
    savePending(p, pid)
    return editKeyboard(msg, pendingRoots_(st, pid, p.type))
  }
  if (op === 'pb') return editKeyboard(msg, pendingRoots_(st, pid, p.type))
  if (op === 'pr') return editKeyboard(msg, subKeyboard(st, parts[2], 'pc:' + pid + ':', 'pb:' + pid))

  if (op === 'pw') {
    if (!p.fromWalletId) p.fromWalletId = parts[2]
    else p.toWalletId = parts[2]
    if (!p.toWalletId || p.toWalletId === p.fromWalletId) {
      p.toWalletId = null
      savePending(p, pid)
      return edit(msg, 'Transfer ' + formatIDR(p.amount) + ' ke dompet mana?', walletKeyboard(st, 'pw:' + pid + ':', [p.fromWalletId]))
    }
    var t = createTx({ type: 'transfer', amount: p.amount, walletId: p.fromWalletId, toWalletId: p.toWalletId, date: p.date, note: p.note })
    return edit(msg, txSummary(st, t.tx), txButtons(t.id, t.tx))
  }

  if (op === 'pc') {
    var catId = parts[2]
    var cat = st.categories[catId]
    if (!cat) return edit(msg, 'Kategori tidak ditemukan.')
    var r = createTx({ type: cat.type, amount: p.amount, categoryId: catId, walletId: p.walletId, date: p.date, note: p.note })
    edit(msg, txSummary(st, r.tx), txButtons(r.id, r.tx))
    var phrase = phraseKey(p.learnPhrase || '')
    if (phrase) {
      p.chosen = { type: cat.type, categoryId: catId }
      savePending(p, pid)
      send('Ingat “' + escapeHtml(phrase) + '” sebagai <b>' + escapeHtml(catLabel(st, catId)) + '</b>?', [[btn('Ya, ingat', 'lp:' + pid), btn('Tidak', 'ln:' + pid)]])
    }
  }
}

function learnCallback_(st, op, pid, msg) {
  var p = loadPending(pid)
  if (!p || !p.chosen) return edit(msg, 'Sudah kedaluwarsa.')
  var phrase = phraseKey(p.learnPhrase)
  if (op === 'ln') return edit(msg, 'Oke, “' + escapeHtml(phrase) + '” tidak diingat.')
  dbPut('phrases/' + phrase, p.chosen)
  return edit(msg, '👍 “' + escapeHtml(phrase) + '” → ' + escapeHtml(catLabel(st, p.chosen.categoryId)) + '. Lain kali otomatis.')
}
