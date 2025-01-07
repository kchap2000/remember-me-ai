import { useCallback, useState } from 'react';
import { aiService } from '../../services/ai';
import type { StoryContext } from '../../types/chat';
import type { StoryAnalysis } from '../../types/analysis';

export function useStoryAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);

  const analyzeStory = useCallback(async (storyContext: StoryContext) => {
    if (!storyContext.content) return;

    setLoading(true);
    setError(null);

    try {
      const result = await aiService.analyzeStory(storyContext.content, {
        temperature: 0.7
      });

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      setAnalysis(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze story';
      setError(message);
      console.error('Story analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    analysis,
    analyzeStory
  };
}