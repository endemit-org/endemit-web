interface CheckoutErrorProps {
  error: string | null;
}

export default function CheckoutError({ error }: CheckoutErrorProps) {
  if (!error) return null;

  return (
    <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
  );
}
