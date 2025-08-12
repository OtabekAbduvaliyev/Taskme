// Subscriptions.jsx
import React, { useEffect, useState } from "react";
import { useStripe, useElements, CardElement, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom"; // add this import

const stripePromise = loadStripe("pk_test_51Q1Q38CNk2DfIGoIzTj4YnJhQWRk1UnlyOJBpFJQFn9R1Inl4YI3z3lqU6LiADg6q8mIHgDR18QVlbEIrdlLlk6200F6fLd9Zs");

// small style options for CardElement
const CARD_OPTIONS = {
  style: {
    base: {
      color: "#EFEBF6",
      fontSize: "16px",
      "::placeholder": { color: "#777C9D" },
      fontFamily: "Radio Canada, sans-serif"
    },
    invalid: { color: "#DC5091" },
  },
};

function PaymentForm({ plan, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token"); // Assuming token is stored in localStorage
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!stripe || !elements) return;
  setProcessing(true);
  setError(null);

  try {
    // 1) Create payment intent
    const createRes = await fetch("https://eventify.preview.uz/api/v1/payment/inline", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ planId: plan.id })
    });

    if (!createRes.ok) throw new Error("Failed to create payment intent");
    const createData = await createRes.json();

    const clientSecret = createData.client_secret || createData.clientSecret;
    if (!clientSecret) throw new Error("No client secret returned from backend");

    // 2) Confirm payment
    const cardEl = elements.getElement(CardElement);
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardEl,
        billing_details: { name: "Customer Name" }
      }
    });

    // 3) Check payment result
    if (result.error) {
      setError(result.error.message || "Payment failed");
      setProcessing(false);
      return;
    }

    if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
      // 4) Notify backend to confirm subscription
      await fetch("https://eventify.preview.uz/api/v1/payment/inline/confirm", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: plan.id,
          paymentIntentId: result.paymentIntent.id
        })
      });
      onSuccess(result.paymentIntent);
    } else {
      setError("Payment status: " + (result.paymentIntent?.status || ""));
    }
  } catch (err) {
    setError(err.message || "Unexpected error");
  } finally {
    setProcessing(false);
  }
};


  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="p-4 bg-grayDash rounded-xl border border-pink2">
        <CardElement options={CARD_OPTIONS} />
      </div>
      {error && <div className="text-selectRed1 mt-2">{error}</div>}
      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={processing || !stripe}
          className="px-5 py-2 rounded-lg bg-pink2 text-white font-bold hover:bg-pink transition"
        >
          {processing ? "Processing…" : `Pay $${plan.price}`}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg border border-gray4 text-white hover:bg-gray4 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

function PaymentModal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-grayDash rounded-2xl shadow-2xl p-0 w-full max-w-md mx-2 relative">
        <button
          className="absolute top-3 right-3 text-gray4 hover:text-white2 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

const Subscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [message, setMessage] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalPlan, setModalPlan] = useState(null);
  const navigate = useNavigate(); // add this line

  useEffect(() => {
    fetch("https://eventify.preview.uz/api/v1/plan")
      .then((r) => r.json())
      .then((data) => {
        setPlans(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getFeatures = (plan) => [
    `${plan.maxTasks} Tasks`,
    `${plan.maxWorkspaces} Workspace${plan.maxWorkspaces > 1 ? "s" : ""}`,
    `${plan.maxSheets} Sheet${plan.maxSheets > 1 ? "s" : ""}`,
    `${plan.maxMembers} Member${plan.maxMembers > 1 ? "s" : ""}`,
    `${plan.maxViewers} Viewer${plan.maxViewers > 1 ? "s" : ""}`,
  ];

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-background py-16 px-2 font-radioCanada">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-5xl font-bold text-white drop-shadow mb-4">Choose Your Plan</h2>
          <p className="text-lg text-white2">
            Get started on our free plan and upgrade when you are ready.
          </p>
        </div>
        <div className="max-w-4xl mx-auto grid gap-10 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 text-white text-center">Loading...</div>
          ) : (
            plans
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((plan, idx) => (
                <div
                  key={plan.id}
                  className={`
                    relative flex flex-col bg-grayDash rounded-3xl border-2 border-gray4 shadow-xl overflow-hidden
                    transition-transform hover:scale-[1.03] hover:border-pink2
                  `}
                >
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-pink2/20 to-transparent pointer-events-none" />
                  <div className="relative p-8 flex-1 flex flex-col">
                    {plan.price > 0 && (
                      <span className="absolute top-6 right-6 bg-pink2 text-white rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide shadow-lg">
                        {idx === 1 ? "Most popular" : "Premium"}
                      </span>
                    )}
                    <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="mt-2 flex items-baseline">
                      <span className="text-5xl font-extrabold tracking-tight text-pink2">
                        {plan.price === 0 ? "$0" : `$${plan.price}`}
                      </span>
                      <span className="ml-2 text-lg font-semibold text-white2">/month</span>
                    </p>
                    <p className="mt-4 text-white2">{plan.description}</p>
                    <ul className="mt-6 space-y-3">
                      {getFeatures(plan).map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-pink2/20 text-pink2 mr-3">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </span>
                          <span className="text-white">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.price === 0 ? (
                      <button
                        className="mt-8 w-full py-3 px-6 rounded-xl text-center font-bold bg-transparent border-2 border-pink2 text-pink2 hover:bg-pink2 hover:text-white transition"
                        onClick={() => setMessage("You are now on the free plan!")}
                      >
                        Signup for free
                      </button>
                    ) : (
                      <>
                        <button
                          className="mt-8 w-full py-3 px-6 rounded-xl text-center font-bold bg-pink2 text-white hover:bg-pink hover:text-white transition"
                          onClick={() => {
                            setModalPlan(plan);
                            setShowPaymentModal(true);
                          }}
                        >
                          Upgrade
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
        {message && (
          <div className="mt-10 text-selectGreen1 text-center text-xl font-semibold">
            {message}
          </div>
        )}
        <PaymentModal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setModalPlan(null);
          }}
        >
          {modalPlan && (
            <PaymentForm
              plan={modalPlan}
              onSuccess={(paymentIntent) => {
                setMessage("Payment succeeded — subscription active!");
                setShowPaymentModal(false);
                setModalPlan(null);
                navigate("/dashboard"); // navigate after payment
              }}
              onCancel={() => {
                setShowPaymentModal(false);
                setModalPlan(null);
              }}
            />
          )}
        </PaymentModal>
      </div>
    </Elements>
  );
};

export default Subscriptions;
