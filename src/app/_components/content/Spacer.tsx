export interface SpacerProps {
  size?: "small" | "medium" | "large" | "xlarge";
  mobileSize?: "small" | "medium" | "large" | "xlarge";
}

export default function Spacer({
  size = "medium",
  mobileSize = "small",
}: SpacerProps) {
  const sizeClasses = {
    small: "h-8",
    medium: "h-16",
    large: "h-24",
    xlarge: "h-32",
  };

  const mobileSizeClasses = {
    small: "h-4",
    medium: "h-8",
    large: "h-12",
    xlarge: "h-16",
  };

  return (
    <div
      className={`w-full ${mobileSizeClasses[mobileSize]} md:${sizeClasses[size]}`}
      aria-hidden="true"
    />
  );
}
