import React, { useState } from 'react';
import { NewsArticle, User } from '../../types.ts';
import { reactToNewsArticle, updateNewsArticle } from '../../utils/api.ts';
import {
  X,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  User as UserIcon,
  Tag,
  Coins,
  ShieldCheck,
  Flame,
  Award,
  Share2,
  Check,
  Sparkles,
  Edit2
} from 'lucide-react';

interface ArticleDetailModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onArticleUpdated?: (updated: NewsArticle) => void;
  onViewCoinSeries?: (seriesId: string) => void;
}

export function ArticleDetailModal({
  article,
  isOpen,
  onClose,
  currentUser,
  onArticleUpdated,
  onViewCoinSeries,
}: ArticleDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isAdminEditing, setIsAdminEditing] = useState(false);

  // Edit fields
  const [isBreaking, setIsBreaking] = useState(Boolean(article?.is_breaking));
  const [isFeatured, setIsFeatured] = useState(Boolean(article?.is_featured));
  const [category, setCategory] = useState(article?.category || 'U.S. Coins');

  if (!isOpen || !article) return null;

  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    if (!currentUser || isReacting) return;
    setIsReacting(true);
    try {
      const res = await reactToNewsArticle(article.id, currentUser.id, reactionType);
      const updated: NewsArticle = {
        ...article,
        likes_count: res.likes_count,
        dislikes_count: res.dislikes_count,
        user_reaction: res.user_reaction,
      };
      onArticleUpdated?.(updated);
    } catch (err) {
      console.error('Failed to react to article:', err);
    } finally {
      setIsReacting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(article.original_url || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAdmin = async () => {
    try {
      const updated = await updateNewsArticle(article.id, {
        is_breaking: isBreaking ? 1 : 0,
        is_featured: isFeatured ? 1 : 0,
        category,
      });
      onArticleUpdated?.({
        ...article,
        is_breaking: isBreaking ? 1 : 0,
        is_featured: isFeatured ? 1 : 0,
        category,
      });
      setIsAdminEditing(false);
    } catch (err) {
      console.error('Failed to update article:', err);
    }
  };

  const formattedDate = new Date(article.publication_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#241a13] via-[#1c140f] to-[#140e0a] border border-[#8f6d33]/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-[#5a4420]/60 flex items-center justify-between bg-[#19110b]/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#dfb86c]/20 border border-[#dfb86c]/50 text-[#dfb86c] uppercase tracking-wider">
              {article.category}
            </span>
            {Boolean(article.is_breaking) && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600/30 border border-rose-500 text-rose-300 flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 text-rose-400" />
                BREAKING
              </span>
            )}
            {Boolean(article.is_featured) && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300">
                FEATURED
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-xl bg-[#221710] hover:bg-[#2f2016] text-[#dfb86c] border border-[#5a4420]/50 transition-colors"
              title="Copy Story Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#281d15] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 scrollbar-thin">
          {/* Article Image Banner */}
          {article.image_url ? (
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#120b08] border border-[#5a4420]/60 shadow-lg">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 text-[11px] font-semibold text-[#f7eedd]/80 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                Source: {article.source_name}
              </div>
            </div>
          ) : (
            <div className="h-28 rounded-2xl bg-gradient-to-r from-[#2a1e15] to-[#1c130d] border border-[#5a4420]/60 flex items-center justify-center p-4">
              <div className="text-center space-y-1">
                <Coins className="w-8 h-8 text-[#dfb86c]/70 mx-auto" />
                <span className="text-xs font-serif font-bold text-[#dfb86c]">
                  PocketAlbum Numismatic Intelligence
                </span>
              </div>
            </div>
          )}

          {/* Title & Metadata */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-serif font-black text-[#f7eedd] leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#a89c8d] pt-1">
              <span className="font-bold text-[#dfb86c] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#dfb86c]" />
                {article.source_name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#8f6d33]" />
                {formattedDate}
              </span>
              {article.author && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate">
                    <UserIcon className="w-3 h-3 text-[#8f6d33]" />
                    {article.author}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Short Summary (AI strictly based on retrieved content) */}
          <div className="bg-[#18110c] p-4 sm:p-5 rounded-2xl border border-[#5a4420]/50 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#dfb86c] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Numismatic Summary</span>
            </div>
            <p className="text-xs sm:text-sm text-[#dfd4bf] leading-relaxed font-sans">
              {article.summary}
            </p>
          </div>

          {/* SECTION 10: RELATED POCKETALBUM COINS */}
          {article.related_series_details && article.related_series_details.length > 0 && (
            <div className="bg-gradient-to-r from-[#201610] to-[#18110c] p-4 rounded-2xl border border-[#8f6d33]/50 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#dfb86c] uppercase tracking-wider">
                <Coins className="w-4 h-4 text-[#dfb86c]" />
                <span>Related PocketAlbum Coins</span>
              </div>
              <p className="text-xs text-[#a89c8d]">
                This news mentions coin series documented in your PocketAlbum catalog:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {article.related_series_details.map((series) => (
                  <button
                    key={series.id}
                    onClick={() => {
                      onViewCoinSeries?.(series.id);
                      onClose();
                    }}
                    className="flex items-center justify-center text-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] font-serif font-extrabold text-xs shadow-md hover:from-[#fae19c] hover:to-[#dfb86c] transition-all cursor-pointer"
                  >
                    <span>{series.name}</span>
                    <span className="text-[10px] font-sans font-black bg-[#140e08]/20 px-1.5 py-0.5 rounded-md text-center">
                      VIEW IN POCKETALBUM
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="w-3 h-3 text-[#8f6d33]" />
              {article.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#1a120c] border border-[#3e2e18] text-[#a89c8d]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Publisher & Copyright Terms Notice */}
          <div className="text-[11px] text-[#7d6952] italic border-t border-[#3e2e18]/60 pt-3">
            Published originally by {article.source_name}. PocketAlbum displays concise factual excerpts and metadata under publisher fair use principles. To read the full copyrighted reporting, access the official story link below.
          </div>

          {/* Admin editing panel */}
          {Boolean(currentUser?.is_admin) && (
            <div className="border border-[#7a5c28]/40 bg-[#160f0b] p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-[#dfb86c] flex items-center gap-1">
                  <Edit2 className="w-3 h-3" />
                  Admin Article Controls
                </span>
                <button
                  onClick={() => setIsAdminEditing(!isAdminEditing)}
                  className="text-xs text-[#a89c8d] hover:text-[#f7eedd] underline"
                >
                  {isAdminEditing ? 'Close' : 'Edit Tags & Status'}
                </button>
              </div>

              {isAdminEditing && (
                <div className="space-y-2.5 pt-2 text-xs">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#dfd4bf]">
                      <input
                        type="checkbox"
                        checked={isBreaking}
                        onChange={(e) => setIsBreaking(e.target.checked)}
                        className="rounded"
                      />
                      <span>Breaking News</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[#dfd4bf]">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="rounded"
                      />
                      <span>Featured Article</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[#a89c8d] mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#1f1611] border border-[#5a4420]/60 text-[#f7eedd]"
                    >
                      <option value="U.S. Coins">U.S. Coins</option>
                      <option value="World">World</option>
                      <option value="Errors">Errors</option>
                      <option value="Varieties">Varieties</option>
                      <option value="VAM">VAM</option>
                      <option value="Auctions">Auctions</option>
                      <option value="Grading">Grading</option>
                      <option value="U.S. Mint">U.S. Mint</option>
                      <option value="Research">Research</option>
                      <option value="Paper Money">Paper Money</option>
                      <option value="Market">Market</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveAdmin}
                    className="px-3 py-1.5 rounded-lg bg-[#dfb86c] text-[#140e08] font-bold text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Reactions & Read Full Story */}
        <div className="px-5 py-4 border-t border-[#5a4420]/60 bg-[#160f0b]/90 flex items-center justify-between gap-3 shrink-0">
          {/* Reaction buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleReaction('like')}
              disabled={isReacting}
              className={`flex items-center justify-center text-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                article.user_reaction === 'like'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-[#1e1510] hover:bg-[#2b1e16] border-[#5a4420]/60 text-[#dfd4bf]'
              }`}
              title="Like this story"
            >
              <ThumbsUp
                className={`w-3.5 h-3.5 ${
                  article.user_reaction === 'like' ? 'fill-emerald-400 text-emerald-400' : ''
                }`}
              />
              <span>{article.likes_count || 0}</span>
            </button>

            <button
              onClick={() => handleReaction('dislike')}
              disabled={isReacting}
              className={`flex items-center justify-center text-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                article.user_reaction === 'dislike'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-md'
                  : 'bg-[#1e1510] hover:bg-[#2b1e16] border-[#5a4420]/60 text-[#dfd4bf]'
              }`}
              title="Dislike this story"
            >
              <ThumbsDown
                className={`w-3.5 h-3.5 ${
                  article.user_reaction === 'dislike' ? 'fill-rose-400 text-rose-400' : ''
                }`}
              />
              <span>{article.dislikes_count || 0}</span>
            </button>
          </div>

          {/* READ FULL STORY ACTION */}
          <a
            href={article.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] font-serif font-black text-xs shadow-md hover:from-[#fae19c] hover:to-[#dfb86c] transition-all cursor-pointer"
          >
            <span>READ FULL STORY</span>
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
          </a>
        </div>
      </div>
    </div>
  );
}
