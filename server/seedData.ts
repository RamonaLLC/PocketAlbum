// PCGS Official Denominations and Series definitions

export interface SeedDenomination {
  id: string;
  name: string;
  category: string;
  display_order: number;
  diameter_mm?: string;
  icon_label?: string;
}

export interface SeedSeries {
  id: string;
  denomination_id: string;
  name: string;
  pcgs_reference_name: string;
  start_year: number;
  end_year: number;
  display_order: number;
  category?: string;
  designer?: string;
  mints?: string[];
  sampleIssues?: { year: number; mint: string; issue_name: string }[];
}

export const SEED_DENOMINATIONS: SeedDenomination[] = [
  { id: 'denom_half_cent', name: 'Half Cents', category: 'Cents', display_order: 1, icon_label: '½¢' },
  { id: 'denom_cent', name: 'One Cent', category: 'Cents', display_order: 2, icon_label: '1¢' },
  { id: 'denom_two_three', name: 'Two and Three Cents', category: 'Two and Three Cents', display_order: 3, icon_label: '2¢/3¢' },
  { id: 'denom_half_dime', name: 'Half Dimes', category: 'Dimes', display_order: 4, icon_label: '5¢' },
  { id: 'denom_nickel', name: 'Nickels', category: 'Nickels', display_order: 5, icon_label: '5¢' },
  { id: 'denom_dime', name: 'Dimes', category: 'Dimes', display_order: 6, icon_label: '10¢' },
  { id: 'denom_twenty', name: 'Twenty Cents', category: 'Quarters', display_order: 7, icon_label: '20¢' },
  { id: 'denom_quarter', name: 'Quarters', category: 'Quarters', display_order: 8, icon_label: '25¢' },
  { id: 'denom_half_dollar', name: 'Half Dollars', category: 'Half Dollars', display_order: 9, icon_label: '50¢' },
  { id: 'denom_dollar', name: 'Dollars', category: 'Dollars', display_order: 10, icon_label: '$1' },
  { id: 'denom_gold', name: 'Gold Coins', category: 'Gold', display_order: 11, icon_label: 'AU' },
  { id: 'denom_commem', name: 'Commemoratives', category: 'Commemoratives', display_order: 12, icon_label: '★' },
];

