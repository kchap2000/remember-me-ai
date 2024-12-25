import type { TimelineMetadata } from './timeline';

export interface Story {
  id?: string;
  title: string;
  content: string;
  userId: string;
  connections: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  coverImage?: string;
  timelineMetadata?: TimelineMetadata;
}

export interface StoryData {
  title: string;
  content: string;
  coverImage?: string;
  userId: string;
}

export interface ContentHistoryItem {
  content: string;
  timestamp: number;
}

export interface StoryEditorProps {
  storyId?: string;
}