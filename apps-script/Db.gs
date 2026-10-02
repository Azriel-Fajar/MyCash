// Db.gs — Realtime Database REST access, authenticated as the script owner.

function dbUrl_(path, params) {
  var q = Object.assign({}, params || {})
  if (DB_SECRET) q.auth = DB_SECRET
  else q.access_token = ScriptApp.getOAuthToken()
  var qs = Object.keys(q)
    .map(function (k) {
      return k + '=' + encodeURIComponent(q[k])
    })
    .join('&')
  var cleanPath = String(path || '')
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')
  return DB_URL.replace(/\/$/, '') + '/' + cleanPath + '.json?' + qs
}

function parseDbResponse_(res, label) {
  var code = res.getResponseCode()
  var text = res.getContentText()
  if (code >= 300) throw new Error('Database ' + label + ' gagal (' + code + '): ' + text)
  return text ? JSON.parse(text) : null
}

function dbFetch_(method, path, body, params) {
  var opts = { method: method, muteHttpExceptions: true }
  if (body !== undefined) {
    opts.contentType = 'application/json'
    opts.payload = JSON.stringify(body)
  }
  return parseDbResponse_(UrlFetchApp.fetch(dbUrl_(path, params), opts), method.toUpperCase() + ' /' + path)
}

function dbGet(path, params) {
  return dbFetch_('get', path, undefined, params)
}

/** Multi-path update when path is '' (keys like "transactions/abc"). */
function dbPatch(path, body) {
  return dbFetch_('patch', path, body)
}

function dbPut(path, body) {
  return dbFetch_('put', path, body)
}

function dbDelete(path) {
  return dbFetch_('delete', path)
}

/** Several GETs in parallel. Each item: 'path' or { path, params }. */
function dbGetAll(items) {
  var reqs = items.map(function (it) {
    var p = typeof it === 'string' ? { path: it } : it
    return { url: dbUrl_(p.path, p.params), muteHttpExceptions: true }
  })
  return UrlFetchApp.fetchAll(reqs).map(function (res, i) {
    return parseDbResponse_(res, 'GET /' + (items[i].path || items[i]))
  })
}

/** Query params for orderBy/equalTo/startAt/endAt (values must be JSON-quoted). */
function byChild(child, opts) {
  var p = { orderBy: JSON.stringify(child) }
  Object.keys(opts).forEach(function (k) {
    p[k] = JSON.stringify(opts[k])
  })
  return p
}

function toList_(obj) {
  return Object.keys(obj || {}).map(function (id) {
    return Object.assign({ id: id }, obj[id])
  })
}

// ---- Shared state -------------------------------------------------------------------------

function loadState() {
  var r = dbGetAll(['wallets', 'categories', 'settings', 'phrases'])
  var wallets = r[0] || {}
  var categories = r[1] || {}
  var settings = r[2] || {}
  var walletList = toList_(wallets)
    .filter(function (w) {
      return !w.archived
    })
    .sort(function (a, b) {
      return a.order - b.order
    })
  return { wallets: wallets, categories: categories, settings: settings, learned: r[3] || {}, walletList: walletList }
}

function parseContext(st) {
  return {
    today: todayWIB(),
    wallets: st.walletList.map(function (w) {
      return { id: w.id, name: w.name }
    }),
    aliases: WALLET_ALIASES,
    defaultWalletId: st.settings.defaultWalletId || (st.walletList[0] && st.walletList[0].id),
    phrases: mergePhrases(PHRASES, st.learned, st.categories),
  }
}

function catName(st, id) {
  var c = st.categories[id]
  return c ? c.name || CAT_NAMES[c.key] || '?' : '—'
}

function catLabel(st, id) {
  var c = st.categories[id]
  if (!c) return '—'
  return c.parentId ? catName(st, c.parentId) + ' › ' + catName(st, id) : catName(st, id)
}

function rootOfFn(st) {
  return function (id) {
    var c = st.categories[id]
    return c ? c.parentId || id : id
  }
}

function walletName(st, id) {
  return (st.wallets[id] && st.wallets[id].name) || '—'
}

// ---- Transactions -------------------------------------------------------------------------

/** fields: type, amount, categoryId, walletId, toWalletId, date, note, source, recurringId */
function newTx(fields) {
  var now = Date.now()
  return {
    type: fields.type,
    amount: fields.amount,
    categoryId: fields.type === 'transfer' ? null : fields.categoryId,
    walletId: fields.walletId,
    toWalletId: fields.type === 'transfer' ? fields.toWalletId : null,
    date: fields.date,
    month: monthKey(fields.date),
    note: fields.note || '',
    source: fields.source || 'bot',
    recurringId: fields.recurringId || null,
    createdAt: now,
    updatedAt: now,
  }
}

function createTx(fields) {
  var id = newPushId()
  var tx = newTx(fields)
  dbPatch('', buildTxUpdate(id, null, tx))
  return { id: id, tx: tx }
}

function updateTx(id, oldTx, nextTx) {
  nextTx.updatedAt = Date.now()
  dbPatch('', buildTxUpdate(id, oldTx, nextTx))
}

function removeTx(id, oldTx) {
  dbPatch('', buildTxUpdate(id, oldTx, null))
}
