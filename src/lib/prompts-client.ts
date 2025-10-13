/**
 * Prompt Library Utilities (Client-Side)
 * Feature #12: Reusable AI Prompts
 * 
 * Manages CRUD operations for user's saved AI prompts (browser only).
 */

import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  Timestamp 
} from 'firebase/firestore';

export interface AIPrompt {
  id: string;
  title: string;
  body: string;
  placeholder?: string;
  category?: 'contract' | 'clause' | 'general';
  createdAt: Date | any;
  updatedAt: Date | any;
  usageCount?: number;
}

/**
 * Save a new prompt to user's library
 * Client-side (browser)
 */
export async function savePrompt(userId: string, prompt: Omit<AIPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<string> {
  const now = Timestamp.now();
  const newPrompt: AIPrompt = {
    id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...prompt,
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
  };

  const userSettingsRef = doc(db, 'userSettings', userId);
  await updateDoc(userSettingsRef, {
    prompts: arrayUnion(newPrompt),
  });

  return newPrompt.id;
}

/**
 * Get all prompts for a user
 * Client-side (browser)
 */
export async function getPrompts(userId: string): Promise<AIPrompt[]> {
  const userSettingsRef = doc(db, 'userSettings', userId);
  const docSnap = await getDoc(userSettingsRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return (data.prompts || []) as AIPrompt[];
  }

  return [];
}

/**
 * Update an existing prompt
 * Client-side (browser)
 */
export async function updatePrompt(
  userId: string,
  promptId: string,
  updates: Partial<Omit<AIPrompt, 'id' | 'createdAt'>>
): Promise<void> {
  const prompts = await getPrompts(userId);
  const promptIndex = prompts.findIndex(p => p.id === promptId);

  if (promptIndex === -1) {
    throw new Error('Prompt not found');
  }

  const updatedPrompt = {
    ...prompts[promptIndex],
    ...updates,
    updatedAt: Timestamp.now(),
  };

  // Remove old prompt and add updated one
  const userSettingsRef = doc(db, 'userSettings', userId);
  await updateDoc(userSettingsRef, {
    prompts: arrayRemove(prompts[promptIndex]),
  });
  await updateDoc(userSettingsRef, {
    prompts: arrayUnion(updatedPrompt),
  });
}

/**
 * Delete a prompt
 * Client-side (browser)
 */
export async function deletePrompt(userId: string, promptId: string): Promise<void> {
  const prompts = await getPrompts(userId);
  const promptToDelete = prompts.find(p => p.id === promptId);

  if (!promptToDelete) {
    throw new Error('Prompt not found');
  }

  const userSettingsRef = doc(db, 'userSettings', userId);
  await updateDoc(userSettingsRef, {
    prompts: arrayRemove(promptToDelete),
  });
}

/**
 * Increment usage count for a prompt
 * Client-side (browser)
 */
export async function incrementPromptUsage(userId: string, promptId: string): Promise<void> {
  const prompts = await getPrompts(userId);
  const prompt = prompts.find(p => p.id === promptId);

  if (!prompt) {
    throw new Error('Prompt not found');
  }

  const updatedPrompt = {
    ...prompt,
    usageCount: (prompt.usageCount || 0) + 1,
    updatedAt: Timestamp.now(),
  };

  const userSettingsRef = doc(db, 'userSettings', userId);
  await updateDoc(userSettingsRef, {
    prompts: arrayRemove(prompt),
  });
  await updateDoc(userSettingsRef, {
    prompts: arrayUnion(updatedPrompt),
  });
}

/**
 * Export prompts to JSON
 */
export function exportPromptsToJSON(prompts: AIPrompt[]): string {
  return JSON.stringify(prompts, null, 2);
}

/**
 * Import prompts from JSON
 */
export function importPromptsFromJSON(jsonString: string): AIPrompt[] {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid format: expected array');
    }
    
    // Validate structure
    return parsed.map((p, index) => {
      if (!p.title || !p.body) {
        throw new Error(`Invalid prompt at index ${index}: missing title or body`);
      }
      return {
        ...p,
        id: p.id || `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: p.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
        usageCount: p.usageCount || 0,
      };
    });
  } catch (error) {
    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}
