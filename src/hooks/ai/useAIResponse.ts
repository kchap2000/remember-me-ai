import { useCallback, useState } from 'react';
import { aiService } from '../../services/ai';
import type { Message } from '../../types/chat';

interface UseAIResponseOptions {
  onResponse?: (response: string) => void;
  temperature?: number;
}

export function useAIResponse(options: UseAIResponseOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = useCallback(async (message: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await aiService.generateSuggestion(message);
      options.onResponse?.(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate response';
      setError(message);
      console.error('AI response error:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    loading,
    error,
    generateResponse
  };
}