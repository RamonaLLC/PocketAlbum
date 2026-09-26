import React, { useState, useEffect, useRef } from 'react';
import {
  X, Plus, Search, Check, Camera, Upload,
  Award, Coins, ChevronRight, Layers, ArrowLeft, Loader2, AlertCircle
} from 'lucide-react';
import {
  Denomination, CoinSeries, CoinIssue, CoinVariety, CollectionItem, User
} from '../types.ts';
import {
  searchCoinIssues, fetchDenominations, fetchSeriesByDenomination,
  fetchIssuesForSeries, fetchVarietiesForIssue, addCoinItem
} from '../utils/api.ts';
import { fileToBase64 } from '../utils/photoPresets.ts';

interface QuickAddCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
  ownerId?: string;
  onCoinAdded?: () => void;
  onCoinSaved?: (savedCoin: CollectionItem) => void;
}

const COMMON_GRADES = [
  'MS-70', 'MS-69', 'MS-68', 'MS-67', 'MS-66', 'MS-65', 'MS-64', 'MS-63', 'MS-62', 'MS-61', 'MS-60',
  'AU-58', 'AU-55', 'AU-53', 'AU-50',
  'XF-45', 'XF-40', 'VF-35', 'VF-30', 'VF-25', 'VF-20',
  'F-15', 'F-12', 'VG-10', 'VG-8', 'G-6', 'G-4', 'AG-3', 'FR-2', 'PO-1',
  'PR-70', 'PR-69', 'PR-68', 'PR-67', 'PR-66', 'PR-65', 'PR-64',
  'UNC Details', 'AU Details', 'XF Details', 'VF Details', 'Cleaned', 'Repaired'
];

