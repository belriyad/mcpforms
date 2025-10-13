/**
 * Activity Log Utilities (MVP Feature #22)
 * 
 * Tracks intake submissions, document generations, and email events
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ActivityLogType = 
  | 'intake_submitted'
  | 'doc_generated'
  | 'email_sent'
  | 'template_uploaded'
  | 'service_created'
  | 'ai_section_generated';

export interface ActivityLogEntry {
  id?: string;
  type: ActivityLogType;
  userId: string;
  serviceId?: string;
  intakeId?: string;
  templateId?: string;
  timestamp: Timestamp | Date;
  meta?: {
    documentName?: string;
    emailTemplate?: string;
    templateName?: string;
    serviceName?: string;
    clientEmail?: string;
    error?: string;
    [key: string]: any;
  };
}

/**
 * Create a new activity log entry
 */
export async function logActivity(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): Promise<string> {
  try {
    const logEntry: ActivityLogEntry = {
      ...entry,
      timestamp: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'activityLogs'), logEntry);
    console.log(`[Activity Log] ${entry.type} logged for user ${entry.userId}`);
    return docRef.id;
  } catch (error) {
    console.error('[Activity Log] Failed to create log entry:', error);
    throw error;
  }
}

/**
 * Get recent activity logs for a user
 */
export async function getUserActivityLogs(
  userId: string, 
  maxResults: number = 50
): Promise<ActivityLogEntry[]> {
  try {
    const logsQuery = query(
      collection(db, 'activityLogs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityLogEntry[];
  } catch (error) {
    console.error('[Activity Log] Failed to fetch logs:', error);
    return [];
  }
}

/**
 * Get activity logs filtered by type
 */
export async function getActivityLogsByType(
  userId: string,
  type: ActivityLogType,
  maxResults: number = 50
): Promise<ActivityLogEntry[]> {
  try {
    const logsQuery = query(
      collection(db, 'activityLogs'),
      where('userId', '==', userId),
      where('type', '==', type),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityLogEntry[];
  } catch (error) {
    console.error(`[Activity Log] Failed to fetch ${type} logs:`, error);
    return [];
  }
}

/**
 * Helper functions for specific log types
 */

export function logIntakeSubmission(userId: string, serviceId: string, intakeId: string, clientEmail?: string) {
  return logActivity({
    type: 'intake_submitted',
    userId,
    serviceId,
    intakeId,
    meta: { clientEmail },
  });
}

export function logDocumentGeneration(userId: string, serviceId: string, documentName: string) {
  return logActivity({
    type: 'doc_generated',
    userId,
    serviceId,
    meta: { documentName },
  });
}

export function logEmailSent(userId: string, emailTemplate: string, serviceId?: string) {
  return logActivity({
    type: 'email_sent',
    userId,
    serviceId,
    meta: { emailTemplate },
  });
}

export function logTemplateUpload(userId: string, templateId: string, templateName: string) {
  return logActivity({
    type: 'template_uploaded',
    userId,
    templateId,
    meta: { templateName },
  });
}

export function logServiceCreation(userId: string, serviceId: string, serviceName: string) {
  return logActivity({
    type: 'service_created',
    userId,
    serviceId,
    meta: { serviceName },
  });
}

export function logAISectionGeneration(userId: string, serviceId: string, placeholder: string) {
  return logActivity({
    type: 'ai_section_generated',
    userId,
    serviceId,
    meta: { placeholder },
  });
}
