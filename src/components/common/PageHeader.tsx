import React, { ReactNode } from 'react';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <div className={`page-header ${className}`}>
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-desc">{description}</p>}
      </div>

      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
};
