import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { statsApi } from '@/api'
import type { DashboardData } from '@/types'
import { formatRelative, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton, PageHeader } from '@/components/ui'
import {
  FileText, Users, TrendingUp, Clock,
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight,
  MapPin, Calendar,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  NEW: { label: 'Nouveau', cls: 'status-NEW' },
  PENDING: { label: 'En attente', cls: 'status-PENDING' },
  IN_PROGRESS: { label: 'En cours', cls: 'status-IN_PROGRESS' },
  QUOTE_SENT: { label: 'Réponse envoyée', cls: 'status-QUOTE_SENT' },
  ACCEPTED: { label: 'Accepté', cls: 'status-ACCEPTED' },
  COMPLETED: { label: 'Terminé', cls: 'status-COMPLETED' },
  REJECTED: { label: 'Refusé', cls: 'status-REJECTED' },
  CANCELLED: { label: 'Annulé', cls: 'status-CANCELLED' },
}

const CHART_COLORS = ['hsl(185,65%,45%)', 'hsl(28,85%,55%)', 'hsl(270,65%,60%)', 'hsl(142,70%,45%)']

// Mock chart data (replace with real stats endpoint)
const MONTHLY_DATA = [
  { month: 'Oct', devis: 14, revenus: 18500 },
  { month: 'Nov', devis: 22, revenus: 31200 },
  { month: 'Déc', devis: 18, revenus: 24800 },
  { month: 'Jan', devis: 28, revenus: 42000 },
  { month: 'Fév', devis: 35, revenus: 58600 },
  { month: 'Mar', devis: 31, revenus: 51000 },
  { month: 'Avr', devis: 42, revenus: 67500 },
]

function StatCard({ title, value, change, trend, icon: Icon, colorClass }: {
  title: string; value: string; change: string; trend: 'up' | 'down'
  icon: React.ElementType; colorClass: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            trend === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        </div>
        <p className="font-display text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsApi.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const stats = data ? [
    { title: 'Demandes ce mois', value: data.stats.totalDevisThisMonth.toString(), change: '+12%', trend: 'up' as const, icon: FileText, colorClass: 'bg-primary/10 text-primary' },
    { title: 'En attente', value: data.stats.pendingDevis.toString(), change: '-3%', trend: 'down' as const, icon: Clock, colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { title: 'Clients actifs', value: data.stats.activeClients.toString(), change: '+8%', trend: 'up' as const, icon: Users, colorClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ] : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité"
        action={
          <Link to="/devis" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-sm">
            <FileText className="w-4 h-4" />
            Voir les prises de contact
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading
          ? Array(3).fill(0).map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-24" /></CardContent></Card>)
          : stats.map(s => <StatCard key={s.title} {...s} />)
        }
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des demandes</CardTitle>
            <CardDescription>Prises de contact reçues et revenus sur 7 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MONTHLY_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorDevis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(185,65%,45%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(185,65%,45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="devis" name="Demandes" stroke="hsl(185,65%,45%)" strokeWidth={2} fill="url(#colorDevis)" dot={{ fill: 'hsl(185,65%,45%)', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart - top services */}
        <Card>
          <CardHeader>
            <CardTitle>Services populaires</CardTitle>
            <CardDescription>Répartition ce mois</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48" /> : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={data?.topServices?.slice(0, 4) || []}
                      dataKey="count"
                      nameKey="serviceName"
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={70}
                      paddingAngle={3}
                    >
                      {(data?.topServices?.slice(0, 4) || []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {(data?.topServices?.slice(0, 4) || []).map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i] }} />
                        <span className="text-muted-foreground truncate max-w-28">{s.serviceName || s.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent devis */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Demandes récentes</CardTitle>
              <CardDescription>5 dernières demandes reçues</CardDescription>
            </div>
            <Link to="/devis" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.recentDevis || []).slice(0, 5).map(d => {
                  const s = STATUS_CONFIG[d.status] || { label: d.status, cls: 'status-NEW' }
                  return (
                    <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{d.clientName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {d.location}
                          <span>•</span>
                          {formatRelative(d.createdAt)}
                        </p>
                      </div>
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', s.cls)}>{s.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick stats */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: CheckCircle2, label: 'Prises de contact traitées', value: '92', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { icon: AlertCircle, label: 'Urgents à traiter', value: '8', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { icon: TrendingUp, label: 'Taux de conversion', value: '73%', color: 'text-primary', bg: 'bg-primary/10' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', bg)}>
                    <Icon className={cn('w-4 h-4', color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                  <p className="font-display font-bold text-foreground">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Interventions */}
          <Card>
            <CardHeader>
              <CardTitle>Interventions à venir</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.upcomingInterventions || []).slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.client}</p>
                    <p className="text-xs text-muted-foreground">{item.service}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                      <span>·</span>
                      {item.technician}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}