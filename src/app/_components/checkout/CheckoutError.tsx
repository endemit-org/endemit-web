interface CheckoutErrorProps {
  error: string | null;
}

export default function CheckoutError({ error }: CheckoutErrorProps) {
  if (!error) return null;

  return (
    <div className="text-neutral-200 bg-red-950 p-3 rounded mb-4 border-2 border-red-700">
      {error}
    </div>
  );
}
