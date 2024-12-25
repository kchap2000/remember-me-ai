import { create } from 'zustand';
import { firebaseService } from '../services/firebase.service';
import type { Story } from '../types';

interface StoreState {
  stories: Story[];
  currentStory: Story | null;
  loading: boolean;
  error: string | null;
  fetchStories: (userId: string) => Promise<void>;
  setCurrentStory: (story: Story | null) => void;
  createStory: (userId: string, storyData: Partial<Story>) => Promise<string>;
  updateStory: (storyId: string, data: Partial<Story>) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  stories: [],
  currentStory: null,
  loading: false,
  error: null,

  fetchStories: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const stories = await firebaseService.getUserStories(userId);
      set({ stories, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch stories', loading: false });
    }
  },

  setCurrentStory: (story: Story | null) => {
    set({ currentStory: story });
  },

  createStory: async (userId: string, storyData: Partial<Story>) => {
    set({ loading: true, error: null });
    try {
      const storyId = await firebaseService.createStory(userId, storyData);
      const story = await firebaseService.getStory(storyId);
      if (story) {
        set(state => ({ 
          stories: [story, ...state.stories],
          currentStory: story,
          loading: false 
        }));
      }
      return storyId;
    } catch (error) {
      set({ error: 'Failed to create story', loading: false });
      throw error;
    }
  },

  updateStory: async (storyId: string, data: Partial<Story>) => {
    set({ loading: true, error: null });
    try {
      await firebaseService.updateStory(storyId, data);
      const updatedStory = await firebaseService.getStory(storyId);
      if (updatedStory) {
        set(state => ({
          stories: state.stories.map(s => 
            s.id === storyId ? updatedStory : s
          ),
          currentStory: state.currentStory?.id === storyId 
            ? updatedStory 
            : state.currentStory,
          loading: false
        }));
      }
    } catch (error) {
      set({ error: 'Failed to update story', loading: false });
      throw error;
    }
  }
}));