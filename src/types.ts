export interface User {
  id: string;
  username: string;
  profile_photo: string;
  about_me: string;
  account_info?: string;
  created_at: string;
  total_votes?: number;
  weekly_votes?: number;
  is_friend?: boolean;
  has_voted?: boolean;
  friend_status?: 'friends' | 'request_sent' | 'request_received' | 'none';
  friend_request_id?: string;
  is_admin?: number;
  is_mod?: number;
  chat_banned?: number;
  chat_ban_reason?: string | null;
  chat_ban_expires_at?: string | null;
  is_collection_private?: number;
  facebook_sharing_pref?: 'auto' | 'ask' | 'never';
}

export interface Denomination {
  id: string;
  name: string;
  category: string;
  display_order: number;
  active: number;
  diameter_mm?: string;
  icon_label?: string;
}

export interface CoinSeries {
  id: string;
  denomination_id: string;
  name: string;
  pcgs_reference_name: string;
  start_year: number;
  end_year: number;
  display_order: number;
  active: number;
  category?: string;
  composition?: string;
  designer?: string;
}

export interface CoinIssue {
  id: string;
  catalog_id?: string;
  series_id: string;
  year: number;
  mint: string;
  mint_id?: string;
  mint_mark?: string;
  has_mint_mark?: number;
  issue_name: string;
  issue_type?: string;
  finish?: string;
  composition?: string;
  weight_grams?: number;
  diameter_mm?: number;
  display_order: number;
  active: number;
  mintage?: string;
  notes?: string;
  mint_facility_name?: string;
  mint_facility_location?: string;
}

export interface MasterMint {
  id: string;
  name: string;
  mint_mark: string;
  display_mint_mark: string;
  location: string;
  opening_year: number;
  closing_year: number | null;
  periods_of_operation: string;
  denominations_produced: string;
  special_notes: string;
}

export interface MasterCoinError {
  id: string;
  name: string;
  category: string;
  description: string;
  causes?: string;
  rarity_factor?: string;
  famous_examples?: string;
}

export interface CoinVariety {
  id: string;
  issue_id: string;
  name: string;
  variety_type: string;
  display_order: number;
  active: number;
}

export interface CoinPhoto {
  id: string;
  collection_item_id: string;
  photo_url: string;
  is_main: number; // 1 or 0
  display_order: number;
  created_at: string;
}

export interface CollectionItem {
  id: string;
  owner_id: string;
  issue_id: string;
  variety_id?: string;
  variety_name?: string;
  condition_type: 'raw' | 'graded';
  tpg?: string;
  grade?: string;
  certification_number?: string;
  main_photo: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  photos?: CoinPhoto[];
  // Joined fields for display
  issue?: CoinIssue;
  series?: CoinSeries;
  denomination?: Denomination;
  year?: number;
  mint?: string;
  mint_mark?: string;
  issue_name?: string;
  series_name?: string;
  denomination_name?: string;
  composition?: string;
  icon_label?: string;
  facebook_status?: 'queued' | 'opt_out' | 'ask_needed' | 'admin_disabled' | 'batched';
  facebook_message?: string;
}

