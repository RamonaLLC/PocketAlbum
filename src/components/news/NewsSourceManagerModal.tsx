import React, { useState, useEffect } from 'react';
import { NewsSource, NewsSourceConnectionType, NewsSourceStatus } from '../../types.ts';
import {
  fetchNewsSources,
  verifyNewsSource,
  updateNewsSource,
  createNewsSource,
  fetchArticlesFromSource,
} from '../../utils/api.ts';
import {
  ShieldCheck,
  Globe,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  Power,
  ExternalLink,
  Plus,
  Search,
  Filter,
  X,
  Check,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface NewsSourceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourcesUpdated?: () => void;
}

export function NewsSourceManagerModal({
  isOpen,
  onClose,
  onSourcesUpdated,
}: NewsSourceManagerModalProps) {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | NewsSourceStatus>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Verification & Ingestion state
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ id: string; text: string; type: 'success' | 'error' } | null>(null);

  // Edit / Add modal state
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New source form fields
  const [formData, setFormData] = useState<{
    name: string;
    website_url: string;
    connection_type: NewsSourceConnectionType;
    endpoint: string;
    credibility_tier: string;
    categories: string;
    approval_mode: 'AUTOMATIC' | 'REQUIRE_APPROVAL';
  }>({
    name: '',
    website_url: '',
    connection_type: 'OFFICIAL_RSS',
    endpoint: '',
    credibility_tier: 'TIER 3 — ESTABLISHED NUMISMATIC NEWS SOURCE',
    categories: 'U.S. Coins, Coin Collecting',
    approval_mode: 'AUTOMATIC',
  });

  useEffect(() => {
    if (isOpen) {
      loadSources();
    }
  }, [isOpen]);

  const loadSources = async () => {
    setIsLoading(true);
    try {
      const data = await fetchNewsSources();
      setSources(data);
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (source: NewsSource) => {
    setVerifyingId(source.id);
    setActionMessage(null);
    try {
      const res = await verifyNewsSource(source.id, source.endpoint, source.connection_type);
      setSources((prev) => prev.map((s) => (s.id === source.id ? res.source : s)));
      if (res.verification.success) {
        setActionMessage({
          id: source.id,
          text: res.verification.message,
          type: 'success',
        });
      } else {
        setActionMessage({
          id: source.id,
          text: res.verification.message,
          type: 'error',
        });
      }
      onSourcesUpdated?.();
    } catch (err: any) {
      setActionMessage({
        id: source.id,
        text: err.message || 'Connection verification failed',
        type: 'error',
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleIngest = async (source: NewsSource) => {
    setIngestingId(source.id);
    setActionMessage(null);
    try {
      const res = await fetchArticlesFromSource(source.id);
      if (res.source) {
        setSources((prev) => prev.map((s) => (s.id === source.id ? res.source : s)));
      }
      setActionMessage({
        id: source.id,
        text: `Ingested ${res.addedCount} new articles!`,
        type: 'success',
      });
      onSourcesUpdated?.();
    } catch (err: any) {
      setActionMessage({
        id: source.id,
        text: err.message || 'Failed to ingest articles',
        type: 'error',
      });
    } finally {
      setIngestingId(null);
    }
  };

  const handleToggleEnable = async (source: NewsSource) => {
    const newEnabled = source.enabled ? 0 : 1;
    try {
      const updated = await updateNewsSource(source.id, {
        enabled: newEnabled,
        status: newEnabled ? source.status : 'DISABLED',
      });
      setSources((prev) => prev.map((s) => (s.id === source.id ? updated : s)));
      onSourcesUpdated?.();
    } catch (err) {
      console.error('Failed to toggle source:', err);
    }
  };

  const handleOpenEdit = (source: NewsSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      website_url: source.website_url,
      connection_type: source.connection_type,
      endpoint: source.endpoint || '',
      credibility_tier: source.credibility_tier,
      categories: Array.isArray(source.categories) ? source.categories.join(', ') : '',
      approval_mode: source.approval_mode,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSource) return;
    setIsSaving(true);
    try {
      const cats = formData.categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const updated = await updateNewsSource(editingSource.id, {
        name: formData.name,
        website_url: formData.website_url,
        connection_type: formData.connection_type,
        endpoint: formData.endpoint,
        credibility_tier: formData.credibility_tier,
        categories: cats,
        approval_mode: formData.approval_mode,
      });

      setSources((prev) => prev.map((s) => (s.id === editingSource.id ? updated : s)));
      setEditingSource(null);
      onSourcesUpdated?.();
    } catch (err) {
      console.error('Failed to save source edit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSource = async () => {
    if (!formData.name || !formData.website_url) return;
    setIsSaving(true);
    try {
      const cats = formData.categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const created = await createNewsSource({
        name: formData.name,
        website_url: formData.website_url,
        connection_type: formData.connection_type,
        endpoint: formData.endpoint,
        credibility_tier: formData.credibility_tier,
        categories: cats,
        approval_mode: formData.approval_mode,
      });

      setSources((prev) => [created, ...prev]);
      setIsAddOpen(false);
      onSourcesUpdated?.();
    } catch (err) {
      console.error('Failed to create source:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.website_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.endpoint && s.endpoint.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesTier = tierFilter === 'ALL' || s.credibility_tier.includes(tierFilter);

    return matchesSearch && matchesStatus && matchesTier;
  });

  const getStatusBadge = (status: NewsSourceStatus) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 border border-emerald-600/70 text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            CONNECTED
          </span>
        );
      case 'NEEDS_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 border border-amber-600/70 text-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            NEEDS VERIFICATION
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 border border-rose-600/70 text-rose-300">
            <XCircle className="w-3 h-3 text-rose-400" />
            FAILED
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-900 border border-zinc-700 text-zinc-400">
            <Power className="w-3 h-3 text-zinc-500" />
            DISABLED
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-gradient-to-b from-[#241a13] via-[#1c140f] to-[#140e0a] border border-[#8f6d33]/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#5a4420]/60 flex items-center justify-between bg-[#19110b]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#dfb86c] to-[#b88c3a] text-[#140e08] flex items-center justify-center font-bold shadow-md">
              <Radio className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[11px] font-serif uppercase tracking-widest text-[#dfb86c] font-bold">
                Admin Center
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-black text-[#f7eedd] tracking-tight">
                News Source Manager
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  website_url: '',
                  connection_type: 'AUTHORIZED_FEED',
                  endpoint: '',
                  credibility_tier: 'TIER 3 — ESTABLISHED NUMISMATIC NEWS SOURCE',
                  categories: 'U.S. Coins, Coin Collecting',
                  approval_mode: 'AUTOMATIC',
                });
                setIsAddOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] text-xs font-black shadow-md hover:from-[#fae19c] hover:to-[#dfb86c] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Add Custom Source</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#281d15] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3 sm:p-4 border-b border-[#5a4420]/40 bg-[#160f0b]/90 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8f6d33]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sources by name, website, or endpoint..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1f1611] border border-[#5a4420]/60 text-xs text-[#f7eedd] placeholder-[#7d6952] focus:outline-none focus:border-[#dfb86c]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {(['ALL', 'CONNECTED', 'NEEDS_VERIFICATION', 'FAILED', 'DISABLED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center justify-center text-center ${
                    statusFilter === status
                      ? 'bg-[#dfb86c] text-[#140e08] font-black'
                      : 'bg-[#1e1510] text-[#a89c8d] hover:text-[#f7eedd] border border-[#5a4420]/40'
                  }`}
                >
                  {status === 'ALL' ? 'All Sources' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Source Cards List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 scrollbar-thin">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#dfb86c] animate-spin mx-auto" />
              <p className="text-xs text-[#a89c8d]">Loading registered numismatic sources...</p>
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-[#5a4420]/60 rounded-2xl p-6">
              <p className="text-sm font-serif font-bold text-[#dfd4bf]">No news sources found</p>
              <p className="text-xs text-[#a89c8d]">
                Try adjusting your search criteria or add an authorized feed URL.
              </p>
            </div>
          ) : (
            filteredSources.map((source) => (
              <div
                key={source.id}
                className="bg-gradient-to-r from-[#1c130d] via-[#17100b] to-[#1c130d] border border-[#5a4420]/60 hover:border-[#8f6d33]/80 rounded-2xl p-3.5 sm:p-4 space-y-3 transition-all shadow-md"
              >
                {/* Row 1: Name, Badges, Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-serif font-black text-[#f7eedd] truncate">
                        {source.name}
                      </h3>
                      {getStatusBadge(source.status)}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#261b13] border border-[#5a4420]/40 text-[#dfb86c] truncate">
                        {source.credibility_tier.split('—')[0]?.trim()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#a89c8d] truncate">
                      <a
                        href={source.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-[#dfb86c] transition-colors truncate"
                      >
                        <Globe className="w-3 h-3 text-[#8f6d33] shrink-0" />
                        <span className="truncate">{source.website_url}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                      </a>
                      <span className="text-[#5a4420]">•</span>
                      <span className="text-[11px] font-mono text-[#dfd4bf]/80">
                        {source.connection_type}
                      </span>
                      <span className="text-[#5a4420]">•</span>
                      <span className="text-[11px] font-bold text-[#dfb86c]">
                        {source.article_count} articles
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {/* Verify connection */}
                    <button
                      onClick={() => handleVerify(source)}
                      disabled={verifyingId === source.id}
                      className="px-2.5 py-1.5 rounded-xl bg-[#281d15] hover:bg-[#34261c] text-[#dfd4bf] hover:text-[#f7eedd] border border-[#5a4420]/60 text-xs font-bold transition-all flex items-center justify-center text-center gap-1 disabled:opacity-50 cursor-pointer"
                      title="Test connection and parse feed"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-[#dfb86c] ${
                          verifyingId === source.id ? 'animate-spin' : ''
                        }`}
                      />
                      <span>{verifyingId === source.id ? 'Testing...' : 'Verify'}</span>
                    </button>

                    {/* Ingest now */}
                    {source.endpoint && (
                      <button
                        onClick={() => handleIngest(source)}
                        disabled={ingestingId === source.id}
                        className="px-2.5 py-1.5 rounded-xl bg-[#221710] hover:bg-[#2e2016] text-[#dfb86c] border border-[#7a5c28]/60 text-xs font-bold transition-all flex items-center justify-center text-center gap-1 disabled:opacity-50 cursor-pointer"
                        title="Fetch latest articles immediately"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{ingestingId === source.id ? 'Fetching...' : 'Fetch'}</span>
                      </button>
                    )}

                    {/* Enable / Disable */}
                    <button
                      onClick={() => handleToggleEnable(source)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center text-center gap-1 cursor-pointer ${
                        source.enabled
                          ? 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                          : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700'
                      }`}
                      title={source.enabled ? 'Disable source ingestion' : 'Enable source ingestion'}
                    >
                      <Power className="w-3 h-3" />
                      <span>{source.enabled ? 'Disable' : 'Enable'}</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(source)}
                      className="p-1.5 rounded-xl bg-[#261b13] hover:bg-[#332419] text-[#dfb86c] border border-[#5a4420]/60 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                      title="Edit source endpoint or details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Endpoint display & Last fetch info */}
                <div className="bg-[#120b08]/80 p-2.5 rounded-xl border border-[#3e2e18]/40 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <div className="truncate flex-1 text-[#a89c8d]">
                      <span className="font-semibold text-[#8f6d33]">Endpoint: </span>
                      {source.endpoint ? (
                        <span className="font-mono text-[#dfd4bf] select-all">
                          {source.endpoint}
                        </span>
                      ) : (
                        <span className="italic text-amber-500/80">
                          (No endpoint configured — click Edit to enter verified feed URL)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status message / Last fetch */}
                  <div className="flex flex-wrap items-center justify-between text-[10px] text-[#7d6952] pt-0.5 gap-2">
                    <div className="flex items-center gap-3">
                      {source.last_successful_fetch && (
                        <span>
                          Last success:{' '}
                          <span className="text-[#a89c8d]">
                            {new Date(source.last_successful_fetch).toLocaleDateString()}{' '}
                            {new Date(source.last_successful_fetch).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>
                      )}
                      {source.last_failed_fetch && (
                        <span className="text-rose-400">
                          Failed:{' '}
                          {new Date(source.last_failed_fetch).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    {source.last_error && (
                      <span className="text-rose-400 font-mono truncate max-w-sm" title={source.last_error}>
                        Error: {source.last_error}
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline Action message banner */}
                {actionMessage && actionMessage.id === source.id && (
                  <div
                    className={`p-2 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                      actionMessage.type === 'success'
                        ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200'
                        : 'bg-rose-950/70 border-rose-600 text-rose-200'
                    }`}
                  >
                    <span>{actionMessage.text}</span>
                    <button
                      onClick={() => setActionMessage(null)}
                      className="text-xs opacity-75 hover:opacity-100"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Edit / Add Modal */}
        {(editingSource || isAddOpen) && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
            <div className="bg-[#241a13] border border-[#8f6d33] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#5a4420]/60 pb-3">
                <h3 className="font-serif font-black text-base text-[#f7eedd]">
                  {isAddOpen ? 'Add Numismatic News Source' : `Edit Source: ${editingSource?.name}`}
                </h3>
                <button
                  onClick={() => {
                    setEditingSource(null);
                    setIsAddOpen(false);
                  }}
                  className="text-[#a89c8d] hover:text-[#f7eedd]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#dfb86c] font-bold mb-1">Source Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
                    placeholder="e.g. United States Mint, Coin World"
                  />
                </div>

                <div>
                  <label className="block text-[#dfb86c] font-bold mb-1">Website URL</label>
                  <input
                    type="text"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#dfb86c] font-bold mb-1">Connection Type</label>
                    <select
                      value={formData.connection_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          connection_type: e.target.value as NewsSourceConnectionType,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
                    >
                      <option value="OFFICIAL_RSS">OFFICIAL_RSS</option>
                      <option value="AUTHORIZED_FEED">AUTHORIZED_FEED</option>
                      <option value="OFFICIAL_ATOM">OFFICIAL_ATOM</option>
                      <option value="OFFICIAL_API">OFFICIAL_API</option>
                      <option value="MANUAL_IMPORT">MANUAL_IMPORT</option>
                      <option value="NEEDS_VERIFICATION">NEEDS_VERIFICATION</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#dfb86c] font-bold mb-1">Approval Mode</label>
                    <select
                      value={formData.approval_mode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          approval_mode: e.target.value as 'AUTOMATIC' | 'REQUIRE_APPROVAL',
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
                    >
                      <option value="AUTOMATIC">AUTOMATIC (Instant)</option>
                      <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#dfb86c] font-bold mb-1">
                    Feed / API Endpoint
                  </label>
                  <input
                    type="text"
                    value={formData.endpoint}
                    onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd] font-mono text-xs"
                    placeholder="https://example.com/feed or https://api... (no guessing)"
                  />
                  <p className="text-[10px] text-[#8f6d33] mt-1">
                    Administrators can enter or update authorized endpoints here without altering code.
                  </p>
                </div>

                <div>
                  <label className="block text-[#dfb86c] font-bold mb-1">Credibility Tier</label>
                  <select
                    value={formData.credibility_tier}
                    onChange={(e) => setFormData({ ...formData, credibility_tier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
                  >
                    <option value="TIER 1 — GOVERNMENT / PRIMARY">
                      TIER 1 — GOVERNMENT / PRIMARY
                    </option>
                    <option value="TIER 1 — MAJOR NUMISMATIC INSTITUTION">
                      TIER 1 — MAJOR NUMISMATIC INSTITUTION
                    </option>
                    <option value="TIER 2 — MAJOR NUMISMATIC ORGANIZATION / GRADING COMPANY">
                      TIER 2 — MAJOR NUMISMATIC ORGANIZATION / GRADING COMPANY
                    </option>
                    <option value="TIER 2 — MAJOR NUMISMATIC AUCTION HOUSE">
                      TIER 2 — MAJOR NUMISMATIC AUCTION HOUSE
                    </option>
                    <option value="TIER 2 — RESEARCH / VARIETY AUTHORITY">
                      TIER 2 — RESEARCH / VARIETY AUTHORITY
                    </option>
                    <option value="TIER 3 — ESTABLISHED NUMISMATIC NEWS SOURCE">
                      TIER 3 — ESTABLISHED NUMISMATIC NEWS SOURCE
                    </option>
                    <option value="TIER 3 — ESTABLISHED NUMISMATIC PUBLICATION">
                      TIER 3 — ESTABLISHED NUMISMATIC PUBLICATION
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#dfb86c] font-bold mb-1">
                    Categories (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.categories}
                    onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#160f0b] border border-[#5a4420]/60 text-[#f7eedd]"
                    placeholder="U.S. Coins, Auctions, Grading, VAM, Errors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#5a4420]/40">
                <button
                  onClick={() => {
                    setEditingSource(null);
                    setIsAddOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#19110b] hover:bg-[#251a12] text-[#a89c8d] font-bold text-xs flex items-center justify-center text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={isAddOpen ? handleCreateSource : handleSaveEdit}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] font-black text-xs shadow-md disabled:opacity-50 flex items-center justify-center text-center cursor-pointer"
                >
                  {isSaving ? 'Saving...' : isAddOpen ? 'Add Source' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
