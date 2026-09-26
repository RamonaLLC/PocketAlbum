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

export const MASTER_MINTS: MasterMint[] = [
  {
    id: 'mint_philadelphia',
    name: 'Philadelphia Mint',
    mint_mark: '', // Historically no mint mark on circulating coins
    display_mint_mark: 'No Mint Mark / P',
    location: 'Philadelphia, Pennsylvania',
    opening_year: 1792,
    closing_year: null,
    periods_of_operation: '1792–present',
    denominations_produced: 'All U.S. denominations (Half Cents through Double Eagles, modern bullion & commemoratives)',
    special_notes: 'The mother mint. Historically produced coins without a mint mark. The "P" mint mark was first introduced on 1942–1945 wartime silver nickels, on the 1979 Susan B. Anthony Dollar, on all denominations except the cent beginning in 1980, and on the 2017 Lincoln Cent for the 225th Mint Anniversary.'
  },
  {
    id: 'mint_san_francisco',
    name: 'San Francisco Mint',
    mint_mark: 'S',
    display_mint_mark: 'S',
    location: 'San Francisco, California',
    opening_year: 1854,
    closing_year: null,
    periods_of_operation: '1854–present (circulating production ended 1955; resumed 1968–1974 for circulating coins; primary proof strike facility 1968–present)',
    denominations_produced: 'Cents, Nickels, Dimes, Twenty Cents, Quarters, Halves, Dollars, Gold coins, Modern Proofs',
    special_notes: 'Established during the California Gold Rush. Renowned for sharp strikes and proof production.'
  },
  {
    id: 'mint_denver',
    name: 'Denver Mint',
    mint_mark: 'D',
    display_mint_mark: 'D',
    location: 'Denver, Colorado',
    opening_year: 1906,
    closing_year: null,
    periods_of_operation: '1906–present',
    denominations_produced: 'Cents, Nickels, Dimes, Quarters, Halves, Dollars, Gold Quarter Eagles, Half Eagles, Eagles, Double Eagles',
    special_notes: 'Distinct from Dahlonega (1838–1861). Denver commenced federal coin production in 1906 using the "D" mint mark.'
  },
  {
    id: 'mint_west_point',
    name: 'West Point Mint',
    mint_mark: 'W',
    display_mint_mark: 'W',
    location: 'West Point, New York',
    opening_year: 1984,
    closing_year: null,
    periods_of_operation: '1984–present (bullion strikes since 1973; official mint status in 1988)',
    denominations_produced: 'American Silver & Gold Eagles, Commemoratives, 1996-W Roosevelt Dime, 2019-W & 2020-W Quarters, 2019-W Lincoln Cent',
    special_notes: 'Began official W-marked coinage with the 1984 $10 Olympic Gold coin. Produced special circulating W quarters in 2019 and 2020.'
  },
  {
    id: 'mint_new_orleans',
    name: 'New Orleans Mint',
    mint_mark: 'O',
    display_mint_mark: 'O',
    location: 'New Orleans, Louisiana',
    opening_year: 1838,
    closing_year: 1909,
    periods_of_operation: '1838–1861, 1879–1909',
    denominations_produced: 'Three Cent Silver, Half Dimes, Dimes, Quarters, Half Dollars, Morgan Dollars, Gold Dollars through Double Eagles',
    special_notes: 'Operated under federal and state/Confederate control in 1861. Reopened in 1879 for Morgan Dollar and gold production until 1909.'
  },
  {
    id: 'mint_carson_city',
    name: 'Carson City Mint',
    mint_mark: 'CC',
    display_mint_mark: 'CC',
    location: 'Carson City, Nevada',
    opening_year: 1870,
    closing_year: 1893,
    periods_of_operation: '1870–1885, 1889–1893',
    denominations_produced: 'Dimes, Twenty Cents, Quarters, Half Dollars, Trade Dollars, Morgan Dollars, Half Eagles, Eagles, Double Eagles',
    special_notes: 'Built to mint silver from the Comstock Lode. The "CC" mint mark is legendary among collectors.'
  },
  {
    id: 'mint_charlotte',
    name: 'Charlotte Mint',
    mint_mark: 'C',
    display_mint_mark: 'C',
    location: 'Charlotte, North Carolina',
    opening_year: 1838,
    closing_year: 1861,
    periods_of_operation: '1838–1861',
    denominations_produced: 'Gold coins only: Gold Dollars ($1), Quarter Eagles ($2.50), Half Eagles ($5)',
    special_notes: 'Exclusively minted gold coins from North Carolina gold rush deposits. Closed during the Civil War.'
  },
  {
    id: 'mint_dahlonega',
    name: 'Dahlonega Mint',
    mint_mark: 'D',
    display_mint_mark: 'D',
    location: 'Dahlonega, Georgia',
    opening_year: 1838,
    closing_year: 1861,
    periods_of_operation: '1838–1861',
    denominations_produced: 'Gold coins only: Gold Dollars ($1), Quarter Eagles ($2.50), Three Dollar Gold ($3), Half Eagles ($5)',
    special_notes: 'CRITICAL NUMISMATIC DISTINCTION: Uses the "D" mint mark, but operated exclusively 1838–1861 for southern gold, decades before Denver opened in 1906. Identified in database as mint_dahlonega.'
  }
];
