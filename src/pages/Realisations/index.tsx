import { useEffect, useState, useCallback } from 'react'
import { realisationsApi } from '@/api'
import type { Realisation } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import {
  Card, CardContent, PageHeader, Button, Input, Label,
  Textarea, Switch, Spinner, EmptyState, Modal,
} from '@/components/ui'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, FolderKanban, Eye, EyeOff, MapPin, Star } from 'lucide-react'

const emptyForm: Partial<Realisation> = {
  title: '', slug: '', description: '', category: '', location: '',
  client: '', isPublished: false, featured: false, images: [],
}

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
          <div><Label>Description</Label><Textarea rows={4} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div><Label>Image de couverture (URL)</Label><Input value={form.coverImage || ''} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="https://…" /></div>
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
