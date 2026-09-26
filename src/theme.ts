// Centralized Theme System for PocketAlbum
// Vintage Numismatic Collector Aesthetic: Dark charcoal, deep brown leather, antique gold accents, and parchment typography

export const THEME = {
  colors: {
    // Primary background: Near-black charcoal
    bgPrimary: '#0e0c0a',
    // Secondary background: Very dark brown/charcoal
    bgSecondary: '#16110d',
    bgSecondaryElevated: '#1e1712',

    // Cards: Deep brown / dark leather appearance
    cardLeather: '#241a13',
    cardLeatherLight: '#2c2018',
    cardLeatherDeep: '#1b130e',
    cardLeatherHover: '#33251c',

    // Borders: Antique gold / bronze
    borderGold: '#8f6d33',
    borderGoldSubtle: '#5a4420',
    borderGoldBright: '#cba153',
    borderGoldGlow: '#f0c868',

    // Primary text: Warm ivory / parchment
    textParchment: '#f7eedd',
    textParchmentDim: '#dfd4bf',

    // Secondary text: Muted warm gray
    textMuted: '#a89c8d',
    textFaint: '#736858',

    // Accent: Antique gold
    accentGold: '#cba153',
    accentGoldHover: '#dfb86c',
    accentGoldDark: '#99732b',

    // Status / Accents
    goldGlow: 'rgba(203, 161, 83, 0.25)',
  },

  classes: {
    // Canvas & Main containers
    page: 'bg-[#0e0c0a] text-[#f7eedd] min-h-screen antialiased selection:bg-[#cba153] selection:text-[#0e0c0a]',
    surface: 'bg-[#16110d] border border-[#5a4420]/50 text-[#f7eedd]',
    
    // Leather Cards & Panels
    card: 'bg-gradient-to-b from-[#261c15] to-[#1c140e] border border-[#7a5c28]/45 shadow-xl shadow-black/70 rounded-2xl transition-all duration-200',
    cardHover: 'hover:border-[#cba153]/70 hover:shadow-[#cba153]/10 hover:-translate-y-0.5',
    cardInteractive: 'bg-gradient-to-b from-[#261c15] to-[#1c140e] border border-[#7a5c28]/45 hover:border-[#cba153]/80 shadow-lg shadow-black/60 rounded-2xl transition-all duration-200 active:scale-[0.99]',
    panel: 'bg-gradient-to-b from-[#241a13] via-[#1c140f] to-[#140e0a] border border-[#85652e]/45 shadow-2xl shadow-black/80 rounded-2xl',
    
    // Antique Gold Trimmed Sections
    goldFrame: 'border-2 border-[#8f6d33]/50 rounded-2xl relative shadow-inner',
    goldDivider: 'border-t border-[#8f6d33]/30',

    // Buttons
    buttonLeather: 'bg-gradient-to-b from-[#2d2119] to-[#1e1510] hover:from-[#38291f] hover:to-[#261b14] text-[#f7eedd] border border-[#8f6d33]/70 hover:border-[#dfb86c] shadow-md shadow-black/50 rounded-xl transition-all duration-200 active:scale-[0.98]',
    buttonGold: 'bg-gradient-to-b from-[#d4af37] via-[#cba153] to-[#aa8030] hover:from-[#e2bf4f] hover:to-[#be9238] text-[#140e08] font-bold border border-[#f3cf7a] shadow-lg shadow-[#cba153]/25 rounded-xl transition-all duration-200 active:scale-[0.98]',
    buttonGhost: 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#281e16] border border-transparent hover:border-[#5a4420]/60 rounded-xl transition-colors',
    
    // Badges & Pills
    pillGold: 'bg-[#2a1e15] border border-[#8f6d33]/60 text-[#dfb86c] text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm',
    pillMuted: 'bg-[#1a130e] border border-[#4d3a1c]/60 text-[#a89c8d] text-xs font-medium px-2.5 py-1 rounded-full',

    // Form inputs
    input: 'bg-[#150f0b] border border-[#664d24]/60 focus:border-[#cba153] text-[#f7eedd] placeholder-[#736858] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#cba153]/50 transition-all',

    // Typography
    heading: 'font-serif text-[#f7eedd] tracking-wide',
    subheading: 'text-sm text-[#a89c8d]',
    goldText: 'text-[#cba153]',
    goldHeading: 'font-serif text-[#e5be6d] tracking-wider drop-shadow-sm',
  }
} as const;
