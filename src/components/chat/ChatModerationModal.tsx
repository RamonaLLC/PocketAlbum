import React, { useState, useEffect } from 'react';
import {
  X, Shield, AlertTriangle, CheckCircle, Clock,
  RefreshCw, Loader2, UserX, UserCheck
} from 'lucide-react';
import { fetchAdminChatReports, removeChatBan, extendChatBan } from '../../utils/api.ts';
import { User } from '../../types.ts';

interface ChatModerationModalProps {
  currentUser: User;
  onClose: () => void;
}

export const ChatModerationModal: React.FC<ChatModerationModalProps> = ({
  currentUser,
  onClose,
}) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Extend ban modal state
  const [selectedUserForExtend, setSelectedUserForExtend] = useState<any | null>(null);
  const [extendHours, setExtendHours] = useState<number>(72); // default 3 days
  const [customDateTime, setCustomDateTime] = useState<string>('');
  const [extendReason, setExtendReason] = useState<string>('Extended following moderator review of community reports.');

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminChatReports();
      setReports(data);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleRemoveBan = async (targetUserId: string, username: string) => {
    setProcessingId(targetUserId);
    setFeedback(null);
    try {
      await removeChatBan(targetUserId);
      setFeedback(`Chat ban removed for @${username}. They can now send messages again.`);
      loadReports();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to remove chat ban');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExtendBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForExtend) return;

    setProcessingId(selectedUserForExtend.user.id);
    setFeedback(null);

    let expiresDateIso: string;
    if (customDateTime) {
      expiresDateIso = new Date(customDateTime).toISOString();
    } else {
      const now = new Date();
      now.setTime(now.getTime() + extendHours * 60 * 60 * 1000);
      expiresDateIso = now.toISOString();
    }

    try {
      await extendChatBan(
        selectedUserForExtend.user.id,
        expiresDateIso,
        extendReason.trim() || undefined
      );
      setFeedback(`Chat ban extended for @${selectedUserForExtend.user.username} until ${new Date(expiresDateIso).toLocaleString()}.`);
      setSelectedUserForExtend(null);
      loadReports();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to extend chat ban');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#7a5c28]/40 bg-[#19110b]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#dfb86c]/20 text-[#dfb86c] flex items-center justify-center border border-[#dfb86c]/40">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                Chat Moderation & Tribunal
                <span className="text-[10px] uppercase font-serif font-bold bg-[#dfb86c]/20 text-[#fae19c] border border-[#dfb86c]/40 px-2 py-0.5 rounded-full">
                  Admin / Mod
                </span>
              </h3>
              <p className="text-xs text-[#a89c8d]">
                Manage automated 5-report chat bans, lift restrictions, or set scheduled ban expirations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadReports}
              disabled={loading}
              className="p-2 rounded-xl text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#251a13] transition-colors cursor-pointer"
              title="Refresh reports"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#251a13] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Policy Banner */}
        <div className="px-6 py-3 bg-[#dfb86c]/10 border-b border-[#dfb86c]/20 flex items-start gap-2.5 text-xs text-[#dfb86c] leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-[#dfb86c] shrink-0 mt-0.5" />
          <p>
            <strong>5-Account Moderation Rule:</strong> When any account receives reports from <strong>5 distinct users</strong>, they are automatically blocked from messaging in all chat groups and Universal Chat. As a moderator or admin, you can remove the ban to restore messaging immediately, or extend the ban to a specific date and time.
          </p>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="m-6 mb-0 p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-emerald-400 hover:text-emerald-200 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Reports list */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#a89c8d] flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#dfb86c]" />
              Loading moderation reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#a89c8d] space-y-1">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-400/80 mb-2" />
              <p className="font-serif font-bold text-[#f7eedd]">All clear! No pending chat reports.</p>
              <p>Community guidelines are being respected across Universal Chat and guilds.</p>
            </div>
          ) : (
            reports.map(item => {
              const u = item.user;
              const isBanned = u.chat_banned === 1;
              const isProcessing = processingId === u.id;
              const reportsCount = item.distinct_reporters_count;

              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isBanned
                      ? 'bg-rose-950/30 border-rose-900/60'
                      : 'bg-[#140e0a] border-[#5a4420]/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={u.username}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border border-[#7a5c28]/60"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-serif font-bold text-[#f7eedd]">@{u.username}</span>
                          {isBanned ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                              <UserX className="w-3 h-3" />
                              Chat Banned
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#241a13] text-[#dfd4bf]">
                              Active
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dfb86c]/15 text-[#fae19c] border border-[#dfb86c]/30">
                            {reportsCount} {reportsCount === 1 ? 'Distinct Account Report' : 'Distinct Account Reports'}
                          </span>
                        </div>

                        {isBanned && (
                          <div className="text-xs text-rose-300/90 mt-1">
                            {u.chat_ban_expires_at ? (
                              <span>
                                Ban expires: <strong>{new Date(u.chat_ban_expires_at).toLocaleString()}</strong>
                              </span>
                            ) : (
                              <span>Permanent / Pending Mod Review</span>
                            )}
                            {u.chat_ban_reason && (
                              <span className="text-[#a89c8d] ml-1">
                                &bull; Reason: {u.chat_ban_reason}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isBanned ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRemoveBan(u.id, u.username)}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-serif font-bold transition-colors flex items-center gap-1.5 shadow cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Remove Chat Ban
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUserForExtend(item)}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 bg-[#241a13] hover:bg-[#322319] text-[#dfb86c] border border-[#7a5c28]/60 rounded-xl text-xs font-serif font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Extend Ban...
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedUserForExtend(item)}
                          disabled={isProcessing}
                          className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-serif font-bold transition-colors flex items-center gap-1.5 shadow cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Apply Ban...
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recent report reasons preview */}
                  {item.reports && item.reports.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#5a4420]/30">
                      <span className="text-[10px] font-serif font-bold text-[#a89c8d] uppercase tracking-wider block mb-1">
                        Recent Report Logs ({item.reports.length})
                      </span>
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {item.reports.slice(0, 5).map((r: any) => (
                          <div key={r.id} className="text-[11px] text-[#a89c8d] flex items-center justify-between">
                            <span className="truncate">
                              &bull; Reported by @{r.reporter_username || 'Collector'}: <span className="text-[#dfd4bf] font-medium">{r.reason}</span>
                            </span>
                            <span className="text-[10px] text-[#5a4420] shrink-0 ml-2">
                              {new Date(r.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#5a4420]/30 bg-[#120d09] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#241a13] hover:bg-[#322319] text-[#dfd4bf] text-xs font-serif font-bold rounded-xl border border-[#7a5c28]/50 transition-colors cursor-pointer"
          >
            Close Moderation
          </button>
        </div>
      </div>

      {/* EXTEND BAN SUB-MODAL */}
      {selectedUserForExtend && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#241a13] border border-[#7a5c28]/70 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#5a4420]/40 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#dfb86c]" />
                <h4 className="text-sm font-serif font-bold text-[#f7eedd]">
                  Set Chat Ban Expiration for @{selectedUserForExtend.user.username}
                </h4>
              </div>
              <button
                onClick={() => setSelectedUserForExtend(null)}
                className="text-[#a89c8d] hover:text-[#f7eedd] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExtendBan} className="space-y-4">
              <div>
                <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1.5">
                  Select Quick Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '24 Hours', hours: 24 },
                    { label: '3 Days', hours: 72 },
                    { label: '7 Days', hours: 168 },
                    { label: '30 Days', hours: 720 },
                  ].map(opt => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => {
                        setExtendHours(opt.hours);
                        setCustomDateTime('');
                      }}
                      className={`p-2 rounded-xl text-xs font-serif font-bold border transition-colors cursor-pointer ${
                        !customDateTime && extendHours === opt.hours
                          ? 'bg-[#dfb86c]/20 border-[#dfb86c] text-[#fae19c]'
                          : 'bg-[#140e0a] border-[#5a4420]/40 text-[#a89c8d] hover:text-[#f7eedd]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                  Or Specify Custom Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={e => setCustomDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                />
                <p className="text-[10px] text-[#a89c8d] mt-1">
                  When this date and time arrives, the chat ban automatically ends and the user can chat again.
                </p>
              </div>

              <div>
                <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                  Moderator Reason / Note
                </label>
                <input
                  type="text"
                  value={extendReason}
                  onChange={e => setExtendReason(e.target.value)}
                  placeholder="e.g. 5 community reports of spamming"
                  className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#5a4420]/40">
                <button
                  type="button"
                  onClick={() => setSelectedUserForExtend(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#a89c8d] hover:text-[#f7eedd] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId !== null}
                  className="px-4 py-2 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] text-xs font-serif font-bold rounded-xl shadow border border-[#fae19c]/70 transition-all cursor-pointer"
                >
                  {processingId ? 'Updating Ban...' : 'Confirm Ban Expiration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
