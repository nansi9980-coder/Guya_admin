import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import AdminLayout from '@/components/layout/AdminLayout'
import LoginPage from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
import DevisPage from '@/pages/Devis'
import ContactPage from '@/pages/Contact'
import UtilisateursPage from '@/pages/Utilisateurs'
import ServicesPage from '@/pages/Services'
import RealisationsPage from '@/pages/Realisations'
import MediasPage from '@/pages/Medias'
import SiteContentPage from '@/pages/SiteContent'
import EmailTemplatesPage from '@/pages/EmailTemplates'
import LogsPage from '@/pages/Logs'
import ParametresPage from '@/pages/Parametres'
import RapportsPage from '@/pages/Rapports'
import StatsPage from '@/pages/Stats'

function PrivateRoute() {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore()

  useEffect(() => {
    if (!isInitialized) initialize()
  }, [isInitialized, initialize])

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Chargement…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/devis" element={<DevisPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/utilisateurs" element={<UtilisateursPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/realisations" element={<RealisationsPage />} />
            <Route path="/medias" element={<MediasPage />} />
            <Route path="/contenu" element={<SiteContentPage />} />
            <Route path="/emails" element={<EmailTemplatesPage />} />
            <Route path="/rapports" element={<RapportsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/parametres" element={<ParametresPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
