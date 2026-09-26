import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, X, Loader2, AtSign, AlertTriangle } from 'lucide-react';
import { User } from '../../types.ts';
import { fetchUsers } from '../../utils/api.ts';

interface ChatInputProps {
  currentUser: User;
  channelName: string;
  allowPictures?: boolean;
  onSendMessage: (content: string, imageUrl?: string) => Promise<void>;
  prefilledMention?: string;
  onClearPrefilledMention?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  currentUser,
  channelName,
  allowPictures = true,
  onSendMessage,
  prefilledMention,
  onClearPrefilledMention,
}) => {
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if current user is banned
  const isBanActive =
    currentUser.chat_banned === 1 &&
    (!currentUser.chat_ban_expires_at ||
      new Date(currentUser.chat_ban_expires_at).getTime() > Date.now());

  // Mention autocomplete state
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load collector accounts for @ tagging
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const u = await fetchUsers();
        setAvailableUsers(u);
      } catch (err) {
        console.error('Failed to load collectors for mentions:', err);
      }
    };
    loadUsers();
  }, []);

  // Handle prefilled mention from external tap
  useEffect(() => {
    if (prefilledMention) {
      setInputText(prev => {
        const mentionStr = `@${prefilledMention} `;
        if (!prev.includes(mentionStr)) {
          return `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${mentionStr}`;
        }
        return prev;
      });
      inputRef.current?.focus();
      if (onClearPrefilledMention) onClearPrefilledMention();
    }
  }, [prefilledMention]);

  // Handle input changes and detect `@`
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    setErrorMsg(null);

    const cursorPos = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);

    if (lastAtMatch) {
      const q = lastAtMatch[1].toLowerCase();
      setMentionQuery(q);
      const filtered = availableUsers.filter(u =>
        u.username.toLowerCase().includes(q) && u.id !== currentUser.id
      ).slice(0, 5);
      setMentionSuggestions(filtered);
    } else {
      setMentionQuery(null);
      setMentionSuggestions([]);
    }
  };

  const handleSelectMention = (username: string) => {
    if (!mentionQuery && mentionQuery !== '') return;

    // Replace the trailing @query with @ExactUsername
    const cursorPos = inputRef.current?.selectionStart || inputText.length;
    const textBeforeCursor = inputText.slice(0, cursorPos);
    const textAfterCursor = inputText.slice(cursorPos);

    const replacedBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_-]*)$/, `@${username} `);
    setInputText(replacedBefore + textAfterCursor);
    setMentionQuery(null);
    setMentionSuggestions([]);
    inputRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          setShowImageModal(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !imageUrl) || isSending) return;

    const textToSend = inputText.trim();
    const imageToSend = imageUrl || undefined;

    setIsSending(true);
    setErrorMsg(null);

    try {
      await onSendMessage(textToSend, imageToSend);
      setInputText('');
      setImageUrl(null);
      setMentionQuery(null);
      setMentionSuggestions([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-[#150f0b] border-t border-[#5a4420]/40 relative">
      {/* Mention Autocomplete Popup */}
      {mentionQuery !== null && mentionSuggestions.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 w-64 bg-[#241a13] border border-[#7a5c28]/80 rounded-2xl shadow-2xl overflow-hidden z-30 divide-y divide-[#5a4420]/40">
          <div className="px-3 py-1.5 bg-[#19110b] text-[10px] font-serif font-bold text-[#dfb86c] uppercase tracking-wider flex items-center gap-1">
            <AtSign className="w-3 h-3" /> Mention Collector
          </div>
          {mentionSuggestions.map(user => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectMention(user.username)}
              className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#322319] transition-colors group cursor-pointer"
            >
              <img
                src={user.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={user.username}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover border border-[#7a5c28]/60"
              />
              <span className="text-xs font-serif font-bold text-[#f7eedd] group-hover:text-[#fae19c]">
                @{user.username}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Selected Image Attachment Preview */}
      {imageUrl && (
        <div className="mb-2 flex items-center gap-2 p-1.5 pl-2 bg-[#1c140f] border border-[#dfb86c]/50 rounded-xl w-fit">
          <img
            src={imageUrl}
            alt="Upload thumbnail"
            referrerPolicy="no-referrer"
            className="w-10 h-10 object-cover rounded-lg border border-[#7a5c28]/60"
          />
          <div className="text-xs text-[#dfd4bf] pr-2">
            <span className="font-semibold text-[#dfb86c]">Photo attached</span>
          </div>
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="p-1 rounded-lg hover:bg-[#281c14] text-[#a89c8d] hover:text-[#f7eedd] transition-colors cursor-pointer"
            title="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error / Spam Banner */}
      {errorMsg && (
        <div className="mb-2 p-2 px-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Banned Block Banner */}
      {isBanActive ? (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-200 leading-relaxed flex-1">
            <div className="font-bold text-rose-300">
              Temporarily Blocked from Messaging in All Chats
            </div>
            <p className="text-[#a89c8d] mt-0.5">
              Your account received 5 reports from separate accounts and is restricted from sending messages in all chat groups and Universal Chat.
            </p>
            <div className="text-[11px] text-rose-300/80 mt-1">
              {currentUser.chat_ban_expires_at ? (
                <span>Restriction ends on: <strong>{new Date(currentUser.chat_ban_expires_at).toLocaleString()}</strong></span>
              ) : (
                <span>Restriction in effect pending app moderator or admin review.</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Form Input Container */
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Attach Photo Button (if allowed) */}
          {allowPictures && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  imageUrl
                    ? 'bg-[#dfb86c]/20 border-[#dfb86c] text-[#dfb86c]'
                    : 'bg-[#221812] border-[#7a5c28]/50 text-[#a89c8d] hover:text-[#dfb86c] hover:bg-[#2d2018]'
                }`}
                title="Attach Photo or Image URL"
              >
                <Image className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Text Field */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message #${channelName} (type @ to tag)...`}
              maxLength={1000}
              className="w-full px-4 py-2.5 bg-[#140e0a] border border-[#7a5c28]/50 rounded-2xl text-xs sm:text-sm text-[#f7eedd] placeholder-[#a89c8d]/60 focus:outline-none focus:border-[#dfb86c] shadow-inner"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !imageUrl) || isSending}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] font-serif font-bold text-xs rounded-2xl shadow-md border border-[#fae19c]/70 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Image Modal (Paste URL or Upload) */}
      {showImageModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                <Image className="w-4 h-4 text-[#dfb86c]" /> Attach Coin Image
              </h4>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-[#a89c8d] hover:text-[#f7eedd] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Choose from device */}
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-[#241a13] hover:bg-[#322319] text-[#f7eedd] text-xs font-serif font-bold rounded-xl transition-colors border border-[#7a5c28]/60 flex items-center justify-center gap-2 cursor-pointer"
              >
                Choose from Camera / Files
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <span className="bg-[#241a13] px-2 text-[10px] text-[#a89c8d] uppercase tracking-wider z-10 font-serif">
                Or enter image URL
              </span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#5a4420]/40" />
              </div>
            </div>

            {/* URL input */}
            <div className="space-y-2">
              <input
                type="url"
                value={customImageUrl}
                onChange={e => setCustomImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customImageUrl.trim()) {
                    setImageUrl(customImageUrl.trim());
                    setShowImageModal(false);
                    setCustomImageUrl('');
                  }
                }}
                disabled={!customImageUrl.trim()}
                className="w-full py-2 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] font-serif font-bold text-xs rounded-xl disabled:opacity-50 transition-colors cursor-pointer border border-[#fae19c]/70"
              >
                Use Image URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
