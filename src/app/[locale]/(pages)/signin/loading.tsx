export default function SignInLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-pulse">
      <div className="w-full max-w-md mx-auto p-8">
        {/* Logo placeholder */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-12 bg-neutral-800 rounded" />
        </div>

        {/* Title */}
        <div className="h-8 w-48 bg-neutral-800 rounded mx-auto mb-2" />
        <div className="h-4 w-64 bg-neutral-800/70 rounded mx-auto mb-8" />

        {/* Form */}
        <div className="space-y-4">
          <div className="h-12 bg-neutral-800 rounded" />
          <div className="h-12 bg-neutral-700 rounded" />
        </div>

        {/* Footer text */}
        <div className="mt-6 flex justify-center">
          <div className="h-4 w-40 bg-neutral-800/50 rounded" />
        </div>
      </div>
    </div>
  );
}
