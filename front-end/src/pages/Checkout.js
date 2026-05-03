import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  ArrowLeft,
  MapPin,
  Truck,
  Lock,
  ShieldCheck,
  Loader,
  Check,
} from 'lucide-react';
import { API_BASE, authHeaders, cartConfig } from '../utils/session';

// Initialise Stripe once, outside the component, with the publishable key
// from your client .env (REACT_APP_STRIPE_PUBLISHABLE_KEY).
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

/* =========================================================================
   Inner form (must be inside <Elements> to use useStripe / useElements hooks)
   ========================================================================= */

const CheckoutForm = ({
  userEmail,
  totals,
  shippingMethod,
  setShippingMethod,
  refreshTotals,
  paymentIntentId,
  onOrderPlaced,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState({
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    phone: '',
  });

  const updateField = (field) => (e) => {
    setAddress((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validateAddress = () => {
    const required = ['fullName', 'line1', 'city', 'state', 'postalCode', 'country'];
    for (const field of required) {
      if (!address[field]?.trim()) {
        return `Please fill in your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;

    setError('');

    const addressError = validateAddress();
    if (addressError) {
      setError(addressError);
      return;
    }

    setSubmitting(true);

    try {
      // 1. Confirm the payment with Stripe.
      //    redirect: 'if_required' keeps the user on this page when no 3DS step is needed.
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed.');
        setSubmitting(false);
        return;
      }

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        setError('Payment did not complete. Please try again.');
        setSubmitting(false);
        return;
      }

      // 2. Tell our server to finalise the order
      const orderRes = await axios.post(
        `${API_BASE}/orders`,
        {
          paymentIntentId: paymentIntent.id,
          shippingAddress: address,
          shippingMethod,
        },
        { headers: authHeaders() }
      );

      onOrderPlaced();
      navigate(`/order-confirmation/${orderRes.data.orderId}`);
    } catch (err) {
      const msg =
        err?.response?.data?.error || 'Could not place your order. Please try again.';
      setError(msg);
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gray-900 outline-none transition-colors';
  const labelClass =
    'text-[11px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* ------ Left column: form ------ */}
      <div className="lg:col-span-2 space-y-8">

        {/* Contact */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
            <span className="bg-gray-900 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">
              1
            </span>
            Contact
          </h2>
          <p className="text-sm text-gray-500 mb-5 ml-9">
            Order updates will be sent to this email.
          </p>
          <div className="ml-0 sm:ml-9">
            <input
              type="email"
              value={userEmail}
              disabled
              className={`${inputClass} bg-gray-100 text-gray-700`}
            />
          </div>
        </section>

        {/* Shipping address */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
            <span className="bg-gray-900 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">
              2
            </span>
            Shipping address
          </h2>
          <p className="text-sm text-gray-500 mb-5 ml-9 flex items-center gap-1">
            <MapPin size={12} /> Where should we send your order?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Full name</label>
              <input
                type="text"
                value={address.fullName}
                onChange={updateField('fullName')}
                className={inputClass}
                placeholder="Jane Doe"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Address line 1</label>
              <input
                type="text"
                value={address.line1}
                onChange={updateField('line1')}
                className={inputClass}
                placeholder="123 Main Street"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Address line 2 (optional)</label>
              <input
                type="text"
                value={address.line2}
                onChange={updateField('line2')}
                className={inputClass}
                placeholder="Apt, suite, etc."
              />
            </div>

            <div>
              <label className={labelClass}>City</label>
              <input
                type="text"
                value={address.city}
                onChange={updateField('city')}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>State / Region</label>
              <input
                type="text"
                value={address.state}
                onChange={updateField('state')}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Postal code</label>
              <input
                type="text"
                value={address.postalCode}
                onChange={updateField('postalCode')}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Country</label>
              <select
                value={address.country}
                onChange={updateField('country')}
                className={inputClass}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="AT">Austria</option>
                <option value="AU">Australia</option>
                <option value="JP">Japan</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Phone (optional)</label>
              <input
                type="tel"
                value={address.phone}
                onChange={updateField('phone')}
                className={inputClass}
                placeholder="For delivery updates"
              />
            </div>
          </div>
        </section>

        {/* Shipping method */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
            <span className="bg-gray-900 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">
              3
            </span>
            Shipping method
          </h2>
          <p className="text-sm text-gray-500 mb-5 ml-9 flex items-center gap-1">
            <Truck size={12} /> When would you like to receive it?
          </p>

          <div className="space-y-3">
            <label
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                shippingMethod === 'standard'
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === 'standard'}
                  onChange={() => {
                    setShippingMethod('standard');
                    refreshTotals('standard');
                  }}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-sm">Standard Delivery</p>
                  <p className="text-xs text-gray-500 mt-0.5">5 to 7 business days</p>
                </div>
              </div>
              <span className="font-bold text-sm">
                {totals?.shippingCost === 0 ? 'Free' : `$${totals?.shippingCost?.toFixed(2) || '8.00'}`}
              </span>
            </label>

            <label
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                shippingMethod === 'express'
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === 'express'}
                  onChange={() => {
                    setShippingMethod('express');
                    refreshTotals('express');
                  }}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-sm">Express Delivery</p>
                  <p className="text-xs text-gray-500 mt-0.5">1 to 2 business days</p>
                </div>
              </div>
              <span className="font-bold text-sm">$20.00</span>
            </label>
          </div>
        </section>

        {/* Payment */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
            <span className="bg-gray-900 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">
              4
            </span>
            Payment
          </h2>
          <p className="text-sm text-gray-500 mb-5 ml-9 flex items-center gap-1">
            <ShieldCheck size={12} /> Encrypted by Stripe. We never see your card details.
          </p>

          <PaymentElement />
        </section>
      </div>

      {/* ------ Right column: order summary ------ */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 lg:sticky lg:top-24">
          <h3 className="font-bold text-lg mb-5">Order summary</h3>

          {totals?.lineItems && (
            <div className="space-y-3 mb-5 pb-5 border-b border-gray-100 max-h-72 overflow-y-auto">
              {totals.lineItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover bg-gray-100"
                    />
                    <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <p className="font-bold text-sm whitespace-nowrap">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 text-sm pb-4 border-b border-gray-100">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${totals?.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>
                {totals?.shippingCost === 0 ? 'Free' : `$${totals?.shippingCost?.toFixed(2) || '0.00'}`}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline pt-4 mb-5">
            <span className="font-bold">Total</span>
            <span className="font-extrabold text-2xl">
              ${totals?.total?.toFixed(2) || '0.00'}
            </span>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || submitting}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>Pay ${totals?.total?.toFixed(2) || '0.00'}</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
            By placing your order you agree to The Rack's terms and our
            privacy policy. Test mode: use card 4242 4242 4242 4242 with any
            future date and any CVC.
          </p>
        </div>
      </div>
    </form>
  );
};

/* =========================================================================
   Outer page (handles auth gate + payment intent creation)
   ========================================================================= */

const Checkout = ({ userEmail, onOrderPlaced }) => {
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [totals, setTotals] = useState(null);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  // Auth gate: redirect non-authed users back to cart
  useEffect(() => {
    if (!userEmail) {
      window.dispatchEvent(new Event('open-auth'));
      navigate('/cart');
    }
  }, [userEmail, navigate]);

  // Cart guard: don't even create a PaymentIntent for an empty cart
  useEffect(() => {
    const init = async () => {
      if (!userEmail) return;
      try {
        const cartRes = await axios.get(`${API_BASE}/cart`, cartConfig());
        if (!cartRes.data || cartRes.data.length === 0) {
          navigate('/cart');
          return;
        }
        await createIntent('standard');
      } catch (err) {
        console.error('Checkout init error:', err);
        setPageError('Could not start checkout. Please try again.');
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line
  }, [userEmail]);

  const createIntent = async (method) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/checkout/create-payment-intent`,
        { shippingMethod: method },
        { headers: authHeaders() }
      );
      setClientSecret(res.data.clientSecret);
      setPaymentIntentId(res.data.paymentIntentId);
      setTotals({
        subtotal: res.data.subtotal,
        shippingCost: res.data.shippingCost,
        total: res.data.total,
        lineItems: res.data.lineItems,
      });
    } catch (err) {
      console.error('Payment intent error:', err);
      setPageError(err?.response?.data?.error || 'Could not start checkout.');
    } finally {
      setLoading(false);
    }
  };

  // When the user changes shipping method, recompute totals + create a new PaymentIntent.
  // (Stripe doesn't let us change the amount on an existing PaymentIntent after card entry,
  //  but it's simpler to just create a fresh one for the new amount.)
  const refreshTotals = (method) => {
    createIntent(method);
  };

  if (loading && !clientSecret) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader size={32} className="animate-spin mx-auto text-indigo-600" />
          <p className="mt-4 text-gray-500 text-sm">Preparing your checkout...</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-red-600 mb-4">{pageError}</p>
        <Link to="/cart" className="text-indigo-600 hover:underline font-medium">
          Back to your bag
        </Link>
      </div>
    );
  }

  if (!clientSecret) return null;

  const stripeAppearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#111827',
      colorText: '#111827',
      borderRadius: '12px',
      fontFamily: 'Manrope, system-ui, sans-serif',
      spacingUnit: '4px',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          to="/cart"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4"
        >
          <ArrowLeft size={14} /> Back to bag
        </Link>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Checkout</h1>
        <p className="text-sm text-gray-500 mb-10 flex items-center gap-1.5">
          <Lock size={12} /> Secure checkout, encrypted end-to-end
        </p>

        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: stripeAppearance }}
        >
          <CheckoutForm
            userEmail={userEmail}
            totals={totals}
            shippingMethod={shippingMethod}
            setShippingMethod={setShippingMethod}
            refreshTotals={refreshTotals}
            paymentIntentId={paymentIntentId}
            onOrderPlaced={onOrderPlaced}
          />
        </Elements>
      </div>
    </div>
  );
};

export default Checkout;