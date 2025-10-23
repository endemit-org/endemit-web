export default function AnimatedSuccessIcon({
  className = "w-24 h-24",
  color = "#4ade80",
  strokeWidth = 4,
}: {
  className?: string;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      id="successIcon"
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        className="animate-[draw_0.5s_ease-out_forwards]"
        style={{
          strokeDasharray: 283,
          strokeDashoffset: 283,
          animation: "draw 0.5s ease-out forwards",
        }}
      />
      <path
        d="M30 50 L45 65 L70 35"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="animate-[draw_0.5s_ease-out_0.3s_forwards]"
        style={{
          strokeDasharray: 60,
          strokeDashoffset: 60,
          animation: "draw 0.5s ease-out 0.3s forwards",
        }}
      />
    </svg>
  );
}
