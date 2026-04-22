import { useEffect, useState, useCallback } from 'react'
import { contactApi } from '@/api'
import type { Contact } from '@/types'
import { formatRelative, formatDate, cn } from '@/lib/utils'
import {
  Card, CardContent, PageHeader, Button, Spinner, EmptyState,
  Modal, Tabs, Table, Thead, Tbody, Th, Td, Tr, DropdownMenu,
} from '@/components/ui'
import { toast } from 'sonner'
import {
  MessageCircle, Mail, Phone, Eye, Trash2, Search,
  CheckCircle, RefreshCw, MoreHorizontal, Archive,
} from 'lucide-react'

export default function ContactPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('ALL')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Contact | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await contactApi.getAll({
        page, limit: 15,
        search: search || undefined,
        status: tab !== 'ALL' ? tab : undefined,
      })
      setContacts(Array.isArray(res) ? res : res.data || [])
      setTotal(typeof res === 'object' && 'total' in res ? (res as any).total : 0)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [page, search, tab])

  useEffect(() => { load() }, [load])

  const markRead = async (id: string) => {
    try {
      await contactApi.markAsRead(id)
      toast.success('Marqué comme lu')
      load()
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce message ?')) return
    try {
      await contactApi.delete(id)
      toast.success('Message supprimé')
      setSelected(null)
      load()
    } catch { toast.error('Erreur') }
  }

  const unreadCount = contacts.filter(c => c.status === 'UNREAD').length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Messages de contact"
        description={`${total} messages reçus`}
        action={
          unreadCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse2" />
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Rechercher par nom, sujet…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={load}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-3">
            <Tabs
              tabs={[
                { label: 'Tous', value: 'ALL' },
                { label: 'Non lus', value: 'UNREAD', count: unreadCount },
                { label: 'Lus', value: 'READ' },
                { label: 'Archivés', value: 'ARCHIVED' },
              ]}
              value={tab}
              onChange={v => { setTab(v); setPage(1) }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent>
        ) : contacts.length === 0 ? (
          <EmptyState icon={<MessageCircle className="w-6 h-6" />} title="Aucun message" description="Aucun message ne correspond à vos critères" />
        ) : (
          <div className="divide-y divide-border">
            {contacts.map(c => (
              <div
                key={c.id}
                className={cn(
                  'flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group',
                  c.status === 'UNREAD' && 'bg-primary/[0.02]'
                )}
                onClick={() => setSelected(c)}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold',
                  c.status === 'UNREAD' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {c.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm', c.status === 'UNREAD' ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>
                      {c.name}
                    </p>
                    {c.status === 'UNREAD' && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className={cn('text-sm mt-0.5', c.status === 'UNREAD' ? 'text-foreground' : 'text-muted-foreground')}>
                    {c.subject}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.message}</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatRelative(c.createdAt)}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity" onClick={e => e.stopPropagation()}>
                    {c.status === 'UNREAD' && (
                      <button
                        onClick={() => markRead(c.id)}
                        className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-emerald-600 transition-colors"
                        title="Marquer comme lu"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {Math.ceil(total / 15) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} sur {Math.ceil(total / 15)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
              <Button variant="outline" size="sm" disabled={page === Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}>Suivant</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Message de contact" size="md">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(selected.createdAt)}</p>
              </div>
              <span className={cn('ml-auto text-xs px-2 py-1 rounded-full font-medium',
                selected.status === 'UNREAD' ? 'bg-primary/10 text-primary' :
                selected.status === 'READ' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                'bg-muted text-muted-foreground'
              )}>
                {selected.status === 'UNREAD' ? 'Non lu' : selected.status === 'READ' ? 'Lu' : 'Archivé'}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href={`mailto:${selected.email}`} className="hover:text-primary truncate">{selected.email}</a>
              </div>
              {selected.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <a href={`tel:${selected.phone}`} className="hover:text-primary">{selected.phone}</a>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Sujet</p>
              <p className="text-sm font-medium text-foreground">{selected.subject}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Message</p>
              <div className="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <a
                href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
              >
                <Mail className="w-4 h-4" />
                Répondre par email
              </a>
              {selected.status === 'UNREAD' && (
                <Button variant="outline" size="sm" onClick={() => { markRead(selected.id); setSelected(prev => prev ? { ...prev, status: 'READ' } : null) }}>
                  <CheckCircle className="w-4 h-4" />
                  Marquer lu
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(selected.id)}>
                <Trash2 className="w-4 h-4" />
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
