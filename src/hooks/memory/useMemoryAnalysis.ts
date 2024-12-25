import { useCallback } from 'react';
import debounce from 'lodash/debounce';
import { memoryAnalysis } from '../../services/memory';
import { aiService } from '../../services/ai.service';

export function useMemoryAnalysis(storyId: string | null) {
  return useCallback(
    debounce(async (content: string, title: string) => {
      if (!content?.trim()) return;
      
      try {
        // Analyze content
        const analysis = await memoryAnalysis.analyzeContent(content);
        
        // Update AI context with analysis results
        if (storyId) {
          await aiService.updateContext({
            type: 'UPDATE_STORY_DETAILS',
            payload: { 
              mainTopic: title, 
              content,
              analysis
            }
          });
        }

        return analysis;
      } catch (error) {
        console.error('Error analyzing memory:', error);
        return null;
      }
    }, 1000),
    [storyId]
  );
}