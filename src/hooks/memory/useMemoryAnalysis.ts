import { useCallback } from 'react';
import debounce from 'lodash/debounce';
import { memoryAnalysis } from '../../services/memory';
import { aiService } from '../../services/ai.service';
import { connectionsService } from '../../services/connections.service';
import { useConnectionsStore } from '../../store/useConnectionsStore';

export function useMemoryAnalysis(storyId: string | null) {
  const { setSuggestedConnections } = useConnectionsStore();

  return useCallback(
    debounce(async (content: string, title: string) => {
      if (!content?.trim()) return;
      
      try {
        // Analyze content
        const analysis = await memoryAnalysis.analyzeContent(content);
        
        // Detect potential connections
        const suggestedConnections = await connectionsService.detectConnectionsInContent(content);
        if (suggestedConnections?.length > 0) {
          console.log('Detected potential connections:', suggestedConnections);
          setSuggestedConnections(suggestedConnections);
        }

        // Update AI context with analysis results
        if (storyId) {
          try {
            await aiService.updateContext({
              type: 'UPDATE_STORY_DETAILS',
              payload: { 
                mainTopic: title, 
                content,
                analysis,
                suggestedConnections
              }
            });
          } catch (contextError) {
            console.warn('Failed to update AI context:', contextError);
          }
        }

        return {
          ...analysis,
          suggestedConnections
        };
      } catch (error: any) {
        console.error('Error analyzing memory:', {
          error,
          message: error.message,
          stack: error.stack,
          content: content.substring(0, 100)
        });
        return null;
      }
    }, 1000),
    [storyId, setSuggestedConnections]
  );
}