import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient()
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
const stripePromise = loadStripe("pk_test_51Q1Q38CNk2DfIGoIzTj4YnJhQWRk1UnlyOJBpFJQFn9R1Inl4YI3z3lqU6LiADg6q8mIHgDR18QVlbEIrdlLlk6200F6fLd9Zs"); // store PK in env
createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <QueryClientProvider client={queryClient}>
    <Elements stripe={stripePromise}>
      <App />
    </Elements>
    </QueryClientProvider>
  // </StrictMode>,
)
