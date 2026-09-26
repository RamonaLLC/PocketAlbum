import {
  User, Denomination, CoinSeries, CoinIssue, CoinVariety,
  CollectionItem, BullionItem, ColonialPatternItem, ChatMessage,
  LeaderboardUser, FriendRequest, LeaderboardResponse,
  ChatGroup, GroupMember, GroupJoinRequest, GroupInvitation, AppNotification,
  MasterMint, MasterCoinError,
  FacebookConnectionInfo, FacebookAutomationConfig, FacebookQueueResponse,
  NewsSource, NewsArticle
} from '../types.ts';

const BASE_URL = '/api';

export async function fetchDenominations(): Promise<Denomination[]> {
  const res = await fetch(`${BASE_URL}/denominations`);
  if (!res.ok) throw new Error('Failed to fetch denominations');
  return res.json();
}

export async function fetchSeriesByDenomination(denominationId: string): Promise<CoinSeries[]> {
  const res = await fetch(`${BASE_URL}/series?denomination_id=${denominationId}`);
  if (!res.ok) throw new Error('Failed to fetch series');
  return res.json();
}

export async function fetchSeriesById(seriesId: string): Promise<CoinSeries> {
  const res = await fetch(`${BASE_URL}/series/${seriesId}`);
  if (!res.ok) throw new Error('Failed to fetch series');
  return res.json();
}

export async function fetchIssuesForSeries(seriesId: string): Promise<CoinIssue[]> {
  const res = await fetch(`${BASE_URL}/issues?series_id=${seriesId}`);
  if (!res.ok) throw new Error('Failed to fetch issues');
  return res.json();
}

export async function searchCoinIssues(query: string = ''): Promise<(CoinIssue & { series_name: string; series_id: string; denomination_id: string; denomination_name: string; icon_label?: string })[]> {
  const res = await fetch(`${BASE_URL}/issues/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search coin issues');
  return res.json();
}

export async function fetchVarietiesForIssue(issueId: string): Promise<CoinVariety[]> {
  const res = await fetch(`${BASE_URL}/varieties?issue_id=${issueId}`);
  if (!res.ok) throw new Error('Failed to fetch varieties');
  return res.json();
}

export async function fetchCollectionForSeries(ownerId: string, seriesId: string): Promise<CollectionItem[]> {
  const res = await fetch(`${BASE_URL}/collection?owner_id=${ownerId}&series_id=${seriesId}`);
  if (!res.ok) throw new Error('Failed to fetch collection');
  return res.json();
}

export async function fetchRecentlyAdded(ownerId: string, limit: number = 30, viewerId?: string): Promise<CollectionItem[]> {
  const viewerParam = viewerId ? `&viewer_id=${encodeURIComponent(viewerId)}` : '';
  const res = await fetch(`${BASE_URL}/collection/recently-added?owner_id=${encodeURIComponent(ownerId)}&limit=${limit}${viewerParam}`);
  if (!res.ok) throw new Error('Failed to fetch recently added coins');
  return res.json();
}

export async function fetchCoinItem(id: string): Promise<CollectionItem> {
  const res = await fetch(`${BASE_URL}/collection/item/${id}`);
  if (!res.ok) throw new Error('Failed to fetch coin item');
  return res.json();
}

export async function addCoinItem(item: Partial<CollectionItem> & { photos?: string[] }): Promise<CollectionItem> {
  const res = await fetch(`${BASE_URL}/collection/item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add coin');
  }
  return res.json();
}

