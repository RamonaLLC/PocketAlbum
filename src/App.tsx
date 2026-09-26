import React, { useState, useEffect } from 'react';
import { User, CollectionItem } from './types.ts';
import {
  fetchUserProfile,
  fetchUsers,
  toggleVote,
  removeFriend,
  fetchFriends,
  fetchFriendRequests,
  sendFriendRequest,
  respondToFriendRequest
} from './utils/api.ts';
import { CoinsExplorer } from './components/CoinsExplorer.tsx';
import { BullionSection } from './components/BullionSection.tsx';
import { ColonialsSection } from './components/ColonialsSection.tsx';
import { Leaderboards } from './components/Leaderboards.tsx';
import { ChatSection } from './components/ChatSection.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { FriendsModal } from './components/FriendsModal.tsx';
import { QuickAddCoinModal } from './components/QuickAddCoinModal.tsx';
import { RecentlyAddedSection } from './components/RecentlyAddedSection.tsx';
import { FacebookAutomationCenter } from './components/admin/FacebookAutomationCenter.tsx';
import { FacebookSharingModal } from './components/FacebookSharingModal.tsx';
import { NewsCenter } from './components/news/NewsCenter.tsx';
import {
  Coins,
  Shield,
  Compass,
  Trophy,
  MessageSquare,
  Newspaper,
  Users,
  Settings,
  Heart,
  ArrowLeft,
  Award,
  CircleDollarSign,
  UserPlus,
  UserCheck,
  Clock,
  Check,
  AlertTriangle,
  Plus,
  ShieldAlert,
  Facebook
} from 'lucide-react';

