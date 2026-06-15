import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Category from './pages/Category';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import AIChat from './components/AIChat';
import AuthModal from './components/AuthModal';
import {
  API_BASE,
  getUserEmail,
  getGuestId,
  cartConfig,
  clearSession,
} from './utils/session';

function AppContent() {
  const [cartCount, setCartCount] = useState(0);
  const [userEmail, setUserEmail] = useState(getUserEmail());
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the script already exists to prevent duplicate injections
    if (document.getElementById('municipal-chat-script')) return;

    const script = document.createElement('script');
    script.id = 'municipal-chat-script';
    script.src = 'https://ki2-municipal-widget.b-cdn.net/municipal-chat/v1/municipal-chat.js';
    script.async = true;

    // Set the specific data attributes required by the widget
    script.setAttribute('data-tenant-id', 'nh7dnw7fags3kysmetpsfzmffn88pg42');
    script.setAttribute('data-api-base', 'https://upbeat-porcupine-90.eu-west-1.convex.site');
    script.setAttribute('data-language', 'en');

    document.head.appendChild(script);

    // Cleanup the script if the component unmounts to keep DOM clean
    return () => {
      const existingScript = document.getElementById('municipal-chat-script');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  useEffect(() => {
    getGuestId();
  }, []);

  const updateCartCount = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cart`, cartConfig());
      const totalQty = res.data.reduce((acc, item) => acc + (item.quantity || 1), 0);
      setCartCount(totalQty);
    } catch (err) {
      console.error('Cart sync error:', err);
    }
  };

  useEffect(() => {
    updateCartCount();
  }, [userEmail]);

  const handleLoginSuccess = (email) => {
    setUserEmail(email);
  };

  const handleLogout = () => {
    clearSession();
    setUserEmail("");
    setCartCount(0);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        cartCount={cartCount}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home onAddToCart={updateCartCount} />} />
          <Route path="/category/:categoryName" element={<Category onAddToCart={updateCartCount} />} />
          <Route path="/product/:id" element={<ProductDetails onAddToCart={updateCartCount} />} />
          <Route path="/cart" element={<Cart userEmail={userEmail} onCartChanged={updateCartCount} />} />
          <Route path="/checkout" element={<Checkout userEmail={userEmail} onOrderPlaced={updateCartCount} />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          <Route path="/orders" element={<Orders userEmail={userEmail} />} />
          <Route path="/orders/:id" element={<OrderDetail userEmail={userEmail} />} />
        </Routes>
      </main>

      <footer className="bg-white border-t py-6 text-center text-gray-400 text-sm">
        &copy; 2026 The Rack — clothes worth wearing.
      </footer>

      <AIChat userEmail={userEmail} onAddToCart={updateCartCount} />
      <AuthModal onSuccess={handleLoginSuccess} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;