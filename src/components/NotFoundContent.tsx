import Link from "next/link";

export default function NotFoundContent() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-red-500">404</h1>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-neutral-400 max-w-md">
          {`The page you're looking for doesn't exist or has been moved.`}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-red-500 hover:bg-red-600 transition-colors font-bold"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
