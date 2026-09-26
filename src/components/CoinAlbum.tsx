import React, { useState, useEffect, useMemo } from 'react';
import { CoinSeries, Denomination, CoinIssue, CollectionItem } from '../types.ts';
import { fetchIssuesForSeries, fetchCollectionForSeries } from '../utils/api.ts';
import { AddCoinModal } from './AddCoinModal.tsx';
import { CoinDetailModal } from './CoinDetailModal.tsx';
import { MultipleCoinsPickerModal } from './MultipleCoinsPickerModal.tsx';
import { FacebookSharingModal } from './FacebookSharingModal.tsx';
import { ChevronLeft, ChevronRight, BookOpen, Plus, Sparkles, Layers, ShieldCheck } from 'lucide-react';

interface CoinAlbumProps {
  series: CoinSeries;
  denomination: Denomination;
  ownerId: string;
  isReadOnly?: boolean;
  onBackToSeriesList: () => void;
  onViewUser?: (userId: string) => void;
}

const SLOTS_PER_PAGE = 20; // Exactly 20 coin slots per album page: 5 cols x 4 rows

export const CoinAlbum: React.FC<CoinAlbumProps> = ({
  series,
  denomination,
  ownerId,
  isReadOnly = false,
  onBackToSeriesList,
  onViewUser,
}) => {
  const [issues, setIssues] = useState<CoinIssue[]>([]);
  const [coins, setCoins] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [selectedEmptyIssue, setSelectedEmptyIssue] = useState<CoinIssue | null>(null);
  const [selectedCoinDetail, setSelectedCoinDetail] = useState<{ coin: CollectionItem; issue: CoinIssue } | null>(null);
  const [editingCoin, setEditingCoin] = useState<{ coin: CollectionItem; issue: CoinIssue } | null>(null);
  const [multiplePicker, setMultiplePicker] = useState<{ issue: CoinIssue; coins: CollectionItem[] } | null>(null);
  const [facebookPromptCoin, setFacebookPromptCoin] = useState<CollectionItem | null>(null);

  // Load issues and user's coins for this series
  const loadAlbumData = async () => {
    setLoading(true);
    try {
      const [issueList, collectionList] = await Promise.all([
        fetchIssuesForSeries(series.id),
        fetchCollectionForSeries(ownerId, series.id),
      ]);
      setIssues(issueList);
      setCoins(collectionList);
    } catch (err) {
      console.error('Failed to load album data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadAlbumData();
  }, [series.id, ownerId]);

  // Group coins by issue_id to support multiple examples of the same issue
  const coinsByIssue = useMemo(() => {
    const map = new Map<string, CollectionItem[]>();
    for (const c of coins) {
      const arr = map.get(c.issue_id) || [];
      arr.push(c);
      map.set(c.issue_id, arr);
    }
    return map;
  }, [coins]);

  // Distinct pages calculation: each page has up to 20 actual CoinIssue records
  const totalPages = Math.max(1, Math.ceil(issues.length / SLOTS_PER_PAGE));
  const currentIssues = useMemo(() => {
    const start = (currentPage - 1) * SLOTS_PER_PAGE;
    return issues.slice(start, start + SLOTS_PER_PAGE);
  }, [issues, currentPage]);

  // Calculate series completion stats
  // Rule: completed issues / total required issues * 100
  // An issue counts as complete when user owns at least one coin for that issue.
  // Multiple coins for same issue do NOT increase beyond 1 completed issue.
  const filledCount = useMemo(() => {
    let count = 0;
    for (const issue of issues) {
      const issueCoins = coinsByIssue.get(issue.id);
      if (issueCoins && issueCoins.length > 0) count++;
    }
    return count;
  }, [issues, coinsByIssue]);

  const completionPercent = issues.length > 0 ? Math.round((filledCount / issues.length) * 100) : 0;
  const is100PercentComplete = issues.length > 0 && filledCount === issues.length;

  // Handle clicking a slot
  const handleSlotClick = (issue: CoinIssue) => {
    const existingCoins = coinsByIssue.get(issue.id) || [];

    if (existingCoins.length === 0) {
      // Empty slot -> Open Add Coin
      if (!isReadOnly) {
        setSelectedEmptyIssue(issue);
      }
    } else if (existingCoins.length === 1) {
      // Exactly 1 coin -> Open coin detail directly
      setSelectedCoinDetail({ coin: existingCoins[0], issue });
    } else {
      // Multiple coins for same issue -> Open multiple coins picker
      setMultiplePicker({ issue, coins: existingCoins });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 w-full">
      {/* Top Breadcrumbs and Album Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-lg">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onBackToSeriesList}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-all flex items-center gap-1 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">All </span>{denomination.name}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">{denomination.name}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] text-zinc-400">{series.start_year}–{series.end_year > 2024 ? 'Present' : series.end_year}</span>
            </div>
            <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-1.5 sm:gap-2 truncate">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
              <span className="truncate">{series.name} Album</span>
            </h1>
          </div>
        </div>

        {/* Completion Progress Badge with celebratory 100% gold glow */}
        <div
          className={`relative overflow-hidden flex items-center justify-between sm:justify-start gap-3 sm:gap-4 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 ${
            is100PercentComplete
              ? 'bg-gradient-to-r from-amber-950/90 via-yellow-950/90 to-amber-900/90 border-2 border-amber-400 shadow-xl shadow-amber-500/30 ring-2 ring-amber-400/40'
              : 'bg-zinc-950/70 border border-zinc-800/80'
          }`}
        >
          {is100PercentComplete && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/15 to-transparent animate-shimmer pointer-events-none" />
          )}
          <div className="relative z-10">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
              {is100PercentComplete ? (
                <span className="text-yellow-300 font-black flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  ✨ 100% COMPLETE ✨
                </span>
              ) : (
                <span className="text-zinc-400">Slots Filled</span>
              )}
            </div>
            <div className="text-sm sm:text-base font-bold text-amber-400">
              {filledCount}{' '}
              <span className="text-xs text-zinc-400 font-normal">
                / {issues.length} ({completionPercent}%)
              </span>
            </div>
          </div>
          <div
            className={`w-20 sm:w-24 h-2.5 sm:h-3 rounded-full overflow-hidden border p-0.5 relative z-10 ${
              is100PercentComplete ? 'border-amber-400 bg-zinc-900 shadow-sm shadow-amber-400/50' : 'bg-zinc-800 border-zinc-700'
            }`}
          >
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                is100PercentComplete
                  ? 'w-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 shadow-sm shadow-yellow-300'
                  : 'bg-gradient-to-r from-amber-500 to-amber-300'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Special Celebratory Banner when Album reaches 100% Completion */}
      {is100PercentComplete && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/90 via-yellow-900/60 to-amber-950/90 border-2 border-amber-400 p-3 sm:p-4 text-center shadow-xl shadow-amber-500/25 animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-shimmer pointer-events-none" />
          <div className="relative flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-bounce" />
            <span className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-yellow-200 drop-shadow-md">
              ✨ GOLD 100% COMPLETE &bull; ALBUM MASTERED ✨
            </span>
            <Sparkles className="w-5 h-5 text-yellow-300 animate-bounce" />
          </div>
          <p className="relative text-[11px] sm:text-xs text-amber-200/90 mt-1 font-medium">
            Every required issue slot in the official {series.name} album has been collected!
          </p>
        </div>
      )}

      {/* Album Page Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-zinc-900/60 border border-zinc-800/70 p-2.5 sm:px-4 sm:py-3 rounded-2xl">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs sm:text-sm font-bold text-zinc-200 tracking-wide px-3 py-1 bg-zinc-950 border border-amber-900/30 rounded-lg text-amber-200">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Page Jump Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full scrollbar-none">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-2.5 sm:px-3 py-1 text-xs font-bold rounded-lg border whitespace-nowrap transition-all shrink-0 ${
                currentPage === pageNum
                  ? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/10'
                  : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              Page {pageNum}
            </button>
          ))}
        </div>
      </div>

      {/* Main Physical Coin Album Page Frame */}
      <div className="relative rounded-2xl sm:rounded-3xl p-3 sm:p-6 md:p-10 shadow-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-2 sm:border-4 border-amber-950/70 overflow-hidden w-full">
        {/* Decorative embossed gold album foil line */}
        <div className="absolute inset-1.5 sm:inset-3.5 border border-amber-500/25 rounded-xl sm:rounded-2xl pointer-events-none" />
        <div className="absolute inset-2.5 sm:inset-4.5 border border-amber-500/10 rounded-lg sm:rounded-xl pointer-events-none" />

        {/* Embossed Album Page Header */}
        <div className="relative text-center mb-6 sm:mb-8 border-b border-amber-900/30 pb-3 sm:pb-4">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold text-amber-500/80">
            Official Albums Collection
          </div>
          <h2 className="text-base sm:text-xl md:text-2xl font-serif tracking-wider sm:tracking-widest text-amber-200 uppercase mt-0.5 px-2">
            {series.name}
          </h2>
          <div className="text-[11px] sm:text-xs text-zinc-400 tracking-wider mt-1">
            20-Port Standard Page &bull; Page {currentPage} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-zinc-400">
            <div className="inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium">Loading interactive album ports...</p>
          </div>
        ) : (
          /* EXACT 20 SLOTS LAYOUT: 2 cols on mobile, 3 on tablet, 4-5 on desktop */
          <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 sm:gap-y-8 gap-x-2 sm:gap-x-6 justify-items-center w-full">
            {currentIssues.map((issue) => {
              const issueCoins = coinsByIssue.get(issue.id) || [];
              const isFilled = issueCoins.length > 0;
              const primaryCoin = isFilled ? issueCoins[0] : null;

              return (
                <div
                  key={issue.id}
                  onClick={() => handleSlotClick(issue)}
                  className="group flex flex-col items-center cursor-pointer select-none transition-transform hover:-translate-y-1 duration-200 w-full max-w-[130px]"
                >
                  {/* Circular coin / photo holder port */}
                  <div className="relative w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center p-1">
                    {/* Outer Bevel Ring / Recessed Album Port Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-zinc-950 via-zinc-800 to-zinc-950 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] border border-amber-900/40 group-hover:border-amber-500/70 transition-colors" />

                    {/* Port Core */}
                    <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-zinc-950 border border-zinc-800 shadow-inner">
                      {isFilled && primaryCoin ? (
                        <>
                          {/* Filled: Selected Main Photo */}
                          <img
                            src={primaryCoin.main_photo}
                            alt={issue.issue_name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Subtle Mint Luster Radial Sheen */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                          {/* Multiple Coins Indicator Badge */}
                          {issueCoins.length > 1 && (
                            <div className="absolute bottom-1 right-1 bg-amber-500 text-zinc-950 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-lg border border-amber-300 flex items-center gap-0.5">
                              <Layers className="w-2.5 h-2.5" />
                              +{issueCoins.length}
                            </div>
                          )}
                        </>
                      ) : (
                        /* Empty Slot: Clean, original album recess with faint issue year */
                        <div
                          title={issue.mint_facility_name ? `${issue.mint_facility_name} • ${issue.issue_type || 'Business Strike'}` : undefined}
                          className="w-full h-full flex flex-col items-center justify-center text-zinc-600 group-hover:text-amber-400/80 transition-colors bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950"
                        >
                          <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider opacity-60 group-hover:opacity-100">
                            {issue.mint_mark !== undefined ? (issue.mint_mark || 'P') : (issue.mint || 'P')}
                          </span>
                          {!isReadOnly && (
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all text-amber-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date or issue underneath */}
                  <div className="mt-1.5 sm:mt-2 text-center max-w-[110px] sm:max-w-[120px] px-1">
                    <div className="text-[11px] sm:text-xs md:text-sm font-extrabold tracking-wide text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                      {issue.issue_name}
                    </div>

                    {/* Grade information underneath the date when applicable */}
                    {isFilled && primaryCoin && (
                      <div className="mt-0.5">
                        {primaryCoin.condition_type === 'graded' && primaryCoin.grade ? (
                          <div className="text-[10px] sm:text-[11px] font-bold text-amber-400 truncate">
                            {primaryCoin.tpg} {primaryCoin.grade}
                          </div>
                        ) : (
                          <div className="text-[10px] sm:text-[11px] font-medium text-zinc-400">
                            Raw
                          </div>
                        )}
                      </div>
                    )}
                    {/* Note: If no grade entered (empty slot), show ONLY date/issue. No empty grade placeholder! */}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Album Page Bottom Controls */}
        <div className="mt-10 pt-4 border-t border-amber-900/30 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <span>Click empty slot to catalog a coin with photos & grade</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 font-medium transition-colors"
            >
              Previous
            </button>
            <span className="font-semibold text-amber-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 font-medium transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Coin Modal (When clicking an empty slot or adding another coin) */}
      {selectedEmptyIssue && (
        <AddCoinModal
          isOpen={!!selectedEmptyIssue}
          onClose={() => setSelectedEmptyIssue(null)}
          denomination={denomination}
          series={series}
          issue={selectedEmptyIssue}
          ownerId={ownerId}
          onCoinSaved={(newCoin) => {
            setCoins(prev => [...prev, newCoin]);
            setSelectedEmptyIssue(null);
            if (newCoin?.facebook_status === 'ask_needed') {
              setFacebookPromptCoin(newCoin);
            }
          }}
        />
      )}

      {/* Edit Coin Modal */}
      {editingCoin && (
        <AddCoinModal
          isOpen={!!editingCoin}
          onClose={() => setEditingCoin(null)}
          denomination={denomination}
          series={series}
          issue={editingCoin.issue}
          ownerId={ownerId}
          editingCoin={editingCoin.coin}
          onCoinSaved={(updatedCoin) => {
            setCoins(prev => prev.map(c => (c.id === updatedCoin.id ? updatedCoin : c)));
            setEditingCoin(null);
          }}
        />
      )}

      {/* Coin Detail Modal (When clicking a filled slot with 1 coin) */}
      {selectedCoinDetail && (
        <CoinDetailModal
          isOpen={!!selectedCoinDetail}
          onClose={() => setSelectedCoinDetail(null)}
          coin={selectedCoinDetail.coin}
          denomination={denomination}
          series={series}
          issue={selectedCoinDetail.issue}
          isReadOnly={isReadOnly}
          onNavigateToUser={onViewUser}
          onEdit={() => {
            setEditingCoin(selectedCoinDetail);
            setSelectedCoinDetail(null);
          }}
          onDeleted={(deletedId) => {
            setCoins(prev => prev.filter(c => c.id !== deletedId));
            setSelectedCoinDetail(null);
          }}
        />
      )}

      {/* Multiple Coins Picker Modal (When slot has multiple individual coins) */}
      {multiplePicker && (
        <MultipleCoinsPickerModal
          isOpen={!!multiplePicker}
          onClose={() => setMultiplePicker(null)}
          issue={multiplePicker.issue}
          series={series}
          coins={multiplePicker.coins}
          isReadOnly={isReadOnly}
          onSelectCoin={(coin) => {
            setSelectedCoinDetail({ coin, issue: multiplePicker.issue });
            setMultiplePicker(null);
          }}
          onAddNewCoin={() => {
            setSelectedEmptyIssue(multiplePicker.issue);
            setMultiplePicker(null);
          }}
        />
      )}

      {/* Facebook Sharing Confirmation Prompt */}
      {facebookPromptCoin && (
        <FacebookSharingModal
          isOpen={!!facebookPromptCoin}
          onClose={() => setFacebookPromptCoin(null)}
          coin={facebookPromptCoin}
          userId={ownerId}
          onPosted={() => {
            // refresh data if needed
          }}
        />
      )}
    </div>
  );
};
