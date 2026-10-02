import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Row } from '@/components/FormBits'
import { PageHeader } from '@/components/PageHeader'
import { WalletSheet } from '@/components/WalletSheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useData } from '@/hooks/data'
import { useI18n } from '@/i18n'
import { isLight } from '@/lib/color'
import { iconFor } from '@/lib/icons'
import { formatIDR } from '@/lib/money'
import { WALLET_TYPE_ICON } from '@/lib/seed'
import type { Wallet, WithId } from '@/lib/types'

export default function Wallets() {
  const { t } = useI18n()
  const { wallets, settings } = useData()
  const [showArchived, setShowArchived] = useState(false)
  const [sheet, setSheet] = useState({ open: false, nonce: 0, wallet: null as WithId<Wallet> | null })
  const open = (wallet: WithId<Wallet> | null) => setSheet((s) => ({ open: true, nonce: s.nonce + 1, wallet }))
  const list = wallets.filter((w) => showArchived || !w.archived)

  return (
    <>
      <PageHeader
        title={t('more.wallets')}
        back
        action={
          <Button size="icon" className="size-10 rounded-full" onClick={() => open(null)} aria-label={t('wallets.new')}>
            <Plus />
          </Button>
        }
      />
      <div className="space-y-4 px-5">
        <ul className="space-y-2">
          {list.map((w) => {
            const Icon = iconFor(WALLET_TYPE_ICON[w.type])
            return (
              <li key={w.id}>
                <Row
                  onClick={() => open(w)}
                  muted={w.archived}
                  leading={
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${isLight(w.color) ? 'text-ink' : 'text-white'}`}
                      style={{ background: w.color }}
                    >
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                  }
                  title={w.name}
                  subtitle={[t(`wallets.type.${w.type}`), w.id === settings?.defaultWalletId ? t('wallets.default') : null, w.archived ? t('common.archived') : null]
                    .filter(Boolean)
                    .join(', ')}
                  trailing={<span className="num shrink-0 font-semibold">{formatIDR(w.balance)}</span>}
                />
              </li>
            )
          })}
        </ul>
        {wallets.some((w) => w.archived) && (
          <label className="flex items-center justify-between rounded-2xl bg-card p-3 text-sm">
            {t('common.showArchived')}
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
          </label>
        )}
      </div>
      <WalletSheet
        key={sheet.nonce}
        open={sheet.open}
        onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))}
        wallet={sheet.wallet}
      />
    </>
  )
}