export interface BullionItem {
  id: string;
  owner_id: string;
  material: 'Gold' | 'Silver' | 'Copper' | 'Platinum' | 'Other';
  label: string;
  weight_oz?: string;
  fineness?: string;
  notes?: string;
  main_photo: string;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface ColonialPatternItem {
  id: string;
  owner_id: string;
  category: 'Colonials' | 'Territorial' | 'Patterns';
  subcategory: string;
  name: string;
  year?: string;
  grade_type?: 'raw' | 'graded';
  tpg?: string;
  grade?: string;
  notes?: string;
  main_photo: string;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_username: string;
  sender_photo: string;
  channel_id: string; // 'universal' or 'group:<group_id>'
  recipient_id?: string | null;
  content: string;
  image_url?: string | null;
  created_at: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  description?: string | null;
  icon_url: string;
  rules?: string | null;
  leader_id: string;
  profanity_filter: number;
  spam_filter: number;
  allow_pictures: number;
  allow_member_invites: number;
  chat_color: string;
  is_public?: number;
  created_at: string;
  updated_at: string;
  // Computed / Joined fields
  user_role?: 'leader' | 'moderator' | 'member' | null;
  is_leader?: boolean;
  members_count?: number;
  pending_requests_count?: number;
  last_message_content?: string | null;
  last_message_time?: string | null;
  leader_username?: string;
  leader_photo?: string;
  is_member?: boolean;
  has_pending_request?: boolean;
}

export interface GroupMember {
  membership_id: string;
  user_id: string;
  username: string;
  profile_photo: string;
  about_me?: string;
  role: 'leader' | 'moderator' | 'member';
  joined_at: string;
}

export interface GroupJoinRequest {
  request_id: string;
  user_id: string;
  username: string;
  profile_photo: string;
  about_me?: string;
  status: 'pending' | 'accepted' | 'denied';
  created_at: string;
}

export interface GroupInvitation {
  invitation_id: string;
  status: 'pending' | 'accepted' | 'denied';
  created_at: string;
  group_id: string;
  group_name: string;
  group_icon: string;
  group_description?: string;
  chat_color?: string;
  inviter_id?: string;
  inviter_username?: string;
  inviter_photo?: string;
  invited_id?: string;
  invited_username?: string;
  invited_photo?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data_json?: string;
  is_read: number;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender_username?: string;
  sender_photo?: string;
  sender_about_me?: string;
  sender_coins_count?: number;
  sender_votes?: number;
  receiver_username?: string;
  receiver_photo?: string;
  receiver_about_me?: string;
  receiver_coins_count?: number;
  receiver_votes?: number;
}

export interface LeaderboardUser {
  id: string;
  username: string;
  profile_photo: string;
  about_me: string;
  total_votes: number;
  weekly_votes?: number;
  coins_count: number;
  graded_count: number;
  bullion_count: number;
  colonials_count: number;
  score: number;
  has_voted?: boolean;
  is_friend?: boolean;
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  weekly_window?: {
    start_formatted: string;
    end_formatted: string;
    start_iso: string;
    end_iso: string;
  };
}

export interface FacebookConnectionInfo {
  status: 'connected' | 'disconnected';
  page_name: string;
  page_id: string;
  last_successful_post: string | null;
  last_failed_post: string | null;
  last_error_message: string | null;
  access_token?: string;
  has_access_token?: boolean;
  updated_at?: string;
}

export interface FacebookAutomationConfig {
  coin_posts_enabled: number;
  coin_post_frequency: 'immediate' | 'daily_digest' | 'weekly_showcase';
  leaderboard_weekly_enabled: number;
  leaderboard_monthly_enabled: number;
  leaderboard_overall_enabled: number;
  new_collectors_welcome_enabled: number;
  milestone_25_enabled: number;
  milestone_50_enabled: number;
  milestone_75_enabled: number;
  milestone_100_enabled: number;
  achievement_rank_enabled: number;
  achievement_vote_enabled: number;
  achievement_top10_enabled: number;
  achievement_num1_enabled: number;
  templates: {
    coin_add: string;
    daily_digest: string;
    weekly_showcase: string;
    leaderboard_weekly: string;
    leaderboard_monthly: string;
    leaderboard_overall: string;
    new_collector: string;
    milestone: string;
    album_100: string;
    achievement: string;
    [key: string]: string;
  };
  updated_at?: string;
}

export interface FacebookQueueRecord {
  id: string;
  event_id: string;
  post_type: string;
  user_id: string | null;
  username: string | null;
  coin_id: string | null;
  album_id: string | null;
  content: string;
  image_url: string | null;
  link_url: string | null;
  status: 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'RETRYING' | 'CANCELLED';
  retry_count: number;
  max_retries: number;
  facebook_post_id: string | null;
  error_message: string | null;
  scheduled_at: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FacebookQueueResponse {
  items: FacebookQueueRecord[];
  counts: {
    total: number;
    pending: number;
    processing: number;
    published: number;
    failed: number;
    retrying: number;
    cancelled: number;
  };
}

// ================= NUMISMATIC NEWS SYSTEM ================= //

export type NewsSourceConnectionType =
  | 'OFFICIAL_API'
  | 'OFFICIAL_RSS'
  | 'OFFICIAL_ATOM'
  | 'AUTHORIZED_FEED'
  | 'MANUAL_IMPORT'
  | 'NEEDS_VERIFICATION';

export type NewsSourceStatus = 'CONNECTED' | 'NEEDS_VERIFICATION' | 'FAILED' | 'DISABLED';

export interface NewsSource {
  id: string;
  name: string;
  website_url: string;
  connection_type: NewsSourceConnectionType;
  endpoint: string;
  api_key_required: number;
  api_key_reference?: string;
  credibility_tier: string;
  categories: string[];
  enabled: number;
  approval_mode: 'AUTOMATIC' | 'REQUIRE_APPROVAL';
  last_successful_fetch?: string | null;
  last_failed_fetch?: string | null;
  last_error?: string | null;
  article_count: number;
  status: NewsSourceStatus;
  created_at: string;
  updated_at: string;
}

export interface RelatedSeriesDetail {
  id: string;
  name: string;
  denomination_id?: string;
}

export interface NewsArticle {
  id: string;
  source_id: string;
  source_name: string;
  original_url: string;
  title: string;
  author?: string | null;
  publication_date: string;
  imported_date: string;
  image_url?: string | null;
  summary: string;
  category: string;
  tags: string[];
  related_coin_ids: string[];
  related_series_ids: string[];
  related_series_details?: RelatedSeriesDetail[];
  is_breaking: number;
  is_featured: number;
  status: 'PUBLISHED' | 'PENDING_REVIEW' | 'ARCHIVED';
  ai_processed?: number;
  likes_count: number;
  dislikes_count: number;
  user_reaction?: 'like' | 'dislike' | null;
  created_at: string;
  updated_at: string;
}

// ================= COIN SPECIMEN COMPARISON TYPES ================= //

export interface ComparisonSpecimen {
  id: string;
  owner_id: string;
  owner_username: string;
  owner_photo?: string;
  issue_id: string;
  issue_name: string;
  year?: number;
  mint?: string;
  mint_mark?: string;
  mint_facility_name?: string;
  series_id: string;
  series_name: string;
  denomination_id?: string;
  denomination_name?: string;
  coin_name_category: string;
  condition_type: 'raw' | 'graded';
  tpg?: string;
  grade: string;
  normalized_grade: string;
  certification_number?: string;
  variety_name?: string;
  composition?: string;
  weight_grams?: number;
  diameter_mm?: number;
  mintage?: string;
  main_photo: string;
  photos?: CoinPhoto[];
  notes?: string;
  created_at: string;
}

export interface CoinComparisonResult {
  target_grade: string;
  coin_name_category: string;
  total_count: number;
  coins: ComparisonSpecimen[];
}

