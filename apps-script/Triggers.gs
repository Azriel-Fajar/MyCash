// Triggers.gs — scheduled jobs and one-time setup functions (run these from the editor).

/** Daily 06:00 WIB: create recurring transactions that are due (catches up missed days). */
function dailyRecurring() {
  var today = todayWIB()
  var month = monthKey(today)
  var items = dbGet('recurring') || {}
  var st = null
  Object.keys(items).forEach(function (rid) {
    var r = items[rid]
    if (!isRecurringDue(r, today)) return
    st = st || loadState()
    var day = effectiveDay(r.dayOfMonth, month)
    var id = newPushId()
    var tx = newTx({
      type: r.type, amount: r.amount, categoryId: r.categoryId, walletId: r.walletId,
      date: month + '-' + (day < 10 ? '0' : '') + day, note: r.note, source: 'recurring', recurringId: rid,
    })
    var update = buildTxUpdate(id, null, tx)
    update['recurring/' + rid + '/lastRunMonth'] = month
    dbPatch('', update)
    send(txSummary(st, tx, '🔁 Otomatis:'), [[btn('↩️ Batal', 'u:' + id)]])
  })
}

/** 1st of the month 08:00 WIB: last month's recap vs the month before. */
function monthlyReport() {
  var last = addMonths(monthKey(todayWIB()), -1)
  var prev = addMonths(last, -1)
  var st = loadState()
  var txs = toList_(dbGet('transactions', byChild('month', { startAt: prev, endAt: last })))
  var s = summarize(txs.filter(function (t) { return t.month === last }), rootOfFn(st))
  var p = summarize(txs.filter(function (t) { return t.month === prev }), rootOfFn(st))

  var lines = ['📅 <b>Ringkasan ' + monthNameId(last) + '</b>', 'Masuk:  ' + formatIDR(s.income), 'Keluar: ' + formatIDR(s.expense), 'Selisih: <b>' + formatIDR(s.net, true) + '</b>']
  if (p.expense > 0) {
    var change = Math.round(((s.expense - p.expense) / p.expense) * 100)
    lines.push('Pengeluaran ' + (change > 0 ? 'naik ' : change < 0 ? 'turun ' : 'sama dengan ') + (change ? Math.abs(change) + '% dari ' : '') + monthNameId(prev).split(' ')[0])
  }
  if (s.top.length) {
    lines.push('', 'Pengeluaran terbesar:')
    s.top.slice(0, 5).forEach(function (t) {
      lines.push('• ' + escapeHtml(catName(st, t.rootId)) + ' ' + formatIDR(t.total) + ' (' + Math.round((t.total / s.expense) * 100) + '%)')
    })
  }
  lines.push('', balanceReport(st))
  send(lines.join('\n'))
}

/** Run once (and after changing schedules). */
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['dailyRecurring', 'monthlyReport'].indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t)
  })
  ScriptApp.newTrigger('dailyRecurring').timeBased().everyDays(1).atHour(6).inTimezone('Asia/Jakarta').create()
  ScriptApp.newTrigger('monthlyReport').timeBased().onMonthDay(1).atHour(8).inTimezone('Asia/Jakarta').create()
  console.log('Triggers dibuat: dailyRecurring 06:00, monthlyReport tgl 1 08:00 (WIB)')
}

/** Run once after each new deployment URL. */
function setWebhook() {
  var res = tg('setWebhook', {
    url: WEBAPP_URL + '?key=' + encodeURIComponent(WEBHOOK_KEY),
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  })
  tg('setMyCommands', { commands: BOT_COMMANDS })
  console.log(JSON.stringify(res))
  webhookInfo()
}

function webhookInfo() {
  console.log(JSON.stringify(tg('getWebhookInfo', {}), null, 2))
}

/** Proves database access: write, read back, and a server-side increment. */
function testDb() {
  dbPut('meta/ping', { at: Date.now() })
  var ping = dbGet('meta/ping')
  dbPatch('', { 'meta/counter': { '.sv': { increment: 1 } } })
  var counter = dbGet('meta/counter')
  console.log('Database OK. ping=' + JSON.stringify(ping) + ' counter=' + counter)
}
