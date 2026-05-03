import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingCart,
  Store,
  LogOut,
  User,
  ChevronDown,
  LogIn,
  Package,
} from 'lucide-react';
import { API_BASE } from '../utils/session';

const Navbar = ({ cartCount, userEmail, onLogout }) => {
  const [categories, setCategories] = useState([]);
  const [openCategories, setOpenCategories] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const categoriesRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/categories`)
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) {
        setOpenCategories(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openSignIn = () => {
    window.dispatchEvent(new Event('open-auth'));
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Store className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              The<span className="text-indigo-600">Rack</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-gray-600 font-medium">
            <Link to="/" className="hover:text-indigo-600 transition">Home</Link>

            <div className="relative" ref={categoriesRef}>
              <button
                onClick={() => setOpenCategories((v) => !v)}
                className="flex items-center gap-1 hover:text-indigo-600 transition"
              >
                Categories
                <ChevronDown
                  size={16}
                  className={`transition-transform ${openCategories ? 'rotate-180' : ''}`}
                />
              </button>
              {openCategories && categories.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      to={`/category/${encodeURIComponent(cat.name)}`}
                      onClick={() => setOpenCategories(false)}
                      className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition"
                    >
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-xs text-gray-400">{cat.count}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/cart" className="hover:text-indigo-600 transition">My Bag</Link>
          </div>

          <div className="flex items-center space-x-4">

            {userEmail ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setOpenUserMenu((v) => !v)}
                  className="hidden sm:flex items-center space-x-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                >
                  <div className="bg-gray-200 p-1 rounded-full">
                    <User size={14} className="text-gray-600" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">
                      Signed in as
                    </span>
                    <span className="text-sm font-semibold text-gray-700 truncate max-w-[140px]">
                      {userEmail}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${openUserMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                {openUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Link
                      to="/orders"
                      onClick={() => setOpenUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition"
                    >
                      <Package size={15} />
                      <span className="font-medium">My Orders</span>
                    </Link>
                    <Link
                      to="/cart"
                      onClick={() => setOpenUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition"
                    >
                      <ShoppingCart size={15} />
                      <span className="font-medium">My Bag</span>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setOpenUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut size={15} />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openSignIn}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-900 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <LogIn size={14} />
                Sign In
              </button>
            )}

            <div className="h-6 w-[1px] bg-gray-200 hidden sm:block"></div>

            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-indigo-600 transition">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {!userEmail && (
              <button
                onClick={openSignIn}
                className="sm:hidden p-2 text-gray-600 hover:text-indigo-600 transition"
                title="Sign in"
              >
                <LogIn size={22} />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;