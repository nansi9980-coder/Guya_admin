import { useEffect, useState, useCallback } from 'react'
import { devisApi } from '@/api'
import type { Devis, DevisStatus } from '@/types'
import { formatRelative, formatDate, cn } from '@/lib/utils'
import {
  Card, CardContent, PageHeader, Button, Input,
  Modal, Textarea, Label, Spinner, EmptyState, Table, Thead, Tbody, Th, Td, Tr, Tabs, DropdownMenu,
} from '@/components/ui'
import { toast } from 'sonner'
import {
  Search, Download, Eye, Mail, Phone, FileText,
  MapPin, Calendar, Clock, CheckCircle2,
  AlertCircle, XCircle, RefreshCw, MoreHorizontal, Plus,
  DollarSign, Printer,
} from 'lucide-react'

// ─── MAPS ─────────────────────────────────────────────────────────────────
const SERVICE_LABELS: Record<string, string> = {
  etudes: 'Études techniques & Conception',
  deploiement: 'Déploiement fibre optique',
  raccordement: 'Raccordement client (FTTH/FTTO)',
  maintenance: 'Maintenance & SAV',
  audit: 'Audit de réseau',
  formation: 'Formation technique',
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  NEW: { label: 'Nouveau', cls: 'status-NEW', icon: AlertCircle },
  PENDING: { label: 'En attente', cls: 'status-PENDING', icon: Clock },
  IN_PROGRESS: { label: 'En cours', cls: 'status-IN_PROGRESS', icon: Clock },
  QUOTE_SENT: { label: 'Réponse envoyée', cls: 'status-QUOTE_SENT', icon: FileText },
  ACCEPTED: { label: 'Accepté', cls: 'status-ACCEPTED', icon: CheckCircle2 },
  COMPLETED: { label: 'Terminé', cls: 'status-COMPLETED', icon: CheckCircle2 },
  REJECTED: { label: 'Refusé', cls: 'status-REJECTED', icon: XCircle },
  CANCELLED: { label: 'Annulé', cls: 'status-CANCELLED', icon: XCircle },
}

