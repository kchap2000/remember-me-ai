// src/services/context.service.ts
import { db } from '../config/firebase.config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { memoryAnalysisService } from './memoryAnalysis.service';
import type { ConversationContext } from '../types/chat';
import type { AnalysisResult } from '../types/analysis';

const COLLECTIONS = {
  CONTEXT: 'story_context'
} as const;

const CACHE_KEYS = {
  CONTEXT: 'story_context_cache',
  TIMESTAMP: 'story_context_timestamp'
} as const;

interface StoredContext extends ConversationContext {
  analysis: AnalysisResult;
  updatedAt: number;
  version: number; // For schema versioning
}

interface CacheEntry {
  context: StoredContext;
  timestamp: number;
}

class ContextService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
  private readonly CURRENT_SCHEMA_VERSION = 1;

  async saveContext(
    storyId: string, 
    context: ConversationContext, 
    analysis?: AnalysisResult
  ): Promise<void> {
    try {
      // Validate input
      if (!storyId || !context) {
        throw new Error('Invalid input: storyId and context are required');
      }

      // Perform analysis if not provided
      const contextAnalysis = analysis || await this.analyzeContext(context);
      
      const storedContext: StoredContext = {
        ...context,
        analysis: contextAnalysis,
        updatedAt: Date.now(),
        version: this.CURRENT_SCHEMA_VERSION
      };

      // Save to Firestore
      const contextRef = doc(db, COLLECTIONS.CONTEXT, storyId);
      await setDoc(contextRef, {
        ...storedContext,
        serverTimestamp: serverTimestamp()
      });

      // Update cache
      this.updateCache(storyId, storedContext);
      
      console.log('Context saved successfully for story:', storyId);
    } catch (error) {
      console.error('Error saving context:', error);
      throw new Error(`Failed to save context: ${error.message}`);
    }
  }

  async loadContext(storyId: string): Promise<ConversationContext | null> {
    try {
      // Check cache first
      const cachedContext = this.getFromCache(storyId);
      if (cachedContext) {
        console.log('Returning cached context for story:', storyId);
        return this.sanitizeContext(cachedContext);
      }

      // Load from Firestore
      const contextRef = doc(db, COLLECTIONS.CONTEXT, storyId);
      const contextSnap = await getDoc(contextRef);
      
      if (!contextSnap.exists()) {
        console.log('No context found for story:', storyId);
        return null;
      }

      const storedContext = contextSnap.data() as StoredContext;

      // Validate and upgrade schema if needed
      const validatedContext = await this.validateAndUpgradeContext(storedContext);
      
      // Update cache
      this.updateCache(storyId, validatedContext);

      return this.sanitizeContext(validatedContext);
    } catch (error) {
      console.error('Error loading context:', error);
      return this.handleLoadError(storyId);
    }
  }

  private updateCache(storyId: string, context: StoredContext): void {
    this.cache.set(storyId, {
      context,
      timestamp: Date.now()
    });
  }

  private getFromCache(storyId: string): StoredContext | null {
    const cached = this.cache.get(storyId);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(storyId);
      return null;
    }

    return cached.context;
  }

  private async analyzeContext(context: ConversationContext): Promise<AnalysisResult> {
    // Extract relevant content for analysis
    const content = this.extractContentFromContext(context);
    try {
      return await memoryAnalysisService.analyzeContent(content);
    } catch (error) {
      console.error('Error analyzing context:', error);
      return {
        elements: {},
        missingContexts: [],
        verifiedDetails: [],
        timestamp: Date.now()
      };
    }
  }

  private extractContentFromContext(context: ConversationContext): string {
    const messages = context.messageHistory?.messages || [];
    return messages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.content || '')
      .join(' ');
  }

  private async validateAndUpgradeContext(
    context: StoredContext
  ): Promise<StoredContext> {
    // Handle schema version upgrades
    if (!context.version || context.version < this.CURRENT_SCHEMA_VERSION) {
      return await this.upgradeContextSchema(context);
    }
    return context;
  }

  private async upgradeContextSchema(
    oldContext: StoredContext
  ): Promise<StoredContext> {
    // Implement schema upgrades here
    const upgradedContext: StoredContext = {
      ...oldContext,
      version: this.CURRENT_SCHEMA_VERSION,
      // Add any new required fields
      analysis: oldContext.analysis || await this.analyzeContext(oldContext)
    };
    return upgradedContext;
  }

  private sanitizeContext(context: StoredContext): ConversationContext {
    return {
      recentTopics: context.recentTopics || [],
      currentStoryDetails: context.currentStoryDetails || {},
      userPreferences: context.userPreferences || {
        detailLevel: 'medium',
        tone: 'casual'
      },
      messageHistory: context.messageHistory || {
        messages: [],
        lastMessageId: null
      }
    };
  }

  private async handleLoadError(storyId: string): Promise<ConversationContext | null> {
    // Try to recover from cache even if expired
    const cached = this.cache.get(storyId);
    if (cached) {
      console.warn('Returning expired cache due to load error');
      return this.sanitizeContext(cached.context);
    }
    return null;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const contextService = new ContextService();