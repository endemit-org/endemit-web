interface Props {
  className?: string;
  fill?: boolean;
}

export default function PauseIcon({ className = "w-6 h-6", fill = false }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={fill ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 5.25v13.5m-7.5-13.5v13.5"
      />
    </svg>
  );
}
