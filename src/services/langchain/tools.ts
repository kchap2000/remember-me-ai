import { Tool } from '@langchain/core/tools';
import { memoryAnalysis } from '../memory';
import { connectionsService } from '../connections.service';

export class StoryAnalysisTool extends Tool {
  name = 'story_analysis';
  description = 'Analyzes story content to identify key elements, themes, and missing context';

  async _call(content: string): Promise<string> {
    try {
      const analysis = await memoryAnalysis.analyzeContent(content);
      return JSON.stringify(analysis);
    } catch (error) {
      return 'Failed to analyze story content';
    }
  }
}

export class ConnectionDetectionTool extends Tool {
  name = 'connection_detection';
  description = 'Detects potential connections (people) mentioned in the story';

  constructor(private userId: string) {
    super();
  }

  async _call(content: string): Promise<string> {
    try {
      const connections = await connectionsService.detectConnectionsInContent(content, this.userId);
      return JSON.stringify(connections);
    } catch (error) {
      return 'Failed to detect connections';
    }
  }
}