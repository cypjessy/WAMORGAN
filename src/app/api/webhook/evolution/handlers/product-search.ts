// ─── Product Search Handler ─────────────────────────────────────────────────
// Handles product search inquiries via WhatsApp, adapted from WhatsApp WAMORGAN
// for WAMORGAN's in-memory data model.
//
// ⚡ No Firebase dependency — uses static mock data or can be extended with API calls.

export interface Deps {
  sendTypingIndicator: (tenantId: string, phone: string) => Promise<void>;
  stopTypingIndicator: (tenantId: string, phone: string) => Promise<void>;
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  sendMedia?: (tenantId: string, phone: string, mediaUrl: string, caption: string) => Promise<void>;
  setFlowState: (tenantId: string, phone: string, state: any) => Promise<void>;
  getProducts?: () => Promise<any[]>;
}

// ─── Fuzzy Matching ─────────────────────────────────────────────────────────

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
  return matrix[b.length][a.length];
}

function isFuzzyMatch(a: string, b: string, maxDistance: number = 2): boolean {
  if (!a || !b) return false;
  return levenshteinDistance(a, b) <= maxDistance;
}

// ─── Mock Product Catalog ────────────────────────────────────────────────────
// In production, this would be replaced with a Firestore or API query.

const MOCK_PRODUCTS = [
  { id: '1', name: 'Nike Air Max 270', price: 185, description: 'Comfortable lifestyle sneaker with Max Air unit', category: 'Fashion & Apparel', subcategory: 'Shoes', brand: 'Nike', stock: 25, image: '' },
  { id: '2', name: 'iPhone 15 Pro Max', price: 1199, description: 'Apple flagship smartphone with A17 Pro chip', category: 'Electronics & Mobile', subcategory: 'Smartphones', brand: 'Apple', stock: 10, image: '' },
  { id: '3', name: 'Sony WH-1000XM5', price: 348, description: 'Industry-leading noise canceling wireless headphones', category: 'Electronics & Mobile', subcategory: 'Headphones', brand: 'Sony', stock: 15, image: '' },
  { id: '4', name: 'Apple Watch Series 9', price: 399, description: 'Advanced health and fitness smartwatch', category: 'Electronics & Mobile', subcategory: 'Wearables', brand: 'Apple', stock: 8, image: '' },
  { id: '5', name: 'Leather Jacket', price: 249, description: 'Premium genuine leather jacket', category: 'Fashion & Apparel', subcategory: 'Outerwear', brand: 'Fashion Brand', stock: 12, image: '' },
  { id: '6', name: 'Yoga Mat Premium', price: 68, description: 'Extra thick non-slip exercise yoga mat', category: 'Sports & Outdoors', subcategory: 'Fitness', brand: 'SportPro', stock: 30, image: '' },
  { id: '7', name: 'Smart LED Lamp', price: 45, description: 'WiFi-enabled RGB smart desk lamp', category: 'Home & Living', subcategory: 'Lighting', brand: 'HomeSmart', stock: 20, image: '' },
  { id: '8', name: 'Face Serum Vitamin C', price: 32, description: 'Brightening vitamin C face serum', category: 'Beauty & Personal Care', subcategory: 'Skincare', brand: 'GlowUp', stock: 40, image: '' },
  { id: '9', name: 'LEGO Star Wars Set', price: 129, description: 'Collectible Star Wars building set', category: 'Toys & Games', subcategory: 'Building Sets', brand: 'LEGO', stock: 7, image: '' },
  { id: '10', name: 'Running Shorts', price: 35, description: 'Lightweight quick-dry running shorts', category: 'Fashion & Apparel', subcategory: 'Activewear', brand: 'SportPro', stock: 50, image: '' },
];

const categoryMapping: Record<string, string> = {
  'fashion': 'Fashion & Apparel',
  'electronics': 'Electronics & Mobile',
  'sports': 'Sports & Outdoors',
  'home': 'Home & Living',
  'beauty': 'Beauty & Personal Care',
  'toys': 'Toys & Games',
  'shoes': 'Fashion & Apparel',
  'clothes': 'Fashion & Apparel',
  'phone': 'Electronics & Mobile',
  'computer': 'Electronics & Mobile',
  'headphone': 'Electronics & Mobile',
  'watch': 'Electronics & Mobile',
  'wearable': 'Electronics & Mobile',
  'fitness': 'Sports & Outdoors',
  'lamp': 'Home & Living',
  'skincare': 'Beauty & Personal Care',
  'serum': 'Beauty & Personal Care',
  'lego': 'Toys & Games',
  'toy': 'Toys & Games',
};

// ─── Main Handler ───────────────────────────────────────────────────────────

