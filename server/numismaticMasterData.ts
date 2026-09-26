export interface MasterDenomination {
  id: string;
  name: string;
  category: string;
  display_order: number;
  icon_label: string;
  description: string;
}

export interface MasterSeriesDefinition {
  id: string;
  denomination_id: string;
  name: string;
  pcgs_reference_name: string;
  start_year: number;
  end_year: number;
  display_order: number;
  category: string;
  designer?: string;
  composition_summary?: string;
  description?: string;
}

export const MASTER_DENOMINATIONS: MasterDenomination[] = [
  { id: 'denom_half_cent', name: 'Half Cents', category: 'Cents', display_order: 1, icon_label: '½¢', description: 'Lowest federal coin denomination authorized by Coinage Act of 1792' },
  { id: 'denom_cent', name: 'One Cent', category: 'Cents', display_order: 2, icon_label: '1¢', description: 'From the 1787 Fugio Cent to the 2026 Semiquincentennial' },
  { id: 'denom_two_cent', name: 'Two Cent', category: 'Odd Denominations', display_order: 3, icon_label: '2¢', description: 'Civil War emergency issue, first to carry IN GOD WE TRUST' },
  { id: 'denom_three_cent', name: 'Three Cent', category: 'Odd Denominations', display_order: 4, icon_label: '3¢', description: 'Three Cent Silver (Trime) and Three Cent Nickel' },
  { id: 'denom_half_dime', name: 'Half Dime', category: 'Silver', display_order: 5, icon_label: '5¢', description: 'Early silver five-cent federal issues beginning with 1792 Half Disme' },
  { id: 'denom_nickel', name: 'Nickel', category: 'Nickels', display_order: 6, icon_label: '5¢', description: 'Cupro-nickel 5-cent pieces including Shield, Buffalo, and Jefferson' },
  { id: 'denom_dime', name: 'Dime', category: 'Dimes', display_order: 7, icon_label: '10¢', description: 'Draped Bust through Mercury, Roosevelt, and 2026 Semiquincentennial' },
  { id: 'denom_twenty_cent', name: 'Twenty Cent', category: 'Odd Denominations', display_order: 8, icon_label: '20¢', description: 'Short-lived double-dime denomination (1875–1878)' },
  { id: 'denom_quarter', name: 'Quarter', category: 'Quarters', display_order: 9, icon_label: '25¢', description: 'From 1796 Draped Bust to 50 State, National Parks, Women, and 2026' },
  { id: 'denom_half_dollar', name: 'Half Dollar', category: 'Half Dollars', display_order: 10, icon_label: '50¢', description: 'Early silver halves, Walking Liberty, Franklin, Kennedy, and 2026' },
  { id: 'denom_dollar', name: 'Dollar', category: 'Dollars', display_order: 11, icon_label: '$1', description: 'Flowing Hair, Morgan, Peace, Ike, SBA, Sacagawea, Presidential, and Innovation' },
  { id: 'denom_gold', name: 'Gold Coins', category: 'Gold', display_order: 12, icon_label: 'AU', description: 'Official U.S. Federal Gold: $1, $2.50, $3, $4 Stella, $5, $10, and $20 Double Eagle' },
  { id: 'denom_commem', name: 'Commemoratives', category: 'Special Issues', display_order: 13, icon_label: '★', description: 'Official U.S. commemorative federal coin issues' }
];

