import React from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newProduct: any;
  setNewProduct: (product: any) => void;
  currencySymbol: string;
  isSaving: boolean;
}

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  newProduct,
  setNewProduct,
  currencySymbol,
  isSaving
}: ProductModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-zinc-800 p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Add New Product</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Product Name</label>
            <input type="text" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="e.g. Enterprise License" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Selling Price ({currencySymbol})</label>
              <input type="number" required value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Market Price ({currencySymbol})</label>
              <input type="number" required value={newProduct.marketPrice} onChange={e => setNewProduct({ ...newProduct, marketPrice: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Stock / Units</label>
              <input type="number" required value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="100" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Market Share (%)</label>
              <input type="number" required value={newProduct.marketShare} onChange={e => setNewProduct({ ...newProduct, marketShare: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="e.g. 45" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Category</label>
            <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm appearance-none">
              <option value="Software">Software License</option>
              <option value="Hardware">Hardware / Equipment</option>
              <option value="Service">Consulting Service</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="trending" checked={newProduct.isTrending} onChange={e => setNewProduct({ ...newProduct, isTrending: e.target.checked })} className="rounded bg-zinc-800 border-zinc-700" />
            <label htmlFor="trending" className="text-sm text-zinc-400 cursor-pointer">Mark as Trending Fire 🔥</label>
          </div>
          <button type="submit" disabled={isSaving} className="w-full bg-white text-black py-3 rounded-lg font-medium mt-6 hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'List Product'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
