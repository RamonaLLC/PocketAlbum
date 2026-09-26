import React from 'react';
import {
  Globe, Plus, Compass, Mail, X, Users
} from 'lucide-react';
import { ChatGroup, User } from '../../types.ts';

interface ChatSidebarProps {
  currentUser: User;
  activeChatId: string; // 'universal' or groupId
  userGroups: ChatGroup[];
  pendingInvitesCount: number;
  onSelectChat: (chatId: string) => void;
  onCreateGroupClick: () => void;
  onJoinGroupClick: () => void;
  onGroupInvitesClick: () => void;
  onCloseMobileSidebar?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  currentUser,
  activeChatId,
  userGroups,
  pendingInvitesCount,
  onSelectChat,
  onCreateGroupClick,
  onJoinGroupClick,
  onGroupInvitesClick,
  onCloseMobileSidebar,
}) => {
  return (
    <div className="h-full flex flex-col justify-between bg-[#150f0b] border-r border-[#5a4420]/40 p-3 sm:p-4">
      <div className="space-y-4 overflow-y-auto">
        {/* Mobile Header with Close Button */}
        {onCloseMobileSidebar && (
          <div className="flex items-center justify-between md:hidden pb-2.5 mb-1 border-b border-[#5a4420]/40">
            <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#f7eedd]">
              <Users className="w-4 h-4 text-[#dfb86c]" />
              <span>Channels & Guilds</span>
            </div>
            <button
              onClick={onCloseMobileSidebar}
              className="px-2.5 py-1 rounded-xl bg-[#221812] hover:bg-[#2d2018] text-[#dfd4bf] hover:text-[#f7eedd] border border-[#7a5c28]/50 text-xs font-serif font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Close Channels Menu"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        )}

        {/* Top Action Buttons (Create Group, Join Group, Group Invites) */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-serif font-bold text-[#a89c8d] uppercase tracking-wider px-2 mb-1">
            Numismatic Community
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onCreateGroupClick}
              className="px-2.5 py-2 rounded-xl bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] text-xs font-serif font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer border border-[#fae19c]/70"
              title="Create a new numismatic group"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="truncate">Create Group</span>
            </button>

            <button
              onClick={onJoinGroupClick}
              className="px-2.5 py-2 rounded-xl bg-[#221812] hover:bg-[#2d2018] border border-[#7a5c28]/50 text-[#f7eedd] text-xs font-serif font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Discover & join existing groups"
            >
              <Compass className="w-3.5 h-3.5 text-[#dfb86c]" />
              <span className="truncate">Join Group</span>
            </button>
          </div>

          {/* Group Invites Button */}
          <button
            onClick={onGroupInvitesClick}
            className="w-full px-3 py-2 rounded-xl bg-[#1c140f] hover:bg-[#251a13] border border-[#5a4420]/50 text-[#dfd4bf] text-xs font-serif font-bold flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#dfb86c]" />
              <span>Group Invites</span>
            </div>
            {pendingInvitesCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-[#dfb86c] text-[#140e08] text-[10px] font-extrabold shadow-sm animate-pulse">
                {pendingInvitesCount} New
              </span>
            ) : (
              <span className="text-[10px] text-[#a89c8d]">View</span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#5a4420]/30 my-2" />

        {/* Chat Channels Section */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-serif font-bold text-[#a89c8d] uppercase tracking-wider px-2 mb-1">
            Channels & Guilds
          </div>

          {/* PERMANENT TOP OPTION: Universal Chat */}
          <button
            onClick={() => onSelectChat('universal')}
            className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 cursor-pointer ${
              activeChatId === 'universal'
                ? 'bg-[#281c14] border border-[#dfb86c]/70 text-[#fae19c] shadow-md ring-1 ring-[#dfb86c]/30'
                : 'text-[#dfd4bf] hover:text-[#f7eedd] hover:bg-[#1f1610] border border-transparent'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activeChatId === 'universal'
                  ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] font-bold shadow-md'
                  : 'bg-[#18120d] text-[#dfb86c] border border-[#5a4420]/50'
              }`}
            >
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold truncate text-[#f7eedd]">
                  Universal Chat
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <p className="text-[11px] text-[#a89c8d] truncate mt-0.5">
                Continuous collector chat &bull; @tagging
              </p>
            </div>
          </button>

          {/* User's Group Chats */}
          <div className="pt-2">
            <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-serif font-bold text-[#a89c8d] uppercase tracking-wider">
              <span>My Groups ({userGroups.length})</span>
            </div>

            {userGroups.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#a89c8d] bg-[#140e0a] rounded-xl border border-dashed border-[#5a4420]/40">
                You haven't joined any groups yet. Use "Create Group" or "Join Group" above!
              </div>
            ) : (
              <div className="space-y-1">
                {userGroups.map(group => {
                  const isActive = activeChatId === group.id;
                  const isLeader = group.is_leader || group.user_role === 'leader';
                  const pendingCount = group.pending_requests_count || 0;

                  return (
                    <button
                      key={group.id}
                      onClick={() => onSelectChat(group.id)}
                      className={`w-full text-left p-2.5 rounded-2xl transition-all flex items-center gap-2.5 cursor-pointer ${
                        isActive
                          ? 'bg-[#281c14] border border-[#dfb86c]/70 text-[#fae19c] shadow-md'
                          : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#1f1610] border border-transparent'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#140e0a] border border-[#5a4420]/50 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                        {group.icon_url && (group.icon_url.startsWith('http') || group.icon_url.startsWith('data:image')) ? (
                          <img
                            src={group.icon_url}
                            alt={group.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{group.icon_url || '🪙'}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-serif font-bold text-[#f7eedd] truncate">
                            {group.name}
                          </span>
                          {isLeader && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#dfb86c]/20 text-[#fae19c] border border-[#dfb86c]/40 shrink-0">
                              Host
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#a89c8d] truncate flex items-center justify-between mt-0.5">
                          <span>{group.members_count || 1} members</span>
                          {isLeader && pendingCount > 0 && (
                            <span className="px-1.5 rounded-full bg-[#dfb86c] text-[#140e08] font-extrabold text-[9px]">
                              {pendingCount} req
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Status Footer */}
      <div className="pt-3 border-t border-[#5a4420]/30 flex items-center gap-3 px-1 mt-2">
        <img
          src={currentUser.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
          alt={currentUser.username}
          referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-full object-cover border border-[#7a5c28]/70"
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-serif font-bold text-[#f7eedd] truncate">
            @{currentUser.username}
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </div>
        </div>
      </div>
    </div>
  );
};
