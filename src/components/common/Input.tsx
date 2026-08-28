import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, leftIcon, rightIcon, helperText, className = '', ...props }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label className="form-label">
            {label} {required && <span className="required">*</span>}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          {leftIcon && (
            <span
              style={{
                position: 'absolute',
                left: '14px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={`input-field ${error ? 'input-error' : ''} ${className}`}
            style={{
              paddingLeft: leftIcon ? '46px' : '16px',
              paddingRight: rightIcon ? '46px' : '16px',
            }}
            {...props}
          />
          {rightIcon && (
            <span
              style={{
                position: 'absolute',
                right: '14px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && <span className="input-error-msg">{error}</span>}
        {!error && helperText && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
