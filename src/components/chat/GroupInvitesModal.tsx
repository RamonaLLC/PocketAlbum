import React, { useState, useEffect } from 'react';
import { X, Mail, Check, Ban, Clock, Loader2 } from 'lucide-react';
import { fetchGroupInvitations, respondToInvitation } from '../../utils/api.ts';
import { GroupInvitation, User } from '../../types.ts';

interface GroupInvitesModalProps {
  currentUser: User;
  onClose: () => void;
  onInviteAccepted: (groupId: string) => void;
}

export const GroupInvitesModal: React.FC<GroupInvitesModalProps> = ({
  currentUser,
  onClose,
  onInviteAccepted,
}) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedInvites, setReceivedInvites] = useState<GroupInvitation[]>([]);
  const [sentInvites, setSentInvites] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchGroupInvitations(currentUser.id);
      setReceivedInvites(data.received || []);
      setSentInvites(data.sent || []);
    } catch (err) {
      console.error('Failed to load group invites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRespond = async (inviteId: string, action: 'accept' | 'deny', groupId: string) => {
    if (respondingId) return;
    setRespondingId(inviteId);
    setFeedback(null);

    try {
      await respondToInvitation(inviteId, currentUser.id, action);
      setReceivedInvites(prev => prev.filter(inv => inv.invitation_id !== inviteId));

      if (action === 'accept') {
        onInviteAccepted(groupId);
        onClose();
      } else {
        setFeedback('Invitation declined.');
      }
    } catch (err: any) {
      setFeedback(err.message || 'Failed to update invitation.');
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#241a13] to-[#140e0a] border border-[#7a5c28]/70 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#7a5c28]/40 bg-[#19110b]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#dfb86c]/20 text-[#dfb86c] flex items-center justify-center border border-[#dfb86c]/40">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#f7eedd]">Guild Invitations</h3>
              <p className="text-xs text-[#a89c8d]">Review invitations received and sent to collectors</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#251a13] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#5a4420]/30 bg-[#120d09] p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-serif font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'received'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-sm border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            Received Invitations
            {receivedInvites.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#140e08] text-[#fae19c] text-[10px] font-extrabold flex items-center justify-center">
                {receivedInvites.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-serif font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow-sm border border-[#fae19c]/70'
                : 'text-[#a89c8d] hover:text-[#f7eedd]'
            }`}
          >
            Sent Invitations
            {sentInvites.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#241a13] text-[#dfd4bf] text-[10px] font-semibold border border-[#7a5c28]/40">
                {sentInvites.length}
              </span>
            )}
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="p-3 mx-4 mt-3 bg-[#dfb86c]/10 border border-[#dfb86c]/30 rounded-xl text-xs text-[#dfb86c] font-medium">
            {feedback}
          </div>
        )}

        {/* Content Feed */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#a89c8d] flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#dfb86c]" />
              Loading invitations...
            </div>
          ) : activeTab === 'received' ? (
            receivedInvites.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#a89c8d]">
                <Mail className="w-8 h-8 mx-auto text-[#7a5c28] mb-2 opacity-50" />
                No pending group invitations.
              </div>
            ) : (
              receivedInvites.map(inv => {
                const isThisResponding = respondingId === inv.invitation_id;

                return (
                  <div
                    key={inv.invitation_id}
                    className="p-4 rounded-2xl bg-[#140e0a] border border-[#5a4420]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-[#241a13] flex items-center justify-center text-2xl shrink-0 border border-[#7a5c28]/60">
                        {inv.group_icon || '🪙'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-serif font-bold text-[#f7eedd] truncate">
                          {inv.group_name}
                        </div>
                        <div className="text-xs text-[#a89c8d] mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>Invited by</span>
                          <span className="font-semibold text-[#dfd4bf]">@{inv.inviter_username}</span>
                          <span className="text-[#5a4420]">&bull;</span>
                          <span className="text-[11px] text-[#a89c8d]">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {inv.group_description && (
                          <div className="text-[11px] text-[#a89c8d] mt-1 line-clamp-1">
                            {inv.group_description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleRespond(inv.invitation_id, 'deny', inv.group_id)}
                        disabled={isThisResponding}
                        className="px-3 py-1.5 bg-[#241a13] hover:bg-[#322319] text-[#dfd4bf] border border-[#5a4420]/50 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespond(inv.invitation_id, 'accept', inv.group_id)}
                        disabled={isThisResponding}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] rounded-xl text-xs font-serif font-bold shadow-md border border-[#fae19c]/70 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isThisResponding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Accept & Join
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : sentInvites.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#a89c8d]">
              <Mail className="w-8 h-8 mx-auto text-[#7a5c28] mb-2 opacity-50" />
              You haven't sent any group invitations yet.
            </div>
          ) : (
            sentInvites.map(inv => (
              <div
                key={inv.invitation_id}
                className="p-3.5 rounded-2xl bg-[#140e0a] border border-[#5a4420]/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#241a13] flex items-center justify-center text-xl shrink-0 border border-[#7a5c28]/60">
                    {inv.group_icon || '🪙'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-serif font-bold text-[#f7eedd] truncate">
                      To @{inv.invited_username} &bull; {inv.group_name}
                    </div>
                    <div className="text-[11px] text-[#a89c8d]">
                      Sent {new Date(inv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize flex items-center gap-1 shrink-0 ${
                    inv.status === 'accepted'
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                      : inv.status === 'denied'
                      ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                      : 'bg-[#241a13] text-[#dfb86c] border border-[#7a5c28]/40'
                  }`}
                >
                  {inv.status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                  {inv.status}
                </span>
              </div>
            ))
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
    </div>
  );
};
