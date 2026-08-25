import React, { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, required, className = '', ...props }, ref) => {
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
          style={{ cursor: 'pointer', background: '#FFFFFF' }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="input-error-msg">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
