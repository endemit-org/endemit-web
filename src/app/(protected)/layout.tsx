import { getCurrentUser } from "@/lib/services/auth";
import SessionGuard from "@/app/_components/auth/SessionGuard";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <>
      <div className="min-h-screen">{children}</div>
      <SessionGuard hasUser={!!user} />
    </>
  );
}
