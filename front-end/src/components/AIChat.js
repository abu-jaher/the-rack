import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  ShoppingBag,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { API_BASE, cartConfig } from '../utils/session';

const SUGGESTION_CHIPS = [
  'Show me dresses under $50',
  'I need a warm jacket',
  'Running shoes in black',
  'Help me build an outfit',
];

const AIChat = ({ userEmail, onAddToCart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      type: 'greeting',
      text: "Hi, I'm Iba. I'll help you find pieces you'll love. What are you looking for?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE}/products`)
      .then((res) => setAllProducts(res.data))
      .catch(() => setAllProducts([]));
  }, []);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handler);
    return () => window.removeEventListener('open-ai-chat', handler);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleAction = async (actionType, productId, { silent = false } = {}) => {
    const product = allProducts.find((p) => p._id === productId);
    if (!product) return;

    if (actionType === 'ADD') {
      try {
        await axios.post(`${API_BASE}/cart`, { productId }, cartConfig());
        if (onAddToCart) onAddToCart();
        if (!silent) {
          setMessages((prev) => [
            ...prev,
            { role: 'bot', text: `Added ${product.name} to your bag.` },
          ]);
        }
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: 'Something went wrong while adding that to your bag. Please try again.',
          },
        ]);
      }
    }
  };

  const goToProduct = (productId) => {
    navigate(`/product/${productId}`);
    setIsOpen(false);
  };

  const goToCategory = (categoryName) => {
    navigate(`/category/${encodeURIComponent(categoryName)}`);
    setIsOpen(false);
  };

  /**
   * Normalize alternate token formats that Iba sometimes emits despite the
   * prompt being explicit about square brackets. Rewrites them in place to
   * the canonical [SHOW_PRODUCT: id] / [SHOW_CATEGORY: name] / [ADD_TO_CART: id]
   * form so the existing parser further down works without changes.
   *
   * Cases handled:
   *   <product id="abc">Name</product>              -> [SHOW_PRODUCT: abc]
   *   <SHOW_PRODUCT: abc>  /  <SHOW_PRODUCT:abc>    -> [SHOW_PRODUCT: abc]
   *   <SHOW_CATEGORY: T-Shirts>                     -> [SHOW_CATEGORY: T-Shirts]
   *   <ADD_TO_CART: abc>                            -> [ADD_TO_CART: abc]
   *   {SHOW_PRODUCT: abc}                           -> [SHOW_PRODUCT: abc]
   *   [PRODUCT: abc]                                -> [SHOW_PRODUCT: abc]
   *   [CATEGORY: T-Shirts]                          -> [SHOW_CATEGORY: T-Shirts]
   */
  const normalizeTokens = (text) => {
    if (!text) return text;

    let out = text;

    // <product id="abc">...</product> style (XML)
    out = out.replace(
      /<product\s+id\s*=\s*["']([^"']+)["']\s*>[^<]*<\/product>/gi,
      '[SHOW_PRODUCT: $1]'
    );

    // <SHOW_PRODUCT: abc> / <SHOW_PRODUCT:abc> style (angle brackets)
    out = out.replace(
      /<\s*SHOW_PRODUCT\s*:\s*([^>\s]+)\s*>/gi,
      '[SHOW_PRODUCT: $1]'
    );
    out = out.replace(
      /<\s*SHOW_CATEGORY\s*:\s*([^>]+?)\s*>/gi,
      '[SHOW_CATEGORY: $1]'
    );
    out = out.replace(
      /<\s*ADD_TO_CART\s*:\s*([^>\s]+)\s*>/gi,
      '[ADD_TO_CART: $1]'
    );

    // {SHOW_PRODUCT: abc} style (curly braces)
    out = out.replace(
      /\{\s*SHOW_PRODUCT\s*:\s*([^}\s]+)\s*\}/gi,
      '[SHOW_PRODUCT: $1]'
    );
    out = out.replace(
      /\{\s*SHOW_CATEGORY\s*:\s*([^}]+?)\s*\}/gi,
      '[SHOW_CATEGORY: $1]'
    );
    out = out.replace(
      /\{\s*ADD_TO_CART\s*:\s*([^}\s]+)\s*\}/gi,
      '[ADD_TO_CART: $1]'
    );

    // [PRODUCT: abc] (missing the SHOW_ prefix)
    out = out.replace(
      /\[\s*PRODUCT\s*:\s*([^\]\s]+)\s*\]/gi,
      '[SHOW_PRODUCT: $1]'
    );
    out = out.replace(
      /\[\s*CATEGORY\s*:\s*([^\]]+?)\s*\]/gi,
      '[SHOW_CATEGORY: $1]'
    );

    return out;
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // Build the new history including this user turn before we send.
    // We use the functional form of setState to avoid stale-state bugs
    // when chips are tapped in quick succession.
    const userTurn = { role: 'user', text: trimmed };
    const nextMessages = [...messages, userTurn];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      // Send the full conversation history so Iba has context (remembers
      // gender preference, previous filters, etc.). The server expects an
      // array of { role: 'user' | 'bot', text }.
      const res = await axios.post(`${API_BASE}/chat`, {
        history: nextMessages,
        message: trimmed, // kept for backwards compatibility
        userEmail,
      });
      const aiReply = normalizeTokens(res.data.reply);

      // Iba can emit multiple [ADD_TO_CART: id] tokens in a single reply
      // (for example when the user asks to add several recommended items
      // at once). Loop through all of them, not just the first. Run them
      // silently because Iba's own reply already confirms what was added -
      // we don't want to follow it with three more "Added X" bubbles.
      const addMatches = [...aiReply.matchAll(/\[ADD_TO_CART:\s*([^\]]+?)\s*\]/g)];
      for (const m of addMatches) {
        handleAction('ADD', m[1].trim(), { silent: true });
      }

      setMessages((prev) => [...prev, { role: 'bot', text: aiReply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageText = (text) => {
    const cleaned = text.replace(/\[ADD_TO_CART:[^\]]*\]/g, '');
    const parts = cleaned.split(
      /(\[SHOW_PRODUCT:\s*[^\]]+\]|\[SHOW_CATEGORY:\s*[^\]]+\])/g
    );

    return parts.map((part, index) => {
      const productMatch = part.match(/\[SHOW_PRODUCT:\s*(\w+)\]/);
      if (productMatch) {
        const productId = productMatch[1].trim();
        const product = allProducts.find((p) => p._id === productId);
        if (!product) return null;

        return (
          <div
            key={index}
            className="my-3 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300"
          >
            <button
              onClick={() => goToProduct(product._id)}
              className="block w-full text-left"
            >
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </button>

            <div className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                {product.category}
              </p>
              <button
                onClick={() => goToProduct(product._id)}
                className="block w-full text-left mt-0.5"
              >
                <p className="font-bold text-sm leading-tight line-clamp-1">
                  {product.name}
                </p>
              </button>
              <p className="font-extrabold text-sm mt-1">${product.price}</p>
              {product.description && (
                <p className="text-[11px] text-gray-500 mt-1.5 leading-snug line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleAction('ADD', product._id)}
                  className="flex-grow inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors"
                >
                  <ShoppingBag size={12} />
                  Add to Bag
                </button>
                <button
                  onClick={() => goToProduct(product._id)}
                  className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 text-gray-900 text-xs font-bold py-2 px-3 rounded-xl border border-gray-200 transition-colors"
                >
                  Details
                  <ExternalLink size={11} />
                </button>
              </div>
            </div>
          </div>
        );
      }

      const categoryMatch = part.match(/\[SHOW_CATEGORY:\s*([^\]]+)\]/);
      if (categoryMatch) {
        const categoryName = categoryMatch[1].trim();
        return (
          <button
            key={index}
            onClick={() => goToCategory(categoryName)}
            className="my-2 w-full flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-2xl text-indigo-700 font-bold text-xs transition-colors"
          >
            <span>Browse all {categoryName}</span>
            <ChevronRight size={16} />
          </button>
        );
      }

      return (
        <span key={index} className="leading-relaxed whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999]">
      {isOpen ? (
        <div className="bg-white w-[340px] sm:w-[380px] h-[560px] shadow-2xl rounded-[32px] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

          <div className="bg-indigo-600 px-5 py-4 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot size={18} />
              </div>
              <div className="leading-tight">
                <p className="font-bold text-sm tracking-tight">Iba</p>
                <p className="text-[10px] text-white/70 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  Online · Your stylist
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:rotate-90 transition-transform p-1"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-grow px-4 py-5 overflow-y-auto bg-gray-50/50"
          >
            {messages.map((m, i) => {
              if (m.type === 'greeting') {
                return (
                  <div key={i} className="mb-4">
                    <h2 className="font-display text-2xl text-gray-900 leading-tight">
                      Hi, I&apos;m{' '}
                      <em className="italic font-light text-indigo-600">Iba</em>.
                    </h2>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      I&apos;ll help you find pieces you&apos;ll love. What are
                      you looking for today?
                    </p>

                    <div className="mt-4 space-y-2">
                      {SUGGESTION_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => sendMessage(chip)}
                          className="w-full text-left px-4 py-2.5 bg-white hover:bg-indigo-50 hover:border-indigo-200 border border-gray-200 rounded-2xl text-sm text-gray-700 hover:text-indigo-700 font-medium transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className={`mb-3 flex ${
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] p-3 text-sm shadow-sm ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none'
                    }`}
                  >
                    {renderMessageText(m.text)}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2 focus-within:ring-2 ring-indigo-100 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Message Iba..."
                className="flex-grow bg-transparent outline-none text-sm py-1"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="text-indigo-600 disabled:text-gray-300 transition-colors"
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 text-white p-5 rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <MessageSquare size={24} />
          <span className="font-bold pr-1 text-sm">Ask Iba</span>
        </button>
      )}
    </div>
  );
};

export default AIChat;