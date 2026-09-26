import React, { useState, useEffect } from 'react';
import { User, FriendRequest } from '../types.ts';
import {
  fetchFriends,
  fetchUsers,
  fetchFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  cancelFriendRequest,
  removeFriend
} from '../utils/api.ts';
import {
  Users,
  X,
  UserMinus,
  UserPlus,
  Search,
  Eye,
  Check,
  Clock,
  Send,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onViewUserCollection: (userId: string) => void;
}

type TabType = 'friends' | 'requests' | 'search';

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onViewUserCollection,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Remove confirmation state
  const [friendToRemove, setFriendToRemove] = useState<{ id: string; username: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Status messages
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsList, reqs] = await Promise.all([
        fetchFriends(currentUser.id),
        fetchFriendRequests(currentUser.id),
      ]);
      setFriends(friendsList);
      setReceivedRequests(reqs.received || []);
      setSentRequests(reqs.sent || []);
    } catch (err) {
      console.error('Failed to load friends & requests data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentUser.id]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await fetchUsers(searchQuery.trim(), currentUser.id);
      setSearchResults(results.filter(u => u.id !== currentUser.id));
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    try {
      await sendFriendRequest(currentUser.id, receiverId);
      showFeedback('Friend request sent!');
      loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to send request');
    }
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'deny') => {
    try {
      await respondToFriendRequest(requestId, currentUser.id, action);
      showFeedback(action === 'accept' ? 'Friend request accepted!' : 'Request denied.');
      loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to respond');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelFriendRequest(requestId, currentUser.id);
      showFeedback('Friend request cancelled.');
      loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to cancel request');
    }
  };

  const handleConfirmRemoveFriend = async () => {
    if (!friendToRemove) return;
    setIsRemoving(true);
    try {
      await removeFriend(currentUser.id, friendToRemove.id);
      showFeedback(`Removed @${friendToRemove.username} from friends.`);
      setFriendToRemove(null);
      loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to remove friend');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  const pendingReceivedCount = receivedRequests.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#7a5c28]/40 bg-[#19110b] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#dfb86c]/15 border border-[#dfb86c]/30 text-[#dfb86c] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#f7eedd] truncate">
                Friends & Numismatic Circle
              </h3>
              <p className="text-[11px] text-[#a89c8d] truncate">
                Connect and share coin albums with fellow collectors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#a89c8d] hover:text-[#f7eedd] p-2 rounded-xl hover:bg-[#251a13] transition-colors shrink-0 ml-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback notification toast */}
        {feedbackMessage && (
          <div className="bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] px-4 py-2 text-xs font-serif font-bold text-center shrink-0 transition-all border-b border-[#fae19c]/50">
            {feedbackMessage}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-[#5a4420]/30 bg-[#120d09] p-1.5 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('friends')}
            className={`py-2 px-1 text-xs font-serif font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 truncate cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#1c130d]'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Friends ({friends.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 text-xs font-serif font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative truncate cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#1c130d]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Requests</span>
            {pendingReceivedCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-rose-600 text-white shrink-0">
                {pendingReceivedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`py-2 px-1 text-xs font-serif font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 truncate cursor-pointer ${
              activeTab === 'search'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#1c130d]'
            }`}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Find Collectors</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: FRIENDS LIST */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#a89c8d]">
                  Active Friends ({friends.length})
                </h4>
                <button
                  onClick={() => setActiveTab('search')}
                  className="text-xs font-serif font-bold text-[#dfb86c] hover:text-[#fae19c] flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Friend</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-[#a89c8d]">Loading friends...</div>
              ) : friends.length === 0 ? (
                <div className="py-12 text-center bg-[#140e0a] rounded-2xl border border-[#5a4420]/40 p-6 space-y-3">
                  <Users className="w-10 h-10 text-[#5a4420] mx-auto" />
                  <div className="text-sm font-serif font-bold text-[#dfd4bf]">No Friends Connected Yet</div>
                  <p className="text-xs text-[#a89c8d] max-w-xs mx-auto">
                    You haven't added any fellow collectors to your circle. Browse the leaderboards or search for collectors to send friend requests!
                  </p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] text-xs font-serif font-bold rounded-xl inline-flex items-center gap-1.5 shadow border border-[#fae19c]/70 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Find Numismatists</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#140e0a] border border-[#5a4420]/40 hover:border-[#7a5c28] transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={friend.profile_photo}
                          alt={friend.username}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-[#7a5c28]/60 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-serif font-bold text-[#f7eedd] truncate">
                            {friend.username}
                          </div>
                          <div className="text-[11px] text-[#a89c8d] truncate">
                            {friend.coins_count || 0} Coins • {friend.total_votes || 0} Votes
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            onClose();
                            onViewUserCollection(friend.id);
                          }}
                          className="px-3 py-1.5 text-xs font-serif font-bold text-[#f7eedd] bg-[#241a13] hover:bg-[#322319] hover:text-[#fae19c] border border-[#7a5c28]/50 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          title="View Collection"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#dfb86c]" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => setFriendToRemove({ id: friend.id, username: friend.username })}
                          className="p-2 text-[#a89c8d] hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                          title="Remove friend"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FRIEND REQUESTS (RECEIVED & SENT) */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Received Requests */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#dfb86c] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Received Requests ({receivedRequests.length})</span>
                  </h4>
                </div>

                {receivedRequests.length === 0 ? (
                  <div className="py-6 text-center bg-[#140e0a] rounded-2xl border border-[#5a4420]/30 text-xs text-[#a89c8d]">
                    No pending friend requests received.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {receivedRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-[#140e0a] border border-[#7a5c28]/40 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={req.sender_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                              alt={req.sender_username}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-[#7a5c28]/60 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-serif font-bold text-[#f7eedd] truncate">
                                {req.sender_username}
                              </div>
                              <div className="text-[10px] text-[#a89c8d] truncate">
                                {req.sender_coins_count || 0} Coins in collection
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onClose();
                              onViewUserCollection(req.sender_id);
                            }}
                            className="p-1 text-[#a89c8d] hover:text-[#dfb86c] text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Preview Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Accept / Deny Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => handleRespond(req.id, 'accept')}
                            className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-serif font-bold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRespond(req.id, 'deny')}
                            className="py-1.5 px-3 bg-[#241a13] hover:bg-rose-950/50 hover:text-rose-300 text-[#dfd4bf] border border-[#5a4420]/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Deny</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Requests */}
              <div className="space-y-2.5 pt-2 border-t border-[#5a4420]/30">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#a89c8d] flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#dfb86c]" />
                    <span>Sent Requests ({sentRequests.length})</span>
                  </h4>
                </div>

                {sentRequests.length === 0 ? (
                  <div className="py-6 text-center bg-[#140e0a] rounded-2xl border border-[#5a4420]/30 text-xs text-[#a89c8d]">
                    No pending requests sent.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sentRequests.map(req => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#140e0a] border border-[#5a4420]/40 gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={req.receiver_photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'}
                            alt={req.receiver_username}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-[#7a5c28]/60 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-serif font-bold text-[#f7eedd] truncate">
                              {req.receiver_username}
                            </div>
                            <div className="text-[10px] text-[#dfb86c] font-semibold flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Pending response</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          className="px-2.5 py-1 text-[11px] font-serif font-semibold text-[#a89c8d] hover:text-rose-400 hover:bg-[#251a13] border border-[#5a4420]/50 rounded-lg transition-colors shrink-0 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SEARCH & FIND COLLECTORS */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="space-y-2">
                <label className="block text-xs font-serif font-bold text-[#dfd4bf]">
                  Search Numismatists by Username
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#a89c8d] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="e.g. morgan_master, copper_king..."
                      className="w-full pl-9 pr-3 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-2 text-xs font-serif font-bold text-[#140e08] bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] rounded-xl border border-[#fae19c]/70 transition-all shrink-0 cursor-pointer"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>

              {/* Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-serif font-bold text-[#dfb86c]">Search Results:</div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {searchResults.map(user => {
                      const isFriend = friends.some(f => f.id === user.id);
                      const isSentPending = sentRequests.some(r => r.receiver_id === user.id);
                      const isReceivedPending = receivedRequests.find(r => r.sender_id === user.id);

                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={user.profile_photo}
                              alt={user.username}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover border border-[#7a5c28]/60 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-serif font-bold text-[#f7eedd] block truncate">
                                {user.username}
                              </span>
                              <span className="text-[10px] text-[#a89c8d] block truncate">
                                {user.coins_count || 0} Coins
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                onClose();
                                onViewUserCollection(user.id);
                              }}
                              className="p-1.5 text-[#a89c8d] hover:text-[#dfb86c] rounded hover:bg-[#251a13] cursor-pointer"
                              title="View Collection"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {isFriend ? (
                              <span className="text-[11px] text-emerald-300 font-serif font-bold px-2 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded-lg flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                Friends
                              </span>
                            ) : isReceivedPending ? (
                              <button
                                onClick={() => handleRespond(isReceivedPending.id, 'accept')}
                                className="px-2.5 py-1 text-xs font-serif font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                Accept
                              </button>
                            ) : isSentPending ? (
                              <span className="text-[11px] text-[#dfb86c] font-semibold px-2 py-1 bg-[#241a13] border border-[#7a5c28]/40 rounded-lg flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSendRequest(user.id)}
                                className="px-2.5 py-1 text-xs font-serif font-bold bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] rounded-lg border border-[#fae19c]/70 flex items-center gap-1 cursor-pointer"
                              >
                                <UserPlus className="w-3 h-3" />
                                Add Friend
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#120d09] px-6 py-3 border-t border-[#5a4420]/30 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-serif font-bold text-[#dfd4bf] hover:text-[#f7eedd] bg-[#241a13] hover:bg-[#322319] border border-[#7a5c28]/50 rounded-xl transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* REMOVAL CONFIRMATION DIALOG */}
        {friendToRemove && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#241a13] border border-rose-900/60 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-serif font-bold text-[#f7eedd]">
                  Remove Friend?
                </h4>
                <p className="text-xs text-[#a89c8d] leading-relaxed">
                  Are you sure you want to remove <span className="text-[#dfb86c] font-bold">{friendToRemove.username}</span> from your friends list? You will need to send a new friend request to reconnect.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => setFriendToRemove(null)}
                  disabled={isRemoving}
                  className="w-full py-2 bg-[#1c130d] hover:bg-[#281c14] text-[#dfd4bf] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemoveFriend}
                  disabled={isRemoving}
                  className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-serif font-bold transition-all flex items-center justify-center gap-1 shadow cursor-pointer"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>{isRemoving ? 'Removing...' : 'Yes, Remove'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
