import { useEffect, useState, useCallback, useRef } from 'react'
import { realisationsApi, mediasApi } from '@/api'
import type { Realisation } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import {
  Card, CardContent, PageHeader, Button, Input, Label,
  Textarea, Switch, Spinner, EmptyState, Modal,
} from '@/components/ui'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, FolderKanban, Eye, EyeOff, MapPin, Star, Upload, X, ImageIcon } from 'lucide-react'

const emptyForm: Partial<Realisation> = {
  title: '', slug: '', description: '', category: '', location: '',
  client: '', isPublished: false, featured: false, images: [],
}

// ─── Image Upload Field ──────────────────────────────────────────────────────
function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    if (!file) return
    setUploading(true)
    try {
      const media = await mediasApi.upload(file, 'Couverture de réalisation')
      onChange(media.url)
      toast.success('Image téléchargée')
    } catch {
      toast.error('Erreur lors du téléchargement')
    }
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  return (
    <div>
      <Label>{label}</Label>
      {value ? (
        <div className="relative mt-1 rounded-xl overflow-hidden border border-border group">
          <img src={value} alt="preview" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white/90 text-xs font-medium rounded-lg text-foreground hover:bg-white transition-colors"
            >
              Changer
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 bg-white/90 rounded-lg text-destructive hover:bg-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="mt-1 border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
        >
          {uploading ? (
            <Spinner size="md" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Glissez une image ici ou <span className="text-primary font-medium">parcourir</span>
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP jusqu'à 10 Mo</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ─── Multi-image Upload Field ────────────────────────────────────────────────
function MultiImageUploadField({
  value,
  onChange,
}: {
  value: string[]
  onChange: (urls: string[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      try {
        const media = await mediasApi.upload(file, 'Image de réalisation')
        newUrls.push(media.url)
      } catch {
        toast.error(`Erreur: ${file.name}`)
      }
    }
    if (newUrls.length > 0) {
      onChange([...value, ...newUrls])
      toast.success(`${newUrls.length} image(s) ajoutée(s)`)
    }
    setUploading(false)
  }

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <Label>Images du projet</Label>
      <div className="mt-1 space-y-2">
        {value.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {value.map((url, i) => (
              <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                <img src={url} alt={`image-${i}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
        >
          {uploading ? (
            <Spinner size="sm" />
          ) : (
            <>
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Ajouter des images depuis votre appareil</span>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => {
            if (e.target.files?.length) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RealisationsPage() {
  const [items, setItems] = useState<Realisation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Realisation | null>(null)
  const [form, setForm] = useState(emptyForm)
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

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (r: Realisation) => { setEditItem(r); setForm(r); setModalOpen(true) }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (editItem) await realisationsApi.update(editItem.id, form)
      else await realisationsApi.create(form)
      toast.success(editItem ? 'Réalisation mise à jour' : 'Réalisation créée')
      setModalOpen(false); load()
    } catch { toast.error('Erreur') }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette réalisation ?')) return
    try { await realisationsApi.delete(id); toast.success('Supprimée'); load() }
    catch { toast.error('Erreur') }
  }

  const togglePublish = async (r: Realisation) => {
    try {
      await realisationsApi.togglePublish(r.id, !r.isPublished)
      toast.success(r.isPublished ? 'Dépublié' : 'Publié')
      load()
    } catch { toast.error('Erreur') }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Réalisations"
        description="Gérez vos projets et réalisations affichés sur le site"
        action={<Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" />Nouvelle réalisation</Button>}
      />
      {loading ? (
        <Card><CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent></Card>
      ) : items.length === 0 ? (
        <EmptyState icon={<FolderKanban className="w-6 h-6" />} title="Aucune réalisation" action={<Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" />Ajouter</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(r => (
            <Card key={r.id} className={cn(!r.isPublished && 'opacity-70')}>
              <div className="aspect-video bg-muted rounded-t-xl overflow-hidden">
                {r.coverImage || r.images?.[0] ? (
                  <img src={r.coverImage || r.images[0]} alt={r.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <FolderKanban className="w-8 h-8" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-semibold text-foreground text-sm leading-tight">{r.title}</h3>
                  {r.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />{r.location}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{r.category}</span>
                <div className="flex items-center gap-1 mt-3">
                  <button onClick={() => togglePublish(r)} className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all',
                    r.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}>
                    {r.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {r.isPublished ? 'Publié' : 'Brouillon'}
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
            <div><Label>Titre</Label><Input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Slug</Label><Input value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Catégorie</Label><Input value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: FTTH, Maintenance…" /></div>
            <div><Label>Localisation</Label><Input value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
          </div>
          <div><Label>Client</Label><Input value={form.client || ''} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} /></div>
          <div><Label>Description</Label><Textarea rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>

          {/* Image de couverture — upload depuis l'appareil */}
          <ImageUploadField
            label="Image de couverture"
            value={form.coverImage || ''}
            onChange={url => setForm(f => ({ ...f, coverImage: url }))}
          />

          {/* Images supplémentaires — upload multiple */}
          <MultiImageUploadField
            value={form.images || []}
            onChange={urls => setForm(f => ({ ...f, images: urls }))}
          />

          <div className="flex items-center justify-between"><Label className="mb-0">Publié</Label><Switch checked={form.isPublished ?? false} onChange={v => setForm(f => ({ ...f, isPublished: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="mb-0">Mis en avant</Label><Switch checked={form.featured ?? false} onChange={v => setForm(f => ({ ...f, featured: v }))} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button loading={submitting} onClick={handleSubmit}>{editItem ? 'Mettre à jour' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
