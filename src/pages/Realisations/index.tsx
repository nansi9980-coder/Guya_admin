import { useEffect, useState, useCallback, useRef } from 'react'
import { realisationsApi, mediasApi } from '@/api'
import type { Realisation } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import {
  Card, CardContent, PageHeader, Button, Input, Label,
  Textarea, Switch, Spinner, EmptyState, Modal,
} from '@/components/ui'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, FolderKanban, Eye, EyeOff, MapPin, Star, X, ImageIcon, Upload } from 'lucide-react'

const emptyForm = (): Partial<Realisation> => ({
  titleFr: '',
  slug: '',
  descFr: '',
  location: '',
  date: new Date().toISOString().split('T')[0],
  scope: '',
  client: '',
  tags: [],
  images: [],
  isFeatured: false,
  isActive: false,
})

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function ImageUploadField({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const uploads = await Promise.all(
        Array.from(files).map(f => mediasApi.upload(f, 'Image réalisation'))
      )
      onChange([...images, ...uploads.map((m: any) => m.url)])
      toast.success(`${uploads.length} image${uploads.length > 1 ? 's' : ''} uploadée${uploads.length > 1 ? 's' : ''}`)
    } catch { toast.error("Erreur lors de l'upload") }
    setUploading(false)
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border">
              <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">
                  Couverture
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div
        className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        {uploading ? (
          <Spinner size="sm" />
        ) : (
          <>
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center">
              Glissez des images ici ou <span className="text-primary font-medium">parcourir</span>
            </p>
            <p className="text-[11px] text-muted-foreground">La première image sera la couverture</p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />
    </div>
  )
}

function TagsField({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const tag = input.trim()
    if (tag && !value.includes(tag)) { onChange([...value, tag]); setInput('') }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {value.map(t => (
          <span key={t} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
            {t}
            <button onClick={() => onChange(value.filter(x => x !== t))} className="hover:text-primary/70"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Ex: FTTH, Génie civil… (Entrée pour ajouter)"
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>Ajouter</Button>
      </div>
    </div>
  )
}

export default function RealisationsPage() {
  const [items, setItems] = useState<Realisation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Realisation | null>(null)
  const [form, setForm] = useState<Partial<Realisation>>(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await realisationsApi.getAll()
      setItems(Array.isArray(res) ? res : res.data || [])
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditItem(null); setForm(emptyForm()); setModalOpen(true) }
  const openEdit = (r: Realisation) => { setEditItem(r); setForm({ ...r }); setModalOpen(true) }

  const handleTitleChange = (titleFr: string) => {
    setForm(f => ({
      ...f,
      titleFr,
      slug: f.slug && f.slug !== slugify(f.titleFr || '') ? f.slug : slugify(titleFr),
    }))
  }

  const handleSubmit = async () => {
    if (!form.titleFr?.trim()) { toast.error('Le titre est requis'); return }
    if (!form.slug?.trim()) { toast.error('Le slug est requis'); return }
    if (!form.descFr?.trim()) { toast.error('La description est requise'); return }
    if (!form.location?.trim()) { toast.error('La localisation est requise'); return }
    if (!form.date?.trim()) { toast.error('La date est requise'); return }
    if (!form.scope?.trim()) { toast.error("L'envergure est requise"); return }
    if (!form.tags || form.tags.length === 0) { toast.error('Au moins un tag est requis'); return }

    setSubmitting(true)
    try {
      const payload = {
        slug: form.slug,
        titleFr: form.titleFr,
        titleEn: form.titleEn,
        location: form.location,
        date: form.date,
        scope: form.scope,
        descFr: form.descFr,
        descEn: form.descEn,
        tags: form.tags || [],
        images: form.images || [],
        client: form.client,
        isFeatured: form.isFeatured ?? false,
        ...(editItem ? { isActive: form.isActive } : {}),
      }
      if (editItem) await realisationsApi.update(editItem.id, payload)
      else await realisationsApi.create(payload)
      toast.success(editItem ? 'Réalisation mise à jour' : 'Réalisation créée')
      setModalOpen(false)
      load()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette réalisation ?')) return
    try { await realisationsApi.delete(id); toast.success('Supprimée'); load() }
    catch { toast.error('Erreur') }
  }

  const handleToggle = async (r: Realisation) => {
    try {
      await realisationsApi.toggle(r.id)
      toast.success(r.isActive ? 'Désactivé' : 'Activé')
      load()
    } catch { toast.error('Erreur') }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Réalisations"
        description="Gérez vos projets et réalisations"
        action={<Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" />Nouvelle réalisation</Button>}
      />
      {loading ? (
        <Card><CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent></Card>
      ) : items.length === 0 ? (
        <EmptyState icon={<FolderKanban className="w-6 h-6" />} title="Aucune réalisation" action={<Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" />Ajouter</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(r => (
            <Card key={r.id} className={cn(!r.isActive && 'opacity-70')}>
              <div className="aspect-video bg-muted rounded-t-xl overflow-hidden">
                {r.images?.[0] ? (
                  <img src={r.images[0]} alt={r.titleFr} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <FolderKanban className="w-8 h-8" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-semibold text-foreground text-sm leading-tight">{r.titleFr}</h3>
                  {r.isFeatured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />{r.location}</p>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{r.scope}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(r.tags || []).slice(0, 3).map(t => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggle(r)} className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all',
                    r.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}>
                    {r.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {r.isActive ? 'Actif' : 'Inactif'}
                  </button>
                  <div className="flex gap-1 ml-auto">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Modifier la réalisation' : 'Nouvelle réalisation'} size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Titre (FR) *</Label>
              <Input value={form.titleFr || ''} onChange={e => handleTitleChange(e.target.value)} placeholder="Ex: Déploiement FTTH Cayenne" />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="deploiement-ftth-cayenne" />
            </div>
          </div>
          <div>
            <Label>Titre (EN)</Label>
            <Input value={form.titleEn || ''} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))} placeholder="Optional English title" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Localisation *</Label>
              <Input value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: Cayenne" />
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={form.date || ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Envergure / Portée *</Label>
            <Input value={form.scope || ''} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} placeholder="Ex: 1 200 prises résidentielles" />
          </div>
          <div>
            <Label>Client</Label>
            <Input value={form.client || ''} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} />
          </div>
          <div>
            <Label>Description (FR) *</Label>
            <Textarea rows={4} value={form.descFr || ''} onChange={e => setForm(f => ({ ...f, descFr: e.target.value }))} />
          </div>
          <div>
            <Label>Description (EN)</Label>
            <Textarea rows={3} value={form.descEn || ''} onChange={e => setForm(f => ({ ...f, descEn: e.target.value }))} placeholder="Optional English description" />
          </div>
          <div>
            <Label>Tags *</Label>
            <TagsField value={form.tags || []} onChange={tags => setForm(f => ({ ...f, tags }))} />
          </div>
          <div>
            <Label>Images</Label>
            <ImageUploadField images={form.images || []} onChange={images => setForm(f => ({ ...f, images }))} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="mb-0">Mis en avant</Label>
            <Switch checked={form.isFeatured ?? false} onChange={v => setForm(f => ({ ...f, isFeatured: v }))} />
          </div>
          {editItem && (
            <div className="flex items-center justify-between">
              <Label className="mb-0">Actif (visible sur le site)</Label>
              <Switch checked={form.isActive ?? false} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button loading={submitting} onClick={handleSubmit}>{editItem ? 'Mettre à jour' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}