import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Calendar, ChevronRight, Loader, ShoppingBag } from 'lucide-react';
import { API_BASE, authHeaders } from '../utils/session';

const Orders = ({ userEmail }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!userEmail) {
      window.dispatchEvent(new Event('open-auth'));
      navigate('/');
      return;
    }
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${API_BASE}/orders`, {
          headers: authHeaders(),
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Orders fetch error:', err);
        setError(err?.response?.data?.error || 'Could not load your orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userEmail, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-red-600 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">My Orders</h1>
          <p className="text-gray-500 mt-2">
            {orders.length === 0
              ? 'You haven\u2019t placed any orders yet.'
              : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} placed`}
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
            <Package size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-5">
              When you place your first order, it will show up here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-indigo-600 transition-colors"
            >
              <ShoppingBag size={14} />
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const placedAt = new Date(order.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const itemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
              const previewImages = order.items.slice(0, 3);

              return (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="block bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    {/* Left: order info */}
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {previewImages.map((item, idx) => (
                          <img
                            key={item.productId}
                            src={item.image}
                            alt=""
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover bg-gray-100 border-2 border-white"
                            style={{ zIndex: previewImages.length - idx }}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-100 border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-500">
                              +{order.items.length - 3}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 font-mono">
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="font-bold mt-0.5">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Calendar size={11} />
                          {placedAt}
                        </p>
                      </div>
                    </div>

                    {/* Right: total + status */}
                    <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Total</p>
                        <p className="font-extrabold text-lg">${order.total.toFixed(2)}</p>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          order.status === 'paid'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {order.status}
                      </span>

                      <ChevronRight size={18} className="text-gray-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;