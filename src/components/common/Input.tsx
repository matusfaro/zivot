import React from 'react';

interface InputProps {
  label: string;
  type?: 'text' | 'number' | 'date' | 'email';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  helpText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
  step,
  unit,
  helpText,
}) => {
  return (
    <div className="input-group">
      <label className="input-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <div className="input-wrapper">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          className="input-field"
        />
        {unit && <span className="input-unit">{unit}</span>}
      </div>
      {helpText && <p className="input-help">{helpText}</p>}
    </div>
  );
};
