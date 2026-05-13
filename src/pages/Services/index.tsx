import { useEffect, useState, useCallback, useRef } from 'react'
import { servicesApi, mediasApi } from '@/api'
import type { Service } from '@/types'
import { cn } from '@/lib/utils'
import { getMediaUrl } from '@/lib/media'
import {
  Card, CardContent, PageHeader, Button,
  Input, Label, Textarea, Switch, Spinner, EmptyState, Modal,
} from '@/components/ui'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Wrench, X, ImageIcon } from 'lucide-react'

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const emptyService = (): Partial<Service> => ({
  slug: '',
  number: '',
  icon: '',
  titleFr: '',
  titleEn: '',
  descFr: '',
  descEn: '',
  features: [],
  image: '',
  benefit: '',
  isActive: true,
  order: 0,
})

function FeaturesField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')
  const add = () => {
    const f = input.trim()
    if (f && !value.includes(f)) { onChange([...value, f]); setInput('') }
  }
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {value.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="flex-1 px-3 py-1.5 rounded-lg bg-muted text-foreground">{f}</span>
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Ex: Installation rapide (Entrée pour ajouter)"
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>Ajouter</Button>
      </div>
    </div>
  )
}

function ImageUploadBtn({ value, onChange }: { value?: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const media = await mediasApi.upload(file, 'Image service')
      onChange(media.url)
      toast.success('Image uploadée')
    } catch { toast.error("Erreur upload") }
    setUploading(false)
  }
  return (
    <div className="space-y-2">
      {value && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border border-border">
          <img src={getMediaUrl(value)} alt="Service" className="w-full h-full object-cover" />
          <button onClick={() => onChange('')} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div
        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Spinner size="sm" /> : (
          <>
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Glissez ou <span className="text-primary font-medium">parcourir</span></p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
    </div>
  )
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Service | null>(null)
  const [form, setForm] = useState<Partial<Service>>(emptyService())
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

  const openCreate = () => { setEditItem(null); setForm(emptyService()); setModalOpen(true) }
  const openEdit = (s: Service) => { setEditItem(s); setForm({ ...s }); setModalOpen(true) }

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
    if (!form.number?.trim()) { toast.error('Le numéro est requis (ex: 01)'); return }
    if (!form.icon?.trim()) { toast.error("L'icône est requise"); return }
    if (!form.features || form.features.length === 0) { toast.error('Au moins une fonctionnalité est requise'); return }

    setSubmitting(true)
    try {
      const payload = {
        slug: form.slug,
        number: form.number,
        icon: form.icon,
        titleFr: form.titleFr,
        titleEn: form.titleEn,
        titleEs: form.titleEs,
        titlePt: form.titlePt,
        titleNl: form.titleNl,
        titleGcr: form.titleGcr,
        descFr: form.descFr,
        descEn: form.descEn,
        features: form.features || [],
        image: form.image,
        benefit: form.benefit,
        ...(editItem ? { isActive: form.isActive } : {}),
      }
      if (editItem) await servicesApi.update(editItem.id, payload)
      else await servicesApi.create(payload)
      toast.success(editItem ? 'Service mis à jour' : 'Service créé')
      setModalOpen(false)
      load()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce service ?')) return
    try { await servicesApi.delete(id); toast.success('Supprimé'); load() }
    catch { toast.error('Erreur') }
  }

  const handleToggle = async (s: Service) => {
    try {
      await servicesApi.toggle(s.id)
      toast.success(s.isActive ? 'Désactivé' : 'Activé')
      load()
    } catch { toast.error('Erreur') }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Services"
        description="Gérez les services proposés sur votre site"
        action={<Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" />Nouveau service</Button>}
      />
      {loading ? (
        <Card><CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent></Card>
      ) : services.length === 0 ? (
        <EmptyState icon={<Wrench className="w-6 h-6" />} title="Aucun service" action={<Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" />Créer un service</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <Card key={s.id} className={cn(!s.isActive && 'opacity-60', "group")}>
              <CardContent className="p-0 overflow-hidden">
                <div className="aspect-video relative overflow-hidden bg-muted border-b">
                  {s.image ? (
                    <img src={getMediaUrl(s.image)} alt={s.titleFr} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <div className="px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm text-[10px] font-bold text-primary border border-border/50 shadow-sm">
                      #{s.number}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                     <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-white transition-all text-muted-foreground border border-border/50 shadow-sm"><Edit className="w-3.5 h-3.5" /></button>
                     <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-white transition-all text-muted-foreground border border-border/50 shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{s.icon || '🔧'}</span>
                    <h3 className="font-display font-semibold text-foreground leading-tight">{s.titleFr}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{s.descFr}</p>
                  
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(s)}
                        className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider cursor-pointer transition-all border shadow-sm',
                          s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                        )}
                      >
                        {s.isActive ? 'Actif' : 'Inactif'}
                      </button>
                      <span className="text-[10px] text-muted-foreground/60 font-medium">Ordre: {s.order}</span>
                    </div>
                    {s.features && s.features.length > 0 && (
                      <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground font-medium">{s.features.length} points</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Modifier le service' : 'Nouveau service'} size="lg">
        <div className="space-y-5 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titre (FR) *</Label>
              <Input value={form.titleFr || ''} onChange={e => handleTitleChange(e.target.value)} placeholder="Ex: Déploiement fibre optique" />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="deploiement-fibre-optique" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Numéro * (ex: 01)</Label>
              <Input value={form.number || ''} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="01" />
            </div>
            <div className="space-y-2">
              <Label>Icône (emoji) *</Label>
              <Input value={form.icon || ''} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🔧" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (FR) *</Label>
            <Textarea rows={3} value={form.descFr || ''} onChange={e => setForm(f => ({ ...f, descFr: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Fonctionnalités *</Label>
            <FeaturesField value={form.features || []} onChange={features => setForm(f => ({ ...f, features }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bénéfice clé</Label>
              <Input value={form.benefit || ''} onChange={e => setForm(f => ({ ...f, benefit: e.target.value }))} placeholder="Ex: Connexion ultra-rapide garantie" />
            </div>
             <div className="space-y-2">
              <Label>Ordre d'affichage</Label>
              <Input type="number" value={form.order || 0} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
            <Label className="flex items-center gap-2 text-primary">
              <ImageIcon className="w-4 h-4" />
              Image d'illustration
            </Label>
            <ImageUploadBtn value={form.image} onChange={image => setForm(f => ({ ...f, image }))} />
          </div>

          {editItem && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="mb-0">Service actif</Label>
                <p className="text-[10px] text-muted-foreground">Visible ou masqué pour les visiteurs</p>
              </div>
              <Switch checked={form.isActive ?? true} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border/50">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button loading={submitting} onClick={handleSubmit} className="px-8">{editItem ? 'Mettre à jour' : 'Créer'}</Button>
        </div>
      </Modal>
    </div>
  )
}