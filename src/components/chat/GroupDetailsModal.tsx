import React, { useState, useEffect, useRef } from 'react';
import {
  X, Users, Settings, UserMinus, UserPlus, Check, Ban,
  Loader2, AlertTriangle, LogOut, BookOpen, Save,
  Globe, Lock, Camera
} from 'lucide-react';
import {
  fetchGroupDetail, fetchGroupMembers, removeGroupMember,
  leaveGroup, fetchGroupJoinRequests, respondToJoinRequest,
  updateGroup, sendGroupInvite
} from '../../utils/api.ts';
import { ChatGroup, GroupMember, GroupJoinRequest, User } from '../../types.ts';

interface GroupDetailsModalProps {
  groupId: string;
  currentUser: User;
  onClose: () => void;
  onGroupUpdated: (group: ChatGroup) => void;
  onLeftOrDeleted: () => void;
  onViewUserProfile?: (userId: string) => void;
}

const PHOTO_EMOJI_PRESETS = ['🪙', '💰', '📸', '🦅', '💎', '👑', '⭐', '🔥', '🏆', '🔍', '🏛️', '🇺🇸'];

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  groupId,
  currentUser,
  onClose,
  onGroupUpdated,
  onLeftOrDeleted,
  onViewUserProfile,
}) => {
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [requests, setRequests] = useState<GroupJoinRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'requests' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);

  // Invite member form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // Member removal confirmation state
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<GroupMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Leave group confirmation state
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Settings form state (for Leader)
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIcon, setEditIcon] = useState('🪙');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editRules, setEditRules] = useState('');
  const [editProfanity, setEditProfanity] = useState(true);
  const [editSpam, setEditSpam] = useState(true);
  const [editPictures, setEditPictures] = useState(true);
  const [editMemberInvites, setEditMemberInvites] = useState(true);
  const [editColor, setEditColor] = useState('amber');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Join request action state
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const g = await fetchGroupDetail(groupId, currentUser.id);
      setGroup(g);
      setEditName(g.name);
      setEditDesc(g.description || '');
      setEditIcon(g.icon_url || '🪙');
      setEditIsPublic(g.is_public !== 0);
      setEditRules(g.rules || '');
      setEditProfanity(g.profanity_filter === 1);
      setEditSpam(g.spam_filter === 1);
      setEditPictures(g.allow_pictures === 1);
      setEditMemberInvites(g.allow_member_invites === 1);
      setEditColor(g.chat_color || 'amber');

      const m = await fetchGroupMembers(groupId);
      setMembers(m);

      if (g.is_leader) {
        const r = await fetchGroupJoinRequests(groupId, currentUser.id);
        setRequests(r);
      }
    } catch (err) {
      console.error('Failed to load group details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [groupId]);

  const isLeader = group?.is_leader;
  const canInvite = isLeader || (group?.allow_member_invites === 1);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim() || isSendingInvite) return;

    setIsSendingInvite(true);
    setInviteFeedback(null);

    try {
      const res = await sendGroupInvite(groupId, currentUser.id, inviteUsername.trim());
      setInviteFeedback(res.message || 'Invitation sent successfully!');
      setInviteUsername('');
    } catch (err: any) {
      setInviteFeedback(err.message || 'Failed to send invitation.');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmRemoveMember || isRemoving) return;
    setIsRemoving(true);

    try {
      await removeGroupMember(groupId, confirmRemoveMember.user_id, currentUser.id);
      setMembers(prev => prev.filter(m => m.user_id !== confirmRemoveMember.user_id));
      setConfirmRemoveMember(null);
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    try {
      await leaveGroup(groupId, currentUser.id);
      onLeftOrDeleted();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to leave group');
      setIsLeaving(false);
    }
  };

  const handleRespondRequest = async (requestId: string, action: 'accept' | 'deny') => {
    if (respondingRequestId) return;
    setRespondingRequestId(requestId);

    try {
      await respondToJoinRequest(groupId, requestId, currentUser.id, action);
      setRequests(prev => prev.filter(r => r.request_id !== requestId));
      if (action === 'accept') {
        const updatedMembers = await fetchGroupMembers(groupId);
        setMembers(updatedMembers);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to respond to request');
    } finally {
      setRespondingRequestId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingSettings) return;

    setIsSavingSettings(true);
    setSettingsFeedback(null);

    try {
      const updated = await updateGroup(groupId, {
        user_id: currentUser.id,
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        icon_url: editIcon,
        rules: editRules.trim() || undefined,
        profanity_filter: editProfanity ? 1 : 0,
        spam_filter: editSpam ? 1 : 0,
        allow_pictures: editPictures ? 1 : 0,
        allow_member_invites: editMemberInvites ? 1 : 0,
        chat_color: editColor,
        is_public: editIsPublic ? 1 : 0,
      });

      setGroup(updated);
      onGroupUpdated(updated);
      setSettingsFeedback('Guild settings updated successfully!');
    } catch (err: any) {
      setSettingsFeedback(err.message || 'Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Photo is too large. Please select an image under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setEditIcon(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading || !group) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
        <div className="p-8 bg-[#241a13] border border-[#7a5c28]/60 rounded-3xl flex items-center gap-3 text-[#dfd4bf]">
          <Loader2 className="w-6 h-6 animate-spin text-[#dfb86c]" />
          Loading guild details...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header with Group Info Banner */}
        <div className="p-6 border-b border-[#7a5c28]/40 bg-[#19110b] flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-[#241a13] border border-[#7a5c28]/60 flex items-center justify-center text-3xl shrink-0 shadow-inner overflow-hidden">
              {group.icon_url && (group.icon_url.startsWith('http') || group.icon_url.startsWith('data:')) ? (
                <img src={group.icon_url} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <span>{group.icon_url || '🪙'}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-serif font-bold text-[#f7eedd] truncate">{group.name}</h3>
                {isLeader && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-serif font-bold bg-[#dfb86c]/20 text-[#fae19c] border border-[#dfb86c]/40">
                    Host / Leader
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a89c8d] mt-1 flex items-center gap-2">
                <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                <span>&bull;</span>
                <span>Host: @{group.leader_username}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#251a13] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#5a4420]/30 bg-[#120d09] p-1.5 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-sm border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            Overview & Rules
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'members'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-sm border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            Members ({members.length})
          </button>

          {isLeader && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-sm border border-[#fae19c]/70'
                  : 'text-[#a89c8d] hover:text-[#f7eedd]'
              }`}
            >
              Join Requests
              {requests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#140e08] text-[#fae19c] text-[10px] font-black flex items-center justify-center">
                  {requests.length}
                </span>
              )}
            </button>
          )}

          {isLeader && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-sm border border-[#fae19c]/70'
                  : 'text-[#a89c8d] hover:text-[#f7eedd]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {group.description && (
                <div>
                  <h4 className="text-xs font-serif font-bold text-[#a89c8d] uppercase tracking-wider mb-1.5">
                    About this Guild
                  </h4>
                  <p className="text-sm text-[#f7eedd] leading-relaxed bg-[#140e0a] border border-[#5a4420]/40 rounded-2xl p-4">
                    {group.description}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-serif font-bold text-[#a89c8d] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#dfb86c]" />
                  Guild Rules & Code of Conduct
                </h4>
                <div className="text-sm text-[#dfd4bf] leading-relaxed bg-[#140e0a] border border-[#5a4420]/40 rounded-2xl p-4 whitespace-pre-line">
                  {group.rules || 'No custom rules provided. Standard numismatic courtesy applies.'}
                </div>
              </div>

              {/* Group Settings Summary */}
              <div>
                <h4 className="text-xs font-serif font-bold text-[#a89c8d] uppercase tracking-wider mb-2">
                  Active Community Policies
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 flex items-center justify-between">
                    <span className="text-[#a89c8d]">Profanity Filter:</span>
                    <span className={`font-serif font-bold ${group.profanity_filter ? 'text-emerald-400' : 'text-[#a89c8d]'}`}>
                      {group.profanity_filter ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 flex items-center justify-between">
                    <span className="text-[#a89c8d]">Spam Filter:</span>
                    <span className={`font-serif font-bold ${group.spam_filter ? 'text-emerald-400' : 'text-[#a89c8d]'}`}>
                      {group.spam_filter ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 flex items-center justify-between">
                    <span className="text-[#a89c8d]">Picture Sharing:</span>
                    <span className={`font-serif font-bold ${group.allow_pictures ? 'text-emerald-400' : 'text-[#a89c8d]'}`}>
                      {group.allow_pictures ? 'Allowed' : 'Disabled'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 flex items-center justify-between">
                    <span className="text-[#a89c8d]">Member Invites:</span>
                    <span className={`font-serif font-bold ${group.allow_member_invites ? 'text-emerald-400' : 'text-[#dfb86c]'}`}>
                      {group.allow_member_invites ? 'Members Allowed' : 'Host Only'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Leave Group Action (for non-leader members) */}
              {!isLeader && (
                <div className="pt-4 border-t border-[#5a4420]/30">
                  <button
                    onClick={() => setConfirmLeave(true)}
                    className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-serif font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Guild
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Invite Collector Button / Bar */}
              {canInvite && (
                <div className="bg-[#140e0a] border border-[#5a4420]/40 rounded-2xl p-3.5">
                  {!showInviteForm ? (
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="w-full py-2 px-3 bg-[#dfb86c]/15 hover:bg-[#dfb86c]/25 text-[#fae19c] border border-[#dfb86c]/40 rounded-xl text-xs font-serif font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite a Collector to this Guild
                    </button>
                  ) : (
                    <form onSubmit={handleSendInvite} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-bold text-[#dfd4bf]">Invite Collector</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInviteForm(false);
                            setInviteFeedback(null);
                          }}
                          className="text-[#a89c8d] hover:text-[#f7eedd] text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={inviteUsername}
                          onChange={e => setInviteUsername(e.target.value)}
                          placeholder="Enter account username (e.g. MorganMaster)..."
                          className="flex-1 px-3 py-1.5 bg-[#120d09] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c]"
                        />
                        <button
                          type="submit"
                          disabled={isSendingInvite || !inviteUsername.trim()}
                          className="px-4 py-1.5 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] font-serif font-bold text-xs rounded-xl border border-[#fae19c]/70 disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {isSendingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Invite'}
                        </button>
                      </div>
                      {inviteFeedback && (
                        <p className="text-[11px] text-[#dfb86c] font-medium">{inviteFeedback}</p>
                      )}
                    </form>
                  )}
                </div>
              )}

              {/* Members List */}
              <div className="space-y-2">
                {members.map(member => {
                  const isThisLeader = member.role === 'leader' || member.user_id === group.leader_id;
                  const isMe = member.user_id === currentUser.id;

                  return (
                    <div
                      key={member.user_id}
                      className="p-3 rounded-2xl bg-[#140e0a] border border-[#5a4420]/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={member.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={member.username}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-[#7a5c28]/60"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-serif font-bold text-[#f7eedd] truncate">
                              @{member.username}
                            </span>
                            {isThisLeader && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-serif font-extrabold bg-[#dfb86c]/20 text-[#fae19c] border border-[#dfb86c]/40">
                                Host
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[10px] text-[#a89c8d] font-medium">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#a89c8d]">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Leader remove button */}
                      {isLeader && !isThisLeader && (
                        <button
                          onClick={() => setConfirmRemoveMember(member)}
                          className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Remove member from group"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: JOIN REQUESTS (Leader only) */}
          {activeTab === 'requests' && isLeader && (
            <div className="space-y-3">
              {requests.length === 0 ? (
                <div className="py-14 text-center text-xs text-[#a89c8d]">
                  <Check className="w-8 h-8 mx-auto text-emerald-400/70 mb-2" />
                  All caught up! No pending join requests for this group.
                </div>
              ) : (
                requests.map(req => {
                  const isThisResponding = respondingRequestId === req.request_id;

                  return (
                    <div
                      key={req.request_id}
                      className="p-4 rounded-2xl bg-[#140e0a] border border-[#5a4420]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={req.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={req.username}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-[#7a5c28]/60"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-serif font-bold text-[#f7eedd]">
                            @{req.username}
                          </div>
                          {req.about_me && (
                            <p className="text-xs text-[#a89c8d] mt-0.5 line-clamp-1">
                              {req.about_me}
                            </p>
                          )}
                          <div className="text-[10px] text-[#a89c8d] mt-1">
                            Requested on {new Date(req.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleRespondRequest(req.request_id, 'deny')}
                          disabled={isThisResponding}
                          className="px-3 py-1.5 bg-[#241a13] hover:bg-[#322319] text-[#dfd4bf] rounded-xl text-xs font-semibold border border-[#5a4420]/50 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Decline
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req.request_id, 'accept')}
                          disabled={isThisResponding}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] font-serif font-bold rounded-xl text-xs border border-[#fae19c]/70 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          {isThisResponding ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Accept
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS (Leader only) */}
          {activeTab === 'settings' && isLeader && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              {settingsFeedback && (
                <div className="p-3 bg-[#dfb86c]/10 border border-[#dfb86c]/30 rounded-xl text-xs text-[#dfb86c] font-medium">
                  {settingsFeedback}
                </div>
              )}

              <div>
                <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                  Guild Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  maxLength={50}
                  className="w-full px-3.5 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c]"
                />
              </div>

              {/* Group Photo & Icon Settings */}
              <div className="p-3 bg-[#140e0a] border border-[#5a4420]/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-serif font-bold text-[#dfd4bf]">
                      Guild Photo / Icon
                    </label>
                    <p className="text-[11px] text-[#a89c8d]">
                      Choose an icon or upload a custom guild image
                    </p>
                  </div>
                  {/* Photo Preview */}
                  <div className="w-12 h-12 rounded-2xl bg-[#241a13] border border-[#7a5c28]/60 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    {editIcon.startsWith('http') || editIcon.startsWith('data:') ? (
                      <img
                        src={editIcon}
                        alt="Group Photo Preview"
                        className="w-full h-full object-cover"
                        onError={() => setEditIcon('🪙')}
                      />
                    ) : (
                      <span className="text-2xl">{editIcon || '🪙'}</span>
                    )}
                  </div>
                </div>

                {/* Upload or Image URL controls */}
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
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={editIcon.startsWith('data:') ? '' : editIcon}
                      onChange={e => setEditIcon(e.target.value)}
                      placeholder="Or paste image URL / emoji..."
                      className="w-full px-3 py-1.5 bg-[#120d09] border border-[#5a4420]/50 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c]"
                    />
                  </div>
                </div>

                {/* Quick Emoji Presets */}
                <div>
                  <div className="text-[10px] font-serif font-bold text-[#a89c8d] uppercase tracking-wider mb-1.5">
                    Quick Preset Badges
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PHOTO_EMOJI_PRESETS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setEditIcon(emoji)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-base border transition-all cursor-pointer ${
                          editIcon === emoji
                            ? 'bg-[#dfb86c]/30 border-[#dfb86c] text-[#fae19c] scale-105'
                            : 'bg-[#1c130d] border-[#5a4420]/40 hover:border-[#7a5c28] text-[#dfd4bf]'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Group Privacy (Public vs Private) */}
              <div className="p-3 bg-[#140e0a] border border-[#5a4420]/40 rounded-2xl space-y-2">
                <div>
                  <label className="block text-xs font-serif font-bold text-[#dfd4bf]">
                    Guild Privacy
                  </label>
                  <p className="text-[11px] text-[#a89c8d]">
                    Control who can discover and join your guild
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* Public Option */}
                  <div
                    onClick={() => setEditIsPublic(true)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      editIsPublic
                        ? 'bg-[#281c14] border-[#dfb86c] text-[#fae19c] shadow-sm ring-1 ring-[#dfb86c]/30'
                        : 'bg-[#120d09] border-[#5a4420]/40 text-[#a89c8d] hover:border-[#7a5c28]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-serif font-bold text-xs text-[#dfd4bf]">
                      <Globe className={`w-3.5 h-3.5 ${editIsPublic ? 'text-[#dfb86c]' : 'text-[#a89c8d]'}`} />
                      <span>Public Guild</span>
                      {editIsPublic && <span className="ml-auto text-[10px] text-[#dfb86c] font-bold">Active</span>}
                    </div>
                    <p className="text-[11px] text-[#a89c8d] mt-1 leading-relaxed">
                      Shows on the list of available groups when members click Join Group. Anyone can join directly.
                    </p>
                  </div>

                  {/* Private Option */}
                  <div
                    onClick={() => setEditIsPublic(false)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      !editIsPublic
                        ? 'bg-[#281c14] border-[#dfb86c] text-[#fae19c] shadow-sm ring-1 ring-[#dfb86c]/30'
                        : 'bg-[#120d09] border-[#5a4420]/40 text-[#a89c8d] hover:border-[#7a5c28]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-serif font-bold text-xs text-[#dfd4bf]">
                      <Lock className={`w-3.5 h-3.5 ${!editIsPublic ? 'text-[#dfb86c]' : 'text-[#a89c8d]'}`} />
                      <span>Private Guild</span>
                      {!editIsPublic && <span className="ml-auto text-[10px] text-[#dfb86c] font-bold">Active</span>}
                    </div>
                    <p className="text-[11px] text-[#a89c8d] mt-1 leading-relaxed">
                      Hidden from public list. Requires an invite from a member or a join request the leader must accept.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  maxLength={200}
                  className="w-full px-3.5 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-semibold text-[#dfd4bf] mb-1">
                  Guild Rules
                </label>
                <textarea
                  rows={3}
                  value={editRules}
                  onChange={e => setEditRules(e.target.value)}
                  maxLength={500}
                  className="w-full px-3.5 py-2 bg-[#140e0a] border border-[#7a5c28]/50 rounded-xl text-xs text-[#f7eedd] placeholder-[#a89c8d]/50 focus:outline-none focus:border-[#dfb86c] resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-[#5a4420]/30 space-y-2">
                <label className="flex items-center justify-between p-2 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 cursor-pointer">
                  <span className="text-xs font-serif text-[#f7eedd]">Profanity Filter</span>
                  <input
                    type="checkbox"
                    checked={editProfanity}
                    onChange={e => setEditProfanity(e.target.checked)}
                    className="w-4 h-4 text-[#dfb86c] focus:ring-[#dfb86c] bg-[#241a13] border-[#7a5c28]"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 cursor-pointer">
                  <span className="text-xs font-serif text-[#f7eedd]">Spam Filter</span>
                  <input
                    type="checkbox"
                    checked={editSpam}
                    onChange={e => setEditSpam(e.target.checked)}
                    className="w-4 h-4 text-[#dfb86c] focus:ring-[#dfb86c] bg-[#241a13] border-[#7a5c28]"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 cursor-pointer">
                  <span className="text-xs font-serif text-[#f7eedd]">Allow Pictures / Photos</span>
                  <input
                    type="checkbox"
                    checked={editPictures}
                    onChange={e => setEditPictures(e.target.checked)}
                    className="w-4 h-4 text-[#dfb86c] focus:ring-[#dfb86c] bg-[#241a13] border-[#7a5c28]"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-xl bg-[#140e0a] border border-[#5a4420]/40 cursor-pointer">
                  <span className="text-xs font-serif text-[#f7eedd]">Allow Member Invites</span>
                  <input
                    type="checkbox"
                    checked={editMemberInvites}
                    onChange={e => setEditMemberInvites(e.target.checked)}
                    className="w-4 h-4 text-[#dfb86c] focus:ring-[#dfb86c] bg-[#241a13] border-[#7a5c28]"
                  />
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-4 py-2 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] font-serif font-bold text-xs rounded-xl shadow-md border border-[#fae19c]/70 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isSavingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Settings
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#5a4420]/30 bg-[#120d09] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#241a13] hover:bg-[#322319] text-[#dfd4bf] text-xs font-serif font-bold rounded-xl border border-[#7a5c28]/50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Remove Member */}
      {confirmRemoveMember && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#241a13] border border-rose-900/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-base font-serif font-bold text-[#f7eedd]">Remove Member?</h4>
              <p className="text-xs text-[#a89c8d] mt-1">
                Are you sure you want to remove <span className="font-semibold text-[#f7eedd]">@{confirmRemoveMember.username}</span> from <span className="font-semibold text-[#dfb86c]">{group.name}</span>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRemoveMember(null)}
                disabled={isRemoving}
                className="flex-1 py-2.5 bg-[#1c130d] hover:bg-[#281c14] text-[#dfd4bf] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveMember}
                disabled={isRemoving}
                className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-serif font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Leave Group */}
      {confirmLeave && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#241a13] border border-rose-900/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-base font-serif font-bold text-[#f7eedd]">Leave Guild?</h4>
              <p className="text-xs text-[#a89c8d] mt-1">
                Are you sure you want to leave <span className="font-semibold text-[#dfb86c]">{group.name}</span>? You will need to request to join again.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                disabled={isLeaving}
                className="flex-1 py-2.5 bg-[#1c130d] hover:bg-[#281c14] text-[#dfd4bf] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLeaveGroup}
                disabled={isLeaving}
                className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-serif font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLeaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Leave Guild'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
