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
        gap: '10px',
        background: isUrgent
          ? 'var(--error)'
          : isWarning
          ? 'var(--secondary-gradient)'
          : 'var(--primary)',
        color: '#FFFFFF',
        padding: '8px 20px',
        borderRadius: 'var(--border-radius-full)',
        boxShadow: isUrgent
          ? '0 0 15px rgba(192, 86, 64, 0.45)'
          : 'var(--shadow-secondary)',
        animation: isUrgent ? 'pulseGlow 1.5s infinite' : 'none',
        transition: 'all var(--transition-normal)',
      }}
    >
      {isUrgent ? <AlertTriangle size={20} /> : <Clock size={20} />}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}
      >
        {formattedTime}
      </span>
    </div>
  );
};
