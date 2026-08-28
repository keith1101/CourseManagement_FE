import React, { ReactNode } from 'react';

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'premium';
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  children,
  icon,
  className = '',
  style,
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{children}</span>
    </span>
  );
};
