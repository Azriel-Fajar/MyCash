// Config.gs — fill in the first block, then follow apps-script/README.md.

// From @BotFather.
const BOT_TOKEN = 'PASTE_BOT_TOKEN'
// Any long random string; it is appended to the webhook URL so only Telegram can call doPost.
const WEBHOOK_KEY = 'PASTE_RANDOM_SECRET'
// Your Telegram chat id. Send /start to the bot once the webhook is set; it replies with it.
const CHAT_ID = 'PASTE_CHAT_ID'
// Web app URL from Deploy → Manage deployments (ends in /exec).
const WEBAPP_URL = 'PASTE_WEBAPP_URL'
// Realtime Database URL: Firebase console → Realtime Database, shown above the data
// (same value as VITE_FIREBASE_DATABASE_URL in .env.local).
const DB_URL = 'PASTE_DATABASE_URL'
// Leave empty to use your Google login (recommended). Fallback: a legacy database secret from
// Firebase console → Project settings → Service accounts → Database secrets.
const DB_SECRET = ''

// ---------------------------------------------------------------------------------------------
// Base phrases: word(s) in a message → category key. Phrases the bot learns are stored in the
// database (/phrases), can be edited in the app under "Frasa bot", and win over this list.
// Keys: see src/lib/seed.ts (food, food.meal, food.coffee, transport.fuel, salary, …).
const PHRASES = {
  // Makanan
  makan: 'food.meal', 'makan siang': 'food.meal', 'makan malam': 'food.meal', sarapan: 'food.meal',
  lunch: 'food.meal', dinner: 'food.meal', breakfast: 'food.meal', nasi: 'food.meal', warteg: 'food.meal',
  padang: 'food.meal', bakso: 'food.meal', mie: 'food.meal', meal: 'food.meal',
  kopi: 'food.coffee', coffee: 'food.coffee', teh: 'food.coffee', 'es teh': 'food.coffee', boba: 'food.coffee',
  minum: 'food.coffee', starbucks: 'food.coffee', 'air mineral': 'food.coffee',
  'belanja dapur': 'food.groceries', sayur: 'food.groceries', sembako: 'food.groceries', pasar: 'food.groceries',
  groceries: 'food.groceries', supermarket: 'food.groceries',
  jajan: 'food.snack', snack: 'food.snack', cemilan: 'food.snack', camilan: 'food.snack', gorengan: 'food.snack',
  martabak: 'food.snack',
  // Transportasi
  bensin: 'transport.fuel', pertalite: 'transport.fuel', pertamax: 'transport.fuel', bbm: 'transport.fuel', fuel: 'transport.fuel',
  parkir: 'transport.parking', parking: 'transport.parking',
  gojek: 'transport.ride', grab: 'transport.ride', ojol: 'transport.ride', ojek: 'transport.ride', maxim: 'transport.ride',
  gocar: 'transport.ride', grabcar: 'transport.ride',
  krl: 'transport.public', mrt: 'transport.public', lrt: 'transport.public', transjakarta: 'transport.public',
  busway: 'transport.public', kereta: 'transport.public', bus: 'transport.public', commuter: 'transport.public',
  servis: 'transport.service', service: 'transport.service', bengkel: 'transport.service', 'ganti oli': 'transport.service',
  // Tagihan
  listrik: 'bills.electricity', pln: 'bills.electricity', 'token listrik': 'bills.electricity', electricity: 'bills.electricity',
  pdam: 'bills.water', 'tagihan air': 'bills.water',
  wifi: 'bills.internet', internet: 'bills.internet', indihome: 'bills.internet', biznet: 'bills.internet',
  pulsa: 'bills.phone', kuota: 'bills.phone', 'paket data': 'bills.phone',
  kos: 'bills.rent', kost: 'bills.rent', sewa: 'bills.rent', kontrakan: 'bills.rent', rent: 'bills.rent',
  // Belanja
  belanja: 'shopping', shopping: 'shopping', shopee: 'shopping', tokopedia: 'shopping', tokped: 'shopping', lazada: 'shopping',
  baju: 'shopping.clothes', celana: 'shopping.clothes', sepatu: 'shopping.clothes', kaos: 'shopping.clothes',
  jaket: 'shopping.clothes', clothes: 'shopping.clothes',
  elektronik: 'shopping.electronics', charger: 'shopping.electronics', headset: 'shopping.electronics',
  sabun: 'shopping.household', deterjen: 'shopping.household', perabot: 'shopping.household',
  // Kesehatan
  obat: 'health.medicine', apotek: 'health.medicine', vitamin: 'health.medicine', medicine: 'health.medicine',
  dokter: 'health.doctor', klinik: 'health.doctor', 'rumah sakit': 'health.doctor', doctor: 'health.doctor',
  // Hiburan
  netflix: 'entertainment.subscription', spotify: 'entertainment.subscription', 'youtube premium': 'entertainment.subscription',
  langganan: 'entertainment.subscription', subscription: 'entertainment.subscription', disney: 'entertainment.subscription',
  nongkrong: 'entertainment.hangout', hangout: 'entertainment.hangout', nonton: 'entertainment.hangout',
  bioskop: 'entertainment.hangout', cinema: 'entertainment.hangout',
  game: 'entertainment.game', 'topup game': 'entertainment.game', steam: 'entertainment.game',
  // Pendidikan
  buku: 'education', kursus: 'education', kuliah: 'education', ukt: 'education', spp: 'education', course: 'education',
  // Pemasukan
  gaji: 'salary', gajian: 'salary', salary: 'salary',
  freelance: 'freelance', proyek: 'freelance', project: 'freelance', klien: 'freelance', client: 'freelance',
  bonus: 'bonus', thr: 'bonus', insentif: 'bonus',
  hadiah: 'gift', kado: 'gift', angpao: 'gift', gift: 'gift',
  jual: 'income.other', refund: 'income.other', cashback: 'income.other',
}

