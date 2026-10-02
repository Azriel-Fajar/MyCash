import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useI18n } from '@/i18n'

export function PageHeader({ title, back, action }: { title: string; back?: boolean; action?: ReactNode }) {
  const navigate = useNavigate()
  const { t } = useI18n()
  return (
    <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
      {back && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('tx.back')}
          className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-secondary"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      <h1 className="num flex-1 text-xl font-semibold">{title}</h1>
      {action}
    </header>
  )
}
