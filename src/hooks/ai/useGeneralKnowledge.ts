import { useCallback, useState } from 'react';
import { aiService } from '../../services/ai';

interface UseGeneralKnowledgeOptions {
  onResponse?: (response: string) => void;
}

export function useGeneralKnowledge(options: UseGeneralKnowledgeOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getKnowledge = useCallback(async (
    query: string,
    context: { year?: number; location?: string }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await aiService.getGeneralKnowledge(query, context);
      if (response.success) {
        options.onResponse?.(response.text);
        return response.text;
      } else {
        throw new Error(response.error || 'Failed to fetch information');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch information';
      setError(message);
      console.error('General knowledge error:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    loading,
    error,
    getKnowledge
  };
}