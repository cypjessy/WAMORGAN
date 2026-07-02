export interface ProductBrowseDeps {
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  startTyping: (tenantId: string, phone: string) => Promise<void>;
  stopTyping: (tenantId: string, phone: string) => Promise<void>;
  setFlowState: (tenantId: string, phone: string, state: any) => Promise<void>;
  getProducts?: () => Promise<any[]>;
  sendMedia?: (tenantId: string, phone: string, mediaUrl: string, caption: string) => Promise<void>;
  baseUrl?: string;
}

const PAGE_SIZE = 5;

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

function formatProductText(product: any, index: number, tenantId?: string, phone?: string, baseUrl?: string): string {
  let text = `*${index}. ${product.name}*\n`;

  if (product.salePrice && product.salePrice < product.price) {
    text += `   💰 ~~KES ${product.price?.toLocaleString()}~~ → *KES ${product.salePrice.toLocaleString()}* 🔥\n`;
  } else {
    text += `   💰 KES ${product.price?.toLocaleString() || '0'}\n`;
  }

  if (product.stock !== undefined) {
    const stockLabel = product.stock === 0
      ? '❌ Out of stock'
      : product.stock <= 5
        ? `⚠️ Only ${product.stock} left`
        : `✅ In stock (${product.stock})`;
    text += `   📦 ${stockLabel}\n`;
  }

  if (product.description) {
    text += `   📝 ${product.description.substring(0, 120)}${product.description.length > 120 ? '...' : ''}\n`;
  }

  if (product.brand) text += `   🏷️ Brand: ${product.brand}\n`;
  if (product.category || product.categoryName) {
    text += `   📂 Category: ${product.category || product.categoryName}\n`;
  }

  if (product.specs) {
    const specLabels: Record<string, string> = {
      color: '🎨 Colors',
      colors: '🎨 Colors',
      size: '📏 Sizes',
      sizes: '📏 Sizes',
      condition: '✨ Condition',
      warranty: '🛡️ Warranty',
    };
    for (const [key, values] of Object.entries(product.specs)) {
      if (Array.isArray(values) && values.length > 0) {
        const label = specLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        text += `   ${label}: ${values.join(', ')}\n`;
      }
    }
  }

  if (product.condition && !product.specs?.condition) text += `   ✨ Condition: ${product.condition}\n`;
  if (product.warranty) text += `   🛡️ Warranty: ${product.warranty}\n`;

  const prodLink = product.orderLink ? product.orderLink.replace(/^https?:\/\/localhost(:\d+)?/i, baseUrl || 'https://wamorgan.vercel.app').replace(/^https?:\/\/127\.0\.0\.1(:\d+)?/i, baseUrl || 'https://wamorgan.vercel.app') : '';
  if (prodLink) {
    text += `   🛒 *Order here:* ${prodLink}\n`;
  } else if (tenantId && phone && baseUrl && product.id) {
    text += `   🛒 *Order here:* ${baseUrl}/order?tenant=${tenantId}&product=${product.id}&phone=${phone}\n`;
  }

  return text;
}

