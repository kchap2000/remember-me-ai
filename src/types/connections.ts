export interface ConnectionAppearance {
  storyId: string;
  storyTitle: string;
  year: number;
  phaseId: string;
}

export interface Connection {
  id: string;
  name: string;
  relationship: string;
  firstAppearance: ConnectionAppearance;
  stories: {
    storyId: string;
    title: string;
    year: number;
  }[];
  notes?: string;
}

export interface ConnectionData {
  name: string;
  relationship: string;
  year: number;
  phaseId: string;
  storyTitle: string;
}