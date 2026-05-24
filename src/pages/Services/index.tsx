import { useEffect, useState, useCallback } from 'react'
import { servicesApi } from '@/api'
import type { Service } from '@/types'
import { cn } from '@/lib/utils'
import { SERVICE_ICON_OPTIONS, getServiceIconOption } from '@/lib/service-icons'
import {
  Card, CardContent, PageHeader, Button,
  Input, Label, Textarea, Switch, Spinner, EmptyState, Modal,
} from '@/components/ui'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Wrench, X } from 'lucide-react'

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const emptyService = (): Partial<Service> => ({
  slug: '',
  number: '',
  icon: 'Wifi',
  titleFr: '',
  titleEn: '',
  descFr: '',
  descEn: '',
  features: [],
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
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
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

function IconPickerField({ value, onChange }: { value?: string; onChange: (icon: string) => void }) {
  const selected = getServiceIconOption(value)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {selected ? (
            <selected.Icon className="h-6 w-6" />
          ) : (
            <span className="text-2xl leading-none" aria-hidden>{value || '🔧'}</span>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Icône sélectionnée</p>
          <p className="text-sm font-semibold text-foreground">
            {selected?.label ?? 'Emoji actuel — choisissez une icône ci-dessous pour remplacer'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
        {SERVICE_ICON_OPTIONS.map(({ value: iconValue, label, Icon }) => {
          const isSelected = value === iconValue
          return (
            <button
              key={iconValue}
              type="button"
              onClick={() => onChange(iconValue)}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
              )}
            >
              <span className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'
              )}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-foreground leading-tight">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ServiceCardIcon({ icon, size = 'lg' }: { icon?: string; size?: 'sm' | 'lg' }) {
  const option = getServiceIconOption(icon)
  const iconClass = size === 'lg' ? 'h-14 w-14 text-primary' : 'h-5 w-5 text-primary shrink-0'
  if (option) {
    const { Icon } = option
    return <Icon className={iconClass} />
  }
  if (icon?.trim()) {
    return <span className={size === 'lg' ? 'text-5xl leading-none' : 'text-xl leading-none'} aria-hidden>{icon}</span>
  }
  return <Wrench className={iconClass} />
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
        image: '',
        benefit: form.benefit,
        order: form.order ?? 0,
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
                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/10 via-muted/30 to-muted border-b flex items-center justify-center">
                  <ServiceCardIcon icon={s.icon} />
                  <div className="absolute top-2 left-2">
                    <div className="px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm text-[10px] font-bold text-primary border border-border/50 shadow-sm">
                      #{s.number}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                     <button type="button" onClick={() => openEdit(s)} className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-white transition-all text-muted-foreground border border-border/50 shadow-sm"><Edit className="w-3.5 h-3.5" /></button>
                     <button type="button" onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-white transition-all text-muted-foreground border border-border/50 shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ServiceCardIcon icon={s.icon} size="sm" />
                    <h3 className="font-display font-semibold text-foreground leading-tight">{s.titleFr}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{s.descFr}</p>
                  
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
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
          </div>

          <div className="space-y-2">
            <Label>Icône du service *</Label>
            <p className="text-xs text-muted-foreground">Choisissez une icône — elle sera affichée sur le site vitrine à la place d&apos;une image.</p>
            <IconPickerField value={form.icon} onChange={icon => setForm(f => ({ ...f, icon }))} />
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
              <Label>Ordre d&apos;affichage</Label>
              <Input type="number" value={form.order || 0} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} />
            </div>
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
