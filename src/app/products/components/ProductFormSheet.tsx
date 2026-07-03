'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { bunnyStorage } from '@/lib/storage';
import categoryData from '../lib/categoryData';
import type { Category, Subcategory, SpecField } from '../lib/categoryData';

interface ProductImage {
  file: File;
  preview: string;
}

interface ProductFormSheetProps {
  open: boolean;
  mode: 'add' | 'edit';
  editProduct?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 12, paddingTop: 4,
    }}>
      <span style={{
        fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {title}
      </span>
      {count !== undefined && (
        <span style={{
          padding: '2px 8px', borderRadius: 'var(--radius-full)',
          background: 'var(--accent-gradient-soft)', color: 'var(--accent-primary)',
          fontSize: 11, fontWeight: 700,
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ProductFormSheet({ open, mode, editProduct, onClose, onSave }: ProductFormSheetProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [variantInput, setVariantInput] = useState('');
  const [variants, setVariants] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [trackInventory, setTrackInventory] = useState(true);
  const [allowWhatsApp, setAllowWhatsApp] = useState(true);
  const [orderLink, setOrderLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Images
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  // Pre-fill when editing
  useEffect(() => {
    if (open && editProduct) {
      setName(editProduct.name || '');
      setDesc(editProduct.desc || '');
      setPrice(String(editProduct.price || ''));
      setStock(String(editProduct.stock || ''));
      setVariants(editProduct.variants || []);
      setActive(editProduct.active !== false);
      setTrackInventory(editProduct.trackInventory !== false);
      setAllowWhatsApp(editProduct.allowWhatsApp !== false);
      const prodUrl = 'https://wamorgan.vercel.app';
      const existing = (editProduct.orderLink || '').replace(/^https?:\/\/localhost(:\d+)?/i, prodUrl).replace(/^https?:\/\/127\.0\.0\.1(:\d+)?/i, prodUrl);
      setOrderLink(existing || `${prodUrl}/client/order/${editProduct.id}`);
      setSelectedCategoryId(null);
      setSelectedSubcategoryKey(null);
      setSelectedSpecs({});
      setProductImages([]);
    } else if (open && !editProduct) {
      setName('');
      setDesc('');
      setPrice('');
      setStock('');
      setVariants([]);
      setActive(true);
      setTrackInventory(true);
      setAllowWhatsApp(true);
      setOrderLink('');
      setSelectedCategoryId(null);
      setSelectedSubcategoryKey(null);
      setSelectedSpecs({});
      setProductImages([]);
    }
  }, [open, editProduct]);

  // ── Category / Subcategory State ──
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryKey, setSelectedSubcategoryKey] = useState<string | null>(null);

  // Derived
  const currentCategory = selectedCategoryId ? categoryData[selectedCategoryId] : null;
  const currentSubcategory = currentCategory && selectedSubcategoryKey
    ? currentCategory.subcategories[selectedSubcategoryKey]
    : null;

  // Selected specs
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, Set<string>>>({});

  const handleToggleSpec = (specKey: string, value: string, multiple?: boolean) => {
    setSelectedSpecs(prev => {
      const next = { ...prev };
      const currentSet = prev[specKey] ? new Set(prev[specKey]) : new Set<string>();
      if (multiple) {
        if (currentSet.has(value)) currentSet.delete(value);
        else currentSet.add(value);
      } else {
        if (currentSet.has(value)) currentSet.clear();
        else { next[specKey] = new Set([value]); return next; }
      }
      next[specKey] = currentSet;
      return next;
    });
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategoryId(catId === selectedCategoryId ? null : catId);
    setSelectedSubcategoryKey(null);
    setSelectedSpecs({});
  };

  const handleSubcategorySelect = (subKey: string) => {
    setSelectedSubcategoryKey(subKey === selectedSubcategoryKey ? null : subKey);
    setSelectedSpecs({});
  };

  const handleAddVariant = () => {
    if (!variantInput.trim()) return;
    setVariants([...variants, variantInput.trim()]);
    setVariantInput('');
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // ── Image Handlers ──

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newImages.push({ file, preview: URL.createObjectURL(file) });
    }
    setProductImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setProductImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleImageSlotClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ── Save ──

  const handleSave = useCallback(async () => {
    if (!name || !user) return;

    setSaving(true);

    // Upload images to Bunny
    const imageUrls: string[] = [];
    for (const img of productImages) {
      const result = await bunnyStorage.uploadFile(user, img.file, 'products');
      if (result.success && result.url) imageUrls.push(result.url);
    }

    const specsObj: Record<string, string[]> = {};
    Object.entries(selectedSpecs).forEach(([key, valSet]) => {
      if (valSet.size > 0) specsObj[key] = Array.from(valSet);
    });

    onSave({
      name,
      desc,
      price,
      stock,
      emoji: '📦',
      category: currentCategory?.name || '',
      subcategory: currentSubcategory?.name || '',
      specs: specsObj,
      variants,
      active,
      trackInventory,
      allowWhatsApp,
      orderLink: orderLink || undefined,
      imageUrl: imageUrls[0] || '',
      images: imageUrls,
      imagesChanged: productImages.length > 0,
    });

    setSaving(false);
  }, [name, desc, price, stock, variants, active, trackInventory, allowWhatsApp, orderLink, user, productImages, selectedSpecs, currentCategory, currentSubcategory, onSave]);

  if (!open) return null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} style={{ zIndex: 9000 }} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`} style={{
        zIndex: 9001, maxHeight: '95vh',
        background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
      }}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom" style={{ padding: '8px 0 32px' }}>

          {/* ── HEADER ── */}
          <div style={{ textAlign: 'center', marginBottom: 20, padding: '0 24px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-gradient-soft)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px', fontSize: 24, color: 'var(--accent-primary)',
            }}>
              <i className="fas fa-box-open"></i>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>{mode === 'add' ? 'Add Product' : 'Edit Product'}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {mode === 'add' ? 'Fill in the details below' : 'Update product details'}
            </p>
          </div>

          <div style={{ padding: '0 24px' }}>

            {/* ════════════════════════════ CATEGORY & SUBCATEGORY ════════════════════════════ */}

            <SectionHeader title="Category" count={currentCategory ? 1 : undefined} />

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
              marginBottom: selectedCategoryId ? 16 : 0,
              maxHeight: 160, overflowY: 'auto',
            }}>
              {Object.entries(categoryData).map(([catId, cat]) => {
                const isSelected = selectedCategoryId === catId;
                return (
                  <div
                    key={catId}
                    onClick={() => handleCategorySelect(catId)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)',
                      border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{cat.icon}</div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, lineHeight: 1.3,
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}>
                      {cat.name}
                    </div>
                  </div>
                );
              })}
            </div>

            {currentCategory && (
              <>
                <SectionHeader title="Subcategory" />
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8,
                  marginBottom: 16, maxHeight: 140, overflowY: 'auto',
                }}>
                  {Object.entries(currentCategory.subcategories).map(([subKey, sub]) => {
                    const isSelected = selectedSubcategoryKey === subKey;
                    return (
                      <button
                        key={subKey}
                        onClick={() => handleSubcategorySelect(subKey)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-full)',
                          background: isSelected ? 'var(--accent-gradient)' : 'var(--bg-elevated)',
                          border: `1.5px solid ${isSelected ? 'transparent' : 'var(--border-subtle)'}`,
                          color: isSelected ? 'white' : 'var(--text-secondary)',
                          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                          cursor: 'pointer', transition: 'all 0.2s ease',
                          display: 'flex', alignItems: 'center', gap: 6,
                          boxShadow: isSelected ? '0 4px 16px rgba(232,168,56,0.3)' : 'none',
                        }}
                      >
                        <i className={`fas ${sub.icon}`} style={{ fontSize: 12 }}></i>
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {currentSubcategory && (
              <>
                <SectionHeader title="Specifications" />
                {Object.entries(currentSubcategory.specs).map(([specKey, spec]) => {
                  const selectedValues = selectedSpecs[specKey];
                  const hasSelection = selectedValues && selectedValues.size > 0;

                  return (
                    <div key={specKey} style={{ marginBottom: 14 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        marginBottom: 8, fontSize: 13, fontWeight: 600,
                        color: hasSelection ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      }}>
                        <i className={`fas ${spec.icon}`} style={{ fontSize: 12 }}></i>
                        {spec.label}
                        {spec.allowCustom && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>(+custom)</span>}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {spec.options.map(opt => {
                          const isOptSelected = selectedValues?.has(opt) || false;
                          return (
                            <button
                              key={opt}
                              onClick={() => handleToggleSpec(specKey, opt, spec.multiple)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-full)',
                                background: isOptSelected ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)',
                                border: `1.5px solid ${isOptSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                                color: isOptSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                                cursor: 'pointer', transition: 'all 0.15s ease',
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* ════════════════════════════ IMAGES ════════════════════════════ */}

            <SectionHeader title="Product Images" count={productImages.length} />

            <div className="image-upload-grid" style={{ marginBottom: 16 }}>
              {productImages.map((img, i) => (
                <div
                  key={i}
                  className="image-upload-slot has-image"
                  style={{
                    backgroundImage: `url(${img.preview})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  onClick={() => handleRemoveImage(i)}
                >
                  <div className="image-remove-overlay">
                    <i className="fas fa-trash"></i>
                  </div>
                </div>
              ))}
              {productImages.length < 5 && (
                <div className="image-upload-slot" onClick={handleImageSlotClick}>
                  <i className="fas fa-plus" style={{ fontSize: 24, color: 'var(--text-muted)' }}></i>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Add</span>
                </div>
              )}
            </div>

            {/* ════════════════════════════ BASIC INFO ════════════════════════════ */}

            <div style={{
              marginBottom: 20, padding: 16,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}>
              <SectionHeader title="Basic Info" />

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Wireless Bluetooth Headphones"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: 16, paddingRight: 16 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  placeholder="Describe your product in detail..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  style={{ padding: 14, resize: 'none', fontFamily: 'inherit', height: 80 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Price (KSh) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{ paddingLeft: 16, paddingRight: 16 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Stock Qty</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  style={{ paddingLeft: 16, paddingRight: 16 }}
                />
              </div>
            </div>

            {/* ════════════════════════════ VARIANTS ════════════════════════════ */}

            <div style={{
              marginBottom: 20, padding: 16,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}>
              <SectionHeader title="Variants" count={variants.length} />

              <div className="variant-input-row" style={{ marginBottom: variants.length > 0 ? 10 : 0 }}>
                <input
                  type="text"
                  className="variant-input"
                  placeholder="e.g. Black / Large"
                  value={variantInput}
                  onChange={(e) => setVariantInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddVariant(); } }}
                />
                <button className="variant-add-btn" onClick={handleAddVariant}>
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              {variants.length > 0 && (
                <div className="variant-tags">
                  {variants.map((v, i) => (
                    <span key={i} className="variant-tag">
                      {v}
                      <button onClick={() => handleRemoveVariant(i)}>
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ════════════════════════════ ORDER LINK ════════════════════════════ */}

            <div style={{
              marginBottom: 20, padding: 16,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}>
              <SectionHeader title="Order Link" />

              {mode === 'edit' && editProduct?.id ? (
                <>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                    Share this link with customers for direct ordering.
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input
                      type="text"
                      className="form-input"
                      value={orderLink}
                      placeholder={`https://wamorgan.vercel.app/client/order/${editProduct.id}`}
                      onChange={(e) => setOrderLink(e.target.value)}
                      style={{ flex: 1, paddingLeft: 16, paddingRight: 16, fontSize: 13 }}
                    />
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        const link = orderLink || `https://wamorgan.vercel.app/client/order/${editProduct.id}`;
                        navigator.clipboard.writeText(link);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="fas fa-copy"></i> {linkCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  {!orderLink && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      <i className="fas fa-info-circle"></i> Leave empty to use the WhatsApp auto-generated link.
                    </p>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  <i className="fas fa-info-circle"></i> Save the product first to generate a shareable order link.
                </p>
              )}
            </div>

            {/* ════════════════════════════ TOGGLES ════════════════════════════ */}

            <div style={{
              marginBottom: 20, padding: 14,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}>
              <div className="filter-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Active</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Product is visible to customers</div>
                </div>
                <div className={`toggle-switch ${active ? 'active' : ''}`} onClick={() => setActive(!active)} />
              </div>
              <div className="filter-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Track Inventory</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Auto-update stock on sales</div>
                </div>
                <div className={`toggle-switch ${trackInventory ? 'active' : ''}`} onClick={() => setTrackInventory(!trackInventory)} />
              </div>
              <div className="filter-row" style={{ padding: '8px 0', borderBottom: 'none' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Allow on WhatsApp</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>AI can sell this via WhatsApp</div>
                </div>
                <div className={`toggle-switch ${allowWhatsApp ? 'active' : ''}`} onClick={() => setAllowWhatsApp(!allowWhatsApp)} />
              </div>
            </div>

            {/* ════════════════════════════ ACTIONS ════════════════════════════ */}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1, height: 48 }} onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1, height: 48 }} onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : <><i className="fas fa-check"></i> {mode === 'add' ? 'Save Product' : 'Update'}</>}
              </button>
            </div>

            <div style={{ height: 20 }}></div>
          </div>
        </div>
      </div>
    </>
  );
}