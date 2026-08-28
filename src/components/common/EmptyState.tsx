import React, { ReactNode } from 'react';
import { Card } from './Card';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <Card
      className={`empty-state ${className}`}
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      {icon && (
        <div
          style={{
            color: 'var(--text-muted)',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: '1.0625rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            maxWidth: '420px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </Card>
  );
};
