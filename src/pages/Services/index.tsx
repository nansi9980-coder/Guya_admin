// ─── SERVICES PAGE ────────────────────────────────────────────────────────
import { useEffect, useState, useCallback, useRef } from 'react'
import { servicesApi, mediasApi } from '@/api'
import type { Service } from '@/types'
import { cn } from '@/lib/utils'
import {
  Card, CardContent, PageHeader, Button,
  Input, Label, Textarea, Switch, Spinner, EmptyState, Modal,
} from '@/components/ui'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Wrench, Upload, X } from 'lucide-react'

const emptyService: Partial<Service> = {
  name: '', slug: '', shortDescription: '', fullDescription: '', icon: '', image: '', isActive: true, order: 0
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
    setUploading(true)
    try {
      const media = await mediasApi.upload(file, 'Image de service')
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
          <img src={value} alt="preview" className="w-full h-36 object-cover" />
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
          className="mt-1 border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
        >
          {uploading ? (
            <Spinner size="md" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Glissez une image ou <span className="text-primary font-medium">parcourir</span>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Service | null>(null)
  const [form, setForm] = useState(emptyService)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await servicesApi.getAll()
      setServices(Array.isArray(res) ? res : res.data || [])
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditItem(null); setForm(emptyService); setModalOpen(true) }
  const openEdit = (s: Service) => { setEditItem(s); setForm(s); setModalOpen(true) }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (editItem) await servicesApi.update(editItem.id, form)
      else await servicesApi.create(form)
      toast.success(editItem ? 'Service mis à jour' : 'Service créé')
      setModalOpen(false)
      load()
    } catch { toast.error('Erreur') }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce service ?')) return
    try { await servicesApi.delete(id); toast.success('Supprimé'); load() }
    catch { toast.error('Erreur') }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Services"
        description="Gérez les services proposés sur votre site vitrine"
        action={<Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" />Nouveau service</Button>}
      />
      {loading ? (
        <Card><CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent></Card>
      ) : services.length === 0 ? (
        <EmptyState icon={<Wrench className="w-6 h-6" />} title="Aucun service" action={<Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" />Créer un service</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <Card key={s.id} className={cn(!s.isActive && 'opacity-60')}>
              {s.image && (
                <div className="aspect-video rounded-t-xl overflow-hidden">
                  <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                    {s.icon || '🔧'}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="font-display font-semibold text-foreground">{s.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.shortDescription}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    s.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                  )}>
                    {s.isActive ? 'Actif' : 'Inactif'}
                  </span>
                  <span className="text-xs text-muted-foreground">Ordre: {s.order}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Modifier le service' : 'Nouveau service'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nom</Label><Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom du service" /></div>
            <div><Label>Slug</Label><Input value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="nom-du-service" /></div>
          </div>
          <div><Label>Description courte</Label><Input value={form.shortDescription || ''} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} placeholder="Résumé court" /></div>
          <div><Label>Description complète</Label><Textarea rows={3} value={form.fullDescription || ''} onChange={e => setForm(f => ({ ...f, fullDescription: e.target.value }))} placeholder="Description détaillée…" /></div>

          {/* Image upload depuis l'appareil */}
          <ImageUploadField
            label="Image du service"
            value={form.image || ''}
            onChange={url => setForm(f => ({ ...f, image: url }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Icône (emoji)</Label><Input value={form.icon || ''} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🔧" /></div>
            <div><Label>Ordre d'affichage</Label><Input type="number" value={form.order || 0} onChange={e => setForm(f => ({ ...f, order: +e.target.value }))} /></div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="mb-0">Service actif</Label>
            <Switch checked={form.isActive ?? true} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button loading={submitting} onClick={handleSubmit}>{editItem ? 'Mettre à jour' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
