import React from 'react';
import { cn } from '../../styles';
import { components } from '../../styles/components';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof components.card.variants;
  padding?: keyof typeof components.card.padding;
  active?: boolean;
  disabled?: boolean;
}

export function Card({ 
  children, 
  className,
  variant = 'default',
  padding = 'md',
  active = false,
  disabled = false
}: CardProps) {
  return (
    <div className={cn(
      components.card.base,
      components.card.variants[variant],
      components.card.padding[padding],
      active && components.card.states.active,
      disabled && components.card.states.disabled,
      !disabled && components.card.states.hover,
      className
    )}>
      {children}
    </div>
  );
}