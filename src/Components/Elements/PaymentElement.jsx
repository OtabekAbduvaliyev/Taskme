import { useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";

function PaymentForm({ plan, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    try {
      // 1) Create payment intent on your backend
      const createRes = await fetch("https://eventify.preview.uz/api/v1/payment/inline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id })
      });
      if (!createRes.ok) throw new Error("Failed to create payment intent");
      const createData = await createRes.json();
      // backend might return client_secret or clientSecret
      const clientSecret = createData.client_secret || createData.clientSecret;
      if (!clientSecret) throw new Error("No client secret returned from backend");

      // 2) Confirm payment using card element (handles 3DS if needed)
      const cardEl = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardEl,
          billing_details: { name: "Customer Name" } // optionally pass real name/email
        }
      });

      if (result.error) {
        // Payment failed or requires additional action that wasn't completed
        setError(result.error.message || "Payment failed");
        setProcessing(false);
        return;
      }

      // 3) Success — notify backend to finalize subscription
      if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
        await fetch("https://eventify.preview.uz/api/v1/payment/inline/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            paymentIntentId: result.paymentIntent.id
          })
        });
        onSuccess(result.paymentIntent);
      } else {
        setError("Payment processing: " + (result.paymentIntent?.status || ""));
      }
    } catch (err) {
      setError(err.message || "Unexpected error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="p-3 bg-[#121212] rounded">
        <CardElement options={CARD_OPTIONS} />
      </div>
      {error && <div className="text-red-400 mt-2">{error}</div>}
      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={processing || !stripe}
          className="px-4 py-2 rounded bg-pink2 text-white"
        >
          {processing ? "Processing…" : `Pay $${plan.price}`}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border">
          Cancel
        </button>
      </div>
    </form>
  );
}