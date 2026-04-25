import { useEffect, useState } from 'react'
import { siteContentApi } from '@/api'
import {
  Card, CardContent, PageHeader, Button, Input, Label, Textarea, Spinner,
} from '@/components/ui'
import { toast } from 'sonner'
import { Save, RefreshCw, ChevronDown, ChevronRight, Globe, Quote, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

// ─── SECTION EDITORS ──────────────────────────────────────────────────────

function HeroEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const f = (key: string) => ({
    value: data[key] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...data, [key]: e.target.value }),
  })
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>Titre (Français)</Label><Input {...f('titleFr')} placeholder="La Fibre Optique pour la Guyane" /></div>
        <div><Label>Titre (Anglais)</Label><Input {...f('titleEn')} placeholder="Fiber Optic for French Guiana" /></div>
      </div>
      <div><Label>Sous-titre</Label><Input {...f('subtitle')} placeholder="Connectivité haut débit…" /></div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>Bouton principal</Label><Input {...f('ctaPrimary')} placeholder="Demander un devis" /></div>
        <div><Label>Bouton secondaire</Label><Input {...f('ctaSecondary')} placeholder="Nos services" /></div>
      </div>
      <div><Label>Badge / étiquette</Label><Input {...f('badge')} placeholder="Disponible" /></div>
    </div>
  )
}

function AboutEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const f = (key: string) => ({
    value: data[key] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...data, [key]: e.target.value }),
  })
  return (
    <div className="space-y-3">
      <div><Label>Titre</Label><Input {...f('title')} placeholder="À propos de GUYA FIBRE" /></div>
      <div><Label>Description</Label><Textarea rows={4} {...f('description')} placeholder="Entreprise spécialisée…" /></div>
    </div>
  )
}

function StatsEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const stats: any[] = Array.isArray(data) ? data : []
  const update = (i: number, key: string, val: string) => {
    const next = [...stats]
    next[i] = { ...next[i], [key]: val }
    onChange(next)
  }
  return (
    <div className="space-y-3">
      {stats.map((s, i) => (
        <div key={i} className="grid sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl">
          <div><Label>Valeur</Label><Input value={s.value || ''} onChange={e => update(i, 'value', e.target.value)} placeholder="5000+" /></div>
          <div><Label>Label</Label><Input value={s.label || ''} onChange={e => update(i, 'label', e.target.value)} placeholder="Foyers raccordés" /></div>
        </div>
      ))}
    </div>
  )
}

function CTAEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const f = (key: string) => ({
    value: data[key] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, [key]: e.target.value }),
  })
  return (
    <div className="space-y-3">
      <div><Label>Titre</Label><Input {...f('title')} placeholder="Prêt à vous connecter ?" /></div>
      <div><Label>Sous-titre</Label><Input {...f('subtitle')} placeholder="Demandez votre devis gratuit…" /></div>
      <div><Label>Texte du bouton</Label><Input {...f('buttonText')} placeholder="Demander un devis" /></div>
    </div>
  )
}

function FAQEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const items: any[] = Array.isArray(data) ? data : []
  const update = (i: number, key: string, val: string) => {
    const next = [...items]
    next[i] = { ...next[i], [key]: val }
    onChange(next)
  }
  const add = () => onChange([...items, { questionFr: '', answerFr: '', questionEn: '', answerEn: '' }])
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i))
  return (
    <div className="space-y-3">
      {items.map((q, i) => (
        <div key={i} className="p-3 bg-muted/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Question {i + 1}</p>
            <button onClick={() => remove(i)} className="text-xs text-destructive hover:underline">Supprimer</button>
          </div>
          <div><Label>Question (FR)</Label><Input value={q.questionFr || ''} onChange={e => update(i, 'questionFr', e.target.value)} /></div>
          <div><Label>Réponse (FR)</Label><Textarea rows={2} value={q.answerFr || ''} onChange={e => update(i, 'answerFr', e.target.value)} /></div>
          <div><Label>Question (EN)</Label><Input value={q.questionEn || ''} onChange={e => update(i, 'questionEn', e.target.value)} /></div>
          <div><Label>Réponse (EN)</Label><Textarea rows={2} value={q.answerEn || ''} onChange={e => update(i, 'answerEn', e.target.value)} /></div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>+ Ajouter une question</Button>
    </div>
  )
}

function FooterEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const f = (key: string) => ({
    value: data[key] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...data, [key]: e.target.value }),
  })
  return (
    <div className="space-y-3">
      <div><Label>Description</Label><Textarea rows={2} {...f('description')} placeholder="GUYA FIBRE - Votre partenaire…" /></div>
    </div>
  )
}

function GenericEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  if (typeof data === 'object' && !Array.isArray(data)) {
    return (
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => {
          if (typeof value === 'string') {
            return (
              <div key={key}>
                <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</Label>
                {value.length > 80
                  ? <Textarea rows={3} value={value} onChange={e => onChange({ ...data, [key]: e.target.value })} />
                  : <Input value={value} onChange={e => onChange({ ...data, [key]: e.target.value })} />
                }
              </div>
            )
          }
          return null
        })}
      </div>
    )
  }
  return <p className="text-sm text-muted-foreground">Contenu complexe — non éditable visuellement.</p>
}

// ─── SECTION CONFIG ───────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'hero', label: 'Section Hero', description: 'Titre principal et boutons', icon: '🏠', Editor: HeroEditor },
  { key: 'about', label: 'À propos', description: "Description de l'entreprise", icon: '🏢', Editor: AboutEditor },
  { key: 'stats', label: 'Statistiques', description: 'Chiffres clés', icon: '📊', Editor: StatsEditor },
  { key: 'cta', label: 'Bannière CTA', description: "Appel à l'action principal", icon: '📣', Editor: CTAEditor },
  { key: 'faq', label: 'FAQ', description: 'Questions fréquentes', icon: '❓', Editor: FAQEditor },
  { key: 'footer', label: 'Footer', description: 'Pied de page', icon: '🔗', Editor: FooterEditor },
  { key: 'contact', label: 'Page Contact', description: 'Informations de contact', icon: '📞', Editor: GenericEditor },
  { key: 'seo', label: 'SEO', description: 'Titres et descriptions', icon: '🔍', Editor: GenericEditor },
]

function SectionCard({ section }: { section: typeof SECTIONS[0] }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await siteContentApi.getSection(section.key)
      setData(res?.content ?? res)
    } catch { setData({}) }
    setLoading(false)
  }

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open && data === null) load()
  }

  const handleChange = (newData: any) => {
    setData(newData)
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await siteContentApi.updateSection(section.key, data)
      toast.success(`"${section.label}" mis à jour — visible sur le site`)
      setDirty(false)
    } catch { toast.error('Erreur lors de la sauvegarde') }
    setSaving(false)
  }

  const handleReset = async () => {
    if (!confirm('Réinitialiser aux valeurs par défaut ?')) return
    try {
      await siteContentApi.resetSection(section.key)
      toast.success('Section réinitialisée')
      load()
      setDirty(false)
    } catch { toast.error('Erreur') }
  }

  const { Editor } = section

  return (
    <Card className={cn(open && 'ring-1 ring-primary/30')}>
      <button onClick={handleOpen} className="w-full flex items-center gap-3 p-5 text-left hover:bg-muted/30 transition-colors rounded-xl">
        <span className="text-2xl">{section.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display font-semibold text-foreground">{section.label}</p>
            {dirty && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Modifications non sauvegardées" />}
          </div>
          <p className="text-sm text-muted-foreground">{section.description}</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border">
          <div className="pt-4">
            {loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <>
                <Editor data={data} onChange={handleChange} />
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <button onClick={handleReset} className="text-xs text-destructive hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />Réinitialiser
                  </button>
                  <Button size="sm" loading={saving} onClick={handleSave} disabled={!dirty}>
                    <Save className="w-4 h-4" />Sauvegarder
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

export default function SiteContentPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Contenu du site"
        description="Modifiez les textes et contenus affichés sur le site vitrine"
        action={
          <a href="https://guya-fibre-three.vercel.app/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors">
            <Globe className="w-4 h-4" />Voir le site
          </a>
        }
      />
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Les modifications sont appliquées <strong>immédiatement</strong> sur le site vitrine après sauvegarde. Cliquez sur une section pour la modifier.
          </p>
        </CardContent>
      </Card>

      {/* Raccourci vers la gestion des avis */}
      <Link to="/temoignages">
        <Card className="hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer">
          <div className="flex items-center gap-3 p-5">
            <span className="text-2xl">💬</span>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-foreground">Avis clients</p>
              <p className="text-sm text-muted-foreground">Ajouter, modifier ou supprimer des témoignages</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </Card>
      </Link>

      <div className="space-y-3">
        {SECTIONS.map(s => <SectionCard key={s.key} section={s} />)}
      </div>
    </div>
  )
}