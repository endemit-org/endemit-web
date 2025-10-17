"use client";

import { useState } from "react";
import clsx from "clsx";

interface Props {
  name: string;
  value?: boolean;
  onChange: (name: string, value: boolean) => void;
  errorMessage?: string;
  required?: boolean;
  children?: React.ReactNode;
  validationTriggered?: boolean;
}

export default function CheckboxInput({
  name,
  value = false,
  required = false,
  onChange,
  errorMessage,
  children,
  validationTriggered,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const hasError = !!errorMessage;
  const showError = hasError && (touched || validationTriggered) && !isFocused;

  return (
    <div className="w-full mb-4">
      <div
        className={clsx(
          "flex text-neutral-400 text-sm gap-x-6",
          showError && "border-red-600 border-dashed border-2 p-2 rounded-lg"
        )}
      >
        <div className={"w-8"}>
          <input
            id={name}
            name={name}
            type="checkbox"
            checked={value}
            onChange={e => onChange(name, e.target.checked)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setTouched(true);
            }}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>

        <div className={"flex flex-col gap-y-2 flex-1"}>
          <div>{children}</div>
          {showError && (
            <p className="text-red-500 text-sm mt-1">
              ⚠ {errorMessage ?? "This field is required."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
