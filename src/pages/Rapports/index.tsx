import { useEffect, useState, useCallback, useRef } from 'react'
import { rapportsApi, devisApi } from '@/api'
import type { Rapport, Devis } from '@/types'
import { formatDate, formatDateTime, cn } from '@/lib/utils'
import {
  Card, CardContent, CardHeader, CardTitle, PageHeader, Button,
  Input, Label, Textarea, Select, Spinner, EmptyState, Modal,
  Tabs, Badge,
} from '@/components/ui'
import { toast } from 'sonner'
import SignaturePad from 'signature_pad'
import jsPDF from 'jspdf'
import {
  Plus, FileText, Edit, Trash2, Search, RefreshCw,
  Download, CheckCircle, Clock, Archive, Eye,
  MapPin, User, Calendar, PenLine, X, ChevronDown,
} from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  DRAFT:    { label: 'Brouillon',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',    icon: Clock },
  SIGNED:   { label: 'Signé',      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  ARCHIVED: { label: 'Archivé',    cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',           icon: Archive },
}

const SUPPORT_TYPES = ['IMB', 'MAISON', 'BATIMENT', 'LOCAL_PRO', 'AUTRE']
const SUPPORT_LABELS: Record<string, string> = {
  IMB: 'IMB', MAISON: 'Maison individuelle', BATIMENT: 'Bâtiment',
  LOCAL_PRO: 'Local professionnel', AUTRE: 'Autre',
}

const emptyForm = {
  title: '', typeSupport: '', devisId: '',
  batiment: '', batimentChoix: '', hall: '', appartement: '',
  localTechnique: '', localTechniqueLocalisation: '',
  photoLocalTechniqueUrl: '', photoPavillonUrl: '',
  gpsLat: '', gpsLng: '', notes: '',
}

// ─── SIGNATURE PAD COMPONENT ─────────────────────────────────────────────
function SignaturePadComponent({ onSign, onClear }: {
  onSign: (dataUrl: string) => void
  onClear: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePad | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    canvas.getContext('2d')!.scale(ratio, ratio)
    padRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: '#1e3a5f',
      minWidth: 1.5,
      maxWidth: 3,
    })
  }, [])

  const handleClear = () => {
    padRef.current?.clear()
    onClear()
  }

  const handleConfirm = () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      toast.error('Veuillez signer avant de confirmer')
      return
    }
    onSign(padRef.current.toDataURL('image/png'))
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl border-2 border-dashed border-primary/30 bg-muted/20 overflow-hidden" style={{ height: 200 }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
          style={{ width: '100%', height: '100%' }}
        />
        <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground/50">Signez ici</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleClear}>
          <X className="w-4 h-4" />Effacer
        </Button>
        <Button size="sm" onClick={handleConfirm}>
          <PenLine className="w-4 h-4" />Confirmer la signature
        </Button>
      </div>
    </div>
  )
}

