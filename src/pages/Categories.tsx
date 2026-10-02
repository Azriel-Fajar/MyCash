import { Archive, ArchiveRestore, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ColorSwatches, Field, IconGrid, Row, TextInput } from '@/components/FormBits'
import { IconBubble } from '@/components/IconBubble'
import { PageHeader } from '@/components/PageHeader'
import { Segmented } from '@/components/Segmented'
import { Sheet } from '@/components/Sheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useData } from '@/hooks/data'
import { useI18n } from '@/i18n'
import { saveCategory, setArchived } from '@/lib/db'
import type { Category, CategoryType, WithId } from '@/lib/types'

interface Target {
  category: WithId<Category> | null
  parent: WithId<Category> | null
}

export default function Categories() {
  const { t } = useI18n()
  const { categories, catName } = useData()
  const [type, setType] = useState<CategoryType>('expense')
  const [showArchived, setShowArchived] = useState(false)
  const [sheet, setSheet] = useState<{ open: boolean; nonce: number } & Target>({ open: false, nonce: 0, category: null, parent: null })
  const open = (target: Target) => setSheet((s) => ({ open: true, nonce: s.nonce + 1, ...target }))

  const visible = (c: Category) => showArchived || !c.archived
  const roots = categories.filter((c) => c.type === type && !c.parentId && visible(c))
  const kidsOf = (id: string) => categories.filter((c) => c.parentId === id && visible(c))

  return (
    <>
      <PageHeader
        title={t('more.categories')}
        back
        action={
          <Button size="icon" className="size-10 rounded-full" onClick={() => open({ category: null, parent: null })} aria-label={t('categories.new')}>
            <Plus />
          </Button>
        }
      />
      <div className="space-y-4 px-5">
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: 'expense', label: t('type.expense') },
            { value: 'income', label: t('type.income') },
          ]}
        />
        <ul className="space-y-3">
          {roots.map((root) => (
            <li key={root.id} className="space-y-1.5">
              <Row
                onClick={() => open({ category: root, parent: null })}
                muted={root.archived}
                leading={<IconBubble icon={root.icon} />}
                title={catName(root)}
                trailing={<span className="size-3 shrink-0 rounded-full" style={{ background: root.color }} aria-hidden />}
              />
              <ul className="space-y-1.5 pl-6">
                {kidsOf(root.id).map((c) => (
                  <li key={c.id}>
                    <Row
                      onClick={() => open({ category: c, parent: root })}
                      muted={c.archived || root.archived}
                      leading={<IconBubble icon={c.icon} size="sm" />}
                      title={catName(c)}
                    />
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => open({ category: null, parent: root })}
                    className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-card"
                  >
                    <Plus className="size-4" /> {t('categories.addSub')}
                  </button>
                </li>
              </ul>
            </li>
          ))}
        </ul>
        {categories.some((c) => c.archived) && (
          <label className="flex items-center justify-between rounded-2xl bg-card p-3 text-sm">
            {t('common.showArchived')}
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
          </label>
        )}
      </div>
      <CategorySheet
        key={sheet.nonce}
        open={sheet.open}
        onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))}
        category={sheet.category}
        parent={sheet.parent}
        type={type}
        nextOrder={categories.length}
      />
    </>
  )
}

function CategorySheet({
  open,
  onOpenChange,
  category,
  parent,
  type,
  nextOrder,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  type: CategoryType
  nextOrder: number
} & Target) {
  const { t } = useI18n()
  const { catName } = useData()
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? parent?.icon ?? 'circle-ellipsis')
  const [color, setColor] = useState(category?.color ?? parent?.color ?? '#E07338')
  // Seeded categories fall back to their translated name when the field is empty.
  const canSave = Boolean(name.trim() || category?.key)

  const save = async () => {
    if (!canSave) return
    try {
      await saveCategory(category?.id ?? null, {
        type: category?.type ?? parent?.type ?? type,
        parentId: category ? category.parentId : (parent?.id ?? null),
        key: category?.key ?? null,
        name: name.trim() || null,
        icon,
        color,
        order: category?.order ?? nextOrder,
        archived: category?.archived ?? false,
      })
      toast.success(t('common.saved'))
      onOpenChange(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const toggleArchive = async () => {
    if (!category) return
    await setArchived('categories', category.id, !category.archived)
    onOpenChange(false)
  }

  const title = category ? catName(category) : t('categories.new')
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={parent ? `${t('categories.parent')}: ${catName(parent)}` : t('categories.noParent')}
      footer={
        <div className="flex gap-2">
          {category && (
            <Button variant="secondary" className="h-12 rounded-full" onClick={toggleArchive}>
              {category.archived ? <ArchiveRestore /> : <Archive />}
              {category.archived ? t('common.unarchive') : t('common.archive')}
            </Button>
          )}
          <Button className="h-12 flex-1 rounded-full text-base" disabled={!canSave} onClick={save}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <Field label={t('common.name')} htmlFor="c-name">
        <TextInput
          id="c-name"
          value={name}
          maxLength={40}
          placeholder={category?.key ? catName({ ...category, name: null }) : ''}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <IconGrid label={t('common.icon')} value={icon} onChange={setIcon} />
      <ColorSwatches label={t('common.color')} value={color} onChange={setColor} />
    </Sheet>
  )
}
