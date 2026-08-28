import React, { ReactNode } from 'react';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'premium';

export interface StatusBadgeProps {
  tone?: StatusTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  tone = 'neutral',
  icon,
  children,
  className = '',
}) => {
  const toneClass = tone === 'danger' ? 'badge-error' : `badge-${tone}`;

  return (
    <span className={`badge ${toneClass} ${className}`}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
