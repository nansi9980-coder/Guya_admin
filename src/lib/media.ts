const API_URL = import.meta.env.VITE_API_URL || 'https://guya-fibre-backend.onrender.com'

export function getMediaUrl(url: string | undefined | null): string {
  if (!url) return ''

  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const cleanPath = url.startsWith('/') ? url : `/${url}`

  if (cleanPath.startsWith('/files') || cleanPath.startsWith('/api/medias')) {
    return `${API_URL}${cleanPath}`
  }

  return `${API_URL}${cleanPath}`
}