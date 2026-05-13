import { useEffect, useState } from 'react'
import { siteContentApi } from '@/api'
import {
  Card, CardContent, PageHeader, Button, Input, Label, Textarea, Spinner, EmptyState, Modal,
} from '@/components/ui'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Star, Quote, X, Save, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Testimonial {
  initials: string
  name: string
  role: string
  company: string
  rating: number
  quote: string
}

const EMPTY_TESTIMONIAL: Testimonial = {
  initials: '',
  name: '',
  role: '',
  company: '',
  rating: 5,
  quote: '',
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
      <span className="text-xs text-muted-foreground ml-2 font-medium">{value}/5</span>
    </div>
  )
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [form, setForm] = useState<Testimonial>(EMPTY_TESTIMONIAL)

  useEffect(() => {
    loadTestimonials()
  }, [])

  const loadTestimonials = async () => {
    setLoading(true)
    try {
      const res = await siteContentApi.getSection('testimonials')
      const list = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : []
      setTestimonials(list)
    } catch {
      setTestimonials([])
    }
    setLoading(false)
  }

  const openAdd = () => {
    setEditIndex(null)
    setForm(EMPTY_TESTIMONIAL)
    setModalOpen(true)
  }

  const openEdit = (index: number) => {
    setEditIndex(index)
    setForm({ ...testimonials[index] })
    setModalOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name || !form.quote) {
      toast.error('Le nom et le témoignage sont requis')
      return
    }

    const next = [...testimonials]
    if (editIndex !== null) {
      next[editIndex] = form
    } else {
      next.push(form)
    }
    
    setTestimonials(next)
    setDirty(true)
    setModalOpen(false)
    toast.success(editIndex !== null ? 'Témoignage modifié' : 'Témoignage ajouté')
  }

  const handleRemove = (index: number) => {
    if (!confirm('Supprimer cet avis client ?')) return
    setTestimonials(prev => prev.filter((_, i) => i !== index))
    setDirty(true)
    toast.success('Avis supprimé de la liste (n\'oubliez pas de sauvegarder)')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await siteContentApi.updateSection('testimonials', testimonials as any)
      toast.success('Avis clients mis à jour sur le site')
      setDirty(false)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  const handleReset = async () => {
    if (!confirm('Réinitialiser les avis aux valeurs par défaut ?')) return
    try {
      await siteContentApi.resetSection('testimonials')
      toast.success('Avis réinitialisés')
      loadTestimonials()
      setDirty(false)
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Avis Clients"
        description="Gérez les témoignages et recommandations affichés sur le site"
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={openAdd} className="bg-background">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Témoignage
            </Button>
            <Button 
              onClick={handleSave} 
              loading={saving} 
              disabled={!dirty}
              className={cn(dirty && "ring-2 ring-primary ring-offset-2 animate-pulse-subtle")}
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        }
      />

      {dirty && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 px-4 py-2 rounded-lg text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Vous avez des modifications non enregistrées</span>
          </div>
          <button onClick={() => setDirty(false)} className="text-xs hover:underline">Ignorer</button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground animate-pulse">Chargement des avis...</p>
        </div>
      ) : testimonials.length === 0 ? (
        <EmptyState
          icon={<Quote className="w-10 h-10" />}
          title="Aucun témoignage"
          description="Partagez l'expérience de vos clients pour renforcer votre crédibilité."
          action={
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter le premier avis
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i} className="group relative hover:shadow-xl transition-all duration-300 border-border/60 bg-card overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-gradient-to-l from-background/80 to-transparent z-20">
                <button onClick={() => openEdit(i)} className="p-2 rounded-full bg-white shadow-lg text-primary hover:scale-110 transition-transform">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleRemove(i)} className="p-2 rounded-full bg-white shadow-lg text-destructive hover:scale-110 transition-transform">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-lg border border-primary/20">
                    {t.initials || (t.name ? t.name.charAt(0) : '?')}
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground leading-tight">{t.name}</h4>
                    <p className="text-xs text-muted-foreground">{t.role}{t.company ? ` @ ${t.company}` : ''}</p>
                  </div>
                </div>

                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, starI) => (
                    <Star key={starI} className={cn("w-3.5 h-3.5", starI < t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
                  ))}
                </div>

                <div className="relative">
                  <Quote className="w-8 h-8 text-primary/5 absolute -top-2 -left-2" />
                  <p className="text-sm text-foreground/80 leading-relaxed italic relative z-10 line-clamp-4">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
              </CardContent>
              
              <div className="h-1 w-full bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Card>
          ))}
        </div>
      )}

      {testimonials.length > 0 && (
        <div className="flex justify-between items-center pt-8 border-t border-border/50">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive">
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            Réinitialiser par défaut
          </Button>
          <p className="text-xs text-muted-foreground italic">
            Ordre d'affichage tel qu'apparaissant ci-dessus
          </p>
        </div>
      )}

      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editIndex !== null ? 'Modifier le témoignage' : 'Nouveau témoignage'}
        size="lg"
      >
        <div className="space-y-6 px-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du client *</Label>
              <Input 
                id="name"
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                placeholder="Ex: Jean Dupont" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initials">Initiales (Avatar)</Label>
              <Input 
                id="initials"
                value={form.initials} 
                onChange={e => setForm({ ...form, initials: e.target.value.toUpperCase().slice(0, 3) })} 
                placeholder="Ex: JD"
                maxLength={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="role">Rôle / Poste</Label>
              <Input 
                id="role"
                value={form.role} 
                onChange={e => setForm({ ...form, role: e.target.value })} 
                placeholder="Ex: Responsable DSI" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Entreprise / Lieu</Label>
              <Input 
                id="company"
                value={form.company} 
                onChange={e => setForm({ ...form, company: e.target.value })} 
                placeholder="Ex: Mairie de Cayenne" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note globale</Label>
            <StarRating 
              value={form.rating} 
              onChange={v => setForm({ ...form, rating: v })} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote">Le témoignage *</Label>
            <Textarea 
              id="quote"
              rows={4}
              value={form.quote} 
              onChange={e => setForm({ ...form, quote: e.target.value })} 
              placeholder="Ce que le client dit de vos services..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>
              {editIndex !== null ? 'Mettre à jour' : 'Ajouter le témoignage'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}