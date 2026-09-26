import express from 'express';
import { db, generateId } from './db.ts';
import { FacebookService } from './facebookService.ts';
import { FacebookAutomationManager } from './facebookAutomation.ts';
import { NewsService } from './newsService.ts';

const router = express.Router();

// ================= USER & PROFILE ROUTES ================= //

// Get or search users
router.get('/users', (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).trim().toLowerCase() : '';
    const currentUserId = req.query.current_user_id ? String(req.query.current_user_id) : '';

    let usersQuery = `
      SELECT u.id, u.username, u.profile_photo, u.about_me, u.account_info, u.created_at,
        (SELECT COUNT(*) FROM collection_votes WHERE target_user_id = u.id) as total_votes,
        (SELECT COUNT(*) FROM collection_items WHERE owner_id = u.id) as coins_count,
        (SELECT COUNT(*) FROM bullion_items WHERE owner_id = u.id) as bullion_count,
        (SELECT COUNT(*) FROM colonial_pattern_items WHERE owner_id = u.id) as colonials_count
    `;

    if (currentUserId) {
      usersQuery += `,
        EXISTS(SELECT 1 FROM friendships WHERE user_id = ? AND friend_id = u.id) as is_friend,
        EXISTS(SELECT 1 FROM collection_votes WHERE voter_id = ? AND target_user_id = u.id) as has_voted
      `;
    }

    usersQuery += ` FROM users u `;

    let rows: any[];
    if (q) {
      usersQuery += ` WHERE LOWER(u.username) LIKE ? ORDER BY total_votes DESC, coins_count DESC LIMIT 50`;
      if (currentUserId) {
        rows = db.prepare(usersQuery).all(currentUserId, currentUserId, `%${q}%`);
      } else {
        rows = db.prepare(usersQuery).all(`%${q}%`);
      }
    } else {
      usersQuery += ` ORDER BY total_votes DESC, coins_count DESC LIMIT 50`;
      if (currentUserId) {
        rows = db.prepare(usersQuery).all(currentUserId, currentUserId);
      } else {
        rows = db.prepare(usersQuery).all();
      }
    }

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/users/:id', (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.query.current_user_id ? String(req.query.current_user_id) : '';

    const userStmt = db.prepare(`
      SELECT u.*,
        (SELECT COUNT(*) FROM collection_votes WHERE target_user_id = u.id) as total_votes,
        (SELECT COUNT(*) FROM collection_items WHERE owner_id = u.id) as coins_count,
        (SELECT COUNT(*) FROM collection_items WHERE owner_id = u.id AND condition_type = 'graded') as graded_count,
        (SELECT COUNT(*) FROM bullion_items WHERE owner_id = u.id) as bullion_count,
        (SELECT COUNT(*) FROM colonial_pattern_items WHERE owner_id = u.id) as colonials_count
      FROM users u WHERE u.id = ?
    `);
    const user = userStmt.get(userId) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUserId) {
      const friendCheck = db.prepare(`SELECT 1 FROM friendships WHERE user_id = ? AND friend_id = ?`).get(currentUserId, userId);
      user.is_friend = !!friendCheck;

      // Check friend request status
      const sentReq = db.prepare(`SELECT id, status FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'`).get(currentUserId, userId) as any;
      const receivedReq = db.prepare(`SELECT id, status FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'`).get(userId, currentUserId) as any;

      if (user.is_friend) {
        user.friend_status = 'friends';
      } else if (sentReq) {
        user.friend_status = 'request_sent';
        user.friend_request_id = sentReq.id;
      } else if (receivedReq) {
        user.friend_status = 'request_received';
        user.friend_request_id = receivedReq.id;
      } else {
        user.friend_status = 'none';
      }

      const voteCheck = db.prepare(`SELECT 1 FROM collection_votes WHERE voter_id = ? AND target_user_id = ?`).get(currentUserId, userId);
      user.has_voted = !!voteCheck;
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/users/:id', (req, res) => {
  try {
    const userId = req.params.id;
    const { username, profile_photo, about_me, account_info, is_collection_private, facebook_sharing_pref } = req.body;

    // Check unique username if changed
    if (username) {
      const existing = db.prepare(`SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?`).get(username.trim(), userId);
      if (existing) {
        return res.status(400).json({ error: 'Username already taken by another account' });
      }
    }

    const current = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as any;
    if (!current) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUsername = username ? username.trim() : current.username;
    const updatedPhoto = profile_photo !== undefined ? profile_photo : current.profile_photo;
    const updatedAbout = about_me !== undefined ? about_me : current.about_me;
    const updatedAccount = account_info !== undefined ? account_info : current.account_info;
    const updatedPrivate = is_collection_private !== undefined ? (is_collection_private ? 1 : 0) : (current.is_collection_private ?? 0);
    const updatedFbPref = ['auto', 'ask', 'never'].includes(facebook_sharing_pref) ? facebook_sharing_pref : (current.facebook_sharing_pref || 'auto');

    db.prepare(`
      UPDATE users SET username = ?, profile_photo = ?, about_me = ?, account_info = ?, is_collection_private = ?, facebook_sharing_pref = ?
      WHERE id = ?
    `).run(updatedUsername, updatedPhoto, updatedAbout, updatedAccount, updatedPrivate, updatedFbPref, userId);

    const updatedUser = db.prepare(`
      SELECT u.*,
        (SELECT COUNT(*) FROM collection_votes WHERE target_user_id = u.id) as total_votes,
        (SELECT COUNT(*) FROM collection_items WHERE owner_id = u.id) as coins_count
      FROM users u WHERE u.id = ?
    `).get(userId);

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update specifically Facebook sharing preference
router.put('/users/:id/facebook-pref', (req, res) => {
  try {
    const userId = req.params.id;
    const { pref } = req.body;
    if (!['auto', 'ask', 'never'].includes(pref)) {
      return res.status(400).json({ error: "Invalid preference. Must be 'auto', 'ask', or 'never'." });
    }
    db.prepare(`UPDATE users SET facebook_sharing_pref = ? WHERE id = ?`).run(pref, userId);
    res.json({ success: true, facebook_sharing_pref: pref });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new user account or switch
router.post('/auth/register', (req, res) => {
  try {
    const { username, profile_photo, about_me, account_info } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.trim();
    const existing = db.prepare(`SELECT * FROM users WHERE LOWER(username) = LOWER(?)`).get(cleanUsername);
    if (existing) {
      return res.status(400).json({ error: 'Username is already registered. Please choose another username or log into that account.' });
    }

    const newId = generateId('user');
    const photo = profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
    const about = about_me || 'Numismatic enthusiast exploring coin history!';
    const account = account_info || 'New Collector';
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, profile_photo, about_me, account_info, facebook_sharing_pref, created_at)
      VALUES (?, ?, ?, ?, ?, 'auto', ?)
    `).run(newId, cleanUsername, photo, about, account, createdAt);

    const user = db.prepare(`
      SELECT u.*, 0 as total_votes, 0 as coins_count FROM users u WHERE id = ?
    `).get(newId);

    // Additive non-blocking welcome post trigger
    try {
      FacebookAutomationManager.onNewCollectorJoined(newId, cleanUsername);
    } catch (fbErr) {
      console.error('Non-blocking welcome post error:', fbErr);
    }

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= DENOMINATIONS, SERIES, ISSUES ================= //

// Get all denominations
router.get('/denominations', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM denominations WHERE active = 1 ORDER BY display_order ASC`).all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get series for denomination
router.get('/series', (req, res) => {
  try {
    const denomId = req.query.denomination_id;
    let query = `SELECT * FROM coin_series WHERE active = 1`;
    let rows: any[];

    if (denomId) {
      query += ` AND denomination_id = ? ORDER BY display_order ASC`;
      rows = db.prepare(query).all(String(denomId));
    } else {
      query += ` ORDER BY display_order ASC`;
      rows = db.prepare(query).all();
    }
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single series
router.get('/series/:id', (req, res) => {
  try {
    const series = db.prepare(`SELECT * FROM coin_series WHERE id = ?`).get(req.params.id);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }
    res.json(series);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get issues for series (the actual album slots!)
router.get('/issues', (req, res) => {
  try {
    const seriesId = req.query.series_id;
    if (!seriesId) {
      return res.status(400).json({ error: 'series_id query parameter is required' });
    }
    const rows = db.prepare(`
      SELECT iss.*,
             m.name as mint_facility_name,
             m.location as mint_facility_location
      FROM coin_issues iss
      LEFT JOIN coin_mints m ON iss.mint_id = m.id
      WHERE iss.series_id = ? AND iss.active = 1
      ORDER BY iss.display_order ASC, iss.year ASC, iss.mint ASC
    `).all(String(seriesId));
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get historical U.S. Mints
router.get('/mints', (_req, res) => {
  try {
    const mints = db.prepare(`SELECT * FROM coin_mints ORDER BY opening_year ASC`).all();
    res.json(mints);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get master coin errors & varieties
router.get('/errors', (_req, res) => {
  try {
    const errors = db.prepare(`SELECT * FROM coin_errors ORDER BY name ASC`).all();
    res.json(errors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search coin issues across all denominations & series (MUST be defined before /issues/:id)
router.get('/issues/search', (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';
    let query = `
      SELECT iss.*, 
             s.id as series_id, s.name as series_name, s.start_year, s.end_year,
             d.id as denomination_id, d.name as denomination_name, d.icon_label,
             m.name as mint_facility_name, m.location as mint_facility_location
      FROM coin_issues iss
      JOIN coin_series s ON iss.series_id = s.id
      JOIN denominations d ON s.denomination_id = d.id
      LEFT JOIN coin_mints m ON iss.mint_id = m.id
      WHERE iss.active = 1
    `;
    let rows: any[];
    if (q) {
      query += ` AND (
        iss.issue_name LIKE ? OR 
        CAST(iss.year AS TEXT) LIKE ? OR 
        s.name LIKE ? OR 
        d.name LIKE ?
      ) ORDER BY iss.year DESC, iss.mint ASC LIMIT 60`;
      const term = `%${q}%`;
      rows = db.prepare(query).all(term, term, term, term);
    } else {
      query += ` ORDER BY iss.year DESC, iss.mint ASC LIMIT 40`;
      rows = db.prepare(query).all();
    }
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single issue detail with mint information
router.get('/issues/:id', (req, res) => {
  try {
    const issue = db.prepare(`
      SELECT iss.*, 
             s.name as series_name, s.start_year as series_start_year, s.end_year as series_end_year,
             d.id as denomination_id, d.name as denomination_name, d.icon_label,
             m.name as mint_name, m.location as mint_location, m.periods_of_operation as mint_periods
      FROM coin_issues iss
      JOIN coin_series s ON iss.series_id = s.id
      JOIN denominations d ON s.denomination_id = d.id
      LEFT JOIN coin_mints m ON iss.mint_id = m.id
      WHERE iss.id = ? OR iss.catalog_id = ?
    `).get(req.params.id, req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Coin issue not found' });
    }
    res.json(issue);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get varieties for an issue
router.get('/varieties', (req, res) => {
  try {
    const issueId = req.query.issue_id;
    let rows: any[] = [];
    if (issueId) {
      rows = db.prepare(`
        SELECT * FROM coin_varieties WHERE (issue_id = ? OR issue_id IS NULL) AND active = 1 ORDER BY display_order ASC
      `).all(String(issueId));
    }

    // Ensure Normal Strike is always included
    const hasNormal = rows.some(r => r.name.toLowerCase().includes('normal'));
    if (!hasNormal) {
      rows.unshift({
        id: 'var_normal_default',
        issue_id: issueId,
        name: 'Normal Strike',
        variety_type: 'Standard',
        display_order: 0,
        active: 1
      });
    }

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= COLLECTION ITEMS (COINS) ================= //

// Get collection items for user & series
router.get('/collection', (req, res) => {
  try {
    const ownerId = req.query.owner_id ? String(req.query.owner_id) : '';
    const seriesId = req.query.series_id ? String(req.query.series_id) : '';

    if (!ownerId) {
      return res.status(400).json({ error: 'owner_id is required' });
    }

    let query = `
      SELECT ci.*, 
        iss.series_id, iss.year, iss.mint, iss.issue_name, iss.display_order as issue_order,
        s.name as series_name, s.denomination_id,
        d.name as denomination_name
      FROM collection_items ci
      JOIN coin_issues iss ON ci.issue_id = iss.id
      JOIN coin_series s ON iss.series_id = s.id
      JOIN denominations d ON s.denomination_id = d.id
      WHERE ci.owner_id = ?
    `;

    let rows: any[];
    if (seriesId) {
      query += ` AND iss.series_id = ? ORDER BY iss.display_order ASC, ci.created_at ASC`;
      rows = db.prepare(query).all(ownerId, seriesId);
    } else {
      query += ` ORDER BY iss.display_order ASC, ci.created_at ASC`;
      rows = db.prepare(query).all(ownerId);
    }

    // Attach all photos for each item
    for (const item of rows) {
      const photos = db.prepare(`
        SELECT * FROM coin_photos WHERE collection_item_id = ? ORDER BY is_main DESC, display_order ASC
      `).all(item.id);
      item.photos = photos;
    }

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recently added coins for user (sorted newest first)
router.get('/collection/recently-added', (req, res) => {
  try {
    const ownerId = req.query.owner_id ? String(req.query.owner_id) : '';
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;

    if (!ownerId) {
      return res.status(400).json({ error: 'owner_id is required' });
    }

    // Check user's collection privacy if viewed by another user
    const viewerId = req.query.viewer_id ? String(req.query.viewer_id) : '';
    const owner = db.prepare('SELECT is_collection_private FROM users WHERE id = ?').get(ownerId) as any;
    if (owner && owner.is_collection_private && viewerId !== ownerId) {
      return res.json([]);
    }

    const rows = db.prepare(`
      SELECT ci.*, 
        iss.series_id, iss.year, iss.mint, iss.mint_mark, iss.issue_name, iss.composition, iss.weight_grams, iss.diameter_mm, iss.mintage, iss.display_order as issue_order,
        s.name as series_name, s.denomination_id,
        d.name as denomination_name, d.icon_label
      FROM collection_items ci
      JOIN coin_issues iss ON ci.issue_id = iss.id
      JOIN coin_series s ON iss.series_id = s.id
      JOIN denominations d ON s.denomination_id = d.id
      WHERE ci.owner_id = ?
      ORDER BY ci.created_at DESC
      LIMIT ?
    `).all(ownerId, limit) as any[];

    for (const item of rows) {
      const photos = db.prepare(`
        SELECT * FROM coin_photos WHERE collection_item_id = ? ORDER BY is_main DESC, display_order ASC
      `).all(item.id) as any[];
      item.photos = photos;
      if (!item.main_photo && photos.length > 0) {
        item.main_photo = photos[0].photo_url;
      }
    }

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single coin item
router.get('/collection/item/:id', (req, res) => {
  try {
    const itemStmt = db.prepare(`
      SELECT ci.*, 
        iss.series_id, iss.year, iss.mint, iss.issue_name,
        s.name as series_name, s.denomination_id,
        d.name as denomination_name
      FROM collection_items ci
      JOIN coin_issues iss ON ci.issue_id = iss.id
      JOIN coin_series s ON iss.series_id = s.id
      JOIN denominations d ON s.denomination_id = d.id
      WHERE ci.id = ?
    `);
    const item = itemStmt.get(req.params.id) as any;
    if (!item) {
      return res.status(404).json({ error: 'Coin not found' });
    }

    const photos = db.prepare(`
      SELECT * FROM coin_photos WHERE collection_item_id = ? ORDER BY is_main DESC, display_order ASC
    `).all(item.id);
    item.photos = photos;

    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= COIN SPECIMEN COMPARISON API ================= //

function mapSeriesToCoinCategory(seriesName?: string, denomName?: string): string {
  if (!seriesName) return denomName || 'Coin Specimen';
  const s = seriesName.toLowerCase().trim();

  // Cents
  if (s.includes('lincoln')) return 'Lincoln Cent';
  if (s.includes('indian cent') || s.includes('indian head cent')) return 'Indian Cent';
  if (s.includes('flying eagle')) return 'Flying Eagle Cent';
  if (s.includes('large cent')) return 'Large Cent';
  if (s.includes('half cent')) return 'Half Cent';
  if (s.includes('fugio')) return 'Fugio Cent';

  // Nickels
  if (s.includes('buffalo') || s.includes('indian head nickel')) return 'Buffalo Nickel';
  if (s.includes('jefferson')) return 'Jefferson Nickel';
  if (s.includes('shield nickel')) return 'Shield Nickel';
  if (s.includes('liberty nickel') || s.includes('liberty head/v') || s.includes('v nickel')) return 'Liberty Head Nickel';

  // Dimes
  if (s.includes('mercury') || s.includes('winged liberty')) return 'Mercury Dime';
  if (s.includes('roosevelt')) return 'Roosevelt Dime';
  if (s.includes('barber dime')) return 'Barber Dime';
  if (s.includes('liberty seated dime')) return 'Liberty Seated Dime';

  // Quarters
  if (s.includes('standing liberty quarter')) return 'Standing Liberty Quarter';
  if (
    s.includes('washington') ||
    s.includes('50 state') ||
    s.includes('america the beautiful') ||
    s.includes('american women') ||
    s.includes('crossing the delaware') ||
    s.includes('semiquincentennial quarter')
  ) {
    return 'Washington Quarter';
  }
  if (s.includes('barber quarter')) return 'Barber Quarter';
  if (s.includes('liberty seated quarter')) return 'Liberty Seated Quarter';

  // Half Dollars
  if (s.includes('walking liberty')) return 'Walking Liberty Half Dollar';
  if (s.includes('franklin')) return 'Franklin Half Dollar';
  if (s.includes('kennedy')) return 'Kennedy Half Dollar';
  if (s.includes('barber half')) return 'Barber Half Dollar';
  if (s.includes('liberty seated half')) return 'Liberty Seated Half Dollar';

  // Dollars
  if (s.includes('morgan')) return 'Morgan Dollar';
  if (s.includes('peace dollar')) return 'Peace Dollar';
  if (s.includes('eisenhower') || s.includes('ike dollar')) return 'Eisenhower Dollar';
  if (s.includes('susan b. anthony')) return 'Susan B. Anthony Dollar';
  if (s.includes('sacagawea') || s.includes('native american dollar')) return 'Sacagawea Dollar';
  if (s.includes('presidential')) return 'Presidential Dollar';
  if (s.includes('american innovation')) return 'American Innovation Dollar';

  // Gold
  if (s.includes('saint-gaudens') || s.includes('double eagle')) return 'Saint-Gaudens Double Eagle';
  if (s.includes('liberty head $20') || s.includes('coronet double eagle')) return 'Coronet Double Eagle';

  const cleaned = seriesName.replace(/\s*\([^)]*\)/g, '').trim();
  return cleaned || denomName || 'Coin Specimen';
}

function normalizeGradeString(gradeStr?: string | null): string {
  if (!gradeStr || !gradeStr.trim()) return '';
  const trimmed = gradeStr.trim().toUpperCase();
  const match = trimmed.match(/^([A-Z]{1,4})[\s-]?([0-9]{1,2})(\+)?/);
  if (match) {
    const prefix = match[1];
    const num = match[2];
    const plus = match[3] || '';
    return `${prefix} ${num}${plus}`;
  }
  if (trimmed.includes('UNCIRCULATED') || trimmed === 'UNC' || trimmed === 'BU') return 'MS 60';
  if (trimmed.includes('PROOF') || trimmed === 'PF') return 'PR 65';
  return trimmed;
}

// Compare coins of the same grade and same coin name category
router.get('/coins/compare', (req, res) => {
  try {
    const { grade, coin_name_category, series_id, exclude_coin_id } = req.query;

    if (!grade || !String(grade).trim()) {
      return res.status(400).json({ error: 'Grade is required for comparison' });
    }

    const targetGrade = normalizeGradeString(String(grade));
    let targetCategory = coin_name_category ? String(coin_name_category).trim() : '';

    if (!targetCategory && series_id) {
      const seriesRow = db.prepare('SELECT s.name, d.name as denom_name FROM coin_series s JOIN denominations d ON s.denomination_id = d.id WHERE s.id = ?').get(String(series_id)) as any;
      if (seriesRow) {
        targetCategory = mapSeriesToCoinCategory(seriesRow.name, seriesRow.denom_name);
      }
    }

    // Query all graded coins across the entire community database
    const rows = db.prepare(`
      SELECT ci.*, 
        iss.series_id, iss.year, iss.mint, iss.mint_mark, iss.issue_name, iss.composition, iss.weight_grams, iss.diameter_mm, iss.mintage, iss.display_order as issue_order,
        s.name as series_name, s.denomination_id,
        d.name as denomination_name, d.icon_label,
        u.username as owner_username, u.profile_photo as owner_photo, u.is_collection_private
      FROM collection_items ci
      JOIN coin_issues iss ON ci.issue_id = iss.id
      JOIN coin_series s ON iss.series_id = s.id
      JOIN denominations d ON s.denomination_id = d.id
      JOIN users u ON ci.owner_id = u.id
      WHERE ci.grade IS NOT NULL AND ci.grade != ''
      ORDER BY iss.year ASC, ci.created_at DESC
    `).all() as any[];

    // Filter strictly by same normalized grade and same coin name category
    const matching = rows.filter(item => {
      const itemGrade = normalizeGradeString(item.grade);
      const itemCategory = mapSeriesToCoinCategory(item.series_name, item.denomination_name);

      const gradeMatches = itemGrade === targetGrade;
      const categoryMatches = !targetCategory || itemCategory.toLowerCase() === targetCategory.toLowerCase();

      return gradeMatches && categoryMatches;
    });

    // Populate photos & category
    for (const item of matching) {
      const photos = db.prepare(`
        SELECT * FROM coin_photos WHERE collection_item_id = ? ORDER BY is_main DESC, display_order ASC
      `).all(item.id) as any[];
      item.photos = photos;
      if (!item.main_photo && photos.length > 0) {
        item.main_photo = photos[0].photo_url;
      }
      item.coin_name_category = mapSeriesToCoinCategory(item.series_name, item.denomination_name);
      item.normalized_grade = normalizeGradeString(item.grade);
    }

    res.json({
      target_grade: targetGrade,
      coin_name_category: targetCategory,
      total_count: matching.length,
      coins: matching
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add coin to collection
router.post('/collection/item', async (req, res) => {
  try {
    const {
      owner_id,
      issue_id,
      variety_id,
      variety_name,
      condition_type,
      tpg,
      grade,
      certification_number,
      main_photo,
      notes,
      photos // string[] of image URLs
    } = req.body;

    if (!owner_id || !issue_id || !condition_type) {
      return res.status(400).json({ error: 'Missing required fields: owner_id, issue_id, condition_type' });
    }

    const itemId = generateId('coin');
    const now = new Date().toISOString();

    // Default placeholder photo if none provided
    const primaryPhoto = main_photo || (photos && photos.length > 0 ? photos[0] : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80');

    db.prepare(`
      INSERT INTO collection_items (
        id, owner_id, issue_id, variety_id, variety_name,
        condition_type, tpg, grade, certification_number,
        main_photo, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      itemId,
      owner_id,
      issue_id,
      variety_id || null,
      variety_name || 'Normal Strike',
      condition_type,
      condition_type === 'graded' ? (tpg || null) : null,
      condition_type === 'graded' ? (grade || null) : null,
      condition_type === 'graded' ? (certification_number || null) : null,
      primaryPhoto,
      notes || null,
      now,
      now
    );

    // Save photos
    const insertPhotoStmt = db.prepare(`
      INSERT INTO coin_photos (id, collection_item_id, photo_url, is_main, display_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const photosList = photos && Array.isArray(photos) && photos.length > 0 ? photos : [primaryPhoto];
    let order = 0;
    for (const pUrl of photosList) {
      const isMain = pUrl === primaryPhoto ? 1 : 0;
      insertPhotoStmt.run(generateId('photo'), itemId, pUrl, isMain, order++, now);
    }

    // Return the full newly created item
    const newItem = db.prepare(`
      SELECT ci.*, 
        iss.series_id, iss.year, iss.mint, iss.issue_name,
        s.name as series_name, s.denomination_id,
        d.name as denomination_name
      FROM collection_items ci
      JOIN coin_issues iss ON ci.issue_id = iss.id
      JOIN coin_series s ON iss.series_id = s.id
      JOIN denominations d ON s.denomination_id = d.id
      WHERE ci.id = ?
    `).get(itemId) as any;

    newItem.photos = db.prepare(`SELECT * FROM coin_photos WHERE collection_item_id = ? ORDER BY is_main DESC, display_order ASC`).all(itemId);

    // Facebook Automation Trigger (Additive & Non-blocking)
    let fbResult = { status: 'opt_out', message: 'No action' };
    try {
      fbResult = await FacebookAutomationManager.onCoinAdded(itemId, owner_id);
    } catch (fbErr: any) {
      console.error('Facebook automation non-blocking error:', fbErr);
    }
    newItem.facebook_status = fbResult.status;
    newItem.facebook_message = fbResult.message;

    res.status(201).json(newItem);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update coin in collection
router.put('/collection/item/:id', (req, res) => {
  try {
    const itemId = req.params.id;
    const {
      variety_id,
      variety_name,
      condition_type,
      tpg,
      grade,
      certification_number,
      main_photo,
      notes,
      photos
    } = req.body;

    const existing = db.prepare(`SELECT * FROM collection_items WHERE id = ?`).get(itemId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Coin not found' });
    }

    const now = new Date().toISOString();
    const primaryPhoto = main_photo || existing.main_photo;

    db.prepare(`
      UPDATE collection_items SET
        variety_id = ?,
        variety_name = ?,
        condition_type = ?,
        tpg = ?,
        grade = ?,
        certification_number = ?,
        main_photo = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      variety_id !== undefined ? variety_id : existing.variety_id,
      variety_name !== undefined ? variety_name : existing.variety_name,
      condition_type || existing.condition_type,
      condition_type === 'graded' ? (tpg !== undefined ? tpg : existing.tpg) : null,
      condition_type === 'graded' ? (grade !== undefined ? grade : existing.grade) : null,
      condition_type === 'graded' ? (certification_number !== undefined ? certification_number : existing.certification_number) : null,
      primaryPhoto,
      notes !== undefined ? notes : existing.notes,
      now,
      itemId
    );

    // If photos array provided, update photos table
    if (photos && Array.isArray(photos)) {
      db.prepare(`DELETE FROM coin_photos WHERE collection_item_id = ?`).run(itemId);
      const insertPhotoStmt = db.prepare(`
        INSERT INTO coin_photos (id, collection_item_id, photo_url, is_main, display_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      let order = 0;
      for (const pUrl of photos) {
        const isMain = pUrl === primaryPhoto ? 1 : 0;
        insertPhotoStmt.run(generateId('photo'), itemId, pUrl, isMain, order++, now);
      }
    }

    const updated = db.prepare(`
      SELECT ci.*, 
        iss.series_id, iss.year, iss.mint, iss.issue_name,
        s.name as series_name, s.denomination_id,
        d.name as denomination_name
      FROM collection_items ci
      JOIN coin_issues iss ON ci.issue_id = iss.id
      JOIN coin_series s ON iss.series_id = s.id
      JOIN denominations d ON s.denomination_id = d.id
      WHERE ci.id = ?
    `).get(itemId) as any;

    updated.photos = db.prepare(`SELECT * FROM coin_photos WHERE collection_item_id = ? ORDER BY is_main DESC, display_order ASC`).all(itemId);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete coin from collection
router.delete('/collection/item/:id', (req, res) => {
  try {
    const itemId = req.params.id;
    db.prepare(`DELETE FROM coin_photos WHERE collection_item_id = ?`).run(itemId);
    const result = db.prepare(`DELETE FROM collection_items WHERE id = ?`).run(itemId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Coin not found' });
    }
    res.json({ success: true, message: 'Coin removed from collection' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= BULLION / BARS ================= //

// Get bullion items
router.get('/bullion', (req, res) => {
  try {
    const ownerId = req.query.owner_id;
    const material = req.query.material;

    if (!ownerId) {
      return res.status(400).json({ error: 'owner_id is required' });
    }

    let query = `SELECT * FROM bullion_items WHERE owner_id = ?`;
    let rows: any[];
    if (material && material !== 'All') {
      query += ` AND material = ? ORDER BY created_at DESC`;
      rows = db.prepare(query).all(String(ownerId), String(material));
    } else {
      query += ` ORDER BY created_at DESC`;
      rows = db.prepare(query).all(String(ownerId));
    }

    const parsed = rows.map(r => ({
      ...r,
      photos: JSON.parse(r.photos_json || '[]')
    }));

    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create bullion item
router.post('/bullion', (req, res) => {
  try {
    const { owner_id, material, label, weight_oz, fineness, notes, main_photo, photos } = req.body;
    if (!owner_id || !material || !label) {
      return res.status(400).json({ error: 'Missing required fields: owner_id, material, label' });
    }

    const id = generateId('bullion');
    const now = new Date().toISOString();
    const photosArr = photos && Array.isArray(photos) && photos.length > 0 ? photos : (main_photo ? [main_photo] : []);
    const primaryPhoto = main_photo || (photosArr.length > 0 ? photosArr[0] : 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&auto=format&fit=crop&q=80');

    db.prepare(`
      INSERT INTO bullion_items (id, owner_id, material, label, weight_oz, fineness, notes, main_photo, photos_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, owner_id, material, label, weight_oz || null, fineness || null, notes || null, primaryPhoto, JSON.stringify(photosArr), now, now);

    const created = db.prepare(`SELECT * FROM bullion_items WHERE id = ?`).get(id) as any;
    created.photos = JSON.parse(created.photos_json || '[]');
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update bullion item
router.put('/bullion/:id', (req, res) => {
  try {
    const id = req.params.id;
    const { material, label, weight_oz, fineness, notes, main_photo, photos } = req.body;

    const existing = db.prepare(`SELECT * FROM bullion_items WHERE id = ?`).get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Bullion item not found' });
    }

    const now = new Date().toISOString();
    const photosArr = photos && Array.isArray(photos) ? photos : JSON.parse(existing.photos_json || '[]');
    const primaryPhoto = main_photo || existing.main_photo;

    db.prepare(`
      UPDATE bullion_items SET
        material = ?,
        label = ?,
        weight_oz = ?,
        fineness = ?,
        notes = ?,
        main_photo = ?,
        photos_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      material || existing.material,
      label || existing.label,
      weight_oz !== undefined ? weight_oz : existing.weight_oz,
      fineness !== undefined ? fineness : existing.fineness,
      notes !== undefined ? notes : existing.notes,
      primaryPhoto,
      JSON.stringify(photosArr),
      now,
      id
    );

    const updated = db.prepare(`SELECT * FROM bullion_items WHERE id = ?`).get(id) as any;
    updated.photos = JSON.parse(updated.photos_json || '[]');
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete bullion item
router.delete('/bullion/:id', (req, res) => {
  try {
    const id = req.params.id;
    const result = db.prepare(`DELETE FROM bullion_items WHERE id = ?`).run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Bullion item not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= COLONIALS / PATTERNS / TERRITORIALS ================= //

// Get colonials/patterns
router.get('/colonials', (req, res) => {
  try {
    const ownerId = req.query.owner_id;
    const category = req.query.category; // 'Colonials', 'Territorial', 'Patterns'
    const subcategory = req.query.subcategory;

    if (!ownerId) {
      return res.status(400).json({ error: 'owner_id is required' });
    }

    let query = `SELECT * FROM colonial_pattern_items WHERE owner_id = ?`;
    const params: any[] = [String(ownerId)];

    if (category) {
      query += ` AND category = ?`;
      params.push(String(category));
    }
    if (subcategory) {
      query += ` AND subcategory = ?`;
      params.push(String(subcategory));
    }
    query += ` ORDER BY created_at DESC`;

    const rows = db.prepare(query).all(...params) as any[];
    const parsed = rows.map(r => ({
      ...r,
      photos: JSON.parse(r.photos_json || '[]')
    }));

    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create colonial/pattern item
router.post('/colonials', (req, res) => {
  try {
    const { owner_id, category, subcategory, name, year, grade_type, tpg, grade, notes, main_photo, photos } = req.body;
    if (!owner_id || !category || !subcategory || !name) {
      return res.status(400).json({ error: 'Missing required fields: owner_id, category, subcategory, name' });
    }

    const id = generateId('col');
    const now = new Date().toISOString();
    const photosArr = photos && Array.isArray(photos) && photos.length > 0 ? photos : (main_photo ? [main_photo] : []);
    const primaryPhoto = main_photo || (photosArr.length > 0 ? photosArr[0] : 'https://images.unsplash.com/photo-1621981386829-9b458a21ddde?w=400&auto=format&fit=crop&q=80');

    db.prepare(`
      INSERT INTO colonial_pattern_items (
        id, owner_id, category, subcategory, name, year, grade_type, tpg, grade, notes, main_photo, photos_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      owner_id,
      category,
      subcategory,
      name,
      year || null,
      grade_type || 'raw',
      grade_type === 'graded' ? (tpg || null) : null,
      grade_type === 'graded' ? (grade || null) : null,
      notes || null,
      primaryPhoto,
      JSON.stringify(photosArr),
      now,
      now
    );

    const created = db.prepare(`SELECT * FROM colonial_pattern_items WHERE id = ?`).get(id) as any;
    created.photos = JSON.parse(created.photos_json || '[]');
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update colonial/pattern item
router.put('/colonials/:id', (req, res) => {
  try {
    const id = req.params.id;
    const { category, subcategory, name, year, grade_type, tpg, grade, notes, main_photo, photos } = req.body;

    const existing = db.prepare(`SELECT * FROM colonial_pattern_items WHERE id = ?`).get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const now = new Date().toISOString();
    const photosArr = photos && Array.isArray(photos) ? photos : JSON.parse(existing.photos_json || '[]');
    const primaryPhoto = main_photo || existing.main_photo;

    db.prepare(`
      UPDATE colonial_pattern_items SET
        category = ?,
        subcategory = ?,
        name = ?,
        year = ?,
        grade_type = ?,
        tpg = ?,
        grade = ?,
        notes = ?,
        main_photo = ?,
        photos_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      category || existing.category,
      subcategory || existing.subcategory,
      name || existing.name,
      year !== undefined ? year : existing.year,
      grade_type || existing.grade_type,
      grade_type === 'graded' ? (tpg !== undefined ? tpg : existing.tpg) : null,
      grade_type === 'graded' ? (grade !== undefined ? grade : existing.grade) : null,
      notes !== undefined ? notes : existing.notes,
      primaryPhoto,
      JSON.stringify(photosArr),
      now,
      id
    );

    const updated = db.prepare(`SELECT * FROM colonial_pattern_items WHERE id = ?`).get(id) as any;
    updated.photos = JSON.parse(updated.photos_json || '[]');
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete colonial/pattern item
router.delete('/colonials/:id', (req, res) => {
  try {
    const id = req.params.id;
    const result = db.prepare(`DELETE FROM colonial_pattern_items WHERE id = ?`).run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to compute weekly window: Sunday 12:00:00 AM to Saturday 11:59:59 PM
function getWeeklyVoteWindow() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startFormatted: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    endFormatted: end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  };
}

// ================= SOCIAL: FRIENDS & VOTES ================= //

// Get friends for user
router.get('/friends', (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const rows = db.prepare(`
      SELECT f.id as friendship_id, f.created_at,
        u.id, u.username, u.profile_photo, u.about_me,
        (SELECT COUNT(*) FROM collection_items WHERE owner_id = u.id) as coins_count,
        (SELECT COUNT(*) FROM collection_votes WHERE target_user_id = u.id) as total_votes
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ?
      ORDER BY u.username ASC
    `).all(String(userId));

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get friend requests (both received and sent)
router.get('/friend-requests', (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const received = db.prepare(`
      SELECT fr.id, fr.sender_id, fr.receiver_id, fr.status, fr.created_at,
        u.username as sender_username, u.profile_photo as sender_photo, u.about_me as sender_about_me,
        (SELECT COUNT(*) FROM collection_items WHERE owner_id = u.id) as sender_coins_count,
        (SELECT COUNT(*) FROM collection_votes WHERE target_user_id = u.id) as sender_votes
      FROM friend_requests fr
      JOIN users u ON fr.sender_id = u.id
      WHERE fr.receiver_id = ? AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `).all(String(userId));

    const sent = db.prepare(`
      SELECT fr.id, fr.sender_id, fr.receiver_id, fr.status, fr.created_at,
        u.username as receiver_username, u.profile_photo as receiver_photo, u.about_me as receiver_about_me,
        (SELECT COUNT(*) FROM collection_items WHERE owner_id = u.id) as receiver_coins_count,
        (SELECT COUNT(*) FROM collection_votes WHERE target_user_id = u.id) as receiver_votes
      FROM friend_requests fr
      JOIN users u ON fr.receiver_id = u.id
      WHERE fr.sender_id = ? AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `).all(String(userId));

    res.json({ received, sent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send friend request
router.post('/friend-requests', (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;
    if (!sender_id || !receiver_id) {
      return res.status(400).json({ error: 'sender_id and receiver_id are required' });
    }
    if (sender_id === receiver_id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if already friends
    const alreadyFriend = db.prepare(`SELECT 1 FROM friendships WHERE user_id = ? AND friend_id = ?`).get(sender_id, receiver_id);
    if (alreadyFriend) {
      return res.json({ success: true, status: 'already_friends', message: 'You are already friends!' });
    }

    // Check if receiver already sent a pending request to sender (cross-request)
    const incomingReq = db.prepare(`SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'`).get(receiver_id, sender_id) as any;
    if (incomingReq) {
      const now = new Date().toISOString();
      db.prepare(`UPDATE friend_requests SET status = 'accepted', updated_at = ? WHERE id = ?`).run(now, incomingReq.id);
      db.prepare(`INSERT OR IGNORE INTO friendships (id, user_id, friend_id, created_at) VALUES (?, ?, ?, ?)`).run(generateId('f'), sender_id, receiver_id, now);
      db.prepare(`INSERT OR IGNORE INTO friendships (id, user_id, friend_id, created_at) VALUES (?, ?, ?, ?)`).run(generateId('f'), receiver_id, sender_id, now);
      return res.json({ success: true, status: 'accepted', message: 'You are now friends!' });
    }

    // Check if already sent pending
    const existing = db.prepare(`SELECT id, status FROM friend_requests WHERE sender_id = ? AND receiver_id = ?`).get(sender_id, receiver_id) as any;
    if (existing) {
      if (existing.status === 'pending') {
        return res.json({ success: true, status: 'pending', message: 'Friend request already sent' });
      } else {
        // re-activate if declined previously
        const now = new Date().toISOString();
        db.prepare(`UPDATE friend_requests SET status = 'pending', updated_at = ? WHERE id = ?`).run(now, existing.id);
        return res.json({ success: true, status: 'pending', message: 'Friend request sent!' });
      }
    }

    const reqId = generateId('req');
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO friend_requests (id, sender_id, receiver_id, status, created_at, updated_at) VALUES (?, ?, ?, 'pending', ?, ?)`).run(reqId, sender_id, receiver_id, now, now);

    res.json({ success: true, status: 'pending', message: 'Friend request sent!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Accept or Deny friend request
router.post('/friend-requests/:id/respond', (req, res) => {
  try {
    const { user_id, action } = req.body; // action: 'accept' | 'deny'
    const reqId = req.params.id;

    if (!user_id || !action || !['accept', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'user_id and valid action (accept or deny) required' });
    }

    const requestItem = db.prepare(`SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ?`).get(reqId, user_id) as any;
    if (!requestItem) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const now = new Date().toISOString();
    if (action === 'accept') {
      db.prepare(`UPDATE friend_requests SET status = 'accepted', updated_at = ? WHERE id = ?`).run(now, reqId);
      db.prepare(`INSERT OR IGNORE INTO friendships (id, user_id, friend_id, created_at) VALUES (?, ?, ?, ?)`).run(generateId('f'), requestItem.sender_id, requestItem.receiver_id, now);
      db.prepare(`INSERT OR IGNORE INTO friendships (id, user_id, friend_id, created_at) VALUES (?, ?, ?, ?)`).run(generateId('f'), requestItem.receiver_id, requestItem.sender_id, now);
      return res.json({ success: true, status: 'accepted', message: 'Friend request accepted!' });
    } else {
      db.prepare(`UPDATE friend_requests SET status = 'declined', updated_at = ? WHERE id = ?`).run(now, reqId);
      return res.json({ success: true, status: 'declined', message: 'Friend request denied' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel sent friend request
router.delete('/friend-requests/:id', (req, res) => {
  try {
    const reqId = req.params.id;
    const { user_id } = req.body;

    if (user_id) {
      db.prepare(`DELETE FROM friend_requests WHERE id = ? AND sender_id = ?`).run(reqId, user_id);
    } else {
      db.prepare(`DELETE FROM friend_requests WHERE id = ?`).run(reqId);
    }

    res.json({ success: true, message: 'Friend request cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add friend (direct or legacy)
router.post('/friends', (req, res) => {
  try {
    const { user_id, friend_id } = req.body;
    if (!user_id || !friend_id) {
      return res.status(400).json({ error: 'user_id and friend_id are required' });
    }
    if (user_id === friend_id) {
      return res.status(400).json({ error: 'Cannot friend yourself' });
    }

    const fid = generateId('f');
    const now = new Date().toISOString();

    db.prepare(`INSERT OR IGNORE INTO friendships (id, user_id, friend_id, created_at) VALUES (?, ?, ?, ?)`).run(fid, user_id, friend_id, now);
    db.prepare(`INSERT OR IGNORE INTO friendships (id, user_id, friend_id, created_at) VALUES (?, ?, ?, ?)`).run(generateId('f'), friend_id, user_id, now);

    // Clean up any pending friend requests
    db.prepare(`UPDATE friend_requests SET status = 'accepted', updated_at = ? WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`).run(now, user_id, friend_id, friend_id, user_id);

    res.json({ success: true, message: 'Friend added!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove friend (with confirmation from UI)
router.delete('/friends', (req, res) => {
  try {
    const { user_id, friend_id } = req.body;
    if (!user_id || !friend_id) {
      return res.status(400).json({ error: 'user_id and friend_id are required' });
    }

    db.prepare(`DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`).run(user_id, friend_id, friend_id, user_id);
    // Also remove requests so they can request again
    db.prepare(`DELETE FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`).run(user_id, friend_id, friend_id, user_id);

    res.json({ success: true, message: 'Friend removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vote for user's collection (toggle vote)
router.post('/votes', (req, res) => {
  try {
    const { voter_id, target_user_id } = req.body;
    if (!voter_id || !target_user_id) {
      return res.status(400).json({ error: 'voter_id and target_user_id are required' });
    }
    if (voter_id === target_user_id) {
      return res.status(400).json({ error: 'You cannot vote for your own collection' });
    }

    const existing = db.prepare(`SELECT id FROM collection_votes WHERE voter_id = ? AND target_user_id = ?`).get(voter_id, target_user_id) as any;

    let voted = false;
    if (existing) {
      db.prepare(`DELETE FROM collection_votes WHERE id = ?`).run(existing.id);
      voted = false;
    } else {
      const vid = generateId('v');
      db.prepare(`INSERT INTO collection_votes (id, voter_id, target_user_id, created_at) VALUES (?, ?, ?, ?)`).run(vid, voter_id, target_user_id, new Date().toISOString());
      voted = true;
    }

    const countRes = db.prepare(`SELECT COUNT(*) as count FROM collection_votes WHERE target_user_id = ?`).get(target_user_id) as { count: number };

    // Get weekly count too
    const weeklyWindow = getWeeklyVoteWindow();
    const weeklyRes = db.prepare(`SELECT COUNT(*) as count FROM collection_votes WHERE target_user_id = ? AND created_at >= ? AND created_at <= ?`).get(target_user_id, weeklyWindow.startIso, weeklyWindow.endIso) as { count: number };

    res.json({ success: true, voted, total_votes: countRes.count, weekly_votes: weeklyRes.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Leaderboards
router.get('/leaderboards', (req, res) => {
  try {
    const sortBy = req.query.sort || 'votes'; // 'weekly_votes', 'votes', 'coins', 'graded', 'score'
    const currentUserId = req.query.current_user_id ? String(req.query.current_user_id) : '';

    const weeklyWindow = getWeeklyVoteWindow();

    let query = `
      SELECT u.id, u.username, u.profile_photo, u.about_me,
        (SELECT COUNT(*) FROM collection_votes WHERE target_user_id = u.id) as total_votes,
        (SELECT COUNT(*) FROM collection_votes WHERE target_user_id = u.id AND created_at >= ? AND created_at <= ?) as weekly_votes,
        (SELECT COUNT(*) FROM collection_items WHERE owner_id = u.id) as coins_count,
        (SELECT COUNT(*) FROM collection_items WHERE owner_id = u.id AND condition_type = 'graded') as graded_count,
        (SELECT COUNT(*) FROM bullion_items WHERE owner_id = u.id) as bullion_count,
        (SELECT COUNT(*) FROM colonial_pattern_items WHERE owner_id = u.id) as colonials_count
    `;

    if (currentUserId) {
      query += `,
        EXISTS(SELECT 1 FROM collection_votes WHERE voter_id = ? AND target_user_id = u.id) as has_voted,
        EXISTS(SELECT 1 FROM friendships WHERE user_id = ? AND friend_id = u.id) as is_friend
      `;
    }

    query += ` FROM users u `;

    let rows: any[];
    if (currentUserId) {
      rows = db.prepare(query).all(weeklyWindow.startIso, weeklyWindow.endIso, currentUserId, currentUserId) as any[];
    } else {
      rows = db.prepare(query).all(weeklyWindow.startIso, weeklyWindow.endIso) as any[];
    }

    // Calculate dynamic collector score
    const withScore = rows.map(r => ({
      ...r,
      score: (r.coins_count * 10) + (r.graded_count * 15) + (r.bullion_count * 8) + (r.colonials_count * 12) + (r.total_votes * 25)
    }));

    if (sortBy === 'weekly_votes') {
      withScore.sort((a, b) => b.weekly_votes - a.weekly_votes || b.total_votes - a.total_votes || b.score - a.score);
    } else if (sortBy === 'coins') {
      withScore.sort((a, b) => b.coins_count - a.coins_count || b.score - a.score);
    } else if (sortBy === 'graded') {
      withScore.sort((a, b) => b.graded_count - a.graded_count || b.score - a.score);
    } else if (sortBy === 'score') {
      withScore.sort((a, b) => b.score - a.score);
    } else {
      // default: votes
      withScore.sort((a, b) => b.total_votes - a.total_votes || b.weekly_votes - a.weekly_votes || b.score - a.score);
    }

    res.json({
      users: withScore,
      weekly_window: {
        start_formatted: weeklyWindow.startFormatted,
        end_formatted: weeklyWindow.endFormatted,
        start_iso: weeklyWindow.startIso,
        end_iso: weeklyWindow.endIso
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= CHAT & GROUP MESSAGING ================= //

// Spam tracking & Profanity filtering helpers
const userLastMessageTime = new Map<string, number>();
const userLastMessageContent = new Map<string, { text: string; time: number }>();

const PROFANITY_WORDS = [
  'fuck', 'fucking', 'fucked', 'shit', 'shitty', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut'
];

function sanitizeProfanity(text: string): string {
  let result = text;
  for (const word of PROFANITY_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, (match) => match[0] + '*'.repeat(Math.max(1, match.length - 1)));
  }
  return result;
}

function checkSpam(userId: string, content: string): { isSpam: boolean; reason?: string } {
  const now = Date.now();
  const lastTime = userLastMessageTime.get(userId) || 0;
  if (now - lastTime < 1200) {
    return { isSpam: true, reason: 'Spam prevention: Please wait a moment before sending another message.' };
  }

  const lastMsg = userLastMessageContent.get(userId);
  if (lastMsg && lastMsg.text.toLowerCase() === content.trim().toLowerCase() && (now - lastMsg.time < 15000)) {
    return { isSpam: true, reason: 'Spam prevention: Duplicate message detected. Please wait before repeating.' };
  }

  userLastMessageTime.set(userId, now);
  userLastMessageContent.set(userId, { text: content.trim(), time: now });
  return { isSpam: false };
}

// 1. Get chat groups for a user
router.get('/chat/groups', (req, res) => {
  try {
    const userId = req.query.user_id ? String(req.query.user_id) : '';
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const groups = db.prepare(`
      SELECT g.*,
        cgm.role as user_role,
        (cgm.role = 'leader' OR g.leader_id = ?) as is_leader,
        (SELECT COUNT(*) FROM chat_group_members WHERE group_id = g.id) as members_count,
        (SELECT COUNT(*) FROM chat_group_requests WHERE group_id = g.id AND status = 'pending') as pending_requests_count,
        (SELECT content FROM chat_messages WHERE channel_id = ('group:' || g.id) ORDER BY created_at DESC LIMIT 1) as last_message_content,
        (SELECT created_at FROM chat_messages WHERE channel_id = ('group:' || g.id) ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM chat_groups g
      JOIN chat_group_members cgm ON g.id = cgm.group_id
      WHERE cgm.user_id = ?
      ORDER BY g.created_at ASC
    `).all(userId, userId);

    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Discover / Search groups to join
router.get('/chat/groups/discover', (req, res) => {
  try {
    const userId = req.query.user_id ? String(req.query.user_id) : '';
    const query = req.query.query ? String(req.query.query).trim().toLowerCase() : '';

    let sql = `
      SELECT g.*,
        u.username as leader_username,
        u.profile_photo as leader_photo,
        (SELECT COUNT(*) FROM chat_group_members WHERE group_id = g.id) as members_count
    `;

    if (userId) {
      sql += `,
        EXISTS(SELECT 1 FROM chat_group_members WHERE group_id = g.id AND user_id = ?) as is_member,
        EXISTS(SELECT 1 FROM chat_group_requests WHERE group_id = g.id AND user_id = ? AND status = 'pending') as has_pending_request
      `;
    }

    sql += `
      FROM chat_groups g
      JOIN users u ON g.leader_id = u.id
    `;

    let rows: any[];
    if (query) {
      sql += ` WHERE LOWER(g.name) LIKE ? ORDER BY g.name ASC LIMIT 50`;
      const searchParam = `%${query}%`;
      if (userId) {
        rows = db.prepare(sql).all(userId, userId, searchParam);
      } else {
        rows = db.prepare(sql).all(searchParam);
      }
    } else {
      sql += ` WHERE (g.is_public = 1 OR g.is_public IS NULL) ORDER BY members_count DESC, g.name ASC LIMIT 50`;
      if (userId) {
        rows = db.prepare(sql).all(userId, userId);
      } else {
        rows = db.prepare(sql).all();
      }
    }

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get single group detail
router.get('/chat/groups/:id', (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.query.user_id ? String(req.query.user_id) : '';

    const group = db.prepare(`
      SELECT g.*,
        u.username as leader_username,
        u.profile_photo as leader_photo,
        (SELECT COUNT(*) FROM chat_group_members WHERE group_id = g.id) as members_count
      FROM chat_groups g
      JOIN users u ON g.leader_id = u.id
      WHERE g.id = ?
    `).get(groupId) as any;

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (userId) {
      const membership = db.prepare(`
        SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ?
      `).get(groupId, userId) as any;

      group.is_member = !!membership;
      group.user_role = membership ? membership.role : null;
      group.is_leader = membership ? membership.role === 'leader' || group.leader_id === userId : false;

      const pendingReq = db.prepare(`
        SELECT id FROM chat_group_requests WHERE group_id = ? AND user_id = ? AND status = 'pending'
      `).get(groupId, userId) as any;
      group.has_pending_request = !!pendingReq;
    }

    res.json(group);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Create a new group
router.post('/chat/groups', (req, res) => {
  try {
    const {
      name,
      description,
      icon_url,
      rules,
      leader_id,
      profanity_filter = 1,
      spam_filter = 1,
      allow_pictures = 1,
      allow_member_invites = 1,
      chat_color = 'amber',
      is_public = 1
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group Name is required' });
    }
    if (!leader_id) {
      return res.status(400).json({ error: 'Leader ID is required' });
    }

    const trimmedName = name.trim();

    // Check unique name
    const existing = db.prepare(`SELECT id FROM chat_groups WHERE LOWER(name) = LOWER(?)`).get(trimmedName) as any;
    if (existing) {
      return res.status(400).json({ error: 'A group with this name already exists. Please choose a unique name.' });
    }

    const groupId = generateId('group');
    const now = new Date().toISOString();
    const primaryIcon = (icon_url && icon_url.trim()) ? icon_url.trim() : '🪙';

    db.prepare(`
      INSERT INTO chat_groups (
        id, name, description, icon_url, rules, leader_id,
        profanity_filter, spam_filter, allow_pictures, allow_member_invites,
        chat_color, is_public, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      groupId,
      trimmedName,
      description ? description.trim() : null,
      primaryIcon,
      rules ? rules.trim() : null,
      leader_id,
      profanity_filter ? 1 : 0,
      spam_filter ? 1 : 0,
      allow_pictures ? 1 : 0,
      allow_member_invites ? 1 : 0,
      chat_color || 'amber',
      is_public !== undefined ? (is_public ? 1 : 0) : 1,
      now,
      now
    );

    // Automatically add leader to members table with role 'leader'
    const memberId = generateId('cgm');
    db.prepare(`
      INSERT INTO chat_group_members (id, group_id, user_id, role, joined_at)
      VALUES (?, ?, ?, 'leader', ?)
    `).run(memberId, groupId, leader_id, now);

    const created = db.prepare(`
      SELECT g.*, 1 as is_leader, 'leader' as user_role, 1 as members_count
      FROM chat_groups g
      WHERE g.id = ?
    `).get(groupId);

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Update group (Leader only!)
router.put('/chat/groups/:id', (req, res) => {
  try {
    const groupId = req.params.id;
    const {
      user_id,
      name,
      description,
      icon_url,
      rules,
      profanity_filter,
      spam_filter,
      allow_pictures,
      allow_member_invites,
      chat_color,
      is_public
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId) as any;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Leader check
    if (group.leader_id !== user_id) {
      return res.status(403).json({ error: 'Only the Group Leader can edit group settings.' });
    }

    // Name uniqueness check if changing name
    if (name && name.trim() && name.trim().toLowerCase() !== group.name.toLowerCase()) {
      const duplicate = db.prepare(`SELECT id FROM chat_groups WHERE LOWER(name) = LOWER(?) AND id != ?`).get(name.trim(), groupId);
      if (duplicate) {
        return res.status(400).json({ error: 'A group with that name already exists.' });
      }
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE chat_groups SET
        name = ?,
        description = ?,
        icon_url = ?,
        rules = ?,
        profanity_filter = ?,
        spam_filter = ?,
        allow_pictures = ?,
        allow_member_invites = ?,
        chat_color = ?,
        is_public = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : group.name,
      description !== undefined ? description.trim() : group.description,
      icon_url !== undefined ? icon_url.trim() : group.icon_url,
      rules !== undefined ? rules.trim() : group.rules,
      profanity_filter !== undefined ? (profanity_filter ? 1 : 0) : group.profanity_filter,
      spam_filter !== undefined ? (spam_filter ? 1 : 0) : group.spam_filter,
      allow_pictures !== undefined ? (allow_pictures ? 1 : 0) : group.allow_pictures,
      allow_member_invites !== undefined ? (allow_member_invites ? 1 : 0) : group.allow_member_invites,
      chat_color !== undefined ? chat_color : group.chat_color,
      is_public !== undefined ? (is_public ? 1 : 0) : (group.is_public !== undefined ? group.is_public : 1),
      now,
      groupId
    );

    const updated = db.prepare(`
      SELECT g.*, 1 as is_leader, 'leader' as user_role,
        (SELECT COUNT(*) FROM chat_group_members WHERE group_id = g.id) as members_count
      FROM chat_groups g
      WHERE g.id = ?
    `).get(groupId);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get group members list
router.get('/chat/groups/:id/members', (req, res) => {
  try {
    const groupId = req.params.id;
    const members = db.prepare(`
      SELECT cgm.id as membership_id, cgm.role, cgm.joined_at,
        u.id as user_id, u.username, u.profile_photo, u.about_me
      FROM chat_group_members cgm
      JOIN users u ON cgm.user_id = u.id
      WHERE cgm.group_id = ?
      ORDER BY CASE WHEN cgm.role = 'leader' THEN 0 ELSE 1 END, u.username ASC
    `).all(groupId);

    res.json(members);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Remove member (Leader only!)
router.post('/chat/groups/:id/members/:memberId/remove', (req, res) => {
  try {
    const groupId = req.params.id;
    const memberId = req.params.memberId;
    const { user_id } = req.body; // actor

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId) as any;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.leader_id !== user_id) {
      return res.status(403).json({ error: 'Only the Group Leader can remove members.' });
    }

    if (memberId === user_id) {
      return res.status(400).json({ error: 'The Group Leader cannot remove themselves. Use Leave Group if transferring.' });
    }

    const deleted = db.prepare(`DELETE FROM chat_group_members WHERE group_id = ? AND user_id = ?`).run(groupId, memberId);
    if (deleted.changes === 0) {
      return res.status(404).json({ error: 'Member not found in this group.' });
    }

    // Send notification to the removed member
    const notifId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at)
      VALUES (?, ?, 'removed_from_group', 'Removed from Group', ?, ?, 0, ?)
    `).run(
      notifId,
      memberId,
      `You were removed from "${group.name}" by the Group Leader.`,
      JSON.stringify({ group_id: groupId, group_name: group.name }),
      new Date().toISOString()
    );

    res.json({ success: true, message: 'Member successfully removed.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Leave group (Member)
router.post('/chat/groups/:id/leave', (req, res) => {
  try {
    const groupId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId) as any;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const membership = db.prepare(`SELECT * FROM chat_group_members WHERE group_id = ? AND user_id = ?`).get(groupId, user_id) as any;
    if (!membership) {
      return res.status(404).json({ error: 'You are not a member of this group.' });
    }

    // If leader leaves:
    if (group.leader_id === user_id) {
      const nextMember = db.prepare(`
        SELECT user_id FROM chat_group_members
        WHERE group_id = ? AND user_id != ?
        ORDER BY joined_at ASC LIMIT 1
      `).get(groupId, user_id) as any;

      if (nextMember) {
        // Transfer leadership to next member
        db.prepare(`UPDATE chat_groups SET leader_id = ? WHERE id = ?`).run(nextMember.user_id, groupId);
        db.prepare(`UPDATE chat_group_members SET role = 'leader' WHERE group_id = ? AND user_id = ?`).run(groupId, nextMember.user_id);
      }
    }

    db.prepare(`DELETE FROM chat_group_members WHERE group_id = ? AND user_id = ?`).run(groupId, user_id);

    res.json({ success: true, message: 'You have left the group.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8b. Direct Join a Public Group
router.post('/chat/groups/:id/join', (req, res) => {
  try {
    const groupId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId) as any;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check membership
    const existingMember = db.prepare(`SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ?`).get(groupId, user_id);
    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this group.' });
    }

    if (group.is_public === 0) {
      return res.status(403).json({
        error: 'This group is private. Private groups require an invitation from a member or a join request accepted by the group leader.',
        requires_request: true
      });
    }

    const now = new Date().toISOString();
    const memberId = generateId('cgm');
    db.prepare(`
      INSERT INTO chat_group_members (id, group_id, user_id, role, joined_at)
      VALUES (?, ?, ?, 'member', ?)
    `).run(memberId, groupId, user_id, now);

    // Clean up any pending join requests or invitations
    db.prepare(`DELETE FROM chat_group_requests WHERE group_id = ? AND user_id = ?`).run(groupId, user_id);
    db.prepare(`DELETE FROM chat_group_invitations WHERE group_id = ? AND invited_user_id = ?`).run(groupId, user_id);

    res.status(201).json({ success: true, message: `Successfully joined "${group.name}"!` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Request to join a group
router.post('/chat/groups/:id/join-request', (req, res) => {
  try {
    const groupId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId) as any;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if already a member
    const existingMember = db.prepare(`SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ?`).get(groupId, user_id);
    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this group.' });
    }

    // Check existing pending request
    const existingReq = db.prepare(`SELECT id, status FROM chat_group_requests WHERE group_id = ? AND user_id = ?`).get(groupId, user_id) as any;
    if (existingReq && existingReq.status === 'pending') {
      return res.status(400).json({ error: 'You already have a pending join request for this group.' });
    }

    const now = new Date().toISOString();
    const reqId = existingReq ? existingReq.id : generateId('req_grp');

    if (existingReq) {
      db.prepare(`UPDATE chat_group_requests SET status = 'pending', updated_at = ? WHERE id = ?`).run(now, reqId);
    } else {
      db.prepare(`
        INSERT INTO chat_group_requests (id, group_id, user_id, status, created_at, updated_at)
        VALUES (?, ?, ?, 'pending', ?, ?)
      `).run(reqId, groupId, user_id, now, now);
    }

    // Notify Group Leader
    const requestingUser = db.prepare(`SELECT username FROM users WHERE id = ?`).get(user_id) as any;
    const notifId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at)
      VALUES (?, ?, 'join_request', 'Group Join Request', ?, ?, 0, ?)
    `).run(
      notifId,
      group.leader_id,
      `${requestingUser ? requestingUser.username : 'A user'} requested to join "${group.name}".`,
      JSON.stringify({ group_id: groupId, request_id: reqId, user_id }),
      now
    );

    res.status(201).json({ success: true, status: 'pending', message: 'Join request sent to the Group Leader.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Get pending join requests for a group (Leader only!)
router.get('/chat/groups/:id/requests', (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.query.user_id ? String(req.query.user_id) : '';

    const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId) as any;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.leader_id !== userId) {
      return res.status(403).json({ error: 'Only the Group Leader can view join requests.' });
    }

    const requests = db.prepare(`
      SELECT r.id as request_id, r.status, r.created_at,
        u.id as user_id, u.username, u.profile_photo, u.about_me
      FROM chat_group_requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.group_id = ? AND r.status = 'pending'
      ORDER BY r.created_at ASC
    `).all(groupId);

    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Respond to join request (Leader only!)
router.post('/chat/groups/:id/requests/:requestId/respond', (req, res) => {
  try {
    const groupId = req.params.id;
    const requestId = req.params.requestId;
    const { user_id, action } = req.body; // action: 'accept' | 'deny'

    if (!user_id || !action || !['accept', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'user_id and valid action (accept/deny) are required' });
    }

    const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId) as any;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.leader_id !== user_id) {
      return res.status(403).json({ error: 'Only the Group Leader can respond to join requests.' });
    }

    const request = db.prepare(`SELECT * FROM chat_group_requests WHERE id = ? AND group_id = ?`).get(requestId, groupId) as any;
    if (!request) {
      return res.status(404).json({ error: 'Join request not found.' });
    }

    const now = new Date().toISOString();
    const newStatus = action === 'accept' ? 'accepted' : 'denied';

    db.prepare(`UPDATE chat_group_requests SET status = ?, updated_at = ? WHERE id = ?`).run(newStatus, now, requestId);

    if (action === 'accept') {
      // Add member
      const memberId = generateId('cgm');
      db.prepare(`
        INSERT OR IGNORE INTO chat_group_members (id, group_id, user_id, role, joined_at)
        VALUES (?, ?, ?, 'member', ?)
      `).run(memberId, groupId, request.user_id, now);

      // Notify user
      const notifId = generateId('notif');
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at)
        VALUES (?, ?, 'join_accepted', 'Join Request Accepted', ?, ?, 0, ?)
      `).run(
        notifId,
        request.user_id,
        `Your request to join "${group.name}" was accepted! You can now participate in group chat.`,
        JSON.stringify({ group_id: groupId, group_name: group.name }),
        now
      );
    } else {
      // Notify user of denial
      const notifId = generateId('notif');
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at)
        VALUES (?, ?, 'join_denied', 'Join Request Update', ?, ?, 0, ?)
      `).run(
        notifId,
        request.user_id,
        `Your request to join "${group.name}" was declined by the Group Leader.`,
        JSON.stringify({ group_id: groupId, group_name: group.name }),
        now
      );
    }

    res.json({ success: true, status: newStatus, message: `Request ${newStatus}.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Get group invitations (Received and Sent)
router.get('/chat/invitations', (req, res) => {
  try {
    const userId = req.query.user_id ? String(req.query.user_id) : '';
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const received = db.prepare(`
      SELECT inv.id as invitation_id, inv.status, inv.created_at,
        g.id as group_id, g.name as group_name, g.icon_url as group_icon, g.description as group_description, g.chat_color,
        u.id as inviter_id, u.username as inviter_username, u.profile_photo as inviter_photo
      FROM chat_group_invitations inv
      JOIN chat_groups g ON inv.group_id = g.id
      JOIN users u ON inv.inviter_user_id = u.id
      WHERE inv.invited_user_id = ? AND inv.status = 'pending'
      ORDER BY inv.created_at DESC
    `).all(userId);

    const sent = db.prepare(`
      SELECT inv.id as invitation_id, inv.status, inv.created_at,
        g.id as group_id, g.name as group_name, g.icon_url as group_icon,
        u.id as invited_id, u.username as invited_username, u.profile_photo as invited_photo
      FROM chat_group_invitations inv
      JOIN chat_groups g ON inv.group_id = g.id
      JOIN users u ON inv.invited_user_id = u.id
      WHERE inv.inviter_user_id = ?
      ORDER BY inv.created_at DESC
    `).all(userId);

    res.json({ received, sent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 13. Invite an account to a group
router.post('/chat/groups/:id/invite', (req, res) => {
  try {
    const groupId = req.params.id;
    const { inviter_id, target_username, target_user_id } = req.body;

    if (!inviter_id || (!target_username && !target_user_id)) {
      return res.status(400).json({ error: 'inviter_id and target username or id are required' });
    }

    const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId) as any;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Permission check: Must be Leader OR (group allows member invites AND inviter is a member)
    const inviterMembership = db.prepare(`SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ?`).get(groupId, inviter_id) as any;
    if (!inviterMembership) {
      return res.status(403).json({ error: 'You must be a member of this group to send invitations.' });
    }

    const isLeader = group.leader_id === inviter_id || inviterMembership.role === 'leader';
    if (!isLeader && group.allow_member_invites === 0) {
      return res.status(403).json({ error: 'Only the Group Leader is permitted to invite members in this group.' });
    }

    // Find target user
    let targetUser: any;
    if (target_user_id) {
      targetUser = db.prepare(`SELECT id, username FROM users WHERE id = ?`).get(target_user_id);
    } else {
      targetUser = db.prepare(`SELECT id, username FROM users WHERE LOWER(username) = LOWER(?)`).get(target_username.trim());
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Collector account not found. Please check the username.' });
    }

    if (targetUser.id === inviter_id) {
      return res.status(400).json({ error: 'You cannot invite yourself.' });
    }

    // Check if already a member
    const alreadyMember = db.prepare(`SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ?`).get(groupId, targetUser.id);
    if (alreadyMember) {
      return res.status(400).json({ error: `${targetUser.username} is already a member of this group.` });
    }

    // Check pending invite
    const existingInvite = db.prepare(`SELECT id, status FROM chat_group_invitations WHERE group_id = ? AND invited_user_id = ?`).get(groupId, targetUser.id) as any;
    if (existingInvite && existingInvite.status === 'pending') {
      return res.status(400).json({ error: `An invitation to this group is already pending for ${targetUser.username}.` });
    }

    const now = new Date().toISOString();
    const inviteId = existingInvite ? existingInvite.id : generateId('inv_grp');

    if (existingInvite) {
      db.prepare(`UPDATE chat_group_invitations SET inviter_user_id = ?, status = 'pending', updated_at = ? WHERE id = ?`).run(inviter_id, now, inviteId);
    } else {
      db.prepare(`
        INSERT INTO chat_group_invitations (id, group_id, invited_user_id, inviter_user_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
      `).run(inviteId, groupId, targetUser.id, inviter_id, now, now);
    }

    // Notify invited user
    const inviterUser = db.prepare(`SELECT username FROM users WHERE id = ?`).get(inviter_id) as any;
    const notifId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at)
      VALUES (?, ?, 'group_invite', 'Group Invitation', ?, ?, 0, ?)
    `).run(
      notifId,
      targetUser.id,
      `${inviterUser ? inviterUser.username : 'A collector'} invited you to join "${group.name}".`,
      JSON.stringify({ group_id: groupId, invite_id: inviteId, inviter_id }),
      now
    );

    res.status(201).json({ success: true, message: `Invitation successfully sent to ${targetUser.username}.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14. Respond to group invitation (Accept or Deny)
router.post('/chat/invitations/:inviteId/respond', (req, res) => {
  try {
    const inviteId = req.params.inviteId;
    const { user_id, action } = req.body; // action: 'accept' | 'deny'

    if (!user_id || !action || !['accept', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'user_id and valid action (accept/deny) are required' });
    }

    const invite = db.prepare(`
      SELECT inv.*, g.name as group_name
      FROM chat_group_invitations inv
      JOIN chat_groups g ON inv.group_id = g.id
      WHERE inv.id = ?
    `).get(inviteId) as any;

    if (!invite) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invite.invited_user_id !== user_id) {
      return res.status(403).json({ error: 'You are not authorized to respond to this invitation.' });
    }

    const now = new Date().toISOString();
    const newStatus = action === 'accept' ? 'accepted' : 'denied';

    db.prepare(`UPDATE chat_group_invitations SET status = ?, updated_at = ? WHERE id = ?`).run(newStatus, now, inviteId);

    if (action === 'accept') {
      const memberId = generateId('cgm');
      db.prepare(`
        INSERT OR IGNORE INTO chat_group_members (id, group_id, user_id, role, joined_at)
        VALUES (?, ?, ?, 'member', ?)
      `).run(memberId, invite.group_id, user_id, now);

      // Notify inviter
      const invitedUser = db.prepare(`SELECT username FROM users WHERE id = ?`).get(user_id) as any;
      const notifId = generateId('notif');
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at)
        VALUES (?, ?, 'join_accepted', 'Invitation Accepted', ?, ?, 0, ?)
      `).run(
        notifId,
        invite.inviter_user_id,
        `${invitedUser ? invitedUser.username : 'Collector'} accepted your invitation to "${invite.group_name}".`,
        JSON.stringify({ group_id: invite.group_id, user_id }),
        now
      );
    }

    res.json({ success: true, status: newStatus, group_id: invite.group_id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 15. Notifications
router.get('/notifications', (req, res) => {
  try {
    const userId = req.query.user_id ? String(req.query.user_id) : '';
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const notifs = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId) as { count: number };

    res.json({ notifications: notifs, unread_count: unreadCount.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notifications/mark-read', (req, res) => {
  try {
    const { user_id, notification_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    if (notification_id) {
      db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`).run(notification_id, user_id);
    } else {
      db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(user_id);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= CHAT MESSAGES ================= //

// Get chat messages
router.get('/chat/messages', (req, res) => {
  try {
    let channelId = req.query.channel_id ? String(req.query.channel_id) : 'universal';
    if (channelId === 'lounge') channelId = 'universal'; // normalize
    const userId = req.query.user_id ? String(req.query.user_id) : '';
    const limit = Number(req.query.limit) || 120;

    // If channel is a group, verify membership
    if (channelId.startsWith('group:')) {
      const groupId = channelId.replace('group:', '');
      if (userId) {
        const isMember = db.prepare(`SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ?`).get(groupId, userId);
        if (!isMember) {
          return res.status(403).json({ error: 'You must be a member of this group to view messages.' });
        }
      }
    }

    const rows = db.prepare(`
      SELECT cm.*, u.username as sender_username, u.profile_photo as sender_photo
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.channel_id = ? OR (cm.channel_id = 'lounge' AND ? = 'universal')
      ORDER BY cm.created_at ASC
      LIMIT ?
    `).all(channelId, channelId, limit);

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Post chat message
router.post('/chat/messages', (req, res) => {
  try {
    const { sender_id, channel_id, recipient_id, content, image_url } = req.body;
    let actualChannel = channel_id ? String(channel_id) : 'universal';
    if (actualChannel === 'lounge') actualChannel = 'universal';

    if (!sender_id || (!content && !image_url)) {
      return res.status(400).json({ error: 'sender_id and message content or image are required' });
    }

    // Check if user is temporarily blocked / banned from messaging in all chats
    const senderUserRecord = db.prepare(`
      SELECT chat_banned, chat_ban_reason, chat_ban_expires_at FROM users WHERE id = ?
    `).get(sender_id) as any;

    if (senderUserRecord && senderUserRecord.chat_banned) {
      if (senderUserRecord.chat_ban_expires_at) {
        const expiresTimestamp = new Date(senderUserRecord.chat_ban_expires_at).getTime();
        const now = Date.now();
        if (now >= expiresTimestamp) {
          // Ban has expired! Automatically lift the chat ban
          db.prepare(`UPDATE users SET chat_banned = 0, chat_ban_reason = NULL, chat_ban_expires_at = NULL WHERE id = ?`).run(sender_id);
        } else {
          const expDateStr = new Date(senderUserRecord.chat_ban_expires_at).toLocaleString();
          return res.status(403).json({
            error: `You are temporarily blocked from messaging in all chat groups and Universal Chat until ${expDateStr}. Reason: ${senderUserRecord.chat_ban_reason || 'Community reports'}.`,
            chat_banned: true,
            chat_ban_expires_at: senderUserRecord.chat_ban_expires_at
          });
        }
      } else {
        // Indefinite ban until mod/admin decision
        return res.status(403).json({
          error: `You are temporarily blocked from messaging in all chat groups and Universal Chat pending moderator or administrator review. Reason: ${senderUserRecord.chat_ban_reason || 'Community reports'}.`,
          chat_banned: true,
          chat_ban_expires_at: null
        });
      }
    }

    let cleanContent = (content || '').trim();
    let group: any = null;

    // If this is a group chat, enforce group-specific permissions and moderation
    if (actualChannel.startsWith('group:')) {
      const groupId = actualChannel.replace('group:', '');
      group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId) as any;
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Check membership
      const membership = db.prepare(`SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ?`).get(groupId, sender_id);
      if (!membership) {
        return res.status(403).json({ error: 'You are no longer a member of this group and cannot send messages.' });
      }

      // Check picture permission
      if (image_url && group.allow_pictures === 0) {
        return res.status(400).json({ error: 'Images and picture attachments are disabled in this group.' });
      }

      // Spam filter
      if (group.spam_filter === 1) {
        const spamCheck = checkSpam(sender_id, cleanContent);
        if (spamCheck.isSpam) {
          return res.status(429).json({ error: spamCheck.reason });
        }
      }

      // Profanity filter
      if (group.profanity_filter === 1 && cleanContent) {
        cleanContent = sanitizeProfanity(cleanContent);
      }
    } else {
      // Universal chat default protections
      const spamCheck = checkSpam(sender_id, cleanContent);
      if (spamCheck.isSpam) {
        return res.status(429).json({ error: spamCheck.reason });
      }
      if (cleanContent) {
        cleanContent = sanitizeProfanity(cleanContent);
      }
    }

    const id = generateId('msg');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO chat_messages (id, sender_id, channel_id, recipient_id, content, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, sender_id, actualChannel, recipient_id || null, cleanContent, image_url || null, now);

    const created = db.prepare(`
      SELECT cm.*, u.username as sender_username, u.profile_photo as sender_photo
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.id = ?
    `).get(id) as any;

    // Detect @username mentions and notify tagged accounts
    if (cleanContent) {
      const mentions = cleanContent.match(/@([a-zA-Z0-9_-]+)/g);
      if (mentions && mentions.length > 0) {
        const uniqueMentions = Array.from(new Set(mentions.map(m => m.slice(1))));
        const senderUser = db.prepare(`SELECT username FROM users WHERE id = ?`).get(sender_id) as any;
        const senderName = senderUser ? senderUser.username : 'Someone';
        const channelName = group ? group.name : 'Universal Chat';

        for (const taggedName of uniqueMentions) {
          const nameStr = String(taggedName);
          const taggedUser = db.prepare(`SELECT id, username FROM users WHERE LOWER(username) = LOWER(?)`).get(nameStr) as any;
          if (taggedUser && taggedUser.id !== sender_id) {
            // Verify if group chat that tagged user is in group
            if (group) {
              const isMember = db.prepare(`SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ?`).get(group.id, taggedUser.id);
              if (!isMember) continue;
            }

            const notifId = generateId('notif');
            db.prepare(`
              INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at)
              VALUES (?, ?, 'mention', 'Mentioned in Chat', ?, ?, 0, ?)
            `).run(
              notifId,
              taggedUser.id,
              `@${senderName} tagged you in ${channelName}: "${cleanContent.length > 60 ? cleanContent.substring(0, 60) + '...' : cleanContent}"`,
              JSON.stringify({ channel_id: actualChannel, message_id: id, group_id: group ? group.id : null }),
              now
            );
          }
        }
      }
    }

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Report user or chat message
// RULE: If someone is reported 5 times by 5 separate accounts, they are temporarily blocked from messaging in all chat groups and universal chat!
router.post('/chat/report', (req, res) => {
  try {
    const { reporter_id, reported_id, message_id, reason, channel } = req.body;

    if (!reporter_id || !reported_id) {
      return res.status(400).json({ error: 'reporter_id and reported_id are required' });
    }

    if (reporter_id === reported_id) {
      return res.status(400).json({ error: 'You cannot report your own account.' });
    }

    // Check if this reporter already reported this user
    const existing = db.prepare(`
      SELECT id FROM chat_reports WHERE reported_user_id = ? AND reporter_user_id = ?
    `).get(reported_id, reporter_id) as any;

    if (existing) {
      return res.status(400).json({ error: 'You have already reported this user. Your report has been recorded.' });
    }

    const reportId = generateId('rpt');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO chat_reports (id, reported_user_id, reporter_user_id, message_id, reason, channel, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(reportId, reported_id, reporter_id, message_id || null, reason || 'Inappropriate behavior or spam', channel || 'chat', now);

    // Count distinct accounts reporting this user
    const countResult = db.prepare(`
      SELECT COUNT(DISTINCT reporter_user_id) as count FROM chat_reports WHERE reported_user_id = ?
    `).get(reported_id) as { count: number };

    const distinctCount = countResult ? countResult.count : 1;
    let autoBanned = false;

    if (distinctCount >= 5) {
      // 5 reports reached! Block user from all chat groups & universal chat
      db.prepare(`
        UPDATE users
        SET chat_banned = 1,
            chat_ban_reason = 'Temporarily blocked after receiving 5 reports from separate accounts.',
            chat_ban_expires_at = NULL,
            chat_ban_updated_at = ?
        WHERE id = ?
      `).run(now, reported_id);

      autoBanned = true;

      // Notify the reported user
      const notifId = generateId('notif');
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at)
        VALUES (?, ?, 'chat_ban', 'Chat Suspended: 5 Community Reports', ?, ?, 0, ?)
      `).run(
        notifId,
        reported_id,
        'Your account has been reported by 5 separate collector accounts. You are temporarily blocked from messaging in all chat groups and Universal Chat pending moderator or administrator review.',
        JSON.stringify({ distinct_reports: distinctCount }),
        now
      );
    }

    res.json({
      success: true,
      distinct_reports: distinctCount,
      auto_banned: autoBanned,
      message: autoBanned
        ? 'Report submitted. This user has reached 5 reports from separate accounts and is now temporarily blocked from all chat groups and Universal Chat.'
        : `Report recorded (${distinctCount}/5 reports towards automated moderation review). Thank you for helping keep the community clean.`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin / Moderator: Get all reports and banned accounts
router.get('/admin/chat-reports', (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT
        u.id as user_id,
        u.username,
        u.profile_photo,
        u.account_info,
        u.chat_banned,
        u.chat_ban_reason,
        u.chat_ban_expires_at,
        u.chat_ban_updated_at,
        COUNT(DISTINCT r.reporter_user_id) as report_count
      FROM chat_reports r
      JOIN users u ON r.reported_user_id = u.id
      GROUP BY u.id
      ORDER BY u.chat_banned DESC, report_count DESC
    `).all() as any[];

    // Also include any banned users who might not have active reports in table
    const allBanned = db.prepare(`
      SELECT
        id as user_id,
        username,
        profile_photo,
        account_info,
        chat_banned,
        chat_ban_reason,
        chat_ban_expires_at,
        chat_ban_updated_at,
        0 as report_count
      FROM users
      WHERE chat_banned = 1
    `).all() as any[];

    const map = new Map<string, any>();
    for (const r of reports) map.set(r.user_id, r);
    for (const b of allBanned) {
      if (!map.has(b.user_id)) map.set(b.user_id, b);
    }

    const result = Array.from(map.values());

    for (const item of result) {
      item.reports = db.prepare(`
        SELECT r.*, reporter.username as reporter_username, cm.content as message_snippet
        FROM chat_reports r
        JOIN users reporter ON r.reporter_user_id = reporter.id
        LEFT JOIN chat_messages cm ON r.message_id = cm.id
        WHERE r.reported_user_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10
      `).all(item.user_id);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin / Moderator: Remove chat ban
router.post('/admin/chat-ban/remove', (req, res) => {
  try {
    const { target_user_id } = req.body;
    if (!target_user_id) {
      return res.status(400).json({ error: 'target_user_id is required' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE users
      SET chat_banned = 0, chat_ban_reason = NULL, chat_ban_expires_at = NULL, chat_ban_updated_at = ?
      WHERE id = ?
    `).run(now, target_user_id);

    // Clear reports for fresh standing
    db.prepare(`DELETE FROM chat_reports WHERE reported_user_id = ?`).run(target_user_id);

    // Notify user
    const notifId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at)
      VALUES (?, ?, 'chat_unban', 'Chat Suspension Lifted', 'A moderator has lifted your chat ban. You can now send messages in Universal Chat and group chats again.', ?, 0, ?)
    `).run(notifId, target_user_id, JSON.stringify({ action: 'unban' }), now);

    res.json({ success: true, message: 'Chat ban removed successfully. User can chat again.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin / Moderator: Extend chat ban to a set date and time
router.post('/admin/chat-ban/extend', (req, res) => {
  try {
    const { target_user_id, expires_at, reason } = req.body;
    if (!target_user_id || !expires_at) {
      return res.status(400).json({ error: 'target_user_id and expires_at are required' });
    }

    const now = new Date().toISOString();
    const cleanReason = reason && reason.trim() ? reason.trim() : 'Moderator / Admin enforcement';

    db.prepare(`
      UPDATE users
      SET chat_banned = 1,
          chat_ban_reason = ?,
          chat_ban_expires_at = ?,
          chat_ban_updated_at = ?
      WHERE id = ?
    `).run(cleanReason, expires_at, now, target_user_id);

    const formattedDate = new Date(expires_at).toLocaleString();

    // Notify user
    const notifId = generateId('notif');
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, data_json, is_read, created_at)
      VALUES (?, ?, 'chat_ban', 'Chat Ban Extended', ?, ?, 0, ?)
    `).run(
      notifId,
      target_user_id,
      `Your chat suspension was set to expire on ${formattedDate}. At that time, it will end and you can chat again. Reason: ${cleanReason}`,
      JSON.stringify({ expires_at, reason: cleanReason }),
      now
    );

    res.json({ success: true, message: `Chat ban extended to ${formattedDate}.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Main Settings: App Suggestion (up to 1000 characters sent to devinjjenkins90@gmail.com)
router.post('/suggestions', (req, res) => {
  try {
    const { user_id, username, suggestion } = req.body;

    if (!suggestion || !suggestion.trim()) {
      return res.status(400).json({ error: 'Suggestion text cannot be empty.' });
    }

    const cleanText = suggestion.trim();
    if (cleanText.length > 1000) {
      return res.status(400).json({ error: 'Suggestion must be 1000 characters or fewer.' });
    }

    const id = generateId('sug');
    const now = new Date().toISOString();
    const targetEmail = 'devinjjenkins90@gmail.com';

    db.prepare(`
      INSERT INTO app_suggestions (id, user_id, username, suggestion, target_email, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'submitted', ?)
    `).run(id, user_id || 'anonymous', username || 'Collector', cleanText, targetEmail, now);

    const mailtoSubject = encodeURIComponent(`PocketAlbum App Suggestion from @${username || 'Collector'}`);
    const mailtoBody = encodeURIComponent(`PocketAlbum App Suggestion:\n\n${cleanText}\n\nSubmitted by: @${username || 'Collector'}\nTimestamp: ${now}`);
    const mailtoUrl = `mailto:${targetEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

    res.status(201).json({
      success: true,
      message: 'Your suggestion was submitted successfully and sent to devinjjenkins90@gmail.com!',
      target_email: targetEmail,
      mailto_url: mailtoUrl
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= FACEBOOK PAGE AUTOMATION ROUTES ================= //

// User asks: Confirm posting coin when user preference is "ask"
router.post('/facebook/confirm-coin-post', async (req, res) => {
  try {
    const { coin_id, owner_id } = req.body;
    if (!coin_id || !owner_id) {
      return res.status(400).json({ error: 'coin_id and owner_id are required' });
    }
    const result = await FacebookAutomationManager.confirmCoinPost(coin_id, owner_id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get Facebook Connection Status
router.get('/facebook/connection', (req, res) => {
  try {
    const conn = FacebookService.getConnection();
    // Mask access token for security
    const masked = {
      ...conn,
      access_token: conn.access_token ? `••••••••${conn.access_token.slice(-6)}` : '',
      has_access_token: Boolean(conn.access_token)
    };
    res.json(masked);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Connect Facebook Page (Supports 1-click zero-config connect)
router.post('/facebook/connect', async (req, res) => {
  try {
    const { page_id, page_name, access_token } = req.body || {};
    const result = await FacebookService.connectPage({
      page_id: page_id || 'pocketalbum_community_page',
      page_name: page_name || 'PocketAlbum Official Community Page',
      access_token: access_token || 'preconfigured_system_token'
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Disconnect Facebook Page
router.post('/facebook/disconnect', (req, res) => {
  try {
    const result = FacebookService.disconnectPage();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Test Connection
router.post('/facebook/test-connection', async (req, res) => {
  try {
    const result = await FacebookService.testConnection();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get Automation Settings
router.get('/facebook/settings', (req, res) => {
  try {
    const settings = FacebookAutomationManager.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update Automation Settings
router.put('/facebook/settings', (req, res) => {
  try {
    const updated = FacebookAutomationManager.saveSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get Publishing Queue & History
router.get('/facebook/queue', (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : '';
    const type = req.query.type ? String(req.query.type) : '';
    const limit = parseInt(String(req.query.limit || '50'), 10);

    let query = `SELECT * FROM facebook_post_queue WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (type) {
      query += ` AND post_type = ?`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const items = db.prepare(query).all(...params);

    // Summary counts
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'RETRYING' THEN 1 ELSE 0 END) as retrying,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
      FROM facebook_post_queue
    `).get() as any;

    res.json({ items, counts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Retry failed or cancelled post
router.post('/facebook/queue/retry/:id', (req, res) => {
  try {
    const result = FacebookAutomationManager.manualRetryPost(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Cancel post
router.post('/facebook/queue/cancel/:id', (req, res) => {
  try {
    const result = FacebookAutomationManager.cancelPost(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete post from history
router.delete('/facebook/queue/:id', (req, res) => {
  try {
    const result = FacebookAutomationManager.deletePost(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Trigger queue processing now
router.post('/facebook/queue/process', async (req, res) => {
  try {
    const result = await FacebookAutomationManager.processFacebookQueue();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Trigger Daily Digest Now
router.post('/facebook/trigger/digest', (req, res) => {
  try {
    const result = FacebookAutomationManager.generateDailyDigest();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Trigger Weekly Showcase Now
router.post('/facebook/trigger/showcase', (req, res) => {
  try {
    const result = FacebookAutomationManager.generateWeeklyShowcase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Trigger Leaderboard Post Now
router.post('/facebook/trigger/leaderboard', (req, res) => {
  try {
    const type = (req.body.type as 'weekly' | 'monthly' | 'overall') || 'weekly';
    const result = FacebookAutomationManager.generateLeaderboardPost(type);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Trigger Instant Test Post Now (1-click test with zero setup)
router.post('/facebook/trigger/test-post', async (req, res) => {
  try {
    const result = await FacebookAutomationManager.generateTestPost();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= NUMISMATIC NEWS SYSTEM ROUTES ================= //

// 1. Get News Articles with filters & reactions
router.get('/news/articles', (req, res) => {
  try {
    const category = req.query.category ? String(req.query.category).trim() : 'All';
    const q = req.query.q ? String(req.query.q).trim().toLowerCase() : '';
    const sort = req.query.sort ? String(req.query.sort) : 'latest';
    const userId = req.query.current_user_id ? String(req.query.current_user_id) : '';
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const offset = Number(req.query.offset) || 0;

    let sql = `
      SELECT a.*,
        (SELECT COUNT(*) FROM news_reactions WHERE article_id = a.id AND reaction = 'like') as likes_count,
        (SELECT COUNT(*) FROM news_reactions WHERE article_id = a.id AND reaction = 'dislike') as dislikes_count
    `;
    if (userId) {
      sql += `, (SELECT reaction FROM news_reactions WHERE article_id = a.id AND user_id = ?) as user_reaction `;
    } else {
      sql += `, NULL as user_reaction `;
    }

    sql += ` FROM news_articles a WHERE a.status = 'PUBLISHED' `;
    const params: any[] = userId ? [userId] : [];

    if (category && category !== 'All') {
      if (category === 'World' || category === 'World Coins') {
        sql += ` AND (a.category = 'World' OR a.category = 'World Coins') `;
      } else {
        sql += ` AND a.category = ? `;
        params.push(category);
      }
    }

    if (q) {
      sql += ` AND (LOWER(a.title) LIKE ? OR LOWER(a.summary) LIKE ? OR LOWER(a.tags) LIKE ? OR LOWER(a.source_name) LIKE ?) `;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (sort === 'popular') {
      sql += ` ORDER BY likes_count DESC, a.publication_date DESC `;
    } else if (sort === 'breaking') {
      sql += ` ORDER BY a.is_breaking DESC, a.is_featured DESC, a.publication_date DESC `;
    } else {
      sql += ` ORDER BY a.is_breaking DESC, a.publication_date DESC `;
    }

    sql += ` LIMIT ? OFFSET ? `;
    params.push(limit, offset);

    const articles = db.prepare(sql).all(...params) as any[];

    // Cache series lookups for fast response
    const seriesCache = new Map<string, any>();
    const getSeriesDetail = (seriesId: string) => {
      if (!seriesCache.has(seriesId)) {
        const row = db.prepare(`SELECT id, name, denomination_id FROM coin_series WHERE id = ?`).get(seriesId);
        seriesCache.set(seriesId, row || null);
      }
      return seriesCache.get(seriesId);
    };

    for (const art of articles) {
      art.tags = JSON.parse(art.tags || '[]');
      art.related_coin_ids = JSON.parse(art.related_coin_ids || '[]');
      const sIds: string[] = JSON.parse(art.related_series_ids || '[]');
      art.related_series_ids = sIds;
      art.related_series_details = sIds.map(id => getSeriesDetail(id)).filter(Boolean);
    }

    res.json(articles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Single Article Details
router.get('/news/articles/:id', (req, res) => {
  try {
    const articleId = req.params.id;
    const userId = req.query.current_user_id ? String(req.query.current_user_id) : '';

    // Record view
    db.prepare(`UPDATE news_articles SET views_count = views_count + 1 WHERE id = ?`).run(articleId);

    let sql = `
      SELECT a.*,
        (SELECT COUNT(*) FROM news_reactions WHERE article_id = a.id AND reaction = 'like') as likes_count,
        (SELECT COUNT(*) FROM news_reactions WHERE article_id = a.id AND reaction = 'dislike') as dislikes_count
    `;
    if (userId) {
      sql += `, (SELECT reaction FROM news_reactions WHERE article_id = a.id AND user_id = ?) as user_reaction `;
    } else {
      sql += `, NULL as user_reaction `;
    }
    sql += ` FROM news_articles a WHERE a.id = ? `;

    const params = userId ? [userId, articleId] : [articleId];
    const art = db.prepare(sql).get(...params) as any;

    if (!art) {
      return res.status(404).json({ error: 'Article not found' });
    }

    art.tags = JSON.parse(art.tags || '[]');
    art.related_coin_ids = JSON.parse(art.related_coin_ids || '[]');
    const sIds: string[] = JSON.parse(art.related_series_ids || '[]');
    art.related_series_ids = sIds;
    art.related_series_details = sIds.map(id => {
      return db.prepare(`SELECT id, name, denomination_id FROM coin_series WHERE id = ?`).get(id);
    }).filter(Boolean);

    res.json(art);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. User React (Like / Dislike toggle)
router.post('/news/articles/:id/react', (req, res) => {
  try {
    const articleId = req.params.id;
    const { user_id, reaction } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required to react' });
    }

    const existing = db.prepare(`SELECT id, reaction FROM news_reactions WHERE article_id = ? AND user_id = ?`).get(articleId, user_id) as any;

    if (reaction === 'none' || (existing && existing.reaction === reaction)) {
      // Toggle off / clear reaction
      db.prepare(`DELETE FROM news_reactions WHERE article_id = ? AND user_id = ?`).run(articleId, user_id);
    } else if (reaction === 'like' || reaction === 'dislike') {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO news_reactions (id, article_id, user_id, reaction, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(article_id, user_id) DO UPDATE SET reaction = excluded.reaction
      `).run(generateId('rxn'), articleId, user_id, reaction, now);
    }

    const counts = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM news_reactions WHERE article_id = ? AND reaction = 'like') as likes_count,
        (SELECT COUNT(*) FROM news_reactions WHERE article_id = ? AND reaction = 'dislike') as dislikes_count,
        (SELECT reaction FROM news_reactions WHERE article_id = ? AND user_id = ?) as user_reaction
    `).get(articleId, articleId, articleId, user_id) as any;

    res.json(counts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get All News Sources (for Source Manager)
router.get('/news/sources', (req, res) => {
  try {
    const sources = db.prepare(`
      SELECT * FROM news_sources
      ORDER BY
        CASE status WHEN 'CONNECTED' THEN 1 WHEN 'NEEDS_VERIFICATION' THEN 2 WHEN 'FAILED' THEN 3 ELSE 4 END,
        credibility_tier ASC,
        name ASC
    `).all() as any[];

    for (const s of sources) {
      s.categories = JSON.parse(s.categories || '[]');
    }
    res.json(sources);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Verify Source Connection
router.post('/news/sources/:id/verify', async (req, res) => {
  try {
    const sourceId = req.params.id;
    const { endpoint, connection_type } = req.body;
    const source = db.prepare(`SELECT * FROM news_sources WHERE id = ?`).get(sourceId) as any;
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    const targetEndpoint = (endpoint !== undefined ? endpoint : source.endpoint) || '';
    const targetConnType = connection_type || source.connection_type || 'OFFICIAL_RSS';

    const verifyRes = await NewsService.verifyEndpoint(targetEndpoint, targetConnType);
    const now = new Date().toISOString();

    if (verifyRes.success) {
      db.prepare(`
        UPDATE news_sources
        SET endpoint = ?, connection_type = ?, status = 'CONNECTED',
            last_successful_fetch = ?, last_error = NULL, updated_at = ?
        WHERE id = ?
      `).run(targetEndpoint, targetConnType, now, now, sourceId);
    } else {
      db.prepare(`
        UPDATE news_sources
        SET endpoint = ?, connection_type = ?, status = ?,
            last_failed_fetch = ?, last_error = ?, updated_at = ?
        WHERE id = ?
      `).run(targetEndpoint, targetConnType, verifyRes.status, now, verifyRes.message, now, sourceId);
    }

    const updated = db.prepare(`SELECT * FROM news_sources WHERE id = ?`).get(sourceId) as any;
    updated.categories = JSON.parse(updated.categories || '[]');

    res.json({
      verification: verifyRes,
      source: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Ingest Articles from Source Now
router.post('/news/sources/:id/fetch', async (req, res) => {
  try {
    const sourceId = req.params.id;
    const result = await NewsService.ingestFromSource(sourceId);
    const updated = db.prepare(`SELECT * FROM news_sources WHERE id = ?`).get(sourceId) as any;
    if (updated) {
      updated.categories = JSON.parse(updated.categories || '[]');
    }
    res.json({ ...result, source: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Update Source (Admin Edit: endpoint, enabled, approvalMode, categories, etc.)
router.put('/news/sources/:id', (req, res) => {
  try {
    const sourceId = req.params.id;
    const {
      name, website_url, connection_type, endpoint, enabled,
      approval_mode, credibility_tier, categories, status
    } = req.body;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE news_sources
      SET name = COALESCE(?, name),
          website_url = COALESCE(?, website_url),
          connection_type = COALESCE(?, connection_type),
          endpoint = COALESCE(?, endpoint),
          enabled = COALESCE(?, enabled),
          approval_mode = COALESCE(?, approval_mode),
          credibility_tier = COALESCE(?, credibility_tier),
          categories = COALESCE(?, categories),
          status = COALESCE(?, status),
          updated_at = ?
      WHERE id = ?
    `).run(
      name, website_url, connection_type, endpoint,
      enabled !== undefined ? (enabled ? 1 : 0) : null,
      approval_mode, credibility_tier,
      categories ? (typeof categories === 'string' ? categories : JSON.stringify(categories)) : null,
      status,
      now,
      sourceId
    );

    const updated = db.prepare(`SELECT * FROM news_sources WHERE id = ?`).get(sourceId) as any;
    if (updated) {
      updated.categories = JSON.parse(updated.categories || '[]');
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Create Custom Source (Admin)
router.post('/news/sources', (req, res) => {
  try {
    const {
      name, website_url, connection_type, endpoint,
      credibility_tier, categories, approval_mode
    } = req.body;
    if (!name || !website_url) {
      return res.status(400).json({ error: 'Name and Website URL are required.' });
    }
    const id = generateId('src');
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO news_sources (
        id, name, website_url, connection_type, endpoint, credibility_tier,
        categories, enabled, approval_mode, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 'NEEDS_VERIFICATION', ?, ?)
    `).run(
      id, name, website_url,
      connection_type || 'OFFICIAL_RSS',
      endpoint || '',
      credibility_tier || 'TIER 3 — ESTABLISHED NUMISMATIC NEWS SOURCE',
      JSON.stringify(categories || ['U.S. Coins']),
      approval_mode || 'AUTOMATIC',
      now, now
    );

    const created = db.prepare(`SELECT * FROM news_sources WHERE id = ?`).get(id) as any;
    created.categories = JSON.parse(created.categories || '[]');
    res.json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Update Article Moderation (Admin: toggle Breaking, Featured, edit related coins/series, category)
router.put('/news/articles/:id', (req, res) => {
  try {
    const articleId = req.params.id;
    const { is_breaking, is_featured, status, category, related_series_ids, summary, title } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE news_articles
      SET is_breaking = COALESCE(?, is_breaking),
          is_featured = COALESCE(?, is_featured),
          status = COALESCE(?, status),
          category = COALESCE(?, category),
          related_series_ids = COALESCE(?, related_series_ids),
          summary = COALESCE(?, summary),
          title = COALESCE(?, title),
          updated_at = ?
      WHERE id = ?
    `).run(
      is_breaking !== undefined ? (is_breaking ? 1 : 0) : null,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      status,
      category,
      related_series_ids ? JSON.stringify(related_series_ids) : null,
      summary,
      title,
      now,
      articleId
    );

    const updated = db.prepare(`SELECT * FROM news_articles WHERE id = ?`).get(articleId) as any;
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Manual Article Import (Admin)
router.post('/news/articles/manual', (req, res) => {
  try {
    const {
      source_name, original_url, title, summary,
      category, image_url, publication_date, is_breaking, is_featured, related_series_ids
    } = req.body;
    if (!title || !original_url) {
      return res.status(400).json({ error: 'Title and URL are required.' });
    }
    const id = generateId('art');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO news_articles (
        id, source_id, source_name, original_url, title, author,
        publication_date, imported_date, image_url, summary, category,
        tags, related_coin_ids, related_series_ids, is_breaking, is_featured,
        status, ai_processed, views_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', 1, 0, ?, ?)
    `).run(
      id,
      'src_manual',
      source_name || 'PocketAlbum Editorial',
      original_url,
      title,
      source_name || 'PocketAlbum Editorial',
      publication_date || now,
      now,
      image_url || null,
      summary || '',
      category || 'U.S. Coins',
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify(related_series_ids || []),
      is_breaking ? 1 : 0,
      is_featured ? 1 : 0,
      now,
      now
    );

    const created = db.prepare(`SELECT * FROM news_articles WHERE id = ?`).get(id);
    res.json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