export const QuickAddCoinModal: React.FC<QuickAddCoinModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  ownerId,
  onCoinAdded,
  onCoinSaved,
}) => {
  const effectiveOwnerId = ownerId || currentUser?.id || '';
  // Step: 'select' (search/browse issue) | 'details' (enter condition, grade, cert, photos)
  const [step, setStep] = useState<'select' | 'details'>('select');

  // Search & Browse state
  const [mode, setMode] = useState<'search' | 'browse'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Browse state
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [selectedDenom, setSelectedDenom] = useState<Denomination | null>(null);
  const [seriesList, setSeriesList] = useState<CoinSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<CoinSeries | null>(null);
  const [issuesList, setIssuesList] = useState<CoinIssue[]>([]);
  const [isLoadingBrowse, setIsLoadingBrowse] = useState(false);

  // Selected coin issue for creation
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  // Coin form attributes
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

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load initial search and denominations
  useEffect(() => {
    if (!isOpen) return;

    // Reset modal state
    setStep('select');
    setSearchQuery('');
    setSelectedIssue(null);
    setPhotos([]);
    setMainPhoto('');
    setNotes('');
    setCertNumber('');
    setFeedback(null);
    setError(null);
    setConditionType('graded');
    setTpg('PCGS');
    setGrade('MS-64');

    // Run initial search for popular issues
    runSearch('');

    // Fetch denominations for browse mode
    fetchDenominations()
      .then(d => {
        setDenominations(d);
        if (d.length > 0) setSelectedDenom(d[0]);
      })
      .catch(err => console.error('Failed to load denominations:', err));
  }, [isOpen]);

  // Load series when selectedDenom changes in browse mode
  useEffect(() => {
    if (!selectedDenom) return;
    setIsLoadingBrowse(true);
    fetchSeriesByDenomination(selectedDenom.id)
      .then(s => {
        setSeriesList(s);
        if (s.length > 0) {
          setSelectedSeries(s[0]);
        } else {
          setSelectedSeries(null);
          setIssuesList([]);
        }
      })
      .catch(err => console.error('Failed to load series:', err))
      .finally(() => setIsLoadingBrowse(false));
  }, [selectedDenom?.id]);

  // Load issues when selectedSeries changes in browse mode
  useEffect(() => {
    if (!selectedSeries) return;
    setIsLoadingBrowse(true);
    fetchIssuesForSeries(selectedSeries.id)
      .then(iss => setIssuesList(iss))
      .catch(err => console.error('Failed to load issues:', err))
      .finally(() => setIsLoadingBrowse(false));
  }, [selectedSeries?.id]);

  // Search logic
  const runSearch = async (q: string) => {
    setIsSearching(true);
    try {
      const results = await searchCoinIssues(q);
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search issues:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced live search
  useEffect(() => {
    if (mode !== 'search') return;
    const timer = setTimeout(() => {
      runSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  // Handle selecting an issue to advance to form
  const handleSelectIssue = async (issueItem: any) => {
    setSelectedIssue(issueItem);
    setStep('details');

    // Fetch varieties for this issue
    try {
      const vList = await fetchVarietiesForIssue(issueItem.id);
      setVarieties(vList);
      if (vList.length > 0) {
        setVarietyName(vList[0].name);
      } else {
        setVarietyName('Normal Strike');
      }
    } catch (_err) {
      setVarieties([
        { id: 'v_norm', issue_id: issueItem.id, name: 'Normal Strike', variety_type: 'Standard', display_order: 1, active: 1 }
      ]);
      setVarietyName('Normal Strike');
    }
  };

  // Handle file photo uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newPhotos: string[] = [...photos];
      for (let i = 0; i < files.length; i++) {
        const base64 = await fileToBase64(files[i]);
        newPhotos.push(base64);
      }
      setPhotos(newPhotos);
      if (!mainPhoto && newPhotos.length > 0) {
        setMainPhoto(newPhotos[0]);
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setError('Could not process uploaded image.');
    }
  };

  // Submit coin entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    const chosenVariety = customVariety.trim() ? customVariety.trim() : varietyName;

    try {
      const saved = await addCoinItem({
        owner_id: effectiveOwnerId,
        issue_id: selectedIssue.id,
        variety_id: varieties.find(v => v.name === chosenVariety)?.id || undefined,
        condition_type: conditionType,
        tpg: conditionType === 'graded' ? tpg : undefined,
        grade: conditionType === 'graded' ? grade : undefined,
        certification_number: conditionType === 'graded' && certNumber ? certNumber.trim() : undefined,
        notes: notes.trim() || undefined,
        photos,
        main_photo: mainPhoto || photos[0] || undefined,
      });

      setFeedback(`Successfully added ${selectedIssue.issue_name || selectedIssue.year} to your collection!`);
      onCoinSaved?.(saved);
      onCoinAdded?.();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to add coin to collection');
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#7a5c28]/40 bg-[#19110b] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#dfb86c] to-[#b88c3a] text-[#140e08] flex items-center justify-center shadow-md shadow-[#dfb86c]/20 font-black">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                Quick Add Coin Entry
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#dfb86c]/20 text-[#fae19c] border border-[#dfb86c]/40 px-2 py-0.5 rounded-full">
                  Fast Registry
                </span>
              </h3>
              <p className="text-xs text-[#a89c8d]">
                Add coins directly to your collection without navigating albums
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#251a13] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-[#140e0a] border-b border-[#5a4420]/40 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 'select' ? 'bg-[#dfb86c] text-[#140e08]' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              1
            </span>
            <span className={`font-serif font-semibold ${step === 'select' ? 'text-[#dfb86c]' : 'text-[#a89c8d]'}`}>
              Select Coin Issue
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#5a4420]" />
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 'details' ? 'bg-[#dfb86c] text-[#140e08]' : 'bg-[#251a13] text-[#a89c8d]'
            }`}>
              2
            </span>
            <span className={`font-serif font-semibold ${step === 'details' ? 'text-[#dfb86c]' : 'text-[#a89c8d]'}`}>
              Condition, Grade & Photos
            </span>
          </div>

          {step === 'details' && (
            <button
              onClick={() => setStep('select')}
              className="text-[#dfb86c] hover:text-[#fae19c] text-xs font-serif font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Search
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {feedback && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn font-serif">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl text-xs text-rose-200 flex items-center gap-2 font-serif">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: SELECT COIN ISSUE ================= */}
          {step === 'select' && (
            <div className="space-y-4">
              {/* Toggle Search vs Browse */}
              <div className="flex items-center gap-2 p-1 bg-[#140e0a] rounded-2xl border border-[#5a4420]/40 w-fit">
                <button
                  type="button"
                  onClick={() => setMode('search')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    mode === 'search'
                      ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow'
                      : 'text-[#a89c8d] hover:text-[#f7eedd]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Instant Search
                </button>
                <button
                  type="button"
                  onClick={() => setMode('browse')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    mode === 'browse'
                      ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow'
                      : 'text-[#a89c8d] hover:text-[#f7eedd]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Browse Denominations
                </button>
              </div>

              {/* SEARCH MODE */}
              {mode === 'search' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#a89c8d] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Type year or coin name (e.g., 1909-S VDB, 1921 Morgan, Buffalo, Walking Liberty)..."
                      className="w-full pl-10 pr-4 py-3 bg-[#140e0a] border border-[#5a4420]/60 rounded-2xl text-xs sm:text-sm text-[#f7eedd] placeholder-[#a89c8d]/60 focus:outline-none focus:border-[#dfb86c] shadow-inner"
                      autoFocus
                    />
                    {isSearching && (
                      <Loader2 className="w-4 h-4 text-[#dfb86c] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {/* Results List */}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {searchResults.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#a89c8d] bg-[#140e0a]/50 rounded-2xl border border-[#5a4420]/40 font-serif">
                        {isSearching ? 'Searching coin registry...' : 'No matching coin issues found. Try typing a year like "1921" or "1909".'}
                      </div>
                    ) : (
                      searchResults.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectIssue(item)}
                          className="w-full text-left p-3 rounded-2xl bg-[#140e0a] hover:bg-[#251a13] border border-[#5a4420]/40 hover:border-[#dfb86c]/70 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#241a13] border border-[#7a5c28]/60 flex items-center justify-center text-xs font-black text-[#dfb86c] shrink-0 group-hover:scale-105 group-hover:border-[#dfb86c] transition-all">
                              {item.icon_label || '$'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-serif font-bold text-[#f7eedd] group-hover:text-[#fae19c] truncate">
                                  {item.issue_name || `${item.year}${item.mint ? `-${item.mint}` : ''}`}
                                </span>
                                {item.proof === 1 && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-serif font-bold bg-[#dfb86c]/20 text-[#fae19c] border border-[#dfb86c]/30">
                                    Proof
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#a89c8d] truncate mt-0.5">
                                {item.series_name} &bull; {item.denomination_name}
                                {item.mintage ? ` &bull; Mintage: ${Number(item.mintage).toLocaleString()}` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-serif font-bold text-[#dfb86c] opacity-80 group-hover:opacity-100 shrink-0 pl-2">
                            <span>Select</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* BROWSE MODE */}
              {mode === 'browse' && (
                <div className="space-y-4">
                  {/* Denominations horizontal selector */}
                  <div>
                    <span className="text-[10px] font-serif font-bold text-[#a89c8d] uppercase tracking-wider block mb-1.5">
                      1. Denomination
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {denominations.map(d => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDenom(d)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold border transition-all cursor-pointer ${
                            selectedDenom?.id === d.id
                              ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] border-[#fae19c] shadow'
                              : 'bg-[#140e0a] border-[#5a4420]/40 text-[#a89c8d] hover:text-[#f7eedd]'
                          }`}
                        >
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Series selector */}
                  {selectedDenom && (
                    <div>
                      <span className="text-[10px] font-serif font-bold text-[#a89c8d] uppercase tracking-wider block mb-1.5">
                        2. Series ({seriesList.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                        {seriesList.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSeries(s)}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                              selectedSeries?.id === s.id
                                ? 'bg-[#dfb86c]/20 border-[#dfb86c] text-[#fae19c] shadow'
                                : 'bg-[#140e0a] border-[#5a4420]/40 text-[#a89c8d] hover:text-[#f7eedd]'
                            }`}
                          >
                            <div className="text-xs font-serif font-bold truncate text-[#f7eedd]">{s.name}</div>
                            <div className="text-[10px] text-[#dfb86c]/90">{s.start_year}–{s.end_year > 2024 ? 'Present' : s.end_year}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues List */}
                  {selectedSeries && (
                    <div>
                      <span className="text-[10px] font-serif font-bold text-[#a89c8d] uppercase tracking-wider block mb-1.5">
                        3. Issue / Date ({issuesList.length} issues)
                      </span>
                      {isLoadingBrowse ? (
                        <div className="py-8 text-center text-xs text-[#a89c8d] flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#dfb86c]" />
                          Loading issues...
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                          {issuesList.map(iss => (
                            <button
                              key={iss.id}
                              onClick={() => handleSelectIssue({
                                ...iss,
                                series_name: selectedSeries.name,
                                denomination_name: selectedDenom?.name,
                                denomination_id: selectedDenom?.id
                              })}
                              className="p-2 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 hover:border-[#dfb86c] text-left hover:bg-[#251a13] transition-all group cursor-pointer shadow-sm"
                            >
                              <div className="text-xs font-serif font-bold text-[#f7eedd] group-hover:text-[#fae19c]">
                                {iss.issue_name || `${iss.year}${iss.mint ? `-${iss.mint}` : ''}`}
                              </div>
                              <div className="text-[10px] text-[#a89c8d]">
                                {iss.mintage ? `${(iss.mintage / 1000000).toFixed(1)}M` : 'Standard'}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: COIN DETAILS FORM ================= */}
          {step === 'details' && selectedIssue && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected Coin Header Card */}
              <div className="p-3.5 rounded-2xl bg-[#140e0a] border border-[#7a5c28]/50 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#dfb86c]/20 text-[#dfb86c] border border-[#dfb86c]/40 flex items-center justify-center font-black text-sm">
                    {selectedIssue.icon_label || '🪙'}
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-bold text-[#f7eedd]">
                      {selectedIssue.issue_name || `${selectedIssue.year}${selectedIssue.mint ? `-${selectedIssue.mint}` : ''}`}
                    </h4>
                    <p className="text-xs text-[#a89c8d]">
                      {selectedIssue.series_name} &bull; {selectedIssue.denomination_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-2.5 py-1 rounded-lg bg-[#241a13] hover:bg-[#322319] border border-[#5a4420]/50 text-[#dfd4bf] text-[11px] font-serif font-semibold transition-colors cursor-pointer"
                >
                  Change Coin
                </button>
              </div>

              {/* Condition Mode Selector: Graded vs Raw */}
              <div>
                <label className="block text-xs font-serif font-semibold text-[#f7eedd] mb-1.5">
                  Certification Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConditionType('graded')}
                    className={`p-3 rounded-xl border text-xs font-serif font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      conditionType === 'graded'
                        ? 'bg-[#dfb86c]/20 border-[#dfb86c] text-[#fae19c] shadow'
                        : 'bg-[#140e0a] border-[#5a4420]/40 text-[#a89c8d] hover:text-[#f7eedd]'
                    }`}
                  >
                    <Award className="w-4 h-4 text-[#dfb86c]" />
                    Certified Graded (Slabbed)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConditionType('raw')}
                    className={`p-3 rounded-xl border text-xs font-serif font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      conditionType === 'raw'
                        ? 'bg-[#dfb86c]/20 border-[#dfb86c] text-[#fae19c] shadow'
                        : 'bg-[#140e0a] border-[#5a4420]/40 text-[#a89c8d] hover:text-[#f7eedd]'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-[#dfb86c]" />
                    Raw / Uncertified Coin
                  </button>
                </div>
              </div>

              {/* Graded Details */}
              {conditionType === 'graded' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#140e0a] rounded-2xl border border-[#5a4420]/40">
                  <div>
                    <label className="block text-xs font-serif font-semibold text-[#a89c8d] mb-1">
                      TPG Service
                    </label>
                    <select
                      value={tpg}
                      onChange={e => setTpg(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1d1510] border border-[#5a4420]/60 rounded-xl text-xs text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                    >
                      <option value="PCGS">PCGS</option>
                      <option value="NGC">NGC</option>
                      <option value="ANACS">ANACS</option>
                      <option value="ICG">ICG</option>
                      <option value="CAC">CAC Slab</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-semibold text-[#a89c8d] mb-1">
                      Certified Grade
                    </label>
                    <select
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1d1510] border border-[#5a4420]/60 rounded-xl text-xs text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                    >
                      {COMMON_GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-semibold text-[#a89c8d] mb-1">
                      Certification #
                    </label>
                    <input
                      type="text"
                      value={certNumber}
                      onChange={e => setCertNumber(e.target.value)}
                      placeholder="e.g. 48291048"
                      className="w-full px-3 py-2 bg-[#1d1510] border border-[#5a4420]/60 rounded-xl text-xs text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                    />
                  </div>
                </div>
              )}

              {/* Raw Coin Estimated Grade */}
              {conditionType === 'raw' && (
                <div className="p-3 bg-[#140e0a] rounded-2xl border border-[#5a4420]/40">
                  <label className="block text-xs font-serif font-semibold text-[#a89c8d] mb-1">
                    Estimated / Binder Grade
                  </label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="w-full sm:w-1/2 px-3 py-2 bg-[#1d1510] border border-[#5a4420]/60 rounded-xl text-xs text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                  >
                    <option value="Raw Uncirculated">Raw Uncirculated (BU)</option>
                    <option value="Raw About Uncirculated">Raw AU (About Uncirculated)</option>
                    <option value="Raw Extra Fine">Raw XF (Extra Fine)</option>
                    <option value="Raw Very Fine">Raw VF (Very Fine)</option>
                    <option value="Raw Fine">Raw Fine (F)</option>
                    <option value="Raw Very Good">Raw VG (Very Good)</option>
                    <option value="Raw Good">Raw Good (G)</option>
                    <option value="Raw Details / Cull">Raw Details / Filler</option>
                  </select>
                </div>
              )}

              {/* Varieties */}
              {varieties.length > 1 && (
                <div>
                  <label className="block text-xs font-serif font-semibold text-[#a89c8d] mb-1">
                    Variety
                  </label>
                  <select
                    value={varietyName}
                    onChange={e => setVarietyName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#140e0a] border border-[#5a4420]/60 rounded-xl text-xs text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                  >
                    {varieties.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Photos Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-serif font-semibold text-[#f7eedd]">
                    Coin Photos ({photos.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-2.5 py-1 bg-[#241a13] hover:bg-[#322319] text-[#dfb86c] border border-[#7a5c28]/70 hover:border-[#dfb86c] rounded-xl text-xs font-serif font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#dfb86c]" />
                      Take Photo
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-[#241a13] hover:bg-[#322319] text-[#f7eedd] border border-[#7a5c28]/70 hover:border-[#dfb86c] rounded-xl text-xs font-serif font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#dfb86c]" />
                      Choose from Gallery
                    </button>
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="flex items-center gap-2 flex-wrap min-h-[50px] p-2 bg-[#140e0a] border border-[#5a4420]/40 rounded-xl">
                  {photos.length === 0 ? (
                    <span className="text-[11px] text-[#a89c8d] italic px-1 font-serif">
                      No photos uploaded yet. You can add photos later from the album view.
                    </span>
                  ) : (
                    photos.map((p, idx) => (
                      <div key={idx} className="relative group cursor-pointer" onClick={() => setMainPhoto(p)}>
                        <img
                          src={p}
                          alt={`Photo ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className={`w-12 h-12 object-cover rounded-xl border-2 transition-all ${
                            mainPhoto === p ? 'border-[#dfb86c] ring-2 ring-[#dfb86c]/40' : 'border-[#5a4420]/60'
                          }`}
                        />
                        {mainPhoto === p && (
                          <div className="absolute top-0.5 left-0.5 bg-[#dfb86c] text-[#140e08] text-[8px] font-bold px-1 rounded">
                            Main
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rem = photos.filter((_, i) => i !== idx);
                            setPhotos(rem);
                            if (mainPhoto === p) setMainPhoto(rem[0] || '');
                          }}
                          className="absolute -top-1 -right-1 p-0.5 bg-rose-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Collector Notes */}
              <div>
                <label className="block text-xs font-serif font-semibold text-[#a89c8d] mb-1">
                  Personal Notes / Acquisition (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="e.g. Purchased at Baltimore Whitman Expo, lustrous cartwheel surfaces, CAC stickered..."
                  className="w-full px-3 py-2 bg-[#140e0a] border border-[#5a4420]/60 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/60 focus:outline-none focus:border-[#dfb86c] resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#5a4420]/40">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-4 py-2 text-xs font-serif font-semibold text-[#a89c8d] hover:text-[#f7eedd] cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] font-serif font-bold text-xs rounded-xl shadow-lg shadow-[#dfb86c]/20 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving to Collection...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Save to My Collection
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
