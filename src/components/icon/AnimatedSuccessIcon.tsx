export default function AnimatedSuccessIcon() {
  return (
    <svg
      className="w-24 h-24"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      id="successIcon"
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="#4ade80"
        strokeWidth="4"
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
        stroke="#4ade80"
        strokeWidth="4"
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
