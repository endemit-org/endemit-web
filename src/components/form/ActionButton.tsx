"use client";
import { useRouter } from "next/navigation";

interface ActionButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export default function ActionButton({
  onClick,
  href,
  type = "button",
  children,
  className = "",
  disabled = false,
  variant = "primary",
  size = "md",
  fullWidth = true,
}: ActionButtonProps) {
  const router = useRouter();

  const baseClasses =
    "flex items-center justify-center rounded-md border border-transparent font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-hidden";

  const variantClasses = {
    primary:
      "bg-blue-700 text-neutral-200 hover:bg-blue-800 focus:ring-blue-500",
    secondary:
      "bg-neutral-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-8 py-3 text-base",
    lg: "px-10 py-4 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled
    ? "bg-neutral-500 hover:bg-neutral-500 cursor-not-allowed"
    : "";

  const combinedClasses =
    `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`.trim();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
    if (href && !disabled) {
      router.push(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      type={type}
      className={combinedClasses}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