export async function updateCoinItem(id: string, item: Partial<CollectionItem> & { photos?: string[] }): Promise<CollectionItem> {
  const res = await fetch(`${BASE_URL}/collection/item/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update coin');
  }
  return res.json();
}

export async function deleteCoinItem(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/collection/item/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete coin');
}

export async function fetchBullion(ownerId: string, material?: string): Promise<BullionItem[]> {
  let url = `${BASE_URL}/bullion?owner_id=${ownerId}`;
  if (material && material !== 'All') url += `&material=${encodeURIComponent(material)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch bullion');
  return res.json();
}

export async function addBullion(item: Partial<BullionItem>): Promise<BullionItem> {
  const res = await fetch(`${BASE_URL}/bullion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to add bullion');
  return res.json();
}

export async function updateBullion(id: string, item: Partial<BullionItem>): Promise<BullionItem> {
  const res = await fetch(`${BASE_URL}/bullion/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to update bullion');
  return res.json();
}

export async function deleteBullion(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/bullion/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete bullion');
}

export async function fetchColonials(ownerId: string, category?: string, subcategory?: string): Promise<ColonialPatternItem[]> {
  let url = `${BASE_URL}/colonials?owner_id=${ownerId}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  if (subcategory) url += `&subcategory=${encodeURIComponent(subcategory)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch colonials');
  return res.json();
}

export async function addColonial(item: Partial<ColonialPatternItem>): Promise<ColonialPatternItem> {
  const res = await fetch(`${BASE_URL}/colonials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to add colonial item');
  return res.json();
}

export async function updateColonial(id: string, item: Partial<ColonialPatternItem>): Promise<ColonialPatternItem> {
  const res = await fetch(`${BASE_URL}/colonials/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to update colonial item');
  return res.json();
}

export async function deleteColonial(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/colonials/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete colonial item');
}

export async function fetchUsers(search?: string, currentUserId?: string): Promise<User[]> {
  let url = `${BASE_URL}/users`;
  const params: string[] = [];
  if (search) params.push(`q=${encodeURIComponent(search)}`);
  if (currentUserId) params.push(`current_user_id=${encodeURIComponent(currentUserId)}`);
  if (params.length > 0) url += `?${params.join('&')}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function fetchUserProfile(userId: string, currentUserId?: string): Promise<User> {
  let url = `${BASE_URL}/users/${userId}`;
  if (currentUserId) url += `?current_user_id=${encodeURIComponent(currentUserId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

export async function updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update profile');
  }
  return res.json();
}

export async function registerUser(data: { username: string; profile_photo?: string; about_me?: string; account_info?: string }): Promise<User> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to register account');
  }
  return res.json();
}

export async function fetchFriends(userId: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/friends?user_id=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch friends');
  return res.json();
}

export async function fetchFriendRequests(userId: string): Promise<{ received: FriendRequest[]; sent: FriendRequest[] }> {
  const res = await fetch(`${BASE_URL}/friend-requests?user_id=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch friend requests');
  return res.json();
}

export async function sendFriendRequest(senderId: string, receiverId: string): Promise<{ success: boolean; status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/friend-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id: senderId, receiver_id: receiverId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to send friend request');
  }
  return res.json();
}

export async function respondToFriendRequest(requestId: string, userId: string, action: 'accept' | 'deny'): Promise<{ success: boolean; status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/friend-requests/${requestId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, action }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to respond to friend request');
  }
  return res.json();
}

export async function cancelFriendRequest(requestId: string, userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/friend-requests/${requestId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error('Failed to cancel friend request');
}

export async function addFriend(userId: string, friendId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/friends`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, friend_id: friendId }),
  });
  if (!res.ok) throw new Error('Failed to add friend');
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/friends`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, friend_id: friendId }),
  });
  if (!res.ok) throw new Error('Failed to remove friend');
}

export async function toggleVote(voterId: string, targetUserId: string): Promise<{ voted: boolean; total_votes: number; weekly_votes?: number }> {
  const res = await fetch(`${BASE_URL}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voter_id: voterId, target_user_id: targetUserId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to vote');
  }
  return res.json();
}

export async function fetchLeaderboards(sort?: string, currentUserId?: string): Promise<LeaderboardResponse> {
  const params: string[] = [];
  if (sort) params.push(`sort=${sort}`);
  if (currentUserId) params.push(`current_user_id=${encodeURIComponent(currentUserId)}`);
  const url = `${BASE_URL}/leaderboards${params.length > 0 ? `?${params.join('&')}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch leaderboards');
  return res.json();
}

export async function fetchChatMessages(channelId = 'universal', userId?: string): Promise<ChatMessage[]> {
  let url = `${BASE_URL}/chat/messages?channel_id=${encodeURIComponent(channelId)}`;
  if (userId) url += `&user_id=${encodeURIComponent(userId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch chat messages');
  }
  return res.json();
}

export async function sendChatMessage(
  senderId: string,
  channelId: string,
  content: string,
  imageUrl?: string
): Promise<ChatMessage> {
  const res = await fetch(`${BASE_URL}/chat/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender_id: senderId,
      channel_id: channelId,
      content,
      image_url: imageUrl || undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send message');
  }
  return res.json();
}

