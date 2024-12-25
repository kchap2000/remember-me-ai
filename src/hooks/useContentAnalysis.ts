import { useCallback } from 'react';
import debounce from 'lodash/debounce';
import { aiService } from '../services/ai.service';
import { memoryAnalysisService } from '../services/memoryAnalysis.service';

export function useContentAnalysis(storyId: string | null) {
  const analyzeContent = useCallback(
    debounce(async (content: string, title: string) => {
      if (!content?.trim()) return;
      
      try {
        const analysis = await memoryAnalysisService.analyzeContent(content);
        
        // Update AI context with analysis results
        await aiService.updateContext({
          type: 'UPDATE_STORY_DETAILS',
          payload: { 
            mainTopic: title, 
            content,
            analysis
          }
        });

        return analysis;
      } catch (error) {
        console.error('Error analyzing content:', error);
        return null;
      }
    }, 1000),
    [storyId]
  );

  return analyzeContent;
}