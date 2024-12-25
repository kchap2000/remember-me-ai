import type { Story } from './story';

export interface TimelineMetadata {
  primaryYear: number;
  relatedYears: number[];
  phaseId?: string;
  tags: string[];
}

export interface TimelineIndex {
  [year: number]: {
    primaryStories: string[];
    relatedStories: string[];
  }
}

export interface LifePhase {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  color: string;
}

export interface TimelineYear {
  year: number;
  completed: boolean;
  stories: Story[];
  phase?: string;
}