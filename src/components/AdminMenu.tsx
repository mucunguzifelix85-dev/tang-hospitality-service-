import React, { useState } from 'react';
import { Product } from '../types.js';
import { Plus, Edit3, Trash2, CheckCircle2, XCircle, AlertTriangle, Image as ImageIcon } from 'lucide-react';

interface AdminMenuProps {
  products: Product[];
  onCreateItem: (item: Omit<Product, 'id'>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<Product>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

// Curation of gorgeous public unsplash images to pick during creation
const PRESET_IMAGES = [
  { name: 'Gourmet Steak', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fresh Salad', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
  { name: 'Pasta Curation', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { name: 'Tacos Platter', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80' },
  { name: 'Seafood Clams', url: 'https://images.unsplash.com/photo-1534080391025-a77d018f3ee0?auto=format&fit=crop&w=600&q=80' },
  { name: 'Chilled Cocktail', url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80' },
  { name: 'Decadent Chocolate Cake', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fine Red Wine', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80' }
];

export function AdminMenu({
  products,
  onCreateItem,
  onUpdateItem,
  onDeleteItem
}: AdminMenuProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [availability, setAvailability] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form for edit
  function startEdit(prod: Product) {
    setEditingId(prod.id);
    setName(prod.name);
    setCategory(prod.category);
    setDescription(prod.description);
    setPrice(prod.price.toString());
    setImage(prod.image);
    setAvailability(prod.availability);
    setIsFormOpen(true);
  }

  // Clear fields
  function resetForm() {
    setEditingId(null);
    setName('');
    setCategory('Food');
    setDescription('');
    setPrice('');
    setImage(PRESET_IMAGES[0].url);
    setAvailability(true);
    setIsFormOpen(false);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!name || !price) {
      setError('Name and price are required items.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please specify a valid positive numerical price.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        category,
        description,
        price: priceNum,
        image,
        availability
      };

      if (editingId) {
        await onUpdateItem(editingId, payload);
      } else {
        await onCreateItem(payload);
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error executing dynamic database write.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Do you really want to permanently request deletion for this gourmet item?')) {
      try {
        await onDeleteItem(id);
      } catch (err: any) {
        alert(err.message || 'We could not write deletion.');
      }
    }
  }

  // Toggle quick stock availability button from the grid list directly
  async function toggleAvailabilityDirectly(prod: Product) {
    try {
      await onUpdateItem(prod.id, { availability: !prod.availability });
    } catch (err: any) {
      alert('We could not modify stock toggle: ' + err.message);
    }
  }

  return (
    <div id="admin-menu-root" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold font-serif text-slate-900">Configure Culinary Catalogue</h2>
          <p className="text-xs text-slate-500">Formulate courses, edit prices, or publish gourmet specials</p>
        </div>

        <button
          id="open-create-form"
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Curation</span>
        </button>
      </div>

      {/* Editor Modal Drawer/Sheet */}
      {isFormOpen && (
        <div id="item-form-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold font-serif">
                {editingId ? 'Edit Catalogue Curation' : 'Publish New Culinary Course'}
              </h3>
              <button
                id="close-form-modal"
                onClick={resetForm}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Form body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-650 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Item Title Name</label>
                  <input
                    id="form-item-name"
                    type="text"
                    required
                    placeholder="Smoked Crispy Duck Breast"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-slate-900 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Category Bracket</label>
                  <select
                    id="form-item-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-slate-900 bg-slate-50/50"
                  >
                    <option value="Food">Food</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Price Badge (USD)</label>
                  <input
                    id="form-item-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="19.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-slate-900 bg-slate-50/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Initial Availability</label>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setAvailability(true)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        availability 
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold' 
                          : 'bg-slate-50 border border-slate-200 text-slate-550'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>In Stock</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvailability(false)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        !availability 
                          ? 'bg-red-50 border border-red-250 text-red-800 font-bold' 
                          : 'bg-slate-50 border border-slate-200 text-slate-550'
                      }`}
                    >
                      <XCircle className="h-4 w-4 text-red-650" />
                      <span>Out of Stock</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Flavor / Culinary description</label>
                <textarea
                  id="form-item-desc"
                  rows={3}
                  required
                  placeholder="Seared glazed duck accompanied by honey lavender reductions and seasonal asparagus..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-slate-900 bg-slate-50/50"
                />
              </div>

              {/* Presets images selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-amber-500" />
                  Select Curated Public Image URL or Enter Custom
                </label>
                
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      type="button"
                      key={preset.url}
                      onClick={() => setImage(preset.url)}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer group transition-all ${
                        image === preset.url ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-[8px] text-white truncate text-center font-semibold">
                        {preset.name}
                      </div>
                    </button>
                  ))}
                </div>

                <input
                  id="form-item-img-url"
                  type="text"
                  placeholder="https://example.com/custom-gourmet-plate.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-slate-900 bg-slate-50/50 font-mono"
                />
              </div>

              {/* Action row bottom */}
              <div className="pt-4 border-t border-slate-100 flex gap-3 shrink-0">
                <button
                  type="button"
                  id="btn-cancel-editor"
                  onClick={resetForm}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel editing
                </button>
                <button
                  id="btn-save-item"
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{loading ? 'Writing to database...' : 'Publish Plate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Culinary list database grid */}
      <div id="admin-items-catalogue-list" className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
        {products.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            The culinary catalog database is currently empty.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-serif border-b border-slate-100">
                  <th className="p-4 font-semibold shrink-0">Dish Image</th>
                  <th className="p-4 font-semibold">Title Name</th>
                  <th className="p-4 font-semibold">Category Bracket</th>
                  <th className="p-4 font-semibold">Price Value</th>
                  <th className="p-4 font-semibold">Stock Availability</th>
                  <th className="p-4 font-semibold text-right">Database Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-900">
                {products.map((p) => (
                  <tr id={`catalog-row-${p.id}`} key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <img src={p.image} alt={p.name} className="h-10 w-14 roundedobject-cover bg-slate-200 rounded-lg shrink-0" />
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-950">{p.name}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 max-w-xs">{p.description}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-slate-100 font-bold border border-slate-150 rounded uppercase tracking-wider text-[9px] text-slate-600">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <button
                        id={`toggle-avail-row-${p.id}`}
                        onClick={() => toggleAvailabilityDirectly(p)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          p.availability
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-250'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {p.availability ? '● In Stock' : '○ Out of Stock'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-slate-500">
                        <button
                          id={`catalogue-edit-${p.id}`}
                          onClick={() => startEdit(p)}
                          className="p-1.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-600 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`catalogue-delete-${p.id}`}
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-lg border border-slate-200 hover:border-red-300 transition-colors cursor-pointer"
                          title="Delete from list"
                        >
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
