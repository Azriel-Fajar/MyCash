// Ledger.gs — mirror of src/lib/ledger.ts. Keep the two identical; tests/ledgerCases.ts runs
// the same cases against both. Pure functions only.

function txEffect_(tx) {
  var out = {}
  if (!tx) return out
  if (tx.type === 'expense') out[tx.walletId] = -tx.amount
  else if (tx.type === 'income') out[tx.walletId] = tx.amount
  else if (tx.type === 'transfer') {
    out[tx.walletId] = -tx.amount
    out[tx.toWalletId] = tx.amount
  }
  return out
}

/** Per-wallet balance change caused by replacing oldTx with newTx (null = none). */
function balanceDeltas(oldTx, newTx) {
  var before = txEffect_(oldTx)
  var after = txEffect_(newTx)
  var out = {}
  Object.keys(before)
    .concat(Object.keys(after))
    .forEach(function (w) {
      var d = (after[w] || 0) - (before[w] || 0)
      if (d !== 0) out[w] = d
    })
  return out
}

/** Multi-path PATCH body for the RTDB REST API: tx + atomic balance increments. */
function buildTxUpdate(id, oldTx, newTx) {
  var update = {}
  update['transactions/' + id] = newTx
  var deltas = balanceDeltas(oldTx, newTx)
  Object.keys(deltas).forEach(function (w) {
    update['wallets/' + w + '/balance'] = { '.sv': { increment: deltas[w] } }
  })
  return update
}

var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'

/** Firebase-style push id: 8 time chars + 12 random chars, sorts by creation time. */
function newPushId(now) {
  var t = now || Date.now()
  var id = ''
  for (var i = 0; i < 8; i++) {
    id = PUSH_CHARS.charAt(t % 64) + id
    t = Math.floor(t / 64)
  }
  for (var j = 0; j < 12; j++) id += PUSH_CHARS.charAt(Math.floor(Math.random() * 64))
  return id
}
