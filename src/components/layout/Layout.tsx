import React from 'react';
import { cn } from '../../utils/cn';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className={cn(
      "min-h-screen",
      "bg-gradient-page",
      className
    )}>
      <Header />
      {children}
    </div>
  );
}

export function LayoutContent({ children, className }: LayoutProps) {
  return (
    <main className={cn(
      "flex-1 w-full max-w-screen-2xl mx-auto",
      "px-4 sm:px-6 lg:px-8",
      className
    )}>
      {children}
    </main>
  );
}

export function LayoutSection({ children, className }: LayoutProps) {
  return (
    <section className={cn(
      "py-6 sm:py-8 lg:py-12",
      className
    )}>
      {children}
    </section>
  );
}