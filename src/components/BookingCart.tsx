import { useState } from 'react';
import { Product } from '../types.js';
import { useLang } from '../i18n/LangContext.js';
import { formatRWF, formatUSD } from '../lib/currency.js';
import { Minus, Plus, Trash2, ShoppingBag, AlertTriangle } from 'lucide-react';

interface BookingCartProps {
  items: { product: Product; quantity: number }[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onSubmitOrder: (notes: string) => Promise<void>;
  onClose: () => void;
}

export function BookingCart({ items, onUpdateQuantity, onRemoveItem, onSubmitOrder, onClose }: BookingCartProps) {
  const { t } = useLang();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalRWF = items.reduce((sum, item) => sum + item.product.priceRWF * item.quantity, 0);
  const totalUSD = items.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      await onSubmitOrder(notes);
    } catch (err: any) {
      setError(err.message || 'Failed to submit order.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="booking-cart-root" className="flex flex-col h-full">
      <div className="p-5 bg-[var(--ink)] text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4.5 w-4.5 text-[var(--clay)]" />
          <h3 className="text-sm font-bold font-display">{t('cart')}</h3>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white text-lg font-bold cursor-pointer">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-8 w-8 text-black/15 mx-auto mb-2" />
            <p className="text-[var(--ink)]/40 text-sm">{t('cartEmpty')}</p>
          </div>
        ) : (
          items.map(({ product, quantity }) => (
            <div key={product.id} id={`cart-item-${product.id}`} className="flex gap-3 bg-black/[0.02] p-3 rounded-xl border border-black/5">
              <img src={product.image} alt={product.name} className="h-14 w-14 object-cover rounded-lg shrink-0 bg-black/5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[var(--ink)] line-clamp-1">{product.name}</div>
                <div className="text-[10px] font-mono text-[var(--gold)] mt-0.5">{formatRWF(product.priceRWF)} . {formatUSD(product.priceUSD)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => onUpdateQuantity(product.id, -1)} className="h-6 w-6 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-lg cursor-pointer">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-mono font-bold w-6 text-center">{quantity}</span>
                  <button onClick={() => onUpdateQuantity(product.id, 1)} className="h-6 w-6 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-lg cursor-pointer">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button onClick={() => onRemoveItem(product.id)} className="ml-auto h-6 w-6 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="p-4 border-t border-black/5 space-y-3 shrink-0">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notesPlaceholder')}
            rows={2}
            className="w-full p-2.5 border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/15 focus:border-[var(--clay)] transition-all bg-white"
          />
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-[var(--ink)]/60 uppercase tracking-wider">{t('total')}</span>
            <div className="text-right">
              <div className="font-mono font-bold text-[var(--gold)]">{formatRWF(totalRWF)}</div>
              <div className="font-mono text-[10px] text-[var(--ink)]/40">{formatUSD(totalUSD)}</div>
            </div>
          </div>
          <button
            id="submit-order-btn"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-[var(--clay)] hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? '...' : t('checkout')}
          </button>
        </div>
      )}
    </div>
  );
}
