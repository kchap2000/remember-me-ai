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
 deleteConnection: (connectionId: string) => Promise<void>;
 removeConnectionFromStory: (storyId: string, connectionId: string) => Promise<void>;
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
        // Optimistic update
        const optimisticConnection = {
          id: `temp-${Date.now()}`,
          name: data.name,
          relationship: data.relationship,
          firstAppearance: {
            storyId,
            storyTitle: data.storyTitle,
            year: data.year,
            phaseId: data.phaseId
          },
          stories: [{
            storyId,
            title: data.storyTitle,
            year: data.year
          }]
        };

        // Update UI immediately
        set(state => ({
          storyConnections: [...state.storyConnections, optimisticConnection]
        }));

        // Make API call
        const newConnection = await connectionsService.addConnectionToStory(
          userId,
          storyId,
          data
        );
        
        // Update with real data
        set(state => ({
          storyConnections: state.storyConnections
            .filter(c => c.id !== optimisticConnection.id)
            .concat(newConnection),
          connections: [...state.connections, newConnection],
          loading: false
        }));
        
      } catch (error) {
        // Revert optimistic update on error
        set(state => ({
          storyConnections: state.storyConnections.filter(c => !c.id.startsWith('temp-')),
          error: 'Failed to add connection',
          loading: false
        }));
        console.error('Error adding connection:', error);
        throw error;
      }
     },

     deleteConnection: async (connectionId: string) => {
       set({ loading: true, error: null });
       try {
         await connectionsService.deleteConnection(connectionId);
         
         // Update local state
         set(state => ({
           connections: state.connections.filter(c => c.id !== connectionId),
           storyConnections: state.storyConnections.filter(c => c.id !== connectionId),
           selectedConnection: null,
           loading: false
         }));
       } catch (error) {
         set({ error: 'Failed to delete connection', loading: false });
       }
     },

     removeConnectionFromStory: async (storyId: string, connectionId: string) => {
       set({ loading: true, error: null });
       try {
         await connectionsService.removeConnectionFromStory(storyId, connectionId);
         
         // Update local state
         set(state => ({
           storyConnections: state.storyConnections.filter(c => c.id !== connectionId),
           loading: false
         }));
       } catch (error) {
         set({ error: 'Failed to remove connection from story', loading: false });
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