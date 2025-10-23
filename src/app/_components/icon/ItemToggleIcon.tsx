export default function ItemToggleIcon({
  isOpen = false,
}: {
  isOpen: boolean;
}) {
  return (
    <svg
      className={`w-5 h-5 text-gray-500 transition-transform ${
        isOpen ? "rotate-180" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}
