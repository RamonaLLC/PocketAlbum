import React, { useState, useEffect, useRef } from 'react';
import {
  Globe, Menu, MessageSquare,
  Sparkles, Loader2, Shield, Settings, Info
} from 'lucide-react';
import { ChatMessage, ChatGroup, User } from '../types.ts';
import {
  fetchChatMessages, sendChatMessage, fetchUserGroups,
  fetchGroupDetail, fetchGroupInvitations
} from '../utils/api.ts';
import { ChatSidebar } from './chat/ChatSidebar.tsx';
import { ChatMessageItem } from './chat/ChatMessageItem.tsx';
import { ChatInput } from './chat/ChatInput.tsx';
import { CreateGroupModal } from './chat/CreateGroupModal.tsx';
import { JoinGroupModal } from './chat/JoinGroupModal.tsx';
import { GroupInvitesModal } from './chat/GroupInvitesModal.tsx';
import { GroupDetailsModal } from './chat/GroupDetailsModal.tsx';
import { ChatModerationModal } from './chat/ChatModerationModal.tsx';

interface ChatSectionProps {
  currentUser: User;
  onViewUserCollection: (userId: string) => void;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  currentUser,
  onViewUserCollection,
}) => {
  const [activeChatId, setActiveChatId] = useState<string>('universal');
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [userGroups, setUserGroups] = useState<ChatGroup[]>([]);
  const [pendingInvitesCount, setPendingInvitesCount] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInvitesModal, setShowInvitesModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);

  // Prefilled mention
  const [prefilledMention, setPrefilledMention] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load User Groups & Pending Invites
  const loadUserGroupsAndInvites = async () => {
    try {
      const [groups, invites] = await Promise.all([
        fetchUserGroups(currentUser.id),
        fetchGroupInvitations(currentUser.id),
      ]);
      setUserGroups(groups);
      setPendingInvitesCount(invites.received?.length || 0);
    } catch (err) {
      console.error('Failed to load user groups or invites:', err);
    }
  };

  // Load Group Detail if group is active
  const loadActiveGroupDetail = async (groupId: string) => {
    try {
      const g = await fetchGroupDetail(groupId, currentUser.id);
      setActiveGroup(g);
    } catch (err) {
      console.error('Failed to load group detail:', err);
      // If group not found or removed, fallback to universal
      setActiveChatId('universal');
    }
  };

  // Load Messages for the current chat
  const loadMessages = async () => {
    try {
      const channelParam = activeChatId === 'universal' ? 'universal' : `group:${activeChatId}`;
      const data = await fetchChatMessages(channelParam, currentUser.id);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUserGroupsAndInvites();
  }, [currentUser.id]);

  // When active chat changes
  useEffect(() => {
    setLoadingMessages(true);
    if (activeChatId === 'universal') {
      setActiveGroup(null);
    } else {
      loadActiveGroupDetail(activeChatId);
    }
    loadMessages();

    // Close mobile sidebar if open
    setShowMobileSidebar(false);
  }, [activeChatId]);

  // Polling for live chat updates every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
      loadUserGroupsAndInvites();
    }, 3500);

    return () => clearInterval(interval);
  }, [activeChatId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handlers
  const handleSelectChat = (chatId: string) => {
    setShowMobileSidebar(false);
    if (chatId === activeChatId) {
      loadMessages();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setActiveChatId(chatId);
  };

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    const channelParam = activeChatId === 'universal' ? 'universal' : `group:${activeChatId}`;
    const newMsg = await sendChatMessage(currentUser.id, channelParam, content, imageUrl);
    setMessages(prev => [...prev, newMsg]);
  };

  const handleGroupCreated = (newGroup: ChatGroup) => {
    setUserGroups(prev => [newGroup, ...prev]);
    setShowMobileSidebar(false);
    setActiveChatId(newGroup.id);
  };

  const handleInviteAccepted = (groupId: string) => {
    loadUserGroupsAndInvites();
    setShowMobileSidebar(false);
    setActiveChatId(groupId);
  };

  const isUniversal = activeChatId === 'universal';
  const currentChatName = isUniversal ? 'Universal Chat' : activeGroup?.name || 'Group Chat';
  const allowPicturesInCurrent = isUniversal || activeGroup?.allow_pictures !== 0;

  return (
    <div className="relative bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/45 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 h-[750px] max-h-[85vh] flex flex-col md:flex-row">
      {/* SIDEBAR: Hidden on small screens unless toggled */}
      <div
        className={`w-full md:w-80 lg:w-88 shrink-0 h-full ${
          showMobileSidebar ? 'block absolute inset-0 z-40 bg-[#150f0b]' : 'hidden md:block'
        }`}
      >
        <ChatSidebar
          currentUser={currentUser}
          activeChatId={activeChatId}
          userGroups={userGroups}
          pendingInvitesCount={pendingInvitesCount}
          onSelectChat={handleSelectChat}
          onCreateGroupClick={() => setShowCreateModal(true)}
          onJoinGroupClick={() => setShowJoinModal(true)}
          onGroupInvitesClick={() => setShowInvitesModal(true)}
          onCloseMobileSidebar={() => setShowMobileSidebar(false)}
        />
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col justify-between bg-[#150f0b]/80 min-w-0 h-full">
        {/* Chat Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#19110b] border-b border-[#7a5c28]/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Back / Channels Button */}
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="md:hidden px-2.5 py-1.5 rounded-xl bg-[#221812] hover:bg-[#2e2018] text-[#dfd4bf] hover:text-[#fae19c] transition-colors shrink-0 border border-[#7a5c28]/50 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Toggle Channels & Groups"
            >
              <Menu className="w-4 h-4 text-[#dfb86c]" />
              <span className="text-xs font-serif font-bold">Channels</span>
            </button>

            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner overflow-hidden ${
                isUniversal
                  ? 'bg-[#dfb86c]/20 border border-[#dfb86c]/50 text-[#dfb86c]'
                  : 'bg-[#221812] border border-[#7a5c28]/50'
              }`}
            >
              {isUniversal ? (
                <Globe className="w-5 h-5 text-[#dfb86c]" />
              ) : activeGroup?.icon_url && (activeGroup.icon_url.startsWith('http') || activeGroup.icon_url.startsWith('data:image')) ? (
                <img
                  src={activeGroup.icon_url}
                  alt={activeGroup.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{activeGroup?.icon_url || '🪙'}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-serif font-bold text-[#f7eedd] truncate">
                  {currentChatName}
                </h3>
                {isUniversal ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Continuous &bull; Universal
                  </span>
                ) : activeGroup?.is_leader ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-serif font-bold bg-[#dfb86c]/20 text-[#fae19c] border border-[#dfb86c]/40">
                    Host
                  </span>
                ) : null}
              </div>

              <p className="text-[11px] text-[#a89c8d] truncate mt-0.5">
                {isUniversal
                  ? 'Continuous chat for all collectors &bull; Mention any account with @username'
                  : `${activeGroup?.members_count || 1} members &bull; Led by @${activeGroup?.leader_username || 'Leader'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Moderation Reports & Bans Trigger */}
            <button
              onClick={() => setShowModerationModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-[#241a13] hover:bg-[#322319] text-[#dfd4bf] hover:text-[#fae19c] border border-[#7a5c28]/60 text-xs font-serif font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer"
              title="View Chat Moderation, 5-Report Bans & Safety Logs"
            >
              <Shield className="w-3.5 h-3.5 text-[#dfb86c]" />
              <span className="hidden sm:inline">Moderation</span>
            </button>

            {/* Group Details / Settings Action */}
            {!isUniversal && activeGroup && (
              <button
                onClick={() => setShowDetailsModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#241a13] hover:bg-[#322319] text-[#dfd4bf] border border-[#7a5c28]/60 text-xs font-serif font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer"
                title="View Group Details & Settings"
              >
                {activeGroup.is_leader ? (
                  <>
                    <Settings className="w-3.5 h-3.5 text-[#dfb86c]" />
                    <span className="hidden sm:inline">Manage Guild</span>
                    {activeGroup.pending_requests_count ? (
                      <span className="w-4 h-4 rounded-full bg-[#dfb86c] text-[#140e08] text-[9px] font-black flex items-center justify-center">
                        {activeGroup.pending_requests_count}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Info className="w-3.5 h-3.5 text-[#a89c8d]" />
                    <span className="hidden sm:inline">Guild Info</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#140e0a]">
          {loadingMessages ? (
            <div className="py-24 text-center text-xs text-[#a89c8d] flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#dfb86c]" />
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="py-28 text-center text-[#a89c8d] text-xs space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-[#dfb86c]/70" />
              <p className="font-serif font-bold text-[#f7eedd]">Welcome to #{currentChatName}!</p>
              <p className="text-[#a89c8d] max-w-sm mx-auto">
                {isUniversal
                  ? 'Start the discussion! Share coin discoveries, ask for grading feedback, or tag a fellow collector with @Username.'
                  : 'Be the first to say hello and share your latest numismatic acquisitions with your group members.'}
              </p>
            </div>
          ) : (
            messages.map(msg => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                currentUser={currentUser}
                onViewUserProfile={onViewUserCollection}
                onTagUser={username => setPrefilledMention(username)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <ChatInput
          currentUser={currentUser}
          channelName={currentChatName}
          allowPictures={allowPicturesInCurrent}
          onSendMessage={handleSendMessage}
          prefilledMention={prefilledMention || undefined}
          onClearPrefilledMention={() => setPrefilledMention(null)}
        />
      </div>

      {/* MODALS */}
      {showCreateModal && (
        <CreateGroupModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {showJoinModal && (
        <JoinGroupModal
          currentUser={currentUser}
          onClose={() => setShowJoinModal(false)}
          onJoinedOrSelected={(group) => {
            loadUserGroupsAndInvites();
            handleSelectChat(group.id);
            setShowJoinModal(false);
          }}
        />
      )}

      {showInvitesModal && (
        <GroupInvitesModal
          currentUser={currentUser}
          onClose={() => setShowInvitesModal(false)}
          onInviteAccepted={handleInviteAccepted}
        />
      )}

      {showModerationModal && (
        <ChatModerationModal
          currentUser={currentUser}
          onClose={() => setShowModerationModal(false)}
        />
      )}

      {showDetailsModal && activeGroup && (
        <GroupDetailsModal
          groupId={activeGroup.id}
          currentUser={currentUser}
          onClose={() => setShowDetailsModal(false)}
          onGroupUpdated={updated => {
            setActiveGroup(updated);
            loadUserGroupsAndInvites();
          }}
          onLeftOrDeleted={() => {
            setActiveChatId('universal');
            loadUserGroupsAndInvites();
          }}
          onViewUserProfile={onViewUserCollection}
        />
      )}
    </div>
  );
};
