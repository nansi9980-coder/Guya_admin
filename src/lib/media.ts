const API_URL = import.meta.env.VITE_API_URL || 'https://guyafibrebackend-production.up.railway.app'

export function getMediaUrl(url: string | undefined | null): string {
  if (!url) return ''
  
  // If it's already an absolute URL, return it
  if (url.startsWith('http')) return url
  
  // Ensure the path starts with a single slash
  const cleanPath = url.startsWith('/') ? url : `/${url}`
  
  // Prepend API URL
  return `${API_URL}${cleanPath}`
}
