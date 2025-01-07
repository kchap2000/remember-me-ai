import { useCallback, useState } from 'react';
import { aiService } from '../../services/ai';
import type { StoryContext } from '../../types/chat';

export function useSuggestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateSuggestions = useCallback(async (storyContext: StoryContext) => {
    if (!storyContext.content) return;

    setLoading(true);
    setError(null);

    try {
      const result = await aiService.analyzeStory(storyContext.content, {
        temperature: 0.7
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate suggestions');
      }

      setSuggestions(result.suggestions);
      return result.suggestions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate suggestions';
      setError(message);
      console.error('Suggestions error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    suggestions,
    generateSuggestions
  };
}