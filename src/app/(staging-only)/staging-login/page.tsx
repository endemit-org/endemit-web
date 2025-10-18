import ProtectedEnvironmentLogin from "@/components/development/ProtectedEnvironmentLogin";

export default function StagingLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <ProtectedEnvironmentLogin />
    </div>
  );
}
