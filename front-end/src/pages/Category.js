import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { API_BASE, cartConfig } from '../utils/session';

const Category = ({ onAddToCart }) => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [colorFilter, setColorFilter] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE}/products?category=${encodeURIComponent(categoryName)}`
        );
        setProducts(res.data);
      } catch (err) {
        console.error('Error loading category:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryName]);

  const availableColors = useMemo(() => {
    const set = new Set(products.map((p) => p.color).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [products]);

  const visibleProducts = useMemo(() => {
    let list = [...products];
    if (colorFilter !== 'all') {
      list = list.filter((p) => p.color === colorFilter);
    }
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, colorFilter, sortBy]);

  const handleAddToCart = async (product) => {
    try {
      await axios.post(`${API_BASE}/cart`, { productId: product._id }, cartConfig());
      onAddToCart();
    } catch (err) {
      console.error('Cart Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4">
            <ArrowLeft size={14} /> Back to home
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{categoryName}</h1>
          <p className="text-gray-500 mt-2">{products.length} items in this category</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
            <p className="text-gray-500">Nothing here yet. Try another category.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 p-4 bg-white rounded-2xl border border-gray-100">

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mr-1">Color</span>
                {availableColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColorFilter(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      colorFilter === c
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c === 'all' ? 'All' : c}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-100 border-0 rounded-xl text-sm font-medium px-3 py-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                >
                  <option value="default">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {visibleProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed">
                <p className="text-gray-500">No items match this filter. Try a different color.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Category;