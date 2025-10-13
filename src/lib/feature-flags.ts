/**
 * Feature Flags System
 * 
 * Controls rollout of MVP features according to instruction pack.
 * Flags default to OFF in production for safe progressive enablement.
 */

export type FeatureFlag = 
  | 'aiPreviewModal'      // #13 AI Confidence/Preview
  | 'promptLibrary'       // #12 Prompt Library
  | 'brandingBasic'       // #18 Basic Branding
  | 'auditLog'            // #22 Audit Logging
  | 'notifAuto'           // #25 Email Notifications
  | 'usageMetrics'        // #32 Usage Metrics
  | 'emptyErrorStates';   // #17 Empty & Error States

interface FeatureFlagConfig {
  key: FeatureFlag;
  name: string;
  description: string;
  defaultEnabled: boolean;
  requiresBackend: boolean;
}

/**
 * Feature flag configuration
 * All flags default to false in production for safety
 */
export const FEATURE_FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
  aiPreviewModal: {
    key: 'aiPreviewModal',
    name: 'AI Preview Modal',
    description: 'Show AI-generated content in a preview modal with confidence score before insertion',
    defaultEnabled: false,
    requiresBackend: true,
  },
  promptLibrary: {
    key: 'promptLibrary',
    name: 'Prompt Library',
    description: 'Save and reuse AI prompts across services',
    defaultEnabled: false,
    requiresBackend: true,
  },
  brandingBasic: {
    key: 'brandingBasic',
    name: 'Basic Branding',
    description: 'Customize logo and accent color for intake forms and emails',
    defaultEnabled: false,
    requiresBackend: true,
  },
  auditLog: {
    key: 'auditLog',
    name: 'Audit Logging',
    description: 'Track intake submissions, document generations, and email events',
    defaultEnabled: false,
    requiresBackend: true,
  },
  notifAuto: {
    key: 'notifAuto',
    name: 'Email Notifications',
    description: 'Automatic emails on intake submission and document generation',
    defaultEnabled: false,
    requiresBackend: true,
  },
  usageMetrics: {
    key: 'usageMetrics',
    name: 'Usage Metrics',
    description: 'Track document generation counts and display usage widget',
    defaultEnabled: false,
    requiresBackend: true,
  },
  emptyErrorStates: {
    key: 'emptyErrorStates',
    name: 'Empty & Error States',
    description: 'Friendly UI for empty data and error conditions with retry CTAs',
    defaultEnabled: false,
    requiresBackend: false,
  },
};

/**
 * Get feature flag state from localStorage (dev) or environment (prod)
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // In development, check localStorage first
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const stored = localStorage.getItem(`feature_${flag}`);
    if (stored !== null) {
      return stored === 'true';
    }
  }

  // Check environment variable (prod)
  const envKey = `NEXT_PUBLIC_FEATURE_${flag.toUpperCase()}`;
  const envValue = process.env[envKey];
  if (envValue !== undefined) {
    return envValue === 'true';
  }

  // Default to OFF for safety
  return FEATURE_FLAGS[flag].defaultEnabled;
}

/**
 * Toggle feature flag in localStorage (dev only)
 */
export function toggleFeature(flag: FeatureFlag, enabled: boolean): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    localStorage.setItem(`feature_${flag}`, enabled.toString());
    console.log(`[Feature Flag] ${flag} ${enabled ? 'enabled' : 'disabled'}`);
  }
}

/**
 * Get all feature flags with their current state
 */
export function getAllFeatureFlags(): Array<FeatureFlagConfig & { enabled: boolean }> {
  return Object.values(FEATURE_FLAGS).map(config => ({
    ...config,
    enabled: isFeatureEnabled(config.key),
  }));
}

/**
 * Reset all feature flags to defaults (dev only)
 */
export function resetAllFeatures(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    Object.keys(FEATURE_FLAGS).forEach(flag => {
      localStorage.removeItem(`feature_${flag}`);
    });
    console.log('[Feature Flags] All flags reset to defaults');
  }
}
