import { useEffect, useState } from 'react'
import { siteContentApi } from '@/api'
import {
  Card, CardContent, PageHeader, Button, Input, Label, Textarea, Spinner,
} from '@/components/ui'
import { toast } from 'sonner'
import { Save, Plus, Trash2, Star, GripVertical } from 'lucide-react'

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
            className={`w-5 h-5 transition-colors ${
              star <= (hovered || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/40'
            }`}
          />
        </button>
      ))}
      <span className="text-xs text-muted-foreground ml-1 self-center">{value}/5</span>
    </div>
  )
}

function TestimonialCard({
  testimonial,
  index,
  onChange,
  onRemove,
}: {
  testimonial: Testimonial
  index: number
  onChange: (t: Testimonial) => void
  onRemove: () => void
}) {
  const f = (key: keyof Testimonial) => ({
    value: String(testimonial[key] || ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...testimonial, [key]: e.target.value }),
  })

  return (
    <div className="p-4 bg-muted/20 rounded-xl border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground/40" />
          <span className="text-sm font-medium text-muted-foreground">Avis #{index + 1}</span>
        </div>
        <button
          onClick={onRemove}
          className="text-xs text-destructive hover:underline flex items-center gap-1 transition-opacity hover:opacity-80"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Supprimer
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Nom complet</Label>
          <Input {...f('name')} placeholder="Marie-Josèphe L." />
        </div>
        <div>
          <Label>Initiales (avatar)</Label>
          <Input
            value={testimonial.initials}
            onChange={e => {
              const val = e.target.value.toUpperCase().slice(0, 3)
              onChange({ ...testimonial, initials: val })
            }}
            placeholder="MJ"
            maxLength={3}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Rôle / Poste</Label>
          <Input {...f('role')} placeholder="Directrice d'école" />
        </div>
        <div>
          <Label>Entreprise / Lieu</Label>
          <Input {...f('company')} placeholder="Maripasoula" />
        </div>
      </div>

      <div>
        <Label>Note</Label>
        <StarRating
          value={testimonial.rating}
          onChange={v => onChange({ ...testimonial, rating: v })}
        />
      </div>

      <div>
        <Label>Témoignage</Label>
        <Textarea
          rows={3}
          {...f('quote')}
          placeholder="Décrivez l'expérience du client avec GUYA FIBRE…"
        />
      </div>

      {/* Aperçu miniature */}
      {testimonial.name && testimonial.quote && (
        <div className="mt-2 p-3 bg-card rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
          <p className="text-xs font-medium text-foreground mt-1">
            — {testimonial.name}{testimonial.role ? `, ${testimonial.role}` : ''}
          </p>
        </div>
      )}
    </div>
  )
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

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

  const handleChange = (index: number, updated: Testimonial) => {
    const next = [...testimonials]
    next[index] = updated
    setTestimonials(next)
    setDirty(true)
  }

  const handleAdd = () => {
    setTestimonials(prev => [...prev, { ...EMPTY_TESTIMONIAL }])
    setDirty(true)
  }

  const handleRemove = (index: number) => {
    if (!confirm('Supprimer cet avis client ?')) return
    setTestimonials(prev => prev.filter((_, i) => i !== index))
    setDirty(true)
  }

  const handleSave = async () => {
    // Validation basique
    const invalid = testimonials.find(t => !t.name || !t.quote)
    if (invalid) {
      toast.error('Chaque avis doit avoir un nom et un texte de témoignage')
      return
    }
    setSaving(true)
    try {
      await siteContentApi.updateSection('testimonials', testimonials as any)
      toast.success('Avis clients mis à jour — visibles sur le site')
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
    <div className="space-y-5">
      <PageHeader
        title="Avis clients"
        description="Gérez les témoignages affichés sur le site vitrine"
        action={
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="text-xs text-amber-500 font-medium">
                Modifications non sauvegardées
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4" />
              Ajouter un avis
            </Button>
            <Button size="sm" loading={saving} onClick={handleSave} disabled={!dirty}>
              <Save className="w-4 h-4" />
              Sauvegarder
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Les avis sont affichés sur la page d'accueil du site vitrine.{' '}
            <strong>L'ordre d'affichage</strong> correspond à l'ordre de la liste ci-dessous.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <p className="text-muted-foreground text-sm mb-4">
                  Aucun avis client pour l'instant.
                </p>
                <Button variant="outline" onClick={handleAdd}>
                  <Plus className="w-4 h-4" />
                  Ajouter le premier avis
                </Button>
              </CardContent>
            </Card>
          ) : (
            testimonials.map((t, i) => (
              <TestimonialCard
                key={i}
                testimonial={t}
                index={i}
                onChange={updated => handleChange(i, updated)}
                onRemove={() => handleRemove(i)}
              />
            ))
          )}

          {testimonials.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleReset}
                className="text-xs text-destructive hover:underline"
              >
                Réinitialiser aux valeurs par défaut
              </button>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleAdd}>
                  <Plus className="w-4 h-4" />
                  Ajouter un avis
                </Button>
                <Button size="sm" loading={saving} onClick={handleSave} disabled={!dirty}>
                  <Save className="w-4 h-4" />
                  Sauvegarder ({testimonials.length} avis)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}