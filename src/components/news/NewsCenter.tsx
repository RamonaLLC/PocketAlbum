import React, { useState, useEffect } from 'react';
import { NewsArticle, User } from '../../types.ts';
import { fetchNewsArticles, reactToNewsArticle } from '../../utils/api.ts';
import { ArticleDetailModal } from './ArticleDetailModal.tsx';
import { NewsSourceManagerModal } from './NewsSourceManagerModal.tsx';
import { ManualArticleModal } from './ManualArticleModal.tsx';
import {
  Newspaper,
  Search,
  Flame,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Coins,
  ShieldCheck,
  Calendar,
  Radio,
  Plus,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';

interface NewsCenterProps {
  currentUser: User | null;
  onNavigateToSeries?: (seriesId: string) => void;
}

const CATEGORIES = [
  'All',
  'U.S. Coins',
  'World',
  'Errors',
  'Varieties',
  'VAM',
  'Auctions',
  'Grading',
  'U.S. Mint',
  'Research',
  'Paper Money',
  'Market',
] as const;

export function NewsCenter({ currentUser, onNavigateToSeries }: NewsCenterProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'breaking'>('latest');

  // Modals
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isSourceManagerOpen, setIsSourceManagerOpen] = useState(false);
  const [isManualImportOpen, setIsManualImportOpen] = useState(false);

  // Reaction lock
  const [reactingArticleId, setReactingArticleId] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, [selectedCategory, sortBy, currentUser?.id]);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await fetchNewsArticles({
        category: selectedCategory,
        q: searchQuery,
        sort: sortBy,
        current_user_id: currentUser?.id,
      });
      setArticles(data);
    } catch (err) {
      console.error('Failed to load news articles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadArticles();
  };

  const handleReaction = async (article: NewsArticle, reactionType: 'like' | 'dislike', e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUser || reactingArticleId === article.id) return;
    setReactingArticleId(article.id);
    try {
      const res = await reactToNewsArticle(article.id, currentUser.id, reactionType);
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id
            ? {
                ...a,
                likes_count: res.likes_count,
                dislikes_count: res.dislikes_count,
                user_reaction: res.user_reaction,
              }
            : a
        )
      );
      if (selectedArticle && selectedArticle.id === article.id) {
        setSelectedArticle({
          ...selectedArticle,
          likes_count: res.likes_count,
          dislikes_count: res.dislikes_count,
          user_reaction: res.user_reaction,
        });
      }
    } catch (err) {
      console.error('Failed to react:', err);
    } finally {
      setReactingArticleId(null);
    }
  };

  // Breaking / Featured separation
  const breakingArticles = articles.filter((a) => Boolean(a.is_breaking));
  const featuredArticle = articles.find((a) => Boolean(a.is_featured)) || articles[0];
  const regularArticles = articles.filter(
    (a) => a.id !== featuredArticle?.id || selectedCategory !== 'All' || searchQuery
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Title */}
      <div className="bg-gradient-to-r from-[#241a13] via-[#1c140f] to-[#241a13] border border-[#7a5c28]/60 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-serif font-black tracking-widest bg-[#dfb86c]/20 border border-[#dfb86c]/50 text-[#dfb86c] uppercase">
                Official Numismatic Intelligence
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Ingestion Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#f7eedd] tracking-tight flex items-center gap-2.5">
              <Newspaper className="w-7 h-7 text-[#dfb86c] shrink-0" />
              <span>PocketAlbum News Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#a89c8d] max-w-2xl leading-relaxed">
              Real-time dispatches from the United States Mint, American Numismatic Society, top auction venues, and certified grading authorities.
            </p>
          </div>

          {/* Admin Controls */}
          {Boolean(currentUser?.is_admin) && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => setIsSourceManagerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b130e] hover:bg-[#271b14] border border-[#8f6d33]/80 text-[#dfb86c] text-xs font-bold transition-all shadow cursor-pointer"
                title="Manage News Feeds, Endpoints, and Connections"
              >
                <Radio className="w-3.5 h-3.5 text-[#dfb86c]" />
                <span>News Sources</span>
              </button>

              <button
                onClick={() => setIsManualImportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] text-xs font-black shadow-md hover:from-[#fae19c] hover:to-[#dfb86c] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Import Story</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-3">
        {/* Row A: Search Input & Sort Selector */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8f6d33]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news by keyword, coin series, mint, or variety..."
              className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-[#18110c] border border-[#5a4420]/60 text-xs sm:text-sm text-[#f7eedd] placeholder-[#7d6952] focus:outline-none focus:border-[#dfb86c] shadow-inner"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadArticles();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a89c8d] hover:text-[#dfb86c] font-bold"
              >
                Clear
              </button>
            ) : (
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl bg-[#281d15] hover:bg-[#34261c] text-[#dfb86c] text-xs font-bold border border-[#5a4420]/40 transition-colors"
              >
                Search
              </button>
            )}
          </form>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-[#18110c] p-1 rounded-2xl border border-[#5a4420]/40">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center text-center ${
                sortBy === 'latest'
                  ? 'bg-[#dfb86c] text-[#140e08] font-black shadow-sm'
                  : 'text-[#a89c8d] hover:text-[#f7eedd]'
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center text-center ${
                sortBy === 'popular'
                  ? 'bg-[#dfb86c] text-[#140e08] font-black shadow-sm'
                  : 'text-[#a89c8d] hover:text-[#f7eedd]'
              }`}
            >
              Most Popular
            </button>
            <button
              onClick={() => setSortBy('breaking')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center text-center ${
                sortBy === 'breaking'
                  ? 'bg-[#dfb86c] text-[#140e08] font-black shadow-sm'
                  : 'text-[#a89c8d] hover:text-[#f7eedd]'
              }`}
            >
              Breaking
            </button>
          </div>
        </div>

        {/* Row B: Category Pills (exact 12 categories from prompt) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center justify-center text-center ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md shadow-[#dfb86c]/20 font-black border border-[#fae19c]'
                  : 'bg-[#18110c]/90 text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#241a13] border border-[#5a4420]/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. BREAKING NEWS BANNER (if any breaking article exists) */}
      {breakingArticles.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/70 via-[#261010] to-rose-950/70 border border-rose-600/70 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
              <Flame className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-serif uppercase tracking-widest text-rose-300 font-extrabold block">
                Breaking Numismatic Alert
              </span>
              <p className="text-xs sm:text-sm font-bold text-rose-100 truncate">
                {breakingArticles[0].title}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedArticle(breakingArticles[0])}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            Read Alert
          </button>
        </div>
      )}

      {/* 4. FEATURED STORY (when viewing All and no search) */}
      {selectedCategory === 'All' && !searchQuery && featuredArticle && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#dfb86c] uppercase tracking-wider">
            <Award className="w-4 h-4 text-[#dfb86c]" />
            <span>Featured Numismatic Story</span>
          </div>

          <div
            onClick={() => setSelectedArticle(featuredArticle)}
            className="group bg-gradient-to-br from-[#241a13] via-[#1a120c] to-[#120b08] border border-[#8f6d33]/80 hover:border-[#dfb86c] rounded-3xl p-5 sm:p-6 shadow-xl transition-all cursor-pointer space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {featuredArticle.image_url ? (
                <div className="md:col-span-5 rounded-2xl overflow-hidden aspect-video md:aspect-[4/3] bg-[#140e0a] border border-[#5a4420]/60 relative">
                  <img
                    src={featuredArticle.image_url}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black shadow">
                    FEATURED
                  </div>
                </div>
              ) : (
                <div className="md:col-span-5 rounded-2xl bg-gradient-to-br from-[#2c2017] to-[#1a120c] border border-[#5a4420]/60 aspect-video md:aspect-[4/3] flex items-center justify-center p-4">
                  <Coins className="w-12 h-12 text-[#dfb86c]/60" />
                </div>
              )}

              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-serif font-black bg-[#dfb86c]/20 border border-[#dfb86c]/50 text-[#dfb86c] uppercase">
                    {featuredArticle.category}
                  </span>
                  <span className="text-xs text-[#a89c8d] font-bold">
                    {featuredArticle.source_name}
                  </span>
                  <span className="text-[#5a4420]">•</span>
                  <span className="text-xs text-[#a89c8d]">
                    {new Date(featuredArticle.publication_date).toLocaleDateString()}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-black text-[#f7eedd] group-hover:text-[#fae19c] transition-colors leading-tight">
                  {featuredArticle.title}
                </h2>

                <p className="text-xs sm:text-sm text-[#dfd4bf] leading-relaxed line-clamp-3">
                  {featuredArticle.summary}
                </p>

                {/* Related Series chip if present */}
                {featuredArticle.related_series_details && featuredArticle.related_series_details.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[11px] font-serif font-bold text-[#dfb86c]">
                      Related PocketAlbum Coins:
                    </span>
                    {featuredArticle.related_series_details.map((s) => (
                      <button
                        key={s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToSeries?.(s.id);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] font-bold text-xs shadow hover:from-[#fae19c] hover:to-[#dfb86c] transition-all cursor-pointer text-center"
                      >
                        <span>{s.name}</span>
                        <span className="text-[9px] font-black bg-[#140e08]/20 px-1.5 py-0.5 rounded text-center">
                          VIEW IN POCKETALBUM
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-[#3e2e18]/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleReaction(featuredArticle, 'like', e)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        featuredArticle.user_reaction === 'like'
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                          : 'bg-[#18110c] hover:bg-[#261a12] border-[#5a4420]/60 text-[#dfd4bf]'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${featuredArticle.user_reaction === 'like' ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                      <span>{featuredArticle.likes_count || 0}</span>
                    </button>

                    <button
                      onClick={(e) => handleReaction(featuredArticle, 'dislike', e)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        featuredArticle.user_reaction === 'dislike'
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                          : 'bg-[#18110c] hover:bg-[#261a12] border-[#5a4420]/60 text-[#dfd4bf]'
                      }`}
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${featuredArticle.user_reaction === 'dislike' ? 'fill-rose-400 text-rose-400' : ''}`} />
                      <span>{featuredArticle.dislikes_count || 0}</span>
                    </button>
                  </div>

                  <span className="flex items-center gap-1 text-xs font-serif font-black text-[#dfb86c] group-hover:translate-x-1 transition-transform">
                    <span>READ FULL STORY</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. LATEST NEWS LIST / GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#5a4420]/40 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#dfb86c]" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#f7eedd]">
              {selectedCategory === 'All' ? 'Latest Numismatic News' : `${selectedCategory} News`}
            </h2>
            <span className="text-xs text-[#a89c8d]">({articles.length} stories)</span>
          </div>

          <button
            onClick={loadArticles}
            className="flex items-center gap-1 text-xs text-[#a89c8d] hover:text-[#dfb86c] transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#dfb86c] animate-spin mx-auto" />
            <p className="text-xs text-[#a89c8d]">Ingesting and loading numismatic dispatches...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="py-16 text-center space-y-3 border border-dashed border-[#5a4420]/60 rounded-3xl p-6 bg-[#160f0b]/40">
            <Newspaper className="w-10 h-10 text-[#8f6d33] mx-auto opacity-70" />
            <h3 className="text-base font-serif font-bold text-[#dfd4bf]">
              No articles found in this category
            </h3>
            <p className="text-xs text-[#a89c8d] max-w-sm mx-auto">
              Try switching categories, clearing your search query, or fetch the latest feeds from the News Source Manager.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-[#251b14] hover:bg-[#322319] text-[#dfb86c] text-xs font-bold border border-[#7a5c28]/60 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regularArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="group bg-gradient-to-b from-[#1f150f] to-[#160e0a] border border-[#5a4420]/60 hover:border-[#8f6d33] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all shadow-md hover:shadow-xl cursor-pointer"
              >
                {/* Top: Image & Header info */}
                <div className="space-y-3">
                  {article.image_url && (
                    <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-[#120b08] border border-[#3e2e18]/60">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-serif font-bold bg-[#140e08]/90 text-[#dfb86c] border border-[#dfb86c]/30">
                        {article.category}
                      </div>
                    </div>
                  )}

                  {/* Headline & Source */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-[#a89c8d]">
                      <span className="font-bold text-[#dfb86c] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#dfb86c]" />
                        {article.source_name}
                      </span>
                      <span>•</span>
                      <span>{new Date(article.publication_date).toLocaleDateString()}</span>
                    </div>

                    <h3 className="text-sm sm:text-base font-serif font-black text-[#f7eedd] group-hover:text-[#dfb86c] transition-colors leading-snug line-clamp-2">
                      {article.title}
                    </h3>

                    <p className="text-xs text-[#a89c8d] line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  {/* SECTION 10: RELATED POCKETALBUM COINS */}
                  {article.related_series_details && article.related_series_details.length > 0 && (
                    <div className="bg-[#140e0a] p-2.5 rounded-xl border border-[#5a4420]/40 space-y-1.5">
                      <span className="text-[10px] font-serif uppercase tracking-wider text-[#dfb86c] font-black flex items-center gap-1">
                        <Coins className="w-3 h-3 text-[#dfb86c]" />
                        Related PocketAlbum Coins
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {article.related_series_details.map((s) => (
                          <button
                            key={s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToSeries?.(s.id);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] font-bold text-[11px] shadow hover:from-[#fae19c] hover:to-[#dfb86c] transition-all cursor-pointer text-center"
                          >
                            <span>{s.name}</span>
                            <span className="text-[9px] font-black bg-[#140e08]/20 px-1.5 py-0.5 rounded text-center">
                              VIEW IN POCKETALBUM
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Likes, Dislikes, Read full story */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[#3e2e18]/60 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleReaction(article, 'like', e)}
                      disabled={reactingArticleId === article.id}
                      className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                        article.user_reaction === 'like'
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                          : 'bg-[#18110c] hover:bg-[#261a12] border-[#5a4420]/60 text-[#dfd4bf]'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${article.user_reaction === 'like' ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                      <span>{article.likes_count || 0}</span>
                    </button>

                    <button
                      onClick={(e) => handleReaction(article, 'dislike', e)}
                      disabled={reactingArticleId === article.id}
                      className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                        article.user_reaction === 'dislike'
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                          : 'bg-[#18110c] hover:bg-[#261a12] border-[#5a4420]/60 text-[#dfd4bf]'
                      }`}
                    >
                      <ThumbsDown className={`w-3 h-3 ${article.user_reaction === 'dislike' ? 'fill-rose-400 text-rose-400' : ''}`} />
                      <span>{article.dislikes_count || 0}</span>
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedArticle(article);
                    }}
                    className="flex items-center justify-center text-center gap-1 px-2.5 py-1 rounded-xl bg-[#241a13] hover:bg-[#322319] text-[#dfb86c] hover:text-[#fae19c] font-serif font-black text-xs transition-colors cursor-pointer"
                  >
                    <span>READ FULL STORY</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Article Detail Reading Modal */}
      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
          currentUser={currentUser}
          onArticleUpdated={(updated) => {
            setSelectedArticle(updated);
            setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          }}
          onViewCoinSeries={(seriesId) => {
            setSelectedArticle(null);
            onNavigateToSeries?.(seriesId);
          }}
        />
      )}

      {/* Admin News Source Manager Modal */}
      {isSourceManagerOpen && (
        <NewsSourceManagerModal
          isOpen={isSourceManagerOpen}
          onClose={() => setIsSourceManagerOpen(false)}
          onSourcesUpdated={loadArticles}
        />
      )}

      {/* Admin Manual Article Import Modal */}
      {isManualImportOpen && (
        <ManualArticleModal
          isOpen={isManualImportOpen}
          onClose={() => setIsManualImportOpen(false)}
          onArticleCreated={(newArt) => {
            setArticles((prev) => [newArt, ...prev]);
            setSelectedArticle(newArt);
          }}
        />
      )}
    </div>
  );
}
