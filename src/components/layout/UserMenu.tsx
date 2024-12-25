import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, Calendar, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { userService } from '../../services/user.service';
import { PasswordResetModal } from './PasswordResetModal';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserMenu({ isOpen, onClose }: UserMenuProps) {
  const { currentUser, logout } = useAuth();
  const { birthYear, setBirthYear } = usePreferencesStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (currentUser?.uid) {
        const profile = await userService.getUserProfile(currentUser.uid);
        if (profile) {
          setFirstName(profile.firstName || '');
          setLastName(profile.lastName || '');
          setNickname(profile.nickname || '');
        }
      }
    };
    loadProfile();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    try {
      if (!currentUser?.uid) return;
      
      await userService.updateUserProfile(currentUser.uid, {
        firstName,
        lastName,
        nickname,
        birthYear
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-80 bg-[#1e1c26] rounded-xl 
                shadow-lg border border-[#403c53] overflow-hidden z-50"
    >
      <div className="p-4 space-y-4">
        <h3 className="text-white font-semibold">Profile Settings</h3>
        
        {showSuccess && (
          <div className="bg-green-500/10 text-green-500 px-3 py-2 rounded-lg text-sm">
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm text-[#a29db8] mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-[#2b2938] border border-[#403c53] 
                         rounded-lg text-white focus:border-[#3b19e6] outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-[#a29db8] mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-[#2b2938] border border-[#403c53] 
                         rounded-lg text-white focus:border-[#3b19e6] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#a29db8] mb-1">Nickname (Optional)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 bg-[#2b2938] border border-[#403c53] 
                       rounded-lg text-white focus:border-[#3b19e6] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-[#a29db8] mb-1">Birth Year</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a29db8]" size={16} />
              <input
                type="number"
                value={birthYear || ''}
                onChange={(e) => setBirthYear(parseInt(e.target.value))}
                min={1900}
                max={new Date().getFullYear()}
                className="w-full pl-10 pr-3 py-2 bg-[#2b2938] border border-[#403c53] 
                         rounded-lg text-white focus:border-[#3b19e6] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            className="w-full py-2 bg-[#3b19e6] text-white rounded-lg 
                     hover:bg-[#2f14b8] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="border-t border-[#403c53] p-2">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center gap-2 px-4 py-2 text-[#a29db8] 
                   hover:text-white hover:bg-[#2b2938] rounded-lg transition-colors"
        >
          <Lock size={16} />
          <span>Change Password</span>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 text-[#a29db8] 
                   hover:text-white hover:bg-[#2b2938] rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
      
      <PasswordResetModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        email={currentUser?.email || ''}
      />
    </div>
  );
}