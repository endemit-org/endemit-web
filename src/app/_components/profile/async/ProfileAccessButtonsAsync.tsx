import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

interface ProfileAccessButtonsAsyncProps {
  userId: string;
}

interface AccessButton {
  href: string;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  hoverColor: string;
}

// Simple inline SVG icons
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  );
}

function QrCodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  );
}

export default async function ProfileAccessButtonsAsync({
  userId,
}: ProfileAccessButtonsAsyncProps) {
  const user = await getCurrentUser();

  // If no user or user ID mismatch, return null
  if (!user || user.id !== userId) {
    return null;
  }

  const buttons: AccessButton[] = [];

  // Check for admin access
  if (user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    buttons.push({
      href: "/admin",
      label: "Admin Panel",
      icon: <ShieldIcon className="w-5 h-5" />,
      bgColor: "bg-purple-600",
      hoverColor: "hover:bg-purple-700",
    });
  }

  // Check for POS access
  if (user.permissions.includes(PERMISSIONS.POS_ACCESS)) {
    buttons.push({
      href: "/pos",
      label: "POS Registers",
      icon: <StoreIcon className="w-5 h-5" />,
      bgColor: "bg-emerald-600",
      hoverColor: "hover:bg-emerald-700",
    });
  }

  // Check for scan access
  if (user.permissions.includes(PERMISSIONS.TICKETS_SCAN)) {
    buttons.push({
      href: "/scan",
      label: "Scan Tickets",
      icon: <QrCodeIcon className="w-5 h-5" />,
      bgColor: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
    });
  }

  // Don't render anything if no special access
  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {buttons.map(button => (
        <Link
          key={button.href}
          href={button.href}
          target="_blank"
          className={`flex items-center justify-center gap-2 px-4 py-3 ${button.bgColor} ${button.hoverColor} text-white font-medium rounded-lg transition-colors`}
        >
          {button.icon}
          <span>{button.label}</span>
        </Link>
      ))}
    </div>
  );
}
