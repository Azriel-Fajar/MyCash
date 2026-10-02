import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { Copy, LogOut } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataProvider, useData } from '@/hooks/data'
import { useI18n } from '@/i18n'
import { auth } from '@/lib/firebase'
import Login from '@/pages/Login'
import Onboarding from '@/pages/Onboarding'
import { Splash } from './Splash'

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(auth, setUser), [])

  if (user === undefined) return <Splash />
  if (!user) return <Login />
  return (
    <DataProvider enabled>
      <Gate uid={user.uid}>{children}</Gate>
    </DataProvider>
  )
}

function Gate({ uid, children }: { uid: string; children: ReactNode }) {
  const { loading, error, settings } = useData()
  if (error) return <NotAuthorized uid={uid} detail={error.message} />
  if (loading) return <Splash />
  if (!settings) return <Onboarding />
  return children
}

function NotAuthorized({ uid, detail }: { uid: string; detail: string }) {
  const { t } = useI18n()
  const copy = async () => {
    await navigator.clipboard.writeText(uid)
    toast.success(t('denied.copied'))
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="num text-2xl font-semibold">{t('denied.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('denied.body')}</p>
      </div>
      <code className="num block rounded-2xl bg-card p-4 text-sm break-all select-all">{uid}</code>
      <p className="text-xs text-muted-foreground">{detail}</p>
      <div className="flex gap-2">
        <Button className="h-11 flex-1 rounded-full" onClick={copy}>
          <Copy /> {t('denied.copy')}
        </Button>
        <Button variant="secondary" className="h-11 rounded-full" onClick={() => signOut(auth)}>
          <LogOut /> {t('signout')}
        </Button>
      </div>
    </main>
  )
}
