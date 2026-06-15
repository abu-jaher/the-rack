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
    if (document.getElementById('avsb')) return;
  
    const script = document.createElement('script');
    script.id = 'avsb';
    script.src = 'https://cdn.avsb.cloud/snippet.js?id=cmpz3f7hf000704l4o2idt6my';
    script.async = true;
  
    document.head.appendChild(script);
  
    // Optional: Cleanup the script if the component unmounts
    return () => {
      const existingScript = document.getElementById('avsb');
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