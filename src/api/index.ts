import api from './axios'
import type {
  Devis, DevisListResponse, Contact, ContactListResponse,
  DashboardData, Service, Realisation, Media, ActivityLog,
  Settings, EmailTemplate, User, PaginationParams, Rapport
} from '@/types'

// ─── AUTH ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data).then(r => r.data),
}

// ─── STATS ────────────────────────────────────────────────────────────────
export const statsApi = {
  getDashboard: (): Promise<DashboardData> =>
    api.get('/stats/dashboard').then(r => r.data),
  getCharts: (period?: string) =>
    api.get('/stats/charts', { params: { period } }).then(r => r.data),
}

// ─── DEVIS ────────────────────────────────────────────────────────────────
export const devisApi = {
  getAll: (params?: PaginationParams & { status?: string; urgency?: string; assignedTo?: string }) =>
    api.get<DevisListResponse>('/devis', { params }).then(r => r.data),
  getOne: (id: string): Promise<Devis> =>
    api.get(`/devis/${id}`).then(r => r.data),
  updateStatus: (id: string, status: string, note?: string) =>
    api.patch(`/devis/${id}/status`, { status, note }).then(r => r.data),
  updateAmount: (id: string, amount: number) =>
    api.patch(`/devis/${id}/amount`, { amount }).then(r => r.data),
  addNote: (id: string, content: string) =>
    api.post(`/devis/${id}/notes`, { content }).then(r => r.data),
  respond: (id: string, data: { subject: string; body: string }) =>
    api.post(`/devis/${id}/respond`, data).then(r => r.data),
  assign: (id: string, userId: string) =>
    api.patch(`/devis/${id}/assign`, { userId }).then(r => r.data),
  exportCsv: (params?: PaginationParams) =>
    api.get('/devis/export', { params, responseType: 'blob' }).then(r => r.data),
}

