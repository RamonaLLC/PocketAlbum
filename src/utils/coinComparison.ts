import { ComparisonSpecimen, CoinComparisonResult } from '../types.ts';

const BASE_URL = '/api';

/**
 * Normalizes series name into standard Coin Name Category (e.g. "Lincoln Cent", "Buffalo Nickel")
 */
export function getCoinNameCategory(seriesName?: string, denominationName?: string): string {
  if (!seriesName) return denominationName || 'Coin Specimen';
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
  if (s.includes('capped bust dime')) return 'Capped Bust Dime';
  if (s.includes('draped bust dime')) return 'Draped Bust Dime';

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
  if (s.includes('capped bust quarter')) return 'Capped Bust Quarter';
  if (s.includes('draped bust quarter')) return 'Draped Bust Quarter';

  // Half Dollars
  if (s.includes('walking liberty')) return 'Walking Liberty Half Dollar';
  if (s.includes('franklin')) return 'Franklin Half Dollar';
  if (s.includes('kennedy')) return 'Kennedy Half Dollar';
  if (s.includes('barber half')) return 'Barber Half Dollar';
  if (s.includes('liberty seated half')) return 'Liberty Seated Half Dollar';
  if (s.includes('capped bust half')) return 'Capped Bust Half Dollar';
  if (s.includes('draped bust half')) return 'Draped Bust Half Dollar';
  if (s.includes('flowing hair half')) return 'Flowing Hair Half Dollar';

  // Dollars
  if (s.includes('morgan')) return 'Morgan Dollar';
  if (s.includes('peace dollar')) return 'Peace Dollar';
  if (s.includes('eisenhower') || s.includes('ike dollar')) return 'Eisenhower Dollar';
  if (s.includes('susan b. anthony')) return 'Susan B. Anthony Dollar';
  if (s.includes('sacagawea') || s.includes('native american dollar')) return 'Sacagawea Dollar';
  if (s.includes('presidential')) return 'Presidential Dollar';
  if (s.includes('american innovation')) return 'American Innovation Dollar';
  if (s.includes('trade dollar')) return 'Trade Dollar';
  if (s.includes('gobrecht dollar')) return 'Gobrecht Dollar';
  if (s.includes('liberty seated dollar')) return 'Liberty Seated Dollar';

  // Gold
  if (s.includes('saint-gaudens') || s.includes('double eagle')) return 'Saint-Gaudens Double Eagle';
  if (s.includes('liberty head $20') || s.includes('coronet double eagle')) return 'Coronet Double Eagle';
  if (s.includes('indian $10') || s.includes('indian eagle')) return 'Indian $10 Eagle';
  if (s.includes('indian $5') || s.includes('indian half eagle')) return 'Indian $5 Half Eagle';
  if (s.includes('indian $2.5') || s.includes('indian quarter eagle')) return 'Indian $2.50 Quarter Eagle';

  // Clean parentheticals like "(Wheat Reverse)", "(Modern)", "(Classic)", etc.
  const cleaned = seriesName.replace(/\s*\([^)]*\)/g, '').trim();
  return cleaned || denominationName || 'Coin Specimen';
}

/**
 * Normalizes grade strings into uniform comparison keys:
 * e.g., "MS 67", "MS-67", "MS67", "MS-67 RD", "MS-67+" -> "MS 67" (or "MS 67+")
 */
export function normalizeGrade(gradeStr?: string | null): string {
  if (!gradeStr || !gradeStr.trim()) return '';
  const trimmed = gradeStr.trim().toUpperCase();

  // Match standard Sheldon scale grades: e.g. MS 67, MS-67, PR 68, AU 55, VF 30, XF 45, F 12, VG 8, G 4
  const match = trimmed.match(/^([A-Z]{1,4})[\s-]?([0-9]{1,2})(\+)?/);
  if (match) {
    const prefix = match[1];
    const num = match[2];
    const plus = match[3] || '';
    return `${prefix} ${num}${plus}`;
  }

  // Handle word grades like "UNCIRCULATED", "ABOUT UNCIRCULATED", "FINE", etc.
  if (trimmed.includes('UNCIRCULATED') || trimmed === 'UNC' || trimmed === 'BU') return 'MS 60';
  if (trimmed.includes('PROOF') || trimmed === 'PF') return 'PR 65';

  return trimmed;
}

/**
 * Extracts color or strike designations (e.g. RD, RB, BN, FB, FS, FBL, CAM, DCAM, +)
 */
export function getGradeDesignation(gradeStr?: string | null): string | undefined {
  if (!gradeStr || !gradeStr.trim()) return undefined;
  const trimmed = gradeStr.trim().toUpperCase();
  const match = trimmed.match(/^[A-Z]{1,4}[\s-]?[0-9]{1,2}(\+)?\s*(.*)$/);
  if (match && match[2] && match[2].trim()) {
    return match[2].trim();
  }
  return undefined;
}

/**
 * Fetches matching coins of the exact same grade and coin name category
 */
export async function fetchCoinComparisons(params: {
  grade: string;
  coin_name_category?: string;
  series_id?: string;
  exclude_coin_id?: string;
}): Promise<CoinComparisonResult> {
  const query = new URLSearchParams();
  query.set('grade', params.grade);
  if (params.coin_name_category) query.set('coin_name_category', params.coin_name_category);
  if (params.series_id) query.set('series_id', params.series_id);
  if (params.exclude_coin_id) query.set('exclude_coin_id', params.exclude_coin_id);

  const res = await fetch(`${BASE_URL}/coins/compare?${query.toString()}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch coin comparisons');
  }
  return res.json();
}
