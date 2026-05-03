import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
      <Link to={`/product/${product._id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
            <span className="text-sm font-bold text-gray-900">${product.price}</span>
          </div>
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/product/${product._id}`} className="block">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{product.category}</span>
          <h3 className="text-lg font-bold text-gray-900 mt-1 line-clamp-1 hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2 flex-grow">{product.description}</p>
        </Link>

        <button
          onClick={() => onAddToCart(product)}
          className="w-full mt-5 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <ShoppingCart size={18} />
          Add to Bag
        </button>
      </div>
    </div>
  );
};

export default ProductCard;