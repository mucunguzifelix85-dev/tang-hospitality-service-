import { useState, useMemo, useRef } from 'react';
import { Product, Department, SUBCATEGORIES } from '../types.js';
import { formatRWF, formatUSD } from '../lib/currency.js';
import { Plus, Pencil, Trash2, ImagePlus, X, PackageOpen, Loader2 } from 'lucide-react';

interface AdminCatalogProps {
  products: Product[];
  onCreateItem: (item: Omit<Product, 'id'>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<Product>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

const DEPARTMENTS: Department[] = ['Drinks', 'Food', 'Hospitality'];

type FormState = {
  name: string;
  description: string;
  category: Department;
  subcategory: string;
  priceRWF: string;
  priceUSD: string;
  quantity: string;
  image: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  category: 'Drinks',
  subcategory: SUBCATEGORIES['Drinks'][0],
  priceRWF: '',
  priceUSD: '',
  quantity: '',
  image: ''
};

function resizeImageToBase64(file: File, maxWidth = 900, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export function AdminCatalog({ products, onCreateItem, onUpdateItem, onDeleteItem }: AdminCatalogProps) {
  const [filter, setFilter] = useState<'All' | Department>('All');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [imageProcessing, setImageProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (filter === 'All') return products;
    return products.filter(p => p.category === filter);
  }, [products, filter]);

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      category: product.category,
      subcategory: product.subcategory || SUBCATEGORIES[product.category][0],
      priceRWF: String(product.priceRWF ?? ''),
      priceUSD: String(product.priceUSD ?? ''),
      quantity: String(product.quantity ?? 0),
      image: product.image || ''
    });
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  function handleCategoryChange(category: Department) {
    setForm(prev => ({ ...prev, category, subcategory: SUBCATEGORIES[category][0] }));
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setImageProcessing(true);
    setError('');
    try {
      const base64 = await resizeImageToBase64(file);
      setForm(prev => ({ ...prev, image: base64 }));
    } catch {
      setError('Could not process that image. Try a different file.');
    } finally {
      setImageProcessing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('Product name is required.'); return; }
    const rwf = Number(form.priceRWF);
    const usd = Number(form.priceUSD);
    const qty = Number(form.quantity);
    if (!form.priceRWF || isNaN(rwf) || rwf < 0) { setError('Enter a valid price in RWF.'); return; }
    if (!form.priceUSD || isNaN(usd) || usd < 0) { setError('Enter a valid price in USD.'); return; }
    if (form.quantity === '' || isNaN(qty) || qty < 0) { setError('Enter a valid available quantity.'); return; }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      subcategory: form.subcategory,
      priceRWF: rwf,
      priceUSD: usd,
      quantity: qty,
      availability: qty > 0,
      image: form.image
    };

