import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { cn, getInitials } from '@/lib/utils'
import {
  LayoutDashboard, FileText, MessageCircle, Users, Wrench,
  FolderKanban, ImageIcon, Globe, Mail, BarChart3, History,
  Settings, LogOut, Menu, X, Sun, Moon,
  ClipboardList,
} from 'lucide-react'

const NAV = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Prises de contact', href: '/devis', icon: FileText, badge: true },
  { label: 'Messages', href: '/contact', icon: MessageCircle },
  { label: 'Rapports', href: '/rapports', icon: ClipboardList },
  null,
  { label: 'Services', href: '/services', icon: Wrench },
  { label: 'Réalisations', href: '/realisations', icon: FolderKanban },
  { label: 'Médias', href: '/medias', icon: ImageIcon },
  null,
  { label: 'Contenu du site', href: '/contenu', icon: Globe },
  { label: 'Templates Email', href: '/emails', icon: Mail },
  null,
  { label: 'Utilisateurs', href: '/utilisateurs', icon: Users },
  { label: 'Statistiques', href: '/stats', icon: BarChart3 },
  { label: 'Logs', href: '/logs', icon: History },
  { label: 'Paramètres', href: '/parametres', icon: Settings },
]

function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('admin-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('admin-theme', theme)
  }, [theme])

  const toggle = () => setThemeState(t => t === 'dark' ? 'light' : 'dark')
  return { theme, toggle }
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggle } = useTheme()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (href: string) =>
    location.pathname === href || (href !== '/dashboard' && location.pathname.startsWith(href))

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/5">
        <img src="/logo.png" alt="GUYA FIBRE" className="h-8 w-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item, i) => {
          if (!item) return <div key={`sep-${i}`} className="my-3 mx-2 h-px bg-white/5" />
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-primary/15 text-primary border-l-2 border-primary pl-[10px]'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5 border-l-2 border-transparent pl-[10px]'
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary' : 'text-white/40 group-hover:text-white/70')} />
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Déconnexion</span>
        </button>
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {user ? getInitials(user.firstName, user.lastName) : 'GF'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-60 bg-sidebar flex flex-col z-50">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4 text-yellow-400" />
                : <Moon className="w-4 h-4 text-blue-500" />
              }
            </button>
            {/* Voir le site */}
            <a
              href="https://guya-fibre-three.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Voir le site
            </a>
            {/* User */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {user ? getInitials(user.firstName, user.lastName) : 'GF'}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-foreground">{user?.firstName}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}