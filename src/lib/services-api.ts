// Client-side API functions for service management

export interface CreateServiceData {
  name: string
  clientName: string
  clientEmail: string
  description?: string
  templateIds: string[]
}

export async function createService(data: CreateServiceData) {
  const response = await fetch('/api/services/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create service')
  }
  
  return response.json()
}

export async function loadServiceTemplates(serviceId: string, templateIds: string[]) {
  const response = await fetch('/api/services/load-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceId, templateIds })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to load templates')
  }
  
  return response.json()
}

export async function generateAISection(serviceId: string, templateId: string, prompt: string) {
  const response = await fetch('/api/services/generate-ai-section', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceId, templateId, prompt })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate AI section')
  }
  
  return response.json()
}

export async function generateIntakeForm(serviceId: string) {
  const response = await fetch('/api/services/generate-intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceId })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate intake form')
  }
  
  return response.json()
}

export async function sendIntakeForm(serviceId: string) {
  const response = await fetch('/api/services/send-intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceId })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send intake form')
  }
  
  return response.json()
}