// Extra spellings → wallet name exactly as it appears in the app. Wallet names already match.
const WALLET_ALIASES = {
  tunai: 'Cash',
  'go pay': 'GoPay',
  gopey: 'GoPay',
  spay: 'ShopeePay',
  'shopee pay': 'ShopeePay',
  livin: 'Mandiri',
  brimo: 'BRI',
  mbca: 'BCA',
}

// Indonesian names of seeded categories (keep in sync with src/i18n/id.ts — a test checks).
const CAT_NAMES = {
  food: 'Makanan', 'food.meal': 'Makan', 'food.coffee': 'Kopi & minuman', 'food.groceries': 'Belanja dapur',
  'food.snack': 'Jajan',
  transport: 'Transportasi', 'transport.fuel': 'Bensin', 'transport.parking': 'Parkir', 'transport.ride': 'Ojol',
  'transport.public': 'Transportasi umum', 'transport.service': 'Servis kendaraan',
  bills: 'Tagihan', 'bills.electricity': 'Listrik', 'bills.water': 'Air', 'bills.internet': 'Internet',
  'bills.phone': 'Pulsa & data', 'bills.rent': 'Sewa / kos',
  shopping: 'Belanja', 'shopping.clothes': 'Pakaian', 'shopping.electronics': 'Elektronik', 'shopping.household': 'Rumah tangga',
  health: 'Kesehatan', 'health.medicine': 'Obat', 'health.doctor': 'Dokter',
  entertainment: 'Hiburan', 'entertainment.subscription': 'Langganan', 'entertainment.hangout': 'Nongkrong',
  'entertainment.game': 'Game',
  education: 'Pendidikan', 'expense.other': 'Lainnya',
  salary: 'Gaji', freelance: 'Freelance', bonus: 'Bonus', gift: 'Hadiah', 'income.other': 'Lainnya',
}
