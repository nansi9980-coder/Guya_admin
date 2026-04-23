import { useEffect, useState, useRef } from 'react'
import { settingsApi } from '@/api'
import type { Settings } from '@/types'
import {
  Card, CardContent, PageHeader, Button, Input, Label, Spinner,
} from '@/components/ui'
import { toast } from 'sonner'
import { Save, Building, Server, PenTool, Trash2, Palette, Check } from 'lucide-react'
import api from '@/api/axios'

// ─── 20 palettes ──────────────────────────────────────────────────────────────
const THEME_PALETTES: Record<string, { name: string; primary: string; accent: string; darkBg: string; secondary: string }> = {
  default:   { name: 'Défaut',           primary: 'oklch(0.65 0.13 180)', accent: 'oklch(0.75 0.16 65)',  darkBg: 'oklch(0.13 0.025 250)', secondary: 'oklch(0.95 0.005 250)' },
  ocean:     { name: 'Océan',            primary: 'oklch(0.5 0.15 220)',  accent: 'oklch(0.8 0.14 40)',   darkBg: 'oklch(0.1 0.02 220)',   secondary: 'oklch(0.93 0.01 200)'  },
  forest:    { name: 'Forêt',            primary: 'oklch(0.6 0.12 150)',  accent: 'oklch(0.78 0.15 70)',  darkBg: 'oklch(0.12 0.03 150)',  secondary: 'oklch(0.94 0.008 160)' },
  sunset:    { name: 'Coucher de soleil',primary: 'oklch(0.68 0.14 30)',  accent: 'oklch(0.75 0.16 70)',  darkBg: 'oklch(0.14 0.03 30)',   secondary: 'oklch(0.96 0.004 0)'   },
  tech:      { name: 'Tech',             primary: 'oklch(0.55 0.18 280)', accent: 'oklch(0.7 0.16 180)',  darkBg: 'oklch(0.1 0.02 280)',   secondary: 'oklch(0.92 0.01 280)'  },
  ruby:      { name: 'Ruby',             primary: 'oklch(0.58 0.2 15)',   accent: 'oklch(0.72 0.15 55)',  darkBg: 'oklch(0.11 0.03 15)',   secondary: 'oklch(0.95 0.005 15)'  },
  midnight:  { name: 'Minuit',           primary: 'oklch(0.62 0.16 260)', accent: 'oklch(0.78 0.18 80)',  darkBg: 'oklch(0.08 0.02 260)',  secondary: 'oklch(0.9 0.01 260)'   },
  amber:     { name: 'Ambre',            primary: 'oklch(0.72 0.17 60)',  accent: 'oklch(0.55 0.14 200)', darkBg: 'oklch(0.13 0.025 60)',  secondary: 'oklch(0.96 0.006 60)'  },
  rose:      { name: 'Rose',             primary: 'oklch(0.65 0.18 350)', accent: 'oklch(0.7 0.14 140)',  darkBg: 'oklch(0.12 0.025 350)', secondary: 'oklch(0.95 0.006 350)' },
  slate:     { name: 'Ardoise',          primary: 'oklch(0.5 0.06 240)',  accent: 'oklch(0.68 0.14 200)', darkBg: 'oklch(0.15 0.02 240)',  secondary: 'oklch(0.92 0.005 240)' },
  emerald:   { name: 'Émeraude',         primary: 'oklch(0.62 0.14 162)', accent: 'oklch(0.75 0.16 55)',  darkBg: 'oklch(0.11 0.025 162)', secondary: 'oklch(0.94 0.008 162)' },
  gold:      { name: 'Or',               primary: 'oklch(0.74 0.15 75)',  accent: 'oklch(0.52 0.12 240)', darkBg: 'oklch(0.13 0.02 75)',   secondary: 'oklch(0.96 0.006 75)'  },
  indigo:    { name: 'Indigo',           primary: 'oklch(0.52 0.22 265)', accent: 'oklch(0.72 0.16 35)',  darkBg: 'oklch(0.1 0.03 265)',   secondary: 'oklch(0.93 0.01 265)'  },
  coral:     { name: 'Corail',           primary: 'oklch(0.66 0.17 25)',  accent: 'oklch(0.6 0.15 200)',  darkBg: 'oklch(0.12 0.03 25)',   secondary: 'oklch(0.96 0.005 25)'  },
  mint:      { name: 'Menthe',           primary: 'oklch(0.68 0.12 170)', accent: 'oklch(0.7 0.15 300)',  darkBg: 'oklch(0.11 0.02 170)',  secondary: 'oklch(0.95 0.007 170)' },
  lavender:  { name: 'Lavande',          primary: 'oklch(0.62 0.14 295)', accent: 'oklch(0.72 0.15 55)',  darkBg: 'oklch(0.11 0.025 295)', secondary: 'oklch(0.94 0.008 295)' },
  crimson:   { name: 'Cramoisi',         primary: 'oklch(0.55 0.22 8)',   accent: 'oklch(0.7 0.14 75)',   darkBg: 'oklch(0.1 0.03 8)',     secondary: 'oklch(0.95 0.005 8)'   },
  teal:      { name: 'Teal',             primary: 'oklch(0.6 0.13 195)',  accent: 'oklch(0.72 0.16 50)',  darkBg: 'oklch(0.11 0.025 195)', secondary: 'oklch(0.94 0.007 195)' },
  bronze:    { name: 'Bronze',           primary: 'oklch(0.6 0.1 50)',    accent: 'oklch(0.52 0.12 200)', darkBg: 'oklch(0.12 0.02 50)',   secondary: 'oklch(0.94 0.006 50)'  },
  neon:      { name: 'Néon',             primary: 'oklch(0.75 0.22 130)', accent: 'oklch(0.7 0.22 300)',  darkBg: 'oklch(0.08 0.01 130)',  secondary: 'oklch(0.93 0.01 130)'  },
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground">{title}</h3>
        </div>
        <div className="space-y-3">{children}</div>
      </CardContent>
    </Card>
  )
}

