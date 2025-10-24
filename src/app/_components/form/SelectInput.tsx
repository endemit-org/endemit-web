"use client";

import { useState } from "react";

interface Props {
  name: string;
  label?: string;
  value?: string;
  onChangeAction: (name: string, value: string) => void;
  dataSet: { value: string; label: string }[];
  errorMessage?: string;
  required?: boolean;
}

export default function SelectInput({
  name,
  label,
  value = "",
  onChangeAction,
  dataSet,
  errorMessage,
  required = false,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const hasError = !!errorMessage;
  const showError = hasError && touched && !isFocused;
  const showSuccess = !hasError && value.length > 0 && touched && !isFocused;

  const getBorderColor = () => {
    if (isFocused) return "border-blue-500";
    if (showError) return "border-red-500";
    if (showSuccess) return "border-green-500";
    return "border-neutral-600";
  };

  return (
    <div className="w-full mb-4">
      {label && (
        <label
          htmlFor={name}
          className="block text-lg font-medium font-heading text-neutral-400 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={e => onChangeAction(name, e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          setTouched(true);
        }}
        className={`w-full px-3 py-2 border-2 rounded-lg outline-none transition-colors bg-neutral-700 text-neutral-200 ${getBorderColor()}`}
      >
        {dataSet.map(item => (
          <option key={`${name}-${item.value}`} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {showError && (
        <p className="text-red-500 text-sm mt-1">
          ⚠ {errorMessage ?? "This field has an error"}
        </p>
      )}
    </div>
  );
}
