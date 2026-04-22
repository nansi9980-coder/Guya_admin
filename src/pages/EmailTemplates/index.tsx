import { useEffect, useState } from 'react'
import { emailTemplatesApi } from '@/api'
import type { EmailTemplate } from '@/types'
import { cn } from '@/lib/utils'
import {
  Card, CardContent, PageHeader, Button, Input, Label, Textarea, Spinner, EmptyState, Modal,
} from '@/components/ui'
import { toast } from 'sonner'
import { Mail, Save, RefreshCw, Edit, ChevronDown, ChevronRight, Info } from 'lucide-react'

const VARIABLE_DESCRIPTIONS: Record<string, string> = {
  clientName: 'Nom complet du client',
  name: 'Nom du contact',
  reference: 'Numéro de référence (ex: DEV-2026-001)',
  service: 'Service(s) demandé(s)',
  date: 'Date de la demande',
  companyEmail: "Email de l'entreprise",
  companyPhone: "Téléphone de l'entreprise",
  body: 'Corps du message de réponse',
  email: 'Email du contact',
  phone: 'Téléphone du contact',
  subject: 'Sujet du message',
  message: 'Contenu du message',
  firstName: 'Prénom',
  lastName: 'Nom',
  role: 'Rôle admin',
}

function TemplateCard({ template, onEdit, onReset }: {
  template: EmailTemplate
  onEdit: (t: EmailTemplate) => void
  onReset: (slug: string) => void
}) {
  const [open, setOpen] = useState(false)
  const bodyText = template.bodyHtml?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '') || template.body?.replace(/<[^>]+>/g, '') || ''

  return (
    <Card className={cn(open && 'ring-1 ring-primary/30')}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-5 text-left hover:bg-muted/30 transition-colors rounded-xl">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-foreground">{template.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{template.subject}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); onEdit(template) }}>
            <Edit className="w-4 h-4" />Modifier
          </Button>
          <button onClick={e => { e.stopPropagation(); onReset(template.slug) }} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Réinitialiser">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border">
          <div className="pt-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Aperçu du contenu</p>
              <div className="bg-muted/40 rounded-xl p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {bodyText || '(aucun contenu)'}
              </div>
            </div>
            {template.variables && template.variables.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Variables disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map(v => (
                    <div key={v} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/20">
                      <span className="text-xs font-mono text-primary">{`{{${v}}}`}</span>
                      {VARIABLE_DESCRIPTIONS[v] && (
                        <span className="text-xs text-muted-foreground">— {VARIABLE_DESCRIPTIONS[v]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

export function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [form, setForm] = useState({ subject: '', body: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    emailTemplatesApi.getAll()
      .then(setTemplates)
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleEdit = (t: EmailTemplate) => {
    setEditing(t)
    const rawHtml = (t as any).bodyHtml || t.body || ''
    const plainBody = rawHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    setForm({ subject: t.subject, body: plainBody })
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const bodyHtml = form.body
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '<br/>')
        .join('')
      await emailTemplatesApi.update(editing.slug, { subject: form.subject, bodyHtml })
      toast.success('Template mis à jour')
      load()
      setEditing(null)
    } catch { toast.error('Erreur lors de la sauvegarde') }
    setSaving(false)
  }

  const handleReset = async (slug: string) => {
    if (!confirm('Réinitialiser ce template aux valeurs par défaut ?')) return
    try {
      await emailTemplatesApi.reset(slug)
      toast.success('Template réinitialisé')
      load()
    } catch { toast.error('Erreur') }
  }

  const insertVariable = (v: string) => {
    setForm(f => ({ ...f, body: f.body + `{{${v}}}` }))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Templates Email"
        description="Personnalisez les emails envoyés automatiquement aux clients"
      />

      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Les variables entre <span className="font-mono text-primary">{'{{accolades}}'}</span> sont remplacées automatiquement par les vraies valeurs lors de l'envoi. Emails envoyés via <strong>Resend</strong> — configurez <code className="text-xs bg-muted px-1 py-0.5 rounded">RESEND_API_KEY</code> dans Railway.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent></Card>
      ) : templates.length === 0 ? (
        <EmptyState icon={<Mail className="w-6 h-6" />} title="Aucun template" description="Les templates sont créés automatiquement au premier démarrage du backend" />
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <TemplateCard key={t.slug} template={t} onEdit={handleEdit} onReset={handleReset} />
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Modifier : ${editing?.name}`} size="lg">
        {editing && (
          <div className="space-y-5">
            <div>
              <Label>Sujet de l'email</Label>
              <Input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Sujet de l'email"
              />
              <p className="text-xs text-muted-foreground mt-1">Vous pouvez utiliser des variables comme <span className="font-mono">{'{{reference}}'}</span> dans le sujet.</p>
            </div>

            <div>
              <Label>Corps du message</Label>
              <Textarea
                rows={10}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Écrivez votre message ici. Chaque ligne deviendra un paragraphe dans l'email."
                className="font-sans"
              />
              <p className="text-xs text-muted-foreground mt-1">Appuyez sur Entrée pour aller à la ligne.</p>
            </div>

            {editing.variables && editing.variables.length > 0 && (
              <div>
                <Label>Insérer une variable</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editing.variables.map(v => (
                    <button
                      key={v}
                      onClick={() => insertVariable(v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-xs text-primary font-mono transition-colors"
                    >
                      + {`{{${v}}}`}
                      {VARIABLE_DESCRIPTIONS[v] && <span className="text-muted-foreground font-sans">({VARIABLE_DESCRIPTIONS[v]})</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
              <Button loading={saving} onClick={handleSave}>
                <Save className="w-4 h-4" />Sauvegarder
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function ParametresPage() {
  return <EmailTemplatesPage />
}

export default EmailTemplatesPage