// Auth
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'EDITOR' | 'VIEWER'
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  updatedAt: string
}

// Devis
export type DevisStatus = 'NEW' | 'PENDING' | 'IN_PROGRESS' | 'QUOTE_SENT' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
export type DevisUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface Devis {
  id: string
  reference: string
  clientName: string
  clientEmail: string
  clientPhone: string
  company?: string
  services: string[]
  location: string
  address?: string
  description: string
  urgency: DevisUrgency
  status: DevisStatus
  amount?: string
  estimatedAmount?: number
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  notes?: DevisNote[]
  responses?: DevisResponse[]
  createdAt: string
  updatedAt: string
}

export interface DevisNote {
  id: string
  content: string
  author: { id: string; firstName: string; lastName: string }
  createdAt: string
}

export interface DevisResponse {
  id: string
  subject: string
  body: string
  sentAt: string
  sentBy: { id: string; firstName: string; lastName: string }
}

export interface DevisListResponse {
  data: Devis[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Contact
export type ContactStatus = 'UNREAD' | 'READ' | 'ARCHIVED'

export interface Contact {
  id: string
  reference: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: ContactStatus
  ipAddress?: string
  readAt?: string
  readBy?: { id: string; firstName: string; lastName: string }
  createdAt: string
  updatedAt: string
}

export interface ContactListResponse {
  data: Contact[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Stats
export interface DashboardStats {
  totalDevisThisMonth: number
  pendingDevis: number
  activeClients: number
  monthlyRevenue: number
  monthlyChange: number
}

export interface DashboardData {
  stats: DashboardStats
  recentDevis: Devis[]
  topServices: { serviceName?: string; name?: string; count: number; percentage: number }[]
  upcomingInterventions: { client: string; service: string; date: string; technician: string }[]
}

// Services
export interface Service {
  id: string
  name: string
  slug: string
  shortDescription: string
  fullDescription?: string
  icon?: string
  image?: string
  features?: string[]
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

// Realisations
export interface Realisation {
  id: string
  title: string
  slug: string
  description: string
  category: string
  location: string
  client?: string
  completedAt?: string
  images: string[]
  coverImage?: string
  isPublished: boolean
  featured: boolean
  tags?: string[]
  stats?: Record<string, string>
  createdAt: string
  updatedAt: string
}

// Media
export interface Media {
  id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  path: string
  alt?: string
  createdAt: string
  uploadedBy?: { id: string; firstName: string; lastName: string }
}

// Logs
export interface ActivityLog {
  id: string
  userId?: string
  userEmail?: string
  action: string
  entity: string
  entityId?: string
  description?: string
  details?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
  user?: { id: string; firstName: string; lastName: string; email: string }
}

// Settings
export interface Settings {
  companyName?: string
  companyEmail?: string
  companyPhone?: string
  companyAddress?: string
  smtpHost?: string
  smtpPort?: string
  smtpUser?: string
  smtpFrom?: string
  whatsappNumber?: string
  googleMapsKey?: string
}

// Email Templates
export interface EmailTemplate {
  id: string
  name: string
  slug: string
  subject: string
  body: string
  bodyHtml?: string
  variables?: string[]
  updatedAt: string
}

// Rapport d'intervention
export type RapportStatus = 'DRAFT' | 'SIGNED' | 'ARCHIVED'
export type SupportType = 'IMB' | 'MAISON' | 'BATIMENT' | 'LOCAL_PRO' | 'AUTRE'

export interface Rapport {
  id: string
  reference: string
  title: string
  typeSupport?: SupportType
  status: RapportStatus
  authorId: string
  author?: { id: string; firstName: string; lastName: string; email: string }
  devisId?: string
  devis?: { id: string; reference: string; clientName: string; clientPhone?: string; location?: string }
  batiment?: string
  batimentChoix?: string
  hall?: string
  appartement?: string
  localTechnique?: string
  localTechniqueLocalisation?: string
  photoLocalTechniqueUrl?: string
  photoPavillonUrl?: string
  gpsLat?: number
  gpsLng?: number
  notes?: string
  signatureTechnicien?: string
  signatureClient?: string
  signedAt?: string
  createdAt: string
  updatedAt: string
}

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}
