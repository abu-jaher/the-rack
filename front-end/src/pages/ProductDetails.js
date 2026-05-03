import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ShoppingCart, Check, Package } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { API_BASE, cartConfig } from '../utils/session';

const ProductDetails = ({ onAddToCart }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setJustAdded(false);
      try {
        const res = await axios.get(`${API_BASE}/products/${id}`);
        setProduct(res.data);

        if (res.data?.category) {
          const relRes = await axios.get(
            `${API_BASE}/products?category=${encodeURIComponent(res.data.category)}`
          );
          setRelated(relRes.data.filter((p) => p._id !== id).slice(0, 4));
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = async (target) => {
    const item = target || product;
    if (!item) return;

    setAdding(true);
    try {
      await axios.post(
        `${API_BASE}/cart`,
        { productId: item._id },
        cartConfig()
      );
      onAddToCart();
      if (item._id === product?._id) {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2500);
      }
    } catch (err) {
      console.error('Cart Error:', err);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">We couldn't find that product.</p>
        <Link to="/" className="text-indigo-600 hover:underline font-medium">
          Back to home
        </Link>
      </div>
    );
  }

  const inStock = (product.stock || 0) > 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-6 text-sm text-gray-500 flex items-center gap-2">
          <Link to="/" className="hover:text-indigo-600 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Home
          </Link>
          <span className="text-gray-300">/</span>
          <Link
            to={`/category/${encodeURIComponent(product.category)}`}
            className="hover:text-indigo-600"
          >
            {product.category}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-medium truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm">

          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              {product.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-gray-900">${product.price}</span>
              {product.color && (
                <span className="text-sm text-gray-500">
                  Color: <span className="font-semibold text-gray-700">{product.color}</span>
                </span>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm">
              <Package size={16} className={inStock ? 'text-green-600' : 'text-red-500'} />
              <span className={inStock ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                {inStock ? `In stock (${product.stock} available)` : 'Out of stock'}
              </span>
            </div>

            <p className="mt-6 text-gray-600 leading-relaxed">{product.description}</p>

            <div className="mt-8">
              <button
                onClick={() => handleAddToCart(null)}
                disabled={!inStock || adding}
                className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  justAdded
                    ? 'bg-green-600 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              >
                {justAdded ? (
                  <>
                    <Check size={20} />
                    Added to bag
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    {adding ? 'Adding...' : 'Add to Bag'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">More in {product.category}</h2>
              <Link
                to={`/category/${encodeURIComponent(product.category)}`}
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {related.map((r) => (
                <ProductCard
                  key={r._id}
                  product={r}
                  onAddToCart={() => handleAddToCart(r)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;