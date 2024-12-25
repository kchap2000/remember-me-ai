import axios from 'axios';
import type { Story } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Stories
  async getStories(): Promise<Story[]> {
    const { data } = await this.api.get('/stories');
    return data;
  }

  async getStory(id: string): Promise<Story> {
    const { data } = await this.api.get(`/stories/${id}`);
    return data;
  }

  async createStory(story: Omit<Story, 'id'>): Promise<Story> {
    const { data } = await this.api.post('/stories', story);
    return data;
  }

  async updateStory(id: string, story: Partial<Story>): Promise<Story> {
    const { data } = await this.api.put(`/stories/${id}`, story);
    return data;
  }

  // AI Endpoints
  async getAISuggestion(content: string): Promise<string> {
    const { data } = await this.api.post('/ai/suggest', { content });
    return data.suggestion;
  }

  async analyzeStory(content: string): Promise<string> {
    const { data } = await this.api.post('/ai/analyze', { content });
    return data.analysis;
  }
}

export const apiService = new ApiService();