export const SEED_SERIES: SeedSeries[] = [
  // Fugio Cent (First option in One Cent)
  {
    id: 'fugio-cents',
    denomination_id: 'denom_cent',
    name: 'Fugio Cent',
    pcgs_reference_name: 'Fugio Cents (1787)',
    start_year: 1787,
    end_year: 1787,
    display_order: 1,
    category: 'Half-Cents and Cents',
    sampleIssues: [
      { year: 1787, mint: 'P', issue_name: '1787 4-Cinq Pointed Rays' },
      { year: 1787, mint: 'P', issue_name: '1787 Club Rays, Concave' },
      { year: 1787, mint: 'P', issue_name: '1787 Club Rays, Rounded' },
      { year: 1787, mint: 'P', issue_name: '1787 Pointed Rays, UNITED STATES' },
      { year: 1787, mint: 'P', issue_name: '1787 Pointed Rays, STATES UNITED' },
      { year: 1787, mint: 'P', issue_name: '1787 New Haven Restrike Copper' },
      { year: 1787, mint: 'P', issue_name: '1787 New Haven Restrike Silver' },
      { year: 1787, mint: 'P', issue_name: '1787 New Haven Restrike Gold' },
    ]
  },

  // Half-Cents and Cents
  {
    id: 'liberty-cap-half-cent',
    denomination_id: 'denom_half_cent',
    name: 'Liberty Cap Half Cent',
    pcgs_reference_name: 'Liberty Cap Half Cent (1793-1797)',
    start_year: 1793,
    end_year: 1797,
    display_order: 10,
    category: 'Half-Cents and Cents',
    sampleIssues: [
      { year: 1793, mint: 'P', issue_name: '1793 Left Cap' },
      { year: 1794, mint: 'P', issue_name: '1794 Normal Head' },
      { year: 1795, mint: 'P', issue_name: '1795 Lettered Edge' },
      { year: 1795, mint: 'P', issue_name: '1795 Plain Edge, No Pole' },
      { year: 1795, mint: 'P', issue_name: '1795 Plain Edge, With Pole' },
      { year: 1796, mint: 'P', issue_name: '1796 With Pole' },
      { year: 1796, mint: 'P', issue_name: '1796 No Pole' },
      { year: 1797, mint: 'P', issue_name: '1797 1 Above 1' },
      { year: 1797, mint: 'P', issue_name: '1797 Plain Edge' },
      { year: 1797, mint: 'P', issue_name: '1797 Lettered Edge' },
    ]
  },
  {
    id: 'draped-bust-half-cent',
    denomination_id: 'denom_half_cent',
    name: 'Draped Bust Half Cent',
    pcgs_reference_name: 'Draped Bust Half Cent (1800-1808)',
    start_year: 1800,
    end_year: 1808,
    display_order: 11,
    category: 'Half-Cents and Cents'
  },
  {
    id: 'classic-head-half-cent',
    denomination_id: 'denom_half_cent',
    name: 'Classic Head Half Cent',
    pcgs_reference_name: 'Classic Head Half Cent (1809-1836)',
    start_year: 1809,
    end_year: 1836,
    display_order: 12,
    category: 'Half-Cents and Cents'
  },
  {
    id: 'braided-hair-half-cent',
    denomination_id: 'denom_half_cent',
    name: 'Braided Hair Half Cent',
    pcgs_reference_name: 'Braided Hair Half Cent (1840-1857)',
    start_year: 1840,
    end_year: 1857,
    display_order: 13,
    category: 'Half-Cents and Cents'
  },
  {
    id: 'flowing-hair-large-cent',
    denomination_id: 'denom_cent',
    name: 'Flowing Hair Large Cent',
    pcgs_reference_name: 'Flowing Hair Large Cent (1793)',
    start_year: 1793,
    end_year: 1793,
    display_order: 14,
    category: 'Half-Cents and Cents',
    sampleIssues: [
      { year: 1793, mint: 'P', issue_name: '1793 Chain AMERI.' },
      { year: 1793, mint: 'P', issue_name: '1793 Chain AMERICA' },
      { year: 1793, mint: 'P', issue_name: '1793 Chain Periods' },
      { year: 1793, mint: 'P', issue_name: '1793 Wreath Vine/Bars' },
      { year: 1793, mint: 'P', issue_name: '1793 Wreath Lettered Edge' },
      { year: 1793, mint: 'P', issue_name: '1793 Wreath Strawberry Leaf' },
      { year: 1793, mint: 'P', issue_name: '1793 Liberty Cap' },
    ]
  },
  {
    id: 'draped-bust-cent',
    denomination_id: 'denom_cent',
    name: 'Draped Bust Cent',
    pcgs_reference_name: 'Draped Bust Cent (1796-1807)',
    start_year: 1796,
    end_year: 1807,
    display_order: 15,
    category: 'Half-Cents and Cents'
  },
  {
    id: 'classic-head-cent',
    denomination_id: 'denom_cent',
    name: 'Classic Head Cent',
    pcgs_reference_name: 'Classic Head Cent (1808-1814)',
    start_year: 1808,
    end_year: 1814,
    display_order: 16,
    category: 'Half-Cents and Cents'
  },
  {
    id: 'coronet-head-cent',
    denomination_id: 'denom_cent',
    name: 'Coronet Head Cent',
    pcgs_reference_name: 'Coronet Head Cent (1816-1839)',
    start_year: 1816,
    end_year: 1839,
    display_order: 17,
    category: 'Half-Cents and Cents'
  },
  {
    id: 'braided-hair-cent',
    denomination_id: 'denom_cent',
    name: 'Braided Hair Cent',
    pcgs_reference_name: 'Braided Hair Cent (1839-1857)',
    start_year: 1839,
    end_year: 1857,
    display_order: 18,
    category: 'Half-Cents and Cents'
  },
  {
    id: 'flying-eagle-cent',
    denomination_id: 'denom_cent',
    name: 'Flying Eagle Cent',
    pcgs_reference_name: 'Flying Eagle Cent (1856-1858)',
    start_year: 1856,
    end_year: 1858,
    display_order: 19,
    category: 'Half-Cents and Cents',
    sampleIssues: [
      { year: 1856, mint: 'P', issue_name: '1856 Flying Eagle' },
      { year: 1857, mint: 'P', issue_name: '1857 Flying Eagle' },
      { year: 1858, mint: 'P', issue_name: '1858 Small Letters' },
      { year: 1858, mint: 'P', issue_name: '1858 Large Letters' },
    ]
  },
  {
    id: 'indian-cent',
    denomination_id: 'denom_cent',
    name: 'Indian Cent',
    pcgs_reference_name: 'Indian Cent (1859-1909)',
    start_year: 1859,
    end_year: 1909,
    display_order: 20,
    category: 'Half-Cents and Cents',
    mints: ['P', 'S']
  },
  {
    id: 'lincoln-cent-wheat',
    denomination_id: 'denom_cent',
    name: 'Lincoln Cent (Wheat Reverse)',
    pcgs_reference_name: 'Lincoln Cent, Wheat Reverse (1909-1958)',
    start_year: 1909,
    end_year: 1958,
    display_order: 21,
    category: 'Half-Cents and Cents',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'lincoln-cent-modern',
    denomination_id: 'denom_cent',
    name: 'Lincoln Cent (Modern)',
    pcgs_reference_name: 'Lincoln Cent, Modern (1959-Date)',
    start_year: 1959,
    end_year: 2025,
    display_order: 22,
    category: 'Half-Cents and Cents',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'semiquincentennial-cent',
    denomination_id: 'denom_cent',
    name: 'Semiquincentennial Cent',
    pcgs_reference_name: 'Semiquincentennial Cent (2026)',
    start_year: 2026,
    end_year: 2026,
    display_order: 23,
    category: 'Half-Cents and Cents',
    sampleIssues: [
      { year: 2026, mint: 'P', issue_name: '2026-P 250th Anniversary Cent' },
      { year: 2026, mint: 'D', issue_name: '2026-D 250th Anniversary Cent' },
      { year: 2026, mint: 'S', issue_name: '2026-S Proof Semiquincentennial Cent' },
    ]
  },

  // Two and Three Cents
  {
    id: 'two-cent',
    denomination_id: 'denom_two_three',
    name: 'Two Cent',
    pcgs_reference_name: 'Two Cent (1864-1873)',
    start_year: 1864,
    end_year: 1873,
    display_order: 30,
    category: 'Two and Three Cents'
  },
  {
    id: 'three-cent-silver',
    denomination_id: 'denom_two_three',
    name: 'Three Cent Silver',
    pcgs_reference_name: 'Three Cent Silver (1851-1873)',
    start_year: 1851,
    end_year: 1873,
    display_order: 31,
    category: 'Two and Three Cents'
  },
  {
    id: 'three-cent-nickel',
    denomination_id: 'denom_two_three',
    name: 'Three Cent Nickel',
    pcgs_reference_name: 'Three Cent Nickel (1865-1889)',
    start_year: 1865,
    end_year: 1889,
    display_order: 32,
    category: 'Two and Three Cents'
  },

  // Nickels
  {
    id: 'shield-nickel',
    denomination_id: 'denom_nickel',
    name: 'Shield Nickel',
    pcgs_reference_name: 'Shield Nickel (1866-1883)',
    start_year: 1866,
    end_year: 1883,
    display_order: 40,
    category: 'Nickels'
  },
  {
    id: 'liberty-nickel',
    denomination_id: 'denom_nickel',
    name: 'Liberty Nickel',
    pcgs_reference_name: 'Liberty Nickel (1883-1913)',
    start_year: 1883,
    end_year: 1913,
    display_order: 41,
    category: 'Nickels'
  },
  {
    id: 'buffalo-nickel',
    denomination_id: 'denom_nickel',
    name: 'Buffalo Nickel',
    pcgs_reference_name: 'Buffalo Nickel (1913-1938)',
    start_year: 1913,
    end_year: 1938,
    display_order: 42,
    category: 'Nickels',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'jefferson-nickel',
    denomination_id: 'denom_nickel',
    name: 'Jefferson Nickel',
    pcgs_reference_name: 'Jefferson Nickel (1938-Date)',
    start_year: 1938,
    end_year: 2025,
    display_order: 43,
    category: 'Nickels',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'semiquincentennial-nickel',
    denomination_id: 'denom_nickel',
    name: 'Semiquincentennial Nickel',
    pcgs_reference_name: 'Semiquincentennial Nickel (2026)',
    start_year: 2026,
    end_year: 2026,
    display_order: 44,
    category: 'Nickels',
    sampleIssues: [
      { year: 2026, mint: 'P', issue_name: '2026-P Semiquincentennial Nickel' },
      { year: 2026, mint: 'D', issue_name: '2026-D Semiquincentennial Nickel' },
      { year: 2026, mint: 'S', issue_name: '2026-S Proof Semiquincentennial Nickel' },
    ]
  },

  // Half-Dimes and Dimes
  {
    id: 'bust-half-dime',
    denomination_id: 'denom_half_dime',
    name: 'Bust Half Dime',
    pcgs_reference_name: 'Bust Half Dime (1792)',
    start_year: 1792,
    end_year: 1792,
    display_order: 50,
    category: 'Half-Dimes and Dimes'
  },
  {
    id: 'flowing-hair-half-dime',
    denomination_id: 'denom_half_dime',
    name: 'Flowing Hair Half Dime',
    pcgs_reference_name: 'Flowing Hair Half Dime (1794-1795)',
    start_year: 1794,
    end_year: 1795,
    display_order: 51,
    category: 'Half-Dimes and Dimes'
  },
  {
    id: 'draped-bust-half-dime',
    denomination_id: 'denom_half_dime',
    name: 'Draped Bust Half Dime',
    pcgs_reference_name: 'Draped Bust Half Dime (1796-1805)',
    start_year: 1796,
    end_year: 1805,
    display_order: 52,
    category: 'Half-Dimes and Dimes'
  },
  {
    id: 'capped-bust-half-dime',
    denomination_id: 'denom_half_dime',
    name: 'Capped Bust Half Dime',
    pcgs_reference_name: 'Capped Bust Half Dime (1829-1837)',
    start_year: 1829,
    end_year: 1837,
    display_order: 53,
    category: 'Half-Dimes and Dimes'
  },
  {
    id: 'liberty-seated-half-dime',
    denomination_id: 'denom_half_dime',
    name: 'Liberty Seated Half Dime',
    pcgs_reference_name: 'Liberty Seated Half Dime (1837-1873)',
    start_year: 1837,
    end_year: 1873,
    display_order: 54,
    category: 'Half-Dimes and Dimes'
  },
  {
    id: 'draped-bust-dime',
    denomination_id: 'denom_dime',
    name: 'Draped Bust Dime',
    pcgs_reference_name: 'Draped Bust Dime (1796-1807)',
    start_year: 1796,
    end_year: 1807,
    display_order: 55,
    category: 'Half-Dimes and Dimes'
  },
  {
    id: 'capped-bust-dime',
    denomination_id: 'denom_dime',
    name: 'Capped Bust Dime',
    pcgs_reference_name: 'Capped Bust Dime (1809-1837)',
    start_year: 1809,
    end_year: 1837,
    display_order: 56,
    category: 'Half-Dimes and Dimes'
  },
  {
    id: 'liberty-seated-dime',
    denomination_id: 'denom_dime',
    name: 'Liberty Seated Dime',
    pcgs_reference_name: 'Liberty Seated Dime (1837-1891)',
    start_year: 1837,
    end_year: 1891,
    display_order: 57,
    category: 'Half-Dimes and Dimes'
  },
  {
    id: 'barber-dime',
    denomination_id: 'denom_dime',
    name: 'Barber Dime',
    pcgs_reference_name: 'Barber Dime (1892-1916)',
    start_year: 1892,
    end_year: 1916,
    display_order: 58,
    category: 'Half-Dimes and Dimes',
    mints: ['P', 'D', 'O', 'S']
  },
  {
    id: 'mercury-dime',
    denomination_id: 'denom_dime',
    name: 'Mercury Dime',
    pcgs_reference_name: 'Mercury Dime (1916-1945)',
    start_year: 1916,
    end_year: 1945,
    display_order: 59,
    category: 'Half-Dimes and Dimes',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'roosevelt-dime',
    denomination_id: 'denom_dime',
    name: 'Roosevelt Dime',
    pcgs_reference_name: 'Roosevelt Dime (1946-Date)',
    start_year: 1946,
    end_year: 2025,
    display_order: 60,
    category: 'Half-Dimes and Dimes',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'semiquincentennial-dime',
    denomination_id: 'denom_dime',
    name: 'Semiquincentennial Dime',
    pcgs_reference_name: 'Semiquincentennial Dime (2026)',
    start_year: 2026,
    end_year: 2026,
    display_order: 61,
    category: 'Half-Dimes and Dimes',
    sampleIssues: [
      { year: 2026, mint: 'P', issue_name: '2026-P Semiquincentennial Dime' },
      { year: 2026, mint: 'D', issue_name: '2026-D Semiquincentennial Dime' },
      { year: 2026, mint: 'S', issue_name: '2026-S Proof Semiquincentennial Dime' },
    ]
  },

  // Twenty Cents and Quarters
  {
    id: 'twenty-cent',
    denomination_id: 'denom_twenty',
    name: 'Twenty Cent',
    pcgs_reference_name: 'Twenty Cent (1875-1878)',
    start_year: 1875,
    end_year: 1878,
    display_order: 70,
    category: 'Twenty Cents and Quarters'
  },
  {
    id: 'draped-bust-quarter',
    denomination_id: 'denom_quarter',
    name: 'Draped Bust Quarter',
    pcgs_reference_name: 'Draped Bust Quarter (1796-1807)',
    start_year: 1796,
    end_year: 1807,
    display_order: 71,
    category: 'Twenty Cents and Quarters'
  },
  {
    id: 'capped-bust-quarter',
    denomination_id: 'denom_quarter',
    name: 'Capped Bust Quarter',
    pcgs_reference_name: 'Capped Bust Quarter (1815-1838)',
    start_year: 1815,
    end_year: 1838,
    display_order: 72,
    category: 'Twenty Cents and Quarters'
  },
  {
    id: 'liberty-seated-quarter',
    denomination_id: 'denom_quarter',
    name: 'Liberty Seated Quarter',
    pcgs_reference_name: 'Liberty Seated Quarter (1838-1891)',
    start_year: 1838,
    end_year: 1891,
    display_order: 73,
    category: 'Twenty Cents and Quarters'
  },
  {
    id: 'barber-quarter',
    denomination_id: 'denom_quarter',
    name: 'Barber Quarter',
    pcgs_reference_name: 'Barber Quarter (1892-1916)',
    start_year: 1892,
    end_year: 1916,
    display_order: 74,
    category: 'Twenty Cents and Quarters',
    mints: ['P', 'D', 'O', 'S']
  },
  {
    id: 'standing-liberty-quarter',
    denomination_id: 'denom_quarter',
    name: 'Standing Liberty Quarter',
    pcgs_reference_name: 'Standing Liberty Quarter (1916-1930)',
    start_year: 1916,
    end_year: 1930,
    display_order: 75,
    category: 'Twenty Cents and Quarters',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'washington-quarter',
    denomination_id: 'denom_quarter',
    name: 'Washington Quarter',
    pcgs_reference_name: 'Washington Quarter (1932-1998)',
    start_year: 1932,
    end_year: 1998,
    display_order: 76,
    category: 'Twenty Cents and Quarters',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'washington-50-states-quarters',
    denomination_id: 'denom_quarter',
    name: 'Washington 50 States Quarters',
    pcgs_reference_name: 'Washington 50 States Quarters (1999-2008)',
    start_year: 1999,
    end_year: 2008,
    display_order: 77,
    category: 'Twenty Cents and Quarters'
  },
  {
    id: 'washington-dc-territories-quarters',
    denomination_id: 'denom_quarter',
    name: 'Washington D.C. and U.S. Territories Quarters',
    pcgs_reference_name: 'Washington D.C. and U.S. Territories Quarters (2009)',
    start_year: 2009,
    end_year: 2009,
    display_order: 78,
    category: 'Twenty Cents and Quarters'
  },
  {
    id: 'washington-america-the-beautiful-quarters',
    denomination_id: 'denom_quarter',
    name: 'Washington America the Beautiful Quarters',
    pcgs_reference_name: 'Washington America the Beautiful Quarters (2010-2021)',
    start_year: 2010,
    end_year: 2021,
    display_order: 79,
    category: 'Twenty Cents and Quarters'
  },
  {
    id: 'washington-crossing-delaware-quarters',
    denomination_id: 'denom_quarter',
    name: 'Washington Crossing the Delaware Quarters',
    pcgs_reference_name: 'Washington Crossing the Delaware Quarters (2021)',
    start_year: 2021,
    end_year: 2021,
    display_order: 80,
    category: 'Twenty Cents and Quarters'
  },
  {
    id: 'american-women-quarters',
    denomination_id: 'denom_quarter',
    name: 'American Women Quarters',
    pcgs_reference_name: 'American Women Quarters (2022-2025)',
    start_year: 2022,
    end_year: 2025,
    display_order: 81,
    category: 'Twenty Cents and Quarters'
  },
  {
    id: 'semiquincentennial-quarters',
    denomination_id: 'denom_quarter',
    name: 'Semiquincentennial Quarters',
    pcgs_reference_name: 'Semiquincentennial Quarters (2026)',
    start_year: 2026,
    end_year: 2026,
    display_order: 82,
    category: 'Twenty Cents and Quarters',
    sampleIssues: [
      { year: 2026, mint: 'P', issue_name: '2026-P Semiquincentennial Quarter' },
      { year: 2026, mint: 'D', issue_name: '2026-D Semiquincentennial Quarter' },
      { year: 2026, mint: 'S', issue_name: '2026-S Proof Semiquincentennial Quarter' },
    ]
  },

  // Half Dollars
  {
    id: 'flowing-hair-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Flowing Hair Half Dollar',
    pcgs_reference_name: 'Flowing Hair Half Dollar (1794-1795)',
    start_year: 1794,
    end_year: 1795,
    display_order: 90,
    category: 'Half Dollars'
  },
  {
    id: 'draped-bust-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Draped Bust Half Dollar',
    pcgs_reference_name: 'Draped Bust Half Dollar (1796-1807)',
    start_year: 1796,
    end_year: 1807,
    display_order: 91,
    category: 'Half Dollars'
  },
  {
    id: 'capped-bust-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Capped Bust Half Dollar',
    pcgs_reference_name: 'Capped Bust Half Dollar (1807-1839)',
    start_year: 1807,
    end_year: 1839,
    display_order: 92,
    category: 'Half Dollars'
  },
  {
    id: 'liberty-seated-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Liberty Seated Half Dollar',
    pcgs_reference_name: 'Liberty Seated Half Dollar (1839-1891)',
    start_year: 1839,
    end_year: 1891,
    display_order: 93,
    category: 'Half Dollars'
  },
  {
    id: 'barber-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Barber Half Dollar',
    pcgs_reference_name: 'Barber Half Dollar (1892-1915)',
    start_year: 1892,
    end_year: 1915,
    display_order: 94,
    category: 'Half Dollars',
    mints: ['P', 'D', 'O', 'S']
  },
  {
    id: 'walking-liberty-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Walking Liberty Half Dollar',
    pcgs_reference_name: 'Walking Liberty Half Dollar (1916-1947)',
    start_year: 1916,
    end_year: 1947,
    display_order: 95,
    category: 'Half Dollars',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'franklin-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Franklin Half Dollar',
    pcgs_reference_name: 'Franklin Half Dollar (1948-1963)',
    start_year: 1948,
    end_year: 1963,
    display_order: 96,
    category: 'Half Dollars',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'kennedy-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Kennedy Half Dollar',
    pcgs_reference_name: 'Kennedy Half Dollar (1964-Date)',
    start_year: 1964,
    end_year: 2025,
    display_order: 97,
    category: 'Half Dollars',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'semiquincentennial-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Semiquincentennial Half Dollar',
    pcgs_reference_name: 'Semiquincentennial Half Dollar (2026)',
    start_year: 2026,
    end_year: 2026,
    display_order: 98,
    category: 'Half Dollars',
    sampleIssues: [
      { year: 2026, mint: 'P', issue_name: '2026-P Semiquincentennial Half Dollar' },
      { year: 2026, mint: 'D', issue_name: '2026-D Semiquincentennial Half Dollar' },
      { year: 2026, mint: 'S', issue_name: '2026-S Proof Semiquincentennial Half Dollar' },
    ]
  },

  // Dollars
  {
    id: 'flowing-hair-dollar',
    denomination_id: 'denom_dollar',
    name: 'Flowing Hair Dollar',
    pcgs_reference_name: 'Flowing Hair Dollar (1794-1795)',
    start_year: 1794,
    end_year: 1795,
    display_order: 110,
    category: 'Dollars'
  },
  {
    id: 'draped-bust-dollar',
    denomination_id: 'denom_dollar',
    name: 'Draped Bust Dollar',
    pcgs_reference_name: 'Draped Bust Dollar (1795-1804)',
    start_year: 1795,
    end_year: 1804,
    display_order: 111,
    category: 'Dollars'
  },
  {
    id: 'liberty-seated-dollar',
    denomination_id: 'denom_dollar',
    name: 'Liberty Seated Dollar',
    pcgs_reference_name: 'Liberty Seated Dollar (1840-1873)',
    start_year: 1840,
    end_year: 1873,
    display_order: 112,
    category: 'Dollars'
  },
  {
    id: 'trade-dollar',
    denomination_id: 'denom_dollar',
    name: 'Trade Dollar',
    pcgs_reference_name: 'Trade Dollar (1873-1885)',
    start_year: 1873,
    end_year: 1885,
    display_order: 113,
    category: 'Dollars'
  },
  {
    id: 'morgan-dollar',
    denomination_id: 'denom_dollar',
    name: 'Morgan Dollar',
    pcgs_reference_name: 'Morgan Dollar (1878-1921)',
    start_year: 1878,
    end_year: 1921,
    display_order: 114,
    category: 'Dollars',
    mints: ['P', 'CC', 'O', 'S', 'D']
  },
  {
    id: 'peace-dollar',
    denomination_id: 'denom_dollar',
    name: 'Peace Dollar',
    pcgs_reference_name: 'Peace Dollar (1921-1935)',
    start_year: 1921,
    end_year: 1935,
    display_order: 115,
    category: 'Dollars',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'ike-dollar',
    denomination_id: 'denom_dollar',
    name: 'Ike Dollar',
    pcgs_reference_name: 'Eisenhower Dollar (1971-1978)',
    start_year: 1971,
    end_year: 1978,
    display_order: 116,
    category: 'Dollars',
    mints: ['P', 'D', 'S']
  },
  {
    id: 'susan-b-anthony-dollar',
    denomination_id: 'denom_dollar',
    name: 'Susan B. Anthony Dollar',
    pcgs_reference_name: 'Susan B. Anthony Dollar (1979-1999)',
    start_year: 1979,
    end_year: 1999,
    display_order: 117,
    category: 'Dollars'
  },
  {
    id: 'sacagawea-dollar',
    denomination_id: 'denom_dollar',
    name: 'Sacagawea Dollar',
    pcgs_reference_name: 'Sacagawea Dollar (2000-Date)',
    start_year: 2000,
    end_year: 2025,
    display_order: 118,
    category: 'Dollars'
  },
  {
    id: 'presidential-dollars',
    denomination_id: 'denom_dollar',
    name: 'Presidential Dollars',
    pcgs_reference_name: 'Presidential Dollars (2007-2020)',
    start_year: 2007,
    end_year: 2020,
    display_order: 119,
    category: 'Dollars'
  },
  {
    id: 'american-innovation-dollar',
    denomination_id: 'denom_dollar',
    name: 'American Innovation Dollar',
    pcgs_reference_name: 'American Innovation Dollar (2018-Date)',
    start_year: 2018,
    end_year: 2025,
    display_order: 120,
    category: 'Dollars'
  },
  {
    id: 'morgan-peace-dollar-reproductions',
    denomination_id: 'denom_dollar',
    name: 'Morgan and Peace Dollar Reproductions',
    pcgs_reference_name: 'Modern Morgan and Peace Dollars (2021-Date)',
    start_year: 2021,
    end_year: 2025,
    display_order: 121,
    category: 'Dollars'
  },

  // Gold Coins
  {
    id: 'gold-dollar',
    denomination_id: 'denom_gold',
    name: 'Gold Dollar',
    pcgs_reference_name: 'Gold Dollar (1849-1889)',
    start_year: 1849,
    end_year: 1889,
    display_order: 130,
    category: 'Gold Coins'
  },
  {
    id: 'draped-bust-2-5',
    denomination_id: 'denom_gold',
    name: 'Draped Bust $2.5',
    pcgs_reference_name: 'Draped Bust $2.50 (1796-1807)',
    start_year: 1796,
    end_year: 1807,
    display_order: 131,
    category: 'Gold Coins'
  },
  {
    id: 'capped-bust-2-5',
    denomination_id: 'denom_gold',
    name: 'Capped Bust $2.5',
    pcgs_reference_name: 'Capped Bust $2.50 (1808-1834)',
    start_year: 1808,
    end_year: 1834,
    display_order: 132,
    category: 'Gold Coins'
  },
  {
    id: 'classic-head-2-5',
    denomination_id: 'denom_gold',
    name: 'Classic Head $2.5',
    pcgs_reference_name: 'Classic Head $2.50 (1834-1839)',
    start_year: 1834,
    end_year: 1839,
    display_order: 133,
    category: 'Gold Coins'
  },
  {
    id: 'liberty-head-2-5',
    denomination_id: 'denom_gold',
    name: 'Liberty Head $2.5',
    pcgs_reference_name: 'Liberty Head $2.50 (1840-1907)',
    start_year: 1840,
    end_year: 1907,
    display_order: 134,
    category: 'Gold Coins'
  },
  {
    id: 'indian-2-5',
    denomination_id: 'denom_gold',
    name: 'Indian $2.5',
    pcgs_reference_name: 'Indian $2.50 (1908-1929)',
    start_year: 1908,
    end_year: 1929,
    display_order: 135,
    category: 'Gold Coins'
  },
  {
    id: 'three-dollar',
    denomination_id: 'denom_gold',
    name: 'Three Dollar',
    pcgs_reference_name: 'Three Dollar Gold Piece (1854-1889)',
    start_year: 1854,
    end_year: 1889,
    display_order: 136,
    category: 'Gold Coins'
  },
  {
    id: '4-stella',
    denomination_id: 'denom_gold',
    name: '$4 Stella',
    pcgs_reference_name: '$4 Stella Pattern (1879-1880)',
    start_year: 1879,
    end_year: 1880,
    display_order: 137,
    category: 'Gold Coins'
  },
  {
    id: 'draped-bust-5',
    denomination_id: 'denom_gold',
    name: 'Draped Bust $5',
    pcgs_reference_name: 'Draped Bust $5 (1795-1807)',
    start_year: 1795,
    end_year: 1807,
    display_order: 138,
    category: 'Gold Coins'
  },
  {
    id: 'capped-bust-5',
    denomination_id: 'denom_gold',
    name: 'Capped Bust $5',
    pcgs_reference_name: 'Capped Bust $5 (1807-1834)',
    start_year: 1807,
    end_year: 1834,
    display_order: 139,
    category: 'Gold Coins'
  },
  {
    id: 'classic-head-5',
    denomination_id: 'denom_gold',
    name: 'Classic Head $5',
    pcgs_reference_name: 'Classic Head $5 (1834-1838)',
    start_year: 1834,
    end_year: 1838,
    display_order: 140,
    category: 'Gold Coins'
  },
  {
    id: 'liberty-head-5',
    denomination_id: 'denom_gold',
    name: 'Liberty Head $5',
    pcgs_reference_name: 'Liberty Head $5 (1839-1908)',
    start_year: 1839,
    end_year: 1908,
    display_order: 141,
    category: 'Gold Coins'
  },
  {
    id: 'indian-5',
    denomination_id: 'denom_gold',
    name: 'Indian $5',
    pcgs_reference_name: 'Indian $5 (1908-1929)',
    start_year: 1908,
    end_year: 1929,
    display_order: 142,
    category: 'Gold Coins'
  },
  {
    id: 'draped-bust-10',
    denomination_id: 'denom_gold',
    name: 'Draped Bust $10',
    pcgs_reference_name: 'Draped Bust $10 (1795-1804)',
    start_year: 1795,
    end_year: 1804,
    display_order: 143,
    category: 'Gold Coins'
  },
  {
    id: 'liberty-head-10',
    denomination_id: 'denom_gold',
    name: 'Liberty Head $10',
    pcgs_reference_name: 'Liberty Head $10 (1838-1907)',
    start_year: 1838,
    end_year: 1907,
    display_order: 144,
    category: 'Gold Coins'
  },
  {
    id: 'indian-10',
    denomination_id: 'denom_gold',
    name: 'Indian $10',
    pcgs_reference_name: 'Indian $10 (1907-1933)',
    start_year: 1907,
    end_year: 1933,
    display_order: 145,
    category: 'Gold Coins'
  },
  {
    id: 'liberty-head-20',
    denomination_id: 'denom_gold',
    name: 'Liberty Head $20',
    pcgs_reference_name: 'Liberty Head $20 Double Eagle (1849-1907)',
    start_year: 1849,
    end_year: 1907,
    display_order: 146,
    category: 'Gold Coins'
  },
  {
    id: 'st-gaudens-20',
    denomination_id: 'denom_gold',
    name: 'St. Gaudens $20',
    pcgs_reference_name: 'Saint-Gaudens $20 Double Eagle (1907-1933)',
    start_year: 1907,
    end_year: 1933,
    display_order: 147,
    category: 'Gold Coins',
    mints: ['P', 'D', 'S']
  },

  // Commemoratives
  {
    id: 'silver-commemorative',
    denomination_id: 'denom_commem',
    name: 'Silver Commemorative',
    pcgs_reference_name: 'Early Silver Commemoratives (1892-1954)',
    start_year: 1892,
    end_year: 1954,
    display_order: 160,
    category: 'Commemoratives',
    sampleIssues: [
      { year: 1892, mint: 'P', issue_name: '1892 Columbian Exposition' },
      { year: 1893, mint: 'P', issue_name: '1893 Isabella Quarter' },
      { year: 1900, mint: 'P', issue_name: '1900 Lafayette Dollar' },
      { year: 1915, mint: 'S', issue_name: '1915-S Panama-Pacific Half' },
      { year: 1918, mint: 'P', issue_name: '1918 Illinois-Lincoln' },
      { year: 1920, mint: 'P', issue_name: '1920 Maine Centennial' },
      { year: 1921, mint: 'P', issue_name: '1921 Pilgrim Tercentenary' },
      { year: 1925, mint: 'P', issue_name: '1925 Stone Mountain' },
      { year: 1926, mint: 'P', issue_name: '1926 Sesquicentennial Half' },
      { year: 1936, mint: 'P', issue_name: '1936 Bridgeport Centennial' },
      { year: 1946, mint: 'P', issue_name: '1946 Iowa Centennial' },
      { year: 1952, mint: 'P', issue_name: '1952 Carver-Washington' },
    ]
  },
  {
    id: 'gold-commemorative',
    denomination_id: 'denom_commem',
    name: 'Gold Commemorative',
    pcgs_reference_name: 'Early Gold Commemoratives (1903-1926)',
    start_year: 1903,
    end_year: 1926,
    display_order: 161,
    category: 'Commemoratives'
  },
  {
    id: 'modern-silver-clad-commemoratives',
    denomination_id: 'denom_commem',
    name: 'Modern Silver and Clad Commemoratives',
    pcgs_reference_name: 'Modern Silver and Clad Commemoratives (1982-Date)',
    start_year: 1982,
    end_year: 2025,
    display_order: 162,
    category: 'Commemoratives'
  },
  {
    id: 'modern-gold-commemorative',
    denomination_id: 'denom_commem',
    name: 'Modern Gold Commemorative',
    pcgs_reference_name: 'Modern Gold Commemorative (1984-Date)',
    start_year: 1984,
    end_year: 2025,
    display_order: 163,
    category: 'Commemoratives'
  },
  {
    id: 'modern-commemorative-medals',
    denomination_id: 'denom_commem',
    name: 'Modern Commemorative Medals',
    pcgs_reference_name: 'Modern Commemorative Medals',
    start_year: 1980,
    end_year: 2025,
    display_order: 164,
    category: 'Commemoratives'
  },
  {
    id: '2016-centennial-series',
    denomination_id: 'denom_commem',
    name: '2016 Centennial Series',
    pcgs_reference_name: '2016 Centennial Gold Coin Series',
    start_year: 2016,
    end_year: 2016,
    display_order: 165,
    category: 'Commemoratives',
    sampleIssues: [
      { year: 2016, mint: 'W', issue_name: '2016-W Mercury Dime Centennial Gold' },
      { year: 2016, mint: 'W', issue_name: '2016-W Standing Liberty Quarter Centennial Gold' },
      { year: 2016, mint: 'W', issue_name: '2016-W Walking Liberty Half Centennial Gold' },
    ]
  },
  {
    id: 'norse-medal',
    denomination_id: 'denom_commem',
    name: 'Norse Medal',
    pcgs_reference_name: 'Norse-American Centennial Medals (1925)',
    start_year: 1925,
    end_year: 1925,
    display_order: 166,
    category: 'Commemoratives',
    sampleIssues: [
      { year: 1925, mint: 'P', issue_name: '1925 Norse Thick Silver' },
      { year: 1925, mint: 'P', issue_name: '1925 Norse Thin Silver' },
      { year: 1925, mint: 'P', issue_name: '1925 Norse Gold' },
    ]
  },
  {
    id: 'best-of-the-mint',
    denomination_id: 'denom_commem',
    name: 'Best of the Mint (Semiquincentennial)',
    pcgs_reference_name: 'Best of the Mint Semiquincentennial Series (2026)',
    start_year: 2026,
    end_year: 2026,
    display_order: 167,
    category: 'Commemoratives',
    sampleIssues: [
      { year: 2026, mint: 'W', issue_name: '2026-W Best of the Mint Gold Flowing Hair' },
      { year: 2026, mint: 'P', issue_name: '2026-P Best of the Mint Silver Libertas Americana' },
      { year: 2026, mint: 'S', issue_name: '2026-S Best of the Mint Ultra-High Relief Proof' },
    ]
  },
];