// Group Chat API
export async function fetchUserGroups(userId: string): Promise<ChatGroup[]> {
  const res = await fetch(`${BASE_URL}/chat/groups?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch groups');
  return res.json();
}

export async function discoverGroups(userId?: string, query?: string): Promise<ChatGroup[]> {
  let url = `${BASE_URL}/chat/groups/discover`;
  const params: string[] = [];
  if (userId) params.push(`user_id=${encodeURIComponent(userId)}`);
  if (query) params.push(`query=${encodeURIComponent(query)}`);
  if (params.length > 0) url += `?${params.join('&')}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to search groups');
  return res.json();
}

export async function fetchGroupDetail(groupId: string, userId?: string): Promise<ChatGroup> {
  let url = `${BASE_URL}/chat/groups/${groupId}`;
  if (userId) url += `?user_id=${encodeURIComponent(userId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch group details');
  return res.json();
}

export async function createGroup(
  arg1: string | {
    name: string;
    description?: string;
    icon_url?: string;
    rules?: string;
    leader_id?: string;
    profanity_filter?: number;
    spam_filter?: number;
    allow_pictures?: number;
    allow_member_invites?: number;
    chat_color?: string;
    is_public?: number;
  },
  arg2?: {
    name?: string;
    description?: string;
    icon_url?: string;
    rules?: string;
    leader_id?: string;
    profanity_filter?: number;
    spam_filter?: number;
    allow_pictures?: number;
    allow_member_invites?: number;
    chat_color?: string;
    is_public?: number;
  }
): Promise<ChatGroup> {
  const payload = typeof arg1 === 'string'
    ? { ...(arg2 || {}), leader_id: arg1 }
    : arg1;

  const res = await fetch(`${BASE_URL}/chat/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create group');
  }
  return res.json();
}

export async function updateGroup(
  groupId: string,
  data: {
    user_id: string;
    name?: string;
    description?: string;
    icon_url?: string;
    rules?: string;
    profanity_filter?: number;
    spam_filter?: number;
    allow_pictures?: number;
    allow_member_invites?: number;
    chat_color?: string;
    is_public?: number;
  }
): Promise<ChatGroup> {
  const res = await fetch(`${BASE_URL}/chat/groups/${groupId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update group');
  }
  return res.json();
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const res = await fetch(`${BASE_URL}/chat/groups/${groupId}/members`);
  if (!res.ok) throw new Error('Failed to fetch group members');
  return res.json();
}

export async function removeGroupMember(groupId: string, memberId: string, userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/groups/${groupId}/members/${memberId}/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to remove member');
  }
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/groups/${groupId}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to leave group');
  }
}

export async function sendGroupJoinRequest(groupId: string, userId: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/chat/groups/${groupId}/join-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send join request');
  }
  return res.json();
}

export async function fetchGroupJoinRequests(groupId: string, userId: string): Promise<GroupJoinRequest[]> {
  const res = await fetch(`${BASE_URL}/chat/groups/${groupId}/requests?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch join requests');
  }
  return res.json();
}

export async function respondToJoinRequest(
  groupId: string,
  requestId: string,
  userId: string,
  action: 'accept' | 'deny'
): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/groups/${groupId}/requests/${requestId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, action }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to respond to join request');
  }
}

export async function fetchGroupInvitations(userId: string): Promise<{ received: GroupInvitation[]; sent: GroupInvitation[] }> {
  const res = await fetch(`${BASE_URL}/chat/invitations?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch invitations');
  return res.json();
}

export async function sendGroupInvite(
  groupId: string,
  inviterId: string,
  targetUsername: string
): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/chat/groups/${groupId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviter_id: inviterId, target_username: targetUsername }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send invitation');
  }
  return res.json();
}

export async function respondToInvitation(
  inviteId: string,
  userId: string,
  action: 'accept' | 'deny'
): Promise<{ group_id?: string }> {
  const res = await fetch(`${BASE_URL}/chat/invitations/${inviteId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, action }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to respond to invitation');
  }
  return res.json();
}

export async function fetchNotifications(userId: string): Promise<{ notifications: AppNotification[]; unread_count: number }> {
  const res = await fetch(`${BASE_URL}/notifications?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationsRead(userId: string, notificationId?: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notifications/mark-read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, notification_id: notificationId }),
  });
  if (!res.ok) throw new Error('Failed to mark notifications read');
}

export async function joinGroupDirect(groupId: string, userId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/chat/groups/${groupId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to join group');
  }
  return res.json();
}

export async function reportChatUser(data: {
  reporter_id: string;
  reported_id: string;
  message_id?: string;
  reason?: string;
  channel?: string;
}): Promise<{ success: boolean; distinct_reports: number; auto_banned: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/chat/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit report');
  }
  return res.json();
}

export async function fetchAdminChatReports(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/admin/chat-reports`);
  if (!res.ok) throw new Error('Failed to fetch admin chat reports');
  return res.json();
}

