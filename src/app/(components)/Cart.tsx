"use client";

import { useShoppingCart } from "use-shopping-cart";

const SimpleCart: React.FC = () => {
  const {
    cartCount,
    cartDetails,
    totalPrice,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    redirectToCheckout, // Add this
  } = useShoppingCart();

  const handleCheckout = async () => {
    try {
      const result = await redirectToCheckout();
      if (result?.error) {
        console.error("Checkout error:", result.error);
        // Handle error (show toast, alert, etc.)
        alert("Something went wrong with checkout. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong with checkout. Please try again.");
    }
  };

  return (
    <div className="border border-gray-300 p-4 m-4 rounded-lg bg-white shadow-sm w-full text-black">
      <h3 className="text-lg font-semibold mb-3">Cart ({cartCount} items)</h3>
      <p className="text-xl font-bold mb-4 text-gray-800">
        Total: €{((totalPrice ?? 0) / 100).toFixed(2)}
      </p>

      {Object.values(cartDetails ?? {}).length > 0 && (
        <div className="mt-6 space-y-2">
          <button
            onClick={handleCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Proceed to Checkout
          </button>

          <button
            onClick={clearCart}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Clear Cart
          </button>
        </div>
      )}

      {Object.values(cartDetails ?? {}).length === 0 ? (
        <p className="text-gray-500 italic">Your cart is empty</p>
      ) : (
        <div className="space-y-3">
          {Object.values(cartDetails ?? {}).map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-600">
                  €{(item.price / 100).toFixed(2)} each
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => decrementItem(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => incrementItem(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[4rem]">
                  <p className="font-semibold">
                    €{((item.price * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                  aria-label="Remove item"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleCart;
