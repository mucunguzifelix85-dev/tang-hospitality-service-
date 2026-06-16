import { useState } from 'react';
import { Product } from '../types.js';
import { Search, SlidersHorizontal, Plus, ShoppingBag, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';

interface MenuSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  cartCount: number;
  onOpenCart: () => void;
  selectedCartItemIds: string[];
  onChatToBook: (product: Product) => void;
}

export function MenuSection({
  products,
  onAddToCart,
  cartCount,
  onOpenCart,
  selectedCartItemIds,
  onChatToBook
}: MenuSectionProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = ['All', 'Food', 'Drinks', 'Desserts'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                          product.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="menu-section-container" className="space-y-6">
      {/* Search and Category Filter Toolbar */}
      <div id="search-filter-toolbar" className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            id="menu-search-input"
            type="text"
            placeholder="Search savory dishes, premium cocktails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center text-xs font-semibold text-slate-400 gap-1 mr-2 invisible sm:visible">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Category:</span>
          </div>
          {categories.map((cat) => (
            <button
              id={`category-filter-${cat}`}
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/15'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950 border border-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div id="menu-empty-state" className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl">
          <p className="text-slate-400 text-sm">No delicious items match your current filter settings.</p>
          <button
            id="reset-filters"
            onClick={() => { setSearch(''); setSelectedCategory('All'); }}
            className="mt-3 px-4 py-2 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
          >
            Clear Filters &amp; Search
          </button>
        </div>
      ) : (
        <div id="menu-items-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => {
            const inCart = selectedCartItemIds.includes(prod.id);
            return (
              <div
                id={`product-card-${prod.id}`}
                key={prod.id}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
              >
                {/* Product Thumbnail Container */}
                <div role="img" aria-label={prod.name} className="relative h-48 w-full bg-slate-100 overflow-hidden shrink-0">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback image in case Unsplash fails or is blocked
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  {/* Category Pill Tag */}
                  <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold text-white bg-slate-950/70 backdrop-blur-sm uppercase branding-tag rounded-md tracking-wider">
                    {prod.category}
                  </span>

                  {/* Stock Availability status tag */}
                  {!prod.availability && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="px-3 py-1 bg-red-500 text-white text-[11px] font-bold uppercase tracking-widest rounded-full shadow flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content body */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold font-serif text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                        {prod.name}
                      </h3>
                      <span className="text-base font-mono font-bold text-slate-950 shrink-0">
                        ${prod.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-50 flex items-center gap-1.5 flex-wrap">
                    <button
                      id={`view-details-${prod.id}`}
                      onClick={() => setSelectedProduct(prod)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl transition-all cursor-pointer"
                      title="View Detailed Description"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>

                    {prod.availability ? (
                      <>
                        <button
                          id={`chat-to-book-${prod.id}`}
                          onClick={() => onChatToBook(prod)}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                          title="Instantly open a chat with Le Chef to book this product!"
                        >
                          <span className="text-[10px]">💬 Chat to Book</span>
                        </button>

                        <button
                          id={`add-to-cart-${prod.id}`}
                          onClick={() => onAddToCart(prod)}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            inCart
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-150'
                          }`}
                        >
                          {inCart ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>In Cart</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              <span>Add Cart</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        disabled
                        className="flex-1 py-1.5 px-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                      >
                        Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div id="product-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="relative h-64 bg-slate-100">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <button
                id="close-product-modal"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 h-8 w-8 bg-black/50 hover:bg-black/75 text-white rounded-full flex items-center justify-center transition-all cursor-pointer text-sm font-bold"
              >
                &times;
              </button>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold uppercase rounded-md">
                  {selectedProduct.category}
                </span>
                {selectedProduct.availability ? (
                  <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-md">
                    In Stock
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-red-500 text-white text-[10px] font-bold uppercase rounded-md">
                    Unavailable
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-xl font-bold font-serif text-slate-950">
                    {selectedProduct.name}
                  </h2>
                  <span className="text-lg font-mono font-bold text-slate-950">
                    ${selectedProduct.price.toFixed(2)}
                  </span>
                </div>
                <div className="h-1 w-12 bg-amber-500 rounded-full mt-2.5"></div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Detailed Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedProduct.description || "No specific ingredient descriptors have been noted for this premium curation. Rest assured, our kitchen works solely with organic, freshly-sourced produce and sustainable prime cuts."}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 flex-wrap sm:flex-nowrap">
                <button
                  id="modal-close-btn"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close Details
                </button>
                {selectedProduct.availability ? (
                  <>
                    <button
                      id="modal-chat-to-book-btn"
                      onClick={() => {
                        onChatToBook(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-lg shadow-amber-500/10 cursor-pointer"
                    >
                      <span>💬 Chat with Chef to Book</span>
                    </button>
                    <button
                      id="modal-add-to-cart-btn"
                      onClick={() => {
                        onAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-205 text-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200"
                      title="Add item to your cart and continue browsing"
                    >
                      + Add Cart
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    className="flex-1 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                  >
                    Out of Stock Currently
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
