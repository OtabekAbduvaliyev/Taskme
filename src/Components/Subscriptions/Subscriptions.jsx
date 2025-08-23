// Subscriptions.jsx
import React, { useEffect, useState, useRef } from "react";
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
  const cardElementRef = useRef(null); // for focusing CardElement
  const token = localStorage.getItem("token"); // Assuming token is stored in localStorage

  // Focus CardElement when elements is ready
  useEffect(() => {
    if (elements) {
      const card = elements.getElement(CardElement);
      if (card && typeof card.focus === "function") {
        card.focus();
      }
    }
  }, [elements]);

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
      <div className="p-3 sm:p-4 bg-grayDash rounded-xl border border-pink2">
        <CardElement options={CARD_OPTIONS} />
      </div>
      {error && <div className="text-selectRed1 mt-2">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button
          type="submit"
          disabled={processing || !stripe}
          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-pink2 text-white font-bold hover:bg-pink transition"
        >
          {processing ? "Processing…" : `Pay $${plan.price}`}
        </button>
        <button type="button" onClick={onCancel} className="w-full sm:w-auto px-5 py-2 rounded-lg border border-gray4 text-white hover:bg-gray4 transition">
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
      <div className="bg-grayDash rounded-2xl shadow-2xl p-0 w-full max-w-xs sm:max-w-md mx-2 relative">
        <button
          className="absolute top-3 right-3 text-gray4 hover:text-white2 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

// New: Success modal shown after successful subscription purchase
const SuccessModal = ({ open, plan, onClose, onStart }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-pink2/10 via-[#2B2540] to-[#0f1724] rounded-2xl shadow-2xl border border-pink2/20 overflow-hidden">
        {/* Decorative top band */}
        <div className="absolute -top-10 -left-20 w-56 h-56 rounded-full bg-gradient-to-r from-pink2 to-[#7C3AED] opacity-20 blur-2xl pointer-events-none" />
        <div className="p-8 sm:p-12 text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-pink2 to-pink2/70 flex items-center justify-center shadow-lg">
            {/* Done (checkmark) icon */}
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="text-white">
              <circle cx="22" cy="22" r="22" fill="#7658B1" opacity="0.15"/>
              <path d="M14 23.5L20 29L30 17" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-pink2 mb-2">Subscription activated!</h2>
          <p className="text-md text-white mb-4">
            Your <span className="font-semibold text-pink2">{plan?.name || "plan"}</span> is now active.
            You're all set — let's get you started.
          </p>

          <div className="max-w-xl mx-auto text-left bg-[rgba(255,255,255,0.02)] p-4 rounded-lg border border-[rgba(255,255,255,0.03)] mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">{plan?.name || "Plan"}</div>
                <div className="text-white2 text-sm">{plan?.description || "Happy productivity!"}</div>
              </div>
              <div className="text-right">
                <div className="text-pink2 font-extrabold text-lg">{plan?.price === 0 ? "$0" : `$${plan?.price}`}</div>
                <div className="text-white2 text-xs">per month</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onStart}
              className="px-8 py-3 rounded-2xl bg-pink2 text-white font-semibold shadow-lg transform hover:-translate-y-0.5 transition"
            >
              Start working
            </button>
          </div>

          <div className="mt-4 text-xs text-white2">
            Tip: Check your dashboard for templates, workspaces and quick-start guides to ramp up faster.
          </div>
        </div>
      </div>
    </div>
  );
};

const Subscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [message, setMessage] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalPlan, setModalPlan] = useState(null);
  const navigate = useNavigate(); // add this line

  // NEW: success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPayload, setSuccessPayload] = useState(null);

  // NEW: processing/error state for free-plan flow
  const [processingFree, setProcessingFree] = useState(false);
  const [freeError, setFreeError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("https://eventify.preview.uz/api/v1/plan", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : []);
      } catch {
        setPlans([]);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const getFeatures = (plan) => [
    `${plan.maxTasks} Tasks`,
    `${plan.maxWorkspaces} Workspace${plan.maxWorkspaces > 1 ? "s" : ""}`,
    `${plan.maxSheets} Sheet${plan.maxSheets > 1 ? "s" : ""}`,
    `${plan.maxMembers} Member${plan.maxMembers > 1 ? "s" : ""}`,
    `${plan.maxViewers} Viewer${plan.maxViewers > 1 ? "s" : ""}`,
  ];

  // New: handle free plan click by creating payment intent then showing success modal
  const handleFreePlan = async (plan) => {
    setFreeError(null);
    setProcessingFree(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://eventify.preview.uz/api/v1/payment/inline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ planId: plan.id })
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || "Failed to create subscription for free plan");
      }

      const data = await res.json();

      // Persist chosen plan briefly for other screens if needed
      try { sessionStorage.setItem("currentPlan", JSON.stringify(plan)); } catch {}

      // Show success modal similarly to paid flow. Backend may already activate the plan on create for free plans.
      setMessage("Subscription activated!");
      setSuccessPayload({ plan, paymentIntent: data || null });
      setShowSuccessModal(true);
    } catch (err) {
      setFreeError(err?.message || "Unexpected error");
      setMessage("");
    } finally {
      setProcessingFree(false);
    }
  };

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-background py-8 sm:py-16 px-2 font-radioCanada">
        {/* Back button */}
        <div className="max-w-4xl mx-auto mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-pink2 hover:text-pink font-semibold px-4 py-2 rounded-lg bg-grayDash border border-gray4 hover:bg-gray3 transition"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>
        <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold text-white drop-shadow mb-2 sm:mb-4">Choose Your Plan</h2>
          <p className="text-base sm:text-lg text-white2">
            Get started on our free plan and upgrade when you are ready.
          </p>
        </div>
        <div className="max-w-4xl mx-auto grid gap-6 sm:gap-10 grid-cols-1 md:grid-cols-2">
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
                  <div className="absolute inset-x-0 top-0 h-10 sm:h-16 bg-gradient-to-b from-pink2/20 to-transparent pointer-events-none" />
                  <div className="relative p-4 sm:p-8 flex-1 flex flex-col">
                    {plan.price > 0 && (
                      <span className="absolute top-4 sm:top-6 right-4 sm:right-6 bg-pink2 text-white rounded-full px-3 sm:px-4 py-1 text-xs font-semibold uppercase tracking-wide shadow-lg">
                        {idx === 1 ? "Most popular" : "Premium"}
                      </span>
                    )}
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{plan.name}</h3>
                    <p className="mt-1 sm:mt-2 flex items-baseline">
                      <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-pink2">
                        {plan.price === 0 ? "$0" : `$${plan.price}`}
                      </span>
                      <span className="ml-2 text-base sm:text-lg font-semibold text-white2">/month</span>
                    </p>
                    <p className="mt-2 sm:mt-4 text-white2">{plan.description}</p>
                    <ul className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                      {getFeatures(plan).map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-pink2/20 text-pink2 mr-2 sm:mr-3">
                            <svg width="16" height="16" sm="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </span>
                          <span className="text-white text-sm sm:text-base">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.price === 0 ? (
                      <button
                        className="mt-6 sm:mt-8 w-full py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-center font-bold bg-transparent border-2 border-pink2 text-pink2 hover:bg-pink2 hover:text-white transition"
                        onClick={() => handleFreePlan(plan)}
                        disabled={processingFree}
                      >
                        {processingFree ? "Processing…" : "Signup for free"}
                      </button>
                    ) : (
                      <>
                        <button
                          className="mt-6 sm:mt-8 w-full py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-center font-bold bg-pink2 text-white hover:bg-pink hover:text-white transition"
                          onClick={() => {
                            setModalPlan(plan);
                            setShowPaymentModal(true);
                          }}
                        >
                          Upgrade
                        </button>
                      </>
                    )}
                    {/* show free-plan errors near message area */}
                    {freeError && (
          <div className="mt-4 text-selectRed1 text-center text-sm">
            {freeError}
          </div>
        )}
                  </div>
                </div>
              ))
          )}
        </div>
        {message && (
          <div className="mt-8 sm:mt-10 text-selectGreen1 text-center text-lg sm:text-xl font-semibold">
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
                // Show success modal instead of immediate navigation
                setMessage("Payment succeeded — subscription active!");
                setShowPaymentModal(false);
                // capture plan/payment for success modal
                setSuccessPayload({ plan: modalPlan, paymentIntent });
                setModalPlan(null);
                setShowSuccessModal(true);
              }}
              onCancel={() => {
                setShowPaymentModal(false);
                setModalPlan(null);
              }}
            />
          )}
        </PaymentModal>

        {/* Success modal shown after payment. Clicking Start working navigates to dashboard */}
        <SuccessModal
          open={showSuccessModal}
          plan={successPayload?.plan}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessPayload(null);
          }}
          onStart={() => {
            setShowSuccessModal(false);
            // optional: store a small flag so dashboard can show onboarding if needed
            try {
              sessionStorage.setItem("freshSubscription", JSON.stringify({
                plan: successPayload?.plan || null,
                at: Date.now()
              }));
            } catch {}
            navigate("/dashboard");
          }}
        />

      </div>
    </Elements>
  );
};

export default Subscriptions;

