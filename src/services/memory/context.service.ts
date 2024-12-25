import { db } from '../../config/firebase.config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { ConversationContext } from '../../types/chat';
import type { AnalysisResult } from '../../types/analysis';

const COLLECTIONS = {
  CONTEXT: 'story_context'
} as const;

class ContextService {
  private cache = new Map<string, {
    context: ConversationContext;
    timestamp: number;
  }>();

  async saveContext(
    storyId: string, 
    context: ConversationContext,
    analysis?: AnalysisResult
  ): Promise<void> {
    try {
      const contextRef = doc(db, COLLECTIONS.CONTEXT, storyId);
      await setDoc(contextRef, {
        ...context,
        analysis,
        updatedAt: new Date()
      });

      this.cache.set(storyId, {
        context,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error saving context:', error);
    }
  }

  async loadContext(storyId: string): Promise<ConversationContext | null> {
    try {
      // Check cache first
      const cached = this.cache.get(storyId);
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
        return cached.context;
      }

      const contextRef = doc(db, COLLECTIONS.CONTEXT, storyId);
      const contextSnap = await getDoc(contextRef);
      
      if (!contextSnap.exists()) return null;

      const context = contextSnap.data() as ConversationContext;
      
      this.cache.set(storyId, {
        context,
        timestamp: Date.now()
      });

      return context;
    } catch (error) {
      console.error('Error loading context:', error);
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const contextService = new ContextService();