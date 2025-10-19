// Feature flags for MVP features
// Reference: .github/instructions/featurelist.instructions.md

const features = {
  // ID 12: Prompt Library (Reusable Prompts)
  promptLibrary: false,
  
  // ID 13: AI Confidence / Preview Step
  aiPreviewModal: false,
  
  // ID 17: Empty & Error States
  emptyErrorStates: true,
  
  // ID 18: Basic Branding (Logo/Colors)
  brandingBasic: false,
  
  // ID 22: Audit Logging (Basic)
  auditLog: false,
  
  // ID 25: Email Notifications (Intake/Docs)
  notifAuto: false,
  
  // ID 32: Usage Logs / Metrics
  usageMetrics: false
}

export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature] ?? false
}

export function enableFeature(feature: keyof typeof features) {
  features[feature] = true
  if (typeof window !== 'undefined') {
    localStorage.setItem(`feature_${feature}`, 'true')
  }
}

export function disableFeature(feature: keyof typeof features) {
  features[feature] = false
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`feature_${feature}`)
  }
}

export function getAllFeatures() {
  return { ...features }
}

// Load feature flags from localStorage on client side
if (typeof window !== 'undefined') {
  Object.keys(features).forEach((key) => {
    const stored = localStorage.getItem(`feature_${key}`)
    if (stored === 'true') {
      features[key as keyof typeof features] = true
    }
  })
}
