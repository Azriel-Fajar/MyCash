import type { Category, CategoryType, WalletType } from './types'

interface SeedNode {
  key: string
  icon: string
  color?: string
  children?: SeedNode[]
}

interface SeedRoot extends SeedNode {
  type: CategoryType
  color: string
}

// Keys are permanent: display names come from i18n `cat.<key>`, and the bot's PHRASES
// (apps-script/Config.gs) reference them.
export const CATEGORY_TREE: SeedRoot[] = [
  {
    key: 'food', type: 'expense', icon: 'utensils', color: '#E07338',
    children: [
      { key: 'food.meal', icon: 'soup' },
      { key: 'food.coffee', icon: 'coffee' },
      { key: 'food.groceries', icon: 'shopping-basket' },
      { key: 'food.snack', icon: 'cookie' },
    ],
  },
  {
    key: 'transport', type: 'expense', icon: 'car', color: '#4C7EF3',
    children: [
      { key: 'transport.fuel', icon: 'fuel' },
      { key: 'transport.parking', icon: 'square-parking' },
      { key: 'transport.ride', icon: 'bike' },
      { key: 'transport.public', icon: 'bus' },
      { key: 'transport.service', icon: 'wrench' },
    ],
  },
  {
    key: 'bills', type: 'expense', icon: 'receipt', color: '#8B5CF6',
    children: [
      { key: 'bills.electricity', icon: 'zap' },
      { key: 'bills.water', icon: 'droplet' },
      { key: 'bills.internet', icon: 'wifi' },
      { key: 'bills.phone', icon: 'smartphone' },
      { key: 'bills.rent', icon: 'house' },
    ],
  },
  {
    key: 'shopping', type: 'expense', icon: 'shopping-bag', color: '#E0559B',
    children: [
      { key: 'shopping.clothes', icon: 'shirt' },
      { key: 'shopping.electronics', icon: 'laptop' },
      { key: 'shopping.household', icon: 'sofa' },
    ],
  },
  {
    key: 'health', type: 'expense', icon: 'heart-pulse', color: '#D9534F',
    children: [
      { key: 'health.medicine', icon: 'pill' },
      { key: 'health.doctor', icon: 'stethoscope' },
    ],
  },
  {
    key: 'entertainment', type: 'expense', icon: 'popcorn', color: '#E5A00D',
    children: [
      { key: 'entertainment.subscription', icon: 'tv' },
      { key: 'entertainment.hangout', icon: 'party-popper' },
      { key: 'entertainment.game', icon: 'gamepad' },
    ],
  },
  { key: 'education', type: 'expense', icon: 'graduation-cap', color: '#1D9BD1' },
  { key: 'expense.other', type: 'expense', icon: 'circle-ellipsis', color: '#7A7F8A' },
  { key: 'salary', type: 'income', icon: 'briefcase', color: '#2F9E6E' },
  { key: 'freelance', type: 'income', icon: 'code', color: '#14A39A' },
  { key: 'bonus', type: 'income', icon: 'sparkles', color: '#7CB518' },
  { key: 'gift', type: 'income', icon: 'gift', color: '#E0559B' },
  { key: 'income.other', type: 'income', icon: 'circle-ellipsis', color: '#7A7F8A' },
]

export function buildCategorySeed(newId: () => string): Record<string, Category> {
  const out: Record<string, Category> = {}
  CATEGORY_TREE.forEach((root, i) => {
    const rootId = newId()
    out[rootId] = { type: root.type, parentId: null, key: root.key, icon: root.icon, color: root.color, order: i, archived: false }
    root.children?.forEach((child, j) => {
      out[newId()] = {
        type: root.type, parentId: rootId, key: child.key, icon: child.icon,
        color: child.color ?? root.color, order: j, archived: false,
      }
    })
  })
  return out
}

export const WALLET_COLORS = ['#DDF35A', '#E07338', '#1F2630', '#F9E0D2', '#C9C6F5', '#BDEBD4', '#BFDDF7']

export interface WalletPreset {
  name: string
  type: WalletType
  color: string
}

export const WALLET_PRESETS: WalletPreset[] = [
  { name: 'Cash', type: 'cash', color: '#DDF35A' },
  { name: 'BCA', type: 'bank', color: '#1F2630' },
  { name: 'Mandiri', type: 'bank', color: '#1F2630' },
  { name: 'BRI', type: 'bank', color: '#1F2630' },
  { name: 'BNI', type: 'bank', color: '#1F2630' },
  { name: 'GoPay', type: 'ewallet', color: '#E07338' },
  { name: 'OVO', type: 'ewallet', color: '#C9C6F5' },
  { name: 'DANA', type: 'ewallet', color: '#BFDDF7' },
  { name: 'ShopeePay', type: 'ewallet', color: '#E07338' },
]

export const WALLET_TYPE_ICON: Record<WalletType, string> = {
  cash: 'banknote',
  bank: 'landmark',
  ewallet: 'smartphone',
  savings: 'piggy-bank',
}
