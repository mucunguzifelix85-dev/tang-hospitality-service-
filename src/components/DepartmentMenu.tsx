import { useState } from 'react';
import { Product, Department, SUBCATEGORIES } from '../types.js';
import { formatRWF, formatUSD } from '../lib/currency.js';
import { ShoppingCart, MessageSquare, ImagePlus, CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n/LangContext.js';

interface DepartmentMenuProps {
  products: Product[];
  activeDepartment: Department;
  onChangeDepartment: (dep: Department) => void;
  onAddToCart: (product: Product) => void;
  selectedCartItemIds: string[];
  onChatToBook: (product: Product) => Promise<void>;
}

const DEPARTMENTS: Department[] = ['Drinks', 'Food', 'Hospitality'];

export function DepartmentMenu({
  products,
  activeDepartment,
  onChangeDepartment,
  onAddToCart,
  selectedCartItemIds,
  onChatToBook
}: DepartmentMenuProps) {
  const { t } = useLang();
  const [activeSub, setActiveSub] = useState<string>('All');
  const [chattingId, setChattingId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string>('');

  const subs = ['All', ...SUBCATEGORIES[activeDepartment]];

  function handleDeptChange(dep: Department) {
    onChangeDepartment(dep);
    setActiveSub('All');
    setChatError('');
  }

  const filtered = products.filter(p => {
    if (p.category !== activeDepartment) return false;
    if (activeSub !== 'All' && p.subcategory !== activeSub) return false;
    return true;
  });

  async function handleChat(product: Product) {
    setChatError('');
    setChattingId(product.id);
    try {
      await onChatToBook(product);
    } catch (err: any) {
      setChatError('Could not open chat for "' + product.name + '". Please try again.');
    } finally {
      setChattingId(null);
    }
  }

  return (
    <div id="department-menu-root" className="space-y-5">
      {/* Department tabs */}
      <div className="flex gap-2 bg-[var(--cream-card)] p-2 rounded-2xl border border-black/5 shadow-sm flex-wrap">
        {DEPARTMENTS.map(dep => (
          <button
            key={dep}
            onClick={() => handleDeptChange(dep)}
            className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDepartment === dep
                ? 'bg-[var(--clay)] text-white shadow-sm'
                : 'text-[var(--ink)]/50 hover:text-[var(--ink)] hover:bg-black/5'
            }`}
          >
            {dep}
          </button>
        ))}
      </div>

      {/* Subcategory pills */}
      <div className="flex gap-2 flex-wrap">
        {subs.map(sub => (
          <button
            key={sub}
            onClick={() => setActiveSub(sub)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeSub === sub
                ? 'bg-[var(--ink)] text-white'
                : 'bg-[var(--cream-card)] border border-black/8 text-[var(--ink)]/55 hover:border-black/20'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {chatError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-xl">
          {chatError}
        </div>
      )}

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-[var(--cream-card)] border border-dashed border-black/10 rounded-3xl">
          <ImagePlus className="h-8 w-8 text-black/15 mx-auto mb-2" />
          <p className="text-[var(--ink)]/40 text-sm">No products in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(product => {
            const inCart = selectedCartItemIds.includes(product.id);
            const unavailable = !product.availability || (product.quantity !== undefined && product.quantity <= 0);
            const isChatting = chattingId === product.id;

            return (
              <div
                key={product.id}
                id={`menu-card-${product.id}`}
                className={`bg-[var(--cream-card)] rounded-3xl border border-black/5 shadow-sm overflow-hidden flex flex-col transition-all ${unavailable ? 'opacity-60' : 'hover:shadow-md'}`}
              >
                {/* Image */}
                <div className="h-44 bg-black/5 overflow-hidden relative">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--ink)]/15">
                      <ImagePlus className="h-10 w-10" />
                    </div>
                  )}
                  {unavailable && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="bg-white/90 border border-black/10 text-[var(--ink)]/60 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--clay)]">
                    {product.category} · {product.subcategory}
                  </span>
                  <h3 className="text-sm font-bold text-[var(--ink)] mt-0.5 mb-1">{product.name}</h3>
                  <p className="text-xs text-[var(--ink)]/50 line-clamp-2 flex-1">{product.description}</p>

                  {product.quantity !== undefined && product.quantity > 0 && product.quantity <= 10 && (
                    <p className="text-[10px] font-bold text-amber-600 mt-1">Only {product.quantity} left!</p>
                  )}

                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <div className="font-mono font-bold text-[var(--gold)] text-sm">{formatRWF(product.priceRWF)}</div>
                      <div className="font-mono text-[10px] text-[var(--ink)]/40">{formatUSD(product.priceUSD)}</div>
                    </div>
                  </div>

                  {/* Action buttons — always rendered for every product */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      id={`add-to-cart-${product.id}`}
                      onClick={() => !unavailable && onAddToCart(product)}
                      disabled={unavailable}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        inCart
                          ? 'bg-emerald-500 text-white'
                          : unavailable
                          ? 'bg-black/5 text-[var(--ink)]/30 cursor-not-allowed'
                          : 'bg-[var(--ink)] hover:opacity-80 text-white'
                      }`}
                    >
                      {inCart ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-3.5 w-3.5" />
                          <span>{t('addToCart') ?? 'Add to Cart'}</span>
                        </>
                      )}
                    </button>

                    {/* Chat Now button — works for ALL products including newly added ones */}
                    <button
                      id={`chat-now-${product.id}`}
                      onClick={() => handleChat(product)}
                      disabled={isChatting}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[var(--clay)] hover:opacity-90 text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isChatting ? (
                        <>
                          <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                          <span>Opening…</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Chat Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}