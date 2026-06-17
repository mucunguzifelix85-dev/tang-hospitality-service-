import { useState } from 'react';
import { Product, Department, SUBCATEGORIES } from '../types.js';
import { useLang } from '../i18n/LangContext.js';
import { formatRWF, formatUSD } from '../lib/currency.js';
import { Search, Plus, Eye, CheckCircle2, AlertTriangle, Wine, UtensilsCrossed, Building2 } from 'lucide-react';

interface DepartmentMenuProps {
  products: Product[];
  activeDepartment: Department;
  onChangeDepartment: (dept: Department) => void;
  onAddToCart: (product: Product) => void;
  selectedCartItemIds: string[];
  onChatToBook: (product: Product) => void;
}

const DEPT_ICON: Record<Department, React.ReactNode> = {
  Drinks: <Wine className="h-4 w-4" />,
  Food: <UtensilsCrossed className="h-4 w-4" />,
  Hospitality: <Building2 className="h-4 w-4" />
};

const DEPT_ACCENT: Record<Department, string> = {
  Drinks: 'var(--sage)',
  Food: 'var(--clay)',
  Hospitality: 'var(--gold)'
};

export function DepartmentMenu({
  products,
  activeDepartment,
  onChangeDepartment,
  onAddToCart,
  selectedCartItemIds,
  onChatToBook
}: DepartmentMenuProps) {
  const { t } = useLang();
  const [search, setSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const departments: Department[] = ['Drinks', 'Food', 'Hospitality'];
  const deptLabel: Record<Department, string> = {
    Drinks: t('navDrinks'),
    Food: t('navFood'),
    Hospitality: t('navHospitality')
  };

  const subcats = ['All', ...SUBCATEGORIES[activeDepartment]];

  const filtered = products.filter(p => {
    const matchesDept = p.category === activeDepartment;
    const matchesSub = selectedSub === 'All' || p.subcategory === selectedSub;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSub && matchesSearch;
  });

  return (
    <div id="department-menu-container" className="space-y-6">
      <div id="department-tabs" className="grid grid-cols-3 gap-3">
        {departments.map(dept => (
          <button
            key={dept}
            id={`dept-tab-${dept}`}
            onClick={() => { onChangeDepartment(dept); setSelectedSub('All'); }}
            style={activeDepartment === dept ? { borderColor: DEPT_ACCENT[dept], background: `${DEPT_ACCENT[dept]}0d` } : {}}
            className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all cursor-pointer ${
              activeDepartment === dept ? 'shadow-sm' : 'border-black/5 bg-[var(--cream-card)] hover:border-black/10'
            }`}
          >
            <span style={{ color: activeDepartment === dept ? DEPT_ACCENT[dept] : 'var(--ink)' }} className="opacity-80">
              {DEPT_ICON[dept]}
            </span>
            <span className="text-xs font-bold text-[var(--ink)]">{deptLabel[dept]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[var(--cream-card)] p-4 rounded-2xl border border-black/5 shadow-sm">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--ink)]/40">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            id="menu-search-input"
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--linen)] border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/15 focus:border-[var(--clay)] transition-all text-[var(--ink)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {subcats.map(sub => (
            <button
              key={sub}
              id={`subcat-filter-${sub}`}
              onClick={() => setSelectedSub(sub)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                selectedSub === sub
                  ? 'bg-[var(--clay)] text-white shadow-sm'
                  : 'bg-[var(--linen)] text-[var(--ink)]/70 hover:bg-black/5 border border-black/5'
              }`}
            >
              {sub === 'All' ? t('allSubcategories') : sub}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div id="menu-empty-state" className="text-center py-16 bg-[var(--cream-card)] border border-dashed border-black/10 rounded-3xl">
          <p className="text-[var(--ink)]/40 text-sm">No items match your current filters.</p>
        </div>
      ) : (
        <div id="menu-items-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(prod => {
            const inCart = selectedCartItemIds.includes(prod.id);
            return (
              <div
                id={`product-card-${prod.id}`}
                key={prod.id}
                className="group bg-[var(--cream-card)] rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
              >
                <div className="relative h-44 w-full bg-black/5 overflow-hidden shrink-0">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold text-white bg-black/65 backdrop-blur-sm uppercase rounded-md tracking-wider">
                    {prod.subcategory}
                  </span>
                  {!prod.availability && (
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="px-3 py-1 bg-red-500 text-white text-[11px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {t('outOfStock')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold font-display text-[var(--ink)] line-clamp-1">{prod.name}</h3>
                    <p className="text-xs text-[var(--ink)]/60 line-clamp-2 min-h-[32px] leading-relaxed">{prod.description}</p>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-sm font-mono font-bold text-[var(--gold)]">{formatRWF(prod.priceRWF)}</span>
                      <span className="text-[10px] font-mono text-[var(--ink)]/40">{formatUSD(prod.priceUSD)}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-black/5 flex items-center gap-1.5 flex-wrap">
                    <button
                      id={`view-details-${prod.id}`}
                      onClick={() => setSelectedProduct(prod)}
                      className="p-2 bg-[var(--linen)] hover:bg-black/5 text-[var(--ink)]/60 rounded-xl transition-all cursor-pointer"
                      title={t('viewDetails')}
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>

                    {prod.availability ? (
                      <>
                        <button
                          id={`chat-to-book-${prod.id}`}
                          onClick={() => onChatToBook(prod)}
                          className="px-2.5 py-1.5 bg-[var(--clay)] hover:opacity-90 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                        >
                          <span className="text-[10px]">{t('chatToBook')}</span>
                        </button>
                        <button
                          id={`add-to-cart-${prod.id}`}
                          onClick={() => onAddToCart(prod)}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            inCart
                              ? 'bg-[var(--sage)]/10 text-[var(--sage)] border border-[var(--sage)]/20'
                              : 'bg-black/5 hover:bg-black/10 text-[var(--ink)]/70'
                          }`}
                        >
                          {inCart ? (<><CheckCircle2 className="h-3 w-3" /><span>{t('inCart')}</span></>) : (<><Plus className="h-3 w-3" /><span>{t('addToCart')}</span></>)}
                        </button>
                      </>
                    ) : (
                      <button disabled className="flex-1 py-1.5 px-3 bg-black/5 text-[var(--ink)]/30 rounded-xl text-xs font-semibold cursor-not-allowed">
                        {t('outOfStock')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProduct && (
        <div id="product-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-[var(--cream-card)] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative h-60 bg-black/5">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'; }}
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 h-8 w-8 bg-black/50 hover:bg-black/75 text-white rounded-full flex items-center justify-center transition-all cursor-pointer text-sm font-bold"
              >
                &times;
              </button>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <span className="px-2.5 py-0.5 bg-[var(--clay)] text-white text-[10px] font-bold uppercase rounded-md">{selectedProduct.subcategory}</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold font-display text-[var(--ink)]">{selectedProduct.name}</h2>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-mono font-bold text-[var(--gold)]">{formatRWF(selectedProduct.priceRWF)}</span>
                  <span className="text-xs font-mono text-[var(--ink)]/40">{formatUSD(selectedProduct.priceUSD)}</span>
                </div>
              </div>
              <p className="text-sm text-[var(--ink)]/70 leading-relaxed">{selectedProduct.description}</p>
              <div className="pt-4 border-t border-black/5 flex gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2.5 bg-black/5 hover:bg-black/10 text-[var(--ink)] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t('close')}
                </button>
                {selectedProduct.availability && (
                  <>
                    <button
                      onClick={() => { onChatToBook(selectedProduct); setSelectedProduct(null); }}
                      className="flex-1 py-2.5 bg-[var(--clay)] hover:opacity-90 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {t('chatToBook')}
                    </button>
                    <button
                      onClick={() => { onAddToCart(selectedProduct); setSelectedProduct(null); }}
                      className="py-2.5 px-3 bg-black/5 hover:bg-black/10 text-[var(--ink)] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      + {t('addToCart')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
