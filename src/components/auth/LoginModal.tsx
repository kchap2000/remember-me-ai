import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user.service';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export function LoginModal({ isOpen, onClose, defaultMode = 'login' }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(defaultMode === 'signup');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const { login, signup } = useAuth();

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    try {
      await userService.resetPassword(email);
      setResetSent(true);
      setError('');
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    }
  };

  useEffect(() => {
    setIsSignup(defaultMode === 'signup');
  }, [defaultMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1e1c26] rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-white text-xl font-bold mb-6">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h2>
        
        {error && (
          <p className="text-red-500 mb-4 text-sm">{error}</p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 bg-[#2b2938] text-white rounded-lg 
                       border border-[#403c53] focus:border-[#3b19e6] 
                       focus:outline-none"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 bg-[#2b2938] text-white rounded-lg 
                       border border-[#403c53] focus:border-[#3b19e6] 
                       focus:outline-none"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 bg-[#3b19e6] text-white rounded-lg 
                     hover:bg-[#2f14b8] transition-colors"
          >
            {isSignup ? 'Sign Up' : 'Log In'}
          </button>
          
          {!isSignup && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-[#a29db8] text-sm hover:text-white transition-colors mt-2"
            >
              {resetSent ? 'Reset email sent!' : 'Forgot password?'}
            </button>
          )}
        </form>
        
        <p className="mt-4 text-center text-[#a29db8]">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-[#3b19e6] hover:underline"
          >
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}