const URGENCY_CONFIG: Record<string, { label: string; cls: string }> = {
  LOW: { label: 'Faible', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  NORMAL: { label: 'Normal', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  HIGH: { label: 'Haute', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  URGENT: { label: 'Urgent', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ['PENDING', 'IN_PROGRESS', 'REJECTED'],
  PENDING: ['IN_PROGRESS', 'QUOTE_SENT', 'REJECTED'],
  IN_PROGRESS: ['QUOTE_SENT', 'COMPLETED', 'REJECTED'],
  QUOTE_SENT: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
}

const TABS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Nouveaux', value: 'NEW' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'En cours', value: 'IN_PROGRESS' },
  { label: 'Acceptés', value: 'ACCEPTED' },
  { label: 'Terminés', value: 'COMPLETED' },
]

// ─── PDF GENERATOR ────────────────────────────────────────────────────────
function generateDevisPDF(devis: Devis) {
  const serviceNames = (Array.isArray(devis.services) ? devis.services : [devis.services])
    .map(s => SERVICE_LABELS[s] || s)
    .join(', ')

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8"/>
      <title>Prise de contact ${devis.reference}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; }
        .page { max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #0ea5e9; }
        .logo { font-size: 26px; font-weight: 900; color: #0ea5e9; letter-spacing: -1px; }
        .logo span { color: #1a1a2e; }
        .header-info { text-align: right; font-size: 12px; color: #6b7280; }
        .header-info strong { font-size: 20px; color: #1a1a2e; display: block; margin-bottom: 4px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #dbeafe; color: #1d4ed8; margin-top: 6px; }
        .section { margin-bottom: 28px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field label { font-size: 11px; color: #6b7280; margin-bottom: 3px; display: block; }
        .field p { font-size: 13px; color: #1a1a2e; font-weight: 500; }
        .services-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .service-tag { background: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; border: 1px solid #bfdbfe; }
        .description-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.7; color: #374151; }
        .amount-box { background: linear-gradient(135deg, #0ea5e9 0%, #0891b2 100%); color: white; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0; }
        .amount-box .label { font-size: 12px; opacity: 0.85; margin-bottom: 8px; }
        .amount-box .value { font-size: 36px; font-weight: 900; letter-spacing: -1px; }
        .amount-box .note { font-size: 11px; opacity: 0.7; margin-top: 6px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
        .footer strong { color: #0ea5e9; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>
            <div class="logo">GUYA <span>FIBRE</span></div>
            <div style="font-size:12px;color:#6b7280;margin-top:6px;">Fibre optique en Guyane française</div>
            <div style="font-size:12px;color:#6b7280;">contact@guyafibre.com · +594 6 94 43 54 84</div>
          </div>
          <div class="header-info">
            <strong>${devis.reference}</strong>
            <div>Date : ${formatDate(devis.createdAt)}</div>
            <div class="badge">${STATUS_CONFIG[devis.status]?.label || devis.status}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Informations client</div>
          <div class="grid-2">
            <div class="field"><label>Nom complet</label><p>${devis.clientName}</p></div>
            ${devis.company ? `<div class="field"><label>Entreprise</label><p>${devis.company}</p></div>` : '<div></div>'}
            <div class="field"><label>Email</label><p>${devis.clientEmail}</p></div>
            <div class="field"><label>Téléphone</label><p>${devis.clientPhone}</p></div>
            <div class="field"><label>Localisation</label><p>${devis.location}</p></div>
            <div class="field"><label>Urgence</label><p>${URGENCY_CONFIG[devis.urgency]?.label || devis.urgency}</p></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Services demandés</div>
          <div class="services-list">
            ${(Array.isArray(devis.services) ? devis.services : [devis.services])
              .map(s => `<span class="service-tag">${SERVICE_LABELS[s] || s}</span>`)
              .join('')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Description du projet</div>
          <div class="description-box">${devis.description}</div>
        </div>

        ${devis.amount ? `
        <div class="amount-box">
          <div class="label">Montant du devis estimé</div>
          <div class="value">${Number(devis.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          <div class="note">Établi par GUYA FIBRE — sous réserve de validation technique</div>
        </div>
        ` : ''}

        <div class="footer">
          <strong>GUYA FIBRE</strong> · Fibre optique en Guyane française<br/>
          12 Rue des Palmiers, 97320 Saint-Laurent-du-Maroni · contact@guyafibre.com<br/>
          Document généré le ${new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    </body>
    </html>
  `

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.print() }
}

// ─── COMPONENT ────────────────────────────────────────────────────────────
export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [selected, setSelected] = useState<Devis | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionModal, setActionModal] = useState<'respond' | 'note' | 'status' | 'amount' | null>(null)
  const [respondForm, setRespondForm] = useState({ subject: '', body: '' })
  const [noteText, setNoteText] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await devisApi.getAll({
        page, limit: 15,
        search: search || undefined,
        status: statusTab !== 'ALL' ? statusTab : undefined,
        urgency: urgencyFilter || undefined,
      })
      setDevis(res.data ?? [])
      setTotal(res.meta.total)
    } catch {
      toast.error('Erreur lors du chargement des prises de contact')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusTab, urgencyFilter])

  useEffect(() => { load() }, [load])

  const openDetail = async (d: Devis) => {
    setSelected(d)
    setDetailLoading(true)
    try {
      const full = await devisApi.getOne(d.id)
      setSelected(full)
    } catch {}
    setDetailLoading(false)
  }

  const handleStatusChange = async () => {
    if (!selected || !newStatus) return
    setSubmitting(true)
    try {
      await devisApi.updateStatus(selected.id, newStatus)
      toast.success('Statut mis à jour')
      setActionModal(null)
      load()
      setSelected(prev => prev ? { ...prev, status: newStatus as DevisStatus } : null)
    } catch { toast.error('Erreur') }
    setSubmitting(false)
  }

  const handleRespond = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await devisApi.respond(selected.id, respondForm)
      toast.success('Réponse envoyée')
      setActionModal(null)
      setRespondForm({ subject: '', body: '' })
    } catch { toast.error("Erreur lors de l'envoi") }
    setSubmitting(false)
  }

  const handleAddNote = async () => {
    if (!selected || !noteText.trim()) return
    setSubmitting(true)
    try {
      await devisApi.addNote(selected.id, noteText)
      toast.success('Note ajoutée')
      setActionModal(null)
      setNoteText('')
      const full = await devisApi.getOne(selected.id)
      setSelected(full)
    } catch { toast.error('Erreur') }
    setSubmitting(false)
  }

  const handleSetAmount = async () => {
    if (!selected || !amount) return
    setSubmitting(true)
    try {
      await devisApi.updateAmount(selected.id, parseFloat(amount))
      toast.success('Montant enregistré')
      setActionModal(null)
      const full = await devisApi.getOne(selected.id)
      setSelected(full)
      load()
    } catch { toast.error('Erreur') }
    setSubmitting(false)
  }

  const handleExport = async () => {
    try {
      const blob = await devisApi.exportCsv({ search: search || undefined })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'prises-de-contact.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error("Erreur lors de l'export") }
  }

  const totalPages = Math.ceil(total / 15)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prises de contact"
        description={`${total} demandes au total`}
        action={
          <Button size="sm" onClick={handleExport} variant="outline">
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Rechercher par nom, email, référence…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <select
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={urgencyFilter}
              onChange={e => { setUrgencyFilter(e.target.value); setPage(1) }}
            >
              <option value="">Toutes urgences</option>
              <option value="URGENT">🔴 Urgent</option>
              <option value="HIGH">🟠 Haute</option>
              <option value="NORMAL">🔵 Normal</option>
              <option value="LOW">⚪ Faible</option>
            </select>
            <Button variant="ghost" size="sm" onClick={load}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <Tabs
              tabs={TABS.map(t => ({ ...t, count: t.value === statusTab ? devis.length : undefined }))}
              value={statusTab}
              onChange={v => { setStatusTab(v); setPage(1) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent>
        ) : devis.length === 0 ? (
          <EmptyState icon={<FileText className="w-6 h-6" />} title="Aucune demande" description="Aucune prise de contact ne correspond à vos critères" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Référence</Th>
                <Th>Client</Th>
                <Th className="hidden md:table-cell">Services</Th>
                <Th className="hidden lg:table-cell">Localisation</Th>
                <Th>Urgence</Th>
                <Th>Statut</Th>
                <Th className="hidden sm:table-cell">Date</Th>
                <Th></Th>
              </tr>
            </Thead>
            <Tbody>
              {devis.map(d => {
                const s = STATUS_CONFIG[d.status] || STATUS_CONFIG.NEW
                const u = URGENCY_CONFIG[d.urgency] || URGENCY_CONFIG.NORMAL
                return (
                  <Tr key={d.id} className="cursor-pointer" onClick={() => openDetail(d)}>
                    <Td>
                      <span className="font-mono text-xs text-muted-foreground">{d.reference}</span>
                    </Td>
                    <Td>
                      <div>
                        <p className="font-medium text-foreground">{d.clientName}</p>
                        {d.company && <p className="text-xs text-muted-foreground">{d.company}</p>}
                      </div>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <p className="text-xs text-muted-foreground truncate max-w-48">
                        {(Array.isArray(d.services) ? d.services : [d.services])
                          .map(s => SERVICE_LABELS[s] || s).join(', ')}
                      </p>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {d.location}
                      </span>
                    </Td>
                    <Td>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', u.cls)}>{u.label}</span>
                    </Td>
                    <Td>
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', s.cls)}>{s.label}</span>
                    </Td>
                    <Td className="hidden sm:table-cell text-muted-foreground">
                      {formatRelative(d.createdAt)}
                    </Td>
                    <Td onClick={e => e.stopPropagation()}>
                      <DropdownMenu
                        items={[
                          { label: 'Voir détails', icon: <Eye className="w-4 h-4" />, onClick: () => openDetail(d) },
                          { label: 'Établir le devis', icon: <DollarSign className="w-4 h-4" />, onClick: () => { setSelected(d); setAmount(d.amount?.toString() || ''); setActionModal('amount') } },
                          { label: 'Répondre', icon: <Mail className="w-4 h-4" />, onClick: () => { setSelected(d); setActionModal('respond') } },
                          { label: 'Changer statut', icon: <RefreshCw className="w-4 h-4" />, onClick: () => { setSelected(d); setNewStatus(d.status); setActionModal('status') } },
                          { label: 'Ajouter note', icon: <Plus className="w-4 h-4" />, onClick: () => { setSelected(d); setActionModal('note') } },
                          { label: 'Télécharger PDF', icon: <Printer className="w-4 h-4" />, onClick: () => generateDevisPDF(d) },
                        ]}
                      >
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenu>
                    </Td>
                  </Tr>
                )
              })}
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

      {/* Detail Modal */}
      <Modal open={!!selected && !actionModal} onClose={() => setSelected(null)} title="Détail de la prise de contact" size="lg">
        {selected && (
          <div className="space-y-5">
            {detailLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{selected.reference}</p>
                    <h3 className="font-display font-semibold text-lg text-foreground mt-1">{selected.clientName}</h3>
                    {selected.company && <p className="text-sm text-muted-foreground">{selected.company}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium', STATUS_CONFIG[selected.status]?.cls)}>
                      {STATUS_CONFIG[selected.status]?.label}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', URGENCY_CONFIG[selected.urgency]?.cls)}>
                      {URGENCY_CONFIG[selected.urgency]?.label}
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <a href={`mailto:${selected.clientEmail}`} className="hover:text-primary truncate">{selected.clientEmail}</a>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <a href={`tel:${selected.clientPhone}`} className="hover:text-primary">{selected.clientPhone}</a>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    {selected.location}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    {formatDate(selected.createdAt)}
                  </div>
                </div>

                {selected.amount && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <DollarSign className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Montant du devis</p>
                      <p className="font-display font-bold text-xl text-foreground">
                        {Number(selected.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Services demandés</p>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(selected.services) ? selected.services : [selected.services]).map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {SERVICE_LABELS[s] || s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-xl p-4 leading-relaxed">{selected.description}</p>
                </div>

                {selected.notes && selected.notes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes internes</p>
                    <div className="space-y-2">
                      {selected.notes.map(n => (
                        <div key={n.id} className="text-sm bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-3">
                          <p className="text-foreground">{n.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">{n.author.firstName} {n.author.lastName} — {formatDate(n.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Button size="sm" onClick={() => setActionModal('respond')}>
                    <Mail className="w-4 h-4" />Répondre
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAmount(selected.amount?.toString() || ''); setActionModal('amount') }}>
                    <DollarSign className="w-4 h-4" />Établir le devis
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setNewStatus(selected.status); setActionModal('status') }}>
                    <RefreshCw className="w-4 h-4" />Changer statut
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActionModal('note')}>
                    <Plus className="w-4 h-4" />Note
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => generateDevisPDF(selected)}>
                    <Printer className="w-4 h-4" />PDF
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Amount Modal */}
      <Modal open={actionModal === 'amount'} onClose={() => setActionModal(null)} title="Établir le montant de la réponse" size="sm">
        <div className="space-y-4">
          <div>
            <Label>Montant (€)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                className="pl-9"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Ex: 1500"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ce montant apparaîtra sur le PDF de la prise de contact envoyé au client.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionModal(null)}>Annuler</Button>
            <Button loading={submitting} onClick={handleSetAmount} disabled={!amount}>
              <CheckCircle2 className="w-4 h-4" />Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Respond Modal */}
      <Modal open={actionModal === 'respond'} onClose={() => setActionModal(null)} title="Répondre au client" size="md">
        <div className="space-y-4">
          <div>
            <Label>Sujet</Label>
            <Input value={respondForm.subject} onChange={e => setRespondForm(f => ({ ...f, subject: e.target.value }))} placeholder="Objet de votre réponse" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea rows={7} value={respondForm.body} onChange={e => setRespondForm(f => ({ ...f, body: e.target.value }))} placeholder="Votre message…" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionModal(null)}>Annuler</Button>
            <Button loading={submitting} onClick={handleRespond}><Mail className="w-4 h-4" />Envoyer</Button>
          </div>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal open={actionModal === 'status'} onClose={() => setActionModal(null)} title="Changer le statut" size="sm">
        <div className="space-y-4">
          <div className="grid gap-2">
            {selected && (STATUS_TRANSITIONS[selected.status] || []).map(s => (
              <button
                key={s}
                onClick={() => setNewStatus(s)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                  newStatus === s ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80 hover:bg-muted/50'
                )}
              >
                <span className={cn('text-xs px-2 py-1 rounded-full font-medium', STATUS_CONFIG[s]?.cls)}>{STATUS_CONFIG[s]?.label}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionModal(null)}>Annuler</Button>
            <Button loading={submitting} onClick={handleStatusChange} disabled={!newStatus || newStatus === selected?.status}>Confirmer</Button>
          </div>
        </div>
      </Modal>

      {/* Note Modal */}
      <Modal open={actionModal === 'note'} onClose={() => setActionModal(null)} title="Ajouter une note interne" size="sm">
        <div className="space-y-4">
          <Textarea rows={5} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Note interne (non visible par le client)…" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionModal(null)}>Annuler</Button>
            <Button loading={submitting} onClick={handleAddNote} disabled={!noteText.trim()}>Ajouter</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}