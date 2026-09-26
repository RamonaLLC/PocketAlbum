import React, { useState, useEffect, useRef } from 'react';
import { BullionItem } from '../types.ts';
import { fetchBullion, addBullion, updateBullion, deleteBullion } from '../utils/api.ts';
import { fileToBase64 } from '../utils/photoPresets.ts';
import { Shield, Plus, Upload, Trash2, Edit3, X, Scale, Camera } from 'lucide-react';

interface BullionSectionProps {
  ownerId?: string;
  userId?: string;
  isReadOnly?: boolean;
  onCollectionUpdated?: () => void;
}

const MATERIALS = ['All', 'Gold', 'Silver', 'Platinum', 'Copper', 'Other'];

export const BullionSection: React.FC<BullionSectionProps> = ({
  ownerId,
  userId,
  isReadOnly = false,
  onCollectionUpdated
}) => {
  const effectiveOwnerId = ownerId || userId || '';
  const [bullionList, setBullionList] = useState<BullionItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BullionItem | null>(null);
  const [inspectingItem, setInspectingItem] = useState<BullionItem | null>(null);

  // Form inputs
  const [material, setMaterial] = useState<string>('Silver');
  const [label, setLabel] = useState<string>('');
  const [weightOz, setWeightOz] = useState<string>('1.0');
  const [fineness, setFineness] = useState<string>('.999 Fine');
  const [notes, setNotes] = useState<string>('');
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
      const data = await fetchBullion(effectiveOwnerId, selectedMaterial);
      setBullionList(data);
    } catch (err) {
      console.error('Failed to load bullion items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [effectiveOwnerId, selectedMaterial]);

  const openAddModal = () => {
    setEditingItem(null);
    setMaterial(selectedMaterial === 'All' ? 'Silver' : selectedMaterial);
    setLabel('');
    setWeightOz('1.0');
    setFineness('.999 Fine');
    setNotes('');
    setPhotos([]);
    setMainPhoto('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: BullionItem) => {
    setEditingItem(item);
    setMaterial(item.material);
    setLabel(item.label);
    setWeightOz(item.weight_oz || '');
    setFineness(item.fineness || '');
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
    if (!label.trim()) {
      setFormError('Label / Name is required');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const primaryPhoto = mainPhoto || (photos.length > 0 ? photos[0] : '');
      const payload = {
        owner_id: effectiveOwnerId,
        material,
        label: label.trim(),
        weight_oz: weightOz.trim() || undefined,
        fineness: fineness.trim() || undefined,
        notes: notes.trim() || undefined,
        main_photo: primaryPhoto,
        photos: photos.length > 0 ? photos : (primaryPhoto ? [primaryPhoto] : [])
      };

      if (editingItem) {
        const updated = await updateBullion(editingItem.id, payload);
        setBullionList(prev => prev.map(b => (b.id === updated.id ? updated : b)));
        if (inspectingItem?.id === updated.id) setInspectingItem(updated);
      } else {
        const created = await addBullion(payload);
        setBullionList(prev => [created, ...prev]);
      }

      onCollectionUpdated?.();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save bullion item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bullion item?')) return;
    try {
      await deleteBullion(id);
      setBullionList(prev => prev.filter(b => b.id !== id));
      if (inspectingItem?.id === id) setInspectingItem(null);
      onCollectionUpdated?.();
    } catch (err) {
      console.error('Failed to delete bullion:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Category Filter and Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-b from-[#241a13] via-[#1c140f] to-[#140e0a] border border-[#7a5c28]/45 p-5 sm:p-6 rounded-3xl shadow-xl shadow-black/70">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#f7eedd] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#dfb86c]" />
            Bullion & Precious Metal Bars
          </h2>
          <p className="text-xs text-[#a89c8d] mt-1">
            Organize and display your precious metal ingots, bars, and bullion rounds
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 text-xs font-serif font-bold text-[#140e08] bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] rounded-xl shadow-md border border-[#fae19c]/70 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Bullion / Bar
          </button>
        )}
      </div>

      {/* Material Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MATERIALS.map(mat => (
          <button
            key={mat}
            onClick={() => setSelectedMaterial(mat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
              selectedMaterial === mat
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] border-[#fae19c] shadow-sm'
                : 'bg-[#18120d] border-[#5a4420]/40 text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14]'
            }`}
          >
            {mat}
          </button>
        ))}
      </div>

      {/* Bullion Gallery / Rows */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#a89c8d]">Loading bullion vault inventory...</div>
      ) : bullionList.length === 0 ? (
        <div className="py-20 text-center bg-[#150f0b]/70 border border-[#5a4420]/40 rounded-3xl p-8">
          <Scale className="w-12 h-12 text-[#7a5c28] mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-[#f7eedd]">No Bullion Items Found</h3>
          <p className="text-xs text-[#a89c8d] max-w-sm mx-auto mt-1 mb-4">
            {selectedMaterial === 'All'
              ? "Your bullion vault is currently empty. Add your first gold, silver, or platinum bar to display here!"
              : `No ${selectedMaterial} items in this category yet.`}
          </p>
          {!isReadOnly && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-semibold text-[#dfb86c] bg-[#221812] hover:bg-[#2d2018] border border-[#7a5c28]/60 rounded-xl cursor-pointer"
            >
              Add Bullion Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {bullionList.map(item => (
            <div
              key={item.id}
              onClick={() => setInspectingItem(item)}
              className="group bg-gradient-to-b from-[#221812] to-[#17100b] border border-[#7a5c28]/40 hover:border-[#dfb86c]/70 rounded-2xl overflow-hidden shadow-lg shadow-black/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Photo Aspect Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                  <img
                    src={item.main_photo}
                    alt={item.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-[#120d09]/90 backdrop-blur-sm border border-[#7a5c28]/60 px-2 py-0.5 rounded text-[11px] font-serif font-bold text-[#dfb86c]">
                    {item.material}
                  </div>
                  {item.photos && item.photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-[#dfd4bf] text-[10px] font-medium px-2 py-0.5 rounded border border-[#5a4420]/50">
                      {item.photos.length} photos
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-serif font-bold text-[#f7eedd] group-hover:text-[#fae19c] transition-colors line-clamp-1">
                    {item.label}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-[#a89c8d]">
                    {item.weight_oz && (
                      <span className="font-semibold text-[#dfd4bf]">
                        {item.weight_oz} oz
                      </span>
                    )}
                    {item.fineness && (
                      <span>&bull; {item.fineness}</span>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-xs text-[#a89c8d] line-clamp-2 italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer */}
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

      {/* Add / Edit Bullion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/60 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-6">
            <div className="bg-gradient-to-r from-[#241a13] via-[#2d2119] to-[#241a13] border-b border-[#7a5c28]/40 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#dfb86c]" />
                {editingItem ? 'Edit Bullion Item' : 'Add Bullion / Ingot / Bar'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#a89c8d] hover:text-[#f7eedd] p-1.5 rounded-lg"
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
              {/* Material and Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                    Precious Metal
                  </label>
                  <select
                    value={material}
                    onChange={e => setMaterial(e.target.value)}
                    className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                  >
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Copper">Copper</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                    Weight (oz / grams)
                  </label>
                  <input
                    type="text"
                    value={weightOz}
                    onChange={e => setWeightOz(e.target.value)}
                    placeholder="e.g. 1.0 oz, 100g, 10 oz"
                    className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                  />
                </div>
              </div>

              {/* Label and Fineness */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                    Item Label / Brand
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="e.g. Engelhard Poured Bar, PAMP Suisse"
                    required
                    className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                    Purity / Fineness
                  </label>
                  <input
                    type="text"
                    value={fineness}
                    onChange={e => setFineness(e.target.value)}
                    placeholder="e.g. .999 Fine, .9999 Pure"
                    className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                  />
                </div>
              </div>

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
                  Personal Notes / Serial Number
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Serial #A38291, purchased from local coin shop..."
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
                  {isSaving ? 'Saving...' : (editingItem ? 'Save Changes' : 'Save Bullion')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Bullion Specimen Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/60 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="bg-[#19110b] border-b border-[#7a5c28]/40 px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-serif font-semibold text-[#dfb86c] uppercase">{inspectingItem.material}</span>
                <h3 className="text-lg font-serif font-bold text-[#f7eedd]">{inspectingItem.label}</h3>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="text-[#a89c8d] hover:text-[#f7eedd] p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#7a5c28]/40">
                <img
                  src={inspectingItem.main_photo}
                  alt={inspectingItem.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#150f0b]/80 p-4 rounded-xl border border-[#5a4420]/40 text-xs">
                <div>
                  <span className="text-[#a89c8d] block">Weight:</span>
                  <span className="text-sm font-bold text-[#f7eedd]">{inspectingItem.weight_oz || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#a89c8d] block">Fineness:</span>
                  <span className="text-sm font-bold text-[#dfb86c]">{inspectingItem.fineness || 'N/A'}</span>
                </div>
              </div>

              {inspectingItem.notes && (
                <div className="p-3 bg-[#150f0b]/80 rounded-xl border border-[#5a4420]/40 text-xs">
                  <span className="text-[#dfb86c] font-semibold block mb-1">Notes:</span>
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
