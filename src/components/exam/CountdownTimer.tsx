import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  formattedTime: string;
  isWarning: boolean;
  isUrgent: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  formattedTime,
  isWarning,
  isUrgent,
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: isUrgent
          ? 'var(--error)'
          : isWarning
          ? 'var(--accent)'
          : 'var(--primary)',
        color: '#FFFFFF',
        padding: '6px 16px',
        borderRadius: 'var(--border-radius-full)',
        boxShadow: isUrgent
          ? '0 0 14px rgba(201, 59, 59, 0.4)'
          : 'var(--shadow-xs)',
        animation: isUrgent ? 'pulseGlow 1.5s infinite' : 'none',
        transition: 'all var(--transition-normal)',
      }}
    >
      {isUrgent ? <AlertTriangle size={17} /> : <Clock size={17} />}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}
      >
        {formattedTime}
      </span>
    </div>
  );
};