export async function removeChatBan(targetUserId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/admin/chat-ban/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_user_id: targetUserId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to remove chat ban');
  }
  return res.json();
}

export async function extendChatBan(
  targetUserId: string,
  expiresAt: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/admin/chat-ban/extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_user_id: targetUserId, expires_at: expiresAt, reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to extend chat ban');
  }
  return res.json();
}

export async function submitAppSuggestion(
  arg1: { user_id: string; username: string; suggestion: string } | string,
  arg2?: string,
  arg3?: string
): Promise<{ success: boolean; message: string; target_email?: string; mailto_url?: string; mailto_link?: string }> {
  let payload: { user_id: string; username: string; suggestion: string };
  if (typeof arg1 === 'object') {
    payload = arg1;
  } else {
    payload = {
      user_id: arg1,
      username: arg3 !== undefined ? (arg2 || 'Collector') : 'Collector',
      suggestion: arg3 !== undefined ? arg3 : (arg2 || ''),
    };
  }

  const res = await fetch(`${BASE_URL}/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit suggestion');
  }
  const data = await res.json();
  return {
    ...data,
    mailto_link: data.mailto_url || data.mailto_link,
  };
}

export async function fetchMints(): Promise<MasterMint[]> {
  const res = await fetch(`${BASE_URL}/mints`);
  if (!res.ok) throw new Error('Failed to fetch historical U.S. mints');
  return res.json();
}

export async function fetchErrors(): Promise<MasterCoinError[]> {
  const res = await fetch(`${BASE_URL}/errors`);
  if (!res.ok) throw new Error('Failed to fetch master coin errors and varieties');
  return res.json();
}

export async function fetchIssueDetail(issueId: string): Promise<CoinIssue & { series_name?: string; denomination_name?: string; mint_name?: string; mint_location?: string; mint_periods?: string }> {
  const res = await fetch(`${BASE_URL}/issues/${encodeURIComponent(issueId)}`);
  if (!res.ok) throw new Error('Failed to fetch issue details');
  return res.json();
}

// ================= FACEBOOK AUTOMATION API ================= //

export async function fetchFacebookConnection(): Promise<FacebookConnectionInfo> {
  const res = await fetch(`${BASE_URL}/facebook/connection`);
  if (!res.ok) throw new Error('Failed to fetch Facebook connection status');
  return res.json();
}

export async function connectFacebookPage(data?: { page_id?: string; page_name?: string; access_token?: string }): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/facebook/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to connect Facebook Page');
  return json;
}

export async function disconnectFacebookPage(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/facebook/disconnect`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to disconnect Facebook Page');
  return res.json();
}

export async function testFacebookConnection(): Promise<{ connected: boolean; message: string; page_name?: string; page_id?: string }> {
  const res = await fetch(`${BASE_URL}/facebook/test-connection`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to test Facebook connection');
  return res.json();
}

export async function fetchFacebookSettings(): Promise<FacebookAutomationConfig> {
  const res = await fetch(`${BASE_URL}/facebook/settings`);
  if (!res.ok) throw new Error('Failed to fetch Facebook automation settings');
  return res.json();
}

export async function saveFacebookSettings(settings: Partial<FacebookAutomationConfig>): Promise<FacebookAutomationConfig> {
  const res = await fetch(`${BASE_URL}/facebook/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save Facebook automation settings');
  return res.json();
}

export async function fetchFacebookQueue(params?: { status?: string; type?: string; limit?: number }): Promise<FacebookQueueResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.type) query.append('type', params.type);
  if (params?.limit) query.append('limit', String(params.limit));

  const res = await fetch(`${BASE_URL}/facebook/queue?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch Facebook publishing queue');
  return res.json();
}

export async function retryFacebookPost(queueId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/facebook/queue/retry/${encodeURIComponent(queueId)}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to retry post');
  return res.json();
}

export async function cancelFacebookPost(queueId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/facebook/queue/cancel/${encodeURIComponent(queueId)}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to cancel post');
  return res.json();
}

export async function deleteFacebookPost(queueId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/facebook/queue/${encodeURIComponent(queueId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete post');
  return res.json();
}

export async function processFacebookQueueNow(): Promise<{ processed: number; published: number; failed: number }> {
  const res = await fetch(`${BASE_URL}/facebook/queue/process`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger queue processing');
  return res.json();
}

export async function triggerDailyDigestNow(): Promise<{ queued: boolean; message: string; content?: string }> {
  const res = await fetch(`${BASE_URL}/facebook/trigger/digest`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger daily digest');
  return res.json();
}

export async function triggerWeeklyShowcaseNow(): Promise<{ queued: boolean; message: string; content?: string }> {
  const res = await fetch(`${BASE_URL}/facebook/trigger/showcase`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger weekly showcase');
  return res.json();
}

export async function triggerLeaderboardPostNow(type: 'weekly' | 'monthly' | 'overall'): Promise<{ queued: boolean; message: string; content?: string }> {
  const res = await fetch(`${BASE_URL}/facebook/trigger/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  if (!res.ok) throw new Error('Failed to trigger leaderboard post');
  return res.json();
}

export async function triggerTestPostNow(): Promise<{ success: boolean; message: string; post_id?: string }> {
  const res = await fetch(`${BASE_URL}/facebook/trigger/test-post`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger test post');
  return res.json();
}

export async function confirmFacebookCoinPost(coinId: string, ownerId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/facebook/confirm-coin-post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coin_id: coinId, owner_id: ownerId }),
  });
  if (!res.ok) throw new Error('Failed to confirm Facebook coin post');
  return res.json();
}

export async function updateUserFacebookPref(userId: string, pref: 'auto' | 'ask' | 'never'): Promise<{ success: boolean; facebook_sharing_pref: string }> {
  const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(userId)}/facebook-pref`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pref }),
  });
  if (!res.ok) throw new Error('Failed to update Facebook sharing preference');
  return res.json();
}

// ================= NUMISMATIC NEWS SYSTEM API ================= //

export async function fetchNewsArticles(params?: {
  category?: string;
  q?: string;
  sort?: string;
  current_user_id?: string;
  limit?: number;
  offset?: number;
}): Promise<NewsArticle[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.q) query.append('q', params.q);
  if (params?.sort) query.append('sort', params.sort);
  if (params?.current_user_id) query.append('current_user_id', params.current_user_id);
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));

  const res = await fetch(`${BASE_URL}/news/articles?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch news articles');
  return res.json();
}

export async function fetchNewsArticle(id: string, currentUserId?: string): Promise<NewsArticle> {
  const query = currentUserId ? `?current_user_id=${encodeURIComponent(currentUserId)}` : '';
  const res = await fetch(`${BASE_URL}/news/articles/${encodeURIComponent(id)}${query}`);
  if (!res.ok) throw new Error('Failed to fetch article details');
  return res.json();
}

export async function reactToNewsArticle(
  articleId: string,
  userId: string,
  reaction: 'like' | 'dislike' | 'none'
): Promise<{ likes_count: number; dislikes_count: number; user_reaction: 'like' | 'dislike' | null }> {
  const res = await fetch(`${BASE_URL}/news/articles/${encodeURIComponent(articleId)}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, reaction }),
  });
  if (!res.ok) throw new Error('Failed to record reaction');
  return res.json();
}

