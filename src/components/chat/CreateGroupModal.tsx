import React, { useState, useRef } from 'react';
import { X, Shield, Sparkles, Loader2, Globe, Lock, Camera } from 'lucide-react';
import { createGroup } from '../../utils/api.ts';
import { ChatGroup, User } from '../../types.ts';

interface CreateGroupModalProps {
  currentUser: User;
  onClose: () => void;
  onGroupCreated: (group: ChatGroup) => void;
}

const EMOJI_OPTIONS = ['🪙', '💰', '📸', '🛡️', '👥', '🦅', '💎', '👑', '⭐', '🔥', '🏆', '🔍', '🏛️', '🇺🇸'];
const COLOR_OPTIONS = [
  { id: 'amber', name: 'Antique Gold', bg: 'bg-[#dfb86c]', ring: 'ring-[#fae19c]' },
  { id: 'blue', name: 'Cobalt Blue', bg: 'bg-blue-600', ring: 'ring-blue-400' },
  { id: 'emerald', name: 'Forest Emerald', bg: 'bg-emerald-600', ring: 'ring-emerald-400' },
  { id: 'purple', name: 'Imperial Purple', bg: 'bg-purple-600', ring: 'ring-purple-400' },
  { id: 'rose', name: 'Ruby Bronze', bg: 'bg-rose-700', ring: 'ring-rose-400' },
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  currentUser,
  onClose,
  onGroupCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('🪙');
  const [isPublic, setIsPublic] = useState(true);
  const [rules, setRules] = useState('');
  const [profanityFilter, setProfanityFilter] = useState(true);
  const [spamFilter, setSpamFilter] = useState(true);
  const [allowPictures, setAllowPictures] = useState(true);
  const [allowMemberInvites, setAllowMemberInvites] = useState(true);
  const [chatColor, setChatColor] = useState('amber');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Photo is too large. Please choose an image under 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setIconUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createGroup(currentUser.id, {
        name: name.trim(),
        description: description.trim(),
        icon_url: iconUrl,
        is_public: isPublic ? 1 : 0,
        rules: rules.trim(),
        profanity_filter: profanityFilter ? 1 : 0,
        spam_filter: spamFilter ? 1 : 0,
        allow_pictures: allowPictures ? 1 : 0,
        allow_member_invites: allowMemberInvites ? 1 : 0,
        chat_color: chatColor,
      });

      onGroupCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#7a5c28]/40 bg-[#19110b]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#dfb86c]/20 text-[#dfb86c] flex items-center justify-center border border-[#dfb86c]/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#f7eedd]">Create New Guild</h3>
              <p className="text-xs text-[#a89c8d]">Start a numismatic community with custom rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#251a13] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Group Icon & Name */}
          <div className="p-3.5 bg-[#140e0a] border border-[#5a4420]/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-serif font-bold text-[#dfd4bf]">
                  Group Icon / Photo
                </label>
                <p className="text-[11px] text-[#a89c8d]">
                  Upload an image or pick a badge
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#241a13] border border-[#7a5c28]/60 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                {iconUrl.startsWith('http') || iconUrl.startsWith('data:') ? (
                  <img src={iconUrl} alt="Group Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{iconUrl || '🪙'}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#241a13] hover:bg-[#322319] border border-[#7a5c28]/60 text-[#dfd4bf] text-xs font-serif font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#dfb86c]" />
                Upload Photo
              </button>
              <input
                type="text"
                value={iconUrl.startsWith('data:') ? '' : iconUrl}
                onChange={e => setIconUrl(e.target.value)}
                placeholder="Or enter image URL / emoji..."
                className="flex-1 px-3 py-1.5 bg-[#120d09] border border-[#5a4420]/50 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c]"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {EMOJI_OPTIONS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIconUrl(em)}
                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                    iconUrl === em ? 'bg-[#dfb86c]/30 border border-[#dfb86c]' : 'bg-[#1c130d] hover:bg-[#251a13]'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Morgan Dollar Specialists, Colonial Numismatics"
              maxLength={60}
              className="w-full px-3.5 py-2.5 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c]"
            />
          </div>

          <div>
            <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
              Description / Focus
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What coins or topics does this group focus on?"
              maxLength={200}
              className="w-full px-3.5 py-2.5 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c] resize-none"
            />
          </div>

          {/* Privacy Choice */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                isPublic
                  ? 'bg-[#281c14] border-[#dfb86c] text-[#fae19c]'
                  : 'bg-[#140e0a] border-[#5a4420]/40 text-[#a89c8d] hover:bg-[#1c130d]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-serif font-bold text-xs mb-1">
                <Globe className="w-3.5 h-3.5 text-[#dfb86c]" /> Public Group
              </div>
              <p className="text-[10px] text-[#a89c8d] leading-relaxed">
                Anyone can discover and join instantly.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                !isPublic
                  ? 'bg-[#281c14] border-[#dfb86c] text-[#fae19c]'
                  : 'bg-[#140e0a] border-[#5a4420]/40 text-[#a89c8d] hover:bg-[#1c130d]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-serif font-bold text-xs mb-1">
                <Lock className="w-3.5 h-3.5 text-[#dfb86c]" /> Private Group
              </div>
              <p className="text-[10px] text-[#a89c8d] leading-relaxed">
                Requires leader invite or join request approval.
              </p>
            </button>
          </div>

          <div>
            <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
              Group Rules & Guidelines
            </label>
            <textarea
              rows={2}
              value={rules}
              onChange={e => setRules(e.target.value)}
              placeholder="e.g. 1. Respect fellow collectors. 2. Post high-res photos only. 3. No unauthorized sales."
              maxLength={500}
              className="w-full px-3.5 py-2.5 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c] resize-none"
            />
          </div>

          {/* Theme Color */}
          <div>
            <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1.5">
              Guild Accent Color
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setChatColor(color.id)}
                  className={`w-7 h-7 rounded-full ${color.bg} transition-all cursor-pointer ${
                    chatColor === color.id ? 'ring-4 ring-offset-2 ring-offset-[#241a13] ' + color.ring : 'opacity-60 hover:opacity-100'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Moderation Controls */}
          <div className="pt-3 border-t border-[#5a4420]/40 space-y-2.5">
            <h4 className="text-xs font-serif font-bold text-[#dfb86c] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Moderation & Settings
            </h4>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 cursor-pointer">
              <div>
                <div className="text-xs font-serif font-semibold text-[#f7eedd]">Profanity Filter</div>
                <div className="text-[10px] text-[#a89c8d]">Masks inappropriate language with asterisks</div>
              </div>
              <input
                type="checkbox"
                checked={profanityFilter}
                onChange={e => setProfanityFilter(e.target.checked)}
                className="w-4 h-4 rounded text-[#dfb86c] focus:ring-[#dfb86c] bg-[#241a13] border-[#7a5c28]"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 cursor-pointer">
              <div>
                <div className="text-xs font-serif font-semibold text-[#f7eedd]">Spam Filter</div>
                <div className="text-[10px] text-[#a89c8d]">Restricts rapid floods and identical duplicate posts</div>
              </div>
              <input
                type="checkbox"
                checked={spamFilter}
                onChange={e => setSpamFilter(e.target.checked)}
                className="w-4 h-4 rounded text-[#dfb86c] focus:ring-[#dfb86c] bg-[#241a13] border-[#7a5c28]"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 cursor-pointer">
              <div>
                <div className="text-xs font-serif font-semibold text-[#f7eedd]">Allow Picture Messages</div>
                <div className="text-[10px] text-[#a89c8d]">Permits members to share coin photos in chat</div>
              </div>
              <input
                type="checkbox"
                checked={allowPictures}
                onChange={e => setAllowPictures(e.target.checked)}
                className="w-4 h-4 rounded text-[#dfb86c] focus:ring-[#dfb86c] bg-[#241a13] border-[#7a5c28]"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 cursor-pointer">
              <div>
                <div className="text-xs font-serif font-semibold text-[#f7eedd]">Allow Member Invites</div>
                <div className="text-[10px] text-[#a89c8d]">If unchecked, only the Group Leader can invite collectors</div>
              </div>
              <input
                type="checkbox"
                checked={allowMemberInvites}
                onChange={e => setAllowMemberInvites(e.target.checked)}
                className="w-4 h-4 rounded text-[#dfb86c] focus:ring-[#dfb86c] bg-[#241a13] border-[#7a5c28]"
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#a89c8d] hover:text-[#f7eedd] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] text-xs font-serif font-bold rounded-xl shadow-lg border border-[#fae19c]/70 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Guild...
                </>
              ) : (
                'Create Guild'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
