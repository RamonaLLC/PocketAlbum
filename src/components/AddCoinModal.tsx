import React, { useState, useEffect, useRef } from 'react';
import { CoinIssue, CoinSeries, Denomination, CoinVariety, CollectionItem } from '../types.ts';
import { fetchVarietiesForIssue, addCoinItem, updateCoinItem } from '../utils/api.ts';
import { fileToBase64 } from '../utils/photoPresets.ts';
import { X, Upload, Camera, Check, Award, Trash2, Plus, Sparkles } from 'lucide-react';

interface AddCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  denomination: Denomination;
  series: CoinSeries;
  issue: CoinIssue;
  ownerId: string;
  onCoinSaved: (savedCoin: CollectionItem) => void;
  editingCoin?: CollectionItem | null;
}

export const AddCoinModal: React.FC<AddCoinModalProps> = ({
  isOpen,
  onClose,
  denomination,
  series,
  issue,
  ownerId,
  onCoinSaved,
  editingCoin,
}) => {
  const [conditionType, setConditionType] = useState<'raw' | 'graded'>('graded');
  const [tpg, setTpg] = useState<string>('PCGS');
  const [grade, setGrade] = useState<string>('MS-64');
  const [certNumber, setCertNumber] = useState<string>('');
  const [varietyName, setVarietyName] = useState<string>('Normal Strike');
  const [customVariety, setCustomVariety] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [mainPhoto, setMainPhoto] = useState<string>('');
  const [varieties, setVarieties] = useState<CoinVariety[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form state
  useEffect(() => {
    if (!isOpen) return;

    setError(null);

    // Fetch varieties for this issue
    fetchVarietiesForIssue(issue.id)
      .then(list => setVarieties(list))
      .catch(() => setVarieties([{ id: 'v_norm', issue_id: issue.id, name: 'Normal Strike', variety_type: 'Standard', display_order: 1, active: 1 }]));

    if (editingCoin) {
      setConditionType(editingCoin.condition_type);
      setTpg(editingCoin.tpg || 'PCGS');
      setGrade(editingCoin.grade || '');
      setCertNumber(editingCoin.certification_number || '');
      setVarietyName(editingCoin.variety_name || 'Normal Strike');
      setNotes(editingCoin.notes || '');
      const existingPhotos = editingCoin.photos && editingCoin.photos.length > 0
        ? editingCoin.photos.map(p => p.photo_url)
        : (editingCoin.main_photo ? [editingCoin.main_photo] : []);
      setPhotos(existingPhotos);
      setMainPhoto(editingCoin.main_photo || (existingPhotos.length > 0 ? existingPhotos[0] : ''));
    } else {
      setConditionType('graded');
      setTpg('PCGS');
      setGrade('MS-64');
      setCertNumber('');
      setVarietyName('Normal Strike');
      setCustomVariety('');
      setNotes('');
      setPhotos([]);
      setMainPhoto('');
    }
  }, [isOpen, issue.id, editingCoin, series.name, denomination.name]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const files = Array.from(e.target.files) as File[];
      const newUrls: string[] = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        newUrls.push(base64);
      }
      const updatedPhotos = [...photos, ...newUrls];
      setPhotos(updatedPhotos);
      if (!mainPhoto || photos.length === 0) {
        setMainPhoto(newUrls[0]);
      }
    } catch (err: any) {
      setError('Error loading image files: ' + err.message);
    }
  };

  const handleRemovePhoto = (urlToRemove: string) => {
    const updated = photos.filter(p => p !== urlToRemove);
    setPhotos(updated);
    if (mainPhoto === urlToRemove) {
      setMainPhoto(updated.length > 0 ? updated[0] : '');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const resolvedVariety = varietyName === 'Custom' ? (customVariety.trim() || 'Custom Variety') : varietyName;
      const primaryPhoto = mainPhoto || (photos.length > 0 ? photos[0] : '');

      const coinPayload = {
        owner_id: ownerId,
        issue_id: issue.id,
        variety_name: resolvedVariety,
        condition_type: conditionType,
        tpg: conditionType === 'graded' ? tpg : undefined,
        grade: conditionType === 'graded' ? grade.trim() : undefined,
        certification_number: conditionType === 'graded' ? certNumber.trim() : undefined,
        main_photo: primaryPhoto,
        notes: notes.trim(),
        photos: photos.length > 0 ? photos : (primaryPhoto ? [primaryPhoto] : [])
      };

      let saved: CollectionItem;
      if (editingCoin) {
        saved = await updateCoinItem(editingCoin.id, coinPayload);
      } else {
        saved = await addCoinItem(coinPayload);
      }

      onCoinSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save coin');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#241a13] via-[#1c140f] to-[#140e0a] border-2 border-[#8f6d33]/60 rounded-3xl max-w-2xl w-full shadow-2xl shadow-black overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Vintage Numismatic Header */}
        <div className="bg-gradient-to-r from-[#1c140e] via-[#2c1f16] to-[#1c140e] border-b border-[#8f6d33]/40 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#dfb86c]">
              <span>{denomination.name}</span>
              <span>&bull;</span>
              <span>{series.name}</span>
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#f7eedd] flex items-center gap-2 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#cba153]" />
              {editingCoin ? `Edit ${issue.issue_name}` : `Add Coin: ${issue.issue_name}`}
            </h2>
            <p className="text-xs text-[#a89c8d] mt-0.5">
              Mint: <span className="font-semibold text-[#f7eedd]">{issue.mint || 'Philadelphia (No Mintmark)'}</span> &bull; Year: <span className="font-semibold text-[#f7eedd]">{issue.year}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#a89c8d] hover:text-[#f7eedd] p-2 rounded-xl hover:bg-[#2c2017] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Photos Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-[#f7eedd]">
                Coin Photos ({photos.length})
              </label>
              
              {/* Only Allow: Take Photo & Choose from Gallery / Upload Photo */}
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#f7eedd] bg-gradient-to-b from-[#2d2119] to-[#1e1510] hover:from-[#38291f] hover:to-[#261b14] border border-[#8f6d33]/70 hover:border-[#dfb86c] rounded-xl shadow-md transition-all"
                >
                  <Camera className="w-3.5 h-3.5 text-[#dfb86c]" />
                  Take Photo
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#f7eedd] bg-gradient-to-b from-[#2d2119] to-[#1e1510] hover:from-[#38291f] hover:to-[#261b14] border border-[#8f6d33]/70 hover:border-[#dfb86c] rounded-xl shadow-md transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-[#dfb86c]" />
                  Choose from Gallery / Upload Photo
                </button>
              </div>
            </div>

            {/* Current Photos Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 p-3.5 bg-[#140e0a] border border-[#7a5c28]/40 rounded-2xl">
              {photos.map((photoUrl, idx) => {
                const isMain = photoUrl === mainPhoto;
                return (
                  <div
                    key={idx}
                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      isMain ? 'border-[#dfb86c] shadow-md shadow-[#cba153]/25' : 'border-[#5a4420]/60 hover:border-[#8f6d33]'
                    }`}
                    onClick={() => setMainPhoto(photoUrl)}
                  >
                    <img
                      src={photoUrl}
                      alt={`Photo ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />

                    {/* Main Badge */}
                    {isMain && (
                      <div className="absolute top-1 left-1 bg-[#dfb86c] text-[#140e08] text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> Main
                      </div>
                    )}

                    {/* Hover controls */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                      {!isMain && (
                        <span className="text-[10px] font-semibold text-[#dfb86c] hover:underline">
                          Set Main
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(photoUrl);
                        }}
                        className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-[#2c1a1a]"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add more button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border border-dashed border-[#7a5c28]/70 hover:border-[#dfb86c] bg-[#1c140e]/60 hover:bg-[#261c15] flex flex-col items-center justify-center gap-1 text-[#a89c8d] hover:text-[#dfb86c] transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="text-[10px] font-medium">Add Photo</span>
              </button>
            </div>
            <p className="text-[11px] text-[#a89c8d] mt-1.5">
              The <strong className="text-[#dfb86c]">Main Photo</strong> displays in the album slot. Add obverse, reverse, or slab photos for the collector ledger.
            </p>
          </div>

          {/* Condition: Raw vs Graded */}
          <div>
            <label className="block text-sm font-semibold text-[#f7eedd] mb-2">
              Coin Condition
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConditionType('raw')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  conditionType === 'raw'
                    ? 'bg-[#2a1e15] border-[#dfb86c] text-[#fae19c] shadow-sm'
                    : 'bg-[#1a130e] border-[#5a4420]/60 text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14]'
                }`}
              >
                Raw (Uncertified)
              </button>
              <button
                type="button"
                onClick={() => setConditionType('graded')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  conditionType === 'graded'
                    ? 'bg-[#2a1e15] border-[#dfb86c] text-[#fae19c] shadow-sm'
                    : 'bg-[#1a130e] border-[#5a4420]/60 text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14]'
                }`}
              >
                <Award className="w-4 h-4 text-[#dfb86c]" />
                Graded (Certified Slab)
              </button>
            </div>
          </div>

          {/* Graded Form Fields */}
          {conditionType === 'graded' && (
            <div className="p-4 bg-[#16100c] border border-[#7a5c28]/40 rounded-2xl space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* TPG Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-[#d8cdb9] mb-1">
                    TPG (Grading Service)
                  </label>
                  <select
                    value={tpg}
                    onChange={(e) => setTpg(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1c140e] border border-[#6b4f23]/70 rounded-xl text-sm text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                  >
                    <option value="PCGS">PCGS</option>
                    <option value="NGC">NGC</option>
                    <option value="ANACS">ANACS</option>
                    <option value="CAC">CAC</option>
                    <option value="ICG">ICG</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Grade Input */}
                <div>
                  <label className="block text-xs font-semibold text-[#d8cdb9] mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g. MS-64, AU-58, VF-30"
                    className="w-full px-3 py-2 bg-[#1c140e] border border-[#6b4f23]/70 rounded-xl text-sm text-[#f7eedd] placeholder-[#736858] focus:outline-none focus:border-[#dfb86c]"
                  />
                </div>

                {/* Certification Number */}
                <div>
                  <label className="block text-xs font-semibold text-[#d8cdb9] mb-1">
                    Cert Number
                  </label>
                  <input
                    type="text"
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    placeholder="e.g. 38947102"
                    className="w-full px-3 py-2 bg-[#1c140e] border border-[#6b4f23]/70 rounded-xl text-sm text-[#f7eedd] placeholder-[#736858] focus:outline-none focus:border-[#dfb86c]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Variety Selection */}
          <div>
            <label className="block text-sm font-semibold text-[#f7eedd] mb-1.5">
              Variety
            </label>
            <div className="space-y-2">
              <select
                value={varietyName}
                onChange={(e) => setVarietyName(e.target.value)}
                className="w-full px-3 py-2 bg-[#1c140e] border border-[#6b4f23]/70 rounded-xl text-sm text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
              >
                <option value="Normal Strike">Normal Strike</option>
                {varieties
                  .filter(v => v.name !== 'Normal Strike')
                  .map(v => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                <option value="Custom">+ Custom Variety...</option>
              </select>

              {varietyName === 'Custom' && (
                <input
                  type="text"
                  value={customVariety}
                  onChange={(e) => setCustomVariety(e.target.value)}
                  placeholder="Enter custom variety name (e.g. DDO FS-103, Repunched Mintmark)"
                  className="w-full px-3 py-2 bg-[#1c140e] border border-[#cba153] rounded-xl text-sm text-[#f7eedd] placeholder-[#736858] focus:outline-none focus:border-[#dfb86c]"
                  autoFocus
                />
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-[#f7eedd] mb-1">
              Collector Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Purchased at FUN show, vibrant original mint bloom, CAC sticker..."
              rows={2}
              className="w-full px-3 py-2 bg-[#1c140e] border border-[#6b4f23]/70 rounded-xl text-sm text-[#f7eedd] placeholder-[#736858] focus:outline-none focus:border-[#dfb86c] resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#8f6d33]/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#261b14] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold text-[#140e08] bg-gradient-to-b from-[#d4af37] via-[#cba153] to-[#aa8030] hover:from-[#e2bf4f] hover:to-[#be9238] rounded-xl shadow-lg shadow-[#cba153]/25 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : (editingCoin ? 'Save Changes' : 'Save Coin to Album')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
