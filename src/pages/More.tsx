import { ChevronRight, Landmark, MessageSquareText, PiggyBank, Repeat, Settings, Tags, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { IconBubble } from '@/components/IconBubble'
import { PageHeader } from '@/components/PageHeader'
import { useI18n } from '@/i18n'
import type { DictKey } from '@/i18n/id'

const ITEMS: { to: string; label: DictKey; Icon: LucideIcon }[] = [
  { to: 'goals', label: 'more.goals', Icon: PiggyBank },
  { to: 'wallets', label: 'more.wallets', Icon: Landmark },
  { to: 'categories', label: 'more.categories', Icon: Tags },
  { to: 'recurring', label: 'more.recurring', Icon: Repeat },
  { to: 'phrases', label: 'more.phrases', Icon: MessageSquareText },
  { to: 'settings', label: 'more.settings', Icon: Settings },
]

export default function More() {
  const { t } = useI18n()
  return (
    <>
      <PageHeader title={t('more.title')} />
      <ul className="space-y-2 px-5">
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to}>
            <Link
              to={`/more/${to}`}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 font-medium focus-visible:outline-2 focus-visible:outline-ring"
            >
              <IconBubble Icon={Icon} />
              <span className="flex-1">{t(label)}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