    setSaving(true);
    try {
      if (editingId) {
        await onUpdateItem(editingId, payload);
      } else {
        await onCreateItem(payload as Omit<Product, 'id'>);
      }
      closeForm();
    } catch (err: any) {
      setError(err.message || 'Could not save product. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await onDeleteItem(id);
    } catch {
      setError('Could not delete that product. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div id="admin-catalog-root" className="space-y-4">
      <div className="flex justify-between items-center gap-3 flex-wrap bg-[var(--cream-card)] p-4 rounded-2xl border border-black/5 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {(['All', ...DEPARTMENTS] as const).map(dep => (
            <button
              key={dep}
              onClick={() => setFilter(dep)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === dep ? 'bg-[var(--clay)] text-white' : 'bg-black/5 text-[var(--ink)]/60 hover:bg-black/10'
              }`}
            >
              {dep}
            </button>
          ))}
        </div>
        <button
          id="add-product-btn"
          onClick={openAddForm}
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--clay)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[var(--cream-card)] border border-dashed border-black/10 rounded-3xl">
          <PackageOpen className="h-8 w-8 text-black/15 mx-auto mb-2" />
          <p className="text-[var(--ink)]/40 text-sm">No products in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => {
            const qty = product.quantity ?? 0;
            const stockLabel = qty <= 0 ? 'Out of stock' : qty <= 10 ? `${qty} left` : `${qty} in stock`;
            const stockColor = qty <= 0 ? 'bg-red-100 text-red-700' : qty <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';

            return (
              <div key={product.id} id={`product-card-${product.id}`} className="bg-[var(--cream-card)] rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col">
                <div className="h-36 bg-black/5 overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--ink)]/20">
                      <ImagePlus className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--clay)]">{product.category} . {product.subcategory}</span>
                      <h3 className="text-sm font-bold text-[var(--ink)] mt-0.5">{product.name}</h3>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold ${stockColor}`}>{stockLabel}</span>
                  </div>
                  <p className="text-xs text-[var(--ink)]/50 mt-1.5 line-clamp-2 flex-1">{product.description}</p>
                  <div className="flex justify-between items-end mt-3">
                    <div>
                      <div className="font-mono font-bold text-[var(--gold)] text-sm">{formatRWF(product.priceRWF)}</div>
                      <div className="font-mono text-[10px] text-[var(--ink)]/40">{formatUSD(product.priceUSD)}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        id={`edit-product-${product.id}`}
                        onClick={() => openEditForm(product)}
                        className="p-2 bg-black/5 hover:bg-black/10 text-[var(--ink)]/60 rounded-xl transition-all cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        id={`delete-product-${product.id}`}
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deletingId === product.id}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                        title="Delete"
                      >
                        {deletingId === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeForm}>
          <div
            className="w-full max-w-lg bg-[var(--cream-card)] rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-black/5 sticky top-0 bg-[var(--cream-card)] z-10">
              <h3 className="font-display font-bold text-[var(--ink)]">{editingId ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={closeForm} className="text-[var(--ink)]/40 hover:text-[var(--ink)] cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form id="product-form" onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">{error}</div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]/40 mb-1.5 block">Product Image</label>
                <input ref={fileInputRef} id="product-image-input" type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-2xl border-2 border-dashed border-black/10 hover:border-[var(--clay)]/40 bg-black/[0.02] flex items-center justify-center overflow-hidden transition-all cursor-pointer"
                >
                  {imageProcessing ? (
                    <Loader2 className="h-6 w-6 text-[var(--clay)] animate-spin" />
                  ) : form.image ? (
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-[var(--ink)]/30">
                      <ImagePlus className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-xs font-semibold">Click to upload</span>
                    </div>
                  )}
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]/40 mb-1.5 block">Product Name</label>
                <input
                  id="product-name-input"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Fresh Mango Juice"
                  className="w-full py-2.5 px-4 border border-black/10 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/20 focus:border-[var(--clay)]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]/40 mb-1.5 block">Description</label>
                <textarea
                  id="product-description-input"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the product"
                  rows={3}
                  className="w-full py-2.5 px-4 border border-black/10 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/20 focus:border-[var(--clay)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]/40 mb-1.5 block">Category</label>
                  <select
                    id="product-category-input"
                    value={form.category}
                    onChange={(e) => handleCategoryChange(e.target.value as Department)}
                    className="w-full py-2.5 px-3 border border-black/10 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/20 focus:border-[var(--clay)]"
                  >
                    {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]/40 mb-1.5 block">Subcategory</label>
                  <select
                    id="product-subcategory-input"
                    value={form.subcategory}
                    onChange={(e) => setForm(prev => ({ ...prev, subcategory: e.target.value }))}
                    className="w-full py-2.5 px-3 border border-black/10 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/20 focus:border-[var(--clay)]"
                  >
                    {SUBCATEGORIES[form.category].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]/40 mb-1.5 block">Price (RWF)</label>
                  <input
                    id="product-price-rwf-input"
                    type="number"
                    min="0"
                    value={form.priceRWF}
                    onChange={(e) => setForm(prev => ({ ...prev, priceRWF: e.target.value }))}
                    placeholder="0"
                    className="w-full py-2.5 px-3 border border-black/10 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/20 focus:border-[var(--clay)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]/40 mb-1.5 block">Price (USD)</label>
                  <input
                    id="product-price-usd-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.priceUSD}
                    onChange={(e) => setForm(prev => ({ ...prev, priceUSD: e.target.value }))}
                    placeholder="0.00"
                    className="w-full py-2.5 px-3 border border-black/10 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/20 focus:border-[var(--clay)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]/40 mb-1.5 block">Stock Qty</label>
                  <input
                    id="product-quantity-input"
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full py-2.5 px-3 border border-black/10 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/20 focus:border-[var(--clay)]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2.5 bg-black/5 hover:bg-black/10 text-[var(--ink)]/60 rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-product-btn"
                  type="submit"
                  disabled={saving || imageProcessing}
                  className="flex-1 py-2.5 bg-[var(--clay)] hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingId ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}