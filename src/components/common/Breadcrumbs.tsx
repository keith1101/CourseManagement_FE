import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`breadcrumbs ${className}`}>
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: isLast ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isLast ? 600 : 400,
              }}
            >
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  style={{
                    color: 'var(--text-secondary)',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--primary)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
              {!isLast && <ChevronRight size={13} color="var(--border-color)" style={{ flexShrink: 0 }} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
