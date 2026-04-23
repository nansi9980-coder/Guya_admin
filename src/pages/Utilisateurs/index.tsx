import { useEffect, useState, useCallback } from 'react'
import { usersApi, devisApi, contactApi } from '@/api'
import type { User, Devis, Contact } from '@/types'
import { formatDate, getInitials, cn } from '@/lib/utils'
import {
  Card, CardContent, PageHeader, Button, Input, Label,
  Spinner, EmptyState, Modal, Switch, Table, Thead, Tbody, Th, Td, Tr, Tabs,
} from '@/components/ui'
import { toast } from 'sonner'
import { Users, Plus, Edit, Trash2, Search, UserCheck, Mail, Phone, MapPin, FileText, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  EDITOR: { label: 'Éditeur', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  VIEWER: { label: 'Lecteur', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
}

const emptyForm = { firstName: '', lastName: '', email: '', password: '', role: 'EDITOR' as const, isActive: true }

const TABS = [
  { label: 'Équipe admin', value: 'team' },
  { label: 'Clients', value: 'clients' },
]

interface Client {
  email: string
  name: string
  phone?: string
  location?: string
  devisCount: number
  contactCount: number
  lastActivity: string
}

export default function UtilisateursPage() {
  const { user: me } = useAuthStore()
  const [tab, setTab] = useState('team')
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const isSuperAdmin = me?.role === 'SUPER_ADMIN'

  const loadTeam = useCallback(async () => {
    setLoading(true)
    try {
      const res = await usersApi.getAll()
      const list = Array.isArray(res) ? res : res.data || []
      setUsers(search ? list.filter((u: User) =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
      ) : list)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [search])

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      const [devisRes, contactRes] = await Promise.all([
        devisApi.getAll({ limit: 200 }),
        contactApi.getAll({ limit: 200 }),
      ])
      const devisList: Devis[] = Array.isArray(devisRes) ? devisRes : devisRes.data || []
      const contactList: Contact[] = Array.isArray(contactRes) ? contactRes : contactRes.data || []

      const map: Record<string, Client> = {}

      for (const d of devisList) {
        const key = d.clientEmail.toLowerCase()
        if (!map[key]) map[key] = { email: d.clientEmail, name: d.clientName, phone: d.clientPhone, location: d.location, devisCount: 0, contactCount: 0, lastActivity: d.createdAt }
        map[key].devisCount++
        if (new Date(d.createdAt) > new Date(map[key].lastActivity)) map[key].lastActivity = d.createdAt
      }

      for (const c of contactList) {
        const key = c.email.toLowerCase()
        if (!map[key]) map[key] = { email: c.email, name: c.name, phone: c.phone, location: undefined, devisCount: 0, contactCount: 0, lastActivity: c.createdAt }
        map[key].contactCount++
        if (new Date(c.createdAt) > new Date(map[key].lastActivity)) map[key].lastActivity = c.createdAt
      }

      let list = Object.values(map).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      if (search) list = list.filter(c => `${c.name} ${c.email}`.toLowerCase().includes(search.toLowerCase()))
      setClients(list)
    } catch {
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    if (tab === 'team') loadTeam()
    else loadClients()
  }, [tab, loadTeam, loadClients])

  const openCreate = () => { setEditUser(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (u: User) => {
    setEditUser(u)
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role as any, isActive: u.isActive })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (editUser) {
        const data: any = { firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role, isActive: form.isActive }
        if (form.password) data.password = form.password
        await usersApi.update(editUser.id, data)
        toast.success('Utilisateur mis à jour')
      } else {
        const createData: any = { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, role: form.role }
        await usersApi.create(createData)
        toast.success('Utilisateur créé')
      }
      setModalOpen(false)
      loadTeam()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
    setSubmitting(false)
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Supprimer ${u.firstName} ${u.lastName} ?`)) return
    try {
      await usersApi.delete(u.id)
      toast.success('Utilisateur supprimé')
      loadTeam()
    } catch { toast.error('Erreur') }
  }

  const toggleActive = async (u: User) => {
    try {
      await usersApi.toggleActive(u.id, !u.isActive)
      toast.success(u.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé')
      loadTeam()
    } catch { toast.error('Erreur') }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Utilisateurs"
        description={tab === 'team' ? `${users.length} compte${users.length > 1 ? 's' : ''} admin` : `${clients.length} client${clients.length > 1 ? 's' : ''} enregistré${clients.length > 1 ? 's' : ''}`}
        action={tab === 'team' && isSuperAdmin ? (
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4" />Nouvel utilisateur
          </Button>
        ) : undefined}
      />

      <Card>
        <CardContent className="p-4 space-y-3">
          <Tabs tabs={TABS} value={tab} onChange={v => { setTab(v); setSearch('') }} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={tab === 'team' ? 'Rechercher un utilisateur…' : 'Rechercher un client…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Team tab */}
      {tab === 'team' && (
        <Card>
          {loading ? (
            <CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent>
          ) : users.length === 0 ? (
            <EmptyState icon={<Users className="w-6 h-6" />} title="Aucun utilisateur" />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Utilisateur</Th>
                  <Th>Rôle</Th>
                  <Th className="hidden md:table-cell">Dernière connexion</Th>
                  <Th>Statut</Th>
                  {isSuperAdmin && <Th>Actions</Th>}
                </tr>
              </Thead>
              <Tbody>
                {users.map(u => {
                  const r = ROLE_CONFIG[u.role] || ROLE_CONFIG.VIEWER
                  const isMe = me?.id === u.id
                  return (
                    <Tr key={u.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">{getInitials(u.firstName, u.lastName)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground flex items-center gap-1">
                              {u.firstName} {u.lastName}
                              {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Vous</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td><span className={cn('text-xs px-2 py-1 rounded-full font-medium', r.cls)}>{r.label}</span></Td>
                      <Td className="hidden md:table-cell text-muted-foreground">{u.lastLogin ? formatDate(u.lastLogin) : '—'}</Td>
                      <Td>
                        {isSuperAdmin && !isMe ? (
                          <Switch checked={u.isActive} onChange={() => toggleActive(u)} />
                        ) : (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                            u.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}>{u.isActive ? 'Actif' : 'Inactif'}</span>
                        )}
                      </Td>
                      {isSuperAdmin && (
                        <Td>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                              <Edit className="w-4 h-4" />
                            </button>
                            {!isMe && (
                              <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </Td>
                      )}
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* Clients tab */}
      {tab === 'clients' && (
        <Card>
          {loading ? (
            <CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent>
          ) : clients.length === 0 ? (
            <EmptyState icon={<UserCheck className="w-6 h-6" />} title="Aucun client" description="Les clients apparaissent ici après avoir soumis un devis ou un message" />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Client</Th>
                  <Th className="hidden md:table-cell">Contact</Th>
                  <Th className="hidden lg:table-cell">Localisation</Th>
                  <Th>Devis</Th>
                  <Th>Messages</Th>
                  <Th className="hidden sm:table-cell">Dernière activité</Th>
                </tr>
              </Thead>
              <Tbody>
                {clients.map(c => (
                  <Tr key={c.email}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{c.name.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="hidden md:table-cell">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                          <Phone className="w-3 h-3" />{c.phone}
                        </a>
                      )}
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-0.5">
                        <Mail className="w-3 h-3" />{c.email}
                      </a>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      {c.location && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />{c.location}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                        <FileText className="w-4 h-4 text-primary" />{c.devisCount}
                      </span>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                        <MessageCircle className="w-4 h-4 text-primary" />{c.contactCount}
                      </span>
                    </Td>
                    <Td className="hidden sm:table-cell text-muted-foreground text-xs">
                      {formatDate(c.lastActivity)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'} size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prénom</Label><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Prénom" /></div>
            <div><Label>Nom</Label><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Nom" /></div>
          </div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemple.com" /></div>
          <div><Label>{editUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" /></div>
          <div>
            <Label>Rôle</Label>
            <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="EDITOR">Éditeur</option>
              <option value="VIEWER">Lecteur</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="mb-0">Compte actif</Label>
            <Switch checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button loading={submitting} onClick={handleSubmit}>{editUser ? 'Mettre à jour' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}