import { useEffect, useState, useCallback, useRef } from 'react'
import { mediasApi } from '@/api'
import type { Media } from '@/types'
import { formatDate, formatFileSize } from '@/lib/utils'
import {
  Card, CardContent, PageHeader, Button, Spinner, EmptyState, Modal,
} from '@/components/ui'
import { toast } from 'sonner'
import { ImageIcon, Upload, Trash2, Copy, Search, RefreshCw, Film } from 'lucide-react'

export default function MediasPage() {
  const [medias, setMedias] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<Media | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await mediasApi.getAll({ search: search || undefined })
      setMedias(Array.isArray(res) ? res : res.data || [])
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      try {
        await mediasApi.upload(file)
        toast.success(`${file.name} uploadé`)
      } catch { toast.error(`Erreur pour ${file.name}`) }
    }
    setUploading(false)
    load()
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce média ?')) return
    try {
      await mediasApi.delete(id)
      toast.success('Supprimé')
      setPreview(null)
      load()
    } catch { toast.error('Erreur') }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copiée !')
  }

  const isVideo = (m: Media) => m.mimeType?.startsWith('video/')
  const isImage = (m: Media) => m.mimeType?.startsWith('image/')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Médiathèque"
        description={`${medias.length} fichier${medias.length > 1 ? 's' : ''}`}
        action={
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleUpload}
            />
            <Button onClick={() => fileRef.current?.click()} loading={uploading} size="sm">
              <Upload className="w-4 h-4" />
              {uploading ? 'Upload en cours…' : 'Uploader'}
            </Button>
          </div>
        }
      />

      {/* Drop zone */}
      <Card
        className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Glisser-déposer ou cliquer pour uploader</p>
          <p className="text-xs text-muted-foreground mt-1">Images (PNG, JPG, GIF, WebP) et Vidéos (MP4, MOV, AVI) — Max 10 Mo</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Rechercher un fichier…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="flex justify-center py-16"><Spinner size="lg" /></CardContent></Card>
      ) : medias.length === 0 ? (
        <EmptyState icon={<ImageIcon className="w-6 h-6" />} title="Aucun média" description="Uploadez votre premier fichier" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {medias.map(m => (
            <div
              key={m.id}
              className="group relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer border-2 border-transparent hover:border-primary/50 transition-all"
              onClick={() => setPreview(m)}
            >
              {isImage(m) ? (
                <img src={m.url} alt={m.alt || m.originalName} className="w-full h-full object-cover" />
              ) : isVideo(m) ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-muted">
                  <Film className="w-8 h-8 text-primary" />
                  <span className="text-[10px] text-muted-foreground px-2 truncate w-full text-center">{m.originalName}</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); copyUrl(m.url) }}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(m.id) }}
                  className="p-2 rounded-lg bg-red-500/70 hover:bg-red-500 text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">{m.originalName}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.originalName} size="lg">
        {preview && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-muted max-h-80 flex items-center justify-center">
              {isImage(preview) ? (
                <img src={preview.url} alt={preview.alt || preview.originalName} className="max-h-80 max-w-full object-contain" />
              ) : isVideo(preview) ? (
                <video
                  src={preview.url}
                  controls
                  className="max-h-80 max-w-full rounded-xl"
                >
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
              ) : (
                <div className="py-16 text-muted-foreground"><ImageIcon className="w-16 h-16" /></div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Nom original</p><p className="font-medium">{preview.originalName}</p></div>
              <div><p className="text-xs text-muted-foreground">Taille</p><p className="font-medium">{formatFileSize(preview.size)}</p></div>
              <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium">{preview.mimeType}</p></div>
              <div><p className="text-xs text-muted-foreground">Uploadé le</p><p className="font-medium">{formatDate(preview.createdAt)}</p></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">URL</p>
              <div className="flex gap-2">
                <input readOnly value={preview.url} className="flex-1 rounded-lg border border-input bg-muted px-3 py-2 text-xs font-mono" />
                <Button size="sm" variant="outline" onClick={() => copyUrl(preview.url)}><Copy className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(preview.id)}>
                <Trash2 className="w-4 h-4" />Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}