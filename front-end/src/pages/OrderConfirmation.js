import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, Package, ArrowRight, ShoppingBag, Loader } from 'lucide-react';
import { API_BASE, authHeaders } from '../utils/session';

const OrderConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API_BASE}/orders/${id}`, {
          headers: authHeaders(),
        });
        setOrder(res.data);
      } catch (err) {
        console.error('Order fetch error:', err);
        setError(err?.response?.data?.error || 'Could not load your order.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-red-600 mb-4">{error || 'Order not found.'}</p>
        <Link to="/" className="text-indigo-600 hover:underline font-medium">
          Back to home
        </Link>
      </div>
    );
  }

  const placedAt = new Date(order.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-[#f8f5ef] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        {/* Success header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-5">
            <Check size={32} className="text-green-600" strokeWidth={3} />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight text-gray-900">
            Thank you, your order is{' '}
            <em className="italic font-light text-indigo-600">on its way</em>.
          </h1>
          <p className="text-gray-600 mt-4 text-base">
            We've sent a confirmation to{' '}
            <span className="font-semibold text-gray-900">{order.email}</span>.
          </p>
          <div className="mt-4 inline-flex items-center gap-3 text-sm">
            <span className="text-gray-500">Order</span>
            <span className="font-mono font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200">
              #{order._id.slice(-8).toUpperCase()}
            </span>
            <span className="text-gray-500">{placedAt}</span>
          </div>
        </div>

        {/* Order card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Items */}
          <div className="p-6 sm:p-8">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Package size={18} />
              Order details
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <p className="font-bold truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity} &middot; ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <p className="font-bold whitespace-nowrap">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 p-6 sm:p-8 bg-gray-50/50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>
                  Shipping{' '}
                  <span className="text-xs text-gray-400">
                    ({order.shippingMethod})
                  </span>
                </span>
                <span>
                  {order.shippingCost === 0 ? 'Free' : `$${order.shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-lg pt-3 border-t border-gray-200 mt-3">
                <span>Total paid</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="border-t border-gray-100 p-6 sm:p-8">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">
              Shipping to
            </h3>
            <p className="text-sm text-gray-800 leading-relaxed">
              <span className="font-bold">{order.shippingAddress.fullName}</span>
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 && (
                <>
                  <br />
                  {order.shippingAddress.line2}
                </>
              )}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
              {order.shippingAddress.phone && (
                <>
                  <br />
                  <span className="text-gray-500">{order.shippingAddress.phone}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/orders"
            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-7 py-3.5 rounded-full font-bold text-sm hover:bg-indigo-600 transition-colors"
          >
            View all orders
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm text-gray-900 hover:bg-black/5 transition-colors border border-black/15"
          >
            <ShoppingBag size={14} />
            Keep shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;