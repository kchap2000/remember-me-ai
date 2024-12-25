import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { connectionsService } from '../services/connections.service';
import type { Connection, ConnectionData } from '../types/connections';

interface ConnectionsState {
  connections: Connection[];
  selectedConnection: Connection | null;
  loading: boolean;
  error: string | null;
  fetchUserConnections: (userId: string) => Promise<void>;
  fetchStoryConnections: (storyId: string) => Promise<void>;
  setSelectedConnection: (connection: Connection | null) => void;
  addConnection: (userId: string, storyId: string, data: ConnectionData) => Promise<void>;
}

export const useConnectionsStore = create<ConnectionsState>()(persist((set) => ({
  connections: [],
  selectedConnection: null,
  loading: false,
  error: null,

  fetchUserConnections: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const connections = await connectionsService.getUserConnections(userId);
      set({ connections, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch connections', loading: false });
    }
  },

  fetchStoryConnections: async (storyId: string) => {
    set({ loading: true, error: null });
    try {
      const connections = await connectionsService.getConnectionsForStory(storyId);
      set({ connections, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch story connections', loading: false });
    }
  },

  setSelectedConnection: (connection) => {
    set({ selectedConnection: connection });
  },

  addConnection: async (userId, storyId, data) => {
    set({ loading: true, error: null });
    try {
      const newConnection = await connectionsService.addConnectionToStory(
        userId,
        storyId,
        data
      );
      set(state => ({
        connections: [...state.connections, newConnection],
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to add connection', loading: false });
    }
  }
}), {
  name: 'connections-store',
  partialize: (state) => ({
    connections: state.connections
  })
}));