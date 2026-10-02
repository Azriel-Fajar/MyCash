import { useData } from '@/hooks/data'
import { useI18n } from '@/i18n'
import type { CategoryType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { IconBubble } from './IconBubble'

interface Props {
  type: CategoryType
  value: string | null
  onChange: (id: string) => void
}

/** Root categories as an icon grid; picking one with children reveals subcategory chips. */
export function CategoryPicker({ type, value, onChange }: Props) {
  const { t } = useI18n()
  const { categories, catName, rootOf, catColor } = useData()
  const visible = (c: { archived: boolean; id: string }) => !c.archived || c.id === value
  const roots = categories.filter((c) => !c.parentId && c.type === type && visible(c))
  const rootId = rootOf(value)
  const children = categories.filter((c) => c.parentId === rootId && rootId && visible(c))

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm text-muted-foreground">{t('tx.category')}</legend>
      <div className="mt-2 grid grid-cols-4 gap-x-2 gap-y-3">
        {roots.map((c) => {
          const active = c.id === rootId
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(c.id)}
              className="flex flex-col items-center gap-1.5 rounded-xl p-1 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <IconBubble
                icon={c.icon}
                color={active ? undefined : catColor(c.id)}
                className={cn('size-12', active && 'bg-primary text-primary-foreground ring-4 ring-primary/25')}
              />
              <span className={cn('line-clamp-2 text-center text-xs leading-tight', active ? 'font-semibold' : 'text-muted-foreground')}>
                {catName(c)}
              </span>
            </button>
          )
        })}
      </div>
      {children.length > 0 && rootId && (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Chip active={value === rootId} onClick={() => onChange(rootId)}>
            {t('home.parentOnly')}
          </Chip>
          {children.map((c) => (
            <Chip key={c.id} active={value === c.id} onClick={() => onChange(c.id)}>
              {catName(c)}
            </Chip>
          ))}
        </div>
      )}
    </fieldset>
  )
}

export function Chip({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  dot?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm whitespace-nowrap transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        active ? 'bg-ink text-ink-foreground dark:bg-primary dark:text-primary-foreground' : 'bg-card text-foreground',
      )}
    >
      {dot && (
        <span className={cn('size-2.5 rounded-full ring-1', active ? 'ring-white/60' : 'ring-black/10')} style={{ background: dot }} />
      )}
      {children}
    </button>
  )
}
