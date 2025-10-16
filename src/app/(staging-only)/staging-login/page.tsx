import ProtectedEnvironmentLogin from "@/components/ProtectedEnvironmentLogin";

export default function StagingLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <ProtectedEnvironmentLogin />
    </div>
  );
}
