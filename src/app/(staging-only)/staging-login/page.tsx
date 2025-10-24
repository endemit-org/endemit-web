import ProtectedEnvironmentLogin from "@/app/_components/development/ProtectedEnvironmentLogin";

export default function StagingLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <ProtectedEnvironmentLogin />
    </div>
  );
}
