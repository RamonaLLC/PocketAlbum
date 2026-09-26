import React, { useState } from 'react';
import { User } from '../types.ts';
import { updateUserProfile, registerUser, fetchUsers, submitAppSuggestion } from '../utils/api.ts';
import { fileToBase64 } from '../utils/photoPresets.ts';
import { X, Shield, Upload, UserPlus, ArrowRightLeft, Check, Send, Lightbulb, Loader2, Lock, Eye, Share2, Facebook } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserChanged: (user: User) => void;
  onOpenFacebookAdmin?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  onOpenFacebookAdmin,
}) => {
  const [tab, setTab] = useState<'edit' | 'switch' | 'register'>('edit');

  // Edit Profile form state
  const [username, setUsername] = useState(currentUser.username);
  const [profilePhoto, setProfilePhoto] = useState(currentUser.profile_photo);
  const [aboutMe, setAboutMe] = useState(currentUser.about_me);
  const [accountInfo, setAccountInfo] = useState(currentUser.account_info);
  const [isCollectionPrivate, setIsCollectionPrivate] = useState(Boolean(currentUser.is_collection_private));
  const [facebookSharingPref, setFacebookSharingPref] = useState<'auto' | 'ask' | 'never'>(currentUser.facebook_sharing_pref || 'auto');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Switch User state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Register New User state
  const [newUsername, setNewUsername] = useState('');
  const [newAboutMe, setNewAboutMe] = useState('Numismatic enthusiast & variety hunter');
  const [newAccountInfo, setNewAccountInfo] = useState('New Numismatist');
  const [newPhoto, setNewPhoto] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80');

  // Suggestion feature (sent to devinjjenkins90@gmail.com)
  const [suggestionText, setSuggestionText] = useState('');
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [suggestionFeedback, setSuggestionFeedback] = useState<string | null>(null);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim()) return;
    setIsSubmittingSuggestion(true);
    setSuggestionFeedback(null);
    try {
      const res = await submitAppSuggestion(currentUser.id, suggestionText.trim());
      setSuggestionFeedback('Your suggestion has been submitted and directed to devinjjenkins90@gmail.com! Thank you.');
      setSuggestionText('');
      if (res.mailto_link) {
        window.location.href = res.mailto_link;
      }
    } catch (err: any) {
      setSuggestionFeedback(err.message || 'Failed to submit suggestion.');
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  if (!isOpen) return null;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await updateUserProfile(currentUser.id, {
        username: username.trim(),
        profile_photo: profilePhoto,
        about_me: aboutMe.trim(),
        account_info: accountInfo.trim(),
        is_collection_private: isCollectionPrivate ? 1 : 0,
        facebook_sharing_pref: facebookSharingPref,
      });
      onUserChanged(updated);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setError('Username is required');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const created = await registerUser({
        username: newUsername.trim(),
        about_me: newAboutMe.trim(),
        account_info: newAccountInfo.trim(),
        profile_photo: newPhoto,
      });
      onUserChanged(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadUsersForSwitch = async () => {
    setLoadingUsers(true);
    try {
      const users = await fetchUsers();
      setAllUsers(users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNew = false) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const base64 = await fileToBase64(e.target.files[0]);
      if (isNew) {
        setNewPhoto(base64);
      } else {
        setProfilePhoto(base64);
      }
    } catch (err: any) {
      setError('Error reading photo: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#19110b] border-b border-[#7a5c28]/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#dfb86c]" />
            <h3 className="text-lg font-serif font-bold text-[#f7eedd]">Account & Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#a89c8d] hover:text-[#f7eedd] p-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-[#5a4420]/30 bg-[#120d09] p-1.5 gap-1 text-xs font-serif font-semibold">
          <button
            onClick={() => setTab('edit')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              tab === 'edit'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] font-bold shadow'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => {
              setTab('switch');
              handleLoadUsersForSwitch();
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'switch'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] font-bold shadow'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Switch User
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'register'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] font-bold shadow'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            New Account
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {/* Tab 1: Edit Profile */}
        {tab === 'edit' && (
          <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
            {/* Avatar picker */}
            <div className="flex items-center gap-4">
              <img
                src={profilePhoto}
                alt={username}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#dfb86c] shadow-md"
              />
              <div className="space-y-1">
                <label className="text-xs font-serif font-semibold text-[#dfd4bf] block">Avatar Photo</label>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 text-xs font-serif font-semibold bg-[#1c130d] hover:bg-[#281c14] text-[#dfd4bf] rounded-xl border border-[#7a5c28]/60 cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#dfb86c]" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handlePhotoUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setProfilePhoto('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80')}
                    className="px-2.5 py-1.5 text-xs text-[#a89c8d] hover:text-[#f7eedd] cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                Username (Must be unique)
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] focus:outline-none focus:border-[#dfb86c]"
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                Account Status / Title
              </label>
              <input
                type="text"
                value={accountInfo}
                onChange={e => setAccountInfo(e.target.value)}
                placeholder="e.g. Master Numismatist, Copper Specialist"
                className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c]"
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                About Me / Bio
              </label>
              <textarea
                value={aboutMe}
                onChange={e => setAboutMe(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c] resize-none"
              />
            </div>

            {/* Collection Privacy Setting */}
            <div className="p-3 bg-[#140e0a] border border-[#7a5c28]/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${isCollectionPrivate ? 'bg-[#dfb86c]/20 text-[#dfb86c]' : 'bg-[#241a13] text-[#a89c8d]'}`}>
                  {isCollectionPrivate ? <Lock className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#a89c8d]" />}
                </div>
                <div>
                  <div className="text-xs font-serif font-bold text-[#f7eedd]">Collection Privacy</div>
                  <div className="text-[10px] text-[#a89c8d]">
                    {isCollectionPrivate
                      ? 'Private — Only you can see your coins & recent additions'
                      : 'Public — Visible to visiting friends and collectors'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCollectionPrivate(!isCollectionPrivate)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                  isCollectionPrivate ? 'bg-[#dfb86c]' : 'bg-[#322319]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[#140e08] transition-transform ${
                    isCollectionPrivate ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Facebook Sharing Preference */}
            <div className="p-3.5 bg-[#140e0a] border border-[#7a5c28]/40 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2]">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-serif font-bold text-[#f7eedd]">Facebook Sharing Preference</div>
                  <div className="text-[10px] text-[#a89c8d]">
                    Official PocketAlbum Facebook Community Page
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  facebookSharingPref === 'auto'
                    ? 'bg-[#251b14] border-[#dfb86c] text-[#f7eedd]'
                    : 'bg-[#100b08] border-[#5a4420]/40 text-[#a89c8d] hover:border-[#7a5c28]'
                }`}>
                  <input
                    type="radio"
                    name="facebook_sharing_pref"
                    value="auto"
                    checked={facebookSharingPref === 'auto'}
                    onChange={() => setFacebookSharingPref('auto')}
                    className="mt-0.5 accent-[#dfb86c]"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#dfd4bf]">Automatically Post My Coins (Default)</div>
                    <div className="text-[10px] text-[#a89c8d] leading-relaxed">
                      Publish your new coins, album milestones, and accolades automatically.
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  facebookSharingPref === 'ask'
                    ? 'bg-[#251b14] border-[#dfb86c] text-[#f7eedd]'
                    : 'bg-[#100b08] border-[#5a4420]/40 text-[#a89c8d] hover:border-[#7a5c28]'
                }`}>
                  <input
                    type="radio"
                    name="facebook_sharing_pref"
                    value="ask"
                    checked={facebookSharingPref === 'ask'}
                    onChange={() => setFacebookSharingPref('ask')}
                    className="mt-0.5 accent-[#dfb86c]"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#dfd4bf]">Ask Me Each Time</div>
                    <div className="text-[10px] text-[#a89c8d] leading-relaxed">
                      Display a prompt after adding a coin before submitting to Facebook.
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  facebookSharingPref === 'never'
                    ? 'bg-[#251b14] border-red-700/80 text-[#f7eedd]'
                    : 'bg-[#100b08] border-[#5a4420]/40 text-[#a89c8d] hover:border-[#7a5c28]'
                }`}>
                  <input
                    type="radio"
                    name="facebook_sharing_pref"
                    value="never"
                    checked={facebookSharingPref === 'never'}
                    onChange={() => setFacebookSharingPref('never')}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-red-300">Never Post My Coins</div>
                    <div className="text-[10px] text-[#a89c8d] leading-relaxed">
                      Strict privacy: never publish your username, coins, or albums to Facebook.
                    </div>
                  </div>
                </label>
              </div>

              {Boolean(currentUser.is_admin) && onOpenFacebookAdmin && (
                <div className="pt-2 border-t border-[#7a5c28]/30">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFacebookAdmin();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/50 text-[#549bf5] hover:text-white text-xs font-serif font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                    <span>Admin: Manage Facebook Automation</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#5a4420]/30">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#a89c8d] hover:text-[#f7eedd] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-serif font-bold text-[#140e08] bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] rounded-xl shadow border border-[#fae19c]/70 cursor-pointer transition-all"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Switch User */}
        {tab === 'switch' && (
          <div className="p-6 space-y-3">
            <p className="text-xs text-[#a89c8d]">
              Select an account below to log into their collection:
            </p>
            {loadingUsers ? (
              <div className="py-8 text-center text-xs text-[#a89c8d]">Loading collectors...</div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allUsers.map(u => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        onUserChanged(u);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-[#281c14] border-[#dfb86c] text-[#fae19c]'
                          : 'bg-[#140e0a] border-[#5a4420]/40 hover:border-[#7a5c28] hover:bg-[#1c130d] text-[#dfd4bf]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.profile_photo}
                          alt={u.username}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-[#7a5c28]/60"
                        />
                        <div>
                          <div className="text-sm font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                            {u.username}
                            {isCurrent && (
                              <span className="text-[10px] font-black bg-[#dfb86c] text-[#140e08] px-1.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#a89c8d] truncate max-w-[200px]">
                            {u.account_info || 'Collector'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs text-[#a89c8d]">
                        <div>{u.coins_count || 0} Coins</div>
                        <div className="text-[#dfb86c] font-semibold">{u.total_votes || 0} Votes</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Register New Account */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                Choose Unique Username *
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="e.g. CopperKing, CarsonCityHunter"
                required
                className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c]"
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                Account Title
              </label>
              <input
                type="text"
                value={newAccountInfo}
                onChange={e => setNewAccountInfo(e.target.value)}
                placeholder="e.g. Early American Copper Collector"
                className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c]"
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                About Me Bio
              </label>
              <textarea
                value={newAboutMe}
                onChange={e => setNewAboutMe(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-sm text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#5a4420]/30">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#a89c8d] hover:text-[#f7eedd] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-serif font-bold text-[#140e08] bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] rounded-xl shadow border border-[#fae19c]/70 cursor-pointer transition-all"
              >
                {isSaving ? 'Creating...' : 'Create Account & Log In'}
              </button>
            </div>
          </form>
        )}

        {/* App Suggestion Section at the Very Bottom of Settings */}
        <div className="p-4 sm:p-5 border-t border-[#5a4420]/40 bg-[#120d09]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#dfb86c]/20 border border-[#dfb86c]/40 flex items-center justify-center text-[#dfb86c]">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-serif font-bold text-[#f7eedd] flex items-center gap-1.5">
                  App Suggestion & Feedback
                  <span className="text-[10px] font-sans font-normal text-[#dfb86c]">devinjjenkins90@gmail.com</span>
                </h4>
                <p className="text-[10px] text-[#a89c8d]">Have an idea to improve Coin Collector? Send up to 1,000 characters.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSuggestionOpen(!isSuggestionOpen)}
              className="px-3 py-1.5 bg-[#241a13] hover:bg-[#322319] text-[#dfd4bf] text-xs font-serif font-semibold rounded-xl border border-[#7a5c28]/60 transition-colors cursor-pointer"
            >
              {isSuggestionOpen ? 'Close' : 'Add Suggestion'}
            </button>
          </div>

          {isSuggestionOpen && (
            <form onSubmit={handleSubmitSuggestion} className="mt-3 space-y-2">
              {suggestionFeedback && (
                <div className={`p-2.5 rounded-xl text-xs ${
                  suggestionFeedback.includes('Thank you') || suggestionFeedback.includes('submitted')
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}>
                  {suggestionFeedback}
                </div>
              )}

              <div className="relative">
                <textarea
                  value={suggestionText}
                  onChange={e => setSuggestionText(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Type your suggestion here (e.g., new coin series to support, grading tracker enhancements, chat moderation tips)..."
                  className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c] resize-none pr-16"
                />
                <div className="absolute bottom-2 right-2.5 text-[10px] text-[#a89c8d] pointer-events-none">
                  {suggestionText.length}/1000
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-[#a89c8d] flex items-center gap-1">
                  <Send className="w-3 h-3 text-[#dfb86c]" />
                  Sends directly to devinjjenkins90@gmail.com
                </span>

                <button
                  type="submit"
                  disabled={isSubmittingSuggestion || !suggestionText.trim()}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] text-xs font-serif font-bold rounded-xl shadow border border-[#fae19c]/70 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isSubmittingSuggestion ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      Submit Suggestion
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
