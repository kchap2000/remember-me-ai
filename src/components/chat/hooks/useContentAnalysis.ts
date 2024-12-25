import { useCallback, useRef } from 'react';
import { aiService } from '../../../services/ai.service';
import type { Message } from '../../../types/chat';

const MINIMUM_CONTENT_LENGTH = 10;
const DEBOUNCE_DELAY = 3000;

export function useContentAnalysis(sendMessage: (message: Message) => void) {
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();
  const lastAnalyzedContent = useRef<string>('');

  const analyzeContent = useCallback(async (
    content: string,
    storyMetadata: any,
    setIsThinking: (thinking: boolean) => void
  ) => {
    // Clear any pending analysis
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Skip if content is too short or hasn't changed significantly
    if (
      content.length < MINIMUM_CONTENT_LENGTH || 
      content === lastAnalyzedContent.current
    ) {
      return;
    }

    analysisTimeoutRef.current = setTimeout(async () => {
      if (!content.trim()) return;

      setIsThinking(true);
      try {
        const response = await aiService.analyzeAndRespond({
          storyContent: content,
          storyMetadata,
          userMessage: undefined
        });
        
        if (response) {
          lastAnalyzedContent.current = content;
          sendMessage({
            id: Date.now().toString(),
            content: response,
            sender: 'ai',
            timestamp: new Date(),
            quickReplies: await aiService.generateQuickReplies()
          });
        }
      } catch (error) {
        console.error('Error analyzing content:', error);
      } finally {
        setIsThinking(false);
      }
    }, DEBOUNCE_DELAY);
  }, [sendMessage]);

  return { analyzeContent };
}