// ─── PDF GENERATOR ────────────────────────────────────────────────────────
async function generatePDF(rapport: Rapport): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 15
  const colW = (W - margin * 2) / 2
  let y = 0

  // ── Helpers ──
  const tableHeader = (title: string) => {
    doc.setFillColor(26, 60, 100)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.rect(margin, y, W - margin * 2, 7, 'F')
    doc.text(title, margin + 3, y + 5)
    doc.setTextColor(0, 0, 0)
    y += 7
  }

  const tableRow = (label: string, value: string, isLeft = true) => {
    const x = isLeft ? margin : margin + colW
    doc.setFillColor(isLeft ? 235 : 248, isLeft ? 240 : 248, isLeft ? 248 : 248)
    doc.rect(x, y, colW, 8, 'F')
    doc.setDrawColor(200, 210, 220)
    doc.rect(x, y, colW, 8, 'S')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 60, 100)
    doc.text(label, x + 2, y + 5.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    doc.text(value || '—', x + colW * 0.45, y + 5.5)
    if (isLeft) return // don't advance y for left col
    y += 8
  }

  const fullRow = (label: string, value: string) => {
    doc.setFillColor(235, 240, 248)
    doc.rect(margin, y, W - margin * 2, 8, 'F')
    doc.setDrawColor(200, 210, 220)
    doc.rect(margin, y, W - margin * 2, 8, 'S')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 60, 100)
    doc.text(label, margin + 2, y + 5.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    doc.text(value || '—', margin + 55, y + 5.5)
    y += 8
  }

  const sectionSpacer = () => { y += 4 }

  // ── HEADER ──
  // Blue header band
  doc.setFillColor(26, 60, 100)
  doc.rect(0, 0, W, 28, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text("RAPPORT D'INTERVENTION", 105, 11, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Infrastructure Fibre Optique', 105, 18, { align: 'center' })

  // Orange accent bar
  doc.setFillColor(230, 115, 30)
  doc.rect(0, 28, W, 1.5, 'F')

  y = 38

  // Footer function
  const addFooter = () => {
    doc.setFontSize(7)
    doc.setTextColor(120)
    doc.setFont('helvetica', 'normal')
    doc.line(margin, 285, W - margin, 285)
    doc.text('GUYA fibre  |  Rapport confidentiel', margin, 289)
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, W - margin, 289, { align: 'right' })
    doc.setTextColor(0)
  }

  // ── SECTION: INFORMATIONS GÉNÉRALES ──
  tableHeader('INFORMATIONS GÉNÉRALES')
  tableRow('Titre du rapport', rapport.title)
  tableRow('Référence', rapport.reference, false)
  tableRow('Date', formatDateTime(rapport.createdAt))
  tableRow('Statut', STATUS_CONFIG[rapport.status]?.label || rapport.status, false)
  tableRow('Auteur du rapport', rapport.author ? `${rapport.author.firstName} ${rapport.author.lastName}` : '—')
  tableRow('Type de support', SUPPORT_LABELS[rapport.typeSupport || ''] || '—', false)
  if (rapport.devis) {
    fullRow('Devis associé', `${rapport.devis.reference} — ${rapport.devis.clientName}`)
  }

  sectionSpacer()

  // ── SECTION: LOCALISATION DU SITE ──
  tableHeader('LOCALISATION DU SITE')
  tableRow('Bâtiment ou Pavillon', rapport.batiment || '—')
  tableRow('Choix du Bâtiment', rapport.batimentChoix || '—', false)
  tableRow('Hall', rapport.hall || '—')
  tableRow('Appartement', rapport.appartement || '—', false)

  sectionSpacer()

  // ── SECTION: LOCAL TECHNIQUE ──
  tableHeader('LOCAL TECHNIQUE')
  fullRow('Local technique', rapport.localTechnique || '—')
  fullRow('Localisation local technique', rapport.localTechniqueLocalisation || '—')

  // Photo local technique
  if (rapport.photoLocalTechniqueUrl) {
    y += 2
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(26, 60, 100)
    doc.setTextColor(255, 255, 255)
    doc.rect(margin, y, W - margin * 2, 6, 'F')
    doc.text('Photo du local technique', margin + 3, y + 4.3)
    doc.setTextColor(0)
    y += 6
    try {
      doc.addImage(rapport.photoLocalTechniqueUrl, 'JPEG', margin + 40, y + 2, 50, 37)
      y += 42
    } catch { y += 5 }
  }

  sectionSpacer()

  // ── SECTION: PAVILLON / APPARTEMENT ──
  tableHeader('PAVILLON / APPARTEMENT')

  if (rapport.photoPavillonUrl) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(26, 60, 100)
    doc.setTextColor(255, 255, 255)
    doc.rect(margin, y, W - margin * 2, 6, 'F')
    doc.text("Photo du pavillon ou de l'appartement", margin + 3, y + 4.3)
    doc.setTextColor(0)
    y += 6
    try {
      doc.addImage(rapport.photoPavillonUrl, 'JPEG', margin + 40, y + 2, 50, 37)
      y += 42
    } catch { y += 5 }
  }

  if (rapport.gpsLat && rapport.gpsLng) {
    fullRow('Localisation GPS', `${rapport.gpsLat}, ${rapport.gpsLng}`)
  } else {
    fullRow('Localisation GPS', '—')
  }

  // Check if we need a new page
  if (y > 220) {
    addFooter()
    doc.addPage()
    y = 20
  } else {
    sectionSpacer()
  }

  // ── SECTION: NOTES / OBSERVATIONS ──
  tableHeader('NOTE / OBSERVATIONS')
  if (rapport.notes) {
    const lines = doc.splitTextToSize(rapport.notes, W - margin * 2 - 6)
    const notesH = Math.max(lines.length * 5 + 8, 30)
    doc.setDrawColor(200, 210, 220)
    doc.setFillColor(252, 252, 252)
    doc.rect(margin, y, W - margin * 2, notesH, 'FD')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    doc.text(lines, margin + 3, y + 6)
    y += notesH
  } else {
    doc.setDrawColor(200, 210, 220)
    doc.setFillColor(252, 252, 252)
    doc.rect(margin, y, W - margin * 2, 25, 'FD')
    y += 25
  }

  sectionSpacer()

  // ── SECTION: SIGNATURE ──
  if (y > 220) {
    addFooter()
    doc.addPage()
    y = 20
  }

  tableHeader('SIGNATURE DU RAPPORT')

  const sigBoxW = (W - margin * 2) / 2 - 5
  // Signature box
  doc.setDrawColor(200, 210, 220)
  doc.setFillColor(252, 252, 252)
  doc.rect(margin, y, sigBoxW, 40, 'FD')

  if (rapport.signatureTechnicien) {
    try {
      doc.addImage(rapport.signatureTechnicien, 'PNG', margin + 5, y + 3, sigBoxW - 10, 28)
    } catch {}
  }

  // Signature lines
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80)
  const sigDate = rapport.signedAt ? formatDateTime(rapport.signedAt) : '—'
  doc.text(sigDate, margin + 2, y + 36)
  doc.line(margin + 2, y + 38.5, margin + sigBoxW - 2, y + 38.5)
  doc.text('Date et heure de signature', margin + 2, y + 40)

  y += 45

  addFooter()

  // ── SAVE ──
  doc.save(`${rapport.reference}_rapport.pdf`)
}

