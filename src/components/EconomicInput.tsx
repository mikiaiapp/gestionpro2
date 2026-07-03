"use client";

import React, { useState, useEffect } from 'react';

interface EconomicInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function EconomicInput({
  value,
  onChange,
  className = '',
  placeholder = '0,00',
  disabled = false,
  required = false
}: EconomicInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  // Format function for display when blurred: e.g. 1.234,56
  const formatBlurred = (val: number): string => {
    if (val === 0) return '';
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Format function for editing when focused: e.g. 1234,56
  const formatFocused = (val: number): string => {
    if (val === 0) return '';
    return val.toString().replace('.', ',');
  };

  // Keep displayValue in sync with value from props when not focused
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatBlurred(value));
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setDisplayValue(formatFocused(value));
    setTimeout(() => {
      e.target.select();
    }, 50);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // We update local state to preserve exactly what they type (e.g. "12," or "12.5")
    setDisplayValue(inputValue);

    // Clean characters: only allow numbers, minus sign, and a single decimal separator (comma or dot)
    let sanitized = inputValue;
    
    // Normalize decimal separator to dot for parsing
    const standardStr = sanitized.replace(/[^0-9,.-]/g, '').replace(',', '.');
    
    if (standardStr === '' || standardStr === '-') {
      onChange(0);
    } else {
      const parsed = parseFloat(standardStr);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(formatBlurred(value));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
    />
  );
}
