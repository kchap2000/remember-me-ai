import { auth, db } from '../config/firebase.config';
import { 
  updateProfile, 
  updatePassword, 
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface UserProfile {
  firstName: string;
  lastName: string;
  nickname?: string;
  birthYear?: number;
}

class UserService {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data() as UserProfile : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, profile, { merge: true });
      
      // Update display name in Firebase Auth if first/last name provided
      if (profile.firstName || profile.lastName) {
        const displayName = [profile.firstName, profile.lastName]
          .filter(Boolean)
          .join(' ');
        
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName });
        }
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user logged in');
    }

    try {
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Failed to update password');
    }
  }
}

export const userService = new UserService();