export async function fetchNewsSources(): Promise<NewsSource[]> {
  const res = await fetch(`${BASE_URL}/news/sources`);
  if (!res.ok) throw new Error('Failed to fetch news sources');
  return res.json();
}

export async function verifyNewsSource(
  sourceId: string,
  endpoint?: string,
  connection_type?: string
): Promise<{ verification: { success: boolean; status: string; message: string; sampleTitle?: string; itemCount?: number }; source: NewsSource }> {
  const res = await fetch(`${BASE_URL}/news/sources/${encodeURIComponent(sourceId)}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, connection_type }),
  });
  if (!res.ok) throw new Error('Failed to verify news source connection');
  return res.json();
}

export async function fetchArticlesFromSource(sourceId: string): Promise<{ success: boolean; addedCount: number; source: NewsSource; error?: string }> {
  const res = await fetch(`${BASE_URL}/news/sources/${encodeURIComponent(sourceId)}/fetch`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to ingest from source');
  return res.json();
}

export async function updateNewsSource(sourceId: string, data: Partial<NewsSource>): Promise<NewsSource> {
  const res = await fetch(`${BASE_URL}/news/sources/${encodeURIComponent(sourceId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update news source');
  return res.json();
}

export async function createNewsSource(data: Partial<NewsSource>): Promise<NewsSource> {
  const res = await fetch(`${BASE_URL}/news/sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create news source');
  return res.json();
}

export async function updateNewsArticle(articleId: string, data: Partial<NewsArticle>): Promise<NewsArticle> {
  const res = await fetch(`${BASE_URL}/news/articles/${encodeURIComponent(articleId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update news article');
  return res.json();
}

export async function createManualNewsArticle(data: any): Promise<NewsArticle> {
  const res = await fetch(`${BASE_URL}/news/articles/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to import article');
  return res.json();
}


