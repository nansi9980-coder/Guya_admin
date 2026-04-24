import { useEffect, useState, useCallback } from 'react'
import { logsApi } from '@/api'
import type { ActivityLog } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import {
  Card, CardContent, PageHeader, Button, Spinner, EmptyState, Table, Thead, Tbody, Th, Td, Tr,
} from '@/components/ui'
import { toast } from 'sonner'
import { Activity, RefreshCw, Search, User, Tag } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await logsApi.getAll({
        page,
        limit: 20,
        search: search || undefined,
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
      })
      const data = Array.isArray(res) ? res : res.data || []
      const t = res?.meta?.total ?? res?.total ?? data.length
      setLogs(data)
      setTotal(t)
    } catch {
      toast.error('Erreur lors du chargement des logs')
    } finally {
      setLoading(false)
    }
  }, [page, search, entityFilter, actionFilter])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Journaux d'activité"
        description={`${total} entrées au total`}
        action={
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Rechercher…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <select
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={entityFilter}
              onChange={e => { setEntityFilter(e.target.value); setPage(1) }}
            >
              <option value="">Toutes entités</option>
              <option value="devis">Devis</option>
              <option value="contact">Contact</option>
              <option value="user">Utilisateur</option>
              <option value="media">Média</option>
              <option value="service">Service</option>
              <option value="realisation">Réalisation</option>
            </select>
            <select
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setPage(1) }}
            >
              <option value="">Toutes actions</option>
              <option value="CREATE">Création</option>
              <option value="UPDATE">Modification</option>
              <option value="DELETE">Suppression</option>
              <option value="LOGIN">Connexion</option>
              <option value="LOGOUT">Déconnexion</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-6 h-6" />}
            title="Aucun log"
            description="Aucune activité ne correspond à vos critères"
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Date</Th>
                <Th>Utilisateur</Th>
                <Th>Action</Th>
                <Th>Entité</Th>
                <Th className="hidden lg:table-cell">Détails</Th>
                <Th className="hidden md:table-cell">IP</Th>
              </tr>
            </Thead>
            <Tbody>
              {logs.map(log => (
                <Tr key={log.id}>
                  <Td className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {log.user ? (
                        <p className="text-sm font-medium text-foreground">
                          {log.user.firstName} {log.user.lastName}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">{log.userEmail || '—'}</p>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'
                    )}>
                      {log.action}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Tag className="w-3 h-3" />
                      <span className="capitalize">{log.entity}</span>
                      {log.entityId && (
                        <span className="font-mono text-xs opacity-60">#{log.entityId.slice(0, 8)}</span>
                      )}
                    </div>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    {log.details ? (
                      <p className="text-xs text-muted-foreground truncate max-w-48">
                        {JSON.stringify(log.details)}
                      </p>
                    ) : '—'}
                  </Td>
                  <Td className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                    {log.ipAddress || '—'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} sur {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}