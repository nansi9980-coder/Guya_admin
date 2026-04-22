// ─── SERVICES PAGE ────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react'
import { servicesApi } from '@/api'
import type { Service } from '@/types'
import { cn } from '@/lib/utils'
import {
  Card, CardContent, CardHeader, CardTitle, PageHeader, Button,
  Input, Label, Textarea, Switch, Spinner, EmptyState, Modal,
} from '@/components/ui'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Wrench, Eye, EyeOff, GripVertical } from 'lucide-react'

const emptyService: Partial<Service> = {
  name: '', slug: '', shortDescription: '', fullDescription: '', icon: '', isActive: true, order: 0
}

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
            <Card key={s.id} className={cn(!s.isActive && 'opacity-60')}>
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
          <div><Label>Description complète</Label><Textarea rows={4} value={form.fullDescription || ''} onChange={e => setForm(f => ({ ...f, fullDescription: e.target.value }))} placeholder="Description détaillée…" /></div>
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
