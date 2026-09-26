// Preset high-quality numismatic photo assets for testing and easy uploads

export interface PhotoPreset {
  id: string;
  name: string;
  category: 'copper' | 'silver' | 'gold' | 'nickel' | 'bullion' | 'slab';
  url: string;
}

export const PHOTO_PRESETS: PhotoPreset[] = [
  {
    id: 'preset_indian_obv',
    name: 'Indian Cent Obverse (Gem Red)',
    category: 'copper',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset_copper_brown',
    name: 'Classic Cent Chocolate Brown',
    category: 'copper',
    url: 'https://images.unsplash.com/photo-1621981386829-9b458a21ddde?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset_morgan_dollar',
    name: 'Morgan Dollar DMPL Luster',
    category: 'silver',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset_silver_eagle',
    name: 'Walking Liberty Silver Crown',
    category: 'silver',
    url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset_gold_eagle',
    name: 'Saint-Gaudens Double Eagle Gold',
    category: 'gold',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset_gold_bullion',
    name: 'Fine Gold Ingot Bar',
    category: 'bullion',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset_silver_bar',
    name: 'Engelhard Poured Silver Bar',
    category: 'bullion',
    url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset_pcgs_slab',
    name: 'Certified Slab Holder View',
    category: 'slab',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80'
  }
];

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
