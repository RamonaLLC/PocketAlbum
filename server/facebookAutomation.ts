import { db, generateId } from './db.ts';
import { FacebookService } from './facebookService.ts';

export interface FacebookAutomationSettingsData {
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
  templates: Record<string, string>;
  updated_at: string;
}

export interface QueueItem {
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

export class FacebookAutomationManager {
  /**
   * Get Automation Settings
   */
  public static getSettings(): FacebookAutomationSettingsData {
    try {
      const row = db.prepare(`SELECT value FROM facebook_settings WHERE key = 'automation'`).get() as { value: string } | undefined;
      if (row && row.value) {
        return JSON.parse(row.value);
      }
    } catch (err) {
      console.error('Error fetching Facebook automation settings:', err);
    }

    return {
      coin_posts_enabled: 1,
      coin_post_frequency: 'immediate',
      leaderboard_weekly_enabled: 1,
      leaderboard_monthly_enabled: 1,
      leaderboard_overall_enabled: 1,
      new_collectors_welcome_enabled: 1,
      milestone_25_enabled: 1,
      milestone_50_enabled: 1,
      milestone_75_enabled: 1,
      milestone_100_enabled: 1,
      achievement_rank_enabled: 1,
      achievement_vote_enabled: 1,
      achievement_top10_enabled: 1,
      achievement_num1_enabled: 1,
      templates: {
        coin_add: "🪙 NEW COIN ADDED TO POCKETALBUM! 🪙\n\nCollector: @{username}\n\nCoin:\n{coin}\n\nGrade:\n{grade}\n\nVariety:\n{variety}\n\nAlbum:\n{album}\n\nAnother coin has been added to the PocketAlbum community!\n\nView the collector's PocketAlbum collection:\n{link}",
        daily_digest: "🪙 POCKETALBUM DAILY COLLECTION UPDATE 🪙\n\nToday's collectors added:\n\n{coin_list}\n\nCongratulations to everyone growing their collections!\n\nExplore PocketAlbum:\n{link}",
        weekly_showcase: "🪙 POCKETALBUM WEEKLY COIN SHOWCASE 🪙\n\nThis week's newest additions include:\n\n{coin_list}\n\nCongratulations to our collectors!\n\nExplore PocketAlbum:\n{link}",
        leaderboard_weekly: "🏆 POCKETALBUM WEEKLY LEADERBOARD 🏆\n\n{top3}\n\nCongratulations to this week's top collectors!\n\nWho will take #1 next week?\n\nExplore PocketAlbum:\n{link}",
        leaderboard_monthly: "🏆 POCKETALBUM MONTHLY LEADERBOARD 🏆\n\n{top3}\n\nSaluting our premier monthly numismatists!\n\nExplore PocketAlbum:\n{link}",
        leaderboard_overall: "🏆 POCKETALBUM ALL-TIME LEADERBOARD 🏆\n\n{top3}\n\nThe highest-ranking numismatic masters of PocketAlbum!\n\nExplore PocketAlbum:\n{link}",
        new_collector: "🎉 WELCOME TO POCKETALBUM! 🎉\n\nPlease welcome @{username} to the PocketAlbum collecting community!\n\nThey're officially starting their collection journey.\n\nWelcome! 🪙\n\nExplore PocketAlbum:\n{link}",
        milestone: "🎉 COLLECTION MILESTONE! 🎉\n\nCongratulations to @{username}!\n\nTheir {album} album is now:\n\n💰 {milestone}% COMPLETE! 💰\n\nKeep collecting!\n\nExplore PocketAlbum:\n{link}",
        album_100: "🏆 ALBUM COMPLETE! 🏆\n\nCongratulations to @{username}!\n\nTheir {album} collection is officially:\n\n💯 100% COMPLETE! 💯\n\n🪙🏆🪙🏆🪙\n\nExplore PocketAlbum:\n{link}",
        achievement: "🌟 NUMISMATIC ACHIEVEMENT! 🌟\n\nKudos to @{username} for reaching a major milestone: {achievement_name}!\n\nExplore PocketAlbum:\n{link}"
      },
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Save Automation Settings
   */
  public static saveSettings(settings: Partial<FacebookAutomationSettingsData>): FacebookAutomationSettingsData {
    const current = this.getSettings();
    const updated: FacebookAutomationSettingsData = {
      ...current,
      ...settings,
      templates: {
        ...current.templates,
        ...(settings.templates || {})
      },
      updated_at: new Date().toISOString()
    };

    db.prepare(`INSERT OR REPLACE INTO facebook_settings (key, value) VALUES ('automation', ?)`).run(JSON.stringify(updated));
    return updated;
  }

  /**
   * Resolve public link URL
   */
  public static getPocketAlbumLink(path: string = ''): string {
    const baseUrl = process.env.APP_URL || 'https://pocketalbum.com';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    return `${cleanBase}${cleanPath}`;
  }

  /**
   * Format template with variables
   */
  public static formatTemplate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return result;
  }

  /**
   * Check duplicate event
   */
  public static isEventQueuedOrPublished(eventId: string): boolean {
    const row = db.prepare(`SELECT id, status FROM facebook_post_queue WHERE event_id = ?`).get(eventId) as { id: string; status: string } | undefined;
    if (!row) return false;
    // If it was cancelled or failed, allow retry/re-queue, but if pending, processing, retrying or published, return true
    return ['PENDING', 'PROCESSING', 'PUBLISHED', 'RETRYING'].includes(row.status);
  }

  /**
   * Enqueue a Facebook post job safely
   */
  public static enqueuePost(params: {
    event_id: string;
    post_type: string;
    user_id?: string | null;
    username?: string | null;
    coin_id?: string | null;
    album_id?: string | null;
    content: string;
    image_url?: string | null;
    link_url?: string | null;
    scheduled_at?: string;
  }): { queued: boolean; message: string; queue_id?: string } {
    try {
      if (this.isEventQueuedOrPublished(params.event_id)) {
        return { queued: false, message: `Duplicate prevention: Event ${params.event_id} is already queued or published.` };
      }

      const id = generateId('fbpost');
      const now = new Date().toISOString();
      const scheduledAt = params.scheduled_at || now;

      db.prepare(`
        INSERT INTO facebook_post_queue (
          id, event_id, post_type, user_id, username, coin_id, album_id,
          content, image_url, link_url, status, retry_count, max_retries,
          scheduled_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, 5, ?, ?, ?)
      `).run(
        id,
        params.event_id,
        params.post_type,
        params.user_id || null,
        params.username || null,
        params.coin_id || null,
        params.album_id || null,
        params.content,
        params.image_url || null,
        params.link_url || null,
        scheduledAt,
        now,
        now
      );

      // Trigger immediate background processing asynchronously so it publishes quickly
      setImmediate(() => {
        FacebookAutomationManager.processFacebookQueue().catch(err => console.error('Immediate queue processing error:', err));
      });

      return { queued: true, message: 'Post successfully queued for publishing', queue_id: id };
    } catch (err: any) {
      console.error('Failed to enqueue Facebook post:', err);
      return { queued: false, message: `Failed to queue post: ${err.message}` };
    }
  }

  /**
   * Handle coin addition event
   */
  public static async onCoinAdded(coinId: string, ownerId: string): Promise<{
    status: 'queued' | 'opt_out' | 'ask_needed' | 'admin_disabled' | 'batched';
    message: string;
  }> {
    try {
      // 1. Fetch user sharing preference
      const user = db.prepare(`SELECT id, username, facebook_sharing_pref FROM users WHERE id = ?`).get(ownerId) as any;
      if (!user) {
        return { status: 'opt_out', message: 'User not found' };
      }

      const pref = user.facebook_sharing_pref || 'auto';
      if (pref === 'never') {
        return { status: 'opt_out', message: 'User has Facebook sharing disabled (Never Post)' };
      }

      if (pref === 'ask') {
        return { status: 'ask_needed', message: 'User preference is Ask Me Each Time' };
      }

      // 2. Check admin settings
      const settings = this.getSettings();
      if (!settings.coin_posts_enabled) {
        return { status: 'admin_disabled', message: 'Coin posting is currently disabled in Admin settings' };
      }

      // 3. Frequency check
      if (settings.coin_post_frequency === 'daily_digest' || settings.coin_post_frequency === 'weekly_showcase') {
        return { status: 'batched', message: `Coin will be included in the next ${settings.coin_post_frequency === 'daily_digest' ? 'Daily Digest' : 'Weekly Showcase'}` };
      }

      // 4. Immediate post generation
      const coin = db.prepare(`
        SELECT ci.*, 
          iss.issue_name, iss.year, iss.mint, iss.series_id,
          s.name as series_name, s.denomination_id,
          d.name as denomination_name
        FROM collection_items ci
        JOIN coin_issues iss ON ci.issue_id = iss.id
        JOIN coin_series s ON iss.series_id = s.id
        JOIN denominations d ON s.denomination_id = d.id
        WHERE ci.id = ?
      `).get(coinId) as any;

      if (!coin) {
        return { status: 'opt_out', message: 'Coin record not found' };
      }

      const gradeStr = coin.condition_type === 'graded'
        ? `${coin.tpg ? coin.tpg + ' ' : ''}${coin.grade || 'Graded'}`
        : 'Raw / Ungraded Specimen';

      const coinName = `${coin.year || ''} ${coin.mint ? coin.mint + ' ' : ''}${coin.series_name || coin.issue_name || 'Specimen'}`.trim();
      const varietyStr = coin.variety_name || 'Normal Strike';
      const albumStr = coin.series_name || 'PocketAlbum Collection';
      const linkUrl = this.getPocketAlbumLink(`/user/${user.id}`);

      const template = settings.templates.coin_add || "🪙 NEW COIN ADDED TO POCKETALBUM! 🪙\n\nCollector: @{username}\n\nCoin:\n{coin}\n\nGrade:\n{grade}\n\nVariety:\n{variety}\n\nAlbum:\n{album}\n\nAnother coin has been added to the PocketAlbum community!\n\nView the collector's PocketAlbum collection:\n{link}";

      const content = this.formatTemplate(template, {
        username: user.username,
        coin: coinName,
        grade: gradeStr,
        variety: varietyStr,
        album: albumStr,
        link: linkUrl
      });

      const photoUrl = coin.main_photo && coin.main_photo.startsWith('http') ? coin.main_photo : null;
      const eventId = `coin_add_${coinId}`;

      const res = this.enqueuePost({
        event_id: eventId,
        post_type: 'coin_add',
        user_id: user.id,
        username: user.username,
        coin_id: coinId,
        album_id: coin.series_id,
        content,
        image_url: photoUrl,
        link_url: linkUrl
      });

      // Also check if this addition triggered collection milestones (25%, 50%, 75%, 100%)
      this.checkAndQueueMilestones(ownerId, coin.series_id, coin.series_name).catch(e => console.error('Error checking milestones:', e));

      return { status: res.queued ? 'queued' : 'opt_out', message: res.message };
    } catch (err: any) {
      console.error('Error in onCoinAdded:', err);
      return { status: 'opt_out', message: err.message };
    }
  }

  /**
   * Handle user manual approval when preference is "Ask Me Each Time"
   */
  public static async confirmCoinPost(coinId: string, ownerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = db.prepare(`SELECT id, username FROM users WHERE id = ?`).get(ownerId) as any;
      const coin = db.prepare(`
        SELECT ci.*, 
          iss.issue_name, iss.year, iss.mint, iss.series_id,
          s.name as series_name,
          d.name as denomination_name
        FROM collection_items ci
        JOIN coin_issues iss ON ci.issue_id = iss.id
        JOIN coin_series s ON iss.series_id = s.id
        JOIN denominations d ON s.denomination_id = d.id
        WHERE ci.id = ? AND ci.owner_id = ?
      `).get(coinId, ownerId) as any;

      if (!user || !coin) {
        return { success: false, message: 'Coin or user record not found' };
      }

      const settings = this.getSettings();
      const gradeStr = coin.condition_type === 'graded'
        ? `${coin.tpg ? coin.tpg + ' ' : ''}${coin.grade || 'Graded'}`
        : 'Raw / Ungraded Specimen';

      const coinName = `${coin.year || ''} ${coin.mint ? coin.mint + ' ' : ''}${coin.series_name || coin.issue_name || 'Specimen'}`.trim();
      const varietyStr = coin.variety_name || 'Normal Strike';
      const albumStr = coin.series_name || 'PocketAlbum Collection';
      const linkUrl = this.getPocketAlbumLink(`/user/${user.id}`);

      const template = settings.templates.coin_add;
      const content = this.formatTemplate(template, {
        username: user.username,
        coin: coinName,
        grade: gradeStr,
        variety: varietyStr,
        album: albumStr,
        link: linkUrl
      });

      const photoUrl = coin.main_photo && coin.main_photo.startsWith('http') ? coin.main_photo : null;
      const eventId = `coin_add_${coinId}`;

      const res = this.enqueuePost({
        event_id: eventId,
        post_type: 'coin_add',
        user_id: user.id,
        username: user.username,
        coin_id: coinId,
        album_id: coin.series_id,
        content,
        image_url: photoUrl,
        link_url: linkUrl
      });

      return { success: res.queued, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Check album milestones (25%, 50%, 75%, 100%)
   */
  public static async checkAndQueueMilestones(userId: string, seriesId: string, seriesName?: string): Promise<void> {
    try {
      const user = db.prepare(`SELECT id, username, facebook_sharing_pref FROM users WHERE id = ?`).get(userId) as any;
      if (!user || user.facebook_sharing_pref === 'never') return;

      const settings = this.getSettings();
      const totalIssuesRow = db.prepare(`SELECT count(*) as count FROM coin_issues WHERE series_id = ? AND active = 1`).get(seriesId) as any;
      const total = totalIssuesRow ? totalIssuesRow.count : 0;
      if (total === 0) return;

      const ownedIssuesRow = db.prepare(`
        SELECT count(DISTINCT ci.issue_id) as count
        FROM collection_items ci
        JOIN coin_issues iss ON ci.issue_id = iss.id
        WHERE ci.owner_id = ? AND iss.series_id = ? AND iss.active = 1
      `).get(userId, seriesId) as any;

      const owned = ownedIssuesRow ? ownedIssuesRow.count : 0;
      const pct = Math.floor((owned / total) * 100);

      const albumName = seriesName || 'Album';
      const linkUrl = this.getPocketAlbumLink(`/user/${user.id}`);

      // Check 100% completion
      if (pct >= 100 && settings.milestone_100_enabled) {
        const eventId = `milestone_100_${userId}_${seriesId}`;
        const template = settings.templates.album_100;
        const content = this.formatTemplate(template, {
          username: user.username,
          album: albumName,
          link: linkUrl
        });
        this.enqueuePost({
          event_id: eventId,
          post_type: 'album_100',
          user_id: user.id,
          username: user.username,
          album_id: seriesId,
          content,
          link_url: linkUrl
        });
        return;
      }

      // Check intermediate milestones: 75, 50, 25
      const milestoneThresholds = [
        { target: 75, enabled: settings.milestone_75_enabled },
        { target: 50, enabled: settings.milestone_50_enabled },
        { target: 25, enabled: settings.milestone_25_enabled }
      ];

      for (const m of milestoneThresholds) {
        if (pct >= m.target && m.enabled) {
          const eventId = `milestone_${m.target}_${userId}_${seriesId}`;
          const template = settings.templates.milestone;
          const content = this.formatTemplate(template, {
            username: user.username,
            album: albumName,
            milestone: String(m.target),
            link: linkUrl
          });
          this.enqueuePost({
            event_id: eventId,
            post_type: 'milestone',
            user_id: user.id,
            username: user.username,
            album_id: seriesId,
            content,
            link_url: linkUrl
          });
          break; // only post the highest reached milestone for this event
        }
      }
    } catch (err) {
      console.error('Error checking milestone completion:', err);
    }
  }

  /**
   * New Collector Welcome Post
   */
  public static onNewCollectorJoined(userId: string, username: string): void {
    try {
      const settings = this.getSettings();
      if (!settings.new_collectors_welcome_enabled) return;

      const eventId = `welcome_${userId}`;
      const linkUrl = this.getPocketAlbumLink(`/user/${userId}`);
      const template = settings.templates.new_collector;
      const content = this.formatTemplate(template, {
        username,
        link: linkUrl
      });

      this.enqueuePost({
        event_id: eventId,
        post_type: 'new_collector',
        user_id: userId,
        username,
        content,
        link_url: linkUrl
      });
    } catch (err) {
      console.error('Error queuing welcome post:', err);
    }
  }

  /**
   * Generate Daily Digest Post
   */
  public static generateDailyDigest(): { queued: boolean; message: string; content?: string } {
    try {
      const settings = this.getSettings();
      const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const dateKey = new Date().toISOString().slice(0, 10);

      // Find coins added in the last 24h by users who have facebook_sharing_pref != 'never'
      const rows = db.prepare(`
        SELECT ci.id, ci.condition_type, ci.tpg, ci.grade,
               u.username,
               iss.year, iss.mint, s.name as series_name, iss.issue_name
        FROM collection_items ci
        JOIN users u ON ci.owner_id = u.id
        JOIN coin_issues iss ON ci.issue_id = iss.id
        JOIN coin_series s ON iss.series_id = s.id
        WHERE ci.created_at >= ?
          AND (u.facebook_sharing_pref IS NULL OR u.facebook_sharing_pref != 'never')
        ORDER BY ci.created_at DESC
        LIMIT 10
      `).all(oneDayAgo) as any[];

      if (rows.length === 0) {
        return { queued: false, message: 'No eligible coins added in the last 24 hours to digest' };
      }

      const listItems = rows.map(r => {
        const grade = r.condition_type === 'graded' ? `${r.tpg ? r.tpg + ' ' : ''}${r.grade || 'Graded'}` : 'Raw Specimen';
        const coinName = `${r.year || ''} ${r.mint || ''} ${r.series_name || r.issue_name || 'Specimen'}`.trim();
        return `• ${coinName} — ${grade} (@${r.username})`;
      }).join('\n');

      const linkUrl = this.getPocketAlbumLink();
      const template = settings.templates.daily_digest;
      const content = this.formatTemplate(template, {
        coin_list: listItems,
        link: linkUrl
      });

      const eventId = `daily_digest_${dateKey}`;
      const res = this.enqueuePost({
        event_id: eventId,
        post_type: 'daily_digest',
        content,
        link_url: linkUrl
      });

      return { queued: res.queued, message: res.message, content };
    } catch (err: any) {
      return { queued: false, message: err.message };
    }
  }

  /**
   * Generate Weekly Showcase Post
   */
  public static generateWeeklyShowcase(): { queued: boolean; message: string; content?: string } {
    try {
      const settings = this.getSettings();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const now = new Date();
      const weekNumber = Math.ceil((now.getDate() + 6 - now.getDay()) / 7);
      const weekKey = `${now.getFullYear()}_W${weekNumber}_${now.getMonth() + 1}`;

      const rows = db.prepare(`
        SELECT ci.id, ci.condition_type, ci.tpg, ci.grade,
               u.username,
               iss.year, iss.mint, s.name as series_name, iss.issue_name
        FROM collection_items ci
        JOIN users u ON ci.owner_id = u.id
        JOIN coin_issues iss ON ci.issue_id = iss.id
        JOIN coin_series s ON iss.series_id = s.id
        WHERE ci.created_at >= ?
          AND (u.facebook_sharing_pref IS NULL OR u.facebook_sharing_pref != 'never')
        ORDER BY ci.created_at DESC
        LIMIT 12
      `).all(sevenDaysAgo) as any[];

      if (rows.length === 0) {
        return { queued: false, message: 'No eligible coins added in the last 7 days for showcase' };
      }

      const listItems = rows.map(r => {
        const grade = r.condition_type === 'graded' ? `${r.tpg ? r.tpg + ' ' : ''}${r.grade || 'Graded'}` : 'Raw Specimen';
        const coinName = `${r.year || ''} ${r.mint || ''} ${r.series_name || r.issue_name || 'Specimen'}`.trim();
        return `• ${coinName} (${grade}) &bull; Added by @${r.username}`;
      }).join('\n');

      const linkUrl = this.getPocketAlbumLink();
      const template = settings.templates.weekly_showcase;
      const content = this.formatTemplate(template, {
        coin_list: listItems,
        link: linkUrl
      });

      const eventId = `weekly_showcase_${weekKey}`;
      const res = this.enqueuePost({
        event_id: eventId,
        post_type: 'weekly_showcase',
        content,
        link_url: linkUrl
      });

      return { queued: res.queued, message: res.message, content };
    } catch (err: any) {
      return { queued: false, message: err.message };
    }
  }

  /**
   * Generate Leaderboard Post (Weekly, Monthly, Overall)
   */
  public static generateLeaderboardPost(type: 'weekly' | 'monthly' | 'overall'): { queued: boolean; message: string; content?: string } {
    try {
      const settings = this.getSettings();
      if (type === 'weekly' && !settings.leaderboard_weekly_enabled) {
        return { queued: false, message: 'Weekly leaderboard posting is disabled in Admin settings' };
      }
      if (type === 'monthly' && !settings.leaderboard_monthly_enabled) {
        return { queued: false, message: 'Monthly leaderboard posting is disabled in Admin settings' };
      }
      if (type === 'overall' && !settings.leaderboard_overall_enabled) {
        return { queued: false, message: 'Overall leaderboard posting is disabled in Admin settings' };
      }

      // Query top collectors
      const users = db.prepare(`
        SELECT u.id, u.username,
          (SELECT COUNT(*) FROM collection_votes WHERE target_user_id = u.id) as total_votes,
          (SELECT COUNT(*) FROM collection_items WHERE owner_id = u.id) as coins_count
        FROM users u
        ORDER BY total_votes DESC, coins_count DESC
        LIMIT 3
      `).all() as any[];

      if (users.length === 0) {
        return { queued: false, message: 'No collectors found for leaderboard post' };
      }

      const medals = ['🥇 1st', '🥈 2nd', '🥉 3rd'];
      const top3Lines = users.map((u, i) => `${medals[i] || '•'} — @${u.username} (${u.total_votes} votes, ${u.coins_count} coins)`).join('\n');

      const templateKey = `leaderboard_${type}`;
      const template = settings.templates[templateKey] || settings.templates.leaderboard_weekly;
      const linkUrl = this.getPocketAlbumLink('/leaderboards');

      const content = this.formatTemplate(template, {
        top3: top3Lines,
        link: linkUrl
      });

      const dateKey = new Date().toISOString().slice(0, 10);
      const eventId = `leaderboard_${type}_${dateKey}`;

      const res = this.enqueuePost({
        event_id: eventId,
        post_type: `leaderboard_${type}`,
        content,
        link_url: linkUrl
      });

      return { queued: res.queued, message: res.message, content };
    } catch (err: any) {
      return { queued: false, message: err.message };
    }
  }

  /**
   * Generate an Instant Test Post to verify Facebook automation with 1 click
   */
  public static async generateTestPost(): Promise<{ success: boolean; message: string; post_id?: string }> {
    try {
      const settings = this.getSettings();
      const testId = `test_coin_${Date.now()}`;
      const template = settings.templates.coin_add || "🪙 NEW COIN ADDED TO POCKETALBUM! 🪙\n\nCollector: @{username}\n\nCoin:\n{coin}\n\nGrade:\n{grade}\n\nVariety:\n{variety}\n\nAlbum:\n{album}\n\nAnother coin has been added to the PocketAlbum community!\n\nView the collector's PocketAlbum collection:\n{link}";

      const content = this.formatTemplate(template, {
        username: 'PocketAlbumCollector',
        coin: '1909-S VDB Lincoln Cent (Sample Showcase)',
        grade: 'PCGS MS65 Red',
        variety: 'V.D.B. Key Date',
        album: 'Lincoln Cents (1909-1958)',
        link: this.getPocketAlbumLink('/leaderboards')
      });

      const enqueueRes = this.enqueuePost({
        event_id: `test_post_${testId}`,
        post_type: 'coin_add',
        user_id: 'user_devin',
        username: 'DevinJenkins',
        content,
        link_url: this.getPocketAlbumLink('/leaderboards')
      });

      // Immediately process queue
      const processRes = await this.processFacebookQueue();
      return {
        success: true,
        message: `Instant test post generated and published successfully! (${processRes.published} published to Facebook)`,
        post_id: enqueueRes.queue_id
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Queue Collector Achievement Post (Rank changes, vote milestones, top 10, #1)
   */
  public static queueAchievementPost(userId: string, username: string, achievementName: string): void {
    try {
      const user = db.prepare(`SELECT facebook_sharing_pref FROM users WHERE id = ?`).get(userId) as any;
      if (user && user.facebook_sharing_pref === 'never') return;

      const settings = this.getSettings();
      const linkUrl = this.getPocketAlbumLink(`/user/${userId}`);
      const template = settings.templates.achievement;
      const content = this.formatTemplate(template, {
        username,
        achievement_name: achievementName,
        link: linkUrl
      });

      const eventId = `achievement_${userId}_${achievementName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      this.enqueuePost({
        event_id: eventId,
        post_type: 'achievement',
        user_id: userId,
        username,
        content,
        link_url: linkUrl
      });
    } catch (err) {
      console.error('Error queuing achievement post:', err);
    }
  }

  /**
   * Process pending items in Facebook publishing queue
   */
  public static async processFacebookQueue(): Promise<{ processed: number; published: number; failed: number }> {
    const now = new Date().toISOString();
    // Select pending or retrying items whose scheduled time has arrived
    const items = db.prepare(`
      SELECT * FROM facebook_post_queue
      WHERE status IN ('PENDING', 'RETRYING')
        AND scheduled_at <= ?
      ORDER BY scheduled_at ASC
      LIMIT 10
    `).all(now) as unknown as QueueItem[];

    let publishedCount = 0;
    let failedCount = 0;

    for (const item of items) {
      // Mark as PROCESSING
      db.prepare(`UPDATE facebook_post_queue SET status = 'PROCESSING', updated_at = ? WHERE id = ?`).run(now, item.id);

      const result = await FacebookService.publishPost({
        id: item.id,
        content: item.content,
        image_url: item.image_url,
        link_url: item.link_url
      });

      const updatedNow = new Date().toISOString();

      if (result.success) {
        db.prepare(`
          UPDATE facebook_post_queue
          SET status = 'PUBLISHED',
              facebook_post_id = ?,
              published_at = ?,
              error_message = NULL,
              updated_at = ?
          WHERE id = ?
        `).run(result.facebook_post_id || null, updatedNow, updatedNow, item.id);
        publishedCount++;
      } else {
        const nextRetryCount = (item.retry_count || 0) + 1;
        const isPermanent = result.is_permanent_error || nextRetryCount >= item.max_retries;

        if (isPermanent) {
          db.prepare(`
            UPDATE facebook_post_queue
            SET status = 'FAILED',
                error_message = ?,
                retry_count = ?,
                updated_at = ?
            WHERE id = ?
          `).run(result.error || 'Failed to publish to Facebook', nextRetryCount, updatedNow, item.id);
          failedCount++;
        } else {
          // Exponential backoff: 2^retry minutes
          const backoffMinutes = Math.pow(2, nextRetryCount);
          const nextScheduledAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

          db.prepare(`
            UPDATE facebook_post_queue
            SET status = 'RETRYING',
                error_message = ?,
                retry_count = ?,
                scheduled_at = ?,
                updated_at = ?
            WHERE id = ?
          `).run(result.error || 'Temporary API failure, retrying', nextRetryCount, nextScheduledAt, updatedNow, item.id);
          failedCount++;
        }
      }
    }

    return { processed: items.length, published: publishedCount, failed: failedCount };
  }

  /**
   * Manually retry a failed or cancelled post
   */
  public static manualRetryPost(queueId: string): { success: boolean; message: string } {
    try {
      const now = new Date().toISOString();
      const info = db.prepare(`
        UPDATE facebook_post_queue
        SET status = 'PENDING',
            error_message = NULL,
            scheduled_at = ?,
            updated_at = ?
        WHERE id = ?
      `).run(now, now, queueId);

      if (info.changes > 0) {
        // Trigger queue runner
        setImmediate(() => {
          FacebookAutomationManager.processFacebookQueue().catch(console.error);
        });
        return { success: true, message: 'Post reset to PENDING and scheduled for immediate retry' };
      }
      return { success: false, message: 'Post not found' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Cancel a pending or retrying post
   */
  public static cancelPost(queueId: string): { success: boolean; message: string } {
    try {
      const now = new Date().toISOString();
      const info = db.prepare(`
        UPDATE facebook_post_queue
        SET status = 'CANCELLED',
            updated_at = ?
        WHERE id = ?
      `).run(now, queueId);

      return { success: info.changes > 0, message: info.changes > 0 ? 'Post cancelled' : 'Post not found' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Delete a post from queue history
   */
  public static deletePost(queueId: string): { success: boolean; message: string } {
    try {
      const info = db.prepare(`DELETE FROM facebook_post_queue WHERE id = ?`).run(queueId);
      return { success: info.changes > 0, message: 'Post removed from history' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
