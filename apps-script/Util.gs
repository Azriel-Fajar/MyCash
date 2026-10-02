// Util.gs — formatting and date helpers (WIB, UTC+7). Pure functions only.

var MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
var MONTHS_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function formatIDR(n, signed) {
  var sign = n < 0 ? '-' : signed && n > 0 ? '+' : ''
  return sign + 'Rp ' + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function todayWIB(now) {
  return new Date((now || new Date()).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10)
}

function monthKey(date) {
  return date.slice(0, 7)
}

function addMonths(month, n) {
  var p = month.split('-').map(Number)
  var total = p[0] * 12 + (p[1] - 1) + n
  var m = (total % 12) + 1
  return Math.floor(total / 12) + '-' + (m < 10 ? '0' : '') + m
}

function addDays(date, n) {
  var p = date.split('-').map(Number)
  return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10)
}

function daysInMonth(month) {
  var p = month.split('-').map(Number)
  return new Date(Date.UTC(p[0], p[1], 0)).getUTCDate()
}

function effectiveDay(dayOfMonth, month) {
  return Math.min(dayOfMonth, daysInMonth(month))
}

/** Active, not yet run this month, and its (clamped) day has arrived — catches up missed days. */
function isRecurringDue(r, today) {
  var month = monthKey(today)
  return Boolean(r.active) && r.lastRunMonth !== month && Number(today.slice(8, 10)) >= effectiveDay(r.dayOfMonth, month)
}

function monthNameId(month) {
  return MONTHS_ID[Number(month.slice(5, 7)) - 1] + ' ' + month.slice(0, 4)
}

function dateLabelId(date) {
  return Number(date.slice(8, 10)) + ' ' + MONTHS_SHORT_ID[Number(date.slice(5, 7)) - 1]
}

/** Income/expense/net and expense totals per root category, largest first. */
function summarize(txs, rootOf) {
  var income = 0
  var expense = 0
  var roots = {}
  txs.forEach(function (t) {
    if (t.type === 'income') income += t.amount
    if (t.type === 'expense') {
      expense += t.amount
      var r = rootOf(t.categoryId) || t.categoryId
      roots[r] = (roots[r] || 0) + t.amount
    }
  })
  var top = Object.keys(roots)
    .map(function (id) {
      return { rootId: id, total: roots[id] }
    })
    .sort(function (a, b) {
      return b.total - a.total
    })
  return { income: income, expense: expense, net: income - expense, count: txs.length, top: top }
}

function progressBar(pct, width) {
  var filled = Math.round(Math.max(0, Math.min(1, pct)) * width)
  return new Array(filled + 1).join('▓') + new Array(width - filled + 1).join('░')
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
