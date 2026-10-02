import { useData } from '@/hooks/data'
import { useI18n } from '@/i18n'
import { formatIDR } from '@/lib/money'
import type { CategoryGroup } from '@/lib/stats'
import { IconBubble } from './IconBubble'

/** Icon, name, total, count and a share bar in the category's color. */
export function CategoryShare({ group }: { group: CategoryGroup }) {
  const { t } = useI18n()
  const { catById, catName, catColor } = useData()
  const root = catById[group.rootId]
  return (
    <>
      <IconBubble icon={root?.icon} color={catColor(group.rootId)} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium">{catName(root)}</span>
          <span className="num shrink-0 font-semibold">{formatIDR(group.total)}</span>
        </span>
        <span className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="shrink-0">{t('home.txCount', { n: group.count })}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <span
              className="block h-full rounded-full"
              style={{ width: `${Math.max(2, group.share * 100)}%`, background: root?.color }}
            />
          </span>
          <span className="num w-10 shrink-0 text-right">{Math.round(group.share * 100)}%</span>
        </span>
      </span>
    </>
  )
}
