import React from 'react';
import { CollectionItem, CoinIssue, CoinSeries } from '../types.ts';
import { X, Plus, Sparkles, Award } from 'lucide-react';

interface MultipleCoinsPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: CoinIssue;
  series: CoinSeries;
  coins: CollectionItem[];
  onSelectCoin: (coin: CollectionItem) => void;
  onAddNewCoin: () => void;
  isReadOnly?: boolean;
}

export const MultipleCoinsPickerModal: React.FC<MultipleCoinsPickerModalProps> = ({
  isOpen,
  onClose,
  issue,
  series,
  coins,
  onSelectCoin,
  onAddNewCoin,
  isReadOnly = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#19110b] border-b border-[#7a5c28]/40 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#f7eedd] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#dfb86c]" />
              Multiple Specimens for {issue.issue_name}
            </h3>
            <p className="text-xs text-[#a89c8d]">
              {series.name} • {coins.length} individual examples in this slot
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#a89c8d] hover:text-[#f7eedd] p-1.5 rounded-lg hover:bg-[#251a13] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of coins */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {coins.map((coin, index) => (
            <div
              key={coin.id}
              onClick={() => onSelectCoin(coin)}
              className="group flex items-center gap-4 p-3.5 bg-[#1a130e] hover:bg-[#281c14] border border-[#5a4420]/50 hover:border-[#dfb86c] rounded-xl cursor-pointer transition-all shadow-sm"
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-full overflow-hidden bg-[#120d09] border-2 border-[#7a5c28]/60 shrink-0 shadow-inner flex items-center justify-center">
                <img
                  src={coin.main_photo}
                  alt={`${issue.issue_name} Example ${index + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-serif font-bold text-[#f7eedd] truncate">
                    Specimen #{index + 1}: {issue.issue_name}
                  </h4>
                  {coin.condition_type === 'graded' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-serif font-bold bg-[#dfb86c]/20 text-[#fae19c] border border-[#dfb86c]/40">
                      <Award className="w-3 h-3 text-[#dfb86c]" />
                      {coin.tpg} {coin.grade}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-serif font-medium bg-[#241a13] text-[#dfd4bf] border border-[#5a4420]/40">
                      Raw
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-[#a89c8d]">
                  <span>Variety: {coin.variety_name || 'Normal Strike'}</span>
                  {coin.photos && coin.photos.length > 1 && (
                    <span>• {coin.photos.length} photos</span>
                  )}
                </div>
                {coin.notes && (
                  <p className="text-xs text-[#a89c8d] truncate mt-0.5 italic">
                    "{coin.notes}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-[#120d09] border-t border-[#5a4420]/30 px-6 py-3 flex items-center justify-between">
          {!isReadOnly ? (
            <button
              onClick={() => {
                onClose();
                onAddNewCoin();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-serif font-bold text-[#fae19c] bg-gradient-to-r from-[#dfb86c]/20 to-[#b88c3a]/20 hover:from-[#dfb86c]/30 hover:to-[#b88c3a]/30 border border-[#dfb86c]/50 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#dfb86c]" />
              Add Another Specimen to this Slot
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-serif font-semibold text-[#dfd4bf] hover:text-[#f7eedd] hover:bg-[#241a13] rounded-xl transition-colors cursor-pointer border border-[#5a4420]/40"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
