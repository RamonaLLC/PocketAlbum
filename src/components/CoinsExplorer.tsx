import React, { useState, useEffect } from 'react';
import { Denomination, CoinSeries } from '../types.ts';
import { fetchDenominations, fetchSeriesByDenomination, fetchSeriesById } from '../utils/api.ts';
import { CoinAlbum } from './CoinAlbum.tsx';
import { Coins, ChevronRight, Sparkles, Layers } from 'lucide-react';

interface CoinsExplorerProps {
  ownerId?: string;
  userId?: string;
  isReadOnly?: boolean;
  onCollectionUpdated?: () => void;
  forceDenominationId?: string;
  categoryTitle?: string;
  categorySubtitle?: string;
  targetSeriesId?: string | null;
  onClearTargetSeries?: () => void;
}

export const CoinsExplorer: React.FC<CoinsExplorerProps> = ({
  ownerId,
  userId,
  isReadOnly = false,
  onCollectionUpdated,
  forceDenominationId,
  categoryTitle,
  categorySubtitle,
  targetSeriesId,
  onClearTargetSeries
}) => {
  const effectiveOwnerId = ownerId || userId || '';
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [selectedDenom, setSelectedDenom] = useState<Denomination | null>(null);
  const [seriesList, setSeriesList] = useState<CoinSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<CoinSeries | null>(null);
  const [loadingDenoms, setLoadingDenoms] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(false);

  // Load denominations on mount
  useEffect(() => {
    fetchDenominations()
      .then(data => {
        if (forceDenominationId) {
          const match = data.find(d => d.id === forceDenominationId);
          if (match) {
            setDenominations([match]);
            setSelectedDenom(match);
          } else {
            setDenominations(data);
            setSelectedDenom(data[0]);
          }
        } else {
          // Regular coinage: exclude commemoratives so it has its own dedicated top-level category
          const regularDenoms = data.filter(d => d.id !== 'denom_commem');
          setDenominations(regularDenoms);
          const cents = regularDenoms.find(d => d.name === 'One Cent' || d.name === 'Cents') || regularDenoms[0];
          if (cents) {
            setSelectedDenom(cents);
          }
        }
      })
      .catch(err => console.error('Failed to fetch denominations:', err))
      .finally(() => setLoadingDenoms(false));
  }, [forceDenominationId]);

  // When targetSeriesId is specified, directly navigate to that series album
  useEffect(() => {
    if (!targetSeriesId) return;

    let isMounted = true;
    fetchSeriesById(targetSeriesId)
      .then(async (target) => {
        if (!isMounted || !target) return;
        const denoms = denominations.length > 0 ? denominations : await fetchDenominations();
        const parentDenom = denoms.find(d => d.id === target.denomination_id);
        if (parentDenom) {
          setSelectedDenom(parentDenom);
          setSelectedSeries(target);
        }
      })
      .catch((err) => {
        console.error('Failed to resolve target series for navigation:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [targetSeriesId, denominations]);

  // When selected denomination changes, fetch its series
  useEffect(() => {
    if (!selectedDenom) return;
    setLoadingSeries(true);
    // Only reset selectedSeries if it doesn't match the new denomination
    if (selectedSeries && selectedSeries.denomination_id !== selectedDenom.id) {
      setSelectedSeries(null);
    }

    fetchSeriesByDenomination(selectedDenom.id)
      .then(data => setSeriesList(data))
      .catch(err => console.error('Failed to fetch series:', err))
      .finally(() => setLoadingSeries(false));
  }, [selectedDenom?.id]);

  // If a series is selected, show the interactive album!
  if (selectedSeries && selectedDenom) {
    return (
      <CoinAlbum
        series={selectedSeries}
        denomination={selectedDenom}
        ownerId={effectiveOwnerId}
        isReadOnly={isReadOnly}
        onBackToSeriesList={() => {
          setSelectedSeries(null);
          onClearTargetSeries?.();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Denominations: Bubble-style selection boxes (or Commemoratives header) */}
      <div className="bg-gradient-to-b from-[#241a13] via-[#1c140f] to-[#140e0a] border border-[#7a5c28]/45 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/80">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-serif font-bold uppercase tracking-wider text-[#dfb86c] flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#dfb86c]" />
              {categoryTitle || 'Select Denomination'}
            </h2>
            <p className="text-xs text-[#a89c8d] mt-0.5">
              {categorySubtitle || 'Choose a coin denomination to explore official Albums!'}
            </p>
          </div>
          {selectedDenom && !forceDenominationId && (
            <span className="text-xs font-semibold px-3 py-1 bg-[#281c14] text-[#dfb86c] border border-[#7a5c28]/60 rounded-full shadow-sm">
              Active: {selectedDenom.name}
            </span>
          )}
        </div>

        {/* If this is NOT a forced single category like Commemoratives, display denomination selector */}
        {!forceDenominationId && (
          loadingDenoms ? (
            <div className="py-6 text-center text-xs text-[#a89c8d]">Loading denominations...</div>
          ) : (
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {denominations.map((denom) => {
                const isSelected = selectedDenom?.id === denom.id;
                return (
                  <button
                    key={denom.id}
                    onClick={() => setSelectedDenom(denom)}
                    className={`group relative px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] border-[#fae19c] text-[#140e08] shadow-[#dfb86c]/20 shadow-md font-bold scale-102'
                        : 'bg-[#18120d] border-[#5a4420]/50 text-[#dfd4bf] hover:text-[#fae19c] hover:border-[#7a5c28] hover:bg-[#231a14]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border transition-colors ${
                        isSelected
                          ? 'bg-[#140e08] text-[#dfb86c] border-[#8f6d33]'
                          : 'bg-[#281c14] text-[#a89c8d] border-[#5a4420]/60 group-hover:border-[#dfb86c] group-hover:text-[#fae19c]'
                      }`}
                    >
                      {denom.icon_label || '$'}
                    </span>
                    <span>{denom.name}</span>
                  </button>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Series Grid belonging to the selected Denomination */}
      {selectedDenom && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#f7eedd] flex items-center gap-2 tracking-wide">
                <Layers className="w-4 h-4 text-[#dfb86c]" />
                {selectedDenom.name} Series
              </h3>
              <p className="text-xs text-[#a89c8d]">
                Click any coin series to open its official interactive album
              </p>
            </div>
            <span className="text-xs text-[#a89c8d] font-medium bg-[#1a130e] px-2.5 py-1 rounded-lg border border-[#5a4420]/50">
              {seriesList.length} Series
            </span>
          </div>

          {loadingSeries ? (
            <div className="py-12 text-center text-xs text-[#a89c8d]">
              <div className="inline-block w-6 h-6 border-2 border-[#dfb86c] border-t-transparent rounded-full animate-spin mb-2" />
              <p>Loading coin series...</p>
            </div>
          ) : seriesList.length === 0 ? (
            <div className="py-12 text-center text-[#a89c8d] text-xs bg-[#16110d] rounded-2xl border border-[#5a4420]/40">
              No series found for this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {seriesList.map((series) => {
                const yearRange = `${series.start_year}–${series.end_year > 2024 ? 'Present' : series.end_year}`;
                return (
                  <button
                    key={series.id}
                    onClick={() => setSelectedSeries(series)}
                    className="group text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#261c15] via-[#1f1610] to-[#17100b] hover:from-[#31241b] hover:to-[#221811] border border-[#7a5c28]/45 hover:border-[#dfb86c]/80 shadow-lg shadow-black/70 hover:shadow-[#dfb86c]/10 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-[#dfb86c] tracking-wider">
                          {yearRange}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-[#18110b] border border-[#7a5c28]/40 group-hover:bg-[#dfb86c]/20 group-hover:text-[#fae19c] flex items-center justify-center text-[#a89c8d] transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <h4 className="text-sm sm:text-base font-serif font-bold text-[#f7eedd] group-hover:text-[#fae19c] transition-colors line-clamp-2">
                        {series.name}
                      </h4>

                      <p className="text-xs text-[#a89c8d] mt-1 line-clamp-1">
                        {series.pcgs_reference_name}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#7a5c28]/30 flex items-center justify-between text-xs text-[#a89c8d] group-hover:text-[#dfb86c] font-medium">
                      <span>Open Album</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#dfb86c] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
