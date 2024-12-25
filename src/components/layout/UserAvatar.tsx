import React from 'react';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function UserAvatar({ name, size = 'md', onClick }: UserAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  // Generate a consistent color based on the name
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-[#3b19e6]',
      'bg-[#6344e4]',
      'bg-[#8b70e2]',
      'bg-[#b39ce0]'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} ${getBackgroundColor(name)} 
                rounded-full flex items-center justify-center text-white 
                font-medium cursor-pointer hover:brightness-110 transition-all`}
    >
      {getInitials(name)}
    </button>
  );
}