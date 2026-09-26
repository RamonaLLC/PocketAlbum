import React, { useState, useEffect } from 'react';
import { X, Search, Users, Shield, Check, Clock, Loader2, Sparkles, Globe, Lock, UserPlus, MessageCircle } from 'lucide-react';
import { discoverGroups, sendGroupJoinRequest, joinGroupDirect } from '../../utils/api.ts';
import { ChatGroup, User } from '../../types.ts';

interface JoinGroupModalProps {
  currentUser: User;
  onClose: () => void;
  onJoinedOrSelected?: (group: ChatGroup) => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  currentUser,
  onClose,
  onJoinedOrSelected,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingMap, setRequestingMap] = useState<Record<string, boolean>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

  const loadGroups = async (query = '') => {
    setLoading(true);
    try {
      const data = await discoverGroups(currentUser.id, query);
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadGroups(searchQuery);
  };

  const handleJoinDirect = async (group: ChatGroup) => {
    if (requestingMap[group.id]) return;
    setRequestingMap(prev => ({ ...prev, [group.id]: true }));

    try {
      await joinGroupDirect(group.id, currentUser.id);
      setFeedbackMap(prev => ({ ...prev, [group.id]: 'Joined successfully!' }));
      setGroups(prev =>
        prev.map(g => (g.id === group.id ? { ...g, is_member: true, members_count: (g.members_count || 1) + 1 } : g))
      );
      if (onJoinedOrSelected) {
        onJoinedOrSelected({ ...group, is_member: true });
      }
    } catch (err: any) {
      setFeedbackMap(prev => ({ ...prev, [group.id]: err.message || 'Failed to join group' }));
    } finally {
      setRequestingMap(prev => ({ ...prev, [group.id]: false }));
    }
  };

  const handleJoinRequest = async (groupId: string) => {
    if (requestingMap[groupId]) return;
    setRequestingMap(prev => ({ ...prev, [groupId]: true }));

    try {
      const res = await sendGroupJoinRequest(groupId, currentUser.id);
      setFeedbackMap(prev => ({ ...prev, [groupId]: res.message || 'Request sent' }));
      setGroups(prev =>
        prev.map(g => (g.id === groupId ? { ...g, has_pending_request: true } : g))
      );
    } catch (err: any) {
      setFeedbackMap(prev => ({ ...prev, [groupId]: err.message || 'Failed to send request' }));
    } finally {
      setRequestingMap(prev => ({ ...prev, [groupId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#7a5c28]/40 bg-[#19110b]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#dfb86c]/20 text-[#dfb86c] flex items-center justify-center border border-[#dfb86c]/40">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#f7eedd]">Join a Guild</h3>
              <p className="text-xs text-[#a89c8d]">Discover and join numismatic community circles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#251a13] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#5a4420]/30 bg-[#120d09]">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-[#a89c8d] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (!e.target.value) loadGroups('');
              }}
              placeholder="Search groups by name (e.g. Morgan, Colonial, Gold)..."
              className="w-full pl-10 pr-4 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c]"
            />
          </form>
        </div>

        {/* Group List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#a89c8d] flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#dfb86c]" />
              Searching communities...
            </div>
          ) : groups.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#a89c8d]">
              <Sparkles className="w-8 h-8 mx-auto text-[#7a5c28] mb-2" />
              No groups found matching "{searchQuery}".
            </div>
          ) : (
            groups.map(group => {
              const isMember = group.is_member;
              const hasPending = group.has_pending_request;
              const isRequesting = requestingMap[group.id];
              const feedback = feedbackMap[group.id];
              const isGroupPublic = group.is_public !== 0;

              return (
                <div
                  key={group.id}
                  className="p-4 rounded-2xl bg-[#140e0a] border border-[#5a4420]/40 hover:border-[#7a5c28] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#241a13] border border-[#7a5c28]/60 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                      {group.icon_url && (group.icon_url.startsWith('http') || group.icon_url.startsWith('data:')) ? (
                        <img src={group.icon_url} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{group.icon_url || '🪙'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-serif font-bold text-[#f7eedd] truncate">
                          {group.name}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#241a13] text-[#dfd4bf]">
                          <Users className="w-2.5 h-2.5" />
                          {group.members_count || 1} {group.members_count === 1 ? 'member' : 'members'}
                        </span>
                        {isGroupPublic ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            <Globe className="w-2.5 h-2.5" />
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1c130d] text-[#a89c8d] border border-[#5a4420]/40">
                            <Lock className="w-2.5 h-2.5" />
                            Private
                          </span>
                        )}
                      </div>

                      {group.description && (
                        <p className="text-xs text-[#a89c8d] mt-1 line-clamp-2 leading-relaxed">
                          {group.description}
                        </p>
                      )}

                      <div className="text-[10px] text-[#a89c8d] mt-1.5 flex items-center gap-1 flex-wrap">
                        <Shield className="w-3 h-3 text-[#dfb86c]" />
                        Host: <span className="text-[#dfd4bf] font-medium">@{group.leader_username}</span>
                        {!isGroupPublic && (
                          <span className="text-[#a89c8d]">&bull; Requires leader approval</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status / Action Button */}
                  <div className="shrink-0 self-end sm:self-center">
                    {feedback && (
                      <div className="text-[10px] text-[#dfb86c] font-medium mb-1 text-right">
                        {feedback}
                      </div>
                    )}

                    {isMember ? (
                      <button
                        onClick={() => onJoinedOrSelected && onJoinedOrSelected(group)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] rounded-xl text-xs font-serif font-bold shadow-md border border-[#fae19c]/70 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Jump directly to this group's chat"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Open Chat</span>
                      </button>
                    ) : hasPending ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#241a13] border border-[#dfb86c]/40 text-[#dfb86c] rounded-xl text-xs font-serif font-semibold">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Request Pending
                      </div>
                    ) : isGroupPublic ? (
                      <button
                        onClick={() => handleJoinDirect(group)}
                        disabled={isRequesting}
                        className="px-4 py-2 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] rounded-xl text-xs font-serif font-bold shadow-md border border-[#fae19c]/70 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isRequesting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            Join Guild
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinRequest(group.id)}
                        disabled={isRequesting}
                        className="px-4 py-2 bg-[#241a13] hover:bg-[#322319] text-[#dfd4bf] hover:text-[#fae19c] border border-[#7a5c28]/60 rounded-xl text-xs font-serif font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isRequesting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Request to Join'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#5a4420]/30 bg-[#120d09] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#241a13] hover:bg-[#322319] text-[#dfd4bf] text-xs font-serif font-bold rounded-xl border border-[#7a5c28]/50 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
