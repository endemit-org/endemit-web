"use client";

import { useState } from "react";

interface Props {
  name: string;
  label?: string;
  type?: "text" | "email" | "password";
  value?: string;
  onChange: (name: string, value: string) => void;
  errorMessage?: string;
  required?: boolean;
  autoComplete?: string;
  prefix?: string;
  placeholder?: string;
  disabled?: boolean;
  onEnter?: () => void;
  validationTriggered?: boolean;
}

export default function Input({
  name,
  label,
  type = "text",
  value = "",
  onChange,
  autoComplete,
  errorMessage,
  required = false,
  placeholder,
  prefix,
  disabled,
  onEnter,
  validationTriggered,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const hasError = !!errorMessage;
  const showError = hasError && (touched || validationTriggered) && !isFocused;
  const showSuccess = !hasError && value.length > 0 && touched && !isFocused;

  const getBorderColor = () => {
    if (isFocused) return "border-blue-500";
    if (showError) return "border-red-600 border-dashed";
    if (showSuccess) return "border-blue-700";
    return "border-neutral-600";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) {
      onEnter();
    }
  };

  return (
    <div className="w-full mb-4">
      {label && (
        <label
          htmlFor={name}
          className="block text-lg  font-medium text-neutral-400 mb-1 font-heading tracking-wide"
        >
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div
        className={`flex border-2 rounded-lg overflow-hidden transition-colors ${getBorderColor()}`}
      >
        {prefix && (
          <div className="bg-neutral-800 px-3 py-2 flex items-center text-neutral-400 border-r border-neutral-500">
            {prefix}
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          autoComplete={autoComplete}
          onChange={e => onChange(name, e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setTouched(true);
          }}
          className="w-full px-3 py-1.5 outline-none bg-neutral-700 text-neutral-200 placeholder:text-neutral-600"
        />
      </div>
      {showError && (
        <p className="text-red-500 text-sm mt-1">
          ⚠ {errorMessage ?? "This field has an error"}
        </p>
      )}
    </div>
  );
}
