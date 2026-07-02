// ─── Product Browse Handler ─────────────────────────────────────────────────
// Handles product browsing via WhatsApp (Categories → Subcategories/Brands → Products)

export interface ProductBrowseDeps {
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  startTyping: (tenantId: string, phone: string) => Promise<void>;
  stopTyping: (tenantId: string, phone: string) => Promise<void>;
  setFlowState: (tenantId: string, phone: string, state: any) => Promise<void>;
  getProducts?: () => Promise<any[]>;
}

const BROWSE_CATEGORIES = [
  {
    name: 'Fashion & Apparel',
    slug: 'fashion',
    icon: '👕',
    productCount: 4,
    subcategories: ['Nike', 'Fashion Brand', 'SportPro'],
    brands: ['Nike', 'Fashion Brand', 'SportPro'],
  },
  {
    name: 'Electronics & Mobile',
    slug: 'electronics',
    icon: '📱',
    productCount: 3,
    subcategories: ['Apple', 'Sony'],
    brands: ['Apple', 'Sony'],
  },
  {
    name: 'Home & Living',
    slug: 'home',
    icon: '🏠',
    productCount: 1,
    subcategories: ['HomeSmart'],
    brands: ['HomeSmart'],
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty',
    icon: '✨',
    productCount: 1,
    subcategories: ['GlowUp'],
    brands: ['GlowUp'],
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports',
    icon: '⚽',
    productCount: 1,
    subcategories: ['SportPro'],
    brands: ['SportPro'],
  },
  {
    name: 'Toys & Games',
    slug: 'toys',
    icon: '🎮',
    productCount: 1,
    subcategories: ['LEGO'],
    brands: ['LEGO'],
  },
];

function formatProductText(product: any, index: number): string {
  const stockLabel = product.stock === 0
    ? '❌ Out of stock'
    : product.stock <= 5
      ? `⚠️ Only ${product.stock} left`
      : '✅ In stock';

  let text = `*${index}. ${product.name}*\n`;
  text += `   💰 KSh ${Number(product.price || 0).toFixed(2)}\n`;
  text += `   📦 ${stockLabel}\n`;
  if (product.brand) text += `   🏷️ Brand: ${product.brand}\n`;
  if (product.description) {
    text += `   📝 ${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}\n`;
  }
  return text;
}

export async function startProductBrowseFlow(
  tenantId: string,
  phone: string,
  deps: ProductBrowseDeps
): Promise<void> {
  await deps.startTyping(tenantId, phone);

  try {
    let categories = BROWSE_CATEGORIES;
    const allCategoryProducts: Record<string, any[]> = {};

    if (deps.getProducts) {
      const products = await deps.getProducts();
      const catMap = new Map<string, { name: string; icon: string; products: any[] }>();
      for (const p of products) {
        const catName = p.categoryName || p.category || 'Uncategorized';
        if (!catMap.has(catName)) {
          catMap.set(catName, { name: catName, icon: '📦', products: [] });
        }
        catMap.get(catName)!.products.push(p);
      }
      if (catMap.size > 0) {
        categories = Array.from(catMap.entries()).map(([name, cat]) => {
          const brands = [...new Set(cat.products.map((p: any) => p.brand).filter(Boolean))] as string[];
          allCategoryProducts[name] = cat.products;
          return {
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            icon: '📦',
            productCount: cat.products.length,
            subcategories: brands,
            brands,
          };
        });
      }
    }

    const categoryList = categories
      .filter(cat => cat.productCount > 0)
      .map((cat, idx) => `${idx + 1}️⃣ ${cat.icon} ${cat.name} (${cat.productCount} products)`)
      .join('\n');

    const response = `🛍️ *Browse Products*\n\nChoose a category:\n\n${categoryList}\n\n0️⃣ Back to main menu`;

    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, response);

    await deps.setFlowState(tenantId, phone, {
      flowName: 'product_browse',
      currentStep: 'category_selection',
      selections: {
        categories,
        allCategoryProducts,
      },
      lastActivity: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ProductBrowse] Error:', error);
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, '❌ Unable to load products. Please try again later.');
  }
}

export async function handleProductBrowseInput(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const { currentStep, selections } = flowState;
  await deps.startTyping(tenantId, phone);

  try {
    if (currentStep === 'category_selection') {
      await handleCategorySelection(tenantId, phone, message, selections, deps);
    } else if (currentStep === 'subcategory_selection') {
      await handleSubcategorySelection(tenantId, phone, message, selections, deps);
    } else {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, `❌ Please reply with a number or *0* for main menu.`);
    }
  } catch (error) {
    console.error('[ProductBrowse] Error handling input:', error);
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, '❌ Something went wrong. Reply *0* for main menu.');
  }
}

