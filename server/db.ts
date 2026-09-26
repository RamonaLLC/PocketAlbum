import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { SEED_DENOMINATIONS, SEED_SERIES, generateIssuesForSeries } from './seedData.ts';
import { MASTER_MINTS } from './numismaticMints.ts';
import { MASTER_DENOMINATIONS, MASTER_SERIES, MASTER_COIN_ERRORS } from './numismaticMasterData.ts';
import { generateMasterCatalogIssues } from './numismaticIssues.ts';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'coin_collector.db');
export const db = new DatabaseSync(DB_PATH);

// Helper for generating UUIDs
export function generateId(prefix = ''): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return prefix ? `${prefix}_${time}_${rand}` : `${time}_${rand}`;
}

export function initDatabase() {
  // 1. Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      profile_photo TEXT,
      about_me TEXT,
      account_info TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 2. Denominations
  db.exec(`
    CREATE TABLE IF NOT EXISTS denominations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      diameter_mm TEXT,
      icon_label TEXT
    );
  `);

  // 3. Coin Series
  db.exec(`
    CREATE TABLE IF NOT EXISTS coin_series (
      id TEXT PRIMARY KEY,
      denomination_id TEXT NOT NULL,
      name TEXT NOT NULL,
      pcgs_reference_name TEXT NOT NULL,
      start_year INTEGER NOT NULL,
      end_year INTEGER NOT NULL,
      display_order INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (denomination_id) REFERENCES denominations(id)
    );
  `);

  // Historical U.S. Mints Database
  db.exec(`
    CREATE TABLE IF NOT EXISTS coin_mints (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mint_mark TEXT NOT NULL,
      display_mint_mark TEXT NOT NULL,
      location TEXT NOT NULL,
      opening_year INTEGER NOT NULL,
      closing_year INTEGER,
      periods_of_operation TEXT,
      denominations_produced TEXT,
      special_notes TEXT
    );
  `);

  // Master Coin Errors & Die Varieties
  db.exec(`
    CREATE TABLE IF NOT EXISTS coin_errors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      causes TEXT,
      rarity_factor TEXT,
      famous_examples TEXT
    );
  `);

  // 4. Coin Issues (album slots)
  db.exec(`
    CREATE TABLE IF NOT EXISTS coin_issues (
      id TEXT PRIMARY KEY,
      catalog_id TEXT,
      series_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      mint TEXT NOT NULL DEFAULT '',
      mint_id TEXT,
      mint_mark TEXT DEFAULT '',
      has_mint_mark INTEGER DEFAULT 0,
      issue_name TEXT NOT NULL,
      issue_type TEXT DEFAULT 'Business Strike',
      finish TEXT DEFAULT 'Circulating',
      composition TEXT,
      weight_grams REAL,
      diameter_mm REAL,
      mintage TEXT,
      notes TEXT,
      display_order INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (series_id) REFERENCES coin_series(id)
    );
  `);

  // 5. Coin Varieties
  db.exec(`
    CREATE TABLE IF NOT EXISTS coin_varieties (
      id TEXT PRIMARY KEY,
      issue_id TEXT,
      name TEXT NOT NULL,
      variety_type TEXT NOT NULL DEFAULT 'General',
      display_order INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1
    );
  `);

  // 6. Collection Items (Individual Coins)
  db.exec(`
    CREATE TABLE IF NOT EXISTS collection_items (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      issue_id TEXT NOT NULL,
      variety_id TEXT,
      variety_name TEXT,
      condition_type TEXT NOT NULL, /* 'raw' or 'graded' */
      tpg TEXT,
      grade TEXT,
      certification_number TEXT,
      main_photo TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (issue_id) REFERENCES coin_issues(id)
    );
  `);

  // 7. Coin Photos
  db.exec(`
    CREATE TABLE IF NOT EXISTS coin_photos (
      id TEXT PRIMARY KEY,
      collection_item_id TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      is_main INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (collection_item_id) REFERENCES collection_items(id) ON DELETE CASCADE
    );
  `);

  // 8. Bullion & Bars
  db.exec(`
    CREATE TABLE IF NOT EXISTS bullion_items (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      material TEXT NOT NULL, /* 'Gold', 'Silver', 'Copper', 'Platinum', 'Other' */
      label TEXT NOT NULL,
      weight_oz TEXT,
      fineness TEXT,
      notes TEXT,
      main_photo TEXT,
      photos_json TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );
  `);

  // 9. Colonials / Patterns / Territorials
  db.exec(`
    CREATE TABLE IF NOT EXISTS colonial_pattern_items (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      category TEXT NOT NULL, /* 'Colonials', 'Territorial', 'Patterns' */
      subcategory TEXT NOT NULL,
      name TEXT NOT NULL,
      year TEXT,
      grade_type TEXT,
      tpg TEXT,
      grade TEXT,
      notes TEXT,
      main_photo TEXT,
      photos_json TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );
  `);

  // 10. Friendships
  db.exec(`
    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, friend_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id)
    );
  `);

  // 10b. Friend Requests
  db.exec(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', /* 'pending', 'accepted', 'declined' */
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(sender_id, receiver_id),
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );
  `);

  // 11. Collection Votes
  db.exec(`
    CREATE TABLE IF NOT EXISTS collection_votes (
      id TEXT PRIMARY KEY,
      voter_id TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(voter_id, target_user_id),
      FOREIGN KEY (voter_id) REFERENCES users(id),
      FOREIGN KEY (target_user_id) REFERENCES users(id)
    );
  `);

  // 12. Chat Messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      recipient_id TEXT,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );
  `);

  // Ensure image_url column exists if table was already created earlier
  try {
    db.exec(`ALTER TABLE chat_messages ADD COLUMN image_url TEXT;`);
  } catch (_e) {
    // Column already exists
  }

  // 13. Chat Groups
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_groups (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon_url TEXT,
      rules TEXT,
      leader_id TEXT NOT NULL,
      profanity_filter INTEGER NOT NULL DEFAULT 1,
      spam_filter INTEGER NOT NULL DEFAULT 1,
      allow_pictures INTEGER NOT NULL DEFAULT 1,
      allow_member_invites INTEGER NOT NULL DEFAULT 1,
      chat_color TEXT NOT NULL DEFAULT 'amber',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (leader_id) REFERENCES users(id)
    );
  `);

  // 14. Chat Group Members
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member', /* 'leader' or 'member' */
      joined_at TEXT NOT NULL,
      UNIQUE(group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 15. Chat Group Join Requests
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_group_requests (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', /* 'pending', 'accepted', 'denied' */
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 16. Chat Group Invitations
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_group_invitations (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      invited_user_id TEXT NOT NULL,
      inviter_user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', /* 'pending', 'accepted', 'denied' */
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(group_id, invited_user_id),
      FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (invited_user_id) REFERENCES users(id),
      FOREIGN KEY (inviter_user_id) REFERENCES users(id)
    );
  `);

  // 17. Notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL, /* 'mention', 'group_invite', 'join_request', 'join_accepted', 'join_denied', 'removed_from_group', 'chat_ban', 'chat_unban' */
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data_json TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 18. Chat Reports (Automatic ban if reported 5 times by 5 separate accounts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_reports (
      id TEXT PRIMARY KEY,
      reported_user_id TEXT NOT NULL,
      reporter_user_id TEXT NOT NULL,
      message_id TEXT,
      reason TEXT,
      channel TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(reported_user_id, reporter_user_id),
      FOREIGN KEY (reported_user_id) REFERENCES users(id),
      FOREIGN KEY (reporter_user_id) REFERENCES users(id)
    );
  `);

  // 19. App Suggestions (Main settings suggestion box sent to devinjjenkins90@gmail.com)
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_suggestions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      suggestion TEXT NOT NULL,
      target_email TEXT NOT NULL DEFAULT 'devinjjenkins90@gmail.com',
      status TEXT NOT NULL DEFAULT 'submitted',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Safe ALTER TABLE migrations
  try {
    db.exec(`ALTER TABLE chat_groups ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1;`);
  } catch (_e) {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN chat_banned INTEGER NOT NULL DEFAULT 0;`);
  } catch (_e) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN chat_ban_reason TEXT;`);
  } catch (_e) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN chat_ban_expires_at TEXT;`);
  } catch (_e) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN chat_ban_updated_at TEXT;`);
  } catch (_e) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;`);
  } catch (_e) {}
  try {
    db.exec(`UPDATE users SET is_admin = 1 WHERE id = 'user_devin';`);
  } catch (_e) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_mod INTEGER NOT NULL DEFAULT 0;`);
  } catch (_e) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_collection_private INTEGER NOT NULL DEFAULT 0;`);
  } catch (_e) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN facebook_sharing_pref TEXT NOT NULL DEFAULT 'auto';`);
  } catch (_e) {}

  // Facebook Automation Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS facebook_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS facebook_post_queue (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      post_type TEXT NOT NULL,
      user_id TEXT,
      username TEXT,
      coin_id TEXT,
      album_id TEXT,
      content TEXT NOT NULL,
      image_url TEXT,
      link_url TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      retry_count INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 5,
      facebook_post_id TEXT,
      error_message TEXT,
      scheduled_at TEXT NOT NULL,
      published_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Initialize default Facebook settings
  try {
    const defaultConn = {
      status: 'connected',
      page_name: 'PocketAlbum Official Community Page',
      page_id: process.env.FACEBOOK_PAGE_ID || 'pocketalbum_community_page',
      last_successful_post: null,
      last_failed_post: null,
      last_error_message: null,
      access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || 'preconfigured_system_token',
      updated_at: new Date().toISOString()
    };
    db.prepare(`INSERT OR REPLACE INTO facebook_settings (key, value) VALUES ('connection', ?)`).run(JSON.stringify(defaultConn));

    const existingAuto = db.prepare(`SELECT value FROM facebook_settings WHERE key = 'automation'`).get();
    if (!existingAuto) {
      const defaultAuto = {
        coin_posts_enabled: 1,
        coin_post_frequency: 'immediate', // 'immediate' | 'daily_digest' | 'weekly_showcase'
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
      db.prepare(`INSERT OR REPLACE INTO facebook_settings (key, value) VALUES ('automation', ?)`).run(JSON.stringify(defaultAuto));
    }
  } catch (err) {
    console.error('Error seeding facebook settings:', err);
  }

  // Ensure devin has admin/mod rights for review
  try {
    db.prepare(`UPDATE users SET is_admin = 1, is_mod = 1 WHERE id = 'user_devin' OR username = 'Devin Jenkins'`).run();
  } catch (_e) {}

  // Indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_coin_issues_series ON coin_issues(series_id);
    CREATE INDEX IF NOT EXISTS idx_collection_items_owner ON collection_items(owner_id);
    CREATE INDEX IF NOT EXISTS idx_collection_items_created ON collection_items(owner_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_collection_items_issue ON collection_items(issue_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
    CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id, status);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id, status);
    CREATE INDEX IF NOT EXISTS idx_chat_reports_reported ON chat_reports(reported_user_id);
  `);

  // Seed sample friend requests if none exist
  try {
    const reqCount = db.prepare('SELECT COUNT(*) as count FROM friend_requests').get() as { count: number };
    if (reqCount.count === 0) {
      const now = new Date().toISOString();
      const insertReq = db.prepare('INSERT OR IGNORE INTO friend_requests (id, sender_id, receiver_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
      // Colonial Dan sent a request to Devin
      insertReq.run('req_demo_1', 'user_colonial_dan', 'user_devin', 'pending', now, now);
      // Devin sent a request to Gold Rush
      insertReq.run('req_demo_2', 'user_devin', 'user_gold_rush', 'pending', now, now);
    }
  } catch (err) {
    console.error('Error seeding friend requests:', err);
  }

  // Ensure master catalog columns on coin_issues
  const issueCols = [
    'catalog_id TEXT',
    'mint_id TEXT',
    'mint_mark TEXT DEFAULT ""',
    'has_mint_mark INTEGER DEFAULT 0',
    'issue_type TEXT DEFAULT "Business Strike"',
    'finish TEXT DEFAULT "Circulating"',
    'composition TEXT',
    'weight_grams REAL',
    'diameter_mm REAL',
    'mintage TEXT',
    'notes TEXT'
  ];
  for (const col of issueCols) {
    try {
      db.exec(`ALTER TABLE coin_issues ADD COLUMN ${col};`);
    } catch (_e) {}
  }

  // Check if seed data exists
  const denomCount = db.prepare('SELECT COUNT(*) as count FROM denominations').get() as { count: number };
  if (denomCount.count === 0) {
    seedReferenceData();
  } else {
    // Ensure One Cent denomination and Fugio Cent placement
    try {
      db.prepare("UPDATE denominations SET name = 'One Cent' WHERE id = 'denom_cent'").run();
      db.prepare("UPDATE coin_series SET denomination_id = 'denom_cent', name = 'Fugio Cent', display_order = 1 WHERE id = 'fugio-cents'").run();
      db.prepare("UPDATE denominations SET active = 0 WHERE id = 'denom_contract'").run();
    } catch (err) {
      console.error('Migration update error:', err);
    }
  }

  // Ensure Master U.S. Coin Catalog, Historical Mints, and Coin Errors are populated
  const mintsCount = db.prepare('SELECT COUNT(*) as count FROM coin_mints').get() as { count: number };
  const masterIssueCheck = db.prepare("SELECT COUNT(*) as count FROM coin_issues WHERE catalog_id IS NOT NULL").get() as { count: number };
  if (mintsCount.count === 0 || masterIssueCheck.count === 0) {
    seedMasterNumismaticData();
  }

  // Ensure default demo users exist
  seedInitialUsersAndDemoData();

  // Ensure chat groups, memberships, and invitations are seeded
  seedChatGroupsAndDemoData();

  // Ensure rich community comparison specimens are seeded
  seedComparisonCoins();
}