async function sendOneProduct(
  tenantId: string,
  phone: string,
  product: any,
  displayIndex: number,
  deps: ProductBrowseDeps
): Promise<void> {
  const imageUrl = product.images?.[0] || product.imageUrl || product.image;
  const productText = formatProductText(product, displayIndex, tenantId, phone, deps.baseUrl);
  if (imageUrl && deps.sendMedia) {
    await deps.sendMedia(tenantId, phone, imageUrl, productText);
  } else {
    await deps.sendMessage(tenantId, phone, productText);
  }
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
    } else if (currentStep === 'product_pagination') {
      await handleProductPagination(tenantId, phone, message, selections, deps);
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
  title: string,
  products: any[],
  deps: ProductBrowseDeps,
  selections?: any
): Promise<void> {
  await deps.stopTyping(tenantId, phone);

  if (products.length === 0) {
    await deps.sendMessage(tenantId, phone,
      `📂 *${title}*\n\nNo products available.\n\n0️⃣ Back to categories`
    );
    return;
  }

  if (products.length <= PAGE_SIZE) {
    for (let i = 0; i < products.length; i++) {
      await sendOneProduct(tenantId, phone, products[i], i + 1, deps);
      if (i < products.length - 1) await new Promise(r => setTimeout(r, 400));
    }
    await deps.sendMessage(tenantId, phone, `0️⃣ Back to categories`);
    return;
  }

  for (let i = 0; i < PAGE_SIZE; i++) {
    await sendOneProduct(tenantId, phone, products[i], i + 1, deps);
    if (i < PAGE_SIZE - 1) await new Promise(r => setTimeout(r, 400));
  }

  const remaining = products.length - PAGE_SIZE;
  await deps.sendMessage(tenantId, phone,
    `1️⃣ - View More (${remaining} more)\n0️⃣ - Go back`
  );

  if (selections) {
    await deps.setFlowState(tenantId, phone, {
      flowName: 'product_browse',
      currentStep: 'product_pagination',
      selections: {
        ...selections,
        paginationProducts: products,
        currentIndex: PAGE_SIZE,
        pageSize: PAGE_SIZE,
        totalProducts: products.length,
        paginationTitle: title,
      },
      lastActivity: new Date().toISOString(),
    });
  }
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
    const catProducts = selections.allCategoryProducts?.[selectedCat.name] || [];
    await showCategoryProducts(tenantId, phone, selectedCat.name, catProducts, deps, selections);
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

  await showCategoryProducts(tenantId, phone, selectedBrand, brandProducts, deps, selections);
}

export async function handleProductPagination(
  tenantId: string,
  phone: string,
  message: string,
  selections: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const trimmed = message.trim().toLowerCase();

  if (trimmed === '0') {
    await deps.stopTyping(tenantId, phone);
    throw new Error('GO_TO_MENU');
  }

  if (trimmed === '1' || trimmed === 'more' || trimmed === 'next') {
    await showNextProductPage(tenantId, phone, selections, deps);
    return;
  }

  await deps.stopTyping(tenantId, phone);
  const remaining = (selections.totalProducts || 0) - (selections.currentIndex || 0);
  const prompt = remaining > 0
    ? `1️⃣ - View More (${remaining} more)\n0️⃣ - Go back`
    : `0️⃣ - Go back`;
  await deps.sendMessage(tenantId, phone,
    `*Reply with a number:*\n${prompt}\n\n*Or* send a product number to order`
  );
}

async function showNextProductPage(
  tenantId: string,
  phone: string,
  selections: any,
  deps: ProductBrowseDeps
): Promise<void> {
  await deps.startTyping(tenantId, phone);

  const allProducts = selections.paginationProducts || [];
  const currentIndex = selections.currentIndex || 0;
  const pageSize = selections.pageSize || PAGE_SIZE;
  const totalProducts = selections.totalProducts || allProducts.length;
  const title = selections.paginationTitle || 'Products';

  const pageProducts = allProducts.slice(currentIndex, currentIndex + pageSize);

  if (pageProducts.length === 0) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, "✅ You've seen all available products! Reply *0* to go back.");
    return;
  }

  const pageNum = Math.floor(currentIndex / pageSize) + 1;
  const header = `📂 *${title}*\n\nPage ${pageNum} - Showing ${pageProducts.length} more products:\n\n`;
  await deps.sendMessage(tenantId, phone, header);

  for (let i = 0; i < pageProducts.length; i++) {
    await sendOneProduct(tenantId, phone, pageProducts[i], i + 1, deps);
    if (i < pageProducts.length - 1) await new Promise(r => setTimeout(r, 400));
  }

  const remaining = totalProducts - (currentIndex + pageProducts.length);
  if (remaining > 0) {
    await deps.sendMessage(tenantId, phone,
      `1️⃣ - View More (${remaining} more)\n0️⃣ - Go back`
    );
  } else {
    await deps.sendMessage(tenantId, phone, `0️⃣ - Go back`);
  }

  await deps.setFlowState(tenantId, phone, {
    flowName: 'product_browse',
    currentStep: 'product_pagination',
    selections: {
      ...selections,
      currentIndex: currentIndex + pageProducts.length,
    },
    lastActivity: new Date().toISOString(),
  });
}
