import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { userService } from '../../services/user.service';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export function PasswordResetModal({ isOpen, onClose, email }: PasswordResetModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await userService.updatePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setError('Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      await userService.resetPassword(email);
      setSuccess(true);
      setError('');
    } catch (error) {
      setError('Failed to send reset email');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1c26] rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#a29db8] hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Lock className="text-[#3b19e6]" size={24} />
          <h2 className="text-xl font-bold text-white">Change Password</h2>
        </div>

        {success ? (
          <div className="text-green-500 text-center py-4">
            Password updated successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm text-[#a29db8] mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#2b2938] border border-[#403c53] 
                         rounded-lg text-white focus:border-[#3b19e6] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#a29db8] mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#2b2938] border border-[#403c53] 
                         rounded-lg text-white focus:border-[#3b19e6] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#a29db8] mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#2b2938] border border-[#403c53] 
                         rounded-lg text-white focus:border-[#3b19e6] outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#3b19e6] text-white rounded-lg 
                       hover:bg-[#2f14b8] transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-[#3b19e6] text-sm hover:underline"
            >
              Forgot your password?
            </button>
          </form>
        )}
      </div>
    </div>
  );
}