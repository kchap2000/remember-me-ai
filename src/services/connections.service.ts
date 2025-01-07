import { db } from '../config/firebase.config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import type { Connection, Story } from '../types';

class ConnectionsService {
  private async createConnection(
    userId: string,
    connection: Omit<Connection, 'id' | 'stories'>
  ) {
    const connectionsRef = collection(db, 'connections');
    const connectionDoc = doc(connectionsRef);

    await setDoc(connectionDoc, {
      ...connection,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stories: [connection.firstAppearance]
    });

    return connectionDoc.id;
  }

  async addConnectionToStory(
    userId: string,
    storyId: string,
    connectionData: {
      name: string;
      relationship: string;
      year: number;
      phaseId: string;
      storyTitle: string;
    }
  ) {
    console.log('Adding connection to story:', { userId, storyId, connectionData });

    // Check if connection already exists
    const connectionsRef = collection(db, 'connections');
    const q = query(
      connectionsRef,
      where('userId', '==', userId),
      where('name', '==', connectionData.name.trim())
    );

    const snapshot = await getDocs(q);
    let connectionId: string;
    let existingConnection: Connection | null = null;

    if (snapshot.empty) {
      console.log('Creating new connection');
      // Create new connection
      connectionId = await this.createConnection(userId, {
        name: connectionData.name,
        relationship: connectionData.relationship,
        firstAppearance: {
          storyId,
          storyTitle: connectionData.storyTitle,
          year: connectionData.year,
          phaseId: connectionData.phaseId
        }
      });
    } else {
      connectionId = snapshot.docs[0].id;
      const connectionRef = doc(connectionsRef, connectionId);
      console.log('Updating existing connection:', connectionId);
      existingConnection = {
        id: connectionId,
        ...snapshot.docs[0].data()
      } as Connection;

      // Add story to existing connection using arrayUnion
      await setDoc(
        connectionRef,
        {
          stories: arrayUnion({
            storyId,
            storyTitle: connectionData.storyTitle,
            year: connectionData.year
          })
        },
        { merge: true }
      );
    }

    // Update story with connection reference using arrayUnion
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);

    if (!storyDoc.exists()) {
      throw new Error('Story not found');
    }

    await setDoc(
      storyRef,
      {
        connections: arrayUnion(connectionId)
      },
      { merge: true }
    );

    // Return the complete connection object
    return existingConnection || {
      id: connectionId,
      name: connectionData.name,
      relationship: connectionData.relationship,
      firstAppearance: {
        storyId,
        storyTitle: connectionData.storyTitle,
        year: connectionData.year,
        phaseId: connectionData.phaseId
      },
      stories: [
        {
          storyId,
          title: connectionData.storyTitle,
          year: connectionData.year
        }
      ]
    } as Connection;
  }

  async getConnectionsForStory(storyId: string): Promise<Connection[]> {
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);

    if (!storyDoc.exists()) {
      return [];
    }

    const connectionIds = storyDoc.data().connections || [];
    const connections: Connection[] = [];

    for (const id of connectionIds || []) {
      const connectionRef = doc(db, 'connections', id);
      const connectionDoc = await getDoc(connectionRef);

      if (connectionDoc.exists()) {
        const data = connectionDoc.data();
        const stories = data.stories?.map((story: any) => ({
          storyId: story.storyId,
          title: story.storyTitle || story.title, // Handle both old and new format
          year: story.year
        })) || [];

        connections.push({
          id,
          ...data,
          stories
        } as Connection);
      }
    }

    return connections;
  }

  async getUserConnections(userId: string): Promise<Connection[]> {
    try {
      const connectionsRef = collection(db, 'connections');
      const q = query(connectionsRef, where('userId', '==', userId));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        const stories = data.stories?.map((story: any) => ({
          storyId: story.storyId,
          title: story.storyTitle || story.title,
          year: story.year
        })) || [];

        return {
          id: doc.id,
          ...data,
          stories
        } as Connection;
      });
    } catch (error) {
      console.error('Error fetching user connections:', error);
      return [];
    }
  }

  async detectConnectionsInContent(content: string, userId: string): Promise<string[]> {
    if (!content?.trim() || !userId) return [];

    try {
      const existingConnections = await this.getUserConnections(userId);
      const existingNames = new Set(existingConnections.map(c => c.name.toLowerCase()));

      const relationshipWords = [
        'mother', 'father', 'sister', 'brother', 'friend', 'teacher',
        'boss', 'colleague', 'aunt', 'uncle', 'grandmother', 'grandfather'
      ];

      const patterns = [
        new RegExp(
          `(?:my|his|her|their)\s+(${relationshipWords.join('|')})(?:\s+|,\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)`,
          'gi'
        ),
        new RegExp(
          `(?:${relationshipWords.join('|')})\s+(?:named|called|was)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)`,
          'gi'
        ),
        new RegExp(
          `([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s*,\s*(?:my|his|her|their)\s+(?:${relationshipWords.join('|')}))`,
          'gi'
        ),
        new RegExp(
          `(?:with|and)\s+(?:my|his|her|their)\s+(?:${relationshipWords.join('|')})\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)`,
          'gi'
        )
      ];

      const detectedNames = new Set<string>();

      patterns.forEach(pattern => {
        const matches = [...content.matchAll(pattern)];
        matches.forEach(match => {
          const name = (match[2] || match[1])?.trim();
          if (name && !existingNames.has(name.toLowerCase())) {
            detectedNames.add(name);
          }
        });
      });

      return Array.from(detectedNames);
    } catch (error) {
      console.error('Error detecting connections:', {
        error,
        message: error.message,
        content: content.substring(0, 100)
      });
      return [];
    }
  }
}

export const connectionsService = new ConnectionsService();