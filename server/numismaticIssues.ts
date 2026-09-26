export interface MasterIssueRecord {
  catalog_id: string;
  series_id: string;
  year: number;
  mint_id: string;
  mint_mark: string;
  has_mint_mark: number;
  issue_name: string;
  issue_type: string;
  finish: string;
  composition: string;
  weight_grams?: number;
  diameter_mm?: number;
  mintage?: string;
  notes?: string;
  display_order: number;
}

// Mint Helper
export function getMintInfo(mintCode: 'P' | 'D' | 'S' | 'O' | 'CC' | 'C' | 'D_DAHLONEGA' | 'W' | 'NONE'): {
  mint_id: string;
  mint_mark: string;
  has_mint_mark: number;
  label: string;
} {
  switch (mintCode) {
    case 'D_DAHLONEGA':
      return { mint_id: 'mint_dahlonega', mint_mark: 'D', has_mint_mark: 1, label: 'D (Dahlonega)' };
    case 'C':
      return { mint_id: 'mint_charlotte', mint_mark: 'C', has_mint_mark: 1, label: 'C (Charlotte)' };
    case 'O':
      return { mint_id: 'mint_new_orleans', mint_mark: 'O', has_mint_mark: 1, label: 'O (New Orleans)' };
    case 'CC':
      return { mint_id: 'mint_carson_city', mint_mark: 'CC', has_mint_mark: 1, label: 'CC (Carson City)' };
    case 'S':
      return { mint_id: 'mint_san_francisco', mint_mark: 'S', has_mint_mark: 1, label: 'S (San Francisco)' };
    case 'D':
      return { mint_id: 'mint_denver', mint_mark: 'D', has_mint_mark: 1, label: 'D (Denver)' };
    case 'W':
      return { mint_id: 'mint_west_point', mint_mark: 'W', has_mint_mark: 1, label: 'W (West Point)' };
    case 'NONE':
    case 'P':
    default:
      return { mint_id: 'mint_philadelphia', mint_mark: '', has_mint_mark: 0, label: 'Philadelphia (No Mint Mark)' };
  }
}

// Helper to create canonical Catalog ID
export function buildCatalogId(seriesId: string, year: number, mintCode: string, extra = ''): string {
  const cleanSeries = seriesId.toUpperCase().replace(/[^A-Z0-9]/g, '-');
  const m = mintCode || 'P';
  return extra ? `US-${cleanSeries}-${year}-${m}-${extra.toUpperCase()}` : `US-${cleanSeries}-${year}-${m}`;
}

