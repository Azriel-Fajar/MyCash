import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthGate } from '@/components/AuthGate'
import { Layout } from '@/components/Layout'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { Toaster } from '@/components/ui/sonner'
import { I18nProvider } from '@/i18n'
import History from '@/pages/History'
import Home from '@/pages/Home'
import More from '@/pages/More'

// Charts and management screens load on demand to keep the first paint light.
const Stats = lazy(() => import('@/pages/Stats'))
const Goals = lazy(() => import('@/pages/Goals'))
const Wallets = lazy(() => import('@/pages/Wallets'))
const Categories = lazy(() => import('@/pages/Categories'))
const Recurring = lazy(() => import('@/pages/Recurring'))
const Phrases = lazy(() => import('@/pages/Phrases'))
const Settings = lazy(() => import('@/pages/Settings'))

export default function App() {
  return (
    <I18nProvider>
      <AuthGate>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="history" element={<History />} />
              <Route path="stats" element={<Stats />} />
              <Route path="more" element={<More />} />
              <Route path="more/goals" element={<Goals />} />
              <Route path="more/wallets" element={<Wallets />} />
              <Route path="more/categories" element={<Categories />} />
              <Route path="more/recurring" element={<Recurring />} />
              <Route path="more/phrases" element={<Phrases />} />
              <Route path="more/settings" element={<Settings />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthGate>
      <Toaster position="top-center" />
      <UpdatePrompt />
    </I18nProvider>
  )
}
