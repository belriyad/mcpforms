/**
 * Branding Utilities
 * Feature #18: Basic Branding
 * 
 * Manages custom branding (logo, colors) for intake forms and emails
 */

import { db, storage } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

export interface Branding {
  logoUrl: string | null;
  logoStoragePath: string | null;
  accentColor: string;
  primaryColor: string;
  companyName: string;
  tagline?: string;
  favicon?: string;
  updatedAt: Date | any;
}

export const DEFAULT_BRANDING: Branding = {
  logoUrl: null,
  logoStoragePath: null,
  accentColor: '#6366f1', // Indigo
  primaryColor: '#3b82f6', // Blue
  companyName: 'MCPForms',
  tagline: undefined,
  favicon: undefined,
  updatedAt: new Date(),
};

/**
 * Get branding for a user
 * Client-side (browser)
 */
export async function getBranding(userId: string): Promise<Branding> {
  try {
    const userSettingsRef = doc(db, 'userSettings', userId);
    const docSnap = await getDoc(userSettingsRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.branding) {
        return { ...DEFAULT_BRANDING, ...data.branding };
      }
    }

    return DEFAULT_BRANDING;
  } catch (error) {
    console.error('Failed to get branding:', error);
    return DEFAULT_BRANDING;
  }
}

/**
 * Update branding settings
 * Client-side (browser)
 */
export async function updateBranding(
  userId: string,
  updates: Partial<Omit<Branding, 'updatedAt'>>
): Promise<void> {
  const userSettingsRef = doc(db, 'userSettings', userId);
  
  const brandingData = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  // Check if document exists
  const docSnap = await getDoc(userSettingsRef);
  
  if (docSnap.exists()) {
    await updateDoc(userSettingsRef, {
      branding: brandingData,
    });
  } else {
    await setDoc(userSettingsRef, {
      branding: brandingData,
    });
  }
}

/**
 * Upload logo to Firebase Storage
 * Client-side (browser)
 * 
 * @param userId - User ID
 * @param file - Image file (PNG, JPG, SVG)
 * @returns { url, path } - Download URL and storage path
 */
export async function uploadLogo(
  userId: string,
  file: File
): Promise<{ url: string; path: string }> {
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload PNG, JPG, or SVG.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  // Create storage reference
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const storagePath = `branding/${userId}/logo_${timestamp}.${extension}`;
  const storageRef = ref(storage, storagePath);

  try {
    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    return {
      url: downloadURL,
      path: storagePath,
    };
  } catch (error) {
    console.error('Failed to upload logo:', error);
    throw new Error('Failed to upload logo. Please try again.');
  }
}

/**
 * Delete logo from Firebase Storage
 * Client-side (browser)
 */
export async function deleteLogo(storagePath: string): Promise<void> {
  if (!storagePath) return;

  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Failed to delete logo:', error);
    // Don't throw - deletion failures are non-critical
  }
}

/**
 * Reset branding to defaults
 * Client-side (browser)
 */
export async function resetBranding(userId: string): Promise<void> {
  // Get current branding to delete logo
  const current = await getBranding(userId);
  if (current.logoStoragePath) {
    await deleteLogo(current.logoStoragePath);
  }

  // Reset to defaults
  await updateBranding(userId, DEFAULT_BRANDING);
}

/**
 * Generate CSS variables string from branding
 */
export function getBrandingCSSVariables(branding: Branding): string {
  return `
    --brand-accent: ${branding.accentColor};
    --brand-primary: ${branding.primaryColor};
  `.trim();
}

/**
 * Validate hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Get branding for a service (by service owner)
 * Useful for intake forms and emails
 */
export async function getBrandingByServiceId(serviceId: string): Promise<Branding> {
  try {
    // Get service to find owner
    const serviceRef = doc(db, 'services', serviceId);
    const serviceSnap = await getDoc(serviceRef);

    if (!serviceSnap.exists()) {
      return DEFAULT_BRANDING;
    }

    const serviceData = serviceSnap.data();
    const ownerId = serviceData.createdBy || serviceData.userId;

    if (!ownerId) {
      return DEFAULT_BRANDING;
    }

    return getBranding(ownerId);
  } catch (error) {
    console.error('Failed to get branding by service:', error);
    return DEFAULT_BRANDING;
  }
}