export async function handleProductSearch(
  tenantId: string,
  phone: string,
  query: string,
  deps: Deps
): Promise<void> {
  await deps.sendTypingIndicator(tenantId, phone);

  try {
    // Clean search term
    let searchTerm = query
      .replace(/^(am looking for|i am looking for|looking for|searching for|want to buy|need to buy|do you have|show me|find|i want|i need|can i get)\s+/i, '')
      .trim();

    if (!searchTerm) searchTerm = query.trim();

    // Minimum query length
    if (searchTerm.length < 2) {
      await deps.stopTypingIndicator(tenantId, phone);
      await deps.sendMessage(tenantId, phone,
        `⚠️ Please enter at least 2 characters to search.\n\nExample: "shoes", "phone", "laptop"\n\n0️⃣ - Back to main menu`
      );
      return;
    }

    const searchLower = searchTerm.toLowerCase();

    const products = deps.getProducts ? await deps.getProducts() : MOCK_PRODUCTS;

    // Score products with fuzzy matching
    const scoredProducts = products.map((product: any) => {
      let score = 0;
      const name = (product.name || '').toLowerCase();
      const brand = (product.brand || '').toLowerCase();
      const category = (product.category || '').toLowerCase();
      const subcategory = (product.subcategory || '').toLowerCase();
      const description = (product.description || '').toLowerCase();

      // Exact name match
      if (name === searchLower) score += 200;
      // Name starts with
      if (name.startsWith(searchLower)) score += 150;
      // Name contains
      if (name.includes(searchLower)) score += 100;
      // Fuzzy name match
      if (isFuzzyMatch(name, searchLower, 2) && !name.includes(searchLower)) score += 80;

      // Word matching
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
      const nameWords = name.split(/\s+/);
      for (const sw of searchWords)
        for (const nw of nameWords)
          if (nw === sw) score += 60;
          else if (nw.includes(sw) || sw.includes(nw)) score += 30;

      // Brand match
      if (brand === searchLower) score += 80;
      else if (brand.includes(searchLower)) score += 50;
      else if (isFuzzyMatch(brand, searchLower, 2)) score += 30;

      // Category match
      if (category === searchLower || subcategory === searchLower) score += 60;
      else if (category.includes(searchLower) || subcategory.includes(searchLower)) score += 40;

      // Category mapping (e.g., "shoes" → "Fashion & Apparel")
      for (const [key, mappedCat] of Object.entries(categoryMapping)) {
        if (key === searchLower && category.includes(mappedCat.toLowerCase())) {
          score += 50;
          break;
        }
      }

      // Description match
      if (description.includes(searchLower)) score += 15;

      return { ...product, score };
    }).filter(p => p.score > 0);

    // Sort by score descending
    scoredProducts.sort((a: any, b: any) => b.score - a.score);

    // No results
    if (scoredProducts.length === 0) {
      await deps.stopTypingIndicator(tenantId, phone);
      await deps.sendMessage(tenantId, phone,
        `🔍 No products found for "${searchTerm}".\n\n` +
        `Try different keywords like: "shoes", "phone", "watch", "headphones"\n\n` +
        `Or type *0* for the main menu.`
      );
      return;
    }

    // Show top 5 results
    const results = scoredProducts.slice(0, 5);
    const totalResults = scoredProducts.length;

    let headerMessage = `🔍 *Search Results for "${searchTerm}"*\n\n`;
    headerMessage += `Found ${totalResults} product${totalResults > 1 ? 's' : ''}:\n\n`;
    await deps.sendMessage(tenantId, phone, headerMessage);

    for (let idx = 0; idx < results.length; idx++) {
      const product = results[idx];
      const stockLabel = product.stock === 0
        ? '❌ Out of stock'
        : product.stock <= 5
          ? `⚠️ Only ${product.stock} left`
          : `✅ In stock`;

      let productText = `*${idx + 1}. ${product.name}*  ⭐\n`;
      productText += `   💰 KSh ${product.price.toFixed(2)}\n`;
      productText += `   📦 ${stockLabel}\n`;
      if (product.brand) productText += `   🏷️ Brand: ${product.brand}\n`;
      productText += `   📂 ${product.category}\n`;
      if (product.description) {
        productText += `   📝 ${product.description.substring(0, 120)}${product.description.length > 120 ? '...' : ''}\n`;
      }

      await deps.sendMessage(tenantId, phone, productText);

      if (idx < results.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    // Navigation options
    let replyMessage = `━━━━━━━━━━━━━━━\n\n`;
    replyMessage += `0️⃣ - Back to main menu\n`;
    if (totalResults > 5) {
      replyMessage += `\n_Showing the top ${5} of ${totalResults} results. Try a more specific search to narrow it down._`;
    }

    await deps.sendMessage(tenantId, phone, replyMessage);

  } catch (error) {
    console.error('[ProductSearch] Error:', error);
    await deps.stopTypingIndicator(tenantId, phone);
    await deps.sendMessage(tenantId, phone,
      `❌ Search failed. Please try again or type *0* for the main menu.`
    );
  }
}
