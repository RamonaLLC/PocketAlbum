import React, { useState } from 'react';
import { Share2, X, Check, Globe, Sparkles, ShieldCheck } from 'lucide-react';
import { CollectionItem } from '../types.ts';
import { confirmFacebookCoinPost } from '../utils/api.ts';

interface FacebookSharingModalProps {
  isOpen: boolean;
  coin: CollectionItem | null;
  ownerId: string;
  onClose: () => void;
  onShared?: () => void;
}

export const FacebookSharingModal: React.FC<FacebookSharingModalProps> = ({
  isOpen,
  coin,
  ownerId,
  onClose,
  onShared
}) => {
  const [isPosting, setIsPosting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !coin) return null;

  const coinTitle = `${coin.year || ''} ${coin.mint ? coin.mint + ' ' : ''}${coin.series_name || coin.issue_name || 'Specimen'}`.trim();
  const gradeLabel = coin.condition_type === 'graded'
    ? `${coin.tpg ? coin.tpg + ' ' : ''}${coin.grade || 'Graded'}`
    : 'Raw / Ungraded Specimen';

  const handlePost = async () => {
    setIsPosting(true);
    setError(null);
    try {
      const res = await confirmFacebookCoinPost(coin.id, ownerId);
      if (res.success) {
        setSuccess(true);
        onShared?.();
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Failed to submit post to Facebook');
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting to Facebook');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div
      id="facebook-sharing-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="facebook-sharing-modal"
        className="bg-[#1a130e] border border-[#7a5c28] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)]"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 px-4 py-3.5 bg-[#231a14] border-b border-[#5a4420]/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-900/40 border border-blue-500/40 text-blue-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-[#f7eedd]">
                PocketAlbum Facebook Sharing
              </h3>
              <p className="text-[10px] text-[#a89c8d]">Official Community Page</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#2e2119] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="text-center space-y-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 border border-emerald-700 text-emerald-300">
              <Check className="w-3 h-3" /> Coin Safely Saved to Your Collection
            </span>
            <h4 className="text-base font-serif font-bold text-[#f7eedd] pt-1">
              Share this coin on the PocketAlbum Facebook Page?
            </h4>
            <p className="text-xs text-[#dfd4bf]/80">
              Showcase your recent numismatic acquisition with fellow collectors across the community.
            </p>
          </div>

          {/* Coin Preview Card */}
          <div className="p-3 bg-[#140e0a] border border-[#7a5c28]/40 rounded-xl flex items-center gap-3">
            {coin.main_photo ? (
              <img
                src={coin.main_photo}
                alt={coinTitle}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-lg object-cover border border-[#dfb86c]/40 shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[#241a13] border border-[#5a4420] flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-[#a89c8d]" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-serif font-bold text-[#f7eedd] truncate">
                {coinTitle}
              </div>
              <div className="text-[11px] text-[#dfb86c] font-semibold truncate">
                {gradeLabel}
              </div>
              <div className="text-[10px] text-[#a89c8d] truncate">
                Album: {coin.series_name || 'My Collection'}
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-2.5 bg-blue-950/20 border border-blue-800/40 rounded-xl flex items-start gap-2 text-[11px] text-blue-200/90">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Your private personal information (email, phone, private notes) is <strong>never</strong> shared. Only your public username, coin title, grade, and photos are posted.
            </span>
          </div>

          {error && (
            <div className="p-2.5 bg-red-950/50 border border-red-800 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center justify-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-[#dfb86c]" /> Scheduled for Facebook Community Publishing!
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#1e1510] border-t border-[#5a4420]/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPosting}
            className="px-4 py-2 text-xs font-bold text-[#dfd4bf] hover:text-white bg-[#140e0a] hover:bg-[#251b14] border border-[#5a4420] rounded-xl transition-all"
          >
            NOT NOW
          </button>
          <button
            type="button"
            onClick={handlePost}
            disabled={isPosting || success}
            className="px-4 py-2 text-xs font-black bg-gradient-to-r from-[#1877F2] to-[#0d5ec4] hover:from-[#2884ff] hover:to-[#1877F2] text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all disabled:opacity-50"
          >
            <Share2 className="w-3.5 h-3.5" />
            {isPosting ? 'POSTING...' : 'POST TO FACEBOOK'}
          </button>
        </div>
      </div>
    </div>
  );
};
