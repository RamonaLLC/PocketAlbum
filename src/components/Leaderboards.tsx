import React, { useState, useEffect } from 'react';
import { LeaderboardUser } from '../types.ts';
import { fetchLeaderboards, toggleVote, sendFriendRequest, removeFriend, fetchFriends, fetchFriendRequests } from '../utils/api.ts';
import { Trophy, Heart, Eye, UserPlus, UserCheck, Flame, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface LeaderboardsProps {
  currentUserId: string;
  onViewUserCollection: (userId: string) => void;
}

type SortCategory = 'weekly_votes' | 'votes' | 'coins' | 'graded' | 'score';

export const Leaderboards: React.FC<LeaderboardsProps> = ({ currentUserId, onViewUserCollection }) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [sortBy, setSortBy] = useState<SortCategory>('weekly_votes');
  const [loading, setLoading] = useState(true);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [pendingSentIds, setPendingSentIds] = useState<Set<string>>(new Set());
  const [votingMap, setVotingMap] = useState<Record<string, boolean>>({});
  const [weeklyWindow, setWeeklyWindow] = useState<{ start_formatted: string; end_formatted: string } | null>(null);

  // Friend removal confirmation state
  const [friendToRemove, setFriendToRemove] = useState<{ id: string; username: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [boardRes, friends, reqs] = await Promise.all([
        fetchLeaderboards(sortBy, currentUserId),
        fetchFriends(currentUserId),
        fetchFriendRequests(currentUserId),
      ]);
      setUsers(boardRes.users || []);
      if (boardRes.weekly_window) {
        setWeeklyWindow(boardRes.weekly_window);
      }
      setFriendIds(new Set(friends.map(f => f.id)));
      setPendingSentIds(new Set(reqs.sent.map(r => r.receiver_id)));
    } catch (err) {
      console.error('Failed to load leaderboards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sortBy, currentUserId]);

  const handleVote = async (targetUserId: string) => {
    if (targetUserId === currentUserId) return;
    try {
      const res = await toggleVote(currentUserId, targetUserId);
      setVotingMap(prev => ({ ...prev, [targetUserId]: res.voted }));
      setUsers(prev => prev.map(u => {
        if (u.id === targetUserId) {
          return {
            ...u,
            total_votes: res.total_votes,
            weekly_votes: res.weekly_votes ?? u.weekly_votes,
            has_voted: res.voted
          };
        }
        return u;
      }));
    } catch (err) {
      console.error('Failed to toggle vote:', err);
    }
  };

  const handleFriendAction = async (targetUser: LeaderboardUser) => {
    if (targetUser.id === currentUserId) return;
    const isFriend = friendIds.has(targetUser.id);
    if (isFriend) {
      setFriendToRemove({ id: targetUser.id, username: targetUser.username });
    } else {
      try {
        await sendFriendRequest(currentUserId, targetUser.id);
        setPendingSentIds(prev => new Set(prev).add(targetUser.id));
      } catch (err) {
        console.error('Failed to send friend request:', err);
      }
    }
  };

  const handleConfirmRemove = async () => {
    if (!friendToRemove) return;
    setIsRemoving(true);
    try {
      await removeFriend(currentUserId, friendToRemove.id);
      setFriendIds(prev => {
        const next = new Set(prev);
        next.delete(friendToRemove.id);
        return next;
      });
      setFriendToRemove(null);
    } catch (err) {
      console.error('Failed to remove friend:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header banner */}
      <div className="bg-gradient-to-b from-[#241a13] via-[#1c140f] to-[#140e0a] border border-[#7a5c28]/45 p-5 sm:p-6 rounded-3xl shadow-xl shadow-black/70 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#dfb86c] uppercase tracking-wider">
            <Trophy className="w-4 h-4 shrink-0" />
            <span>Hall of Numismatists</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#f7eedd] tracking-tight mt-0.5">
            Collector Leaderboards
          </h2>
          <p className="text-xs text-[#a89c8d] mt-1 max-w-xl">
            Explore and vote for outstanding numismatic collections. Weekly votes count from Sunday 12:00 AM to Saturday 11:59 PM and reset every Sunday!
          </p>
          {weeklyWindow && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-[#281c14] border border-[#7a5c28]/50 text-[11px] font-semibold text-[#fae19c]">
              <Calendar className="w-3 h-3 text-[#dfb86c] shrink-0" />
              <span>Current Cycle: Sunday {weeklyWindow.start_formatted} – Saturday {weeklyWindow.end_formatted}</span>
            </div>
          )}
        </div>

        {/* Sorting category selector buttons */}
        <div className="flex items-center gap-1.5 bg-[#120d09] p-1.5 rounded-2xl border border-[#5a4420]/40 overflow-x-auto max-w-full scrollbar-none w-full md:w-auto shrink-0">
          <button
            onClick={() => setSortBy('weekly_votes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              sortBy === 'weekly_votes'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>Most Weekly Votes</span>
          </button>

          <button
            onClick={() => setSortBy('votes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              sortBy === 'votes'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            All-Time Votes
          </button>

          <button
            onClick={() => setSortBy('coins')}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              sortBy === 'coins'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            Total Coins
          </button>

          <button
            onClick={() => setSortBy('graded')}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              sortBy === 'graded'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            Graded
          </button>

          <button
            onClick={() => setSortBy('score')}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              sortBy === 'score'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-md border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            Collector Score
          </button>
        </div>
      </div>

      {/* Leaderboard Rows */}
      {loading ? (
        <div className="py-24 text-center text-xs text-[#a89c8d]">Loading rankings...</div>
      ) : (
        <div className="space-y-3 w-full">
          {users.map((user, index) => {
            const rank = index + 1;
            const isMe = user.id === currentUserId;
            const isFriend = friendIds.has(user.id);
            const isPendingSent = pendingSentIds.has(user.id);
            const hasVoted = votingMap[user.id] ?? user.has_voted;

            let rankBadge = (
              <span className="w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-xs bg-[#18120d] border border-[#5a4420]/40 text-[#a89c8d] shrink-0">
                #{rank}
              </span>
            );

            if (rank === 1) {
              rankBadge = (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-serif font-black text-xs sm:text-sm bg-gradient-to-tr from-[#dfb86c] to-[#fae19c] text-[#140e08] shadow-lg shadow-[#dfb86c]/30 border border-[#fae19c] shrink-0">
                  1
                </div>
              );
            } else if (rank === 2) {
              rankBadge = (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-serif font-black text-xs sm:text-sm bg-gradient-to-tr from-[#c8c0b5] to-[#ece5da] text-[#140e08] shadow-md border border-[#ece5da] shrink-0">
                  2
                </div>
              );
            } else if (rank === 3) {
              rankBadge = (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-serif font-black text-xs sm:text-sm bg-gradient-to-tr from-[#a36336] to-[#d68a52] text-[#fff6ed] shadow-md border border-[#d68a52] shrink-0">
                  3
                </div>
              );
            }

            return (
              <div
                key={user.id}
                className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all w-full overflow-hidden ${
                  isMe
                    ? 'bg-gradient-to-b from-[#2c1d15] to-[#1c120c] border-[#dfb86c]/70 ring-1 ring-[#dfb86c]/40 shadow-lg'
                    : 'bg-gradient-to-b from-[#221812] to-[#17100b] hover:from-[#271c15] hover:to-[#1a120c] border-[#7a5c28]/40 hover:border-[#dfb86c]/60 shadow-md shadow-black/50'
                }`}
              >
                {/* Left: Rank, Avatar & Info */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {rankBadge}

                  <div className="relative shrink-0">
                    <img
                      src={user.profile_photo}
                      alt={user.username}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#7a5c28]/70"
                    />
                    {isMe && (
                      <span className="absolute -bottom-1 -right-1 bg-[#dfb86c] text-[#140e08] text-[8px] sm:text-[9px] font-black px-1 rounded-full border border-[#fae19c]">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h3 className="text-sm sm:text-base font-serif font-bold text-[#f7eedd] truncate">{user.username}</h3>
                      <span className="text-[10px] sm:text-[11px] text-[#dfb86c] font-semibold whitespace-nowrap">
                        Score: {user.score}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#a89c8d] line-clamp-1 mt-0.5">
                      {user.about_me}
                    </p>
                  </div>
                </div>

                {/* Center Stats Badges: flexible responsive layout */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 text-xs w-full lg:w-auto">
                  {/* Weekly Votes Box */}
                  <div className={`text-center px-2 py-1 rounded-xl border ${
                    sortBy === 'weekly_votes'
                      ? 'bg-[#dfb86c]/15 border-[#dfb86c]/50'
                      : 'bg-[#120d09]/80 border-[#5a4420]/40'
                  }`}>
                    <span className="text-[#dfb86c] flex items-center justify-center gap-0.5 text-[9px] sm:text-[10px] uppercase font-bold">
                      <Flame className="w-2.5 h-2.5 text-orange-400" />
                      Weekly
                    </span>
                    <span className="font-serif font-bold text-[#fae19c] text-xs sm:text-sm">{user.weekly_votes || 0}</span>
                  </div>

                  <div className="text-center px-1.5 py-1 bg-[#120d09]/80 rounded-xl border border-[#5a4420]/40">
                    <span className="text-[#a89c8d] block text-[9px] sm:text-[10px] uppercase font-semibold">Coins</span>
                    <span className="font-serif font-bold text-[#f7eedd] text-xs sm:text-sm">{user.coins_count}</span>
                  </div>

                  <div className="text-center px-1.5 py-1 bg-[#120d09]/80 rounded-xl border border-[#5a4420]/40">
                    <span className="text-[#a89c8d] block text-[9px] sm:text-[10px] uppercase font-semibold">Graded</span>
                    <span className="font-serif font-bold text-[#dfb86c] text-xs sm:text-sm">{user.graded_count}</span>
                  </div>

                  <div className="text-center px-1.5 py-1 bg-[#120d09]/80 rounded-xl border border-[#5a4420]/40">
                    <span className="text-[#a89c8d] block text-[9px] sm:text-[10px] uppercase font-semibold">Bullion</span>
                    <span className="font-serif font-bold text-[#dfd4bf] text-xs sm:text-sm">{user.bullion_count}</span>
                  </div>

                  <div className="text-center px-1.5 py-1 bg-[#120d09]/80 rounded-xl border border-[#5a4420]/40">
                    <span className="text-[#a89c8d] block text-[9px] sm:text-[10px] uppercase font-semibold">All Votes</span>
                    <span className="font-serif font-bold text-[#f7eedd] text-xs sm:text-sm">{user.total_votes}</span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#5a4420]/30 w-full lg:w-auto shrink-0">
                  {/* View collection */}
                  <button
                    onClick={() => onViewUserCollection(user.id)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-serif font-semibold text-[#f7eedd] hover:text-white bg-[#241a13] hover:bg-[#322319] border border-[#7a5c28]/60 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#dfb86c]" />
                    <span>View</span>
                  </button>

                  {/* Vote button */}
                  {!isMe && (
                    <button
                      onClick={() => handleVote(user.id)}
                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        hasVoted
                          ? 'bg-rose-950/40 border-rose-500/60 text-rose-300 shadow-sm'
                          : 'bg-[#241a13] hover:bg-rose-950/30 border-[#7a5c28]/60 hover:border-rose-800 text-[#dfd4bf] hover:text-rose-300'
                      }`}
                      title="Vote for this collection"
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{hasVoted ? 'Voted' : 'Vote'}</span>
                    </button>
                  )}

                  {/* Friend toggle */}
                  {!isMe && (
                    <button
                      onClick={() => handleFriendAction(user)}
                      className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer ${
                        isFriend
                          ? 'bg-emerald-950/40 border-emerald-700/70 text-emerald-400'
                          : isPendingSent
                          ? 'bg-[#281c14] border-[#dfb86c]/60 text-[#dfb86c]'
                          : 'bg-[#241a13] border-[#7a5c28]/60 text-[#a89c8d] hover:text-[#f7eedd]'
                      }`}
                      title={isFriend ? 'Friend Added (Click to remove)' : isPendingSent ? 'Request Pending' : 'Send Friend Request'}
                    >
                      {isFriend ? (
                        <UserCheck className="w-4 h-4" />
                      ) : isPendingSent ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REMOVAL CONFIRMATION MODAL */}
      {friendToRemove && (
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
                Are you sure you want to remove <span className="text-[#dfb86c] font-bold">{friendToRemove.username}</span> from your friends list? You will need to send a new friend request to reconnect.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setFriendToRemove(null)}
                disabled={isRemoving}
                className="w-full py-2 bg-[#221812] hover:bg-[#2e2018] text-[#dfd4bf] rounded-xl text-xs font-bold border border-[#5a4420]/40 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow cursor-pointer"
              >
                <span>{isRemoving ? 'Removing...' : 'Yes, Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