// Helper to generate issues for series
export function generateIssuesForSeries(series: SeedSeries): { year: number; mint: string; issue_name: string }[] {
  if (series.sampleIssues && series.sampleIssues.length > 0) {
    return series.sampleIssues;
  }

  // Specific comprehensive issue list for Indian Cent (1859 - 1909)
  if (series.id === 'indian-cent') {
    const list: { year: number; mint: string; issue_name: string }[] = [];
    list.push({ year: 1859, mint: '', issue_name: '1859' });
    list.push({ year: 1860, mint: '', issue_name: '1860' });
    list.push({ year: 1861, mint: '', issue_name: '1861' });
    list.push({ year: 1862, mint: '', issue_name: '1862' });
    list.push({ year: 1863, mint: '', issue_name: '1863' });
    list.push({ year: 1864, mint: '', issue_name: '1864 Copper-Nickel' });
    list.push({ year: 1864, mint: '', issue_name: '1864 Bronze' });
    list.push({ year: 1864, mint: '', issue_name: '1864-L on Ribbon' });
    for (let y = 1865; y <= 1907; y++) {
      if (y === 1886) {
        list.push({ year: 1886, mint: '', issue_name: '1886 Variety 1' });
        list.push({ year: 1886, mint: '', issue_name: '1886 Variety 2' });
      } else {
        list.push({ year: y, mint: '', issue_name: `${y}` });
      }
    }
    list.push({ year: 1908, mint: '', issue_name: '1908' });
    list.push({ year: 1908, mint: 'S', issue_name: '1908-S' });
    list.push({ year: 1909, mint: '', issue_name: '1909' });
    list.push({ year: 1909, mint: 'S', issue_name: '1909-S' });
    return list;
  }

  // Specific issue list for Morgan Dollar (1878 - 1921)
  if (series.id === 'morgan-dollar') {
    const morganIssues: { year: number; mint: string; issue_name: string }[] = [
      { year: 1878, mint: 'P', issue_name: '1878 8 Tail Feathers' },
      { year: 1878, mint: 'P', issue_name: '1878 7 Tail Feathers' },
      { year: 1878, mint: 'CC', issue_name: '1878-CC' },
      { year: 1878, mint: 'S', issue_name: '1878-S' },
      { year: 1879, mint: 'P', issue_name: '1879' },
      { year: 1879, mint: 'CC', issue_name: '1879-CC' },
      { year: 1879, mint: 'O', issue_name: '1879-O' },
      { year: 1879, mint: 'S', issue_name: '1879-S' },
      { year: 1880, mint: 'P', issue_name: '1880' },
      { year: 1880, mint: 'CC', issue_name: '1880-CC' },
      { year: 1880, mint: 'O', issue_name: '1880-O' },
      { year: 1880, mint: 'S', issue_name: '1880-S' },
      { year: 1881, mint: 'P', issue_name: '1881' },
      { year: 1881, mint: 'CC', issue_name: '1881-CC' },
      { year: 1881, mint: 'O', issue_name: '1881-O' },
      { year: 1881, mint: 'S', issue_name: '1881-S' },
      { year: 1882, mint: 'P', issue_name: '1882' },
      { year: 1882, mint: 'CC', issue_name: '1882-CC' },
      { year: 1882, mint: 'O', issue_name: '1882-O' },
      { year: 1882, mint: 'S', issue_name: '1882-S' },
      { year: 1883, mint: 'P', issue_name: '1883' },
      { year: 1883, mint: 'CC', issue_name: '1883-CC' },
      { year: 1883, mint: 'O', issue_name: '1883-O' },
      { year: 1883, mint: 'S', issue_name: '1883-S' },
      { year: 1884, mint: 'P', issue_name: '1884' },
      { year: 1884, mint: 'CC', issue_name: '1884-CC' },
      { year: 1884, mint: 'O', issue_name: '1884-O' },
      { year: 1884, mint: 'S', issue_name: '1884-S' },
      { year: 1885, mint: 'P', issue_name: '1885' },
      { year: 1885, mint: 'CC', issue_name: '1885-CC' },
      { year: 1885, mint: 'O', issue_name: '1885-O' },
      { year: 1885, mint: 'S', issue_name: '1885-S' },
      { year: 1889, mint: 'CC', issue_name: '1889-CC Key Date' },
      { year: 1893, mint: 'S', issue_name: '1893-S Key Date' },
      { year: 1895, mint: 'P', issue_name: '1895 King of Morgans' },
      { year: 1895, mint: 'O', issue_name: '1895-O' },
      { year: 1895, mint: 'S', issue_name: '1895-S' },
      { year: 1904, mint: 'O', issue_name: '1904-O' },
      { year: 1921, mint: 'P', issue_name: '1921' },
      { year: 1921, mint: 'D', issue_name: '1921-D' },
      { year: 1921, mint: 'S', issue_name: '1921-S' },
    ];
    return morganIssues;
  }

  // Buffalo Nickel (1913 - 1938)
  if (series.id === 'buffalo-nickel') {
    const list: { year: number; mint: string; issue_name: string }[] = [];
    list.push({ year: 1913, mint: 'P', issue_name: '1913 Type 1' });
    list.push({ year: 1913, mint: 'D', issue_name: '1913-D Type 1' });
    list.push({ year: 1913, mint: 'S', issue_name: '1913-S Type 1' });
    list.push({ year: 1913, mint: 'P', issue_name: '1913 Type 2' });
    list.push({ year: 1913, mint: 'D', issue_name: '1913-D Type 2' });
    list.push({ year: 1913, mint: 'S', issue_name: '1913-S Type 2' });
    for (let y = 1914; y <= 1938; y++) {
      list.push({ year: y, mint: 'P', issue_name: `${y}` });
      if (y % 2 === 0 || y === 1937 || y === 1938) {
        list.push({ year: y, mint: 'D', issue_name: `${y}-D` });
        list.push({ year: y, mint: 'S', issue_name: `${y}-S` });
      }
      if (y === 1937) {
        list.push({ year: 1937, mint: 'D', issue_name: '1937-D 3-Legged' });
      }
    }
    return list;
  }

  // Lincoln Cent Wheat Reverse (1909 - 1958)
  if (series.id === 'lincoln-cent-wheat') {
    const list: { year: number; mint: string; issue_name: string }[] = [
      { year: 1909, mint: 'P', issue_name: '1909 VDB' },
      { year: 1909, mint: 'S', issue_name: '1909-S VDB' },
      { year: 1909, mint: 'P', issue_name: '1909' },
      { year: 1909, mint: 'S', issue_name: '1909-S' },
      { year: 1910, mint: 'P', issue_name: '1910' },
      { year: 1910, mint: 'S', issue_name: '1910-S' },
      { year: 1911, mint: 'P', issue_name: '1911' },
      { year: 1911, mint: 'D', issue_name: '1911-D' },
      { year: 1911, mint: 'S', issue_name: '1911-S' },
      { year: 1912, mint: 'P', issue_name: '1912' },
      { year: 1912, mint: 'D', issue_name: '1912-D' },
      { year: 1912, mint: 'S', issue_name: '1912-S' },
      { year: 1914, mint: 'D', issue_name: '1914-D Key Date' },
      { year: 1922, mint: 'D', issue_name: '1922 No D' },
      { year: 1931, mint: 'S', issue_name: '1931-S Key Date' },
      { year: 1943, mint: 'P', issue_name: '1943 Steel' },
      { year: 1943, mint: 'D', issue_name: '1943-D Steel' },
      { year: 1943, mint: 'S', issue_name: '1943-S Steel' },
      { year: 1955, mint: 'P', issue_name: '1955 Double Die' },
      { year: 1958, mint: 'D', issue_name: '1958-D' },
    ];
    return list;
  }

  // Generic generator for other series
  const results: { year: number; mint: string; issue_name: string }[] = [];
  const start = series.start_year;
  const end = Math.min(series.end_year, 2026);
  const mints = series.mints && series.mints.length > 0 ? series.mints : [''];

  // Keep total issues per series balanced (between 10 and 45 issues)
  const span = end - start + 1;
  const step = span > 40 ? Math.ceil(span / 30) : 1;

  for (let y = start; y <= end; y += step) {
    for (const m of mints) {
      const mintSuffix = m ? `-${m}` : '';
      results.push({
        year: y,
        mint: m,
        issue_name: `${y}${mintSuffix}`
      });
      if (results.length >= 60) break;
    }
    if (results.length >= 60) break;
  }

  // Ensure at least 4 issues
  if (results.length === 0) {
    results.push({ year: start, mint: '', issue_name: `${start}` });
  }

  return results;
}
