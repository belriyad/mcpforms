/**
 * Usage Metrics Utilities (MVP Feature #32)
 * 
 * Track document generation counts per user per day
 */

import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UsageMetrics {
  userId: string;
  date: string; // yyyy-mm-dd
  docGeneratedCount: number;
  lastUpdated: Timestamp | Date;
}

/**
 * Get today's date in yyyy-mm-dd format
 */
function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Increment document generation count for today
 */
export async function incrementDocGenerationCount(userId: string): Promise<void> {
  try {
    const today = getTodayString();
    const docPath = `usageDaily/${userId}/${today}`;
    const docRef = doc(db, docPath);

    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      // Increment existing count
      await updateDoc(docRef, {
        docGeneratedCount: increment(1),
        lastUpdated: Timestamp.now(),
      });
      console.log(`[Usage Metrics] Incremented count for ${userId} on ${today}`);
    } else {
      // Create new daily record
      const metrics: UsageMetrics = {
        userId,
        date: today,
        docGeneratedCount: 1,
        lastUpdated: Timestamp.now(),
      };
      await setDoc(docRef, metrics);
      console.log(`[Usage Metrics] Created new record for ${userId} on ${today}`);
    }
  } catch (error) {
    console.error('[Usage Metrics] Failed to increment count:', error);
    throw error;
  }
}

/**
 * Get usage metrics for a specific date
 */
export async function getUsageMetrics(userId: string, date?: string): Promise<UsageMetrics | null> {
  try {
    const targetDate = date || getTodayString();
    const docPath = `usageDaily/${userId}/${targetDate}`;
    const docRef = doc(db, docPath);

    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as UsageMetrics;
    }
    return null;
  } catch (error) {
    console.error('[Usage Metrics] Failed to fetch metrics:', error);
    return null;
  }
}

/**
 * Get today's document generation count
 */
export async function getTodayDocCount(userId: string): Promise<number> {
  const metrics = await getUsageMetrics(userId);
  return metrics?.docGeneratedCount || 0;
}

/**
 * Get usage metrics for the last N days
 */
export async function getRecentUsageMetrics(userId: string, days: number = 7): Promise<UsageMetrics[]> {
  try {
    const results: UsageMetrics[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const metrics = await getUsageMetrics(userId, dateString);
      if (metrics) {
        results.push(metrics);
      } else {
        // Add empty entry for visualization
        results.push({
          userId,
          date: dateString,
          docGeneratedCount: 0,
          lastUpdated: Timestamp.now(),
        });
      }
    }

    return results;
  } catch (error) {
    console.error('[Usage Metrics] Failed to fetch recent metrics:', error);
    return [];
  }
}

/**
 * Calculate total documents generated this week
 */
export async function getWeeklyTotal(userId: string): Promise<number> {
  const weekMetrics = await getRecentUsageMetrics(userId, 7);
  return weekMetrics.reduce((sum, m) => sum + m.docGeneratedCount, 0);
}

/**
 * Calculate total documents generated this month
 */
export async function getMonthlyTotal(userId: string): Promise<number> {
  const monthMetrics = await getRecentUsageMetrics(userId, 30);
  return monthMetrics.reduce((sum, m) => sum + m.docGeneratedCount, 0);
}
