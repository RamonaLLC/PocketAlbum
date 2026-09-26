import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Columns,
  Grid,
  Award,
  ShieldCheck,
  Calendar,
  Layers,
  FileText,
  User,
  ZoomIn,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Info,
  Scale
} from 'lucide-react';
import { CollectionItem, CoinIssue, CoinSeries, Denomination, ComparisonSpecimen } from '../types.ts';
import { fetchCoinComparisons, getCoinNameCategory, normalizeGrade, getGradeDesignation } from '../utils/coinComparison.ts';

interface CoinComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseCoin: CollectionItem;
  denomination?: Denomination;
  series?: CoinSeries;
  issue?: CoinIssue;
  onNavigateToUser?: (userId: string) => void;
}

export const CoinComparisonModal: React.FC<CoinComparisonModalProps> = ({
  isOpen,
  onClose,
  baseCoin,
  denomination,
  series,
  issue,
  onNavigateToUser
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'grid'>('side-by-side');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matchingCoins, setMatchingCoins] = useState<ComparisonSpecimen[]>([]);
  const [selectedComparisonIndex, setSelectedComparisonIndex] = useState<number>(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  // Derive normalized category and grade
  const effectiveSeriesName = series?.name || baseCoin.series_name || baseCoin.series?.name || '';
  const effectiveDenomName = denomination?.name || baseCoin.denomination_name || baseCoin.denomination?.name || '';
  const category = getCoinNameCategory(effectiveSeriesName, effectiveDenomName);
  const rawGrade = baseCoin.grade || (baseCoin.condition_type === 'raw' ? 'Raw Uncertified' : 'MS 65');
  const normalizedGradeVal = normalizeGrade(baseCoin.grade) || rawGrade;
  const baseDesignation = getGradeDesignation(baseCoin.grade);

  const baseIssueName = issue?.issue_name || baseCoin.issue_name || `${baseCoin.year || ''} ${baseCoin.mint || ''} ${effectiveSeriesName}`.trim();
  const baseYear = issue?.year || baseCoin.year;
  const baseMint = issue?.mint || baseCoin.mint || 'P';
  const baseMintFacility = issue?.mint_facility_name || (
    baseMint === 'D' ? 'Denver Mint (D)' :
    baseMint === 'S' ? 'San Francisco Mint (S)' :
    baseMint === 'CC' ? 'Carson City Mint (CC)' :
    baseMint === 'O' ? 'New Orleans Mint (O)' :
    baseMint === 'W' ? 'West Point Mint (W)' :
    'Philadelphia Mint (No Mint Mark)'
  );

  useEffect(() => {
    if (isOpen) {
      loadComparisons();
    }
  }, [isOpen, baseCoin.id, normalizedGradeVal, category]);

  const loadComparisons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCoinComparisons({
        grade: normalizedGradeVal,
        coin_name_category: category,
        series_id: series?.id || baseCoin.issue?.series_id,
        exclude_coin_id: baseCoin.id
      });
      // Filter out base coin if present in list
      const others = data.coins.filter(c => c.id !== baseCoin.id);
      setMatchingCoins(others);
      setSelectedComparisonIndex(0);
    } catch (err: any) {
      console.error('Error fetching coin comparisons:', err);
      setError(err.message || 'Failed to fetch coin comparisons');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentComparison = matchingCoins[selectedComparisonIndex] || null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
        <div className="bg-gradient-to-b from-[#231a13] via-[#1c140f] to-[#120d09] border border-[#7a5c28]/80 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden my-4 sm:my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-[#18110b] border-b border-[#7a5c28]/50 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#a89c8d] hover:text-[#dfb86c] hover:bg-[#251a13] transition-colors cursor-pointer shrink-0"
                title="Back to Coin Details"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-xs text-[#a89c8d]">
                  <span className="font-serif font-bold text-[#dfb86c] uppercase tracking-wider">
                    Numismatic Specimen Comparison
                  </span>
                  <span aria-hidden="true" className="text-[#5a4420]">&bull;</span>
                  <span>Category: <strong className="text-[#f7eedd]">{category}</strong></span>
                  <span aria-hidden="true" className="text-[#5a4420]">&bull;</span>
                  <span>Locked Grade: <strong className="text-[#fae19c] font-mono">{normalizedGradeVal}</strong></span>
                </div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#f7eedd] truncate mt-0.5">
                  Comparing {normalizedGradeVal} {category}s Across Community Albums
                </h2>
              </div>
            </div>

            {/* View Mode Toggle & Close */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center p-0.5 bg-[#120d08] border border-[#5a4420]/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-2.5 py-1 text-xs font-serif font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'side-by-side'
                      ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow'
                      : 'text-[#a89c8d] hover:text-[#f7eedd]'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  Side-by-Side
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 text-xs font-serif font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow'
                      : 'text-[#a89c8d] hover:text-[#f7eedd]'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  All Matches ({matchingCoins.length})
                </button>
              </div>

              <button
                onClick={onClose}
                className="text-[#a89c8d] hover:text-[#f7eedd] p-1.5 rounded-lg hover:bg-[#251a13] transition-colors cursor-pointer"
                title="Close Comparison"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader / Verification Guard */}
          <div className="px-4 sm:px-6 py-2 bg-[#140e09] border-b border-[#5a4420]/30 flex items-center justify-between text-[11px] text-[#a89c8d] shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Verified Rule: Only comparing coins with identical grade <strong className="text-[#fae19c] font-mono">{normalizedGradeVal}</strong> in the <strong className="text-[#f7eedd]">{category}</strong> category.
              </span>
            </div>
            <div className="hidden md:block">
              {matchingCoins.length} matching {category} {matchingCoins.length === 1 ? 'specimen' : 'specimens'} in community
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
                <RotateCcw className="w-7 h-7 text-[#dfb86c] animate-spin" />
                <p className="font-serif text-sm text-[#dfd4bf]">Searching community albums for {normalizedGradeVal} {category}s...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-center text-xs text-rose-200">
                {error}
              </div>
            ) : matchingCoins.length === 0 ? (
              /* No matching community coins empty state */
              <div className="py-12 px-4 text-center max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#2a1d13] border border-[#7a5c28]/60 flex items-center justify-center mx-auto text-[#dfb86c]">
                  <Scale className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base text-[#f7eedd]">
                    No Other {normalizedGradeVal} {category}s Found
                  </h3>
                  <p className="text-xs text-[#a89c8d] leading-relaxed">
                    You currently have the only cataloged <strong className="text-[#fae19c]">{normalizedGradeVal} {category}</strong> specimen in PocketAlbum!
                  </p>
                </div>
                <div className="p-3.5 bg-[#140e0a] border border-[#5a4420]/40 rounded-xl text-left text-xs text-[#dfd4bf] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#dfb86c]">
                    <Info className="w-4 h-4" /> Comparison Rule:
                  </div>
                  <p className="text-[11px] text-[#a89c8d]">
                    PocketAlbum strictly compares coins of the <strong>exact same grade ({normalizedGradeVal})</strong> and <strong>name category ({category})</strong> to ensure authentic numismatic evaluation.
                  </p>
                  <p className="text-[11px] text-[#a89c8d]">
                    As you or other collectors add more {category}s graded {normalizedGradeVal}, they will appear here side-by-side automatically.
                  </p>
                </div>
              </div>
            ) : viewMode === 'side-by-side' ? (
              /* SIDE-BY-SIDE DUAL SPECIMEN INSPECTOR */
              <div className="space-y-6">
                
                {/* Community Specimen Carousel / Selector */}
                {matchingCoins.length > 1 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-serif font-bold text-[#dfb86c]">
                        Select Comparison Specimen ({matchingCoins.length} Available):
                      </span>
                      <span className="text-[11px] text-[#a89c8d]">
                        Click any specimen to inspect side-by-side
                      </span>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                      {matchingCoins.map((spec, idx) => (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => setSelectedComparisonIndex(idx)}
                          className={`p-2 rounded-xl border text-left shrink-0 transition-all flex items-center gap-2.5 cursor-pointer ${
                            selectedComparisonIndex === idx
                              ? 'bg-[#2b1e14] border-[#dfb86c] shadow-lg shadow-[#dfb86c]/20 scale-102'
                              : 'bg-[#140e09] border-[#5a4420]/50 hover:border-[#7a5c28] opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={spec.main_photo}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover border border-[#5a4420]"
                          />
                          <div className="min-w-0 pr-1">
                            <div className="font-serif font-bold text-xs text-[#f7eedd] truncate max-w-[130px]">
                              {spec.issue_name}
                            </div>
                            <div className="text-[10px] text-[#a89c8d] truncate">
                              @{spec.owner_username} &bull; <span className="text-[#fae19c] font-semibold">{spec.grade}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dual Specimen Cards (Side-by-Side) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* LEFT: Current Coin Specimen */}
                  <div className="bg-[#17100b] border-2 border-[#7a5c28]/70 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#5a4420]/50 pb-2.5">
                      <div>
                        <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-[#dfb86c] block">
                          Base Specimen (Active Album)
                        </span>
                        <h3 className="font-serif font-bold text-base text-[#f7eedd] truncate">
                          {baseIssueName}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#dfb86c]/20 border border-[#dfb86c]/40 text-[#fae19c] font-serif font-bold text-xs">
                          <Award className="w-3.5 h-3.5 text-[#dfb86c]" />
                          {baseCoin.tpg || 'TPG'} {normalizedGradeVal}
                          {baseDesignation ? ` ${baseDesignation}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Image Specimen Container */}
                    <div
                      onClick={() => setLightboxPhoto({
                        url: baseCoin.main_photo,
                        title: `${baseIssueName} (${normalizedGradeVal})`,
                        subtitle: `Active Album Specimen • Cert #${baseCoin.certification_number || 'N/A'}`
                      })}
                      className="group relative aspect-square w-full rounded-xl overflow-hidden bg-[#0e0906] border border-[#5a4420] shadow-inner flex items-center justify-center cursor-pointer"
                    >
                      <img
                        src={baseCoin.main_photo}
                        alt={baseIssueName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-sm text-[#fae19c] px-2 py-1 rounded-lg border border-[#7a5c28]/60 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-serif">
                        <ZoomIn className="w-3 h-3" /> Enlarge
                      </div>
                    </div>

                    {/* Left Spec Details */}
                    <div className="space-y-2 text-xs divide-y divide-[#5a4420]/30 pt-1">
                      <div className="flex justify-between py-1">
                        <span className="text-[#a89c8d]">Issue / Year:</span>
                        <span className="font-serif font-bold text-[#f7eedd]">{baseYear} ({baseMintFacility})</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#a89c8d]">Grading Service:</span>
                        <span className="font-serif font-semibold text-[#f7eedd]">{baseCoin.tpg || 'Uncertified / Raw'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#a89c8d]">Certification #:</span>
                        <span className="font-mono text-[#f7eedd]">{baseCoin.certification_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#a89c8d]">Variety:</span>
                        <span className="font-semibold text-[#f7eedd]">{baseCoin.variety_name || 'Normal Strike'}</span>
                      </div>
                      {baseCoin.notes && (
                        <div className="pt-2 text-[11px] text-[#dfd4bf] italic">
                          "{baseCoin.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Selected Comparison Coin Specimen */}
                  {currentComparison && (
                    <div className="bg-[#17100b] border-2 border-[#dfb86c]/70 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-[#5a4420]/50 pb-2.5">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-[#dfb86c] block">
                            Comparison Specimen ({selectedComparisonIndex + 1} of {matchingCoins.length})
                          </span>
                          <h3 className="font-serif font-bold text-base text-[#f7eedd] truncate">
                            {currentComparison.issue_name}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#dfb86c]/20 border border-[#dfb86c]/40 text-[#fae19c] font-serif font-bold text-xs">
                            <Award className="w-3.5 h-3.5 text-[#dfb86c]" />
                            {currentComparison.tpg || 'TPG'} {currentComparison.grade}
                          </span>
                        </div>
                      </div>

                      {/* Image Specimen Container */}
                      <div
                        onClick={() => setLightboxPhoto({
                          url: currentComparison.main_photo,
                          title: `${currentComparison.issue_name} (${currentComparison.grade})`,
                          subtitle: `Owner: @${currentComparison.owner_username} • Cert #${currentComparison.certification_number || 'N/A'}`
                        })}
                        className="group relative aspect-square w-full rounded-xl overflow-hidden bg-[#0e0906] border border-[#5a4420] shadow-inner flex items-center justify-center cursor-pointer"
                      >
                        <img
                          src={currentComparison.main_photo}
                          alt={currentComparison.issue_name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-sm text-[#fae19c] px-2 py-1 rounded-lg border border-[#7a5c28]/60 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-serif">
                          <ZoomIn className="w-3 h-3" /> Enlarge
                        </div>
                      </div>

                      {/* Right Spec Details */}
                      <div className="space-y-2 text-xs divide-y divide-[#5a4420]/30 pt-1">
                        <div className="flex justify-between py-1 items-center">
                          <span className="text-[#a89c8d]">Collector / Album:</span>
                          <div className="flex items-center gap-1.5 font-bold text-[#f7eedd]">
                            {currentComparison.owner_photo && (
                              <img src={currentComparison.owner_photo} alt="" className="w-4 h-4 rounded-full object-cover border border-[#dfb86c]" />
                            )}
                            <span>@{currentComparison.owner_username}</span>
                            {onNavigateToUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  onNavigateToUser(currentComparison.owner_id);
                                  onClose();
                                }}
                                className="text-[10px] text-[#dfb86c] hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                              >
                                View Album <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#a89c8d]">Issue / Year:</span>
                          <span className="font-serif font-bold text-[#f7eedd]">{currentComparison.year} ({currentComparison.mint || 'P'})</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#a89c8d]">Grading Service:</span>
                          <span className="font-serif font-semibold text-[#f7eedd]">{currentComparison.tpg || 'Uncertified'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#a89c8d]">Certification #:</span>
                          <span className="font-mono text-[#f7eedd]">{currentComparison.certification_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#a89c8d]">Variety:</span>
                          <span className="font-semibold text-[#f7eedd]">{currentComparison.variety_name || 'Normal Strike'}</span>
                        </div>
                        {currentComparison.notes && (
                          <div className="pt-2 text-[11px] text-[#dfd4bf] italic">
                            "{currentComparison.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Spec-by-Spec Comparison Table */}
                {currentComparison && (
                  <div className="bg-[#140e09] border border-[#7a5c28]/60 rounded-xl overflow-hidden shadow-lg">
                    <div className="px-4 py-2.5 bg-[#1b130c] border-b border-[#5a4420]/50 flex items-center justify-between text-xs font-serif font-bold text-[#dfb86c]">
                      <span>Side-by-Side Numismatic Metric Comparison</span>
                      <span className="text-[11px] font-sans font-normal text-[#a89c8d]">Grade: {normalizedGradeVal}</span>
                    </div>

                    <div className="divide-y divide-[#5a4420]/30 text-xs">
                      {/* Metric 1: Collector */}
                      <div className="grid grid-cols-12 p-3">
                        <span className="col-span-4 text-[#a89c8d] font-semibold">Collector</span>
                        <span className="col-span-4 font-serif font-bold text-[#f7eedd]">You / Active Album</span>
                        <span className="col-span-4 font-serif font-bold text-[#dfb86c]">@{currentComparison.owner_username}</span>
                      </div>

                      {/* Metric 2: Issue / Date */}
                      <div className="grid grid-cols-12 p-3 bg-[#18110b]/50">
                        <span className="col-span-4 text-[#a89c8d] font-semibold">Issue &amp; Date</span>
                        <span className="col-span-4 font-serif text-[#f7eedd]">{baseIssueName}</span>
                        <span className="col-span-4 font-serif text-[#f7eedd]">{currentComparison.issue_name}</span>
                      </div>

                      {/* Metric 3: Grade Match */}
                      <div className="grid grid-cols-12 p-3">
                        <span className="col-span-4 text-[#a89c8d] font-semibold">Grade Certification</span>
                        <span className="col-span-4 font-mono font-bold text-[#fae19c]">
                          {baseCoin.tpg} {baseCoin.grade || normalizedGradeVal}
                        </span>
                        <span className="col-span-4 font-mono font-bold text-[#fae19c]">
                          {currentComparison.tpg} {currentComparison.grade}
                        </span>
                      </div>

                      {/* Metric 4: Cert # */}
                      <div className="grid grid-cols-12 p-3 bg-[#18110b]/50">
                        <span className="col-span-4 text-[#a89c8d] font-semibold">Certification #</span>
                        <span className="col-span-4 font-mono text-[#a89c8d]">{baseCoin.certification_number || 'None'}</span>
                        <span className="col-span-4 font-mono text-[#a89c8d]">{currentComparison.certification_number || 'None'}</span>
                      </div>

                      {/* Metric 5: Mint Location */}
                      <div className="grid grid-cols-12 p-3">
                        <span className="col-span-4 text-[#a89c8d] font-semibold">Mint Location</span>
                        <span className="col-span-4 text-[#f7eedd]">{baseMintFacility}</span>
                        <span className="col-span-4 text-[#f7eedd]">{currentComparison.mint_facility_name || `${currentComparison.mint || 'P'} Mint`}</span>
                      </div>

                      {/* Metric 6: Strike / Variety */}
                      <div className="grid grid-cols-12 p-3 bg-[#18110b]/50">
                        <span className="col-span-4 text-[#a89c8d] font-semibold">Strike / Variety</span>
                        <span className="col-span-4 text-[#f7eedd]">{baseCoin.variety_name || 'Normal Strike'}</span>
                        <span className="col-span-4 text-[#f7eedd]">{currentComparison.variety_name || 'Normal Strike'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* GRID GALLERY VIEW */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#a89c8d]">
                  <span>Showing all {matchingCoins.length} verified {normalizedGradeVal} {category}s</span>
                  <span className="text-[11px]">Click any card to select for side-by-side inspection</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {matchingCoins.map((spec, idx) => (
                    <div
                      key={spec.id}
                      className="p-4 bg-[#17100b] border border-[#5a4420]/70 hover:border-[#dfb86c] rounded-2xl space-y-3 transition-all shadow-md group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-serif font-bold text-[#f7eedd] truncate">
                          {spec.issue_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#dfb86c]/20 border border-[#dfb86c]/40 text-[#fae19c] font-serif font-bold text-[11px]">
                          {spec.grade}
                        </span>
                      </div>

                      <div
                        onClick={() => {
                          setSelectedComparisonIndex(idx);
                          setViewMode('side-by-side');
                        }}
                        className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#0e0906] border border-[#5a4420] cursor-pointer"
                      >
                        <img
                          src={spec.main_photo}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                      </div>

                      <div className="text-xs space-y-1 pt-1 border-t border-[#5a4420]/30">
                        <div className="flex items-center justify-between text-[#a89c8d]">
                          <span>Collector:</span>
                          <span className="font-semibold text-[#f7eedd]">@{spec.owner_username}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#a89c8d]">
                          <span>Grading Service:</span>
                          <span className="font-semibold text-[#f7eedd]">{spec.tpg || 'Raw'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedComparisonIndex(idx);
                          setViewMode('side-by-side');
                        }}
                        className="w-full py-1.5 text-xs font-serif font-bold bg-[#261b13] hover:bg-[#342419] border border-[#7a5c28] text-[#dfb86c] rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Columns className="w-3.5 h-3.5" />
                        Inspect Side-by-Side
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-[#18110b] border-t border-[#7a5c28]/40 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-[#a89c8d] hidden sm:inline">
              PocketAlbum High-Resolution Numismatic Comparison Suite
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-serif font-semibold text-[#dfd4bf] hover:text-[#f7eedd] hover:bg-[#251a13] rounded-lg transition-colors cursor-pointer ml-auto"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for Zoomed High-Resolution Inspection */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 text-[#f7eedd] hover:text-[#dfb86c] p-2 rounded-full bg-[#1e1510]/80 border border-[#7a5c28]/60 hover:bg-[#2e2018] transition-colors cursor-pointer"
            title="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3">
            <img
              src={lightboxPhoto.url}
              alt=""
              referrerPolicy="no-referrer"
              className="max-h-[80vh] max-w-full object-contain rounded-2xl border-2 border-[#7a5c28]/80 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-center" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif text-lg font-bold text-[#f7eedd]">
                {lightboxPhoto.title}
              </h3>
              <p className="text-xs text-[#dfb86c]">
                {lightboxPhoto.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
