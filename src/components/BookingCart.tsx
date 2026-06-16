import { useState } from 'react';
import { Product } from '../types.js';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface BookingCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onSubmitOrder: (notes: string) => Promise<void>;
  onClose: () => void;
}

export function BookingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitOrder,
  onClose
}: BookingCartProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  async function handleOrderConfirm() {
    if (items.length === 0) return;
    setError('');
    setLoading(true);
    try {
      await onSubmitOrder(notes);
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'We could not log this order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="booking-cart-drawer" className="h-full flex flex-col bg-white">
      {/* Drawer Head */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">Your Booking Cart</h2>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-mono">
            {items.reduce((acc, v) => acc + v.quantity, 0)}
          </span>
        </div>
        <button
          id="close-cart-drawer-btn"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-900 font-medium text-xs cursor-pointer"
        >
          Close &times;
        </button>
      </div>

      {/* Cart Content scroll area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-150 text-red-600 text-xs rounded-xl">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div id="cart-empty-visual" className="h-48 flex flex-col items-center justify-center text-center space-y-2">
            <div className="h-12 w-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium text-slate-400">Your cart is currently dry.</p>
            <p className="text-[10px] text-slate-400">Select any dish to begin your order.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                id={`cart-item-${item.product.id}`}
                key={item.product.id}
                className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-12 w-12 rounded-lg object-cover bg-slate-200 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-950 truncate">{item.product.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ${item.product.price.toFixed(2)} &times; {item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-200 bg-white rounded-lg">
                    <button
                      id={`cart-dec-${item.product.id}`}
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                      className="p-1 hover:bg-slate-50 text-slate-500 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-2 text-xs font-mono font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      id={`cart-inc-${item.product.id}`}
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                      className="p-1 hover:bg-slate-50 text-slate-500 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    id={`cart-trash-${item.product.id}`}
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Special Dining Directions
              </label>
              <textarea
                id="order-notes-textarea"
                rows={3}
                placeholder="Allergy flags, rare/well-done preference, or seating requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-slate-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* Drawer Purchase Actions Footer */}
      {items.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
          <div className="space-y-1.5 text-xs text-slate-650">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-slate-900">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bistro Service Fee</span>
              <span className="font-mono text-emerald-600 font-medium">FREE</span>
            </div>
            <hr className="border-slate-200/50 my-1" />
            <div className="flex justify-between text-sm font-bold text-slate-900">
              <span>Est. Total</span>
              <span className="font-mono text-amber-600">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            id="cart-submit-order-btn"
            onClick={handleOrderConfirm}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 hover:-translate-y-0.5 cursor-pointer"
          >
            {loading ? 'Processing Order...' : 'Confirm order & start support chat'}
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />
            Orders verified in real-time by kitchen staff
          </p>
        </div>
      )}
    </div>
  );
}
