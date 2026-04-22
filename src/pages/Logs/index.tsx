import { useEffect, useState, useCallback } from 'react'
import { logsApi } from '@/api'
import type { ActivityLog } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'
import {
  Card, CardContent, PageHeader, Spinner, EmptyState, Table, Thead, Tbody, Th, Td, Tr,
} from '@/components/ui'
import { History, Search } from 'lucide-react'

const ACTION_CONFIG: Record<string, { cls: string }> = {
  CREATE: { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  UPDATE: { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  DELETE: { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  LOGIN: { cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await logsApi.getAll({ limit: 100 })
      const list = Array.isArray(res) ? res : res.data || []
      setLogs(search
        ? list.filter((l: ActivityLog) => `${l.entity} ${l.action} ${l.description || ''}`.toLowerCase().includes(search.toLowerCase()))
        : list
      )
    } catch {} finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <PageHeader title="Logs d'activité" description="Historique des actions effectuées" />
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        {loading ? (
          <CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent>
        ) : logs.length === 0 ? (
          <EmptyState icon={<History className="w-6 h-6" />} title="Aucun log" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Action</Th>
                <Th>Entité</Th>
                <Th className="hidden md:table-cell">Description</Th>
                <Th className="hidden lg:table-cell">Utilisateur</Th>
                <Th className="hidden sm:table-cell">Date</Th>
              </tr>
            </Thead>
            <Tbody>
              {logs.map(l => {
                const a = ACTION_CONFIG[l.action] || { cls: 'bg-gray-100 text-gray-700' }
                return (
                  <Tr key={l.id}>
                    <Td><span className={cn('text-xs px-2 py-1 rounded-full font-medium', a.cls)}>{l.action}</span></Td>
                    <Td><span className="text-xs text-muted-foreground">{l.entity}</span></Td>
                    <Td className="hidden md:table-cell"><p className="text-sm text-foreground truncate max-w-64">{l.description ?? '—'}</p></Td>
                    <Td className="hidden lg:table-cell"><span className="text-xs text-muted-foreground">{l.user ? `${l.user.firstName} ${l.user.lastName}` : '—'}</span></Td>
                    <Td className="hidden sm:table-cell"><span className="text-xs text-muted-foreground">{formatDateTime(l.createdAt)}</span></Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}