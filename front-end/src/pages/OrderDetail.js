import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Package, MapPin, CreditCard, Loader, Calendar } from 'lucide-react';
import { API_BASE, authHeaders } from '../utils/session';

const OrderDetail = ({ userEmail }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userEmail) {
      window.dispatchEvent(new Event('open-auth'));
      navigate('/');
      return;
    }
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API_BASE}/orders/${id}`, {
          headers: authHeaders(),
        });
        setOrder(res.data);
      } catch (err) {
        console.error('Order fetch error:', err);
        setError(err?.response?.data?.error || 'Could not load this order.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    window.scrollTo(0, 0);
  }, [id, userEmail, navigate]);

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
        <Link to="/orders" className="text-indigo-600 hover:underline font-medium">
          Back to orders
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
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6"
        >
          <ArrowLeft size={14} /> Back to orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">
                Order #{order._id.slice(-8).toUpperCase()}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                Order details
              </h1>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                <Calendar size={12} />
                Placed on {placedAt}
              </p>
            </div>
            <span
              className={`inline-flex self-start text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
                order.status === 'paid'
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 sm:p-8">
            <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
              <Package size={18} />
              Items ({order.items.reduce((acc, i) => acc + i.quantity, 0)})
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
                      Qty {item.quantity} &middot; ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <p className="font-bold whitespace-nowrap">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 p-6 sm:p-8 bg-gray-50/50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>
                  Shipping{' '}
                  <span className="text-xs text-gray-400">({order.shippingMethod})</span>
                </span>
                <span>
                  {order.shippingCost === 0 ? 'Free' : `$${order.shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-lg pt-3 border-t border-gray-200 mt-3">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Address + payment in two columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <MapPin size={16} />
              Shipping address
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
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

          <div className="bg-white rounded-3xl p-6 border border-gray-100">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <CreditCard size={16} />
              Payment
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Paid via Stripe
              <br />
              <span className="text-xs text-gray-400 font-mono">
                {order.paymentIntentId?.slice(0, 28)}...
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;