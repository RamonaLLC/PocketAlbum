import React, { useState } from 'react';
import { CollectionItem, CoinIssue, CoinSeries, Denomination } from '../types.ts';
import { deleteCoinItem } from '../utils/api.ts';
import { X, ArrowLeft, Edit3, Trash2, Award, Calendar, Layers, ShieldCheck, FileText, CheckCircle2, ZoomIn, Maximize2, Scale } from 'lucide-react';
import { CoinComparisonModal } from './CoinComparisonModal.tsx';
import { getCoinNameCategory, normalizeGrade } from '../utils/coinComparison.ts';

interface CoinDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  coin: CollectionItem;
  denomination?: Denomination;
  series?: CoinSeries;
  issue?: CoinIssue;
  onEdit?: () => void;
  onDeleted?: (deletedCoinId: string) => void;
  isReadOnly?: boolean;
  backLabel?: string;
  onNavigateToUser?: (userId: string) => void;
}

export const CoinDetailModal: React.FC<CoinDetailModalProps> = ({
  isOpen,
  onClose,
  coin,
  denomination,
  series,
  issue,
  onEdit,
  onDeleted,
  isReadOnly = false,
  backLabel = 'Back to Collection',
  onNavigateToUser,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string>(coin.main_photo);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  if (!isOpen) return null;

  const allPhotos = coin.photos && coin.photos.length > 0
    ? coin.photos.map(p => p.photo_url)
    : (coin.main_photo ? [coin.main_photo] : []);

  const currentPhoto = selectedPhoto || coin.main_photo || (allPhotos.length > 0 ? allPhotos[0] : '');

  const effectiveDenomName = denomination?.name || coin.denomination_name || coin.denomination?.name || 'United States Coinage';
  const effectiveSeriesName = series?.name || coin.series_name || coin.series?.name || 'Coin Series';
  const effectiveIssueName = issue?.issue_name || coin.issue_name || `${coin.year || ''} ${coin.mint || ''} ${effectiveSeriesName}`.trim();
  const effectiveYear = issue?.year || coin.year;
  const effectiveMint = issue?.mint || coin.mint || '';
  const effectiveMintMark = issue?.mint_mark || coin.mint_mark || (effectiveMint && effectiveMint !== 'P' && effectiveMint !== 'No Mint Mark' ? effectiveMint : '');
  const effectiveMintFacility = issue?.mint_facility_name || (
    effectiveMint === 'D' ? 'Denver Mint (D)' :
    effectiveMint === 'S' ? 'San Francisco Mint (S)' :
    effectiveMint === 'O' ? 'New Orleans Mint (O)' :
    effectiveMint === 'CC' ? 'Carson City Mint (CC)' :
    effectiveMint === 'W' ? 'West Point Mint (W)' :
    effectiveMint === 'C' ? 'Charlotte Mint (C)' :
    effectiveMint ? `${effectiveMint} Mint` : 'Philadelphia Mint (No Mint Mark)'
  );
  const effectiveComposition = issue?.composition || coin.composition;
  const effectiveWeight = issue?.weight_grams;
  const effectiveDiameter = issue?.diameter_mm;
  const effectiveMintage = issue?.mintage;

  // Comparison helpers
  const category = getCoinNameCategory(effectiveSeriesName, effectiveDenomName);
  const rawGrade = coin.grade || (coin.condition_type === 'raw' ? 'Raw' : 'MS 65');
  const normalizedGradeVal = normalizeGrade(coin.grade) || rawGrade;

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteCoinItem(coin.id);
      if (onDeleted) onDeleted(coin.id);
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete coin');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
        <div className="bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Navigation Bar */}
          <div className="bg-[#19110b] border-b border-[#7a5c28]/40 px-6 py-3.5 flex items-center justify-between">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 text-xs font-serif font-semibold text-[#a89c8d] hover:text-[#dfb86c] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsComparisonOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold text-[#140e08] bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] rounded-lg transition-all shadow-md cursor-pointer"
                title={`Compare this ${category} with other ${normalizedGradeVal} specimens`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>

              {!isReadOnly && (
                <>
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-semibold text-[#dfd4bf] hover:text-[#f7eedd] bg-[#241a13] hover:bg-[#322319] border border-[#7a5c28]/60 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#dfb86c]" />
                      Edit
                    </button>
                  )}
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-300 font-medium">Confirm delete?</span>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs font-serif font-bold text-white bg-rose-700 hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        {isDeleting ? '...' : 'Yes, Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-2.5 py-1 text-xs font-medium text-[#a89c8d] hover:text-[#f7eedd] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </>
              )}
              <button
                onClick={onClose}
                className="text-[#a89c8d] hover:text-[#f7eedd] p-1.5 rounded-lg hover:bg-[#251a13] transition-colors ml-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {deleteError && (
            <div className="mx-6 mt-4 p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 font-medium">
              {deleteError}
            </div>
          )}

          {/* Content Layout */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left column: Photo gallery */}
            <div className="md:col-span-6 space-y-4">
              {/* Primary Display Photo */}
              <div 
                onClick={() => currentPhoto && setIsLightboxOpen(true)}
                className="group relative aspect-square w-full rounded-2xl overflow-hidden bg-[#120d09] border-2 border-[#7a5c28]/60 shadow-xl flex items-center justify-center cursor-pointer"
                title="Click to view full-resolution photo"
              >
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={effectiveIssueName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xl font-serif font-bold text-[#dfb86c]">
                      {effectiveYear || 'US'}
                    </span>
                    <span className="text-xs text-[#a89c8d] uppercase tracking-wider mt-1">
                      {effectiveMint || 'Coin Specimen'}
                    </span>
                  </div>
                )}

                {currentPhoto === coin.main_photo && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] text-xs font-serif font-bold px-2.5 py-0.5 rounded-md shadow-md border border-[#fae19c]/70 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Main Album Specimen
                  </div>
                )}

                {currentPhoto && (
                  <div className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-[#fae19c] p-2 rounded-xl border border-[#7a5c28]/60 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-serif">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Enlarge</span>
                  </div>
                )}
              </div>

              {/* Thumbnails if multiple photos */}
              {allPhotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allPhotos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(photo)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        currentPhoto === photo
                          ? 'border-[#dfb86c] shadow-md shadow-[#dfb86c]/30 scale-105'
                          : 'border-[#5a4420]/50 hover:border-[#7a5c28] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={photo} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right column: Coin metadata & specs */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-4">
              <div>
                {/* Hierarchy tags */}
                <div className="text-xs font-serif font-bold uppercase tracking-wider text-[#dfb86c]">
                  {effectiveDenomName} &bull; {effectiveSeriesName}
                </div>

                {/* Title Date & Issue */}
                <h1 className="text-2xl font-serif font-extrabold text-[#f7eedd] mt-1">
                  {effectiveIssueName}
                </h1>

                {/* Condition Badge */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {coin.condition_type === 'graded' ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#dfb86c]/20 border border-[#dfb86c]/40 text-[#fae19c] font-serif font-bold text-sm">
                      <Award className="w-4 h-4 text-[#dfb86c]" />
                      <span>{coin.tpg} {coin.grade}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#241a13] border border-[#5a4420]/50 text-[#dfd4bf] font-serif font-semibold text-sm">
                      <span>{coin.grade ? `Raw (${coin.grade})` : 'Raw (Uncertified)'}</span>
                    </div>
                  )}
                  <span className="text-xs text-[#a89c8d]">
                    Variety: <span className="font-semibold text-[#f7eedd]">{coin.variety_name || 'Normal Strike'}</span>
                  </span>
                </div>

                {/* Numismatic Comparison Banner */}
                <div className="mt-3.5 p-3 rounded-xl bg-gradient-to-r from-[#241a12] via-[#1c140e] to-[#241a12] border border-[#7a5c28]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-md">
                  <div className="min-w-0">
                    <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-[#dfb86c] block">
                      Numismatic Comparison
                    </span>
                    <p className="text-xs text-[#dfd4bf] truncate">
                      Compare with other <strong className="text-[#fae19c] font-mono">{normalizedGradeVal}</strong> {category}s across albums
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsComparisonOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-serif font-bold text-[#140e08] bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] rounded-lg transition-all shadow shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Compare Coins</span>
                  </button>
                </div>

                {/* Detailed specification table */}
                <div className="mt-6 bg-[#140e0a] border border-[#5a4420]/40 rounded-xl divide-y divide-[#5a4420]/30 text-sm">
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[#a89c8d] flex items-center gap-2 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-[#dfb86c]" /> Issue Year
                    </span>
                    <span className="font-serif font-semibold text-[#f7eedd] text-xs">{effectiveYear || 'N/A'}</span>
                  </div>

                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[#a89c8d] flex items-center gap-2 text-xs">
                      <Layers className="w-3.5 h-3.5 text-[#dfb86c]" /> Mint Facility
                    </span>
                    <span className="font-serif font-semibold text-[#f7eedd] text-xs text-right">
                      {effectiveMintFacility}
                    </span>
                  </div>

                  {effectiveComposition && (
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[#a89c8d] text-xs">Composition</span>
                      <span className="font-serif font-semibold text-[#f7eedd] text-xs text-right">{effectiveComposition}</span>
                    </div>
                  )}

                  {(effectiveWeight || effectiveDiameter) && (
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[#a89c8d] text-xs">Physical Specs</span>
                      <span className="font-serif font-semibold text-[#f7eedd] text-xs">
                        {effectiveWeight ? `${effectiveWeight} g` : ''}
                        {effectiveWeight && effectiveDiameter ? ' • ' : ''}
                        {effectiveDiameter ? `${effectiveDiameter} mm` : ''}
                      </span>
                    </div>
                  )}

                  {effectiveMintage && (
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[#a89c8d] text-xs">Recorded Mintage</span>
                      <span className="font-serif font-semibold text-[#f7eedd] text-xs">{effectiveMintage}</span>
                    </div>
                  )}

                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[#a89c8d] flex items-center gap-2 text-xs">
                      <Award className="w-3.5 h-3.5 text-[#dfb86c]" /> Grading Service (TPG)
                    </span>
                    <span className="font-serif font-semibold text-[#f7eedd] text-xs">{coin.tpg || 'None (Raw)'}</span>
                  </div>

                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[#a89c8d] flex items-center gap-2 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#dfb86c]" /> Certification #
                    </span>
                    <span className="font-mono text-[#f7eedd] text-xs">
                      {coin.certification_number || 'N/A'}
                    </span>
                  </div>

                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[#a89c8d] flex items-center gap-2 text-xs">
                      <FileText className="w-3.5 h-3.5 text-[#dfb86c]" /> Added to Collection
                    </span>
                    <span className="text-[#a89c8d] text-xs">
                      {new Date(coin.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Collector Notes */}
                {coin.notes && (
                  <div className="mt-4 p-3.5 bg-[#140e0a] border border-[#5a4420]/40 rounded-xl">
                    <h4 className="text-xs font-serif font-semibold text-[#a89c8d] mb-1">Collector Notes:</h4>
                    <p className="text-xs text-[#dfd4bf] italic leading-relaxed">
                      "{coin.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Controls */}
              <div className="pt-4 border-t border-[#5a4420]/30 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-serif font-semibold text-[#dfd4bf] hover:text-[#f7eedd] hover:bg-[#251a13] rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {backLabel}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComparisonOpen(true)}
                    className="px-3.5 py-2 text-xs font-serif font-bold text-[#dfb86c] hover:text-[#fae19c] bg-[#241a13] hover:bg-[#322319] border border-[#7a5c28]/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Compare Specimen</span>
                  </button>

                  {!isReadOnly && onEdit && (
                    <button
                      onClick={onEdit}
                      className="px-4 py-2 text-xs font-serif font-bold text-[#fae19c] bg-[#241a13] hover:bg-[#322319] border border-[#7a5c28]/60 rounded-lg transition-colors cursor-pointer"
                    >
                      Edit Information
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coin Specimen Comparison Modal */}
      {isComparisonOpen && (
        <CoinComparisonModal
          isOpen={isComparisonOpen}
          onClose={() => setIsComparisonOpen(false)}
          baseCoin={coin}
          denomination={denomination}
          series={series}
          issue={issue}
          onNavigateToUser={(uid) => {
            setIsComparisonOpen(false);
            onClose();
            if (onNavigateToUser) onNavigateToUser(uid);
          }}
        />
      )}

      {/* Lightbox Modal for High-Resolution Inspection */}
      {isLightboxOpen && currentPhoto && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-[#f7eedd] hover:text-[#dfb86c] p-2 rounded-full bg-[#1e1510]/80 border border-[#7a5c28]/60 hover:bg-[#2e2018] transition-colors cursor-pointer"
            title="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3">
            <img
              src={currentPhoto}
              alt={effectiveIssueName}
              referrerPolicy="no-referrer"
              className="max-h-[80vh] max-w-full object-contain rounded-2xl border-2 border-[#7a5c28]/80 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-center" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif text-lg font-bold text-[#f7eedd]">
                {effectiveIssueName}
              </h3>
              <p className="text-xs text-[#dfb86c]">
                {coin.condition_type === 'graded' ? `${coin.tpg} ${coin.grade}` : (coin.grade || 'Raw Uncertified')}
                {coin.certification_number ? ` • Cert #${coin.certification_number}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
