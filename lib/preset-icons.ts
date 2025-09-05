export interface PresetIcon {
  id: string;
  name: string;
  category: 'food' | 'entertainment' | 'shopping' | 'transport' | 'utilities' | 'health' | 'income' | 'other';
  domain: string; // Domain for logo API
  backgroundColor?: string;
}

// Helper function to get logo URL from domain
export const getLogoUrl = (domain: string, size: number = 128): string => {
  // Using Clearbit Logo API - completely free, no API key required, reliable
  return `https://img.logo.dev/${domain}?token=pk_Hoc4cN7GStGCaS7I6TkKuA`;
};

// Helper functions for the IconSelector component
export const iconCategories: ('food' | 'entertainment' | 'shopping' | 'transport' | 'utilities' | 'health' | 'income' | 'other')[] = [
  'food', 'entertainment', 'shopping', 'transport', 'utilities', 'health', 'income', 'other'
];

export const getPresetIconsByCategory = (category: string) => {
  return presetIcons.filter(icon => icon.category === category);
};

export const getPresetIconById = (id: string) => {
  return presetIcons.find(icon => icon.id === id);
};

export const presetIcons: PresetIcon[] = [
  // Food & Restaurants
  {
    id: 'mcdonalds',
    name: 'McDonald\'s',
    category: 'food',
    domain: 'mcdonalds.com',
    backgroundColor: '#FFC72C'
  },
  {
    id: 'starbucks',
    name: 'Starbucks',
    category: 'food',
    domain: 'starbucks.com',
    backgroundColor: '#00704A'
  },
  // Belgian Food & Restaurants
  {
    id: 'delhaize',
    name: 'Delhaize',
    category: 'food',
    domain: 'delhaize.be',
    backgroundColor: '#E31E24'
  },
  {
    id: 'colruyt',
    name: 'Colruyt',
    category: 'food',
    domain: 'colruyt.be',
    backgroundColor: '#009639'
  },
  {
    id: 'carrefour-be',
    name: 'Carrefour',
    category: 'food',
    domain: 'carrefour.be',
    backgroundColor: '#ffffff'
  },
  {
    id: 'aldi-be',
    name: 'Aldi',
    category: 'food',
    domain: 'aldi.be',
    backgroundColor: '#FF6600'
  },
  {
    id: 'lidl-be',
    name: 'Lidl',
    category: 'food',
    domain: 'lidl.be',
    backgroundColor: '#0050AA'
  },
  {
    id: 'quick',
    name: 'Quick',
    category: 'food',
    domain: 'quick.be',
    backgroundColor: '#FF0000'
  },

  // Entertainment & Media
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'entertainment',
    domain: 'spotify.com',
    backgroundColor: '#1DB954'
  },
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'entertainment',
    domain: 'netflix.com',
    backgroundColor: '#E50914'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'entertainment',
    domain: 'youtube.com',
    backgroundColor: '#FF0000'
  },
  {
    id: 'disney',
    name: 'Disney+',
    category: 'entertainment',
    domain: 'disneyplus.com',
    backgroundColor: '#113CCF'
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    category: 'entertainment',
    domain: 'music.apple.com',
    backgroundColor: '#FA2D48'
  },
  // Belgian Entertainment & Media
  {
    id: 'kinepolis',
    name: 'Kinepolis',
    category: 'entertainment',
    domain: 'kinepolis.be',
    backgroundColor: '#E31E24'
  },
  // Shopping & Retail
  {
    id: 'amazon',
    name: 'Amazon',
    category: 'shopping',
    domain: 'amazon.com',
    backgroundColor: '#FF9900'
  },
  {
    id: 'apple',
    name: 'Apple Store',
    category: 'shopping',
    domain: 'apple.com',
    backgroundColor: '#007AFF'
  },

  // Belgian Shopping & Retail
  {
    id: 'fnac-be',
    name: 'Fnac',
    category: 'shopping',
    domain: 'fnac.be',
    backgroundColor: '#F79100'
  },
  {
    id: 'mediamarkt-be',
    name: 'MediaMarkt',
    category: 'shopping',
    domain: 'mediamarkt.be',
    backgroundColor: '#CC0000'
  },
  {
    id: 'kruidvat',
    name: 'Kruidvat',
    category: 'shopping',
    domain: 'kruidvat.be',
    backgroundColor: '#E31E24'
  },
  {
    id: 'ici-paris-xl',
    name: 'ICI PARIS XL',
    category: 'shopping',
    domain: 'iciparisxl.be',
    backgroundColor: '#000000'
  },
  {
    id: 'coolblue-be',
    name: 'Coolblue',
    category: 'shopping',
    domain: 'coolblue.be',
    backgroundColor: '#0055BB'
  },
  {
    id: 'bol-com',
    name: 'bol.com',
    category: 'shopping',
    domain: 'bol.com',
    backgroundColor: '#0B7EC8'
  },
  // Transportation
  {
    id: 'uber',
    name: 'Uber',
    category: 'transport',
    domain: 'uber.com',
    backgroundColor: '#000000'
  },
  // Belgian Transport
  {
    id: 'sncb',
    name: 'SNCB/NMBS',
    category: 'transport',
    domain: 'belgiantrain.be',
    backgroundColor: '#003F7F'
  },
  {
    id: 'de-lijn',
    name: 'De Lijn',
    category: 'transport',
    domain: 'delijn.be',
    backgroundColor: '#0066CC'
  },
  {
    id: 'total-be',
    name: 'TotalEnergies',
    category: 'transport',
    domain: 'totalenergies.be',
    backgroundColor: '#FF0000'
  },

  // Belgian Utilities & Services
  {
    id: 'proximus',
    name: 'Proximus',
    category: 'utilities',
    domain: 'proximus.be',
    backgroundColor: '#7B3F98'
  },
  {
    id: 'orange-be',
    name: 'Orange Belgium',
    category: 'utilities',
    domain: 'orange.be',
    backgroundColor: '#FF6600'
  },
  {
    id: 'base-be',
    name: 'Base',
    category: 'utilities',
    domain: 'base.be',
    backgroundColor: '#0066CC'
  },
  {
    id: 'telenet',
    name: 'Telenet',
    category: 'utilities',
    domain: 'telenet.be',
    backgroundColor: '#009639'
  },
  {
    id: 'engie-be',
    name: 'Engie',
    category: 'utilities',
    domain: 'engie.be',
    backgroundColor: '#00B4A6'
  },
  {
    id: 'luminus',
    name: 'Luminus',
    category: 'utilities',
    domain: 'luminus.be',
    backgroundColor: '#0066B3'
  },
  {
    id: 'edenred',
    name: 'Edenred',
    category: 'utilities',
    domain: 'edenred.be',
    backgroundColor: '#ffffff'
  },
  {
    id: 'sodexo',
    name: 'Sodexo',
    category: 'utilities',
    domain: 'sodexo.be',
    backgroundColor: '#0066CC'
  },
  {
    id: 'pluxee',
    name: 'Pluxee',
    category: 'utilities',
    domain: 'pluxee.be',
    backgroundColor: '#0066CC'
  },
  // Belgian Health & Wellness
  {
    id: 'helan',
    name: 'Helan',
    category: 'health',
    domain: 'helan.be',
    backgroundColor: '#ffffff'
  },
  {
    id: 'cm',
    name: 'CM',
    category: 'health',
    domain: 'cm.be',
    backgroundColor: '#0066CC'
  },
  {
    id: 'oz',
    name: 'OZ',
    category: 'health',
    domain: 'oz.be',
    backgroundColor: '#009639'
  },
  {
    id: 'partena',
    name: 'Partena',
    category: 'health',
    domain: 'partena.be',
    backgroundColor: '#E31E24'
  },
  {
    id: 'basic-fit',
    name: 'Basic-Fit',
    category: 'health',
    domain: 'basic-fit.be',
    backgroundColor: '#FF6600'
  },
  {
    id: 'jims',
    name: 'Jims',
    category: 'health',
    domain: 'jims.be',
    backgroundColor: '#0066CC'
  },
  // Payment & Financial Services
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'income',
    domain: 'paypal.com',
    backgroundColor: '#0070BA'
  },
  {
    id: 'visa',
    name: 'Visa',
    category: 'income',
    domain: 'visa.com',
    backgroundColor: '#1932d5'
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    category: 'income',
    domain: 'mastercard.com',
    backgroundColor: '#0070BA'
  },

  // Belgian Banks & Financial
  {
    id: 'kbc',
    name: 'KBC',
    category: 'income',
    domain: 'kbc.be',
    backgroundColor: '#ffffff'
  },
  {
    id: 'ing-be',
    name: 'ING Belgium',
    category: 'income',
    domain: 'ing.be',
    backgroundColor: '#FF6200'
  },
  {
    id: 'belfius',
    name: 'Belfius',
    category: 'income',
    domain: 'belfius.be',
    backgroundColor: '#7B3F98'
  },
  {
    id: 'bnp-paribas-be',
    name: 'BNP Paribas Fortis',
    category: 'income',
    domain: 'bnpparibasfortis.be',
    backgroundColor: '#009639'
  },
  {
    id: 'argenta',
    name: 'Argenta',
    category: 'income',
    domain: 'argenta.be',
    backgroundColor: '#0066B3'
  },
  {
    id: 'crelan',
    name: 'Crelan',
    category: 'income',
    domain: 'crelan.be',
    backgroundColor: '#E31E24'
  },

  // Other Services
  {
    id: 'microsoft',
    name: 'Microsoft',
    category: 'other',
    domain: 'microsoft.com',
    backgroundColor: '#0078D4'
  },
  {
    id: 'google',
    name: 'Google',
    category: 'other',
    domain: 'google.com',
    backgroundColor: '#4285F4'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'other',
    domain: 'linkedin.com',
    backgroundColor: '#0A66C2'
  },

  // Belgian Services & Other
  {
    id: 'bpost',
    name: 'bpost',
    category: 'other',
    domain: 'bpost.be',
    backgroundColor: '#FFD700'
  },
  {
    id: 'agoria',
    name: 'Agoria',
    category: 'other',
    domain: 'agoria.be',
    backgroundColor: '#0066CC'
  }
];