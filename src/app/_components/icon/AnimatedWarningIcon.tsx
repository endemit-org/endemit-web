type Props = {
  color?: string;
};

export default function AnimatedWarningIcon({ color = "#fbbf24" }: Props) {
  return (
    <svg
      className="w-24 h-24"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke={color}
        strokeWidth="4"
        fill="none"
        style={{
          strokeDasharray: 283,
          strokeDashoffset: 283,
          animation: "draw 0.5s ease-out forwards",
        }}
      />
      <path
        d="M50 30 L50 55"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        style={{
          strokeDasharray: 25,
          strokeDashoffset: 25,
          animation: "draw 0.4s ease-out 0.3s forwards",
        }}
      />
      <circle
        cx="50"
        cy="68"
        r="3"
        fill={color}
        style={{
          opacity: 0,
          animation: "fadeIn 0.3s ease-out 0.6s forwards",
        }}
      />
    </svg>
  );
}
