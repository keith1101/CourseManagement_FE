import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  text?: string;
  size?: number;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Đang tải dữ liệu...',
  size = 32,
  fullPage = false,
}) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        padding: '36px 20px',
      }}
    >
      <Loader2
        size={size}
        style={{
          color: 'var(--primary)',
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && (
        <span
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(247, 244, 237, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};
