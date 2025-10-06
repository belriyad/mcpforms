// Service-related TypeScript interfaces

export type ServiceStatus = 'draft' | 'intake_sent' | 'intake_submitted' | 'documents_ready' | 'completed'

export interface ServiceTemplate {
  id: string
  templateId: string
  name: string
  fileName: string
  aiSections: AIGeneratedSection[]
  extractedFields: FormField[]
}

export interface AIGeneratedSection {
  id: string
  templateId: string
  prompt: string
  generatedContent: string
  approved: boolean
  createdAt: string
  position?: number
}

export interface FormField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'tel' | 'date'
  required: boolean
  options?: string[]
  placeholder?: string
  description?: string
  sourceTemplateIds: string[] // Which templates use this field
  isCommon: boolean // True if used in multiple templates
}

export interface IntakeForm {
  id: string
  serviceId: string
  fields: FormField[]
  totalFields: number
  uniqueFields: number
  duplicatesRemoved: number
  generatedAt: string
  token: string // Unique token for client access
  link: string
}

export interface ClientResponse {
  responses: Record<string, any> // Field name -> response value
  customFields?: any[]
  customClauses?: any[]
  savedAt?: any // Timestamp from auto-save
  submittedAt?: any // Timestamp from final submission
  status: 'in_progress' | 'submitted' // Track response status
}

export interface GeneratedDocument {
  id: string
  serviceId: string
  templateId: string
  fileName: string
  downloadUrl: string
  generatedAt: string
  status: 'generating' | 'ready' | 'error'
}

export interface Service {
  id: string
  name: string
  description?: string
  clientName: string
  clientEmail: string
  status: ServiceStatus
  
  // Templates
  templates: ServiceTemplate[]
  
  // Intake Form
  intakeForm?: IntakeForm
  intakeFormSentAt?: string
  
  // Client Response
  clientResponse?: ClientResponse
  
  // Generated Documents
  generatedDocuments?: GeneratedDocument[]
  documentsGeneratedAt?: any // Timestamp when documents were generated
  
  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
  lastUpdatedBy?: string
}

export interface CreateServiceRequest {
  name: string
  description?: string
  clientName: string
  clientEmail: string
  templateIds: string[]
}

export interface UpdateServiceRequest {
  serviceId: string
  updates: Partial<Service>
}

export interface AddAISectionRequest {
  serviceId: string
  templateId: string
  prompt: string
}

export interface GenerateIntakeFormRequest {
  serviceId: string
}

export interface SendIntakeFormRequest {
  serviceId: string
}

export interface GenerateDocumentsRequest {
  serviceId: string
}
