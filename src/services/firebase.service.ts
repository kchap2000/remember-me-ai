import { db } from '../config/firebase.config';
import { usePreferencesStore } from '../store/usePreferencesStore';
import {
  collection,
  doc,
  deleteDoc,
  addDoc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import type { Story, StoryData } from '../types';

const COLLECTIONS = {
  STORIES: 'stories'
} as const;

const QUERY_LIMITS = {
  DEFAULT_PAGE_SIZE: 10
} as const;

const ERRORS = {
  INDEX_MISSING: 'failed-precondition',
  PERMISSION_DENIED: 'permission-denied',
  UNAVAILABLE: 'unavailable'
} as const;

const handleFirestoreError = (error: any, operation: string) => {
  if (error.code === 'failed-precondition') {
    console.warn(`Index missing for ${operation}. Please wait for index deployment to complete.`);
  } else if (error.code === 'unavailable') {
    console.warn(`Firestore is currently unavailable. Operating in offline mode for ${operation}.`);
  } else {
    console.error(`Error during ${operation}:`, error);
  }
  return null;
};

class FirebaseService {
  private processQuerySnapshot(snapshot: FirebaseFirestore.QuerySnapshot) {
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Story;
    });
  }

  async createStory(userId: string, data: Partial<StoryData>) {
    try {
      if (!userId) {
        throw new Error('User ID is required to create a story');
      }

      const storiesRef = collection(db, COLLECTIONS.STORIES);
      const storyData = {
        ...data,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'draft'
      };
      
      const docRef = await addDoc(storiesRef, storyData);
      console.log('Created story with ID:', docRef.id, 'for user:', userId);
      return docRef.id;
    } catch (error: any) {
      handleFirestoreError(error, 'create story');
      throw error;
    }
  }

  async updateStory(storyId: string, data: Partial<Story>) {
    try {
      const storyRef = doc(db, COLLECTIONS.STORIES, storyId);
      const currentStory = await getDoc(storyRef);
      
      if (!currentStory.exists()) {
        throw new Error('Story not found');
      }

      await setDoc(storyRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('Updated story:', storyId);
    } catch (error: any) {
      handleFirestoreError(error, 'update story');
      throw error;
    }
  }

  async getStory(storyId: string) {
    const storyRef = doc(db, COLLECTIONS.STORIES, storyId);
    const docSnap = await getDoc(storyRef);
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Story;
  }

  async deleteStory(storyId: string) {
    try {
      const storyRef = doc(db, COLLECTIONS.STORIES, storyId);
      await deleteDoc(storyRef);
      console.log('Successfully deleted story:', storyId);
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }

  async getUserStories(userId: string) {
    try {
      if (!userId) {
        console.warn('getUserStories: No user ID provided');
        return [];
      }

      let stories: Story[] = [];
      const storiesRef = collection(db, COLLECTIONS.STORIES);

      try {
        // Try optimal query first (with index)
        const optimalQuery = query(
          storiesRef,
          where('userId', '==', userId),
          orderBy('updatedAt', 'desc'),
          limit(QUERY_LIMITS.DEFAULT_PAGE_SIZE)
        );
        
        const snapshot = await getDocs(optimalQuery);
        stories = this.processQuerySnapshot(snapshot);
        
      } catch (indexError: any) {
        if (indexError.code === ERRORS.INDEX_MISSING) {
          console.warn('Index not ready - using fallback query');
          
          // Fallback: basic query without ordering
          const fallbackQuery = query(
            storiesRef,
            where('userId', '==', userId)
          );
          
          const snapshot = await getDocs(fallbackQuery);
          stories = this.processQuerySnapshot(snapshot);

          // Sort client-side as fallback
          stories.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          stories = stories.slice(0, QUERY_LIMITS.DEFAULT_PAGE_SIZE);
        } else {
          throw indexError;
        }
      }

      console.log(`Successfully fetched ${stories.length} stories for user:`, userId);
      return stories;

    } catch (error: any) {
      if (error.code === ERRORS.PERMISSION_DENIED) {
        console.error('Permission denied accessing stories');
      } else if (error.code === ERRORS.UNAVAILABLE) {
        console.warn('Firestore unavailable - operating in offline mode');
      } else {
        console.error('Error fetching user stories:', error);
      }
      return [];
    }
  }
}

export const firebaseService = new FirebaseService();
