import React, { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: 'surface' | 'paper' | 'muted';
  interactive?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  tone = 'surface',
  interactive = false,
  className = '',
  ...props
}) => {
  const toneClass = tone === 'paper' ? 'card--paper' : tone === 'muted' ? 'card--muted' : '';

  return (
    <div
      className={`card ${toneClass} ${interactive ? 'card-interactive' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
