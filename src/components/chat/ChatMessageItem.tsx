import React, { useState } from 'react';
import { ChatMessage, User } from '../../types.ts';
import { X, ZoomIn, Flag, Shield, Loader2 } from 'lucide-react';
import { reportChatUser } from '../../utils/api.ts';

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUser: User;
  onViewUserProfile?: (userId: string) => void;
  onTagUser?: (username: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  currentUser,
  onViewUserProfile,
  onTagUser,
}) => {
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate or offensive language');
  const [customDetails, setCustomDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  const isMine = message.sender_id === currentUser.id;
  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    setReportFeedback(null);

    const fullReason = customDetails.trim()
      ? `${reportReason}: ${customDetails.trim()}`
      : reportReason;

    try {
      const res = await reportChatUser({
        reporter_id: currentUser.id,
        reported_id: message.sender_id,
        message_id: message.id,
        reason: fullReason,
        channel: message.channel_id,
      });

      if (res.auto_banned) {
        setReportFeedback(
          `Report received! @${message.sender_username} has reached 5 distinct account reports and has been automatically blocked from messaging across all chats.`
        );
      } else {
        setReportFeedback(
          `Report received (${res.distinct_reports}/5 distinct accounts). If reported by 5 separate accounts, this user will be temporarily blocked from messaging.`
        );
      }

      setTimeout(() => {
        setShowReportModal(false);
        setReportFeedback(null);
        setCustomDetails('');
      }, 2400);
    } catch (err: any) {
      setReportFeedback(err.message || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Render text with interactive and highlighted @mentions
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    // Split on mentions
    const parts = content.split(/(@[a-zA-Z0-9_-]+)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        const isMe = username.toLowerCase() === currentUser.username.toLowerCase();

        return (
          <span
            key={idx}
            onClick={() => onTagUser && onTagUser(username)}
            className={`inline-block font-bold cursor-pointer transition-all ${
              isMe
                ? 'bg-[#dfb86c]/25 text-[#fae19c] px-1.5 py-0.5 rounded-md border border-[#dfb86c]/50 shadow-sm'
                : 'text-[#dfb86c] hover:text-[#fae19c] underline decoration-[#dfb86c]/40'
            }`}
            title={isMe ? 'You were mentioned!' : `Click to mention @${username}`}
          >
            {part}
          </span>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <>
      <div className="flex items-start gap-3 group">
        <button
          onClick={() => onViewUserProfile && onViewUserProfile(message.sender_id)}
          className="shrink-0 focus:outline-none cursor-pointer"
          title={`View @${message.sender_username}'s profile`}
        >
          <img
            src={message.sender_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={message.sender_username}
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover border border-[#7a5c28]/70 group-hover:border-[#dfb86c] transition-colors"
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onViewUserProfile && onViewUserProfile(message.sender_id)}
              className="text-xs font-serif font-bold text-[#f7eedd] hover:text-[#dfb86c] transition-colors cursor-pointer"
            >
              @{message.sender_username}
            </button>
            <span className="text-[10px] text-[#a89c8d]">{formattedTime}</span>
            {isMine ? (
              <span className="text-[9px] font-bold text-[#dfb86c] bg-[#281c14] px-1.5 py-0.2 rounded border border-[#7a5c28]/50">
                You
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[#a89c8d] hover:text-rose-400 p-1 rounded transition-opacity cursor-pointer"
                title={`Report @${message.sender_username}`}
              >
                <Flag className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Message bubble */}
          <div className="mt-1 text-sm text-[#f7eedd] leading-relaxed bg-[#1c130d] border border-[#5a4420]/50 rounded-2xl px-4 py-2.5 inline-block max-w-xl break-words shadow-sm shadow-black/40">
            {message.content && (
              <div className="leading-relaxed">{renderFormattedContent(message.content)}</div>
            )}

            {/* Photo Attachment if present */}
            {message.image_url && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setShowFullPhoto(true)}
                  className="relative group/img block rounded-xl overflow-hidden border border-[#7a5c28]/60 max-w-xs focus:outline-none cursor-pointer"
                >
                  <img
                    src={message.image_url}
                    alt="Chat upload"
                    referrerPolicy="no-referrer"
                    className="w-full max-h-56 object-cover group-hover/img:scale-102 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-semibold transition-opacity">
                    <ZoomIn className="w-4 h-4 text-[#dfb86c]" /> View Full Image
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Photo Modal */}
      {showFullPhoto && message.image_url && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setShowFullPhoto(false)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-[#140e0a] rounded-3xl border border-[#7a5c28]/60 overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setShowFullPhoto(false)}
                className="p-2 rounded-full bg-black/70 hover:bg-black text-[#dfd4bf] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={message.image_url}
              alt="Full size preview"
              referrerPolicy="no-referrer"
              className="w-auto h-auto max-h-[80vh] max-w-full object-contain mx-auto"
            />
            <div className="p-3 bg-[#1c130d] border-t border-[#7a5c28]/40 flex items-center justify-between text-xs text-[#a89c8d]">
              <span>Shared by @{message.sender_username}</span>
              <span>{new Date(message.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#7a5c28]/40 bg-[#19110b]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#f7eedd]">
                    Report @{message.sender_username}
                  </h3>
                  <p className="text-[11px] text-[#a89c8d]">Community Safety & Moderation</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#251a13] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="p-5 space-y-3.5">
              {reportFeedback && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 leading-relaxed">
                  {reportFeedback}
                </div>
              )}

              <div className="p-3 bg-[#140e0a] rounded-xl border border-[#5a4420]/40 text-[11px] text-[#a89c8d] leading-relaxed space-y-1">
                <div className="font-serif font-semibold text-[#dfb86c] flex items-center gap-1.5 text-xs">
                  <Shield className="w-3.5 h-3.5" /> 5-Account Moderation Rule
                </div>
                <p>
                  If a user is reported by <strong>5 separate accounts</strong>, they are automatically blocked from messaging in all chat groups and Universal Chat until an app moderator or admin removes the ban or extends it.
                </p>
              </div>

              <div>
                <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1.5">
                  Select Violation Category
                </label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
                >
                  <option value="Inappropriate or offensive language">Inappropriate or offensive language</option>
                  <option value="Spam or rapid message flooding">Spam or rapid message flooding</option>
                  <option value="Harassment, hostility, or bullying">Harassment, hostility, or bullying</option>
                  <option value="Scam, fraud, or fake coin listing">Scam, fraud, or fake coin listing</option>
                  <option value="Inappropriate picture or media">Inappropriate picture or media</option>
                  <option value="Other community violation">Other community violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={customDetails}
                  onChange={e => setCustomDetails(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Provide context for moderators..."
                  className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#5a4420]/40">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#a89c8d] hover:text-[#f7eedd] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-serif font-bold rounded-xl shadow disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag className="w-3.5 h-3.5" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
