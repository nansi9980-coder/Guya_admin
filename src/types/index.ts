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
  meta: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

export interface Contact {
  id: string
  reference: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  isRead: boolean
  ipAddress?: string
  createdAt: string
  updatedAt: string
}

export interface ContactListResponse {
  data: Contact[]
  meta: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

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

export interface Service {
  id: string
  slug: string
  number: string
  icon: string
  titleFr: string
  titleEn?: string
  titleEs?: string
  titlePt?: string
  titleNl?: string
  titleGcr?: string
  descFr: string
  descEn?: string
  features: string[]
  image?: string
  benefit?: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Realisation {
  id: string
  slug: string
  titleFr: string
  titleEn?: string
  location: string
  date: string
  scope: string
  descFr: string
  descEn?: string
  tags: string[]
  images: string[]
  client?: string
  isFeatured: boolean
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

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

export interface ActivityLog {
  id: string
  userId?: string
  userEmail?: string
  action: string
  entity: string
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
  user?: { id: string; firstName: string; lastName: string; email: string }
}

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

export interface EmailTemplate {
  id: string
  name: string
  slug: string
  subject: string
  bodyHtml: string
  variables?: string[]
  updatedAt: string
}

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

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}