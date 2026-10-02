// Commands.gs — /today /week /month /balance /goals /help

var HELP = [
  '<b>MyCash</b> — catat langsung lewat chat:',
  '• <code>kopi 25rb gopay</code> → pengeluaran',
  '• <code>gaji 8jt bca</code> atau <code>+500rb jual barang</code> → pemasukan',
  '• <code>tf 100rb bca ke gopay</code> → transfer antar dompet',
  '• <code>kemarin makan 30rb</code>, <code>bensin 50rb 28/9</code> → tanggal lain',
  '',
  'Jumlah: 25rb, 25k, 25.000, 1,5jt. Tanpa dompet → dompet utama.',
  'Kata baru? Bot menanyakan kategorinya lalu bisa mengingatnya.',
  '',
  '/today · /week · /month — ringkasan',
  '/balance — saldo semua dompet',
  '/goals — progres target tabungan',
].join('\n')

var BOT_COMMANDS = [
  { command: 'today', description: 'Ringkasan hari ini' },
  { command: 'week', description: 'Ringkasan 7 hari terakhir' },
  { command: 'month', description: 'Ringkasan bulan ini' },
  { command: 'balance', description: 'Saldo semua dompet' },
  { command: 'goals', description: 'Progres target tabungan' },
  { command: 'help', description: 'Cara pakai' },
]

function handleCommand(text) {
  var cmd = text.split(/\s+/)[0].split('@')[0].toLowerCase()
  var today = todayWIB()
  if (cmd === '/start' || cmd === '/help') return send(HELP)
  var st = loadState()
  if (cmd === '/today') return send(periodReport(st, 'Hari ini, ' + dateLabelId(today), txsByDate(today, today)))
  if (cmd === '/week') {
    var from = addDays(today, -6)
    return send(periodReport(st, dateLabelId(from) + ' – ' + dateLabelId(today), txsByDate(from, today)))
  }
  if (cmd === '/month') {
    var m = monthKey(today)
    return send(periodReport(st, monthNameId(m), toList_(dbGet('transactions', byChild('month', { equalTo: m })))))
  }
  if (cmd === '/balance') return send(balanceReport(st))
  if (cmd === '/goals') return send(goalsReport(st))
  return send('Perintah tidak dikenal. Lihat /help')
}

function txsByDate(from, to) {
  return toList_(dbGet('transactions', byChild('date', { startAt: from, endAt: to })))
}

function periodReport(st, title, txs) {
  if (!txs.length) return '📭 <b>' + escapeHtml(title) + '</b>\nBelum ada transaksi.'
  var s = summarize(txs, rootOfFn(st))
  var lines = [
    '📊 <b>' + escapeHtml(title) + '</b>',
    'Masuk:  ' + formatIDR(s.income),
    'Keluar: ' + formatIDR(s.expense),
    'Selisih: <b>' + formatIDR(s.net, true) + '</b>',
  ]
  if (s.top.length) {
    lines.push('', 'Pengeluaran terbesar:')
    s.top.slice(0, 5).forEach(function (t) {
      lines.push('• ' + escapeHtml(catName(st, t.rootId)) + ' ' + formatIDR(t.total) + ' (' + Math.round((t.total / s.expense) * 100) + '%)')
    })
  }
  lines.push('', s.count + ' transaksi')
  return lines.join('\n')
}

function balanceReport(st) {
  var total = 0
  var lines = ['👛 <b>Saldo</b>']
  st.walletList.forEach(function (w) {
    total += w.balance
    lines.push(escapeHtml(w.name) + ': ' + formatIDR(w.balance))
  })
  lines.push('', 'Total: <b>' + formatIDR(total) + '</b>')
  return lines.join('\n')
}

function goalsReport(st) {
  var goals = toList_(dbGet('goals')).filter(function (g) {
    return !g.done
  })
  if (!goals.length) return '🎯 Belum ada target tabungan. Buat di aplikasi: Lainnya → Target tabungan.'
  var lines = ['🎯 <b>Target tabungan</b>']
  goals.forEach(function (g) {
    var saved = Math.max(0, (st.wallets[g.walletId] && st.wallets[g.walletId].balance) || 0)
    var pct = g.target > 0 ? Math.min(1, saved / g.target) : 1
    lines.push('', '<b>' + escapeHtml(g.name) + '</b> ' + Math.round(pct * 100) + '%')
    lines.push(progressBar(pct, 12))
    lines.push(formatIDR(saved) + ' / ' + formatIDR(g.target) + (g.deadline ? ' · ' + dateLabelId(g.deadline) + ' ' + g.deadline.slice(0, 4) : ''))
  })
  return lines.join('\n')
}
