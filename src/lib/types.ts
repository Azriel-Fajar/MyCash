export type TxType = 'expense' | 'income' | 'transfer'
export type CategoryType = 'expense' | 'income'
export type WalletType = 'cash' | 'bank' | 'ewallet' | 'savings'
export type TxSource = 'app' | 'bot' | 'recurring'
export type Language = 'id' | 'en'

export type WithId<T> = T & { id: string }

/** Amounts are integer rupiah, always > 0. Direction comes from `type`. */
export interface Tx {
  type: TxType
  amount: number
  categoryId: string | null
  walletId: string
  /** Destination wallet, transfers only. */
  toWalletId?: string | null
  /** YYYY-MM-DD in WIB */
  date: string
  /** YYYY-MM, derived from date, indexed for month queries */
  month: string
  note: string
  source: TxSource
  recurringId?: string | null
  createdAt: number
  updatedAt: number
}

export interface Wallet {
  name: string
  type: WalletType
  color: string
  initialBalance: number
  balance: number
  order: number
  archived: boolean
}

export interface Category {
  type: CategoryType
  parentId: string | null
  /** Permanent key for seeded categories, e.g. 'food.coffee'. */
  key?: string | null
  /** User-set name; overrides the translated key. */
  name?: string | null
  icon: string
  color: string
  order: number
  archived: boolean
}

export interface Recurring {
  type: CategoryType
  amount: number
  categoryId: string
  walletId: string
  dayOfMonth: number
  note: string
  active: boolean
  lastRunMonth: string | null
}

export interface Goal {
  name: string
  target: number
  deadline: string | null
  walletId: string
  createdAt: number
  done: boolean
}

export interface Phrase {
  type: CategoryType
  categoryId: string
}

export interface Settings {
  language: Language
  defaultWalletId: string | null
}