export function generateMasterCatalogIssues(): MasterIssueRecord[] {
  const issues: MasterIssueRecord[] = [];
  let globalOrder = 1;

  function addIssue(
    seriesId: string,
    year: number,
    mintCode: 'P' | 'D' | 'S' | 'O' | 'CC' | 'C' | 'D_DAHLONEGA' | 'W' | 'NONE',
    displayName: string,
    options: {
      type?: string;
      finish?: string;
      comp?: string;
      weight?: number;
      diam?: number;
      notes?: string;
      mintage?: string;
      extraId?: string;
    } = {}
  ) {
    const mintInfo = getMintInfo(mintCode);
    const catalogId = buildCatalogId(seriesId, year, mintCode === 'D_DAHLONEGA' ? 'D-DAH' : (mintInfo.mint_mark || 'P'), options.extraId);

    issues.push({
      catalog_id: catalogId,
      series_id: seriesId,
      year,
      mint_id: mintInfo.mint_id,
      mint_mark: mintInfo.mint_mark,
      has_mint_mark: mintInfo.has_mint_mark,
      issue_name: displayName,
      issue_type: options.type || 'Business Strike',
      finish: options.finish || 'Circulating',
      composition: options.comp || 'Standard Issue',
      weight_grams: options.weight,
      diameter_mm: options.diam,
      mintage: options.mintage,
      notes: options.notes,
      display_order: globalOrder++
    });
  }

  // ==========================================
  // 1. ONE CENT: 1. Fugio Cent (1787)
  // ==========================================
  const fugioVarieties = [
    { name: '1787 Pointed Rays, UNITED STATES', notes: 'Standard 4-cinquefoils obverse' },
    { name: '1787 Pointed Rays, STATES UNITED', notes: 'STATES UNITED legend reverse' },
    { name: '1787 Club Rays, Concave', notes: 'Club-shaped rays with concave ends' },
    { name: '1787 Club Rays, Rounded', notes: 'Club-shaped rays with rounded ends' },
    { name: '1787 8-Pointed Stars Reverse', notes: 'Very rare reverse variation' },
    { name: '1787 New Haven Restrike Copper', notes: 'Historic restrike produced in New Haven' }
  ];
  for (const f of fugioVarieties) {
    addIssue('fugio-cents', 1787, 'NONE', f.name, {
      comp: '100% Copper',
      weight: 10.2,
      diam: 28.5,
      notes: f.notes,
      extraId: f.name.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 15)
    });
  }

  // Flowing Hair Large Cent (1793-1796)
  addIssue('flowing-hair-large-cent', 1793, 'NONE', '1793 Chain Cent (AMERICA)', { comp: '100% Copper', notes: 'First official circulating U.S. cent struck inside the Philadelphia Mint' });
  addIssue('flowing-hair-large-cent', 1793, 'NONE', '1793 Chain Cent (AMERI.)', { comp: '100% Copper', notes: 'Rare abbreviated legend variety' });
  addIssue('flowing-hair-large-cent', 1793, 'NONE', '1793 Wreath Cent (Vine & Bars Edge)', { comp: '100% Copper' });
  addIssue('flowing-hair-large-cent', 1793, 'NONE', '1793 Wreath Cent (Lettered Edge)', { comp: '100% Copper' });
  addIssue('flowing-hair-large-cent', 1793, 'NONE', '1793 Liberty Cap Cent', { comp: '100% Copper' });
  addIssue('flowing-hair-large-cent', 1794, 'NONE', '1794 Liberty Cap Cent', { comp: '100% Copper' });
  addIssue('flowing-hair-large-cent', 1795, 'NONE', '1795 Liberty Cap Cent (Lettered Edge)', { comp: '100% Copper' });
  addIssue('flowing-hair-large-cent', 1795, 'NONE', '1795 Liberty Cap Cent (Plain Edge)', { comp: '100% Copper' });
  addIssue('flowing-hair-large-cent', 1796, 'NONE', '1796 Liberty Cap Cent', { comp: '100% Copper' });

  // Draped Bust Cent (1796-1807)
  for (let y = 1796; y <= 1807; y++) {
    addIssue('draped-bust-large-cent', y, 'NONE', `${y} — Philadelphia (No Mint Mark)`, { comp: '100% Copper' });
  }

  // Classic Head Cent (1808-1814)
  for (let y = 1808; y <= 1814; y++) {
    addIssue('classic-head-large-cent', y, 'NONE', `${y} — Philadelphia (No Mint Mark)`, { comp: '100% Copper' });
  }

  // Coronet Head Cent (1816-1839)
  for (let y = 1816; y <= 1839; y++) {
    addIssue('coronet-head-large-cent', y, 'NONE', `${y} — Philadelphia (No Mint Mark)`, { comp: '100% Copper' });
  }

  // Braided Hair Cent (1839-1857)
  for (let y = 1839; y <= 1857; y++) {
    addIssue('braided-hair-large-cent', y, 'NONE', `${y} — Philadelphia (No Mint Mark)`, { comp: '100% Copper' });
  }

  // Flying Eagle Cent (1856-1858)
  addIssue('flying-eagle-cent', 1856, 'NONE', '1856 Flying Eagle Cent (Pattern/Rare)', { comp: '88% Cu, 12% Ni', notes: 'Historic transitional pattern issued to Congress and collectors' });
  addIssue('flying-eagle-cent', 1857, 'NONE', '1857 Flying Eagle Cent', { comp: '88% Cu, 12% Ni' });
  addIssue('flying-eagle-cent', 1858, 'NONE', '1858 Flying Eagle Cent (Large Letters)', { comp: '88% Cu, 12% Ni' });
  addIssue('flying-eagle-cent', 1858, 'NONE', '1858 Flying Eagle Cent (Small Letters)', { comp: '88% Cu, 12% Ni' });

  // Indian Head Cent (1859-1909)
  addIssue('indian-cent', 1859, 'NONE', '1859 (No Shield Reverse)', { comp: '88% Cu, 12% Ni' });
  addIssue('indian-cent', 1860, 'NONE', '1860 (With Shield)', { comp: '88% Cu, 12% Ni' });
  addIssue('indian-cent', 1861, 'NONE', '1861', { comp: '88% Cu, 12% Ni' });
  addIssue('indian-cent', 1862, 'NONE', '1862', { comp: '88% Cu, 12% Ni' });
  addIssue('indian-cent', 1863, 'NONE', '1863', { comp: '88% Cu, 12% Ni' });
  addIssue('indian-cent', 1864, 'NONE', '1864 Copper-Nickel', { comp: '88% Cu, 12% Ni' });
  addIssue('indian-cent', 1864, 'NONE', '1864 Bronze', { comp: '95% Cu, 5% Sn/Zn' });
  addIssue('indian-cent', 1864, 'NONE', '1864 Bronze "L" on Ribbon (Key)', { comp: '95% Cu, 5% Sn/Zn', notes: 'Designed by James B. Longacre with subtle L initial on headdress ribbon' });
  for (let y = 1865; y <= 1907; y++) {
    if (y === 1877) {
      addIssue('indian-cent', 1877, 'NONE', '1877 — Key Date', { comp: '95% Cu, 5% Sn/Zn', notes: 'The premier key date of the regular issue Indian Cent series with mintage of 852,500' });
    } else {
      addIssue('indian-cent', y, 'NONE', `${y} — Philadelphia (No Mint Mark)`, { comp: '95% Cu, 5% Sn/Zn' });
    }
  }
  // San Francisco opened cent production in 1908
  addIssue('indian-cent', 1908, 'NONE', '1908 — Philadelphia', { comp: '95% Cu, 5% Sn/Zn' });
  addIssue('indian-cent', 1908, 'S', '1908-S (San Francisco)', { comp: '95% Cu, 5% Sn/Zn', notes: 'First branch mint cent produced in U.S. history' });
  addIssue('indian-cent', 1909, 'NONE', '1909 — Philadelphia', { comp: '95% Cu, 5% Sn/Zn' });
  addIssue('indian-cent', 1909, 'S', '1909-S (San Francisco Key)', { comp: '95% Cu, 5% Sn/Zn', notes: 'Final year key date with mintage of only 309,000' });

  // Lincoln Wheat Cent (1909-1958) - COMPLETE HISTORICAL ACCURACY
  const wheatMints: Record<number, ('P' | 'D' | 'S')[]> = {
    1909: ['P', 'S'], // Special handled below for VDB
    1910: ['P', 'S'],
    1911: ['P', 'D', 'S'],
    1912: ['P', 'D', 'S'],
    1913: ['P', 'D', 'S'],
    1914: ['P', 'D', 'S'],
    1915: ['P', 'D', 'S'],
    1916: ['P', 'D', 'S'],
    1917: ['P', 'D', 'S'],
    1918: ['P', 'D', 'S'],
    1919: ['P', 'D', 'S'],
    1920: ['P', 'D', 'S'],
    1921: ['P', 'S'],
    1922: ['D'], // Only Denver minted 1922!
    1923: ['P', 'S'],
    1924: ['P', 'D', 'S'],
    1925: ['P', 'D', 'S'],
    1926: ['P', 'D', 'S'],
    1927: ['P', 'D', 'S'],
    1928: ['P', 'D', 'S'],
    1929: ['P', 'D', 'S'],
    1930: ['P', 'D', 'S'],
    1931: ['P', 'D', 'S'],
    1932: ['P', 'D'],
    1933: ['P', 'D'],
    1934: ['P', 'D'],
    1935: ['P', 'D', 'S'],
    1936: ['P', 'D', 'S'],
    1937: ['P', 'D', 'S'],
    1938: ['P', 'D', 'S'],
    1939: ['P', 'D', 'S'],
    1940: ['P', 'D', 'S'],
    1941: ['P', 'D', 'S'],
    1942: ['P', 'D', 'S'],
    1943: ['P', 'D', 'S'], // Steel!
    1944: ['P', 'D', 'S'], // Shell case bronze
    1945: ['P', 'D', 'S'],
    1946: ['P', 'D', 'S'],
    1947: ['P', 'D', 'S'],
    1948: ['P', 'D', 'S'],
    1949: ['P', 'D', 'S'],
    1950: ['P', 'D', 'S'],
    1951: ['P', 'D', 'S'],
    1952: ['P', 'D', 'S'],
    1953: ['P', 'D', 'S'],
    1954: ['P', 'D', 'S'],
    1955: ['P', 'D', 'S'],
    1956: ['P', 'D'],
    1957: ['P', 'D'],
    1958: ['P', 'D']
  };

  // 1909 VDB and non-VDB issues
  addIssue('lincoln-cent-wheat', 1909, 'P', '1909 VDB — Philadelphia (No Mint Mark)', { comp: '95% Copper, 5% Tin/Zinc', notes: 'First year with Victor David Brenner initials on bottom reverse' });
  addIssue('lincoln-cent-wheat', 1909, 'S', '1909-S VDB (San Francisco Key Date)', { comp: '95% Copper, 5% Tin/Zinc', notes: 'The most famous regular-issue 20th century coin key date. Mintage 484,000.' });
  addIssue('lincoln-cent-wheat', 1909, 'P', '1909 — Philadelphia (No Mint Mark)', { comp: '95% Copper, 5% Tin/Zinc', notes: 'Struck after initials V.D.B. were removed from dies' });
  addIssue('lincoln-cent-wheat', 1909, 'S', '1909-S (San Francisco)', { comp: '95% Copper, 5% Tin/Zinc' });

  for (let y = 1910; y <= 1958; y++) {
    const validMints = wheatMints[y] || ['P'];
    for (const m of validMints) {
      if (y === 1943) {
        // Wartime steel
        const mLabel = m === 'P' ? '1943 — Philadelphia (Zinc-Coated Steel)' : `1943-${m} (${m === 'D' ? 'Denver' : 'San Francisco'} Zinc-Coated Steel)`;
        addIssue('lincoln-cent-wheat', 1943, m, mLabel, {
          comp: 'Zinc-Coated Steel',
          weight: 2.7,
          notes: 'Wartime emergency composition to conserve copper for World War II munitions'
        });
      } else if (y === 1922 && m === 'D') {
        addIssue('lincoln-cent-wheat', 1922, 'D', '1922-D (Denver)', { comp: '95% Copper', notes: 'Only Denver minted cents in 1922' });
      } else {
        const name = m === 'P' ? `${y} — Philadelphia (No Mint Mark)` : `${y}-${m} (${m === 'D' ? 'Denver' : 'San Francisco'})`;
        const notes = (y === 1914 && m === 'D') ? 'Major key date mintage 1,193,000' : (y === 1931 && m === 'S') ? 'Low mintage key date (866,000)' : undefined;
        addIssue('lincoln-cent-wheat', y, m, name, { comp: '95% Copper, 5% Tin/Zinc', notes });
      }
    }
  }

  // Lincoln Memorial Cent (1959-2008)
  for (let y = 1959; y <= 2008; y++) {
    if (y >= 1965 && y <= 1967) {
      // 1965-1967: CIRCULATING COINS CARRIED NO MINT MARKS! (Coinage Act of 1965)
      addIssue('lincoln-cent-memorial', y, 'NONE', `${y} — No Mint Mark (Coinage Act 1965–1967)`, {
        comp: '95% Copper, 5% Zinc',
        notes: 'Mint marks intentionally removed by Congress to discourage coin hoarding during silver transition.'
      });
    } else {
      addIssue('lincoln-cent-memorial', y, 'P', `${y} — Philadelphia (No Mint Mark)`, { comp: y < 1982 ? '95% Copper' : 'Copper-Plated Zinc' });
      addIssue('lincoln-cent-memorial', y, 'D', `${y}-D (Denver)`, { comp: y < 1982 ? '95% Copper' : 'Copper-Plated Zinc' });
      if (y >= 1968 && y <= 1974) {
        addIssue('lincoln-cent-memorial', y, 'S', `${y}-S (San Francisco)`, { comp: '95% Copper' });
      }
    }
  }

  // Lincoln Shield Cent (2010-2025)
  for (let y = 2010; y <= 2025; y++) {
    if (y === 2017) {
      // Historic 2017-P: First time P appeared on a Lincoln cent!
      addIssue('lincoln-cent-shield', 2017, 'P', '2017-P — Philadelphia (First Ever Cent "P" Mint Mark!)', {
        comp: 'Copper-Plated Zinc',
        notes: 'Commemorating the 225th Anniversary of the U.S. Mint. First time in history a regular cent bore the P mintmark.'
      });
    } else {
      addIssue('lincoln-cent-shield', y, 'P', `${y} — Philadelphia (No Mint Mark)`, { comp: 'Copper-Plated Zinc' });
    }
    addIssue('lincoln-cent-shield', y, 'D', `${y}-D (Denver)`, { comp: 'Copper-Plated Zinc' });
    if (y === 2019) {
      // 2019-W: Special West Point strike!
      addIssue('lincoln-cent-shield', 2019, 'W', '2019-W (West Point Special Issue)', { comp: 'Copper-Plated Zinc', notes: 'First W-mint marked Lincoln Cent in U.S. history' });
    }
  }

  // 12. 2026 Semiquincentennial Cent
  addIssue('lincoln-cent-2026', 2026, 'P', '2026-P Semiquincentennial Cent — Philadelphia (250th Anniv)', { comp: 'Copper-Plated Zinc', notes: '250th Anniversary of the Declaration of Independence' });
  addIssue('lincoln-cent-2026', 2026, 'D', '2026-D Semiquincentennial Cent — Denver (250th Anniv)', { comp: 'Copper-Plated Zinc' });
  addIssue('lincoln-cent-2026', 2026, 'S', '2026-S Semiquincentennial Cent — San Francisco Proof', { type: 'Proof', finish: 'Deep Cameo Proof', comp: 'Copper-Plated Zinc' });

  // ==========================================
  // 2. TWO CENT PIECE (1864-1873)
  // ==========================================
  addIssue('two-cent-piece', 1864, 'NONE', '1864 Small Motto (Key)', { comp: '95% Copper, 5% Tin/Zinc', notes: 'First coin to carry IN GOD WE TRUST' });
  addIssue('two-cent-piece', 1864, 'NONE', '1864 Large Motto', { comp: '95% Copper, 5% Tin/Zinc' });
  for (let y = 1865; y <= 1872; y++) {
    addIssue('two-cent-piece', y, 'NONE', `${y} Two Cent Piece`, { comp: '95% Copper, 5% Tin/Zinc' });
  }
  addIssue('two-cent-piece', 1873, 'NONE', '1873 Closed 3 (Proof Only)', { type: 'Proof', comp: '95% Copper', notes: 'Proof-only final year' });
  addIssue('two-cent-piece', 1873, 'NONE', '1873 Open 3 (Proof Only)', { type: 'Proof', comp: '95% Copper' });

  // ==========================================
  // 3. THREE CENT COINS
  // ==========================================
  // Three Cent Silver (1851-1873)
  addIssue('three-cent-silver', 1851, 'NONE', '1851 — Philadelphia (No Mint Mark)', { comp: '75% Silver' });
  addIssue('three-cent-silver', 1851, 'O', '1851-O (New Orleans — Only Branch Mint Trime!)', { comp: '75% Silver', notes: 'The only branch mint issue in the entire 3-cent silver series' });
  for (let y = 1852; y <= 1873; y++) {
    addIssue('three-cent-silver', y, 'NONE', `${y} Three Cent Silver`, { comp: '90% Silver' });
  }

  // Three Cent Nickel (1865-1889)
  for (let y = 1865; y <= 1889; y++) {
    addIssue('three-cent-nickel', y, 'NONE', `${y} Three Cent Nickel`, { comp: '75% Cu, 25% Ni' });
  }

  // ==========================================
  // 4. HALF DIMES
  // ==========================================
  addIssue('half-dime-1792', 1792, 'NONE', '1792 Half Disme', { comp: '89.2% Silver', notes: 'Historically recognized 1792 Half Disme struck under authority of George Washington' });
  addIssue('flowing-hair-half-dime', 1794, 'NONE', '1794 Flowing Hair Half Dime', { comp: '89.2% Silver' });
  addIssue('flowing-hair-half-dime', 1795, 'NONE', '1795 Flowing Hair Half Dime', { comp: '89.2% Silver' });
  for (let y of [1796, 1797, 1800, 1801, 1802, 1803, 1805]) {
    addIssue('draped-bust-half-dime', y, 'NONE', `${y} Draped Bust Half Dime`, { comp: '89.2% Silver' });
  }
  for (let y = 1829; y <= 1837; y++) {
    addIssue('capped-bust-half-dime', y, 'NONE', `${y} Capped Bust Half Dime`, { comp: '89.2% Silver' });
  }

  // ==========================================
  // 5. NICKELS: Shield, Liberty V, Buffalo, Jefferson, 2026
  // ==========================================
  // Shield Nickel (1866-1883)
  addIssue('shield-nickel', 1866, 'NONE', '1866 With Rays', { comp: '75% Cu, 25% Ni' });
  addIssue('shield-nickel', 1867, 'NONE', '1867 With Rays', { comp: '75% Cu, 25% Ni' });
  addIssue('shield-nickel', 1867, 'NONE', '1867 Without Rays', { comp: '75% Cu, 25% Ni' });
  for (let y = 1868; y <= 1883; y++) {
    addIssue('shield-nickel', y, 'NONE', `${y} Shield Nickel`, { comp: '75% Cu, 25% Ni' });
  }

  // Liberty Head V Nickel (1883-1913)
  addIssue('liberty-head-nickel', 1883, 'NONE', '1883 Without CENTS (Racketeer Nickel)', { comp: '75% Cu, 25% Ni', notes: 'Often gold plated and passed off as $5 gold half eagles' });
  addIssue('liberty-head-nickel', 1883, 'NONE', '1883 With CENTS', { comp: '75% Cu, 25% Ni' });
  for (let y = 1884; y <= 1912; y++) {
    addIssue('liberty-head-nickel', y, 'NONE', `${y} — Philadelphia (No Mint Mark)`, { comp: '75% Cu, 25% Ni' });
    if (y === 1912) {
      // 1912 was only year V Nickel minted at branch mints!
      addIssue('liberty-head-nickel', 1912, 'D', '1912-D (Denver — First Branch Mint Nickel)', { comp: '75% Cu, 25% Ni' });
      addIssue('liberty-head-nickel', 1912, 'S', '1912-S (San Francisco Key Date)', { comp: '75% Cu, 25% Ni', notes: 'Lowest mintage regular issue V nickel (238,000)' });
    }
  }

  // Buffalo Nickel (1913-1938)
  addIssue('buffalo-nickel', 1913, 'P', '1913 Variety 1 (Mound)', { comp: '75% Cu, 25% Ni' });
  addIssue('buffalo-nickel', 1913, 'D', '1913-D Variety 1 (Mound)', { comp: '75% Cu, 25% Ni' });
  addIssue('buffalo-nickel', 1913, 'S', '1913-S Variety 1 (Mound)', { comp: '75% Cu, 25% Ni' });
  addIssue('buffalo-nickel', 1913, 'P', '1913 Variety 2 (Flat Ground)', { comp: '75% Cu, 25% Ni' });
  addIssue('buffalo-nickel', 1913, 'D', '1913-D Variety 2 (Flat Ground)', { comp: '75% Cu, 25% Ni' });
  addIssue('buffalo-nickel', 1913, 'S', '1913-S Variety 2 (Flat Ground)', { comp: '75% Cu, 25% Ni' });
  for (let y = 1914; y <= 1938; y++) {
    addIssue('buffalo-nickel', y, 'P', `${y} — Philadelphia (No Mint Mark)`, { comp: '75% Cu, 25% Ni' });
    if (y !== 1932 && y !== 1933) {
      if (y <= 1937) addIssue('buffalo-nickel', y, 'D', `${y}-D (Denver)`, { comp: '75% Cu, 25% Ni' });
      if (y <= 1937 && y !== 1934) addIssue('buffalo-nickel', y, 'S', `${y}-S (San Francisco)`, { comp: '75% Cu, 25% Ni' });
    }
    if (y === 1938) {
      addIssue('buffalo-nickel', 1938, 'D', '1938-D (Denver — Final Buffalo Issue)', { comp: '75% Cu, 25% Ni' });
    }
  }

  // Jefferson Nickel (1938-2025)
  // 1942: CRITICAL TEST CASE:
  // 1942 Type 1 (Cu-Ni, Phila & Denver), 1942 Type 2 Wartime Silver (Phila large P & San Francisco S)
  addIssue('jefferson-nickel', 1938, 'P', '1938 — Philadelphia', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel', 1938, 'D', '1938-D (Denver)', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel', 1938, 'S', '1938-S (San Francisco)', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel', 1939, 'P', '1939 — Philadelphia', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel', 1939, 'D', '1939-D (Denver Key Date)', { comp: '75% Cu, 25% Ni', notes: 'Low mintage key date (3,514,000)' });
  addIssue('jefferson-nickel', 1939, 'S', '1939-S (San Francisco)', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel', 1940, 'P', '1940 — Philadelphia', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel', 1940, 'D', '1940-D (Denver)', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel', 1940, 'S', '1940-S (San Francisco)', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel', 1941, 'P', '1941 — Philadelphia', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel', 1941, 'D', '1941-D (Denver)', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel', 1941, 'S', '1941-S (San Francisco)', { comp: '75% Cu, 25% Ni' });

  // 1942 Issues: Type 1 Cupro-Nickel vs Type 2 Wartime Silver
  addIssue('jefferson-nickel', 1942, 'P', '1942 Type 1 (Philadelphia Cu-Ni, No Mint Mark)', { comp: '75% Cu, 25% Ni', notes: 'Pre-war nickel alloy struck before October 1942' });
  addIssue('jefferson-nickel', 1942, 'D', '1942-D Type 1 (Denver Cu-Ni)', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel', 1942, 'P', '1942-P Type 2 Wartime Silver (Large P Above Monticello)', { comp: '35% Silver, 56% Copper, 9% Manganese', notes: 'First coin in U.S. history to carry the "P" mint mark for Philadelphia!' });
  addIssue('jefferson-nickel', 1942, 'S', '1942-S Type 2 Wartime Silver (Large S Above Monticello)', { comp: '35% Silver, 56% Copper, 9% Manganese' });

  // 1943-1945 Wartime Silver Nickels
  for (let y = 1943; y <= 1945; y++) {
    for (const m of ['P', 'D', 'S'] as const) {
      addIssue('jefferson-nickel', y, m, `${y}-${m} Wartime Silver (Large Mint Mark Above Dome)`, {
        comp: '35% Silver, 56% Copper, 9% Manganese',
        notes: 'Wartime alloy struck to preserve industrial nickel for armor plating'
      });
    }
  }

  // 1946-1964 Post-war Nickels
  for (let y = 1946; y <= 1964; y++) {
    addIssue('jefferson-nickel', y, 'P', `${y} — Philadelphia (No Mint Mark)`, { comp: '75% Cu, 25% Ni' });
    addIssue('jefferson-nickel', y, 'D', `${y}-D (Denver)`, { comp: '75% Cu, 25% Ni', notes: y === 1950 ? 'Premier key date of post-war nickels (2,630,030)' : undefined });
    if (y <= 1954) {
      addIssue('jefferson-nickel', y, 'S', `${y}-S (San Francisco)`, { comp: '75% Cu, 25% Ni' });
    }
  }

  // 1965-1967: NO MINT MARKS
  for (let y = 1965; y <= 1967; y++) {
    addIssue('jefferson-nickel', y, 'NONE', `${y} — No Mint Mark (Coinage Act of 1965)`, {
      comp: '75% Cu, 25% Ni',
      notes: 'No mint marks placed on circulating U.S. coins from 1965 to 1967'
    });
  }

  // Modern Nickels (1968-2025)
  for (let y = 1968; y <= 2025; y++) {
    const pMark = y >= 1980 ? 'P' : 'NONE';
    const pName = y >= 1980 ? `${y}-P (Philadelphia)` : `${y} — Philadelphia (No Mint Mark)`;
    addIssue('jefferson-nickel', y, pMark, pName, { comp: '75% Cu, 25% Ni' });
    addIssue('jefferson-nickel', y, 'D', `${y}-D (Denver)`, { comp: '75% Cu, 25% Ni' });
  }

  // 2026 Semiquincentennial Nickel
  addIssue('jefferson-nickel-2026', 2026, 'P', '2026-P Semiquincentennial Nickel — Philadelphia', { comp: '75% Cu, 25% Ni', notes: '250th Anniversary Semiquincentennial Design' });
  addIssue('jefferson-nickel-2026', 2026, 'D', '2026-D Semiquincentennial Nickel — Denver', { comp: '75% Cu, 25% Ni' });
  addIssue('jefferson-nickel-2026', 2026, 'S', '2026-S Semiquincentennial Nickel — San Francisco Proof', { type: 'Proof', comp: '75% Cu, 25% Ni' });

  // ==========================================
  // 6. TWENTY CENT PIECE (1875-1878)
  // ==========================================
  addIssue('twenty-cent-piece', 1875, 'NONE', '1875 — Philadelphia (No Mint Mark)', { comp: '90% Silver', notes: 'Mintage 36,910' });
  addIssue('twenty-cent-piece', 1875, 'CC', '1875-CC (Carson City)', { comp: '90% Silver', notes: 'Comstock silver issue, mintage 133,290' });
  addIssue('twenty-cent-piece', 1875, 'S', '1875-S (San Francisco)', { comp: '90% Silver', notes: 'Highest mintage of the series (1,155,000)' });
  addIssue('twenty-cent-piece', 1876, 'NONE', '1876 — Philadelphia (No Mint Mark)', { comp: '90% Silver', notes: 'Mintage 14,640' });
  addIssue('twenty-cent-piece', 1876, 'CC', '1876-CC (Carson City — Legendary Rarity!)', { comp: '90% Silver', notes: 'Legendary numismatic rarity; almost entire mintage of 10,000 melted at the mint' });
  addIssue('twenty-cent-piece', 1877, 'NONE', '1877 Proof Only (Philadelphia)', { type: 'Proof', comp: '90% Silver', notes: 'Proof-only issue of 510 coins' });
  addIssue('twenty-cent-piece', 1878, 'NONE', '1878 Proof Only (Philadelphia)', { type: 'Proof', comp: '90% Silver', notes: 'Proof-only final issue of 600 coins' });

  // ==========================================
  // 7. DIMES: Mercury, Roosevelt, 2026
  // ==========================================
  // Mercury Dime (1916-1945)
  addIssue('mercury-dime', 1916, 'P', '1916 — Philadelphia (No Mint Mark)', { comp: '90% Silver' });
  addIssue('mercury-dime', 1916, 'D', '1916-D (Denver Key Date of the Century)', { comp: '90% Silver', notes: 'Premier key date of 20th century silver with mintage of only 264,000' });
  addIssue('mercury-dime', 1916, 'S', '1916-S (San Francisco)', { comp: '90% Silver' });
  for (let y = 1917; y <= 1945; y++) {
    addIssue('mercury-dime', y, 'P', `${y} — Philadelphia (No Mint Mark)`, { comp: '90% Silver' });
    if (y !== 1921 && y !== 1923 && y !== 1930 && y !== 1931 && y !== 1932 && y !== 1933) {
      addIssue('mercury-dime', y, 'D', `${y}-D (Denver)`, { comp: '90% Silver' });
    }
    if (y === 1921) {
      addIssue('mercury-dime', 1921, 'D', '1921-D (Denver Key Date)', { comp: '90% Silver', notes: 'Key date mintage 1,080,000' });
    }
    if (y <= 1945 && y !== 1921 && y !== 1922 && y !== 1932 && y !== 1933) {
      addIssue('mercury-dime', y, 'S', `${y}-S (San Francisco)`, { comp: '90% Silver' });
    }
  }

  // Roosevelt Dime (1946-2025)
  for (let y = 1946; y <= 2025; y++) {
    if (y >= 1965 && y <= 1967) {
      addIssue('roosevelt-dime', y, 'NONE', `${y} — No Mint Mark (Coinage Act 1965–1967)`, { comp: 'Cu-Ni Clad' });
    } else {
      const pCode = y >= 1980 ? 'P' : 'NONE';
      const pName = y >= 1980 ? `${y}-P (Philadelphia)` : `${y} — Philadelphia (No Mint Mark)`;
      addIssue('roosevelt-dime', y, pCode, pName, { comp: y <= 1964 ? '90% Silver' : 'Cu-Ni Clad' });
      addIssue('roosevelt-dime', y, 'D', `${y}-D (Denver)`, { comp: y <= 1964 ? '90% Silver' : 'Cu-Ni Clad' });
      if (y === 1996) {
        addIssue('roosevelt-dime', 1996, 'W', '1996-W (West Point 50th Anniversary Dime)', { comp: 'Cu-Ni Clad', notes: 'First circulating-composition W dime struck for 50th anniversary uncirculated sets' });
      }
    }
  }

  // 2026 Semiquincentennial Dime (Dual Date 1776~2026)
  addIssue('roosevelt-dime-2026', 2026, 'P', '2026-P Semiquincentennial Dime (1776~2026 Dual Date) — Philadelphia', { comp: 'Cu-Ni Clad', notes: 'Authorized dual date 1776~2026 for the 250th American Semiquincentennial' });
  addIssue('roosevelt-dime-2026', 2026, 'D', '2026-D Semiquincentennial Dime (1776~2026 Dual Date) — Denver', { comp: 'Cu-Ni Clad' });
  addIssue('roosevelt-dime-2026', 2026, 'S', '2026-S Semiquincentennial Dime (1776~2026 Dual Date) — San Francisco Proof', { type: 'Proof', comp: 'Cu-Ni Clad' });

  // ==========================================
  // 8. QUARTERS: 50 State, National Parks, Women, 2026
  // ==========================================
  // Washington Quarter Classic (1932-1998)
  addIssue('washington-quarter-classic', 1932, 'P', '1932 — Philadelphia (No Mint Mark)', { comp: '90% Silver' });
  addIssue('washington-quarter-classic', 1932, 'D', '1932-D (Denver Key Date)', { comp: '90% Silver', notes: 'Premier series key date (mintage 436,800)' });
  addIssue('washington-quarter-classic', 1932, 'S', '1932-S (San Francisco Key Date)', { comp: '90% Silver', notes: 'Premier series key date (mintage 408,000)' });
  for (let y = 1934; y <= 1964; y++) {
    addIssue('washington-quarter-classic', y, 'P', `${y} — Philadelphia (No Mint Mark)`, { comp: '90% Silver' });
    addIssue('washington-quarter-classic', y, 'D', `${y}-D (Denver)`, { comp: '90% Silver' });
    if (y <= 1954) addIssue('washington-quarter-classic', y, 'S', `${y}-S (San Francisco)`, { comp: '90% Silver' });
  }
  // 1965-1967: No mint marks
  addIssue('washington-quarter-classic', 1965, 'NONE', '1965 — No Mint Mark (First Clad Quarter)', { comp: 'Cu-Ni Clad' });
  addIssue('washington-quarter-classic', 1966, 'NONE', '1966 — No Mint Mark', { comp: 'Cu-Ni Clad' });
  addIssue('washington-quarter-classic', 1967, 'NONE', '1967 — No Mint Mark', { comp: 'Cu-Ni Clad' });
  for (let y = 1968; y <= 1998; y++) {
    if (y === 1976) {
      addIssue('washington-quarter-classic', 1976, 'P', '1976 Bicentennial (1776-1976 Colonial Drummer) — Philadelphia', { comp: 'Cu-Ni Clad' });
      addIssue('washington-quarter-classic', 1976, 'D', '1976-D Bicentennial (1776-1976 Colonial Drummer) — Denver', { comp: 'Cu-Ni Clad' });
      addIssue('washington-quarter-classic', 1976, 'S', '1976-S Bicentennial 40% Silver Proof', { type: 'Proof', comp: '40% Silver' });
    } else {
      const pCode = y >= 1980 ? 'P' : 'NONE';
      const pName = y >= 1980 ? `${y}-P (Philadelphia)` : `${y} — Philadelphia (No Mint Mark)`;
      addIssue('washington-quarter-classic', y, pCode, pName, { comp: 'Cu-Ni Clad' });
      addIssue('washington-quarter-classic', y, 'D', `${y}-D (Denver)`, { comp: 'Cu-Ni Clad' });
    }
  }

  // 50 State Quarters (1999-2008) - ALL 50 STATES
  const stateQuartersData = [
    { year: 1999, states: ['Delaware', 'Pennsylvania', 'New Jersey', 'Georgia', 'Connecticut'] },
    { year: 2000, states: ['Massachusetts', 'Maryland', 'South Carolina', 'New Hampshire', 'Virginia'] },
    { year: 2001, states: ['New York', 'North Carolina', 'Rhode Island', 'Vermont', 'Kentucky'] },
    { year: 2002, states: ['Tennessee', 'Ohio', 'Louisiana', 'Indiana', 'Mississippi'] },
    { year: 2003, states: ['Illinois', 'Alabama', 'Maine', 'Missouri', 'Arkansas'] },
    { year: 2004, states: ['Michigan', 'Florida', 'Texas', 'Iowa', 'Wisconsin'] },
    { year: 2005, states: ['California', 'Minnesota', 'Oregon', 'Kansas', 'West Virginia'] },
    { year: 2006, states: ['Nevada', 'Nebraska', 'Colorado', 'North Dakota', 'South Dakota'] },
    { year: 2007, states: ['Montana', 'Washington', 'Idaho', 'Wyoming', 'Utah'] },
    { year: 2008, states: ['Oklahoma', 'New Mexico', 'Arizona', 'Alaska', 'Hawaii'] }
  ];
  for (const group of stateQuartersData) {
    for (const state of group.states) {
      addIssue('washington-50-state-quarters', group.year, 'P', `${group.year}-P ${state} Quarter`, { comp: 'Cu-Ni Clad', notes: `Official 50 State Quarter: ${state}` });
      addIssue('washington-50-state-quarters', group.year, 'D', `${group.year}-D ${state} Quarter`, { comp: 'Cu-Ni Clad', notes: `Official 50 State Quarter: ${state}` });
      addIssue('washington-50-state-quarters', group.year, 'S', `${group.year}-S ${state} Silver Proof`, { type: 'Proof', comp: '90% Silver', notes: `Official 50 State Quarter: ${state}` });
    }
  }

  // American Women Quarters (2022-2025) - INDIVIDUAL HONOREES
  const womenData = [
    { year: 2022, names: ['Maya Angelou', 'Dr. Sally Ride', 'Wilma Mankiller', 'Nina Otero-Warren', 'Anna May Wong'] },
    { year: 2023, names: ['Bessie Coleman', 'Edith Kanakaʻole', 'Eleanor Roosevelt', 'Jovita Idár', 'Maria Tallchief'] },
    { year: 2024, names: ['Rev. Dr. Pauli Murray', 'Patsy Takemoto Mink', 'Dr. Mary Edwards Walker', 'Celia Cruz', 'Zitkala-Ša'] },
    { year: 2025, names: ['Ida B. Wells', 'Juliette Gordon Low', 'Dr. Vera Rubin', 'Althea Gibson', 'Semiquincentennial Preview'] }
  ];
  for (const group of womenData) {
    for (const honoree of group.names) {
      addIssue('american-women-quarters', group.year, 'P', `${group.year}-P ${honoree}`, { comp: 'Cu-Ni Clad', notes: `American Women Quarters Program honoring ${honoree}` });
      addIssue('american-women-quarters', group.year, 'D', `${group.year}-D ${honoree}`, { comp: 'Cu-Ni Clad', notes: `American Women Quarters Program honoring ${honoree}` });
      addIssue('american-women-quarters', group.year, 'S', `${group.year}-S ${honoree} Proof`, { type: 'Proof', comp: 'Fine Silver' });
    }
  }

  // 2026 Semiquincentennial Quarters (Dual Date 1776~2026) - 5 DESIGNS!
  const semiQuarters = [
    'Design 1: Declaration of Independence',
    'Design 2: Liberty Bell & Torch',
    'Design 3: Valley Forge & Washington',
    'Design 4: Constitution & Founding Fathers',
    'Design 5: Semiquincentennial Eagle'
  ];
  for (const d of semiQuarters) {
    addIssue('quarters-2026-semiquincentennial', 2026, 'P', `2026-P (1776~2026) ${d} — Philadelphia`, { comp: 'Cu-Ni Clad', notes: 'Dual Date 1776~2026 Semiquincentennial Quarter' });
    addIssue('quarters-2026-semiquincentennial', 2026, 'D', `2026-D (1776~2026) ${d} — Denver`, { comp: 'Cu-Ni Clad' });
    addIssue('quarters-2026-semiquincentennial', 2026, 'S', `2026-S (1776~2026) ${d} — San Francisco Silver Proof`, { type: 'Proof', comp: 'Fine Silver' });
  }

  // ==========================================
  // 9. HALF DOLLARS: Walking Liberty, Franklin, Kennedy, 2026
  // ==========================================
  // Walking Liberty Half Dollar (1916-1947)
  addIssue('walking-liberty-half-dollar', 1916, 'NONE', '1916 — Philadelphia (No Mint Mark)', { comp: '90% Silver' });
  addIssue('walking-liberty-half-dollar', 1916, 'D', '1916-D (Denver — Mint Mark on Obverse)', { comp: '90% Silver' });
  addIssue('walking-liberty-half-dollar', 1916, 'S', '1916-S (San Francisco — Mint Mark on Obverse)', { comp: '90% Silver' });
  for (let y = 1917; y <= 1947; y++) {
    addIssue('walking-liberty-half-dollar', y, 'NONE', `${y} — Philadelphia (No Mint Mark)`, { comp: '90% Silver' });
    if (y <= 1921 || y >= 1934) addIssue('walking-liberty-half-dollar', y, 'D', `${y}-D (Denver)`, { comp: '90% Silver', notes: y === 1921 ? 'Key date' : undefined });
    if (y <= 1923 || y >= 1933) addIssue('walking-liberty-half-dollar', y, 'S', `${y}-S (San Francisco)`, { comp: '90% Silver', notes: y === 1921 ? 'Key date' : undefined });
  }

  // Franklin Half Dollar (1948-1963)
  for (let y = 1948; y <= 1963; y++) {
    addIssue('franklin-half-dollar', y, 'NONE', `${y} — Philadelphia (No Mint Mark)`, { comp: '90% Silver' });
    addIssue('franklin-half-dollar', y, 'D', `${y}-D (Denver)`, { comp: '90% Silver' });
    if (y <= 1954) addIssue('franklin-half-dollar', y, 'S', `${y}-S (San Francisco)`, { comp: '90% Silver' });
  }

  // Kennedy Half Dollar (1964-2025)
  addIssue('kennedy-half-dollar', 1964, 'NONE', '1964 — Philadelphia 90% Silver (No Mint Mark)', { comp: '90% Silver', notes: 'Only year Kennedy half was minted in 90% silver for circulation' });
  addIssue('kennedy-half-dollar', 1964, 'D', '1964-D (Denver 90% Silver)', { comp: '90% Silver' });
  // 1965-1970 40% Silver
  for (let y = 1965; y <= 1970; y++) {
    if (y >= 1965 && y <= 1967) {
      addIssue('kennedy-half-dollar', y, 'NONE', `${y} 40% Silver (No Mint Mark per 1965 Act)`, { comp: '40% Silver' });
    } else if (y === 1968 || y === 1969) {
      addIssue('kennedy-half-dollar', y, 'D', `${y}-D (Denver 40% Silver)`, { comp: '40% Silver' });
    } else if (y === 1970) {
      addIssue('kennedy-half-dollar', 1970, 'D', '1970-D (Denver 40% Silver — Mint Set Only Key)', { comp: '40% Silver', notes: 'Not issued for circulation; key date' });
    }
  }
  // 1971-2025
  for (let y = 1971; y <= 2025; y++) {
    if (y === 1976) {
      addIssue('kennedy-half-dollar', 1976, 'NONE', '1976 Bicentennial (Independence Hall) — Philadelphia', { comp: 'Cu-Ni Clad' });
      addIssue('kennedy-half-dollar', 1976, 'D', '1976-D Bicentennial (Independence Hall) — Denver', { comp: 'Cu-Ni Clad' });
    } else {
      const pCode = y >= 1980 ? 'P' : 'NONE';
      const pName = y >= 1980 ? `${y}-P (Philadelphia)` : `${y} — Philadelphia (No Mint Mark)`;
      addIssue('kennedy-half-dollar', y, pCode, pName, { comp: 'Cu-Ni Clad' });
      addIssue('kennedy-half-dollar', y, 'D', `${y}-D (Denver)`, { comp: 'Cu-Ni Clad' });
    }
  }

  // 2026 Semiquincentennial Half Dollar
  addIssue('kennedy-half-dollar-2026', 2026, 'P', '2026-P Semiquincentennial Half Dollar — Philadelphia', { comp: 'Cu-Ni Clad', notes: '250th Anniversary Semiquincentennial Design' });
  addIssue('kennedy-half-dollar-2026', 2026, 'D', '2026-D Semiquincentennial Half Dollar — Denver', { comp: 'Cu-Ni Clad' });
  addIssue('kennedy-half-dollar-2026', 2026, 'S', '2026-S Semiquincentennial Half Dollar — San Francisco Silver Proof', { type: 'Proof', comp: 'Fine Silver' });

  // ==========================================
  // 10. DOLLAR COINS: Morgan, Peace, Ike, SBA, Sacagawea, Presidential, Innovation
  // ==========================================
  // Morgan Dollar (1878-1904, 1921) - EXACT HISTORICAL PRODUCTION RECORD
  const morganProduction: Record<number, ('P' | 'CC' | 'O' | 'S' | 'D')[]> = {
    1878: ['P', 'CC', 'S'],
    1879: ['P', 'CC', 'O', 'S'],
    1880: ['P', 'CC', 'O', 'S'],
    1881: ['P', 'CC', 'O', 'S'],
    1882: ['P', 'CC', 'O', 'S'],
    1883: ['P', 'CC', 'O', 'S'],
    1884: ['P', 'CC', 'O', 'S'],
    1885: ['P', 'CC', 'O', 'S'], // 1885: P, CC, O, S!
    1886: ['P', 'O', 'S'],
    1887: ['P', 'O', 'S'],
    1888: ['P', 'O', 'S'],
    1889: ['P', 'CC', 'O', 'S'], // 1889: P, CC, O, S! (No D, no C, no W!)
    1890: ['P', 'CC', 'O', 'S'],
    1891: ['P', 'CC', 'O', 'S'],
    1892: ['P', 'CC', 'O', 'S'],
    1893: ['P', 'CC', 'O', 'S'],
    1894: ['P', 'O', 'S'],
    1895: ['P', 'O', 'S'], // 1895-P King of Morgans (Proof only)
    1896: ['P', 'O', 'S'],
    1897: ['P', 'O', 'S'],
    1898: ['P', 'O', 'S'],
    1899: ['P', 'O', 'S'],
    1900: ['P', 'O', 'S'],
    1901: ['P', 'O', 'S'],
    1902: ['P', 'O', 'S'],
    1903: ['P', 'O', 'S'],
    1904: ['P', 'O', 'S'],
    1921: ['P', 'D', 'S'] // 1921-D: Only year Morgan minted in Denver!
  };

  for (let y = 1878; y <= 1921; y++) {
    const mints = morganProduction[y];
    if (!mints) continue;

    for (const m of mints) {
      let name = `${y} — Philadelphia (No Mint Mark)`;
      let notes: string | undefined = undefined;

      if (m === 'CC') {
        name = `${y}-CC (Carson City)`;
        notes = (y === 1889) ? 'Legendary premier Carson City key date (mintage 350,000)' : 'Carson City Comstock silver strike';
      } else if (m === 'O') {
        name = `${y}-O (New Orleans)`;
      } else if (m === 'S') {
        name = `${y}-S (San Francisco)`;
        if (y === 1893) notes = 'The ultimate regular strike Morgan key date (mintage 100,000)';
      } else if (m === 'D') {
        name = '1921-D (Denver — Only Year Morgan Struck at Denver!)';
        notes = 'Denver commenced operations in 1906, so 1921 was the sole Morgan dollar minted there';
      } else if (y === 1895 && m === 'P') {
        name = '1895 King of Morgans (Philadelphia Proof Only)';
        notes = 'The "King of Morgan Dollars". Only 880 proof coins struck, zero circulating business strikes recorded.';
      }

      addIssue('morgan-dollar', y, m, name, { comp: '90% Silver, 10% Copper', weight: 26.73, diam: 38.1, notes });
    }
  }

  // Peace Dollar (1921-1935)
  addIssue('peace-dollar', 1921, 'P', '1921 High Relief (Philadelphia — Key Date)', { comp: '90% Silver', notes: 'First year struck in exquisite High Relief to celebrate the end of World War I' });
  for (let y = 1922; y <= 1935; y++) {
    if (y >= 1929 && y <= 1933) continue; // No Peace dollars struck 1929-1933!
    addIssue('peace-dollar', y, 'P', `${y} — Philadelphia (No Mint Mark)`, { comp: '90% Silver' });
    if (y <= 1927 || y === 1934) addIssue('peace-dollar', y, 'D', `${y}-D (Denver)`, { comp: '90% Silver' });
    if (y <= 1928 || y >= 1934) addIssue('peace-dollar', y, 'S', `${y}-S (San Francisco)`, { comp: '90% Silver', notes: y === 1928 ? 'Key date lowest mintage of series (360,649)' : undefined });
  }

  // ==========================================
  // 11. GOLD COINAGE
  // ==========================================
  // Three Dollar Gold (1854-1889)
  addIssue('three-dollar-gold', 1854, 'P', '1854 — Philadelphia (No Mint Mark)', { comp: '90% Gold' });
  addIssue('three-dollar-gold', 1854, 'D_DAHLONEGA', '1854-D (Dahlonega Mint — Legendary Gold Rarity)', {
    comp: '90% Gold',
    notes: 'One of the greatest rarities in American numismatics. Only 1,120 coins struck at the Dahlonega, Georgia mint before closing in 1861.'
  });
  addIssue('three-dollar-gold', 1854, 'O', '1854-O (New Orleans)', { comp: '90% Gold' });
  for (let y = 1855; y <= 1889; y++) {
    addIssue('three-dollar-gold', y, 'P', `${y} Three Dollar Gold — Philadelphia`, { comp: '90% Gold' });
    if (y === 1855 || y === 1856 || y === 1857 || y === 1860) {
      addIssue('three-dollar-gold', y, 'S', `${y}-S Three Dollar Gold (San Francisco)`, { comp: '90% Gold' });
    }
  }

  // Gold Dollar ($1) (1849-1889)
  // Showcases Dahlonega, Charlotte, New Orleans, San Francisco, Philadelphia!
  addIssue('gold-dollar', 1849, 'P', '1849 Type 1 Liberty Head — Philadelphia', { comp: '90% Gold' });
  addIssue('gold-dollar', 1849, 'C', '1849-C Type 1 (Charlotte Mint Gold)', { comp: '90% Gold', notes: 'Charlotte, North Carolina gold rush strike' });
  addIssue('gold-dollar', 1849, 'D_DAHLONEGA', '1849-D Type 1 (Dahlonega Mint Gold)', { comp: '90% Gold', notes: 'Georgia gold deposit coin' });
  addIssue('gold-dollar', 1849, 'O', '1849-O Type 1 (New Orleans Mint)', { comp: '90% Gold' });
  addIssue('gold-dollar', 1854, 'P', '1854 Type 2 Small Indian Head — Philadelphia', { comp: '90% Gold' });
  addIssue('gold-dollar', 1855, 'C', '1855-C Type 2 (Charlotte)', { comp: '90% Gold' });
  addIssue('gold-dollar', 1855, 'D_DAHLONEGA', '1855-D Type 2 (Dahlonega)', { comp: '90% Gold' });
  addIssue('gold-dollar', 1855, 'O', '1855-O Type 2 (New Orleans)', { comp: '90% Gold' });
  addIssue('gold-dollar', 1856, 'P', '1856 Type 3 Large Indian Head — Philadelphia', { comp: '90% Gold' });
  addIssue('gold-dollar', 1856, 'S', '1856-S Type 3 (San Francisco)', { comp: '90% Gold' });
  addIssue('gold-dollar', 1861, 'D_DAHLONEGA', '1861-D Gold Dollar (Dahlonega Civil War Issue)', { comp: '90% Gold', notes: 'Struck by the State of Georgia or Confederate authorities after seizing the Dahlonega Mint' });

  // Double Eagle $20 (1849-1933)
  addIssue('double-eagle-gold', 1850, 'P', '1850 Liberty Head Type 1 (No Motto) — Philadelphia', { comp: '90% Gold' });
  addIssue('double-eagle-gold', 1850, 'O', '1850-O (New Orleans)', { comp: '90% Gold' });
  addIssue('double-eagle-gold', 1854, 'S', '1854-S (First Year San Francisco $20 Double Eagle)', { comp: '90% Gold', notes: 'California Gold Rush strike' });
  addIssue('double-eagle-gold', 1870, 'CC', '1870-CC (Carson City — Holy Grail of U.S. Gold)', { comp: '90% Gold', notes: 'First year of Carson City Mint gold coinage; only ~40 to 50 known to survive' });
  addIssue('double-eagle-gold', 1877, 'P', '1877 Liberty Head Type 3 (TWENTY DOLLARS spelled out)', { comp: '90% Gold' });
  addIssue('double-eagle-gold', 1907, 'P', '1907 Saint-Gaudens High Relief (Wire Rim) — Masterpiece', { comp: '90% Gold', notes: 'Regarded by collectors as the most beautiful coin in American history' });
  addIssue('double-eagle-gold', 1908, 'P', '1908 Saint-Gaudens With Motto — Philadelphia', { comp: '90% Gold' });
  addIssue('double-eagle-gold', 1908, 'D', '1908-D Saint-Gaudens (Denver)', { comp: '90% Gold', notes: 'First year Denver struck Double Eagles' });
  addIssue('double-eagle-gold', 1908, 'S', '1908-S Saint-Gaudens (San Francisco)', { comp: '90% Gold' });
  addIssue('double-eagle-gold', 1924, 'P', '1924 Saint-Gaudens — Philadelphia', { comp: '90% Gold' });
  addIssue('double-eagle-gold', 1927, 'D', '1927-D Saint-Gaudens (Extremely Rare)', { comp: '90% Gold', notes: 'Rarest regular issue 20th century coin; nearly all melted after 1933 Gold Recall' });
  addIssue('double-eagle-gold', 1933, 'P', '1933 Saint-Gaudens ($18.9 Million World Record)', { comp: '90% Gold', notes: 'The famed 1933 Double Eagle, sold at Sotheby\'s for $18.9 million' });

  return issues;
}