function seedReferenceData() {
  console.log('Seeding official PCGS denominations, series, and issues...');

  // Insert denominations
  const insertDenom = db.prepare(`
    INSERT INTO denominations (id, name, category, display_order, active, icon_label)
    VALUES (?, ?, ?, ?, 1, ?)
  `);

  for (const d of SEED_DENOMINATIONS) {
    insertDenom.run(d.id, d.name, d.category, d.display_order, d.icon_label || d.name[0]);
  }

  // Insert series
  const insertSeries = db.prepare(`
    INSERT INTO coin_series (id, denomination_id, name, pcgs_reference_name, start_year, end_year, display_order, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  // Insert issues
  const insertIssue = db.prepare(`
    INSERT INTO coin_issues (id, series_id, year, mint, issue_name, display_order, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  // Insert variety
  const insertVariety = db.prepare(`
    INSERT INTO coin_varieties (id, issue_id, name, variety_type, display_order, active)
    VALUES (?, ?, ?, 'Standard', 1, 1)
  `);

  for (const s of SEED_SERIES) {
    insertSeries.run(s.id, s.denomination_id, s.name, s.pcgs_reference_name, s.start_year, s.end_year, s.display_order);

    const issues = generateIssuesForSeries(s);
    let order = 1;
    for (const issue of issues) {
      const issueId = `${s.id}_${issue.year}_${issue.mint || 'P'}_${order}`;
      insertIssue.run(issueId, s.id, issue.year, issue.mint, issue.issue_name, order);

      // Add default variety 'Normal Strike'
      insertVariety.run(`${issueId}_normal`, issueId, 'Normal Strike');

      // Add famous varieties where appropriate
      if (s.id === 'indian-cent' && issue.issue_name.includes('1864')) {
        insertVariety.run(`${issueId}_pointed`, issueId, 'Pointed Bust Variety');
      }
      if (s.id === 'lincoln-cent-wheat' && issue.year === 1955) {
        insertVariety.run(`${issueId}_ddo`, issueId, 'DDO FS-101 Doubled Die Obverse');
      }
      if (s.id === 'buffalo-nickel' && issue.year === 1937 && issue.mint === 'D') {
        insertVariety.run(`${issueId}_3leg`, issueId, '3-Legged Buffalo Variety');
      }
      if (s.id === 'jefferson-nickel' && issue.year === 1965) {
        insertVariety.run(`${issueId}_ddo103`, issueId, 'DDO FS-103');
      }

      order++;
    }
  }

  console.log('Seeding completed successfully.');
}

export function seedMasterNumismaticData() {
  console.log('Seeding Master U.S. Coin Catalog, Mints, and Errors...');

  // 1. Mints
  const insertMint = db.prepare(`
    INSERT INTO coin_mints (
      id, name, mint_mark, display_mint_mark, location,
      opening_year, closing_year, periods_of_operation, denominations_produced, special_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      mint_mark = excluded.mint_mark,
      display_mint_mark = excluded.display_mint_mark,
      location = excluded.location,
      opening_year = excluded.opening_year,
      closing_year = excluded.closing_year,
      periods_of_operation = excluded.periods_of_operation,
      denominations_produced = excluded.denominations_produced,
      special_notes = excluded.special_notes;
  `);
  for (const m of MASTER_MINTS) {
    insertMint.run(
      m.id, m.name, m.mint_mark, m.display_mint_mark, m.location,
      m.opening_year, m.closing_year, m.periods_of_operation, m.denominations_produced, m.special_notes
    );
  }

  // 2. Coin Errors
  const insertErr = db.prepare(`
    INSERT INTO coin_errors (id, name, category, description, causes, rarity_factor, famous_examples)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      description = excluded.description;
  `);
  for (const err of MASTER_COIN_ERRORS) {
    insertErr.run(err.id, err.name, err.category, err.description, '', '', '');
  }

  // 3. Master Denominations
  const insertDenom = db.prepare(`
    INSERT INTO denominations (id, name, category, display_order, active, icon_label)
    VALUES (?, ?, ?, ?, 1, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      display_order = excluded.display_order,
      icon_label = excluded.icon_label,
      active = 1;
  `);
  for (const d of MASTER_DENOMINATIONS) {
    insertDenom.run(d.id, d.name, d.category, d.display_order, d.icon_label);
  }

  // 4. Master Series
  const insertSeries = db.prepare(`
    INSERT INTO coin_series (id, denomination_id, name, pcgs_reference_name, start_year, end_year, display_order, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET
      denomination_id = excluded.denomination_id,
      name = excluded.name,
      pcgs_reference_name = excluded.pcgs_reference_name,
      start_year = excluded.start_year,
      end_year = excluded.end_year,
      display_order = excluded.display_order,
      active = 1;
  `);
  for (const s of MASTER_SERIES) {
    insertSeries.run(s.id, s.denomination_id, s.name, s.pcgs_reference_name, s.start_year, s.end_year, s.display_order);
  }

  for (const s of SEED_SERIES) {
    try {
      insertSeries.run(s.id, s.denomination_id, s.name, s.pcgs_reference_name, s.start_year, s.end_year, s.display_order);
    } catch (_e) {}
  }

  // 5. Issues from Master Catalog
  const insertMasterIssue = db.prepare(`
    INSERT INTO coin_issues (
      id, catalog_id, series_id, year, mint, mint_id, mint_mark, has_mint_mark,
      issue_name, issue_type, finish, composition, weight_grams, diameter_mm, mintage, notes, display_order, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET
      catalog_id = excluded.catalog_id,
      series_id = excluded.series_id,
      year = excluded.year,
      mint = excluded.mint,
      mint_id = excluded.mint_id,
      mint_mark = excluded.mint_mark,
      has_mint_mark = excluded.has_mint_mark,
      issue_name = excluded.issue_name,
      issue_type = excluded.issue_type,
      finish = excluded.finish,
      composition = excluded.composition,
      weight_grams = excluded.weight_grams,
      diameter_mm = excluded.diameter_mm,
      mintage = excluded.mintage,
      notes = excluded.notes,
      display_order = excluded.display_order,
      active = 1;
  `);

  const insertVariety = db.prepare(`
    INSERT OR IGNORE INTO coin_varieties (id, issue_id, name, variety_type, display_order, active)
    VALUES (?, ?, ?, 'Standard', 1, 1)
  `);

  const masterIssues = generateMasterCatalogIssues();
  const seriesWithMasterIssues = new Set<string>();

  for (const issue of masterIssues) {
    seriesWithMasterIssues.add(issue.series_id);
    insertMasterIssue.run(
      issue.catalog_id,
      issue.catalog_id,
      issue.series_id,
      issue.year,
      issue.mint_mark || 'P',
      issue.mint_id,
      issue.mint_mark,
      issue.has_mint_mark,
      issue.issue_name,
      issue.issue_type,
      issue.finish,
      issue.composition,
      issue.weight_grams || null,
      issue.diameter_mm || null,
      issue.mintage || null,
      issue.notes || null,
      issue.display_order
    );

    insertVariety.run(`${issue.catalog_id}_normal`, issue.catalog_id, 'Normal Strike');
  }

  // Fallback for any series without custom issues
  for (const s of SEED_SERIES) {
    if (!seriesWithMasterIssues.has(s.id)) {
      const fallbackIssues = generateIssuesForSeries(s);
      let order = 1;
      for (const fi of fallbackIssues) {
        const fallbackId = `${s.id}_${fi.year}_${fi.mint || 'P'}_${order}`;
        insertMasterIssue.run(
          fallbackId,
          fallbackId,
          s.id,
          fi.year,
          fi.mint || 'P',
          fi.mint === 'S' ? 'mint_san_francisco' : fi.mint === 'D' ? 'mint_denver' : fi.mint === 'W' ? 'mint_west_point' : fi.mint === 'O' ? 'mint_new_orleans' : fi.mint === 'CC' ? 'mint_carson_city' : 'mint_philadelphia',
          fi.mint || '',
          fi.mint ? 1 : 0,
          fi.issue_name,
          'Business Strike',
          'Circulating',
          s.category || 'Standard Composition',
          null,
          null,
          null,
          null,
          order
        );
        insertVariety.run(`${fallbackId}_normal`, fallbackId, 'Normal Strike');
        order++;
      }
    }
  }

  console.log(`Master U.S. Coin Catalog seeding complete: ${masterIssues.length} master issues seeded.`);
}

function seedInitialUsersAndDemoData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return;
  }

  console.log('Seeding initial community collectors and sample collection items...');

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, profile_photo, about_me, account_info, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Default primary user
  const primaryUser = {
    id: 'user_devin',
    username: 'Devin',
    profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    about_me: 'Lifelong numismatist focusing on late 19th and early 20th century U.S. copper & silver series. Working on Indian Cents and Morgan Dollars!',
    account_info: 'Collector since 2012 • ANA Member #319488 • Specializing in MS Red Cents',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString()
  };
  insertUser.run(primaryUser.id, primaryUser.username, primaryUser.profile_photo, primaryUser.about_me, primaryUser.account_info, primaryUser.created_at);

  // Other collectors for social, leaderboards, and chat
  const demoUsers = [
    {
      id: 'user_morgan_master',
      username: 'MorganMaster',
      profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      about_me: 'Carson City Morgan Dollar specialist. VAM variety cherrypicker. Over 25 years collecting.',
      account_info: 'Top Rated Morgan Registry Set • PCGS Collectors Club Member',
      created_at: new Date(Date.now() - 180 * 86400000).toISOString()
    },
    {
      id: 'user_copper_king',
      username: 'CopperKing',
      profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      about_me: 'Passionate about Large Cents, Flying Eagles, and Indian Head Cents in Gem condition.',
      account_info: 'EAC (Early American Coppers) Member • Published Numismatic Writer',
      created_at: new Date(Date.now() - 140 * 86400000).toISOString()
    },
    {
      id: 'user_silver_stacker',
      username: 'SilverStacker',
      profile_photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
      about_me: 'Bullion bars, pours, vintage Engelhard & Johnson Matthey silver bars and eagles.',
      account_info: 'Stacking physical precious metals and classic commemoratives.',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
      id: 'user_colonial_dan',
      username: 'ColonialDan',
      profile_photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
      about_me: 'Specialist in Massachusetts Silver, Fugio cents, and Continental currency.',
      account_info: 'Colonial Coin Collectors Club (C4) Member',
      created_at: new Date(Date.now() - 210 * 86400000).toISOString()
    }
  ];

  for (const u of demoUsers) {
    insertUser.run(u.id, u.username, u.profile_photo, u.about_me, u.account_info, u.created_at);
  }

  // Pre-seed friendships
  const insertFriend = db.prepare('INSERT OR IGNORE INTO friendships (id, user_id, friend_id, created_at) VALUES (?, ?, ?, ?)');
  insertFriend.run('f1', 'user_devin', 'user_morgan_master', new Date().toISOString());
  insertFriend.run('f2', 'user_devin', 'user_copper_king', new Date().toISOString());
  insertFriend.run('f3', 'user_morgan_master', 'user_devin', new Date().toISOString());
  insertFriend.run('f4', 'user_copper_king', 'user_devin', new Date().toISOString());

  // Pre-seed votes
  const insertVote = db.prepare('INSERT OR IGNORE INTO collection_votes (id, voter_id, target_user_id, created_at) VALUES (?, ?, ?, ?)');
  insertVote.run('v1', 'user_morgan_master', 'user_devin', new Date().toISOString());
  insertVote.run('v2', 'user_copper_king', 'user_devin', new Date().toISOString());
  insertVote.run('v3', 'user_silver_stacker', 'user_devin', new Date().toISOString());
  insertVote.run('v4', 'user_devin', 'user_morgan_master', new Date().toISOString());
  insertVote.run('v5', 'user_devin', 'user_copper_king', new Date().toISOString());
  insertVote.run('v6', 'user_colonial_dan', 'user_morgan_master', new Date().toISOString());
  insertVote.run('v7', 'user_silver_stacker', 'user_copper_king', new Date().toISOString());

  // Pre-seed sample Indian Cent items for Devin
  const insertItem = db.prepare(`
    INSERT INTO collection_items (id, owner_id, issue_id, variety_id, variety_name, condition_type, tpg, grade, certification_number, main_photo, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPhoto = db.prepare(`
    INSERT INTO coin_photos (id, collection_item_id, photo_url, is_main, display_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Sample coin 1: 1900 Indian Cent - PCGS MS-64 RB
  const indian1900 = db.prepare(`SELECT id FROM coin_issues WHERE series_id = 'indian-cent' AND year = 1900 LIMIT 1`).get() as { id: string } | undefined;
  if (indian1900) {
    const coin1Id = 'coin_sample_1900_ms64';
    const mainPhoto = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80';
    insertItem.run(
      coin1Id,
      'user_devin',
      indian1900.id,
      null,
      'Normal Strike',
      'graded',
      'PCGS',
      'MS-64 RB',
      '38947102',
      mainPhoto,
      'Vibrant luster with blazing red-brown tones. Clean cheek and strong feather details.',
      new Date().toISOString(),
      new Date().toISOString()
    );
    insertPhoto.run('photo_1', coin1Id, mainPhoto, 1, 0, new Date().toISOString());
    insertPhoto.run('photo_2', coin1Id, 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&auto=format&fit=crop&q=80', 0, 1, new Date().toISOString());

    // Sample coin 2 (Multiple examples for same issue! 1900 Indian Cent - Raw AU)
    const coin2Id = 'coin_sample_1900_raw';
    const rawPhoto = 'https://images.unsplash.com/photo-1621981386829-9b458a21ddde?w=400&auto=format&fit=crop&q=80';
    insertItem.run(
      coin2Id,
      'user_devin',
      indian1900.id,
      null,
      'Normal Strike',
      'raw',
      null,
      null,
      null,
      rawPhoto,
      'Raw original album survivor. Four full letters in LIBERTY.',
      new Date().toISOString(),
      new Date().toISOString()
    );
    insertPhoto.run('photo_3', coin2Id, rawPhoto, 1, 0, new Date().toISOString());
  }

  // Sample coin 3: 1908-S Indian Cent - PCGS VF-30
  const indian1908S = db.prepare(`SELECT id FROM coin_issues WHERE series_id = 'indian-cent' AND year = 1908 AND mint = 'S' LIMIT 1`).get() as { id: string } | undefined;
  if (indian1908S) {
    const coin3Id = 'coin_sample_1908s_vf30';
    const photo1908s = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80';
    insertItem.run(
      coin3Id,
      'user_devin',
      indian1908S.id,
      null,
      'Normal Strike',
      'graded',
      'PCGS',
      'VF-30',
      '41890234',
      photo1908s,
      'Key San Francisco branch mint issue. Honest even chocolate brown patina.',
      new Date().toISOString(),
      new Date().toISOString()
    );
    insertPhoto.run('photo_4', coin3Id, photo1908s, 1, 0, new Date().toISOString());
  }

  // Sample coin 4: 1877 Indian Cent - NGC G-04 (Key Date!)
  const indian1877 = db.prepare(`SELECT id FROM coin_issues WHERE series_id = 'indian-cent' AND year = 1877 LIMIT 1`).get() as { id: string } | undefined;
  if (indian1877) {
    const coin4Id = 'coin_sample_1877_key';
    const photo1877 = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80';
    insertItem.run(
      coin4Id,
      'user_devin',
      indian1877.id,
      null,
      'Normal Strike',
      'graded',
      'NGC',
      'G-04',
      '20948571',
      photo1877,
      'The holy grail of regular issue Indian Cents! Full rims and clear date.',
      new Date().toISOString(),
      new Date().toISOString()
    );
    insertPhoto.run('photo_5', coin4Id, photo1877, 1, 0, new Date().toISOString());
  }

  // Sample Morgan Dollar for MorganMaster: 1878-CC MS-65
  const morgan1878cc = db.prepare(`SELECT id FROM coin_issues WHERE series_id = 'morgan-dollar' AND year = 1878 AND mint = 'CC' LIMIT 1`).get() as { id: string } | undefined;
  if (morgan1878cc) {
    const ccId = 'coin_sample_1878cc';
    const morganPhoto = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80';
    insertItem.run(
      ccId,
      'user_morgan_master',
      morgan1878cc.id,
      null,
      'Normal Strike',
      'graded',
      'PCGS',
      'MS-65',
      '11893041',
      morganPhoto,
      'GSA Carson City hoard pedigree with deep mirror prooflike surfaces.',
      new Date().toISOString(),
      new Date().toISOString()
    );
    insertPhoto.run('photo_cc_1', ccId, morganPhoto, 1, 0, new Date().toISOString());
  }

  // Pre-seed sample bullion for Devin
  const insertBullion = db.prepare(`
    INSERT INTO bullion_items (id, owner_id, material, label, weight_oz, fineness, notes, main_photo, photos_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBullion.run(
    'bullion_1',
    'user_devin',
    'Silver',
    '10 oz Engelhard Vintage Waffleback Bar',
    '10.0',
    '.999 Fine Silver',
    'Classic 7th Series frosted waffle-back design from 1983. Highly collectible vintage pour.',
    'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&auto=format&fit=crop&q=80',
    JSON.stringify(['https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&auto=format&fit=crop&q=80']),
    new Date().toISOString(),
    new Date().toISOString()
  );

  insertBullion.run(
    'bullion_2',
    'user_devin',
    'Gold',
    '1 oz American Gold Eagle 2024 Uncirculated',
    '1.0',
    '.9167 (22 Karat)',
    'West Point Mint strike with Augustus Saint-Gaudens obverse design.',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    JSON.stringify(['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80']),
    new Date().toISOString(),
    new Date().toISOString()
  );

  // Pre-seed sample Colonial/Pattern for Devin
  const insertColonial = db.prepare(`
    INSERT INTO colonial_pattern_items (id, owner_id, category, subcategory, name, year, grade_type, tpg, grade, notes, main_photo, photos_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertColonial.run(
    'col_1',
    'user_devin',
    'Colonials',
    'Massachusetts Silver Coins',
    '1652 Pine Tree Shilling - Small Planchet',
    '1652',
    'graded',
    'PCGS',
    'VF-35',
    'Crosby 14-R variety. Beautiful dark cabinet toning with crisp tree needle strike.',
    'https://images.unsplash.com/photo-1621981386829-9b458a21ddde?w=400&auto=format&fit=crop&q=80',
    JSON.stringify(['https://images.unsplash.com/photo-1621981386829-9b458a21ddde?w=400&auto=format&fit=crop&q=80']),
    new Date().toISOString(),
    new Date().toISOString()
  );

  // Pre-seed chat messages
  const insertChat = db.prepare(`
    INSERT INTO chat_messages (id, sender_id, channel_id, recipient_id, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertChat.run('chat_1', 'user_morgan_master', 'lounge', null, 'Welcome everyone to PocketAlbum! What is everyone working on finishing this month?', new Date(Date.now() - 3600000 * 5).toISOString());
  insertChat.run('chat_2', 'user_copper_king', 'lounge', null, 'Just found an 1877 Indian Cent in G-04 at an estate sale. Album slot finally filled!', new Date(Date.now() - 3600000 * 4).toISOString());
  insertChat.run('chat_3', 'user_devin', 'lounge', null, 'Incredible find @CopperKing! I just updated my 1900 Indian Cent photos with new high-res macro shots.', new Date(Date.now() - 3600000 * 2).toISOString());
  insertChat.run('chat_4', 'user_silver_stacker', 'lounge', null, 'The new bullion gallery view makes cataloging vintage 10oz pours so satisfying.', new Date(Date.now() - 3600000).toISOString());

  console.log('Sample data populated.');
}

function seedChatGroupsAndDemoData() {
  try {
    const groupCount = db.prepare('SELECT COUNT(*) as count FROM chat_groups').get() as { count: number };
    if (groupCount.count > 0) {
      return;
    }

    console.log('Seeding initial chat groups and demo interactions...');
    const now = new Date().toISOString();

    const insertGroup = db.prepare(`
      INSERT INTO chat_groups (id, name, description, icon_url, rules, leader_id, profanity_filter, spam_filter, allow_pictures, allow_member_invites, chat_color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMember = db.prepare(`
      INSERT INTO chat_group_members (id, group_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertReq = db.prepare(`
      INSERT INTO chat_group_requests (id, group_id, user_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertInvite = db.prepare(`
      INSERT INTO chat_group_invitations (id, group_id, invited_user_id, inviter_user_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMsg = db.prepare(`
      INSERT INTO chat_messages (id, sender_id, channel_id, recipient_id, content, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `);

    // Group 1: 🪙 Coin Collectors (Leader: Devin)
    insertGroup.run(
      'group_coin_collectors',
      'Coin Collectors',
      'General numismatic gathering for passionate collectors of all series, mintmarks, and historical eras.',
      '🪙',
      '1. Be welcoming and courteous to fellow collectors.\n2. Share high resolution obverse & reverse photos.\n3. Respect other numismatists opinions on condition and grade.',
      'user_devin',
      1, 1, 1, 1, 'amber', now, now
    );
    insertMember.run('cgm_1', 'group_coin_collectors', 'user_devin', 'leader', now);
    insertMember.run('cgm_2', 'group_coin_collectors', 'user_morgan_master', 'member', now);
    insertMember.run('cgm_3', 'group_coin_collectors', 'user_copper_stacker', 'member', now);
    insertMember.run('cgm_4', 'group_coin_collectors', 'user_colonial_dan', 'member', now);

    // Group 2: 💰 Morgan Club (Leader: MorganMaster)
    insertGroup.run(
      'group_morgan_club',
      'Morgan Club',
      'Dedicated to the King of American Silver: Morgan Silver Dollars, Carson City strikes, and elite VAM varieties.',
      '💰',
      'Morgan & Peace dollars only! Discuss grades, toning, die varieties, DMPL prooflikes, and CC branch mints.',
      'user_morgan_master',
      1, 1, 1, 1, 'blue', now, now
    );
    insertMember.run('cgm_5', 'group_morgan_club', 'user_morgan_master', 'leader', now);
    insertMember.run('cgm_6', 'group_morgan_club', 'user_devin', 'member', now);
    insertMember.run('cgm_7', 'group_morgan_club', 'user_silver_stacker', 'member', now);

    // Group 3: 📸 Error Coins (Leader: CopperStacker)
    insertGroup.run(
      'group_error_coins',
      'Error Coins',
      'Cherrypickers and error specialists sharing double dies, clipped planchets, off-centers, and repunched mintmarks.',
      '📸',
      'Post microscope/macro photos with clear lighting. Specify coin year and mintmark. No post-mint damage (PMD).',
      'user_copper_stacker',
      1, 1, 1, 1, 'rose', now, now
    );
    insertMember.run('cgm_8', 'group_error_coins', 'user_copper_stacker', 'leader', now);
    insertMember.run('cgm_9', 'group_error_coins', 'user_devin', 'member', now);
    insertMember.run('cgm_10', 'group_error_coins', 'user_colonial_dan', 'member', now);

    // Group 4: 👥 My Friends (Leader: Devin)
    insertGroup.run(
      'group_my_friends',
      'My Friends',
      'Close circle of verified numismatic trade partners, local coin club members, and show companions.',
      '👥',
      'Friendly numismatic banter, trade negotiations, and early previews of newly acquired show coins.',
      'user_devin',
      0, 1, 1, 1, 'emerald', now, now
    );
    insertMember.run('cgm_11', 'group_my_friends', 'user_devin', 'leader', now);
    insertMember.run('cgm_12', 'group_my_friends', 'user_colonial_dan', 'member', now);

    // Group 5: 🛡️ Silver Stackers (Leader: MorganMaster - For invitation demo)
    insertGroup.run(
      'group_silver_stackers',
      'Silver Stackers',
      'Physical silver bullion, pours, Engelhard bars, and government silver eagles.',
      '🛡️',
      'Share stacking milestones, pour art, and spot price trends.',
      'user_morgan_master',
      1, 1, 1, 1, 'purple', now, now
    );
    insertMember.run('cgm_13', 'group_silver_stackers', 'user_morgan_master', 'leader', now);

    // Pending Join Request for Devin's group "Coin Collectors" from Gold Rush
    insertReq.run('req_grp_1', 'group_coin_collectors', 'user_gold_rush', 'pending', now, now);

    // Pending Invitation for Devin to join "Silver Stackers" from MorganMaster
    insertInvite.run('inv_grp_1', 'group_silver_stackers', 'user_devin', 'user_morgan_master', 'pending', now, now);

    // Pending Sent Invitation: Devin invited SilverEagle99 to "My Friends"
    insertInvite.run('inv_grp_2', 'group_my_friends', 'user_silver_stacker', 'user_devin', 'pending', now, now);

    // Seed Messages in Universal Chat
    insertMsg.run(
      'univ_1',
      'user_morgan_master',
      'universal',
      null,
      'Welcome everyone to the official Universal Chat on PocketAlbum! 🌎 What numismatic treasures are on your radar this week?',
      null,
      new Date(Date.now() - 3600000 * 6).toISOString()
    );

    // Here is the prompt's exact sample tag: @devin check out this 1921 Morgan!
    insertMsg.run(
      'univ_2',
      'user_copper_stacker',
      'universal',
      null,
      '@Devin check out this 1921 Morgan! The luster and strike on the eagle reverse is razor sharp.',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      new Date(Date.now() - 3600000 * 3).toISOString()
    );

    insertMsg.run(
      'univ_3',
      'user_devin',
      'universal',
      null,
      '@CopperStacker that Morgan has extraordinary eye appeal! Thanks for tagging me.',
      null,
      new Date(Date.now() - 3600000 * 2).toISOString()
    );

    insertMsg.run(
      'univ_4',
      'user_colonial_dan',
      'universal',
      null,
      'Just posted high-res macro photos of my 1652 Pine Tree Shilling. The branches and date came out remarkably crisp!',
      'https://images.unsplash.com/photo-1621981386829-9b458a21ddde?w=600&auto=format&fit=crop&q=80',
      new Date(Date.now() - 1800000).toISOString()
    );

    // Seed Group Messages
    insertMsg.run(
      'gmsg_1',
      'user_devin',
      'group:group_coin_collectors',
      null,
      'Welcome to Coin Collectors group! Feel free to share your album completions, coin show finds, and cherrypicks.',
      null,
      new Date(Date.now() - 3600000 * 8).toISOString()
    );

    insertMsg.run(
      'gmsg_2',
      'user_morgan_master',
      'group:group_coin_collectors',
      null,
      'Great to be here @Devin! Working on a complete 1878 to 1904 Carson City Morgan run in MS-64 or better.',
      null,
      new Date(Date.now() - 3600000 * 5).toISOString()
    );

    insertMsg.run(
      'gmsg_3',
      'user_morgan_master',
      'group:group_morgan_club',
      null,
      'Official Morgan Club discussion: what is your favorite year for strike sharpness? 1880-S or 1881-S?',
      null,
      new Date(Date.now() - 3600000 * 4).toISOString()
    );

    insertMsg.run(
      'gmsg_4',
      'user_copper_stacker',
      'group:group_error_coins',
      null,
      'Check out this 1955 Lincoln Wheat cent doubled die obverse. The doubling on LIBERTY and IN GOD WE TRUST is undeniable.',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      new Date(Date.now() - 3600000 * 2).toISOString()
    );

    // Seed initial notifications for Devin
    insertNotif.run(
      'notif_1',
      'user_devin',
      'mention',
      'New Mention in Universal Chat',
      '@CopperStacker tagged you in Universal Chat: "@Devin check out this 1921 Morgan!"',
      JSON.stringify({ channel_id: 'universal', message_id: 'univ_2' }),
      new Date(Date.now() - 3600000 * 3).toISOString()
    );

    insertNotif.run(
      'notif_2',
      'user_devin',
      'group_invite',
      'New Group Invitation',
      'MorganMaster invited you to join "Silver Stackers"',
      JSON.stringify({ group_id: 'group_silver_stackers', invite_id: 'inv_grp_1' }),
      new Date(Date.now() - 3600000 * 2).toISOString()
    );

    insertNotif.run(
      'notif_3',
      'user_devin',
      'join_request',
      'Group Join Request',
      'Gold Rush requested to join "Coin Collectors"',
      JSON.stringify({ group_id: 'group_coin_collectors', request_id: 'req_grp_1' }),
      now
    );

    console.log('Chat groups and interactions seeded successfully.');
  } catch (err) {
    console.error('Error seeding chat groups:', err);
  }
}

function seedComparisonCoins() {
  try {
    const existing = db.prepare("SELECT COUNT(*) as count FROM collection_items WHERE id LIKE 'cmp_%'").get() as { count: number };
    if (existing && existing.count >= 8) {
      return;
    }

    console.log('Seeding official numismatic comparison specimens...');

    const insertItem = db.prepare(`
      INSERT OR IGNORE INTO collection_items (id, owner_id, issue_id, variety_id, variety_name, condition_type, tpg, grade, certification_number, main_photo, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPhoto = db.prepare(`
      INSERT OR IGNORE INTO coin_photos (id, collection_item_id, photo_url, is_main, display_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Helper to find issue ID
    const findIssue = (seriesId: string, year: number, mint: string = '') => {
      const row = db.prepare("SELECT id FROM coin_issues WHERE series_id = ? AND year = ? AND (mint = ? OR (mint = '' AND ? = 'P')) LIMIT 1").get(seriesId, year, mint, mint) as { id: string } | undefined;
      return row?.id;
    };

    const now = new Date().toISOString();

    // ================= LINCOLN CENTS (MS 67) ================= //
    const lincoln1909s = findIssue('lincoln-cent-wheat', 1909, 'S') || 'lincoln-cent-wheat_1909_S_2';
    if (lincoln1909s) {
      insertItem.run(
        'cmp_lincoln_1909s_ms67',
        'user_devin',
        lincoln1909s,
        null,
        'VDB Victor David Brenner Initials',
        'graded',
        'PCGS',
        'MS-67 RD',
        '48192051',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
        'Superb Gem Uncirculated with blazing fiery copper luster and full wheat ear stalk lines.',
        now,
        now
      );
      insertPhoto.run('photo_cmp_l1_1', 'cmp_lincoln_1909s_ms67', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', 1, 0, now);
      insertPhoto.run('photo_cmp_l1_2', 'cmp_lincoln_1909s_ms67', 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop&q=80', 0, 1, now);
    }

    const lincoln1943 = findIssue('lincoln-cent-wheat', 1943, 'P') || 'lincoln-cent-wheat_1943_P_16';
    if (lincoln1943) {
      insertItem.run(
        'cmp_lincoln_1943_ms67',
        'user_copper_king',
        lincoln1943,
        null,
        'Zinc-Coated Steel Planchet',
        'graded',
        'NGC',
        'MS 67',
        '28471904',
        'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop&q=80',
        'Pristine wartime zinc-coated steel planchet with brilliant cartwheel spin and undisturbed fields.',
        now,
        now
      );
      insertPhoto.run('photo_cmp_l2_1', 'cmp_lincoln_1943_ms67', 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop&q=80', 1, 0, now);
    }

    const lincoln1955 = findIssue('lincoln-cent-wheat', 1955, 'P') || 'lincoln-cent-wheat_1955_P_19';
    if (lincoln1955) {
      insertItem.run(
        'cmp_lincoln_1955_ms67',
        'user_colonial_dan',
        lincoln1955,
        null,
        'Normal Strike',
        'graded',
        'PCGS',
        'MS 67 RD',
        '39105822',
        'https://images.unsplash.com/photo-1621981386829-9b458a21ddde?w=800&auto=format&fit=crop&q=80',
        'Phenomenal strike with needle-sharp portrait details and razor-crisp bow ties.',
        now,
        now
      );
      insertPhoto.run('photo_cmp_l3_1', 'cmp_lincoln_1955_ms67', 'https://images.unsplash.com/photo-1621981386829-9b458a21ddde?w=800&auto=format&fit=crop&q=80', 1, 0, now);
    }

    const lincoln1938d = findIssue('lincoln-cent-wheat', 1938, 'D') || 'US-LINCOLN-CENT-WHEAT-1938-D';
    if (lincoln1938d) {
      insertItem.run(
        'cmp_lincoln_1938d_ms67',
        'user_silver_stacker',
        lincoln1938d,
        null,
        'Normal Strike',
        'graded',
        'PCGS',
        'MS-67 RD',
        '50192837',
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
        'Immaculate Denver strike with radiant red luster and complete absence of contact marks.',
        now,
        now
      );
      insertPhoto.run('photo_cmp_l4_1', 'cmp_lincoln_1938d_ms67', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80', 1, 0, now);
    }

    // ================= BUFFALO NICKELS (MS 65) ================= //
    const buffalo1937d = findIssue('buffalo-nickel', 1937, 'D') || 'buffalo-nickel_1937_D_55';
    if (buffalo1937d) {
      insertItem.run(
        'cmp_buffalo_1937d_ms65',
        'user_devin',
        buffalo1937d,
        null,
        'Regular Strike',
        'graded',
        'PCGS',
        'MS 65',
        '61092834',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
        'Bold horn and tail details with soft golden-amber rim toning and sharp cheek bone.',
        now,
        now
      );
      insertPhoto.run('photo_cmp_b1_1', 'cmp_buffalo_1937d_ms65', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80', 1, 0, now);
    }

    const buffalo1936 = findIssue('buffalo-nickel', 1936, 'P') || 'buffalo-nickel_1936_P_51';
    if (buffalo1936) {
      insertItem.run(
        'cmp_buffalo_1936_ms65',
        'user_copper_king',
        buffalo1936,
        null,
        'Normal Strike',
        'graded',
        'NGC',
        'MS-65',
        '72940182',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        'Frosted satin surfaces with full split tail, sharp braids, and flawless satin fields.',
        now,
        now
      );
      insertPhoto.run('photo_cmp_b2_1', 'cmp_buffalo_1936_ms65', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', 1, 0, now);
    }

    const buffalo1938d = findIssue('buffalo-nickel', 1938, 'D') || 'buffalo-nickel_1938_D_59';
    if (buffalo1938d) {
      insertItem.run(
        'cmp_buffalo_1938d_ms65',
        'user_morgan_master',
        buffalo1938d,
        null,
        'Denver Final Issue',
        'graded',
        'PCGS',
        'MS 65',
        '83920147',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
        'Final year Denver issue with booming cartwheel luster across the bison flank.',
        now,
        now
      );
      insertPhoto.run('photo_cmp_b3_1', 'cmp_buffalo_1938d_ms65', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', 1, 0, now);
    }

    const buffalo1913 = findIssue('buffalo-nickel', 1913, 'P') || 'buffalo-nickel_1913_P_1';
    if (buffalo1913) {
      insertItem.run(
        'cmp_buffalo_1913_ms65',
        'user_colonial_dan',
        buffalo1913,
        null,
        'Type 1 Mound',
        'graded',
        'PCGS',
        'MS-65',
        '94018274',
        'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop&q=80',
        'Type 1 Raised Ground variety with intense strike sharpness and velvety surfaces.',
        now,
        now
      );
      insertPhoto.run('photo_cmp_b4_1', 'cmp_buffalo_1913_ms65', 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop&q=80', 1, 0, now);
    }

    // ================= MORGAN DOLLARS (MS 65) ================= //
    const morgan1881s = findIssue('morgan-dollar', 1881, 'S') || 'morgan-dollar_1881_S_16';
    if (morgan1881s) {
      insertItem.run(
        'cmp_morgan_1881s_ms65',
        'user_silver_stacker',
        morgan1881s,
        null,
        'San Francisco Mint',
        'graded',
        'NGC',
        'MS 65',
        '19283746',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        'Legendary San Francisco strike with reflective fields, frosted eagle feathers, and swirling luster.',
        now,
        now
      );
      insertPhoto.run('photo_cmp_m1_1', 'cmp_morgan_1881s_ms65', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', 1, 0, now);
    }

    const morgan1893s = findIssue('morgan-dollar', 1893, 'S') || 'morgan-dollar_1893_S_34';
    if (morgan1893s) {
      insertItem.run(
        'cmp_morgan_1893s_ms65',
        'user_devin',
        morgan1893s,
        null,
        'Key Date Strike',
        'graded',
        'PCGS',
        'MS-65',
        '28394015',
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
        'The Holy Grail of Morgan collecting. Breathtaking original surfaces with razor-sharp hair curls.',
        now,
        now
      );
      insertPhoto.run('photo_cmp_m2_1', 'cmp_morgan_1893s_ms65', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80', 1, 0, now);
    }

    const morgan1904o = findIssue('morgan-dollar', 1904, 'O') || 'morgan-dollar_1904_O_38';
    if (morgan1904o) {
      insertItem.run(
        'cmp_morgan_1904o_ms65',
        'user_colonial_dan',
        morgan1904o,
        null,
        'New Orleans Mint',
        'graded',
        'NGC',
        'MS 65',
        '37482910',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
        'Vibrant cartwheel luster with classic New Orleans softness, radiant eye appeal, and clean cheek.',
        now,
        now
      );
      insertPhoto.run('photo_cmp_m3_1', 'cmp_morgan_1904o_ms65', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80', 1, 0, now);
    }

    console.log('Official numismatic comparison specimens seeded successfully.');
  } catch (err) {
    console.error('Error seeding comparison coins:', err);
  }
}

