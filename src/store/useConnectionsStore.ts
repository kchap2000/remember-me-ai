import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { connectionsService } from '../services/connections.service';
import type { Connection } from '../types';

interface ConnectionsState {
 connections: Connection[];
 suggestedConnections: Connection[];
 selectedConnection: Connection | null;
 loading: boolean;
 error: string | null;
 storyConnections: Connection[];
 
 fetchUserConnections: (userId: string) => Promise<void>;
 fetchStoryConnections: (storyId: string) => Promise<void>; 
 setSelectedConnection: (connection: Connection | null) => void;
 addConnectionToStory: (
   userId: string,
   storyId: string,
   data: {
     name: string;
     relationship: string;
     year: number;
     phaseId: string;
     storyTitle: string;
   }
 ) => Promise<void>;
 setSuggestedConnections: (connections: Connection[]) => void;
}

export const useConnectionsStore = create<ConnectionsState>()(
 persist(
   (set, get) => ({
     connections: [],
     suggestedConnections: [],
     selectedConnection: null,
     loading: false,
     error: null,
     storyConnections: [],

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
         set({ storyConnections: connections, loading: false });
       } catch (error) {
         set({ error: 'Failed to fetch story connections', loading: false });
       }
     },

     setSelectedConnection: (connection) => {
       set({ selectedConnection: connection });
     },

     addConnectionToStory: async (userId, storyId, data) => {
       set({ loading: true, error: null });
       try {
         const newConnection = await connectionsService.addConnectionToStory(
           userId,
           storyId,
           data
         );
         
         // Update both user and story connections
         const { connections, storyConnections } = get();
         set({
           connections: [...connections, newConnection],
           storyConnections: [...storyConnections, newConnection],
           loading: false
         });
         
       } catch (error) {
         set({ error: 'Failed to add connection', loading: false });
       }
     },

     setSuggestedConnections: (connections) => {
       set({ suggestedConnections: connections });
     }
   }),
   {
     name: 'connections-store',
     partialize: (state) => ({
       connections: state.connections,
       suggestedConnections: state.suggestedConnections
     })
   }
 )
);