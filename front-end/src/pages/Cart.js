import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, ShoppingBag, ArrowLeft, Plus, Minus, LogIn, Lock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE, cartConfig } from '../utils/session';

const Cart = ({ userEmail, onCartChanged }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cart`, cartConfig());

      const grouped = res.data.reduce((acc, current) => {
        const existing = acc.find((item) => item.productId === current.productId);
        if (existing) {
          existing.quantity += current.quantity || 1;
          existing.ids = [...(existing.ids || [existing._id]), current._id];
        } else {
          acc.push({ ...current, quantity: current.quantity || 1, ids: [current._id] });
        }
        return acc;
      }, []);

      setItems(grouped);
      onCartChanged();
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userEmail]);

  const handleUpdateQuantity = async (item, action) => {
    const currentQty = item.quantity;
    const newQty = action === 'increase' ? currentQty + 1 : currentQty - 1;
    if (newQty < 1) return;

    setItems((prev) =>
      prev.map((i) =>
        i.productId === item.productId ? { ...i, quantity: newQty } : i
      )
    );

    try {
      const primaryId = item.ids[0];
      await axios.patch(
        `${API_BASE}/cart/${primaryId}`,
        { quantity: newQty },
        cartConfig()
      );
      onCartChanged();

      if (item.ids.length > 1) {
        const extraIds = item.ids.slice(1);
        await Promise.all(
          extraIds.map((id) => axios.delete(`${API_BASE}/cart/${id}`, cartConfig()))
        );
      }
    } catch (err) {
      console.error('Update error:', err);
      fetchCart();
    }
  };

  const handleDeleteAll = async (ids) => {
    try {
      await Promise.all(
        ids.map((id) => axios.delete(`${API_BASE}/cart/${id}`, cartConfig()))
      );
      fetchCart();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const openSignIn = () => {
    window.dispatchEvent(new Event('open-auth'));
  };

  const handleCheckout = () => {
    if (!userEmail) {
      openSignIn();
      return;
    }
    navigate('/checkout');
  };

  if (loading) return <div className="text-center py-20 italic">Loading bag...</div>;

  const subtotal = items.reduce(
    (acc, item) => acc + (item.productDetails?.price || 0) * item.quantity,
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingBag className="text-indigo-600" />
          {userEmail ? `${userEmail.split('@')[0]}'s Bag` : 'Your Bag'}
        </h1>
        <Link to="/" className="text-indigo-600 flex items-center gap-1 hover:underline text-sm">
          <ArrowLeft size={16} /> Continue Shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
          <ShoppingBag size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">Your bag is empty.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-indigo-600 transition-colors"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border"
            >
              <div className="flex items-center gap-6">
                <img
                  src={item.productDetails?.image}
                  className="w-20 h-20 object-cover rounded-2xl"
                  alt=""
                />
                <div>
                  <p className="font-bold text-lg">{item.productDetails?.name}</p>
                  <p className="text-indigo-600 font-extrabold">
                    ${item.productDetails?.price}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                  <button
                    onClick={() => handleUpdateQuantity(item, 'decrease')}
                    className="p-2 hover:bg-white rounded-xl"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="px-4 font-bold w-12 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item, 'increase')}
                    className="p-2 hover:bg-white rounded-xl"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <button
                  onClick={() => handleDeleteAll(item.ids)}
                  className="text-gray-300 hover:text-red-500 p-2"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            </div>
          ))}

          {!userEmail && (
            <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex items-start sm:items-center gap-3">
                <Lock size={18} className="text-amber-700 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <p className="font-bold text-sm text-amber-900">Sign in to checkout</p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Your bag stays here either way. Sign in when you're ready to pay.
                  </p>
                </div>
              </div>
              <button
                onClick={openSignIn}
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-indigo-600 transition-colors flex-shrink-0"
              >
                <LogIn size={14} />
                Sign In
              </button>
            </div>
          )}

          <div className="mt-8 p-8 bg-indigo-600 rounded-3xl text-white">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/20">
              <span className="text-sm uppercase tracking-widest text-white/70">Subtotal</span>
              <span className="text-3xl font-extrabold">${subtotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
            >
              {userEmail ? (
                <>
                  Checkout
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Sign in to Checkout
                </>
              )}
            </button>

            <p className="text-xs text-white/60 text-center mt-3">
              Free shipping on orders over $100. 30-day returns.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;