// ─── CONTACT ──────────────────────────────────────────────────────────────
export const contactApi = {
  getAll: (params?: PaginationParams & { status?: string }) =>
    api.get<ContactListResponse>('/contact', { params }).then(r => r.data),
  getOne: (id: string): Promise<Contact> =>
    api.get(`/contact/${id}`).then(r => r.data),
  markAsRead: (id: string) =>
    api.patch(`/contact/${id}/read`).then(r => r.data),
  archive: (id: string) =>
    api.patch(`/contact/${id}/archive`).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/contact/${id}`).then(r => r.data),
}

// ─── USERS ────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params?: PaginationParams) =>
    api.get('/users', { params }).then(r => r.data),
  getOne: (id: string): Promise<User> =>
    api.get(`/users/${id}`).then(r => r.data),
  create: (data: Partial<User> & { password: string }) =>
    api.post('/users', data).then(r => r.data),
  update: (id: string, data: Partial<User>) =>
    api.put(`/users/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/users/${id}`).then(r => r.data),
  toggleActive: (id: string, isActive: boolean) =>
    api.put(`/users/${id}`, { isActive }).then(r => r.data),
}

// ─── SERVICES ─────────────────────────────────────────────────────────────
export const servicesApi = {
  getAll: () => api.get('/services-content').then(r => r.data),
  getOne: (id: string): Promise<Service> =>
    api.get(`/services-content/${id}`).then(r => r.data),
  create: (data: Partial<Service>) =>
    api.post('/services-content', data).then(r => r.data),
  update: (id: string, data: Partial<Service>) =>
    api.put(`/services-content/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/services-content/${id}`).then(r => r.data),
  reorder: (ids: string[]) =>
    api.patch('/services-content/reorder', { ids }).then(r => r.data),
}

// ─── REALISATIONS ─────────────────────────────────────────────────────────
export const realisationsApi = {
  getAll: (params?: PaginationParams & { category?: string }) =>
    api.get('/realisations', { params }).then(r => r.data),
  getOne: (id: string): Promise<Realisation> =>
    api.get(`/realisations/${id}`).then(r => r.data),
  create: (data: Partial<Realisation>) =>
    api.post('/realisations', data).then(r => r.data),
  update: (id: string, data: Partial<Realisation>) =>
    api.put(`/realisations/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/realisations/${id}`).then(r => r.data),
  togglePublish: (id: string, isPublished: boolean) =>
    api.patch(`/realisations/${id}/publish`, { isPublished }).then(r => r.data),
}

// ─── MEDIAS ───────────────────────────────────────────────────────────────
export const mediasApi = {
  getAll: (params?: PaginationParams) =>
    api.get('/medias', { params }).then(r => r.data),
  upload: (file: File, alt?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (alt) form.append('alt', alt)
    return api.post('/medias/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  update: (id: string, data: Partial<Media>) =>
    api.patch(`/medias/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/medias/${id}`).then(r => r.data),
}

// ─── SITE CONTENT ─────────────────────────────────────────────────────────
export const siteContentApi = {
  getAll: () => api.get('/site-content').then(r => r.data),
  getSection: (section: string) =>
    api.get(`/site-content/${section}`).then(r => r.data),
  updateSection: (section: string, content: Record<string, unknown>) =>
    api.put(`/site-content/${section}`, content).then(r => r.data),
  resetSection: (section: string) =>
    api.post(`/site-content/${section}/reset`).then(r => r.data),
}

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────
export const emailTemplatesApi = {
  getAll: (): Promise<EmailTemplate[]> =>
    api.get('/email-templates').then(r => r.data),
  getOne: (slug: string): Promise<EmailTemplate> =>
    api.get(`/email-templates/${slug}`).then(r => r.data),
  update: (slug: string, data: { subject?: string; bodyHtml?: string }) =>
    api.put(`/email-templates/${slug}`, data).then(r => r.data),
  reset: (slug: string) =>
    api.post(`/email-templates/${slug}/reset`).then(r => r.data),
}

// ─── LOGS ─────────────────────────────────────────────────────────────────
export const logsApi = {
  getAll: (params?: PaginationParams & { entity?: string; action?: string }) =>
    api.get('/logs', { params }).then(r => r.data),
}

// ─── RAPPORTS ─────────────────────────────────────────────────────────────
export const rapportsApi = {
  getAll: (params?: PaginationParams & { status?: string; authorId?: string }) =>
    api.get('/rapports', { params }).then(r => r.data),
  getOne: (id: string) =>
    api.get(`/rapports/${id}`).then(r => r.data),
  create: (data: Partial<Rapport>) =>
    api.post('/rapports', data).then(r => r.data),
  update: (id: string, data: Partial<Rapport>) =>
    api.patch(`/rapports/${id}`, data).then(r => r.data),
  sign: (id: string, signatures: { signatureTechnicien: string; signatureClient?: string }) =>
    api.patch(`/rapports/${id}/sign`, signatures).then(r => r.data),
  archive: (id: string) =>
    api.patch(`/rapports/${id}/archive`).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/rapports/${id}`).then(r => r.data),
  getStats: () =>
    api.get('/rapports/stats').then(r => r.data),
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────
export const settingsApi = {
  get: async (): Promise<Settings> => {
    const [company, smtp, site] = await Promise.all([
      api.get('/settings/company').then(r => r.data).catch(() => ({})),
      api.get('/settings/smtp').then(r => r.data).catch(() => ({})),
      api.get('/settings/site').then(r => r.data).catch(() => ({})),
    ])
    return {
      companyName: company.name,
      companyCity: company.city,
      companySiret: company.siret,
      companyWebsite: company.website,
      companyEmail: company.email,
      companyPhone: company.phone,
      companyAddress: company.address,
      whatsappNumber: site.whatsappNumber,
      smtpHost: smtp.host,
      smtpPort: smtp.port,
      smtpUser: smtp.user,
      smtpFrom: smtp.fromEmail,
    }
  },
  update: async (data: Partial<Settings>): Promise<void> => {
    const company: Record<string, string> = {}
    const smtp: Record<string, string> = {}
    const site: Record<string, string> = {}

    if (data.companyName !== undefined) company.name = data.companyName
    if (data.companyEmail !== undefined) company.email = data.companyEmail
    if (data.companyPhone !== undefined) company.phone = data.companyPhone
    if (data.companyAddress !== undefined) company.address = data.companyAddress
    if (data.companyCity !== undefined) company.city = data.companyCity
    if (data.companySiret !== undefined) company.siret = data.companySiret
    if (data.companyWebsite !== undefined) company.website = data.companyWebsite
    if (data.whatsappNumber !== undefined) site.whatsappNumber = data.whatsappNumber
    if (data.smtpHost !== undefined) smtp.host = data.smtpHost
    if (data.smtpPort !== undefined) smtp.port = data.smtpPort
    if (data.smtpUser !== undefined) smtp.user = data.smtpUser
    if (data.smtpFrom !== undefined) smtp.fromEmail = data.smtpFrom

    await Promise.all([
      Object.keys(company).length > 0 && api.put('/settings/company', company),
      Object.keys(smtp).length > 0 && api.put('/settings/smtp', smtp),
      Object.keys(site).length > 0 && api.put('/settings/site', site),
    ].filter(Boolean))
  },
}