export const MASTER_SERIES: MasterSeriesDefinition[] = [
  // 1. HALF CENTS
  {
    id: 'liberty-cap-half-cent',
    denomination_id: 'denom_half_cent',
    name: 'Liberty Cap Half Cent',
    pcgs_reference_name: 'Liberty Cap Half Cent (1793-1797)',
    start_year: 1793,
    end_year: 1797,
    display_order: 10,
    category: 'Half Cents',
    designer: 'Joseph Wright / Robert Scot',
    composition_summary: '100% Copper'
  },
  {
    id: 'draped-bust-half-cent',
    denomination_id: 'denom_half_cent',
    name: 'Draped Bust Half Cent',
    pcgs_reference_name: 'Draped Bust Half Cent (1800-1808)',
    start_year: 1800,
    end_year: 1808,
    display_order: 11,
    category: 'Half Cents',
    designer: 'Robert Scot',
    composition_summary: '100% Copper'
  },
  {
    id: 'classic-head-half-cent',
    denomination_id: 'denom_half_cent',
    name: 'Classic Head Half Cent',
    pcgs_reference_name: 'Classic Head Half Cent (1809-1836)',
    start_year: 1809,
    end_year: 1836,
    display_order: 12,
    category: 'Half Cents',
    designer: 'John Reich',
    composition_summary: '100% Copper'
  },
  {
    id: 'braided-hair-half-cent',
    denomination_id: 'denom_half_cent',
    name: 'Braided Hair Half Cent',
    pcgs_reference_name: 'Braided Hair Half Cent (1840-1857)',
    start_year: 1840,
    end_year: 1857,
    display_order: 13,
    category: 'Half Cents',
    designer: 'Christian Gobrecht',
    composition_summary: '100% Copper'
  },

  // 2. ONE CENT (Exact required order!)
  // 1. Fugio Cent
  {
    id: 'fugio-cents',
    denomination_id: 'denom_cent',
    name: 'Fugio Cent',
    pcgs_reference_name: 'Fugio Cent (1787)',
    start_year: 1787,
    end_year: 1787,
    display_order: 20,
    category: 'One Cent',
    designer: 'Benjamin Franklin',
    composition_summary: '100% Copper',
    description: 'First official coin authorized by the Continental Congress ("Mind Your Business" / "We Are One").'
  },
  // 2. Flowing Hair Large Cent
  {
    id: 'flowing-hair-large-cent',
    denomination_id: 'denom_cent',
    name: 'Flowing Hair Large Cent',
    pcgs_reference_name: 'Flowing Hair Large Cent (1793-1796)',
    start_year: 1793,
    end_year: 1796,
    display_order: 21,
    category: 'One Cent',
    designer: 'Henry Voigt / Joseph Wright',
    composition_summary: '100% Copper',
    description: 'Chain Cent and Wreath Cent, followed by Liberty Cap types.'
  },
  // 3. Draped Bust Cent
  {
    id: 'draped-bust-large-cent',
    denomination_id: 'denom_cent',
    name: 'Draped Bust Cent',
    pcgs_reference_name: 'Draped Bust Large Cent (1796-1807)',
    start_year: 1796,
    end_year: 1807,
    display_order: 22,
    category: 'One Cent',
    designer: 'Robert Scot',
    composition_summary: '100% Copper'
  },
  // 4. Classic Head Cent
  {
    id: 'classic-head-large-cent',
    denomination_id: 'denom_cent',
    name: 'Classic Head Cent',
    pcgs_reference_name: 'Classic Head Large Cent (1808-1814)',
    start_year: 1808,
    end_year: 1814,
    display_order: 23,
    category: 'One Cent',
    designer: 'John Reich',
    composition_summary: '100% Copper'
  },
  // 5. Coronet Head Cent
  {
    id: 'coronet-head-large-cent',
    denomination_id: 'denom_cent',
    name: 'Coronet Head Cent',
    pcgs_reference_name: 'Coronet Head Large Cent (1816-1839)',
    start_year: 1816,
    end_year: 1839,
    display_order: 24,
    category: 'One Cent',
    designer: 'Robert Scot',
    composition_summary: '100% Copper'
  },
  // 6. Braided Hair Cent
  {
    id: 'braided-hair-large-cent',
    denomination_id: 'denom_cent',
    name: 'Braided Hair Cent',
    pcgs_reference_name: 'Braided Hair Large Cent (1839-1857)',
    start_year: 1839,
    end_year: 1857,
    display_order: 25,
    category: 'One Cent',
    designer: 'Christian Gobrecht',
    composition_summary: '100% Copper'
  },
  // 7. Flying Eagle Cent
  {
    id: 'flying-eagle-cent',
    denomination_id: 'denom_cent',
    name: 'Flying Eagle Cent',
    pcgs_reference_name: 'Flying Eagle Cent (1856-1858)',
    start_year: 1856,
    end_year: 1858,
    display_order: 26,
    category: 'One Cent',
    designer: 'James B. Longacre',
    composition_summary: '88% Copper, 12% Nickel (Copper-Nickel)'
  },
  // 8. Indian Head Cent
  {
    id: 'indian-cent',
    denomination_id: 'denom_cent',
    name: 'Indian Head Cent',
    pcgs_reference_name: 'Indian Head Cent (1859-1909)',
    start_year: 1859,
    end_year: 1909,
    display_order: 27,
    category: 'One Cent',
    designer: 'James B. Longacre',
    composition_summary: '1859–1864 Cu-Ni; 1864–1909 Bronze'
  },
  // 9. Lincoln Wheat Cent
  {
    id: 'lincoln-cent-wheat',
    denomination_id: 'denom_cent',
    name: 'Lincoln Wheat Cent',
    pcgs_reference_name: 'Lincoln Cent (Wheat Reverse) (1909-1958)',
    start_year: 1909,
    end_year: 1958,
    display_order: 28,
    category: 'One Cent',
    designer: 'Victor David Brenner',
    composition_summary: '95% Copper, 5% Tin/Zinc (1943: Zinc-Coated Steel)'
  },
  // 10. Lincoln Memorial Cent
  {
    id: 'lincoln-cent-memorial',
    denomination_id: 'denom_cent',
    name: 'Lincoln Memorial Cent',
    pcgs_reference_name: 'Lincoln Cent (Memorial Reverse) (1959-2008)',
    start_year: 1959,
    end_year: 2008,
    display_order: 29,
    category: 'One Cent',
    designer: 'Victor David Brenner / Frank Gasparro',
    composition_summary: '1959–1982: 95% Cu; Mid-1982–2008: Copper-Plated Zinc'
  },
  // 11. Lincoln Shield Cent
  {
    id: 'lincoln-cent-shield',
    denomination_id: 'denom_cent',
    name: 'Lincoln Shield Cent',
    pcgs_reference_name: 'Lincoln Cent (Shield Reverse) (2010-present)',
    start_year: 2010,
    end_year: 2025,
    display_order: 30,
    category: 'One Cent',
    designer: 'Victor David Brenner / Lyndall Bass',
    composition_summary: '97.5% Zinc, 2.5% Copper'
  },
  // 12. 2026 Semiquincentennial Cent
  {
    id: 'lincoln-cent-2026',
    denomination_id: 'denom_cent',
    name: '2026 Semiquincentennial Cent',
    pcgs_reference_name: '2026 Semiquincentennial Cent (2026)',
    start_year: 2026,
    end_year: 2026,
    display_order: 31,
    category: 'One Cent',
    designer: 'United States Mint',
    composition_summary: 'Special 250th Anniversary commemorative reverse'
  },

  // 3. TWO CENT AND THREE CENT
  {
    id: 'two-cent-piece',
    denomination_id: 'denom_two_cent',
    name: 'Two Cent Piece',
    pcgs_reference_name: 'Two Cent Piece (1864-1873)',
    start_year: 1864,
    end_year: 1873,
    display_order: 40,
    category: 'Two Cent',
    designer: 'James B. Longacre',
    composition_summary: '95% Copper, 5% Tin/Zinc'
  },
  {
    id: 'three-cent-silver',
    denomination_id: 'denom_three_cent',
    name: 'Three Cent Silver',
    pcgs_reference_name: 'Three Cent Silver (1851-1873)',
    start_year: 1851,
    end_year: 1873,
    display_order: 41,
    category: 'Three Cent',
    designer: 'James B. Longacre',
    composition_summary: '1851–1853: 75% Silver; 1854–1873: 90% Silver'
  },
  {
    id: 'three-cent-nickel',
    denomination_id: 'denom_three_cent',
    name: 'Three Cent Nickel',
    pcgs_reference_name: 'Three Cent Nickel (1865-1889)',
    start_year: 1865,
    end_year: 1889,
    display_order: 42,
    category: 'Three Cent',
    designer: 'James B. Longacre',
    composition_summary: '75% Copper, 25% Nickel'
  },

  // 4. HALF DIMES AND DIMES
  {
    id: 'half-dime-1792',
    denomination_id: 'denom_half_dime',
    name: '1792 Half Disme',
    pcgs_reference_name: '1792 Half Disme',
    start_year: 1792,
    end_year: 1792,
    display_order: 50,
    category: 'Half Dime',
    designer: 'Robert Scot',
    composition_summary: '89.2% Silver, 10.8% Copper',
    description: 'The historic first federal coin struck under the Coinage Act of 1792.'
  },
  {
    id: 'flowing-hair-half-dime',
    denomination_id: 'denom_half_dime',
    name: 'Flowing Hair Half Dime',
    pcgs_reference_name: 'Flowing Hair Half Dime (1794-1795)',
    start_year: 1794,
    end_year: 1795,
    display_order: 51,
    category: 'Half Dime',
    designer: 'Robert Scot',
    composition_summary: '89.2% Silver, 10.8% Copper'
  },
  {
    id: 'draped-bust-half-dime',
    denomination_id: 'denom_half_dime',
    name: 'Draped Bust Half Dime',
    pcgs_reference_name: 'Draped Bust Half Dime (1796-1805)',
    start_year: 1796,
    end_year: 1805,
    display_order: 52,
    category: 'Half Dime',
    designer: 'Robert Scot',
    composition_summary: '89.2% Silver, 10.8% Copper'
  },
  {
    id: 'capped-bust-half-dime',
    denomination_id: 'denom_half_dime',
    name: 'Capped Bust Half Dime',
    pcgs_reference_name: 'Capped Bust Half Dime (1829-1837)',
    start_year: 1829,
    end_year: 1837,
    display_order: 53,
    category: 'Half Dime',
    designer: 'William Kneass',
    composition_summary: '89.2% Silver, 10.8% Copper'
  },
  {
    id: 'liberty-seated-half-dime',
    denomination_id: 'denom_half_dime',
    name: 'Liberty Seated Half Dime',
    pcgs_reference_name: 'Liberty Seated Half Dime (1837-1873)',
    start_year: 1837,
    end_year: 1873,
    display_order: 54,
    category: 'Half Dime',
    designer: 'Christian Gobrecht',
    composition_summary: '90% Silver, 10% Copper'
  },
  // DIMES
  {
    id: 'draped-bust-dime',
    denomination_id: 'denom_dime',
    name: 'Draped Bust Dime',
    pcgs_reference_name: 'Draped Bust Dime (1796-1807)',
    start_year: 1796,
    end_year: 1807,
    display_order: 60,
    category: 'Dime',
    designer: 'Robert Scot',
    composition_summary: '89.2% Silver, 10.8% Copper'
  },
  {
    id: 'capped-bust-dime',
    denomination_id: 'denom_dime',
    name: 'Capped Bust Dime',
    pcgs_reference_name: 'Capped Bust Dime (1809-1837)',
    start_year: 1809,
    end_year: 1837,
    display_order: 61,
    category: 'Dime',
    designer: 'John Reich',
    composition_summary: '89.2% Silver, 10.8% Copper'
  },
  {
    id: 'liberty-seated-dime',
    denomination_id: 'denom_dime',
    name: 'Liberty Seated Dime',
    pcgs_reference_name: 'Liberty Seated Dime (1837-1891)',
    start_year: 1837,
    end_year: 1891,
    display_order: 62,
    category: 'Dime',
    designer: 'Christian Gobrecht',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'barber-dime',
    denomination_id: 'denom_dime',
    name: 'Barber Dime',
    pcgs_reference_name: 'Barber Dime (1892-1916)',
    start_year: 1892,
    end_year: 1916,
    display_order: 63,
    category: 'Dime',
    designer: 'Charles E. Barber',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'mercury-dime',
    denomination_id: 'denom_dime',
    name: 'Mercury Dime',
    pcgs_reference_name: 'Mercury Dime (1916-1945)',
    start_year: 1916,
    end_year: 1945,
    display_order: 64,
    category: 'Dime',
    designer: 'Adolph A. Weinman',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'roosevelt-dime',
    denomination_id: 'denom_dime',
    name: 'Roosevelt Dime',
    pcgs_reference_name: 'Roosevelt Dime (1946-present)',
    start_year: 1946,
    end_year: 2025,
    display_order: 65,
    category: 'Dime',
    designer: 'John R. Sinnock',
    composition_summary: '1946–1964: 90% Silver; 1965–present: Copper-Nickel Clad'
  },
  {
    id: 'roosevelt-dime-2026',
    denomination_id: 'denom_dime',
    name: '2026 Semiquincentennial Dime',
    pcgs_reference_name: '2026 Semiquincentennial Dime (1776~2026)',
    start_year: 2026,
    end_year: 2026,
    display_order: 66,
    category: 'Dime',
    designer: 'United States Mint',
    composition_summary: 'Dual Date 1776~2026 Semiquincentennial Issue'
  },

  // 5. NICKELS
  {
    id: 'shield-nickel',
    denomination_id: 'denom_nickel',
    name: 'Shield Nickel',
    pcgs_reference_name: 'Shield Nickel (1866-1883)',
    start_year: 1866,
    end_year: 1883,
    display_order: 70,
    category: 'Nickel',
    designer: 'James B. Longacre',
    composition_summary: '75% Copper, 25% Nickel'
  },
  {
    id: 'liberty-head-nickel',
    denomination_id: 'denom_nickel',
    name: 'Liberty Head/V Nickel',
    pcgs_reference_name: 'Liberty Head Nickel (1883-1913)',
    start_year: 1883,
    end_year: 1913,
    display_order: 71,
    category: 'Nickel',
    designer: 'Charles E. Barber',
    composition_summary: '75% Copper, 25% Nickel'
  },
  {
    id: 'buffalo-nickel',
    denomination_id: 'denom_nickel',
    name: 'Buffalo Nickel',
    pcgs_reference_name: 'Buffalo Nickel (1913-1938)',
    start_year: 1913,
    end_year: 1938,
    display_order: 72,
    category: 'Nickel',
    designer: 'James Earle Fraser',
    composition_summary: '75% Copper, 25% Nickel'
  },
  {
    id: 'jefferson-nickel',
    denomination_id: 'denom_nickel',
    name: 'Jefferson Nickel',
    pcgs_reference_name: 'Jefferson Nickel (1938-present)',
    start_year: 1938,
    end_year: 2025,
    display_order: 73,
    category: 'Nickel',
    designer: 'Felix Schlag',
    composition_summary: '75% Cu, 25% Ni (1942–1945 Wartime: 35% Silver, 56% Copper, 9% Manganese)'
  },
  {
    id: 'jefferson-nickel-2026',
    denomination_id: 'denom_nickel',
    name: '2026 Semiquincentennial Nickel',
    pcgs_reference_name: '2026 Semiquincentennial Nickel (2026)',
    start_year: 2026,
    end_year: 2026,
    display_order: 74,
    category: 'Nickel',
    designer: 'United States Mint',
    composition_summary: '250th Anniversary Semiquincentennial Commemorative Reverse'
  },

  // 6. TWENTY CENT PIECES
  {
    id: 'twenty-cent-piece',
    denomination_id: 'denom_twenty_cent',
    name: 'Twenty Cent Piece',
    pcgs_reference_name: 'Twenty Cent Piece (1875-1878)',
    start_year: 1875,
    end_year: 1878,
    display_order: 80,
    category: 'Twenty Cent',
    designer: 'William Barber',
    composition_summary: '90% Silver, 10% Copper'
  },

  // 7. QUARTERS
  {
    id: 'draped-bust-quarter',
    denomination_id: 'denom_quarter',
    name: 'Draped Bust Quarter',
    pcgs_reference_name: 'Draped Bust Quarter (1796-1807)',
    start_year: 1796,
    end_year: 1807,
    display_order: 90,
    category: 'Quarter',
    designer: 'Robert Scot',
    composition_summary: '89.2% Silver, 10.8% Copper'
  },
  {
    id: 'capped-bust-quarter',
    denomination_id: 'denom_quarter',
    name: 'Capped Bust Quarter',
    pcgs_reference_name: 'Capped Bust Quarter (1815-1838)',
    start_year: 1815,
    end_year: 1838,
    display_order: 91,
    category: 'Quarter',
    designer: 'John Reich / William Kneass',
    composition_summary: '89.2% Silver, 10.8% Copper'
  },
  {
    id: 'liberty-seated-quarter',
    denomination_id: 'denom_quarter',
    name: 'Liberty Seated Quarter',
    pcgs_reference_name: 'Liberty Seated Quarter (1838-1891)',
    start_year: 1838,
    end_year: 1891,
    display_order: 92,
    category: 'Quarter',
    designer: 'Christian Gobrecht',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'barber-quarter',
    denomination_id: 'denom_quarter',
    name: 'Barber Quarter',
    pcgs_reference_name: 'Barber Quarter (1892-1916)',
    start_year: 1892,
    end_year: 1916,
    display_order: 93,
    category: 'Quarter',
    designer: 'Charles E. Barber',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'standing-liberty-quarter',
    denomination_id: 'denom_quarter',
    name: 'Standing Liberty Quarter',
    pcgs_reference_name: 'Standing Liberty Quarter (1916-1930)',
    start_year: 1916,
    end_year: 1930,
    display_order: 94,
    category: 'Quarter',
    designer: 'Hermon A. MacNeil',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'washington-quarter-classic',
    denomination_id: 'denom_quarter',
    name: 'Washington Quarter',
    pcgs_reference_name: 'Washington Quarter (1932-1998)',
    start_year: 1932,
    end_year: 1998,
    display_order: 95,
    category: 'Quarter',
    designer: 'John Flanagan',
    composition_summary: '1932–1964: 90% Silver; 1965–1998: Clad (1976: 1776–1976 Bicentennial)'
  },
  {
    id: 'washington-50-state-quarters',
    denomination_id: 'denom_quarter',
    name: 'Washington 50 State Quarters',
    pcgs_reference_name: '50 State Quarters (1999-2008)',
    start_year: 1999,
    end_year: 2008,
    display_order: 96,
    category: 'Quarter',
    designer: 'John Flanagan & Individual State Artists',
    composition_summary: 'Cupro-Nickel Clad and 90% Silver Proof'
  },
  {
    id: 'washington-dc-territories-quarters',
    denomination_id: 'denom_quarter',
    name: 'Washington D.C. & U.S. Territories Quarters',
    pcgs_reference_name: 'DC & US Territories Quarters (2009)',
    start_year: 2009,
    end_year: 2009,
    display_order: 97,
    category: 'Quarter',
    designer: 'United States Mint',
    composition_summary: 'Cupro-Nickel Clad and 90% Silver Proof'
  },
  {
    id: 'america-the-beautiful-quarters',
    denomination_id: 'denom_quarter',
    name: 'America the Beautiful Quarters',
    pcgs_reference_name: 'America the Beautiful Quarters (2010-2021)',
    start_year: 2010,
    end_year: 2021,
    display_order: 98,
    category: 'Quarter',
    designer: 'United States Mint / National Parks',
    composition_summary: 'Cu-Ni Clad & Silver Proof (Includes 2019-W & 2020-W West Point strikes)'
  },
  {
    id: 'washington-crossing-delaware-quarter',
    denomination_id: 'denom_quarter',
    name: 'Washington Crossing the Delaware Quarter',
    pcgs_reference_name: 'Washington Crossing the Delaware Quarter (2021)',
    start_year: 2021,
    end_year: 2021,
    display_order: 99,
    category: 'Quarter',
    designer: 'Benjamin Sowards / Michael Gaudioso',
    composition_summary: 'Cupro-Nickel Clad'
  },
  {
    id: 'american-women-quarters',
    denomination_id: 'denom_quarter',
    name: 'American Women Quarters',
    pcgs_reference_name: 'American Women Quarters (2022-2025)',
    start_year: 2022,
    end_year: 2025,
    display_order: 100,
    category: 'Quarter',
    designer: 'Laura Gardin Fraser & U.S. Mint Sculptors',
    composition_summary: 'Cupro-Nickel Clad and Fine Silver Proof'
  },
  {
    id: 'quarters-2026-semiquincentennial',
    denomination_id: 'denom_quarter',
    name: '2026 Semiquincentennial Quarters',
    pcgs_reference_name: '2026 Semiquincentennial Quarters (1776~2026)',
    start_year: 2026,
    end_year: 2026,
    display_order: 101,
    category: 'Quarter',
    designer: 'United States Mint',
    composition_summary: 'Five revolutionary 1776~2026 Semiquincentennial Designs'
  },

  // 8. HALF DOLLARS
  {
    id: 'flowing-hair-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Flowing Hair Half Dollar',
    pcgs_reference_name: 'Flowing Hair Half Dollar (1794-1795)',
    start_year: 1794,
    end_year: 1795,
    display_order: 110,
    category: 'Half Dollar',
    designer: 'Robert Scot',
    composition_summary: '89.2% Silver, 10.8% Copper'
  },
  {
    id: 'draped-bust-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Draped Bust Half Dollar',
    pcgs_reference_name: 'Draped Bust Half Dollar (1796-1807)',
    start_year: 1796,
    end_year: 1807,
    display_order: 111,
    category: 'Half Dollar',
    designer: 'Robert Scot',
    composition_summary: '89.2% Silver, 10.8% Copper'
  },
  {
    id: 'capped-bust-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Capped Bust Half Dollar',
    pcgs_reference_name: 'Capped Bust Half Dollar (1807-1839)',
    start_year: 1807,
    end_year: 1839,
    display_order: 112,
    category: 'Half Dollar',
    designer: 'John Reich / Christian Gobrecht',
    composition_summary: '89.2% Silver (1807–1836); 90% Silver (1837–1839)'
  },
  {
    id: 'liberty-seated-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Liberty Seated Half Dollar',
    pcgs_reference_name: 'Liberty Seated Half Dollar (1839-1891)',
    start_year: 1839,
    end_year: 1891,
    display_order: 113,
    category: 'Half Dollar',
    designer: 'Christian Gobrecht',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'barber-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Barber Half Dollar',
    pcgs_reference_name: 'Barber Half Dollar (1892-1915)',
    start_year: 1892,
    end_year: 1915,
    display_order: 114,
    category: 'Half Dollar',
    designer: 'Charles E. Barber',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'walking-liberty-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Walking Liberty Half Dollar',
    pcgs_reference_name: 'Walking Liberty Half Dollar (1916-1947)',
    start_year: 1916,
    end_year: 1947,
    display_order: 115,
    category: 'Half Dollar',
    designer: 'Adolph A. Weinman',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'franklin-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Franklin Half Dollar',
    pcgs_reference_name: 'Franklin Half Dollar (1948-1963)',
    start_year: 1948,
    end_year: 1963,
    display_order: 116,
    category: 'Half Dollar',
    designer: 'John R. Sinnock',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'kennedy-half-dollar',
    denomination_id: 'denom_half_dollar',
    name: 'Kennedy Half Dollar',
    pcgs_reference_name: 'Kennedy Half Dollar (1964-present)',
    start_year: 1964,
    end_year: 2025,
    display_order: 117,
    category: 'Half Dollar',
    designer: 'Gilroy Roberts / Frank Gasparro',
    composition_summary: '1964: 90% Silver; 1965–1970: 40% Silver; 1971–present: Clad'
  },
  {
    id: 'kennedy-half-dollar-2026',
    denomination_id: 'denom_half_dollar',
    name: '2026 Semiquincentennial Half Dollar',
    pcgs_reference_name: '2026 Semiquincentennial Half Dollar (2026)',
    start_year: 2026,
    end_year: 2026,
    display_order: 118,
    category: 'Half Dollar',
    designer: 'United States Mint',
    composition_summary: '250th Anniversary Semiquincentennial Commemorative Reverse'
  },

  // 9. DOLLAR COINS
  {
    id: 'flowing-hair-dollar',
    denomination_id: 'denom_dollar',
    name: 'Flowing Hair Dollar',
    pcgs_reference_name: 'Flowing Hair Dollar (1794-1795)',
    start_year: 1794,
    end_year: 1795,
    display_order: 130,
    category: 'Dollar',
    designer: 'Robert Scot',
    composition_summary: '89.2% Silver, 10.8% Copper'
  },
  {
    id: 'draped-bust-dollar',
    denomination_id: 'denom_dollar',
    name: 'Draped Bust Dollar',
    pcgs_reference_name: 'Draped Bust Dollar (1795-1804)',
    start_year: 1795,
    end_year: 1804,
    display_order: 131,
    category: 'Dollar',
    designer: 'Robert Scot',
    composition_summary: '89.2% Silver, 10.8% Copper'
  },
  {
    id: 'gobrecht-dollar',
    denomination_id: 'denom_dollar',
    name: 'Gobrecht Dollar',
    pcgs_reference_name: 'Gobrecht Dollar (1836-1839)',
    start_year: 1836,
    end_year: 1839,
    display_order: 132,
    category: 'Dollar',
    designer: 'Christian Gobrecht',
    composition_summary: '89.2% / 90% Silver'
  },
  {
    id: 'liberty-seated-dollar',
    denomination_id: 'denom_dollar',
    name: 'Liberty Seated Dollar',
    pcgs_reference_name: 'Liberty Seated Dollar (1840-1873)',
    start_year: 1840,
    end_year: 1873,
    display_order: 133,
    category: 'Dollar',
    designer: 'Christian Gobrecht',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'trade-dollar',
    denomination_id: 'denom_dollar',
    name: 'Trade Dollar',
    pcgs_reference_name: 'Trade Dollar (1873-1885)',
    start_year: 1873,
    end_year: 1885,
    display_order: 134,
    category: 'Dollar',
    designer: 'William Barber',
    composition_summary: '90% Silver, 10% Copper (420 grains)'
  },
  {
    id: 'morgan-dollar',
    denomination_id: 'denom_dollar',
    name: 'Morgan Dollar',
    pcgs_reference_name: 'Morgan Dollar (1878-1921)',
    start_year: 1878,
    end_year: 1921,
    display_order: 135,
    category: 'Dollar',
    designer: 'George T. Morgan',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'peace-dollar',
    denomination_id: 'denom_dollar',
    name: 'Peace Dollar',
    pcgs_reference_name: 'Peace Dollar (1921-1935)',
    start_year: 1921,
    end_year: 1935,
    display_order: 136,
    category: 'Dollar',
    designer: 'Anthony de Francisci',
    composition_summary: '90% Silver, 10% Copper'
  },
  {
    id: 'eisenhower-dollar',
    denomination_id: 'denom_dollar',
    name: 'Eisenhower Dollar',
    pcgs_reference_name: 'Eisenhower Dollar (1971-1978)',
    start_year: 1971,
    end_year: 1978,
    display_order: 137,
    category: 'Dollar',
    designer: 'Frank Gasparro',
    composition_summary: 'Cupro-Nickel Clad and 40% Silver'
  },
  {
    id: 'susan-b-anthony-dollar',
    denomination_id: 'denom_dollar',
    name: 'Susan B. Anthony Dollar',
    pcgs_reference_name: 'Susan B. Anthony Dollar (1979-1981, 1999)',
    start_year: 1979,
    end_year: 1999,
    display_order: 138,
    category: 'Dollar',
    designer: 'Frank Gasparro',
    composition_summary: 'Cupro-Nickel Clad'
  },
  {
    id: 'sacagawea-native-american-dollar',
    denomination_id: 'denom_dollar',
    name: 'Sacagawea/Native American Dollar',
    pcgs_reference_name: 'Sacagawea & Native American Dollar (2000-present)',
    start_year: 2000,
    end_year: 2025,
    display_order: 139,
    category: 'Dollar',
    designer: 'Glenna Goodacre & Native Designers',
    composition_summary: 'Manganese Brass Golden Alloy'
  },
  {
    id: 'presidential-dollar',
    denomination_id: 'denom_dollar',
    name: 'Presidential $1 Coin',
    pcgs_reference_name: 'Presidential $1 Coin (2007-2016, 2020)',
    start_year: 2007,
    end_year: 2020,
    display_order: 140,
    category: 'Dollar',
    designer: 'United States Mint',
    composition_summary: 'Manganese Brass Golden Alloy with Edge Lettering'
  },
  {
    id: 'american-innovation-dollar',
    denomination_id: 'denom_dollar',
    name: 'American Innovation $1 Coin',
    pcgs_reference_name: 'American Innovation $1 Coin (2018-present)',
    start_year: 2018,
    end_year: 2026,
    display_order: 141,
    category: 'Dollar',
    designer: 'United States Mint',
    composition_summary: 'Manganese Brass with Edge Lettering'
  },

  // 10. GOLD COINAGE
  {
    id: 'gold-dollar',
    denomination_id: 'denom_gold',
    name: 'Gold Dollar',
    pcgs_reference_name: 'Gold Dollar (1849-1889)',
    start_year: 1849,
    end_year: 1889,
    display_order: 150,
    category: 'Gold Coins',
    designer: 'James B. Longacre',
    composition_summary: '90% Gold, 10% Copper'
  },
  {
    id: 'quarter-eagle-gold',
    denomination_id: 'denom_gold',
    name: 'Quarter Eagle ($2.50)',
    pcgs_reference_name: 'Quarter Eagle (1796-1929)',
    start_year: 1796,
    end_year: 1929,
    display_order: 151,
    category: 'Gold Coins',
    designer: 'Robert Scot / John Reich / Christian Gobrecht / Bela Lyon Pratt',
    composition_summary: '90% Gold, 10% Copper'
  },
  {
    id: 'three-dollar-gold',
    denomination_id: 'denom_gold',
    name: 'Three Dollar Gold',
    pcgs_reference_name: 'Three Dollar Gold Piece (1854-1889)',
    start_year: 1854,
    end_year: 1889,
    display_order: 152,
    category: 'Gold Coins',
    designer: 'James B. Longacre',
    composition_summary: '90% Gold, 10% Copper'
  },
  {
    id: 'four-dollar-stella-gold',
    denomination_id: 'denom_gold',
    name: 'Stella ($4)',
    pcgs_reference_name: 'Four Dollar Stella (1879-1880)',
    start_year: 1879,
    end_year: 1880,
    display_order: 153,
    category: 'Gold Coins',
    designer: 'Charles E. Barber / George T. Morgan',
    composition_summary: '85.7% Gold, 4.3% Silver, 10% Copper'
  },
  {
    id: 'half-eagle-gold',
    denomination_id: 'denom_gold',
    name: 'Half Eagle ($5)',
    pcgs_reference_name: 'Half Eagle (1795-1929)',
    start_year: 1795,
    end_year: 1929,
    display_order: 154,
    category: 'Gold Coins',
    designer: 'Robert Scot / Christian Gobrecht / Bela Lyon Pratt',
    composition_summary: '90% Gold, 10% Copper'
  },
  {
    id: 'eagle-gold',
    denomination_id: 'denom_gold',
    name: 'Eagle ($10)',
    pcgs_reference_name: 'Eagle (1795-1933)',
    start_year: 1795,
    end_year: 1933,
    display_order: 155,
    category: 'Gold Coins',
    designer: 'Robert Scot / Christian Gobrecht / Augustus Saint-Gaudens',
    composition_summary: '90% Gold, 10% Copper'
  },
  {
    id: 'double-eagle-gold',
    denomination_id: 'denom_gold',
    name: 'Double Eagle ($20)',
    pcgs_reference_name: 'Double Eagle (1849-1933)',
    start_year: 1849,
    end_year: 1933,
    display_order: 156,
    category: 'Gold Coins',
    designer: 'James B. Longacre / Augustus Saint-Gaudens',
    composition_summary: '90% Gold, 10% Copper (Liberty Head & Saint-Gaudens)'
  }
];

