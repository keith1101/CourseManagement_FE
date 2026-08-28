import React, { SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, required, helperText, className = '', ...props }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label className="form-label">
            {label} {required && <span className="required">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`input-field ${error ? 'input-error' : ''} ${className}`}
          style={{ cursor: 'pointer' }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="input-error-msg">{error}</span>}
        {!error && helperText && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{helperText}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
