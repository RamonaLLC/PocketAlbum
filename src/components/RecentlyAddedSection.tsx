import React, { useState, useEffect, useCallback } from 'react';
import { CollectionItem, CoinIssue, CoinSeries, Denomination } from '../types.ts';
import { fetchRecentlyAdded } from '../utils/api.ts';
import { CoinDetailModal } from './CoinDetailModal.tsx';
import { AddCoinModal } from './AddCoinModal.tsx';
import { Clock, ChevronDown, ChevronUp, Sparkles, Award, ShieldAlert, Calendar, Eye, ZoomIn } from 'lucide-react';

interface RecentlyAddedSectionProps {
  userId: string;
  currentUserId?: string;
  isCollectionPrivate?: boolean;
  onCoinClick?: (coin: CollectionItem) => void;
  onCoinSaved?: (coin: CollectionItem) => void;
  onCoinDeleted?: (coinId: string) => void;
  onCollectionUpdated?: () => void;
  refreshKey?: number | string;
}

export const RecentlyAddedSection: React.FC<RecentlyAddedSectionProps> = ({
  userId,
  currentUserId,
  isCollectionPrivate = false,
  onCoinClick,
  onCoinSaved,
  onCoinDeleted,
  onCollectionUpdated,
  refreshKey,
}) => {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoinForDetail, setSelectedCoinForDetail] = useState<CollectionItem | null>(null);
  const [editingCoin, setEditingCoin] = useState<CollectionItem | null>(null);

  const isOwner = currentUserId === userId;
  const isBlocked = isCollectionPrivate && !isOwner;

  const loadData = useCallback(async () => {
    if (isBlocked) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecentlyAdded(userId, 50, currentUserId);
      setItems(data);
    } catch (err: any) {
      console.error('Failed to load recently added coins:', err);
      setError(err.message || 'Failed to load recent acquisitions');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUserId, isBlocked]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleCardClick = (coin: CollectionItem) => {
    setSelectedCoinForDetail(coin);
    if (onCoinClick) {
      onCoinClick(coin);
    }
  };

  if (isBlocked) {
    return (
      <div className="rounded-2xl bg-gradient-to-b from-[#231a14] to-[#18120d] border border-[#7a5c28]/40 p-6 text-center shadow-xl shadow-black/70 my-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#1b130e] border border-[#8f6d33]/40 flex items-center justify-center text-[#cba153]">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-base sm:text-lg text-[#f7eedd] tracking-wide">
          Private Collection
        </h3>
        <p className="text-xs sm:text-sm text-[#a89c8d] mt-1 max-w-md mx-auto">
          This collector has marked their collection and acquisitions private.
        </p>
      </div>
    );
  }

  const displayedItems = showAll ? items : items.slice(0, 6);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Helper fallback objects for editing
  const editingIssue: CoinIssue | null = editingCoin ? (editingCoin.issue || {
    id: editingCoin.issue_id,
    series_id: (editingCoin as any).series_id || '',
    year: editingCoin.year || 0,
    mint: editingCoin.mint || '',
    mint_mark: editingCoin.mint_mark || '',
    issue_name: editingCoin.issue_name || 'Specimen',
    composition: editingCoin.composition,
    weight_grams: (editingCoin as any).weight_grams,
    diameter_mm: (editingCoin as any).diameter_mm,
    mintage: (editingCoin as any).mintage,
    display_order: 0,
    active: 1,
  }) : null;

  const editingSeries: CoinSeries | null = editingCoin ? (editingCoin.series || {
    id: (editingCoin as any).series_id || '',
    denomination_id: (editingCoin as any).denomination_id || '',
    name: editingCoin.series_name || 'Coin Series',
    pcgs_reference_name: '',
    start_year: editingCoin.year || 0,
    end_year: editingCoin.year || 0,
    display_order: 0,
    active: 1,
  }) : null;

  const editingDenom: Denomination | null = editingCoin ? (editingCoin.denomination || {
    id: (editingCoin as any).denomination_id || '',
    name: editingCoin.denomination_name || 'United States Coinage',
    category: 'Coinage',
    display_order: 0,
    active: 1,
  }) : null;

  return (
    <section className="my-6">
      {/* Header with vintage numismatic banner styling */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[#8f6d33]/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2c2017] border border-[#8f6d33]/50 flex items-center justify-center text-[#dfb86c] shadow-md shadow-black/40">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-[#f7eedd] flex items-center gap-2">
              Recently Added
              <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-[#2a1e15] border border-[#8f6d33]/60 text-[#dfb86c]">
                {items.length}
              </span>
            </h2>
            <p className="text-xs text-[#a89c8d]">
              Newest coin acquisitions &bull; Click any coin to inspect full photos & details
            </p>
          </div>
        </div>

        {items.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#dfb86c] bg-gradient-to-b from-[#2d2119] to-[#1e1510] hover:from-[#38291f] hover:to-[#261b14] border border-[#8f6d33]/70 hover:border-[#dfb86c] rounded-xl shadow-md transition-all self-end sm:self-auto cursor-pointer"
          >
            {showAll ? (
              <>
                Show Less <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                View All ({items.length}) <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-[#231a14]/60 border border-[#7a5c28]/30 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-[#2a1414]/70 border border-red-900/50 text-xs text-red-300">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-gradient-to-b from-[#231a14] to-[#18120d] border border-[#7a5c28]/40 p-8 text-center shadow-lg shadow-black/60">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#1c140e] border border-[#8f6d33]/40 flex items-center justify-center text-[#a89c8d]">
            <Sparkles className="w-6 h-6 text-[#cba153]" />
          </div>
          <h3 className="font-serif text-base text-[#f7eedd]">No Coins Added Yet</h3>
          <p className="text-xs text-[#a89c8d] mt-1 max-w-sm mx-auto">
            {isOwner
              ? 'Add coins from your virtual albums to see your newest additions featured here.'
              : 'This collector has not added any coins to their collection yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedItems.map(coin => {
            const photoUrl = coin.main_photo || (coin.photos && coin.photos.length > 0 ? coin.photos[0].photo_url : '');
            const coinTitle = coin.issue_name || `${coin.year || ''} ${coin.series_name || 'Specimen'}`;
            const mintLabel = coin.mint && coin.mint !== 'P' && coin.mint !== 'No Mint Mark' ? `(${coin.mint})` : '';

            return (
              <div
                key={coin.id}
                onClick={() => handleCardClick(coin)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(coin);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${coinTitle}`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#261c15] to-[#1c140e] border border-[#7a5c28]/45 hover:border-[#dfb86c] shadow-lg shadow-black/70 hover:shadow-2xl hover:shadow-[#dfb86c]/15 p-3 flex items-center gap-3 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#dfb86c]/50"
              >
                {/* Subtle vintage gold corner stitch */}
                <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#cba153]/30 pointer-events-none group-hover:border-[#dfb86c] transition-colors" />

                {/* Coin Photo / Round Specimen View with zoom overlay */}
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 shrink-0 rounded-full overflow-hidden bg-[#120d09] border-2 border-[#8f6d33]/60 group-hover:border-[#dfb86c] shadow-md shadow-black/80 flex items-center justify-center">
                  {photoUrl ? (
                    <>
                      <img
                        src={photoUrl}
                        alt={coinTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#fae19c]">
                        <ZoomIn className="w-4 h-4 drop-shadow" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1">
                      <span className="text-xs font-serif font-bold text-[#dfb86c]">
                        {coin.year || 'US'}
                      </span>
                      <span className="text-[9px] text-[#a89c8d] uppercase tracking-wider">
                        {coin.mint || 'COIN'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Coin Information */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-mono font-bold text-[#dfb86c]">
                      {coin.year} {mintLabel}
                    </span>
                    {coin.condition_type === 'graded' && coin.grade ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-bold text-[#fae19c] bg-[#3a2818] border border-[#cba153]/70 rounded">
                        <Award className="w-2.5 h-2.5 text-[#dfb86c]" />
                        {coin.tpg ? `${coin.tpg} ` : ''}{coin.grade}
                      </span>
                    ) : coin.grade ? (
                      <span className="px-1.5 py-0.2 text-[10px] font-semibold text-[#d8cdb9] bg-[#221811] border border-[#6b4f23]/60 rounded">
                        {coin.grade}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 text-[10px] font-medium text-[#a89c8d] bg-[#1a130e] border border-[#4d3a1c]/50 rounded">
                        Raw
                      </span>
                    )}

                    {/* Interactive "Inspect" pill that appears on hover */}
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-flex items-center gap-1 text-[10px] font-serif font-semibold text-[#fae19c] bg-[#2a1d13] px-1.5 py-0.5 rounded border border-[#dfb86c]/50">
                      <Eye className="w-2.5 h-2.5" />
                      View
                    </span>
                  </div>

                  <h4 className="font-serif text-sm font-semibold text-[#f7eedd] truncate group-hover:text-[#faefe0] mt-0.5">
                    {coinTitle}
                  </h4>

                  <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-[#a89c8d]">
                    <span className="truncate text-[#b8ab97]">
                      {coin.series_name || coin.denomination_name || 'US Coinage'}
                    </span>
                    <span className="inline-flex items-center gap-1 shrink-0 text-[10px] text-[#8e8170]">
                      <Calendar className="w-2.5 h-2.5 text-[#8f6d33]" />
                      {formatDate(coin.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coin Detail Modal (When user clicks any recently added coin) */}
      {selectedCoinForDetail && (
        <CoinDetailModal
          isOpen={!!selectedCoinForDetail}
          onClose={() => setSelectedCoinForDetail(null)}
          coin={selectedCoinForDetail}
          isReadOnly={!isOwner}
          backLabel="Back to Collection"
          onEdit={() => {
            setEditingCoin(selectedCoinForDetail);
            setSelectedCoinForDetail(null);
          }}
          onDeleted={(deletedId) => {
            setItems(prev => prev.filter(c => c.id !== deletedId));
            setSelectedCoinForDetail(null);
            if (onCoinDeleted) onCoinDeleted(deletedId);
            if (onCollectionUpdated) onCollectionUpdated();
          }}
        />
      )}

      {/* Add / Edit Coin Modal if owner chooses to edit from detail view */}
      {editingCoin && editingIssue && editingSeries && editingDenom && (
        <AddCoinModal
          isOpen={!!editingCoin}
          onClose={() => setEditingCoin(null)}
          denomination={editingDenom}
          series={editingSeries}
          issue={editingIssue}
          ownerId={userId}
          editingCoin={editingCoin}
          onCoinSaved={(updatedCoin) => {
            setItems(prev => prev.map(c => (c.id === updatedCoin.id ? { ...c, ...updatedCoin } : c)));
            setEditingCoin(null);
            if (onCoinSaved) onCoinSaved(updatedCoin);
            if (onCollectionUpdated) onCollectionUpdated();
          }}
        />
      )}
    </section>
  );
};
