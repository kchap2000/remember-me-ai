import { openai } from '../config/ai.config';
import { LIFE_PHASES } from '../config/timeline.config';
import { firebaseService } from './firebase.service';
import type { Story, StoryTimelineMetadata } from '../types';

class TimelineService {
  private timelineIndex: Record<number, Story[]> = {};

  async fetchStoriesForTimeline(userId: string) {
    try {
      const stories = await firebaseService.getUserStories(userId);
      if (!stories.length) {
        console.warn('No stories available to index for timeline');
        return this.timelineIndex;
      }

      // Reset index
      this.timelineIndex = {};
      
      // Index stories by year
      stories.forEach(story => {
        if (story.timelineMetadata?.primaryYear) {
          const year = story.timelineMetadata.primaryYear;
          if (!this.timelineIndex[year]) {
            this.timelineIndex[year] = [];
          }
          this.timelineIndex[year].push(story);
        }
        
        // Also index related years
        story.timelineMetadata?.relatedYears?.forEach(year => {
          if (!this.timelineIndex[year]) {
            this.timelineIndex[year] = [];
          }
          if (!this.timelineIndex[year].find(s => s.id === story.id)) {
            this.timelineIndex[year].push(story);
          }
        });
      });
      
      return this.timelineIndex;
    } catch (error) {
      console.error('Error fetching stories for timeline:', error);
      return {};
    }
  }

  getStoriesForYear(year: number): Story[] {
    return this.timelineIndex[year] || [];
  }

  private extractYearsFromText(text: string): number[] {
    const years: number[] = [];
    
    // Match full years (e.g., "1985")
    const fullYearMatches = text.match(/\b(19|20)\d{2}\b/g);
    if (fullYearMatches) {
      years.push(...fullYearMatches.map(Number));
    }
    
    // Match age references (e.g., "when I was 5")
    const ageMatches = text.match(/(?:when I was|at age|aged?) (\d{1,2})/gi);
    if (ageMatches) {
      // Convert ages to years based on birth year (handled in analyzeContent)
    }
    
    return [...new Set(years)];
  }

  private async analyzeContent(content: string, birthYear: number): Promise<StoryTimelineMetadata> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Analyze the following story text to determine:
              1. The primary year the story takes place
              2. Any other years mentioned
              3. Relevant tags
              4. Convert any age references to years (birth year: ${birthYear})
              
              Respond in JSON format:
              {
                "primaryYear": number,
                "relatedYears": number[],
                "tags": string[]
              }`
          },
          {
            role: 'user',
            content
          }
        ]
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        primaryYear: analysis.primaryYear || new Date().getFullYear(),
        relatedYears: analysis.relatedYears || [],
        tags: analysis.tags || []
      };
    } catch (error) {
      console.error('Error analyzing story content:', error);
      
      // Fallback to basic year extraction
      const extractedYears = this.extractYearsFromText(content);
      return {
        primaryYear: extractedYears[0] || new Date().getFullYear(),
        relatedYears: extractedYears.slice(1),
        tags: []
      };
    }
  }

  async processStory(story: Story, birthYear: number): Promise<StoryTimelineMetadata> {
    if (!story.content) {
      return {
        primaryYear: new Date().getFullYear(),
        relatedYears: [],
        tags: [],
        phaseId: undefined
      };
    }

    const metadata = await this.analyzeContent(story.content, birthYear);
    
    // Determine phase based on primary year
    const age = metadata.primaryYear - birthYear;
    const phase = LIFE_PHASES.find(
      p => age >= p.startAge && age <= p.endYear
    );
    
    return {
      ...metadata,
      phaseId: phase?.id
    };
  }
}

export const timelineService = new TimelineService();