// ─── FORM COMPONENT ──────────────────────────────────────────────────────
function RapportForm({ initial, devisList, onSubmit, onCancel, submitting }: {
  initial: typeof emptyForm
  devisList: Devis[]
  onSubmit: (data: any) => void
  onCancel: () => void
  submitting: boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const F = (key: keyof typeof emptyForm, label: string, opts?: { type?: string; placeholder?: string; cols?: boolean }) => (
    <div className={opts?.cols ? 'col-span-2' : ''}>
      <Label>{label}</Label>
      <Input
        type={opts?.type || 'text'}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={opts?.placeholder || ''}
      />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Infos générales */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informations générales</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Titre du rapport *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: POI #9" />
          </div>
          <div>
            <Label>Type de support</Label>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.typeSupport}
              onChange={e => set('typeSupport', e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              {SUPPORT_TYPES.map(t => <option key={t} value={t}>{SUPPORT_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <Label>Devis associé (optionnel)</Label>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.devisId}
              onChange={e => set('devisId', e.target.value)}
            >
              <option value="">— Aucun —</option>
              {devisList.map(d => (
                <option key={d.id} value={d.id}>{d.reference} — {d.clientName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Localisation */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Localisation du site</h4>
        <div className="grid grid-cols-2 gap-3">
          {F('batiment', 'Bâtiment ou Pavillon', { placeholder: 'Ex: IMB' })}
          {F('batimentChoix', 'Choix du bâtiment', { placeholder: 'Ex: Bat E' })}
          {F('hall', 'Hall', { placeholder: 'Ex: Hall 4' })}
          {F('appartement', 'Appartement', { placeholder: 'Ex: App 4' })}
        </div>
      </div>

      {/* Local technique */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Local technique</h4>
        <div className="grid grid-cols-2 gap-3">
          {F('localTechnique', 'Type de local', { placeholder: 'Ex: Chambre' })}
          <div className="col-span-2">
            <Label>Localisation du local technique</Label>
            <Input value={form.localTechniqueLocalisation} onChange={e => set('localTechniqueLocalisation', e.target.value)} placeholder="Ex: Route de la Crique Fouillée, Remire-Montjoly" />
          </div>
          <div className="col-span-2">
            <Label>URL photo du local technique</Label>
            <Input value={form.photoLocalTechniqueUrl} onChange={e => set('photoLocalTechniqueUrl', e.target.value)} placeholder="https://…" />
          </div>
        </div>
      </div>

      {/* Pavillon */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pavillon / Appartement</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>URL photo du pavillon</Label>
            <Input value={form.photoPavillonUrl} onChange={e => set('photoPavillonUrl', e.target.value)} placeholder="https://…" />
          </div>
          {F('gpsLat', 'Latitude GPS', { placeholder: '4.93...' })}
          {F('gpsLng', 'Longitude GPS', { placeholder: '-52.32...' })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notes / Observations</h4>
        <Textarea
          rows={4}
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Observations, anomalies constatées…"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button
          loading={submitting}
          onClick={() => onSubmit(form)}
          disabled={!form.title.trim()}
        >
          <FileText className="w-4 h-4" />
          Enregistrer le rapport
        </Button>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────
export default function RapportsPage() {
  const [rapports, setRapports] = useState<Rapport[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('ALL')
  const [stats, setStats] = useState({ total: 0, draft: 0, signed: 0, archived: 0, thisMonth: 0 })

  // Modals
  const [createOpen, setCreateOpen] = useState(false)
  const [editRapport, setEditRapport] = useState<Rapport | null>(null)
  const [viewRapport, setViewRapport] = useState<Rapport | null>(null)
  const [signRapport, setSignRapport] = useState<Rapport | null>(null)
  const [signature, setSignature] = useState<string | null>(null)

  const [devisList, setDevisList] = useState<Devis[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [signing, setSigning] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, statsRes] = await Promise.all([
        rapportsApi.getAll({
          page, limit: 15,
          search: search || undefined,
          status: tab !== 'ALL' ? tab : undefined,
        }),
        rapportsApi.getStats(),
      ])
      setRapports(Array.isArray(res) ? res : res.data || [])
      setTotal(typeof res === 'object' && 'total' in res ? (res as any).total : 0)
      setStats(statsRes)
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }, [page, search, tab])

  useEffect(() => { load() }, [load])

  // Load devis for association
  useEffect(() => {
    devisApi.getAll({ limit: 100, status: 'ACCEPTED' })
      .then(res => setDevisList(Array.isArray(res) ? res : res.data || []))
      .catch(() => {})
  }, [])

  const handleCreate = async (form: any) => {
    setSubmitting(true)
    try {
      const data: any = { ...form }
      if (!data.devisId) delete data.devisId
      if (!data.typeSupport) delete data.typeSupport
      if (data.gpsLat) data.gpsLat = parseFloat(data.gpsLat)
      if (data.gpsLng) data.gpsLng = parseFloat(data.gpsLng)
      await rapportsApi.create(data)
      toast.success('Rapport créé avec succès')
      setCreateOpen(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création')
    }
    setSubmitting(false)
  }

  const handleUpdate = async (form: any) => {
    if (!editRapport) return
    setSubmitting(true)
    try {
      const data: any = { ...form }
      if (!data.devisId) delete data.devisId
      if (!data.typeSupport) delete data.typeSupport
      if (data.gpsLat) data.gpsLat = parseFloat(data.gpsLat)
      if (data.gpsLng) data.gpsLng = parseFloat(data.gpsLng)
      await rapportsApi.update(editRapport.id, data)
      toast.success('Rapport mis à jour')
      setEditRapport(null)
      load()
    } catch { toast.error('Erreur') }
    setSubmitting(false)
  }

  const handleSign = async () => {
    if (!signRapport || !signature) return
    setSigning(true)
    try {
      await rapportsApi.sign(signRapport.id, { signatureTechnicien: signature })
      toast.success('Rapport signé avec succès')
      setSignRapport(null)
      setSignature(null)
      load()
    } catch { toast.error('Erreur lors de la signature') }
    setSigning(false)
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Archiver ce rapport ?')) return
    try {
      await rapportsApi.archive(id)
      toast.success('Rapport archivé')
      load()
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement ce rapport ?')) return
    try {
      await rapportsApi.delete(id)
      toast.success('Rapport supprimé')
      load()
    } catch { toast.error('Erreur') }
  }

  const handleDownloadPDF = async (r: Rapport) => {
    try {
      // Get full rapport if needed
      const full = await rapportsApi.getOne(r.id)
      await generatePDF(full)
      toast.success('PDF généré avec succès')
    } catch (err) {
      toast.error('Erreur lors de la génération PDF')
    }
  }

  const openEdit = (r: Rapport) => {
    setEditRapport(r)
  }

  const totalPages = Math.ceil(total / 15)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rapports d'intervention"
        description={`${stats.total} rapport${stats.total > 1 ? 's' : ''} au total`}
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouveau rapport
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ce mois', value: stats.thisMonth, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Brouillons', value: stats.draft, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
          { label: 'Signés', value: stats.signed, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
          { label: 'Archivés', value: stats.archived, color: 'text-gray-500', bg: 'bg-muted' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
                <span className={cn('font-display font-bold text-lg', s.color)}>{s.value}</span>
              </div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Rechercher par titre, référence, bâtiment…"
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
                { label: 'Brouillons', value: 'DRAFT', count: stats.draft },
                { label: 'Signés', value: 'SIGNED', count: stats.signed },
                { label: 'Archivés', value: 'ARCHIVED' },
              ]}
              value={tab}
              onChange={v => { setTab(v); setPage(1) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <Card><CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent></Card>
      ) : rapports.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="Aucun rapport"
          description="Créez votre premier rapport d'intervention"
          action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" />Nouveau rapport</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rapports.map(r => {
            const s = STATUS_CONFIG[r.status]
            const StatusIcon = s.icon
            return (
              <Card key={r.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{r.reference}</span>
                        <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', s.cls)}>
                          <StatusIcon className="w-3 h-3" />
                          {s.label}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-foreground text-sm leading-tight">{r.title}</h3>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 mb-4">
                    {r.typeSupport && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {SUPPORT_LABELS[r.typeSupport]}
                      </p>
                    )}
                    {(r.batiment || r.batimentChoix) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-muted-foreground/60" />
                        {[r.batiment, r.batimentChoix, r.hall, r.appartement].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {r.author && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="w-3 h-3 text-muted-foreground/60" />
                        {r.author.firstName} {r.author.lastName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-muted-foreground/60" />
                      {formatDate(r.createdAt)}
                    </p>
                    {r.devis && (
                      <p className="text-xs text-primary/80 flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        {r.devis.reference} — {r.devis.clientName}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => setViewRapport(r)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(r)}>
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </Button>
                    {r.status === 'DRAFT' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" onClick={() => { setSignRapport(r); setSignature(null) }}>
                          <PenLine className="w-3.5 h-3.5" />
                          Signer
                        </Button>
                      </>
                    )}
                    {r.status === 'SIGNED' && (
                      <Button size="sm" variant="outline" onClick={() => handleArchive(r.id)}>
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive ml-auto"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouveau rapport d'intervention" size="xl">
        <RapportForm
          initial={emptyForm}
          devisList={devisList}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          submitting={submitting}
        />
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal
        open={!!editRapport}
        onClose={() => setEditRapport(null)}
        title="Modifier le rapport"
        size="xl"
      >
        {editRapport && (
          <RapportForm
            initial={{
              title: editRapport.title || '',
              typeSupport: editRapport.typeSupport || '',
              devisId: editRapport.devisId || '',
              batiment: editRapport.batiment || '',
              batimentChoix: editRapport.batimentChoix || '',
              hall: editRapport.hall || '',
              appartement: editRapport.appartement || '',
              localTechnique: editRapport.localTechnique || '',
              localTechniqueLocalisation: editRapport.localTechniqueLocalisation || '',
              photoLocalTechniqueUrl: editRapport.photoLocalTechniqueUrl || '',
              photoPavillonUrl: editRapport.photoPavillonUrl || '',
              gpsLat: editRapport.gpsLat?.toString() || '',
              gpsLng: editRapport.gpsLng?.toString() || '',
              notes: editRapport.notes || '',
            }}
            devisList={devisList}
            onSubmit={handleUpdate}
            onCancel={() => setEditRapport(null)}
            submitting={submitting}
          />
        )}
      </Modal>

      {/* ── DETAIL MODAL ── */}
      <Modal open={!!viewRapport} onClose={() => setViewRapport(null)} title="Détail du rapport" size="lg">
        {viewRapport && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-muted-foreground">{viewRapport.reference}</span>
                <h3 className="font-display font-semibold text-lg text-foreground mt-0.5">{viewRapport.title}</h3>
              </div>
              <span className={cn('text-xs px-2 py-1 rounded-full font-medium', STATUS_CONFIG[viewRapport.status]?.cls)}>
                {STATUS_CONFIG[viewRapport.status]?.label}
              </span>
            </div>

            {[
              { label: 'Type de support', value: SUPPORT_LABELS[viewRapport.typeSupport || ''] },
              { label: 'Bâtiment', value: [viewRapport.batiment, viewRapport.batimentChoix].filter(Boolean).join(' — ') },
              { label: 'Hall / Appartement', value: [viewRapport.hall, viewRapport.appartement].filter(Boolean).join(' / ') },
              { label: 'Local technique', value: viewRapport.localTechnique },
              { label: 'Localisation locale', value: viewRapport.localTechniqueLocalisation },
              { label: 'Auteur', value: viewRapport.author ? `${viewRapport.author.firstName} ${viewRapport.author.lastName}` : '—' },
              { label: 'Créé le', value: formatDateTime(viewRapport.createdAt) },
              { label: 'Signé le', value: viewRapport.signedAt ? formatDateTime(viewRapport.signedAt) : '—' },
            ].map(({ label, value }) => value ? (
              <div key={label} className="flex gap-3 py-2 border-b border-border last:border-0">
                <span className="w-44 shrink-0 text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ) : null)}

            {viewRapport.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
                <div className="bg-muted/50 rounded-xl p-4 text-foreground leading-relaxed">{viewRapport.notes}</div>
              </div>
            )}

            {viewRapport.signatureTechnicien && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Signature</p>
                <div className="border border-border rounded-xl p-3 bg-muted/20">
                  <img src={viewRapport.signatureTechnicien} alt="Signature" className="max-h-20 object-contain" />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button onClick={() => handleDownloadPDF(viewRapport)}>
                <Download className="w-4 h-4" />Télécharger PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── SIGN MODAL ── */}
      <Modal
        open={!!signRapport}
        onClose={() => { setSignRapport(null); setSignature(null) }}
        title="Signature du rapport"
        description={`Rapport : ${signRapport?.reference} — ${signRapport?.title}`}
        size="md"
      >
        {signRapport && (
          <div className="space-y-4">
            {!signature ? (
              <SignaturePadComponent
                onSign={setSignature}
                onClear={() => setSignature(null)}
              />
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-emerald-500/30 rounded-xl p-4 bg-emerald-50 dark:bg-emerald-900/10">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Signature capturée
                  </p>
                  <img src={signature} alt="Signature" className="max-h-24 object-contain" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Horodatage : {new Date().toLocaleString('fr-FR')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSignature(null)}
                >
                  <X className="w-4 h-4" />Recommencer
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => { setSignRapport(null); setSignature(null) }}>Annuler</Button>
              <Button
                loading={signing}
                disabled={!signature}
                onClick={handleSign}
              >
                <PenLine className="w-4 h-4" />
                Valider et signer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
