import React, { useState } from 'react';
import { createManualNewsArticle } from '../../utils/api.ts';
import { NewsArticle } from '../../types.ts';
import { X, Sparkles, Plus, Image, Link, FileText, Check } from 'lucide-react';

interface ManualArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticleCreated?: (newArt: NewsArticle) => void;
}

export function ManualArticleModal({
  isOpen,
  onClose,
  onArticleCreated,
}: ManualArticleModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    source_name: 'United States Mint Press Release',
    original_url: '',
    category: 'U.S. Mint',
    image_url: '',
    summary: '',
    is_breaking: false,
    is_featured: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.original_url || !formData.summary) {
      setError('Title, Original URL, and Summary are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createManualNewsArticle(formData);
      onArticleCreated?.(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import article');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#8f6d33] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#5a4420]/60 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#dfb86c]" />
            <h3 className="font-serif font-black text-base text-[#f7eedd]">
              Manual News Article Import
            </h3>
          </div>
          <button onClick={onClose} className="text-[#a89c8d] hover:text-[#f7eedd]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[#dfb86c] font-bold mb-1">Headline / Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
              placeholder="e.g. U.S. Mint Reveals 2026 Semiquincentennial Coin Designs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#dfb86c] font-bold mb-1">Publisher / Source Name</label>
              <input
                type="text"
                value={formData.source_name}
                onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
                placeholder="e.g. U.S. Mint, Heritage Auctions"
              />
            </div>

            <div>
              <label className="block text-[#dfb86c] font-bold mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
              >
                <option value="U.S. Mint">U.S. Mint</option>
                <option value="U.S. Coins">U.S. Coins</option>
                <option value="World">World</option>
                <option value="Errors">Errors</option>
                <option value="Varieties">Varieties</option>
                <option value="VAM">VAM</option>
                <option value="Auctions">Auctions</option>
                <option value="Grading">Grading</option>
                <option value="Research">Research</option>
                <option value="Paper Money">Paper Money</option>
                <option value="Market">Market</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#dfb86c] font-bold mb-1">Original Story URL *</label>
            <input
              type="url"
              required
              value={formData.original_url}
              onChange={(e) => setFormData({ ...formData, original_url: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
              placeholder="https://www.usmint.gov/news/press-releases/..."
            />
          </div>

          <div>
            <label className="block text-[#dfb86c] font-bold mb-1">Image URL (Optional)</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-[#dfb86c] font-bold mb-1">Short Factual Summary *</label>
            <textarea
              required
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
              placeholder="2-3 sentence factual summary. Do not copy full copyrighted articles."
            />
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#dfd4bf]">
              <input
                type="checkbox"
                checked={formData.is_breaking}
                onChange={(e) => setFormData({ ...formData, is_breaking: e.target.checked })}
                className="rounded"
              />
              <span>Breaking Alert</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-[#dfd4bf]">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded"
              />
              <span>Featured Story</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#5a4420]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#19110b] hover:bg-[#251a12] text-[#a89c8d] font-bold text-xs flex items-center justify-center text-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] font-black text-xs shadow-md disabled:opacity-50 flex items-center justify-center text-center cursor-pointer"
            >
              {isSubmitting ? 'Importing...' : 'Import Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