async function showCategoryProducts(
  tenantId: string,
  phone: string,
  categoryName: string,
  products: any[],
  deps: ProductBrowseDeps
): Promise<void> {
  await deps.stopTyping(tenantId, phone);

  if (products.length === 0) {
    await deps.sendMessage(tenantId, phone,
      `📂 *${categoryName}*\n\nNo products available in this category.\n\n0️⃣ Back to categories`
    );
    return;
  }

  const chunks: string[] = [];
  let block = `📂 *${categoryName}*\n\n`;
  for (let i = 0; i < products.length; i++) {
    const line = formatProductText(products[i], i + 1);
    if (block.length + line.length > 1500) {
      chunks.push(block);
      block = '';
    }
    block += line + '\n';
  }
  if (block) chunks.push(block);

  for (let i = 0; i < chunks.length; i++) {
    await deps.sendMessage(tenantId, phone, chunks[i]);
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 400));
  }

  await deps.sendMessage(tenantId, phone, `0️⃣ Back to categories`);
}

async function handleCategorySelection(
  tenantId: string,
  phone: string,
  message: string,
  selections: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const num = parseInt(message.trim());
  const categories = selections.categories;

  if (message.trim() === '0') {
    await deps.stopTyping(tenantId, phone);
    throw new Error('GO_TO_MENU');
  }

  if (isNaN(num) || num < 1 || num > categories.length) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, '❌ Invalid selection. Please reply with a number from the list above.');
    return;
  }

  const selectedCat = categories[num - 1];

  if (selectedCat.subcategories && selectedCat.subcategories.length > 0) {
    const subList = selectedCat.subcategories
      .map((sub: string, idx: number) => `${idx + 1}️⃣ ${sub}`)
      .join('\n');

    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone,
      `📂 *${selectedCat.name}*\n\nChoose a brand:\n\n${subList}\n\n0️⃣ Back to categories`
    );

    await deps.setFlowState(tenantId, phone, {
      flowName: 'product_browse',
      currentStep: 'subcategory_selection',
      selections: {
        ...selections,
        categoryName: selectedCat.name,
        categorySlug: selectedCat.slug,
        subcategories: selectedCat.subcategories,
        brands: selectedCat.brands,
      },
      lastActivity: new Date().toISOString(),
    });
  } else {
    // No subcategories — list products directly
    const catProducts = selections.allCategoryProducts?.[selectedCat.name] || [];
    await showCategoryProducts(tenantId, phone, selectedCat.name, catProducts, deps);
  }
}

async function handleSubcategorySelection(
  tenantId: string,
  phone: string,
  message: string,
  selections: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const num = parseInt(message.trim());
  const subcategories = selections.subcategories || [];

  if (message.trim() === '0') {
    await deps.stopTyping(tenantId, phone);
    await startProductBrowseFlow(tenantId, phone, deps);
    return;
  }

  if (isNaN(num) || num < 1 || num > subcategories.length) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, '❌ Invalid selection. Please reply with a number from the list.');
    return;
  }

  await deps.stopTyping(tenantId, phone);

  // Find products matching this subcategory/brand
  const selectedBrand = subcategories[num - 1];
  const allProducts = selections.allCategoryProducts?.[selections.categoryName] || [];
  const brandProducts = allProducts.filter(
    (p: any) => (p.brand || '').toLowerCase() === selectedBrand.toLowerCase()
  );

  if (brandProducts.length === 0) {
    await deps.sendMessage(tenantId, phone,
      `📦 *${selectedBrand}*\n\nNo products found for this brand.\n\n0️⃣ Back to categories`
    );
    return;
  }

  const chunk: string[] = [];
  let block = `📦 *${selectedBrand}*\n\n`;
  for (let i = 0; i < brandProducts.length; i++) {
    const line = formatProductText(brandProducts[i], i + 1);
    if (block.length + line.length > 1500) {
      chunk.push(block);
      block = '';
    }
    block += line + '\n';
  }
  if (block) chunk.push(block);

  for (let i = 0; i < chunk.length; i++) {
    await deps.sendMessage(tenantId, phone, chunk[i]);
    if (i < chunk.length - 1) await new Promise(r => setTimeout(r, 400));
  }

  await deps.sendMessage(tenantId, phone, `0️⃣ Back to categories`);
}