export default function App() {
  // Navigation tabs: 'collection' | 'leaderboards' | 'chat' | 'news'
  const [activeTab, setActiveTab] = useState<'collection' | 'leaderboards' | 'chat' | 'news'>('collection');

  // Collection sub-categories: 'coins' | 'bullion' | 'colonials' | 'commemoratives'
  const [collectionCategory, setCollectionCategory] = useState<'coins' | 'bullion' | 'colonials' | 'commemoratives'>('coins');

  // Current logged in user (persisted in localStorage or default to Devin)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // If viewing someone else's public collection
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isFacebookAdminOpen, setIsFacebookAdminOpen] = useState(false);
  const [facebookPromptCoin, setFacebookPromptCoin] = useState<CollectionItem | null>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Friend removal confirmation state from banner/profile
  const [friendConfirmModal, setFriendConfirmModal] = useState<{ id: string; username: string } | null>(null);
  const [isRemovingFriend, setIsRemovingFriend] = useState(false);

  // Direct navigation target from News Center or external pathways
  const [targetSeriesId, setTargetSeriesId] = useState<string | null>(null);

  // Breadcrumb / Screen history tracking to always allow returning to the exact previous screen
  const [screenHistory, setScreenHistory] = useState<{
    tab: 'collection' | 'leaderboards' | 'chat' | 'news';
    category: 'coins' | 'bullion' | 'colonials' | 'commemoratives';
    viewingUserId: string | null;
    fromFriendsModal?: boolean;
  }[]>([]);


  // Initial load
  useEffect(() => {
    const savedUserId = localStorage.getItem('pocket_album_user_id') || 'user_devin';
    loadUser(savedUserId);
  }, []);

  const loadUser = async (userId: string) => {
    try {
      const [u, fList, reqs] = await Promise.all([
        fetchUserProfile(userId),
        fetchFriends(userId),
        fetchFriendRequests(userId),
      ]);
      setCurrentUser(u);
      setFriendsCount(fList.length);
      setPendingRequestsCount(reqs.received?.length || 0);
      localStorage.setItem('pocket_album_user_id', u.id);
    } catch (err) {
      console.error('Failed to load user, trying first user:', err);
      try {
        const users = await fetchUsers();
        if (users.length > 0) {
          const first = await fetchUserProfile(users[0].id);
          const fList = await fetchFriends(first.id);
          const reqs = await fetchFriendRequests(first.id);
          setCurrentUser(first);
          setFriendsCount(fList.length);
          setPendingRequestsCount(reqs.received?.length || 0);
          localStorage.setItem('pocket_album_user_id', first.id);
        }
      } catch (e) {
        console.error('Failed to load fallback user:', e);
      }
    }
  };

  const refreshSocialCounts = async () => {
    if (!currentUser) return;
    try {
      const [fList, reqs] = await Promise.all([
        fetchFriends(currentUser.id),
        fetchFriendRequests(currentUser.id),
      ]);
      setFriendsCount(fList.length);
      setPendingRequestsCount(reqs.received?.length || 0);
    } catch (err) {
      console.error('Failed to refresh social counts:', err);
    }
  };

  const handleSwitchUser = async (newUser: User) => {
    setCurrentUser(newUser);
    setViewingUser(null);
    setScreenHistory([]);
    localStorage.setItem('pocket_album_user_id', newUser.id);
    await loadUser(newUser.id);
  };

  const handleViewOtherUser = async (targetUserId: string, options?: { fromFriendsModal?: boolean }) => {
    if (!currentUser) return;
    if (targetUserId === currentUser.id) {
      setViewingUser(null);
      setActiveTab('collection');
      return;
    }

    // Save previous screen state before navigating to target user
    setScreenHistory(prev => [
      ...prev,
      {
        tab: activeTab,
        category: collectionCategory,
        viewingUserId: viewingUser ? viewingUser.id : null,
        fromFriendsModal: options?.fromFriendsModal ?? false,
      },
    ]);

    try {
      const profile = await fetchUserProfile(targetUserId, currentUser.id);
      setViewingUser(profile);
      setActiveTab('collection');
    } catch (err) {
      console.error('Failed to fetch user collection:', err);
    }
  };

  const handleReturnToLastScreen = async () => {
    if (screenHistory.length === 0) {
      setViewingUser(null);
      setActiveTab('collection');
      return;
    }

    const previous = screenHistory[screenHistory.length - 1];
    setScreenHistory(prev => prev.slice(0, -1));

    if (previous.viewingUserId) {
      // Return to previously viewed profile
      try {
        if (currentUser) {
          const profile = await fetchUserProfile(previous.viewingUserId, currentUser.id);
          setViewingUser(profile);
          setActiveTab('collection');
        }
      } catch (err) {
        console.error('Failed to restore previous user profile:', err);
        setViewingUser(null);
        setActiveTab('collection');
      }
    } else {
      // Return to previous tab/screen (leaderboards, chat, or my collection)
      setViewingUser(null);
      setActiveTab(previous.tab);
      if (previous.category) {
        setCollectionCategory(previous.category);
      }
      if (previous.fromFriendsModal) {
        setIsFriendsOpen(true);
      }
    }
  };

  const handleVoteForViewingUser = async () => {
    if (!currentUser || !viewingUser) return;
    try {
      const res = await toggleVote(currentUser.id, viewingUser.id);
      setViewingUser(prev => prev ? {
        ...prev,
        has_voted: res.voted,
        total_votes: res.total_votes,
        weekly_votes: res.weekly_votes ?? prev.weekly_votes
      } : null);
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleFriendClickViewingUser = async () => {
    if (!currentUser || !viewingUser) return;
    if (viewingUser.is_friend) {
      // Prompt confirmation before removing
      setFriendConfirmModal({ id: viewingUser.id, username: viewingUser.username });
    } else if (viewingUser.friend_status === 'request_received' && viewingUser.friend_request_id) {
      // Accept request
      try {
        await respondToFriendRequest(viewingUser.friend_request_id, currentUser.id, 'accept');
        setViewingUser(prev => prev ? { ...prev, is_friend: true, friend_status: 'friends' } : null);
        setFriendsCount(c => c + 1);
        setPendingRequestsCount(c => Math.max(0, c - 1));
      } catch (err) {
        console.error('Failed to accept request:', err);
      }
    } else if (viewingUser.friend_status === 'request_sent') {
      // Already sent request
      return;
    } else {
      // Send friend request
      try {
        const res = await sendFriendRequest(currentUser.id, viewingUser.id);
        if (res.status === 'accepted') {
          setViewingUser(prev => prev ? { ...prev, is_friend: true, friend_status: 'friends' } : null);
          setFriendsCount(c => c + 1);
        } else {
          setViewingUser(prev => prev ? { ...prev, friend_status: 'request_sent' } : null);
        }
      } catch (err) {
        console.error('Failed to send friend request:', err);
      }
    }
  };

  const handleConfirmRemoveFriendFromBanner = async () => {
    if (!currentUser || !friendConfirmModal) return;
    setIsRemovingFriend(true);
    try {
      await removeFriend(currentUser.id, friendConfirmModal.id);
      if (viewingUser && viewingUser.id === friendConfirmModal.id) {
        setViewingUser(prev => prev ? { ...prev, is_friend: false, friend_status: 'none' } : null);
      }
      setFriendsCount(c => Math.max(0, c - 1));
      setFriendConfirmModal(null);
    } catch (err) {
      console.error('Failed to remove friend:', err);
    } finally {
      setIsRemovingFriend(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold tracking-wide text-amber-200">Starting PocketAlbum...</p>
        </div>
      </div>
    );
  }

  // Active display user is either the viewingUser or currentUser
  const displayUser = viewingUser || currentUser;
  const isViewingSelf = !viewingUser || viewingUser.id === currentUser.id;

  return (
    <div className="min-h-dvh bg-[#0e0c0a] text-[#f7eedd] flex flex-col font-sans selection:bg-[#cba153] selection:text-[#0e0c0a] w-full overflow-x-hidden">
      {/* Top Main Application Navbar */}
      <header className="sticky top-0 z-40 bg-[#0e0c0a]/95 backdrop-blur-md border-b border-[#7a5c28]/40 w-full safe-area-top shadow-lg shadow-black/60">
        <div className="w-full max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-6">
          {/* Row 1: Brand Title & Logo on the left, Friends & Profile on the right (NO top search bar) */}
          <div className="pt-3 pb-2 flex items-center justify-between gap-3">
            {/* Left: App Brand Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#dfb86c] via-[#cba153] to-[#8f6d33] p-0.5 shadow-md shadow-[#cba153]/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#140e08] rounded-[10px] flex items-center justify-center">
                  <CircleDollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#dfb86c]" />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-serif font-black tracking-tight text-[#f7eedd] flex items-center gap-1.5">
                PocketAlbum
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider bg-[#2a1e15] text-[#dfb86c] border border-[#7a5c28]/60 px-1.5 py-0.2 rounded font-bold font-sans">
                  PRO
                </span>
              </span>
            </div>

            {/* Right: Friends network trigger & User profile avatar */}
            <div className="flex items-center gap-2 shrink-0">
              {Boolean(currentUser.is_admin) && (
                <button
                  id="admin-fb-automation-header-btn"
                  onClick={() => setIsFacebookAdminOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/60 text-[#1877F2] hover:text-[#549bf5] text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title="Admin: PocketAlbum Facebook Automation System"
                >
                  <Facebook className="w-4 h-4 text-[#1877F2] shrink-0" />
                  <span className="hidden sm:inline font-serif font-bold">Admin FB</span>
                </button>
              )}

              <button
                onClick={() => setIsFriendsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#1a130e] hover:bg-[#251b14] border border-[#7a5c28]/50 text-[#dfd4bf] text-xs font-bold transition-all relative shadow-sm"
                title="Friends & Collector Network"
              >
                <Users className="w-4 h-4 text-[#dfb86c] shrink-0" />
                <span className="hidden sm:inline">Friends</span>
                <span className="text-[#a89c8d] text-[11px] font-semibold">({friendsCount})</span>
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-black rounded-full bg-rose-500 text-white shrink-0 shadow-sm animate-pulse">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 text-left group p-1 rounded-xl hover:bg-[#1f1610] transition-colors"
                title="Account Settings"
              >
                <img
                  src={currentUser.profile_photo}
                  alt={currentUser.username}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border-2 border-[#8f6d33] group-hover:border-[#dfb86c] transition-colors shrink-0 shadow-sm"
                />
                <span className="text-xs font-bold text-[#dfd4bf] group-hover:text-[#dfb86c] hidden md:inline truncate max-w-[100px]">
                  {currentUser.username}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: Dedicated Navigation Row underneath PocketAlbum title */}
          {/* Primary Navigation: 4 Main Sections fit evenly across the available width */}
          <nav className="w-full grid grid-cols-4 gap-1.5 sm:gap-2.5 pt-1 pb-3">
            <button
              onClick={() => {
                setActiveTab('collection');
                setViewingUser(null);
                setScreenHistory([]);
              }}
              className={`w-full py-2.5 px-1 sm:px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 min-w-0 cursor-pointer ${
                activeTab === 'collection' && isViewingSelf
                  ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md shadow-[#dfb86c]/20 font-black border border-[#fae19c]'
                  : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14] bg-[#16110d]/80 border border-[#5a4420]/40'
              }`}
            >
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate text-center">
                <span className="hidden sm:inline">My </span>Collection
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('leaderboards');
                setViewingUser(null);
                setScreenHistory([]);
              }}
              className={`w-full py-2.5 px-1 sm:px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 min-w-0 cursor-pointer ${
                activeTab === 'leaderboards'
                  ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md shadow-[#dfb86c]/20 font-black border border-[#fae19c]'
                  : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14] bg-[#16110d]/80 border border-[#5a4420]/40'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate text-center">
                <span className="hidden sm:inline">Leaderboards</span>
                <span className="sm:hidden">Leaders</span>
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('chat');
                setViewingUser(null);
                setScreenHistory([]);
              }}
              className={`w-full py-2.5 px-1 sm:px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 min-w-0 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md shadow-[#dfb86c]/20 font-black border border-[#fae19c]'
                  : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14] bg-[#16110d]/80 border border-[#5a4420]/40'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate text-center">Chat</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('news');
                setViewingUser(null);
                setScreenHistory([]);
              }}
              className={`w-full py-2.5 px-1 sm:px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 min-w-0 cursor-pointer ${
                activeTab === 'news'
                  ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md shadow-[#dfb86c]/20 font-black border border-[#fae19c]'
                  : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14] bg-[#16110d]/80 border border-[#5a4420]/40'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate text-center">News</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Main Content Area: Centered, responsive container */}
      <main className={`flex-1 w-full max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-6 pt-5 sm:pt-7 space-y-6 min-w-0 ${
        activeTab === 'collection' && isViewingSelf ? 'pb-28 sm:pb-12' : 'pb-6 sm:pb-8'
      }`}>
        {/* Banner when viewing someone else's public collection */}
        {!isViewingSelf && (
          <div className="bg-gradient-to-r from-[#241a13] via-[#1c140f] to-[#241a13] border border-[#7a5c28]/60 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 shadow-xl shadow-black/70 w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={displayUser.profile_photo}
                alt={displayUser.username}
                referrerPolicy="no-referrer"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#8f6d33] shadow-md shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] sm:text-xs font-serif font-semibold text-[#dfb86c] uppercase tracking-wider truncate">
                  Public Numismatic Registry
                </div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#f7eedd] truncate">
                  Viewing {displayUser.username}'s Collection
                </h2>
                <p className="text-xs text-[#a89c8d] truncate">{displayUser.about_me}</p>
              </div>
            </div>

            {/* Action buttons: structured so NOTHING ever bleeds off-screen */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto shrink-0">
              {/* Vote for this user */}
              <button
                onClick={handleVoteForViewingUser}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border min-w-0 ${
                  displayUser.has_voted
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-[#1a130e] hover:bg-rose-950/40 border-[#5a4420]/60 text-[#dfd4bf]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 shrink-0 ${displayUser.has_voted ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span className="truncate">{displayUser.has_voted ? 'Voted' : 'Vote'} ({displayUser.total_votes || 0})</span>
              </button>

              {/* Friend action button */}
              <button
                onClick={handleFriendClickViewingUser}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border min-w-0 ${
                  displayUser.is_friend
                    ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                    : displayUser.friend_status === 'request_sent'
                    ? 'bg-amber-950/50 border-amber-700 text-amber-300'
                    : displayUser.friend_status === 'request_received'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-[#1a130e] hover:bg-[#251b14] border-[#5a4420]/60 text-[#dfd4bf]'
                }`}
              >
                {displayUser.is_friend ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Friends</span>
                  </>
                ) : displayUser.friend_status === 'request_sent' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-[#dfb86c] shrink-0" />
                    <span className="truncate">Requested</span>
                  </>
                ) : displayUser.friend_status === 'request_received' ? (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Accept Request</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Add Friend</span>
                  </>
                )}
              </button>

              {/* Return to last screen: spans 2 columns on mobile, auto width on desktop, wrapped text */}
              <button
                onClick={handleReturnToLastScreen}
                className="col-span-2 sm:col-auto w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span className="whitespace-normal text-center">Return to Last Screen</span>
              </button>
            </div>
          </div>
        )}

        {/* View 1: Collection Dashboard (My Collection or Other User's Collection) */}
        {activeTab === 'collection' && (
          <div className="space-y-6 w-full max-w-full overflow-hidden">
            {/* Collector Profile Overview Card */}
            <div className="bg-gradient-to-b from-[#241a13] via-[#1c140f] to-[#140e0a] border border-[#7a5c28]/45 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-black/80 relative overflow-hidden space-y-4 sm:space-y-5 w-full">
              {/* Background ambient gold coin rim glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#cba153]/5 rounded-full blur-3xl pointer-events-none" />

              {/* 1. Header: Profile photo + username + collection votes + membership length */}
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={displayUser.profile_photo}
                    alt={displayUser.username}
                    referrerPolicy="no-referrer"
                    className="w-18 h-18 sm:w-22 sm:h-22 rounded-full object-cover border-4 border-[#8f6d33]/80 shadow-xl"
                    style={{ width: '4.75rem', height: '4.75rem' }}
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-[#1a130e] border border-[#dfb86c]/70 rounded-full shadow text-[#dfb86c]">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-black text-[#f7eedd] tracking-tight truncate">
                    {displayUser.username}
                  </h1>

                  {/* Collection Votes - directly to the right of photo */}
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-400">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-rose-500 text-rose-500 shrink-0" />
                    <span>{displayUser.total_votes || 0} Collection Votes</span>
                    {displayUser.weekly_votes !== undefined && (
                      <span className="text-[11px] text-[#dfb86c] font-semibold ml-2 hidden sm:inline">
                        • {displayUser.weekly_votes} this week
                      </span>
                    )}
                  </div>

                  {/* Length of membership */}
                  <div className="text-xs text-[#a89c8d] flex items-center gap-1">
                    <span>Collector since {displayUser.member_since || 'January 2024'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Short About Me */}
              <div className="text-xs sm:text-sm text-[#dfd4bf] leading-relaxed bg-[#150f0b]/80 p-3 sm:p-4 rounded-2xl border border-[#5a4420]/40">
                <span className="text-xs font-serif font-bold text-[#dfb86c] block mb-1 uppercase tracking-wider">
                  Collector Statement
                </span>
                <p className="text-[#dfd4bf]">{displayUser.about_me || 'Passionate numismatist preserving rare coinage history.'}</p>
              </div>

              {/* 3. Quick Action Button (If self: Edit profile; If someone else: Vote & Friend & Return to Last Screen) */}
              {isViewingSelf ? (
                <div className="pt-1 flex flex-wrap gap-2">
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-gradient-to-b from-[#2d2119] to-[#1e1510] hover:from-[#38291f] hover:to-[#261b14] text-[#f7eedd] border border-[#8f6d33]/70 hover:border-[#dfb86c] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#dfb86c]" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => setIsFriendsOpen(true)}
                    className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-gradient-to-b from-[#2d2119] to-[#1e1510] hover:from-[#38291f] hover:to-[#261b14] text-[#f7eedd] border border-[#8f6d33]/70 hover:border-[#dfb86c] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Users className="w-3.5 h-3.5 text-[#dfb86c]" />
                    <span>Manage Friends ({friendsCount})</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 w-full pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleVoteForViewingUser}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        displayUser.has_voted
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-[#1a130e] hover:bg-rose-950/40 border-[#5a4420]/60 text-[#dfd4bf]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 shrink-0 ${displayUser.has_voted ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span className="truncate">{displayUser.has_voted ? 'Collection Voted' : 'Vote'} ({displayUser.total_votes || 0})</span>
                    </button>

                    <button
                      onClick={handleFriendClickViewingUser}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        displayUser.is_friend
                          ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                          : displayUser.friend_status === 'request_sent'
                          ? 'bg-amber-950/50 border-amber-700 text-amber-300'
                          : displayUser.friend_status === 'request_received'
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-[#1a130e] hover:bg-[#251b14] border-[#5a4420]/60 text-[#dfd4bf]'
                      }`}
                    >
                      {displayUser.is_friend ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">Friends</span>
                        </>
                      ) : displayUser.friend_status === 'request_sent' ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">Pending</span>
                        </>
                      ) : displayUser.friend_status === 'request_received' ? (
                        <>
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Accept Request</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Add Friend</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={handleReturnToLastScreen}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-[#dfb86c]/20 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span>Return to Last Screen</span>
                  </button>
                </div>
              )}

              {/* Collection Statistics */}
              <div className="pt-2">
                <div className="text-[11px] sm:text-xs font-serif font-bold uppercase tracking-wider text-[#dfb86c] mb-2.5">
                  Collection Statistics
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="bg-[#150f0b]/90 p-3 sm:p-3.5 rounded-xl border border-[#5a4420]/40 text-center min-w-0 shadow-sm">
                    <span className="text-[10px] sm:text-[11px] uppercase font-bold text-[#a89c8d] block tracking-wider truncate">
                      Total Coins
                    </span>
                    <span className="text-lg sm:text-xl font-serif font-black text-[#f7eedd] mt-0.5 block truncate">
                      {displayUser.coins_count || 0}
                    </span>
                  </div>

                  <div className="bg-[#150f0b]/90 p-3 sm:p-3.5 rounded-xl border border-[#5a4420]/40 text-center min-w-0 shadow-sm">
                    <span className="text-[10px] sm:text-[11px] uppercase font-bold text-[#a89c8d] block tracking-wider truncate">
                      Certified Graded
                    </span>
                    <span className="text-lg sm:text-xl font-serif font-black text-[#dfb86c] mt-0.5 block truncate">
                      {displayUser.graded_count || 0}
                    </span>
                  </div>

                  <div className="bg-[#150f0b]/90 p-3 sm:p-3.5 rounded-xl border border-[#5a4420]/40 text-center min-w-0 shadow-sm">
                    <span className="text-[10px] sm:text-[11px] uppercase font-bold text-[#a89c8d] block tracking-wider truncate">
                      Bullion Pieces
                    </span>
                    <span className="text-lg sm:text-xl font-serif font-black text-[#dfd4bf] mt-0.5 block truncate">
                      {displayUser.bullion_count || 0}
                    </span>
                  </div>

                  <div className="bg-[#150f0b]/90 p-3 sm:p-3.5 rounded-xl border border-[#5a4420]/40 text-center min-w-0 shadow-sm">
                    <span className="text-[10px] sm:text-[11px] uppercase font-bold text-[#a89c8d] block tracking-wider truncate">
                      Colonial Issues
                    </span>
                    <span className="text-lg sm:text-xl font-serif font-black text-[#dfd4bf] mt-0.5 block truncate">
                      {displayUser.colonials_count || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Social / Collector Bio Info & Collector Score */}
              <div className="pt-2 border-t border-[#5a4420]/30 flex flex-wrap items-center justify-between gap-3 text-xs text-[#a89c8d]">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#dfd4bf]">
                    Collector Score: <span className="text-[#dfb86c] font-bold">{displayUser.score || 0}</span>
                  </span>
                  <span>•</span>
                  <span>{displayUser.account_info || 'Numismatic Scholar'}</span>
                </div>
              </div>
            </div>

            {/* If other user's collection is private, show private notification */}
            {!isViewingSelf && Boolean(displayUser.is_collection_private) ? (
              <div className="rounded-3xl bg-gradient-to-b from-[#241a13] via-[#1c140f] to-[#140e0a] border border-[#7a5c28]/45 p-8 text-center shadow-2xl shadow-black/80 space-y-3 my-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#18110b] border border-[#8f6d33]/50 flex items-center justify-center text-[#dfb86c]">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-lg text-[#f7eedd] tracking-wide">
                  Private Numismatic Collection
                </h3>
                <p className="text-xs text-[#a89c8d] max-w-md mx-auto leading-relaxed">
                  {displayUser.username} has configured their coin album and acquisitions to private. Only verified profile overview and summary statistics are visible.
                </p>
              </div>
            ) : (
              <>
                {/* Recently Added Section (Vintage leather styling, displays recent acquisitions) */}
                <RecentlyAddedSection
                  userId={displayUser.id}
                  currentUserId={currentUser.id}
                  isCollectionPrivate={Boolean(displayUser.is_collection_private)}
                  refreshKey={displayUser.coins_count}
                  onCollectionUpdated={() => {
                    fetchUserProfile(displayUser.id, currentUser.id).then(u => {
                      if (u) {
                        if (viewingUser && viewingUser.id === u.id) {
                          setViewingUser(u);
                        } else if (currentUser.id === u.id) {
                          setCurrentUser(u);
                        }
                      }
                    }).catch(() => {});
                  }}
                />

                {/* Collection Sub-navigation: 4 distinct categories */}
                <div className="flex items-center justify-between border-b border-[#5a4420]/40 pb-3 pt-2">
                  <div className="flex items-center gap-2 overflow-x-auto max-w-full scrollbar-none py-1">
                    <button
                      onClick={() => setCollectionCategory('coins')}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        collectionCategory === 'coins'
                          ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md shadow-[#dfb86c]/20 border border-[#fae19c]'
                          : 'bg-[#18120d] text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14] border border-[#5a4420]/40'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Coins & Official Albums</span>
                    </button>

                    <button
                      onClick={() => setCollectionCategory('bullion')}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        collectionCategory === 'bullion'
                          ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md shadow-[#dfb86c]/20 border border-[#fae19c]'
                          : 'bg-[#18120d] text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14] border border-[#5a4420]/40'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Bullion Collection</span>
                    </button>

                    <button
                      onClick={() => setCollectionCategory('colonials')}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        collectionCategory === 'colonials'
                          ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md shadow-[#dfb86c]/20 border border-[#fae19c]'
                          : 'bg-[#18120d] text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14] border border-[#5a4420]/40'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Colonial Coinage</span>
                    </button>

                    <button
                      onClick={() => setCollectionCategory('commemoratives')}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        collectionCategory === 'commemoratives'
                          ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md shadow-[#dfb86c]/20 border border-[#fae19c]'
                          : 'bg-[#18120d] text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#231a14] border border-[#5a4420]/40'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Commemoratives</span>
                    </button>
                  </div>
                </div>

                {/* Render Category View */}
                {collectionCategory === 'coins' && (
                  <CoinsExplorer
                    userId={displayUser.id}
                    isReadOnly={!isViewingSelf}
                    onCollectionUpdated={() => loadUser(currentUser.id)}
                    targetSeriesId={targetSeriesId}
                    onClearTargetSeries={() => setTargetSeriesId(null)}
                  />
                )}

                {collectionCategory === 'bullion' && (
                  <BullionSection
                    userId={displayUser.id}
                    isReadOnly={!isViewingSelf}
                    onCollectionUpdated={() => loadUser(currentUser.id)}
                  />
                )}

                {collectionCategory === 'colonials' && (
                  <ColonialsSection
                    userId={displayUser.id}
                    isReadOnly={!isViewingSelf}
                    onCollectionUpdated={() => loadUser(currentUser.id)}
                  />
                )}

                {collectionCategory === 'commemoratives' && (
                  <CoinsExplorer
                    userId={displayUser.id}
                    isReadOnly={!isViewingSelf}
                    onCollectionUpdated={() => loadUser(currentUser.id)}
                    forceDenominationId="denom_commem"
                    categoryTitle="U.S. Commemorative Issues"
                    categorySubtitle="Official United States commemorative silver, gold, clad, and medal series albums"
                    targetSeriesId={targetSeriesId}
                    onClearTargetSeries={() => setTargetSeriesId(null)}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* View 2: Leaderboards */}
        {activeTab === 'leaderboards' && (
          <Leaderboards
            currentUserId={currentUser.id}
            onViewUserCollection={(targetId) => handleViewOtherUser(targetId)}
          />
        )}

        {/* View 3: Chat */}
        {activeTab === 'chat' && (
          <ChatSection
            currentUser={currentUser}
            onViewUserCollection={(targetId) => handleViewOtherUser(targetId)}
          />
        )}

        {/* View 4: News Center */}
        {activeTab === 'news' && (
          <NewsCenter
            currentUser={currentUser}
            onNavigateToSeries={(seriesId) => {
              setTargetSeriesId(seriesId);
              setActiveTab('collection');
              setCollectionCategory('coins');
              setViewingUser(null);
              setScreenHistory([]);
            }}
          />
        )}
      </main>


      {/* Floating Action Button (FAB) on 'My Collection' tab to quickly add a new coin entry without navigating through menus */}
      {activeTab === 'collection' && isViewingSelf && (
        <div className="fixed right-5 sm:right-8 z-40 fab-safe">
          <button
            id="quick-add-coin-fab"
            onClick={() => setIsQuickAddOpen(true)}
            className="group relative flex items-center gap-2 sm:gap-2.5 px-4 py-3.5 sm:px-5 sm:py-4 rounded-full bg-gradient-to-r from-[#dfb86c] via-[#fae19c] to-[#cba153] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-black/80 hover:shadow-2xl border border-[#fae19c]/80 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#dfb86c]/40"
            title="Quick Add Coin to Collection"
            aria-label="Quick Add Coin"
          >
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#18110b] text-[#dfb86c] flex items-center justify-center transition-transform group-hover:rotate-90 duration-300 shadow-inner">
              <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[3]" />
            </span>
            <span className="hidden xs:inline font-serif font-extrabold uppercase tracking-wider text-[11px] sm:text-xs">
              Quick Add Coin
            </span>
            <span className="xs:hidden font-serif font-extrabold uppercase tracking-wider text-[11px]">
              Add
            </span>
          </button>
        </div>
      )}

      {/* Quick Add Coin Modal */}
      {currentUser && (
        <QuickAddCoinModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          ownerId={currentUser.id}
          onCoinSaved={(savedCoin) => {
            loadUser(currentUser.id);
            if (savedCoin?.facebook_status === 'ask_needed') {
              setFacebookPromptCoin(savedCoin);
            }
          }}
        />
      )}

      {/* Facebook Sharing Prompt for 'Ask' user preference */}
      {facebookPromptCoin && currentUser && (
        <FacebookSharingModal
          isOpen={!!facebookPromptCoin}
          onClose={() => setFacebookPromptCoin(null)}
          coin={facebookPromptCoin}
          userId={currentUser.id}
        />
      )}

      {/* Admin Facebook Automation Center */}
      {isFacebookAdminOpen && currentUser && (
        <FacebookAutomationCenter
          isOpen={isFacebookAdminOpen}
          onClose={() => setIsFacebookAdminOpen(false)}
          adminUserId={currentUser.id}
        />
      )}

      {/* Profile & Account Switcher Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUserChanged={handleSwitchUser}
        onOpenFacebookAdmin={() => setIsFacebookAdminOpen(true)}
      />

      {/* Friends & Network Modal */}
      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => {
          setIsFriendsOpen(false);
          refreshSocialCounts();
        }}
        currentUser={currentUser}
        onViewUserCollection={(targetId) => handleViewOtherUser(targetId, { fromFriendsModal: true })}
      />

      {/* GLOBAL FRIEND REMOVAL CONFIRMATION MODAL */}
      {friendConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-rose-900/60 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-serif font-bold text-[#f7eedd]">
                Remove Friend?
              </h4>
              <p className="text-xs text-[#a89c8d] leading-relaxed">
                Are you sure you want to remove <span className="text-[#dfb86c] font-bold">{friendConfirmModal.username}</span> from your friends list? You will need to send a new friend request to reconnect.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setFriendConfirmModal(null)}
                disabled={isRemovingFriend}
                className="w-full py-2 bg-[#1d1611] hover:bg-[#281e17] text-[#dfd4bf] border border-[#5a4420]/50 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveFriendFromBanner}
                disabled={isRemovingFriend}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 shadow"
              >
                <span>{isRemovingFriend ? 'Removing...' : 'Yes, Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
