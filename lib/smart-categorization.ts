import { Category } from '@/types';

// Common keywords for each category
const categoryKeywords: { [key: string]: string[] } = {
  'Food': [
    'restaurant', 'cafe', 'pizza', 'burger', 'sushi', 'food', 'grocery', 'supermarket',
    'mcdonalds', 'kfc', 'subway', 'starbucks', 'dominos', 'uber eats', 'deliveroo',
    'lunch', 'dinner', 'breakfast', 'snack', 'coffee', 'beer', 'wine', 'alcohol',
    'market', 'bakery', 'butcher', 'deli', 'takeaway', 'delivery'
  ],
  'Transport': [
    'gas', 'fuel', 'petrol', 'diesel', 'uber', 'taxi', 'bus', 'train', 'metro',
    'parking', 'toll', 'car', 'vehicle', 'maintenance', 'repair', 'insurance',
    'registration', 'license', 'flight', 'airline', 'airport', 'rental car',
    'bike', 'scooter', 'public transport', 'subway', 'tram'
  ],
  'Housing': [
    'rent', 'mortgage', 'utilities', 'electricity', 'gas bill', 'water', 'internet',
    'phone', 'cable', 'home', 'house', 'apartment', 'property', 'maintenance',
    'repair', 'furniture', 'appliance', 'cleaning', 'security', 'hoa'
  ],
  'Sports': [
    'gym', 'fitness', 'yoga', 'pilates', 'swimming', 'tennis', 'football', 'soccer',
    'basketball', 'running', 'cycling', 'hiking', 'climbing', 'skiing', 'golf',
    'membership', 'trainer', 'equipment', 'sportswear', 'athletic', 'workout',
    'padel', 'squash', 'badminton', 'volleyball'
  ],
  'Fun': [
    'movie', 'cinema', 'theater', 'concert', 'show', 'entertainment', 'game',
    'hobby', 'book', 'music', 'streaming', 'netflix', 'spotify', 'youtube',
    'vacation', 'travel', 'hotel', 'trip', 'party', 'bar', 'club', 'festival',
    'museum', 'zoo', 'park', 'recreation'
  ],
  'Insurance': [
    'insurance', 'health insurance', 'car insurance', 'home insurance', 'life insurance',
    'dental', 'medical', 'premium', 'deductible', 'coverage', 'policy'
  ]
};

export const suggestCategory = (transactionName: string, categories: Category[]): Category | null => {
  const name = transactionName.toLowerCase();
  
  // Find the best matching category
  let bestMatch: { category: Category; score: number } | null = null;
  
  for (const category of categories) {
    const keywords = categoryKeywords[category.name] || [];
    let score = 0;
    
    // Check for exact keyword matches
    for (const keyword of keywords) {
      if (name.includes(keyword.toLowerCase())) {
        score += keyword.length; // Longer keywords get higher scores
      }
    }
    
    // Bonus for category name match
    if (name.includes(category.name.toLowerCase())) {
      score += category.name.length * 2;
    }
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category, score };
    }
  }
  
  return bestMatch?.category || null;
};

export const addCategoryKeywords = (categoryName: string, keywords: string[]) => {
  if (!categoryKeywords[categoryName]) {
    categoryKeywords[categoryName] = [];
  }
  categoryKeywords[categoryName].push(...keywords);
};