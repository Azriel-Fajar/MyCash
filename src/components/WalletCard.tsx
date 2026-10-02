import { isLight } from '@/lib/color'
import { formatIDR } from '@/lib/money'
import { WALLET_TYPE_ICON } from '@/lib/seed'
import type { Wallet } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'
import { iconFor } from '@/lib/icons'
import { Rings } from './Rings'

export function WalletCard({ wallet, isDefault, className }: { wallet: Wallet; isDefault?: boolean; className?: string }) {
  const { t } = useI18n()
  const light = isLight(wallet.color)
  const Icon = iconFor(WALLET_TYPE_ICON[wallet.type])
  return (
    <article
      className={cn(
        'relative flex aspect-[1.586] flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 shadow-xl shadow-black/15',
        light ? 'text-ink' : 'text-white',
        className,
      )}
      style={{ background: wallet.color }}
    >
      <Rings className={light ? 'text-ink/20' : 'text-white/15'} />
      <div className="flex items-start justify-between">
        <span className="text-sm opacity-75">{t(`wallets.type.${wallet.type}`)}</span>
        <span className={cn('grid size-9 place-items-center rounded-full', light ? 'bg-ink text-lime' : 'bg-white/15')}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className={cn('num truncate font-semibold tracking-tight', wallet.balance >= 1e10 ? 'text-xl' : 'text-2xl')}>
        {formatIDR(wallet.balance)}
      </p>
      <div className="flex items-end justify-between gap-2">
        <span className="num truncate text-base font-semibold">{wallet.name}</span>
        {isDefault && (
          <span className={cn('rounded-full px-2 py-0.5 text-xs', light ? 'bg-ink/10' : 'bg-white/15')}>{t('wallets.default')}</span>
        )}
      </div>
    </article>
  )
}