// ─── Theme Picker ─────────────────────────────────────────────────────────────
function ThemePicker() {
  const [activePalette, setActivePalette] = useState<string>('default')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/settings/theme')
      .then(r => { setActivePalette(r.data.activePalette || 'default') })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = async (key: string) => {
    setSaving(true)
    try {
      await api.put('/settings/theme', { activePalette: key })
      setActivePalette(key)
      toast.success(`Thème « ${THEME_PALETTES[key].name} » appliqué sur le site`)
    } catch {
      toast.error('Erreur lors de la sauvegarde du thème')
    }
    setSaving(false)
  }

  if (loading) return <div className="flex justify-center py-6"><Spinner size="sm" /></div>

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        La palette sélectionnée s'applique immédiatement au site vitrine pour tous les visiteurs.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3">
        {Object.entries(THEME_PALETTES).map(([key, p]) => (
          <button
            key={key}
            disabled={saving}
            onClick={() => handleSelect(key)}
            className={`relative p-3 rounded-xl border-2 transition-all text-left disabled:opacity-60 ${
              activePalette === key
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {activePalette === key && (
              <div className="absolute top-2 right-2">
                <Check className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className="space-y-2">
              <p className="font-medium text-xs text-foreground truncate pr-5">{p.name}</p>
              <div className="flex gap-1">
                {[p.darkBg, p.primary, p.accent, p.secondary].map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded border border-border flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
      {saving && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Spinner size="sm" /> Application du thème en cours…
        </p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ParametresPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)

  useEffect(() => {
    settingsApi.get()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false))

    const saved = localStorage.getItem('director-signature')
    if (saved) setSignature(saved)
  }, [])

  const f = (key: keyof Settings) => ({
    value: settings[key] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSettings(s => ({ ...s, [key]: e.target.value })),
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsApi.update(settings)
      toast.success('Paramètres sauvegardés')
    } catch { toast.error('Erreur') }
    setSaving(false)
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const endDraw = () => { isDrawing.current = false }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    setSignature(dataUrl)
    localStorage.setItem('director-signature', dataUrl)
    setDrawing(false)
    toast.success('Signature enregistrée')
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const deleteSignature = () => {
    setSignature(null)
    localStorage.removeItem('director-signature')
    toast.success('Signature supprimée')
  }

  if (loading) return <Card><CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent></Card>

  return (
    <div className="space-y-5">
      <PageHeader
        title="Paramètres"
        description="Configuration générale de l'application"
        action={
          <Button onClick={handleSave} loading={saving} size="sm">
            <Save className="w-4 h-4" />Sauvegarder
          </Button>
        }
      />

      {/* Thème du site vitrine */}
      <Section icon={Palette} title="Thème du site vitrine">
        <ThemePicker />
      </Section>

      <div className="grid lg:grid-cols-2 gap-4">
        <Section icon={Building} title="Informations société">
          <div><Label>Nom de l'entreprise</Label><Input {...f('companyName')} placeholder="GUYA FIBRE" /></div>
          <div><Label>Email de contact</Label><Input type="email" {...f('companyEmail')} placeholder="contact@guyafibre.com" /></div>
          <div><Label>Téléphone</Label><Input {...f('companyPhone')} placeholder="+594 0594 …" /></div>
          <div><Label>Adresse</Label><Input {...f('companyAddress')} placeholder="Cayenne, Guyane" /></div>
          <div><Label>Ville</Label><Input {...f('companyCity')} placeholder="Cayenne, Guyane" /></div>
          <div><Label>SIRET</Label><Input {...f('companySiret')} placeholder="123 456 789 00012" /></div>
          <div><Label>Site web</Label><Input {...f('companyWebsite')} placeholder="www.guyafibre.com" /></div>
          <div><Label>WhatsApp</Label><Input {...f('whatsappNumber')} placeholder="+594 …" /></div>
        </Section>

        <Section icon={Server} title="Configuration SMTP (Resend)">
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            Les emails sont envoyés via <strong>Resend</strong>. Ajoutez <code className="text-xs bg-muted px-1 rounded">RESEND_API_KEY</code> dans le fichier <code className="text-xs bg-muted px-1 rounded">.env</code> du backend.
          </p>
          <div><Label>Email expéditeur</Label><Input {...f('smtpFrom')} placeholder="noreply@guyafibre.com" /></div>
        </Section>
      </div>

      {/* Signature */}
      <Section icon={PenTool} title="Signature électronique du directeur">
        <p className="text-sm text-muted-foreground">
          Cette signature sera automatiquement ajoutée aux PDF de devis générés depuis le dashboard.
        </p>

        {signature && !drawing && (
          <div className="space-y-3">
            <div className="border border-border rounded-xl p-4 bg-white">
              <img src={signature} alt="Signature du directeur" className="max-h-24 mx-auto" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDrawing(true)}>
                <PenTool className="w-4 h-4" />Modifier
              </Button>
              <Button size="sm" variant="outline" onClick={deleteSignature} className="text-destructive hover:bg-destructive/10 border-destructive/30">
                <Trash2 className="w-4 h-4" />Supprimer
              </Button>
            </div>
          </div>
        )}

        {(!signature || drawing) && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-border rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={150}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            <p className="text-xs text-muted-foreground">Dessinez votre signature dans le cadre ci-dessus.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveSignature}>
                <Save className="w-4 h-4" />Enregistrer la signature
              </Button>
              <Button size="sm" variant="outline" onClick={clearSignature}>Effacer</Button>
              {drawing && (
                <Button size="sm" variant="ghost" onClick={() => setDrawing(false)}>Annuler</Button>
              )}
            </div>
          </div>
        )}
      </Section>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" />Sauvegarder tous les paramètres
        </Button>
      </div>
    </div>
  )
}

export default ParametresPage