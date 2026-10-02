import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CategoryPicker } from '@/components/CategoryPicker'
import { Field, Row, TextInput } from '@/components/FormBits'
import { IconBubble } from '@/components/IconBubble'
import { PageHeader } from '@/components/PageHeader'
import { Segmented } from '@/components/Segmented'
import { Sheet } from '@/components/Sheet'
import { Button } from '@/components/ui/button'
import { useData } from '@/hooks/data'
import { useDbList } from '@/hooks/useDb'
import { useI18n } from '@/i18n'
import { removeAt, savePhrase } from '@/lib/db'
import { phraseKey } from '@/lib/phrase'
import type { CategoryType, Phrase, WithId } from '@/lib/types'

export default function Phrases() {
  const { t } = useI18n()
  const { catById, catLabel, catColor } = useData()
  const { items, loading } = useDbList<Phrase>('phrases')
  const [sheet, setSheet] = useState({ open: false, nonce: 0, phrase: null as WithId<Phrase> | null })
  const open = (phrase: WithId<Phrase> | null) => setSheet((s) => ({ open: true, nonce: s.nonce + 1, phrase }))
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id))

  return (
    <>
      <PageHeader
        title={t('phrases.title')}
        back
        action={
          <Button size="icon" className="size-10 rounded-full" onClick={() => open(null)} aria-label={t('phrases.new')}>
            <Plus />
          </Button>
        }
      />
      <div className="space-y-4 px-5">
        <p className="text-sm text-muted-foreground">{t('phrases.body')}</p>
        {!loading && items.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-muted-foreground">{t('phrases.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((p) => (
              <li key={p.id}>
                <Row
                  onClick={() => open(p)}
                  leading={<IconBubble icon={catById[p.categoryId]?.icon} color={catColor(p.categoryId)} size="sm" />}
                  title={<span className="num">“{p.id}”</span>}
                  subtitle={`${t(`type.${p.type}`)}: ${catLabel(p.categoryId)}`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <PhraseSheet key={sheet.nonce} open={sheet.open} phrase={sheet.phrase} onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))} />
    </>
  )
}

function PhraseSheet({ open, onOpenChange, phrase }: { open: boolean; onOpenChange: (o: boolean) => void; phrase: WithId<Phrase> | null }) {
  const { t } = useI18n()
  const { catById } = useData()
  const [text, setText] = useState(phrase?.id ?? '')
  const [type, setType] = useState<CategoryType>(phrase?.type ?? 'expense')
  const [categoryId, setCategoryId] = useState<string | null>(phrase?.categoryId ?? null)

  const save = async () => {
    if (!phraseKey(text)) return
    if (!categoryId) return toast.error(t('tx.needCategory'))
    try {
      await savePhrase(text, { type, categoryId }, phrase?.id)
      toast.success(t('common.saved'))
      onOpenChange(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const remove = async () => {
    if (!phrase) return
    await removeAt(`phrases/${phrase.id}`)
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={phrase ? `“${phrase.id}”` : t('phrases.new')}
      footer={
        <div className="flex gap-2">
          {phrase && (
            <Button variant="secondary" className="size-12 rounded-full text-destructive" aria-label={t('common.delete')} onClick={remove}>
              <Trash2 className="size-5" />
            </Button>
          )}
          <Button className="h-12 flex-1 rounded-full text-base" disabled={!phraseKey(text)} onClick={save}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <Field label={t('phrases.phrase')} htmlFor="p-text">
        <TextInput id="p-text" value={text} maxLength={40} placeholder="parkir" onChange={(e) => setText(e.target.value)} />
      </Field>
      <Segmented
        value={type}
        onChange={(v) => {
          setType(v)
          if (categoryId && catById[categoryId]?.type !== v) setCategoryId(null)
        }}
        options={[
          { value: 'expense', label: t('type.expense') },
          { value: 'income', label: t('type.income') },
        ]}
      />
      <CategoryPicker type={type} value={categoryId} onChange={setCategoryId} />
    </Sheet>
  )
}
