import React, { useState, useEffect, useRef } from 'react';
import { ColonialPatternItem } from '../types.ts';
import { fetchColonials, addColonial, updateColonial, deleteColonial } from '../utils/api.ts';
import { fileToBase64 } from '../utils/photoPresets.ts';
import { Compass, Plus, Upload, Trash2, Edit3, X, Award, Camera } from 'lucide-react';

interface ColonialsSectionProps {
  ownerId?: string;
  userId?: string;
  isReadOnly?: boolean;
  onCollectionUpdated?: () => void;
}

const CATEGORIES = ['Colonials', 'Territorial', 'Patterns'] as const;

const SUBCATEGORIES: Record<string, string[]> = {
  Colonials: [
    'All Colonials',
    'Post-1776 States Coinage',
    'Pre-1776 States Coinage',
    'Massachusetts Silver Coins',
    'Washington Pieces',
    'Pre-1776 Private and Regional Issues',
    'French Colonies',
    'Post-1776 Private and Regional Issues',
    'Proposed National Issues',
    'Libertas Americana Medals',
    'Colonial Restrikes and Fantasies',
    'Regulated Gold',
    'Counterstamped Coins'
  ],
  Territorial: [
    'All Territorial',
    'California Gold',
    'California Fractional Gold',
    'Bechtler',
    'Templeton Reid',
    'Oregon Gold',
    'Mormon Gold',
    'Colorado Gold',
    'Hawaii',
    'Confederate States of America',
    'Alaska Rural Rehabilitation Corp.',
    'Lesher Dollars'
  ],
  Patterns: [
    'All Patterns',
    'Patterns 1792-1859',
    'Patterns 1860-1865',
    'Patterns 1866-1869',
    'Patterns 1870',
    'Patterns 1871-1873',
    'Patterns 1874-1879',
    'Patterns 1880-1942',
    'Patterns 1943 to Date',
    'Die Trials Hub Trials and Splashers',
    'Privately-issued Patterns'
  ]
};

