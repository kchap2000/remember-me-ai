import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../styles';
import { components } from '../../styles/components';
import { UserAvatar, UserMenu } from './user';
import { LoginModal } from '../auth/LoginModal';

export function Header() {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser } = useAuth();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full",
        "flex flex-col sm:flex-row items-start sm:items-center justify-between",
        "px-4 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-0",
        "bg-bg-primary/95 backdrop-blur-sm",
        "border-b border-border-subtle",
        "shadow-md"
      )}>
        <Link 
          to="/"
          className={cn(
            "flex items-center gap-3 w-full sm:w-auto justify-between",
            "text-text-primary hover:text-text-tertiary",
            "transition-colors duration-200"
          )}
        >
          <div className="w-8 h-8 text-accent-primary">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Remember Me AI</h2>
          <button
            className="sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} className="text-text-primary" />
          </button>
        </Link>

        <div className={cn(
          "flex flex-col sm:flex-row sm:flex-1 sm:justify-end gap-4 sm:gap-8",
          "w-full sm:w-auto",
          mobileMenuOpen ? "block" : "hidden sm:flex"
        )}>
          <div className="flex items-center gap-9">
            <Link 
              to="/" 
              className={cn(
                "text-text-secondary hover:text-text-primary",
                "text-sm font-medium",
                "transition-colors duration-200"
              )}
            >
              Home
            </Link>
            {currentUser && (
              <Link 
                to="/story/new"
                className={cn(
                  "text-text-secondary hover:text-text-primary",
                  "text-sm font-medium",
                  "transition-colors duration-200"
                )}
              >
                Write
              </Link>
            )}
          </div>

          {currentUser ? (
            <div className="relative">
              <UserAvatar
                name={currentUser.email || 'User'}
                onClick={() => setShowUserMenu(!showUserMenu)}
              />
              <UserMenu 
                isOpen={showUserMenu}
                onClose={() => setShowUserMenu(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className={cn(
                "flex min-w-[84px] max-w-[480px]",
                "items-center justify-center",
                "overflow-hidden rounded-xl",
                "h-10 px-4",
                "bg-accent-primary hover:bg-accent-primary-hover",
                "text-white text-sm font-bold",
                "leading-normal tracking-[0.015em]",
                "transition-colors duration-200"
              )}
            >
              Login
            </button>
          )}
        </div>
      </header>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}