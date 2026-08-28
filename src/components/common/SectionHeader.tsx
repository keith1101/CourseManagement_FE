import React, { ReactNode } from 'react';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  actions,
  icon,
  className = '',
}) => {
  return (
    <div className={`section-header ${className}`} style={{ flexWrap: 'wrap', gap: '12px' }}>
      <div style={{ minWidth: 0 }}>
        <h2 className="section-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon && <span style={{ color: 'var(--primary)', display: 'inline-flex' }}>{icon}</span>}
          <span>{title}</span>
        </h2>
        {description && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
};
