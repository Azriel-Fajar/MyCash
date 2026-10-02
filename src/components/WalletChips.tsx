import { useData } from '@/hooks/data'
import { Chip } from './CategoryPicker'

interface Props {
  label: string
  value: string | null
  onChange: (id: string) => void
  /** Wallet id to hide (the other side of a transfer). */
  exclude?: string | null
}

export function WalletChips({ label, value, onChange, exclude }: Props) {
  const { wallets } = useData()
  const list = wallets.filter((w) => (!w.archived || w.id === value) && w.id !== exclude)
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm text-muted-foreground">{label}</legend>
      <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {list.map((w) => (
          <Chip key={w.id} active={value === w.id} onClick={() => onChange(w.id)} dot={w.color}>
            {w.name}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}