export const MASTER_COIN_ERRORS = [
  { id: 'err_ddo', name: 'Doubled Die Obverse (DDO)', category: 'Die Variety', description: 'Duplication of obverse design elements caused by hub misalignment during die manufacturing.' },
  { id: 'err_ddr', name: 'Doubled Die Reverse (DDR)', category: 'Die Variety', description: 'Duplication of reverse design elements caused by hub misalignment during die manufacturing.' },
  { id: 'err_rpm', name: 'Repunched Mint Mark (RPM)', category: 'Mintmark Variety', description: 'Multiple hand-punched impressions of the mint mark into the working die.' },
  { id: 'err_off_center', name: 'Off-Center Strike', category: 'Striking Error', description: 'Coin struck when the planchet was improperly positioned between dies, leaving unstruck blank area.' },
  { id: 'err_broadstrike', name: 'Broadstrike', category: 'Striking Error', description: 'Struck without the collar die in place, allowing the metal to expand beyond normal diameter.' },
  { id: 'err_clipped_planchet', name: 'Clipped Planchet', category: 'Planchet Error', description: 'Curved, straight, or ragged blank defect caused by overlapping sheet punches at the mint.' },
  { id: 'err_die_break_cud', name: 'Cud / Major Die Break', category: 'Die Error', description: 'Chunk of working die chipped away at the rim, leaving a raised smooth lump of metal.' },
  { id: 'err_die_crack', name: 'Die Crack / Die Break', category: 'Die Error', description: 'Raised jagged hairline formed when metal flows into a fissure in a cracked working die.' },
  { id: 'err_missing_design', name: 'Missing Design Element', category: 'Die Error', description: 'Grease-filled die or excessive polishing resulting in missing mottos, mint marks, or details.' },
  { id: 'err_wrong_planchet', name: 'Wrong Planchet / Off-Metal', category: 'Planchet Error', description: 'Struck on a blank intended for a different denomination or foreign coinage.' },
  { id: 'err_transitional', name: 'Transitional Error', category: 'Transitional', description: 'Struck using dies or planchets from a preceding or succeeding composition or reverse hub.' }
];
