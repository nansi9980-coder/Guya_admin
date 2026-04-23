import { useEffect, useState } from 'react'
import { statsApi } from '@/api'
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Spinner } from '@/components/ui'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, MessageCircle, CheckCircle2, Archive } from 'lucide-react'

export default function StatsPage() {
  const [charts, setCharts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsApi.getCharts('month')
      .then(data => setCharts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total = charts.reduce((s, d) => s + (d.total || 0), 0)
  const read = charts.reduce((s, d) => s + (d.accepted || 0), 0)
  const archived = charts.reduce((s, d) => s + (d.rejected || 0), 0)
  const rate = total > 0 ? Math.round((read / total) * 100) : 0

  return (
    <div className="space-y-5">
      <PageHeader title="Statistiques" description="Analyse de l'activité du mois en cours" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total messages', value: total, icon: MessageCircle, cls: 'bg-primary/10 text-primary' },
          { label: 'Lus', value: read, icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
          { label: 'Archivés', value: archived, icon: Archive, cls: 'bg-muted text-muted-foreground' },
          { label: 'Taux de traitement', value: `${rate}%`, icon: TrendingUp, cls: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.cls}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Évolution des messages de contact</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : charts.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">Aucune donnée disponible pour ce mois</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={charts} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(185,65%,45%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(185,65%,45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="total" name="Total" stroke="hsl(185,65%,45%)" strokeWidth={2} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="accepted" name="Lus" stroke="hsl(142,70%,45%)" strokeWidth={2} fill="none" />
                <Area type="monotone" dataKey="rejected" name="Archivés" stroke="hsl(220,15%,60%)" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
