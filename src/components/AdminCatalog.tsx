import { useState } from 'react';
import { Product, Department, SUBCATEGORIES } from '../types.js';
import { useLang } from '../i18n/LangContext.js';
import { formatRWF, formatUSD } from '../lib/currency.js';
import { Plus, Edit3, Trash2, CheckCircle2, XCircle, AlertTriangle, Image as ImageIcon } from 'lucide-react';

interface AdminCatalogProps {
  products: Product[];
  onCreateItem: (item: Omit<Product, 'id'>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<Product>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

const PRESET_IMAGES = [
  { name: 'Drinks', url: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=600&q=80' },
  { name: 'Meal', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80' },
  { name: 'Dessert', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' },
  { name: 'Hotel Room', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
  { name: 'Event Hall', url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80' },
  { name: 'Catering', url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80' },
];

export function AdminCatalog({ products, onCreateItem, onUpdateItem, onDeleteItem }: AdminCatalogProps) {
  const { t } = useLang();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Department>('Drinks');
  const [subcategory, setSubcategory] = useState(SUBCATEGORIES['Drinks'][0]);
  const [description, setDescription] = useState('');
  const [priceRWF, setPriceRWF] = useState('');
  const [priceUSD, setPriceUSD] = useState('');
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [availability, setAvailability] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function startEdit(prod: Product) {
    setEditingId(prod.id);
    setName(prod.name);
    setCategory(prod.category);
    setSubcategory(prod.subcategory);
    setDescription(prod.description);
    setPriceRWF(prod.priceRWF.toString());
    setPriceUSD(prod.priceUSD.toString());
    setImage(prod.image);
    setAvailability(prod.availability);
    setIsFormOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setCategory('Drinks');
    setSubcategory(SUBCATEGORIES['Drinks'][0]);
    setDescription('');
    setPriceRWF('');
    setPriceUSD('');
    setImage(PRESET_IMAGES[0].url);
    setAvailability(true);
    setIsFormOpen(false);
    setError('');
  }

  function handleCategoryChange(newCat: Department) {
    setCategory(newCat);
    setSubcategory(SUBCATEGORIES[newCat][0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name || !priceRWF || !priceUSD) {
      setError('Name, RWF price, and USD price are required.');
      return;
    }

    const rwfNum = parseFloat(priceRWF);
    const usdNum = parseFloat(priceUSD);
    if (isNaN(rwfNum) || rwfNum <= 0 || isNaN(usdNum) || usdNum <= 0) {
      setError('Please enter valid positive prices for both currencies.');
      return;
    }

    setLoading(true);
    try {
      const payload = { name, category, subcategory, description, priceRWF: rwfNum, priceUSD: usdNum, image, availability };
      if (editingId) {
        await onUpdateItem(editingId, payload);
      } else {
        await onCreateItem(payload);
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error saving item.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Permanently delete this item?')) {
      try {
        await onDeleteItem(id);
      } catch (err: any) {
        alert(err.message || 'Could not delete.');
      }
    }
  }

  async function toggleAvailabilityDirectly(prod: Product) {
    try {
      await onUpdateItem(prod.id, { availability: !prod.availability });
    } catch (err: any) {
      alert('Could not toggle availability: ' + err.message);
    }
  }

  return (
    <div id="admin-catalog-root" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--cream-card)] p-5 rounded-2xl border border-black/5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold font-display text-[var(--ink)]">{t('manageCatalog')}</h2>
          <p className="text-xs text-[var(--ink)]/50">Add, edit, or remove drinks, food, and hospitality services.</p>
        </div>
        <button
          id="open-create-form"
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="py-2.5 px-4 bg-[var(--clay)] hover:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{t('addNewItem')}</span>
        </button>
      </div>

      {isFormOpen && (
        <div id="item-form-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-[var(--cream-card)] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 bg-[var(--ink)] text-white flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold font-display">{editingId ? t('edit') : t('addNewItem')}</h3>
              <button onClick={resetForm} className="text-white/60 hover:text-white text-lg font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--ink)]/70 uppercase tracking-wider mb-1">{t('itemName')}</label>
                <input
                  id="form-item-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2 px-3 border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/15 focus:border-[var(--clay)] transition-all bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)]/70 uppercase tracking-wider mb-1">{t('category')}</label>
                  <select
                    id="form-item-category"
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as Department)}
                    className="w-full py-2 px-3 border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/15 focus:border-[var(--clay)] transition-all bg-white"
                  >
                    <option value="Drinks">Drinks</option>
                    <option value="Food">Food</option>
                    <option value="Hospitality">Hospitality Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)]/70 uppercase tracking-wider mb-1">{t('subcategory')}</label>
                  <select
                    id="form-item-subcategory"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full py-2 px-3 border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/15 focus:border-[var(--clay)] transition-all bg-white"
                  >
                    {SUBCATEGORIES[category].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)]/70 uppercase tracking-wider mb-1">{t('priceRWF')}</label>
                  <input
                    id="form-item-price-rwf"
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="5000"
                    value={priceRWF}
                    onChange={(e) => setPriceRWF(e.target.value)}
                    className="w-full py-2 px-3 border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/15 focus:border-[var(--clay)] transition-all bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)]/70 uppercase tracking-wider mb-1">{t('priceUSD')}</label>
                  <input
                    id="form-item-price-usd"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="4.25"
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(e.target.value)}
                    className="w-full py-2 px-3 border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/15 focus:border-[var(--clay)] transition-all bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)]/70 uppercase tracking-wider mb-1">{t('description')}</label>
                <textarea
                  id="form-item-desc"
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/15 focus:border-[var(--clay)] transition-all bg-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)]/70 uppercase tracking-wider mb-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-[var(--clay)]" />
                  {t('image')}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                  {PRESET_IMAGES.map(preset => (
                    <button
                      type="button"
                      key={preset.url}
                      onClick={() => setImage(preset.url)}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        image === preset.url ? 'border-[var(--clay)]' : 'border-black/10'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  id="form-item-img-url"
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full py-2 px-3 border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/15 focus:border-[var(--clay)] transition-all bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)]/70 uppercase tracking-wider mb-1">{t('available')}</label>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setAvailability(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      availability ? 'bg-[var(--sage)]/10 border border-[var(--sage)]/30 text-[var(--sage)] font-bold' : 'bg-black/5 border border-black/10 text-[var(--ink)]/50'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" /><span>{t('inStock')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvailability(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      !availability ? 'bg-red-50 border border-red-200 text-red-700 font-bold' : 'bg-black/5 border border-black/10 text-[var(--ink)]/50'
                    }`}
                  >
                    <XCircle className="h-4 w-4" /><span>{t('outOfStock')}</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-black/5 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 bg-black/5 hover:bg-black/10 text-[var(--ink)] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  id="btn-save-item"
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[var(--clay)] hover:opacity-90 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{loading ? '...' : t('save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div id="admin-items-catalogue-list" className="bg-[var(--cream-card)] border border-black/5 rounded-2xl overflow-hidden shadow-sm">
        {products.length === 0 ? (
          <div className="text-center py-16 text-[var(--ink)]/40 text-xs">Catalog is empty.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--ink)] text-white">
                  <th className="p-4 font-semibold">Image</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Stock</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-[var(--ink)]">
                {products.map(p => (
                  <tr id={`catalog-row-${p.id}`} key={p.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="p-4"><img src={p.image} alt={p.name} className="h-10 w-14 object-cover bg-black/5 rounded-lg" /></td>
                    <td className="p-4">
                      <div className="font-bold text-[var(--ink)]">{p.name}</div>
                      <div className="text-[10px] text-[var(--ink)]/50">{p.category} . {p.subcategory}</div>
                    </td>
                    <td className="p-4"><span className="px-2 py-0.5 bg-black/5 font-bold rounded uppercase tracking-wider text-[9px]">{p.category}</span></td>
                    <td className="p-4 font-mono font-bold text-[var(--gold)]">
                      {formatRWF(p.priceRWF)}<br /><span className="text-[10px] text-[var(--ink)]/40">{formatUSD(p.priceUSD)}</span>
                    </td>
                    <td className="p-4">
                      <button
                        id={`toggle-avail-row-${p.id}`}
                        onClick={() => toggleAvailabilityDirectly(p)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          p.availability ? 'bg-[var(--sage)]/10 text-[var(--sage)] border-[var(--sage)]/30' : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {p.availability ? t('inStock') : t('outOfStock')}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button id={`catalogue-edit-${p.id}`} onClick={() => startEdit(p)} className="p-1.5 bg-black/5 hover:bg-[var(--clay)]/10 hover:text-[var(--clay)] rounded-lg transition-colors cursor-pointer">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button id={`catalogue-delete-${p.id}`} onClick={() => handleDelete(p.id)} className="p-1.5 bg-black/5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
