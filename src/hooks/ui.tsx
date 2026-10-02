import { createContext, useContext } from 'react'
import type { Tx, TxType, WithId } from '@/lib/types'

export interface TxSheetRequest {
  type?: TxType
  editing?: WithId<Tx> | null
}

interface Ui {
  /** Month shown on Home/History/Stats (YYYY-MM), shared so tabs stay in sync. */
  month: string
  setMonth: (m: string) => void
  openTx: (req?: TxSheetRequest) => void
}

export const UiContext = createContext<Ui | null>(null)

export function useUi(): Ui {
  const v = useContext(UiContext)
  if (!v) throw new Error('useUi outside Layout')
  return v
}
