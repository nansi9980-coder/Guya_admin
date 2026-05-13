const API_URL = import.meta.env.VITE_API_URL || 'https://guya-fibre-backend.onrender.com'

export function getMediaUrl(url: string | undefined | null): string {
  if (!url) return ''
  
  // If it's already an absolute URL (Cloudinary, etc.), return it
  if (url.startsWith('http')) return url
  
  // Ensure the path starts with a single slash
  const cleanPath = url.startsWith('/') ? url : `/${url}`
  
  // Prepend API URL (rétrocompatibilité avec anciens chemins /files/xxx)
  return `${API_URL}${cleanPath}`
}