export const ColonialsSection: React.FC<ColonialsSectionProps> = ({
  ownerId,
  userId,
  isReadOnly = false,
  onCollectionUpdated
}) => {
  const effectiveOwnerId = ownerId || userId || '';
  const [activeCategory, setActiveCategory] = useState<'Colonials' | 'Territorial' | 'Patterns'>('Colonials');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All Colonials');
  const [items, setItems] = useState<ColonialPatternItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ColonialPatternItem | null>(null);
  const [inspectingItem, setInspectingItem] = useState<ColonialPatternItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [gradeType, setGradeType] = useState<'raw' | 'graded'>('graded');
  const [tpg, setTpg] = useState('PCGS');
  const [grade, setGrade] = useState('MS-62');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [mainPhoto, setMainPhoto] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!effectiveOwnerId) return;
    setLoading(true);
    try {
      const sub = activeSubcategory.startsWith('All') ? undefined : activeSubcategory;
      const data = await fetchColonials(effectiveOwnerId, activeCategory, sub);
      setItems(data);
    } catch (err) {
      console.error('Failed to load colonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset subcategory when main category changes
    setActiveSubcategory(`All ${activeCategory}`);
  }, [activeCategory]);

  useEffect(() => {
    loadData();
  }, [effectiveOwnerId, activeCategory, activeSubcategory]);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setYear('1787');
    const availableSubs = SUBCATEGORIES[activeCategory].filter(s => !s.startsWith('All'));
    setFormSubcategory(availableSubs[0] || activeCategory);
    setGradeType('graded');
    setTpg('PCGS');
    setGrade('MS-62');
    setNotes('');
    setPhotos([]);
    setMainPhoto('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ColonialPatternItem) => {
    setEditingItem(item);
    setName(item.name);
    setYear(item.year || '');
    setFormSubcategory(item.subcategory);
    setGradeType(item.grade_type);
    setTpg(item.tpg || 'PCGS');
    setGrade(item.grade || '');
    setNotes(item.notes || '');
    const currentPhotos = item.photos && item.photos.length > 0 ? item.photos : [item.main_photo];
    setPhotos(currentPhotos);
    setMainPhoto(item.main_photo);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const files = Array.from(e.target.files) as File[];
      const newUrls: string[] = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        newUrls.push(base64);
      }
      const updated = [...photos, ...newUrls];
      setPhotos(updated);
      if (!mainPhoto) setMainPhoto(newUrls[0]);
    } catch (err: any) {
      setFormError('Error loading photo: ' + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Name / Description is required');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const primaryPhoto = mainPhoto || (photos.length > 0 ? photos[0] : '');
      const payload = {
        owner_id: effectiveOwnerId,
        category: activeCategory,
        subcategory: formSubcategory,
        name: name.trim(),
        year: year.trim() || undefined,
        grade_type: gradeType,
        tpg: gradeType === 'graded' ? tpg : undefined,
        grade: gradeType === 'graded' ? grade.trim() : undefined,
        notes: notes.trim() || undefined,
        main_photo: primaryPhoto,
        photos: photos.length > 0 ? photos : (primaryPhoto ? [primaryPhoto] : [])
      };

      if (editingItem) {
        const updated = await updateColonial(editingItem.id, payload);
        setItems(prev => prev.map(item => (item.id === updated.id ? updated : item)));
        if (inspectingItem?.id === updated.id) setInspectingItem(updated);
      } else {
        const created = await addColonial(payload);
        setItems(prev => [created, ...prev]);
      }

      onCollectionUpdated?.();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this historical piece?')) return;
    try {
      await deleteColonial(id);
      setItems(prev => prev.filter(i => i.id !== id));
      if (inspectingItem?.id === id) setInspectingItem(null);
      onCollectionUpdated?.();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-b from-[#241a13] via-[#1c140f] to-[#140e0a] border border-[#7a5c28]/45 p-5 sm:p-6 rounded-3xl shadow-xl shadow-black/70">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#f7eedd] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#dfb86c]" />
            Colonials, Patterns & Territorial Coinage
          </h2>
          <p className="text-xs text-[#a89c8d] mt-1">
            Early American colonial issues, Territorial gold strikes, and official U.S. Mint trial patterns
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 text-xs font-serif font-bold text-[#140e08] bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] rounded-xl shadow-md border border-[#fae19c]/70 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add {activeCategory} Piece
          </button>
        )}
      </div>

      {/* Main Category Tabs */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-[#120d09] p-1.5 rounded-2xl border border-[#5a4420]/40">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-serif font-bold transition-all text-center cursor-pointer ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md border border-[#fae19c]/80'
                : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#1f150e]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Subcategory Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SUBCATEGORIES[activeCategory].map(sub => (
          <button
            key={sub}
            onClick={() => setActiveSubcategory(sub)}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-semibold whitespace-nowrap border transition-all cursor-pointer shrink-0 ${
              activeSubcategory === sub
                ? 'bg-[#dfb86c]/20 border-[#dfb86c] text-[#fae19c]'
                : 'bg-[#18120d] border-[#5a4420]/40 text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14]'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Items Gallery */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#a89c8d]">Loading historical registry...</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-[#150f0b]/70 border border-[#5a4420]/40 rounded-3xl p-8">
          <Compass className="w-12 h-12 text-[#7a5c28] mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-[#f7eedd]">No {activeCategory} Found</h3>
          <p className="text-xs text-[#a89c8d] max-w-sm mx-auto mt-1 mb-4">
            No pieces cataloged under {activeSubcategory}. Add your first colonial or pattern specimen!
          </p>
          {!isReadOnly && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-semibold text-[#dfb86c] bg-[#221812] hover:bg-[#2d2018] border border-[#7a5c28]/60 rounded-xl cursor-pointer"
            >
              Add {activeCategory} Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => setInspectingItem(item)}
              className="group bg-gradient-to-b from-[#221812] to-[#17100b] border border-[#7a5c28]/40 hover:border-[#dfb86c]/70 rounded-2xl overflow-hidden shadow-lg shadow-black/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square w-full overflow-hidden bg-black/60">
                  <img
                    src={item.main_photo}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-[#120d09]/90 backdrop-blur-sm border border-[#7a5c28]/60 px-2 py-0.5 rounded text-[10px] font-serif font-bold text-[#dfb86c]">
                    {item.subcategory}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-[#dfb86c]">{item.year || 'Undated'}</span>
                    {item.grade_type === 'graded' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-serif font-bold px-2 py-0.5 rounded bg-[#dfb86c]/15 text-[#fae19c] border border-[#dfb86c]/30">
                        <Award className="w-3 h-3" />
                        {item.tpg} {item.grade}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#18120d] text-[#a89c8d] border border-[#5a4420]/30">
                        Raw
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-serif font-bold text-[#f7eedd] group-hover:text-[#fae19c] transition-colors line-clamp-2">
                    {item.name}
                  </h3>

                  {item.notes && (
                    <p className="text-xs text-[#a89c8d] line-clamp-2 italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-[#120d09]/80 border-t border-[#5a4420]/30 flex items-center justify-between text-xs">
                <span className="text-[#dfb86c] font-serif font-medium group-hover:text-[#fae19c]">
                  Inspect Specimen
                </span>
                {!isReadOnly && (
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-[#a89c8d] hover:text-[#dfb86c] rounded hover:bg-[#251a13]"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-[#a89c8d] hover:text-rose-400 rounded hover:bg-[#251a13]"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/60 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-6">
            <div className="bg-gradient-to-r from-[#241a13] via-[#2d2119] to-[#241a13] border-b border-[#7a5c28]/40 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#dfb86c]" />
                {editingItem ? `Edit ${activeCategory} Item` : `Add ${activeCategory} Item`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#a89c8d] hover:text-[#f7eedd] p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-red-950/50 border border-red-800 rounded-xl text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Subcategory */}
              <div>
                <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                  Subcategory
                </label>
                <select
                  value={formSubcategory}
                  onChange={e => setFormSubcategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                >
                  {SUBCATEGORIES[activeCategory]
                    .filter(s => !s.startsWith('All'))
                    .map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                </select>
              </div>

              {/* Name and Year */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                    Piece Name / Description
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Connecticut Cent Mailed Bust Left"
                    required
                    className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    placeholder="e.g. 1787"
                    className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                  />
                </div>
              </div>

              {/* Condition: Raw vs Graded */}
              <div>
                <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">Condition</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGradeType('raw')}
                    className={`py-2 px-3 rounded-xl border text-xs font-serif font-semibold transition-all cursor-pointer ${
                      gradeType === 'raw'
                        ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] border-[#fae19c]'
                        : 'bg-[#140e0a] border-[#5a4420]/40 text-[#a89c8d]'
                    }`}
                  >
                    Raw
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradeType('graded')}
                    className={`py-2 px-3 rounded-xl border text-xs font-serif font-semibold transition-all cursor-pointer ${
                      gradeType === 'graded'
                        ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] border-[#fae19c]'
                        : 'bg-[#140e0a] border-[#5a4420]/40 text-[#a89c8d]'
                    }`}
                  >
                    Graded (Certified)
                  </button>
                </div>
              </div>

              {/* Graded Details */}
              {gradeType === 'graded' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#120d09] rounded-xl border border-[#5a4420]/40">
                  <div>
                    <label className="block text-xs text-[#a89c8d] mb-1">TPG Service</label>
                    <select
                      value={tpg}
                      onChange={e => setTpg(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#1a120c] border border-[#7a5c28]/50 rounded-lg text-xs text-[#f7eedd]"
                    >
                      <option value="PCGS">PCGS</option>
                      <option value="NGC">NGC</option>
                      <option value="ANACS">ANACS</option>
                      <option value="CAC">CAC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#a89c8d] mb-1">Grade</label>
                    <input
                      type="text"
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      placeholder="e.g. AU-55, MS-63"
                      className="w-full px-3 py-1.5 bg-[#1a120c] border border-[#7a5c28]/50 rounded-lg text-xs text-[#f7eedd]"
                    />
                  </div>
                </div>
              )}

              {/* Photos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-serif font-semibold text-[#f7eedd]">Photos ({photos.length})</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="text-xs text-[#dfb86c] hover:text-[#fae19c] font-semibold flex items-center gap-1 bg-[#281c14] border border-[#7a5c28]/60 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" /> Take Photo
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-[#f7eedd] hover:text-white font-semibold flex items-center gap-1 bg-[#281c14] border border-[#7a5c28]/60 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#dfb86c]" /> Upload Photo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 p-2.5 bg-[#120d09] border border-[#7a5c28]/40 rounded-xl min-h-[50px]">
                  {photos.length === 0 ? (
                    <div className="col-span-4 py-2 text-center text-xs text-[#a89c8d] italic">
                      No photos added yet
                    </div>
                  ) : (
                    photos.map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() => setMainPhoto(p)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${
                          p === mainPhoto ? 'border-[#dfb86c]' : 'border-[#5a4420]/60'
                        }`}
                      >
                        <img src={p} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        {p === mainPhoto && (
                          <span className="absolute top-1 left-1 bg-[#dfb86c] text-[#140e08] text-[9px] font-bold px-1 rounded">
                            Main
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                  Provenance / Notes
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Ex-Norweb collection, rich mahogany patina..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] focus:outline-none focus:border-[#dfb86c] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#5a4420]/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#a89c8d] hover:text-[#f7eedd] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-serif font-bold text-[#140e08] bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] rounded-xl shadow cursor-pointer border border-[#fae19c]/70"
                >
                  {isSaving ? 'Saving...' : (editingItem ? 'Save Changes' : 'Save Piece')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Specimen Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/60 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="bg-[#19110b] border-b border-[#7a5c28]/40 px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-serif font-semibold text-[#dfb86c] uppercase">{inspectingItem.category} &bull; {inspectingItem.subcategory}</span>
                <h3 className="text-lg font-serif font-bold text-[#f7eedd]">{inspectingItem.name}</h3>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="text-[#a89c8d] hover:text-[#f7eedd] p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="w-full aspect-square max-w-xs mx-auto rounded-full overflow-hidden bg-black border-2 border-[#7a5c28]/60 shadow-xl">
                <img
                  src={inspectingItem.main_photo}
                  alt={inspectingItem.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#150f0b]/80 p-4 rounded-xl border border-[#5a4420]/40 text-xs">
                <div>
                  <span className="text-[#a89c8d] block">Year:</span>
                  <span className="text-sm font-serif font-bold text-[#f7eedd]">{inspectingItem.year || 'Undated'}</span>
                </div>
                <div>
                  <span className="text-[#a89c8d] block">Condition:</span>
                  <span className="text-sm font-serif font-bold text-[#dfb86c]">
                    {inspectingItem.grade_type === 'graded' ? `${inspectingItem.tpg} ${inspectingItem.grade}` : 'Raw'}
                  </span>
                </div>
              </div>

              {inspectingItem.notes && (
                <div className="p-3 bg-[#150f0b]/80 rounded-xl border border-[#5a4420]/40 text-xs">
                  <span className="text-[#dfb86c] font-semibold block mb-1">Notes & Provenance:</span>
                  <p className="text-[#dfd4bf] italic">"{inspectingItem.notes}"</p>
                </div>
              )}
            </div>

            <div className="bg-[#19110b] px-6 py-3 border-t border-[#7a5c28]/40 flex items-center justify-between">
              <button
                onClick={() => setInspectingItem(null)}
                className="text-xs text-[#a89c8d] hover:text-[#f7eedd] cursor-pointer"
              >
                Close
              </button>
              {!isReadOnly && (
                <button
                  onClick={() => {
                    const item = inspectingItem;
                    setInspectingItem(null);
                    openEditModal(item);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-[#140e08] bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] border border-[#fae19c]/70 rounded-lg cursor-pointer"
                >
                  Edit Item
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
