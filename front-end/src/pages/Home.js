import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Star,
  Bot,
  ChevronRight,
  Truck,
  RefreshCw,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { API_BASE, cartConfig } from '../utils/session';

const Home = ({ onAddToCart }) => {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featRes] = await Promise.all([
          axios.get(`${API_BASE}/categories`),
          axios.get(`${API_BASE}/products?limit=8`),
        ]);
        setCategories(catRes.data);
        setFeatured(featRes.data);
      } catch (error) {
        console.error('Error loading homepage:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = async (product) => {
    try {
      await axios.post(`${API_BASE}/cart`, { productId: product._id }, cartConfig());
      onAddToCart();
    } catch (err) {
      console.error('Cart Error:', err);
    }
  };

  const openChat = () => {
    window.dispatchEvent(new Event('open-ai-chat'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#f8f5ef]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium tracking-widest text-xs uppercase">
            Loading the latest styles...
          </p>
        </div>
      </div>
    );
  }

  const heroPick = featured[0];

  return (
    <div className="bg-[#f8f5ef] min-h-screen">

      {/* HERO */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          <div className="lg:col-span-5 order-2 lg:order-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-700 rise-in">
              Spring 2026 / New In
            </span>

            <h1
              className="font-display mt-4 text-5xl sm:text-6xl lg:text-7xl leading-[1] font-medium tracking-tight text-gray-900 rise-in"
              style={{ animationDelay: '80ms' }}
            >
              Spring is{' '}
              <em className="not-italic relative inline-block">
                <span className="relative z-10 italic font-light text-indigo-600">here</span>
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0 bottom-1 sm:bottom-2 h-3 bg-indigo-200/70 -z-0"
                ></span>
              </em>.
            </h1>

            <p
              className="mt-6 text-base text-gray-600 max-w-md leading-relaxed rise-in"
              style={{ animationDelay: '160ms' }}
            >
              Fifty new pieces curated for the season. Shop now, or let our AI stylist
              find your fit.
            </p>

            <div
              className="mt-8 flex flex-wrap gap-3 rise-in"
              style={{ animationDelay: '240ms' }}
            >
              <a
                href="#new-in"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('new-in')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group inline-flex items-center gap-2 bg-gray-900 text-white px-7 py-3.5 rounded-full font-bold text-sm hover:bg-indigo-600 transition-colors"
              >
                Shop New In
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#categories"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm text-gray-900 hover:bg-black/5 transition-colors border border-black/15"
              >
                Browse Categories
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2 relative fade-in">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-[1.75rem] overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80&auto=format&fit=crop"
                alt="Spring 2026 collection"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>

            {heroPick && (
              <Link
                to={`/product/${heroPick._id}`}
                className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-xl flex items-center gap-3 hover:shadow-2xl transition-shadow max-w-[260px]"
              >
                <img
                  src={heroPick.image}
                  alt=""
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-600 font-bold flex items-center gap-1">
                    <Star size={9} className="fill-indigo-600 text-indigo-600" />
                    Editor&rsquo;s Pick
                  </p>
                  <p className="text-sm font-bold mt-0.5 leading-tight truncate">
                    {heroPick.name}
                  </p>
                  <p className="text-xs font-bold text-gray-900">${heroPick.price}</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-black/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/10">
            <div className="flex items-center gap-3 py-4 sm:py-5 sm:pr-6 justify-center sm:justify-start">
              <div className="bg-gray-100 p-2 rounded-full">
                <Truck size={16} className="text-gray-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Free Shipping</p>
                <p className="text-[11px] text-gray-500">On orders over $100</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-4 sm:py-5 sm:px-6 justify-center">
              <div className="bg-gray-100 p-2 rounded-full">
                <RefreshCw size={16} className="text-gray-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Free Returns</p>
                <p className="text-[11px] text-gray-500">30 days, no questions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-4 sm:py-5 sm:pl-6 justify-center sm:justify-end">
              <div className="bg-indigo-50 p-2 rounded-full">
                <Sparkles size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">AI Stylist</p>
                <p className="text-[11px] text-gray-500">Personal help, 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="py-12 lg:py-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Shop by Category
            </h2>
            <span className="text-sm text-gray-500 hidden sm:block">
              {categories.length} departments
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/category/${encodeURIComponent(cat.name)}`}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-200"
              >
                {cat.coverImage && (
                  <img
                    src={cat.coverImage}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/85 transition-all"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight">{cat.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-white/80">{cat.count} items</p>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section id="new-in" className="py-12 lg:py-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              New Arrivals
            </h2>
            <span className="text-sm text-gray-500">{featured.length} items</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            {featured.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* AI STYLIST INLINE BANNER */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl flex-shrink-0">
                <Bot size={22} />
              </div>
              <div>
                <p className="font-bold text-base sm:text-lg leading-tight">Need help deciding?</p>
                <p className="text-sm text-white/70 mt-0.5">
                  Our AI stylist will find pieces that match your style.
                </p>
              </div>
            </div>
            <button
              onClick={openChat}
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full font-bold text-sm hover:bg-indigo-200 transition-colors w-full sm:w-auto"
            >
              <Sparkles size={16} className="text-indigo-600" />
              Start chat
            </button>
          </div>
        </div>
      </section>

      {/* BROWSE ALL CHIPS */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Browse the full collection by department.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/category/${encodeURIComponent(cat.name)}`}
                className="inline-flex items-center gap-1 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 transition"
              >
                {cat.name}
                <ChevronRight size={14} />
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;