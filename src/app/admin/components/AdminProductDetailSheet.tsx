'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { bunnyStorage } from '@/lib/storage';
import categoryData from '../../products/lib/categoryData';

interface ProductImage {
  file: File;
  preview: string;
}

interface Product {
  id: number;
  name: string;
  emoji: string;
  imageUrl?: string;
  price: number;
  original: number;
  stock: number;
  status: string;
  category: string;
  subcategory?: string;
  specs?: Record<string, string[]>;
  badge: string;
  sold: number;
  revenue: string;
  desc: string;
  variants: string[];
  active?: boolean;
  trackInventory?: boolean;
  allowWhatsApp?: boolean;
  orderLink?: string;
  _firestoreId?: string;
}

interface AdminProductDetailSheetProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit?: (id: number) => void;
  onDelete: (id: number) => void;
  onSave?: (updatedProduct: any) => void;
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function InfoCard({ children, icon, title }: { children: React.ReactNode; icon?: string; title?: string }) {
  return (
    <div style={{
      marginBottom: 16, padding: 16,
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 14, paddingBottom: 10,
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          {icon && <i className={`fas ${icon}`} style={{ fontSize: 14, color: 'var(--accent-primary)' }}></i>}
          <span style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: 0.6,
          }}>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value, color }: { icon?: string; label: string; value: React.ReactNode; color?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 11,
            color: 'var(--text-muted)', flexShrink: 0,
          }}>
            <i className={`fas ${icon}`}></i>
          </div>
        )}
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <span className="value" style={{
        fontSize: 13, fontWeight: 700, textAlign: 'right',
        ...(color ? { color } : { color: 'var(--text-primary)' }),
      }}>{value}</span>
    </div>
  );
}

function StatCard({ icon, value, label, color, iconBg }: { icon: string; value: string; label: string; color: string; iconBg?: string }) {
  return (
    <div style={{
      padding: '14px 10px', borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      textAlign: 'center',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: iconBg || `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 8px', fontSize: 14, color,
      }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color, lineHeight: 1.2, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      background: `${color}20`, color,
      fontSize: 12, fontWeight: 700,
    }}>
      {label}
    </span>
  );
}

function EditCard({ children, icon, title }: { children: React.ReactNode; icon: string; title: string }) {
  return (
    <div style={{
      marginBottom: 16, padding: 16,
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 14,
      }}>
        <i className={`fas ${icon}`} style={{ fontSize: 14, color: 'var(--accent-primary)' }}></i>
        <span style={{
          fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ enabled, onChange, label, sublabel }: { enabled: boolean; onChange: (v: boolean) => void; label: string; sublabel: string }) {
  return (
    <div className="filter-row" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>
      </div>
      <div className={`toggle-switch ${enabled ? 'active' : ''}`} onClick={() => onChange(!enabled)} />
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text', placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="form-group" style={{ marginBottom: 12 }}>
      <label className="form-label">{label}{required && ' *'}</label>
      {type === 'textarea' ? (
        <textarea
          className="form-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ padding: 14, resize: 'none', fontFamily: 'inherit', height: 80, fontSize: 14 }}
        />
      ) : (
        <input
          type={type}
          className="form-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingLeft: 16, paddingRight: 16, fontSize: 14 }}
        />
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function AdminProductDetailSheet({ open, product, onClose, onEdit, onDelete, onSave }: AdminProductDetailSheetProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Basic fields
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editTrackInventory, setEditTrackInventory] = useState(true);
  const [editAllowWhatsApp, setEditAllowWhatsApp] = useState(true);

  // Category / Subcategory
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editSubcategoryKey, setEditSubcategoryKey] = useState<string | null>(null);

  // Specs
  const [editSpecs, setEditSpecs] = useState<Record<string, Set<string>>>({});

  // Variants
  const [editVariantInput, setEditVariantInput] = useState('');
  const [editVariants, setEditVariants] = useState<string[]>([]);

  // Images
  const [editImages, setEditImages] = useState<ProductImage[]>([]);

  // Order link
  const [editOrderLink, setEditOrderLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Derived category data
  const currentCategory = editCategoryId ? categoryData[editCategoryId] : null;
  const currentSubcategory = currentCategory && editSubcategoryKey
    ? currentCategory.subcategories[editSubcategoryKey]
    : null;

  // Resolve category id from product's category name
  const resolveCategoryId = useCallback((catName: string, subName?: string): { catId: string | null; subKey: string | null } => {
    if (!catName) return { catId: null, subKey: null };
    const entry = Object.entries(categoryData).find(([, cat]) =>
      cat.name.toLowerCase().includes(catName.toLowerCase())
    );
    if (!entry) return { catId: null, subKey: null };
    const [catId, cat] = entry;
    if (!subName) return { catId, subKey: null };
    const subEntry = Object.entries(cat.subcategories).find(([, sub]) =>
      sub.name.toLowerCase().includes(subName.toLowerCase())
    );
    return { catId, subKey: subEntry ? subEntry[0] : null };
  }, []);

  const resetForm = useCallback(() => {
    if (!product) return;
    setEditName(product.name || '');
    setEditDesc(product.desc || '');
    setEditPrice(String(product.price || ''));
    setEditStock(String(product.stock || ''));
    setEditActive(product.active !== false);
    setEditTrackInventory(product.trackInventory !== false);
    setEditAllowWhatsApp(product.allowWhatsApp !== false);
    setEditVariants(product.variants || []);
    const prodUrl = 'https://wamorgan.vercel.app';
    const existing = (product.orderLink || '').replace(/^https?:\/\/localhost(:\d+)?/i, prodUrl).replace(/^https?:\/\/127\.0\.0\.1(:\d+)?/i, prodUrl);
    setEditOrderLink(existing || `${prodUrl}/client/order/${product._firestoreId}`);
    setEditImages([]);

    // Resolve category
    const resolved = resolveCategoryId(product.category, product.subcategory);
    setEditCategoryId(resolved.catId);
    setEditSubcategoryKey(resolved.subKey);

    // Pre-fill specs
    const specsMap: Record<string, Set<string>> = {};
    if (product.specs) {
      Object.entries(product.specs).forEach(([key, values]) => {
        if (Array.isArray(values)) specsMap[key] = new Set(values);
      });
    }
    setEditSpecs(specsMap);
  }, [product, resolveCategoryId]);

  const handleEnterEdit = () => {
    resetForm();
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  // Specs toggle
  const handleToggleSpec = (specKey: string, value: string, multiple?: boolean) => {
    setEditSpecs(prev => {
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

  // Variants
  const handleAddVariant = () => {
    if (!editVariantInput.trim()) return;
    setEditVariants([...editVariants, editVariantInput.trim()]);
    setEditVariantInput('');
  };

  const handleRemoveVariant = (index: number) => {
    setEditVariants(editVariants.filter((_, i) => i !== index));
  };

  // Images
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newImages.push({ file, preview: URL.createObjectURL(file) });
    }
    setEditImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setEditImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleImageSlotClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Save
  const handleSave = async () => {
    if (!product || !onSave) return;
    setSaving(true);
    try {
      // Upload new images
      const imageUrls: string[] = [];
      if (user) {
        for (const img of editImages) {
          const result = await bunnyStorage.uploadFile(user, img.file, 'products');
          if (result.success && result.url) imageUrls.push(result.url);
        }
      }

      // Build specs object
      const specsObj: Record<string, string[]> = {};
      Object.entries(editSpecs).forEach(([key, valSet]) => {
        if (valSet.size > 0) specsObj[key] = Array.from(valSet);
      });

      await onSave({
        _firestoreId: product._firestoreId,
        name: editName,
        desc: editDesc,
        price: editPrice,
        stock: editStock,
        emoji: product.emoji || '📦',
        category: currentCategory?.name || product.category,
        subcategory: currentSubcategory?.name || product.subcategory,
        specs: specsObj,
        variants: editVariants,
        active: editActive,
        trackInventory: editTrackInventory,
        allowWhatsApp: editAllowWhatsApp,
        orderLink: editOrderLink || undefined,
        imageUrl: imageUrls[0] || product.imageUrl || '',
        images: imageUrls,
        imagesChanged: editImages.length > 0,
      });
      setEditMode(false);
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setEditMode(false);
    onClose();
  };

  if (!product) return null;

  const discountPercent = product.original > product.price
    ? Math.round((1 - product.price / product.original) * 100)
    : 0;

  // ── EDIT VIEW ──────────────────────────────────────────────────────────────

  const renderEditView = () => (
    <>
      {/* ── Header ── */}
      <div style={{
        textAlign: 'center', marginBottom: 20,
        position: 'relative',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(232,168,56,0.2) 0%, rgba(212,118,42,0.2) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', fontSize: 26,
          border: '1px solid rgba(232,168,56,0.25)',
          boxShadow: '0 0 30px rgba(232,168,56,0.15)',
        }}>
          <i className="fas fa-pen" style={{ color: 'var(--accent-primary)' }}></i>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>Edit Product</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 240, margin: '4px auto 0' }}>
          Update {product.name}
        </p>
      </div>


        {/* ════════════════════════════ CATEGORY ════════════════════════════ */}
        <EditCard icon="fa-tags" title="Category">
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
            maxHeight: 140, overflowY: 'auto',
          }}>
            {Object.entries(categoryData).map(([catId, cat]) => {
              const isSelected = editCategoryId === catId;
              return (
                <div
                  key={catId}
                  onClick={() => { setEditCategoryId(catId); setEditSubcategoryKey(null); setEditSpecs({}); }}
                  style={{
                    padding: '10px 6px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--accent-gradient-soft)' : 'var(--bg-card)',
                    border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 2 }}>{cat.icon}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 600, lineHeight: 1.2,
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}>
                    {cat.name.split('&')[0].trim()}
                  </div>
                </div>
              );
            })}
          </div>

          {currentCategory && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                <i className="fas fa-layer-group" style={{ marginRight: 4 }}></i>
                Subcategory
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 100, overflowY: 'auto' }}>
                {Object.entries(currentCategory.subcategories).map(([subKey, sub]) => {
                  const isSelected = editSubcategoryKey === subKey;
                  return (
                    <button
                      key={subKey}
                      onClick={() => { setEditSubcategoryKey(subKey); setEditSpecs({}); }}
                      style={{
                        padding: '6px 14px', borderRadius: 'var(--radius-full)',
                        background: isSelected ? 'var(--accent-gradient)' : 'var(--bg-card)',
                        border: `1.5px solid ${isSelected ? 'transparent' : 'var(--border-subtle)'}`,
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                        fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        display: 'flex', alignItems: 'center', gap: 4,
                        boxShadow: isSelected ? '0 4px 12px rgba(232,168,56,0.25)' : 'none',
                      }}
                    >
                      <i className={`fas ${sub.icon}`} style={{ fontSize: 10 }}></i>
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </EditCard>

        {/* ════════════════════════════ SPECS ════════════════════════════ */}
        {currentSubcategory && (
          <EditCard icon="fa-list-check" title="Specifications">
            {Object.entries(currentSubcategory.specs).map(([specKey, spec]) => {
              const selectedValues = editSpecs[specKey];
              const hasSelection = selectedValues && selectedValues.size > 0;
              return (
                <div key={specKey} style={{ marginBottom: 12 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 6, fontSize: 12, fontWeight: 600,
                    color: hasSelection ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}>
                    <i className={`fas ${spec.icon}`} style={{ fontSize: 11 }}></i>
                    {spec.label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {spec.options.map(opt => {
                      const isOptSelected = selectedValues?.has(opt) || false;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleToggleSpec(specKey, opt, spec.multiple)}
                          style={{
                            padding: '4px 10px', borderRadius: 'var(--radius-full)',
                            background: isOptSelected ? 'var(--accent-gradient-soft)' : 'var(--bg-card)',
                            border: `1.5px solid ${isOptSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                            color: isOptSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
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
          </EditCard>
        )}

        {/* ════════════════════════════ IMAGES ════════════════════════════ */}
        <EditCard icon="fa-images" title="Product Images">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {product.imageUrl && !editImages.length && (
              <div style={{
                width: 72, height: 72, borderRadius: 'var(--radius-sm)',
                backgroundSize: 'cover', backgroundPosition: 'center',
                backgroundImage: `url(${product.imageUrl})`,
                border: '1px solid var(--border-subtle)',
              }} />
            )}
            {editImages.map((img, i) => (
              <div
                key={i}
                onClick={() => handleRemoveImage(i)}
                style={{
                  width: 72, height: 72, borderRadius: 'var(--radius-sm)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  backgroundImage: `url(${img.preview})`,
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer', position: 'relative',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.15s ease',
                }}>
                  <i className="fas fa-trash" style={{ color: 'var(--error)', fontSize: 16 }}></i>
                </div>
              </div>
            ))}
            {editImages.length < 5 && (
              <div
                onClick={handleImageSlotClick}
                style={{
                  width: 72, height: 72, borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)', border: '1.5px dashed var(--border-subtle)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', gap: 4,
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="fas fa-plus" style={{ fontSize: 18, color: 'var(--text-muted)' }}></i>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>Add</span>
              </div>
            )}
          </div>
        </EditCard>

        {/* ════════════════════════════ BASIC INFO ════════════════════════════ */}
        <EditCard icon="fa-info-circle" title="Basic Info">
          <EditField label="Product Name" value={editName} onChange={setEditName} placeholder="Product name" required />
          <EditField label="Description" value={editDesc} onChange={setEditDesc} placeholder="Describe your product..." type="textarea" />
          <EditField label="Price (KSh)" value={editPrice} onChange={setEditPrice} placeholder="0.00" type="number" required />
          <EditField label="Stock Qty" value={editStock} onChange={setEditStock} placeholder="0" type="number" />
        </EditCard>

        {/* ════════════════════════════ VARIANTS ════════════════════════════ */}
        <EditCard icon="fa-copy" title={`Variants${editVariants.length > 0 ? ` (${editVariants.length})` : ''}`}>
          <div style={{ display: 'flex', gap: 8, marginBottom: editVariants.length > 0 ? 10 : 0 }}>
            <input
              type="text"
              style={{
                flex: 1, height: 40, padding: '0 12px',
                background: 'var(--bg-card)', border: '1.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                outline: 'none',
              }}
              placeholder="e.g. Black / Large"
              value={editVariantInput}
              onChange={(e) => setEditVariantInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddVariant(); } }}
            />
            <button
              onClick={handleAddVariant}
              style={{
                width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-gradient)', border: 'none',
                color: 'white', cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
          {editVariants.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {editVariants.map((v, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  fontSize: 12, fontWeight: 600,
                }}>
                  {v}
                  <button onClick={() => handleRemoveVariant(i)} style={{
                    background: 'none', border: 'none', color: 'var(--error)',
                    cursor: 'pointer', fontSize: 10, padding: 0,
                  }}>
                    <i className="fas fa-times"></i>
                  </button>
                </span>
              ))}
            </div>
          )}
        </EditCard>

        {/* ════════════════════════════ ORDER LINK ════════════════════════════ */}
        <EditCard icon="fa-link" title="Order Link">
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
            Share this link with customers for direct ordering.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input
              type="text"
              value={editOrderLink}
              placeholder={`https://wamorgan.vercel.app/client/order/${product?._firestoreId}`}
              onChange={(e) => setEditOrderLink(e.target.value)}
              style={{
                flex: 1, height: 40, padding: '0 12px',
                background: 'var(--bg-card)', border: '1.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              onClick={() => {
                const link = editOrderLink || `https://wamorgan.vercel.app/client/order/${product?._firestoreId}`;
                navigator.clipboard.writeText(link);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              style={{
                height: 40, padding: '0 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-gradient)', border: 'none',
                color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              <i className="fas fa-copy"></i> {linkCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {!editOrderLink && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              <i className="fas fa-info-circle"></i> Leave empty to use the WhatsApp auto-generated link.
            </p>
          )}
        </EditCard>

        {/* ════════════════════════════ TOGGLES ════════════════════════════ */}
        <EditCard icon="fa-toggle-on" title="Settings">
          <ToggleSwitch enabled={editActive} onChange={setEditActive} label="Active" sublabel="Product is visible to customers" />
          <ToggleSwitch enabled={editTrackInventory} onChange={setEditTrackInventory} label="Track Inventory" sublabel="Auto-update stock on sales" />
          <ToggleSwitch enabled={editAllowWhatsApp} onChange={setEditAllowWhatsApp} label="Allow on WhatsApp" sublabel="AI can sell this via WhatsApp" />
        </EditCard>

        {/* ════════════════════════════ ACTIONS ════════════════════════════ */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, height: 48, fontSize: 14 }}
            onClick={handleCancelEdit}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1, height: 48, fontSize: 14 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <span className="spinner" /> : <><i className="fas fa-check"></i> Save Changes</>}
          </button>
        </div>

        <div style={{ height: 32 }}></div>
    </>
  );

  // ── VIEW MODE ──────────────────────────────────────────────────────────────

  const renderView = () => (
    <>
      {/* ── Hero Image ── */}
      <div
        className="detail-hero"
        style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontSize: 0 } : undefined}
      >
        {!product.imageUrl && product.emoji}
      </div>

      {/* ── Name ── */}
      <div className="detail-name">{product.name}</div>

      {/* ── Price Row ── */}
      <div className="detail-price-row">
        <span className="detail-price">KSh {product.price.toLocaleString()}</span>
        {product.original > product.price && (
          <>
            <span className="detail-original">KSh {product.original.toLocaleString()}</span>
            <span className="detail-discount">-{discountPercent}%</span>
          </>
        )}
      </div>

      {/* ── Status Badges ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {product.status === 'in' && <Badge label="In Stock" color="var(--success)" />}
        {product.status === 'low' && <Badge label="Low Stock" color="var(--warning)" />}
        {product.status === 'out' && <Badge label="Out of Stock" color="var(--error)" />}
        {product.badge === 'hot' && <Badge label="Hot" color="var(--warning)" />}
        {product.badge === 'new' && <Badge label="New" color="var(--success)" />}
        {product.badge === 'low' && <Badge label="Low Stock" color="var(--warning)" />}
        {product.active !== false && <Badge label="Active" color="var(--accent-primary)" />}
        {product.active === false && <Badge label="Inactive" color="var(--text-muted)" />}
        {product.allowWhatsApp !== false && <Badge label="WhatsApp" color="#25d366" />}
      </div>

      {/* ── Stats Grid ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        marginBottom: 20,
      }}>
        <StatCard
          icon="fa-cubes"
          value={String(product.stock)}
          label="In Stock"
          color="var(--warning)"
          iconBg="rgba(251,191,36,0.12)"
        />
        <StatCard
          icon="fa-chart-line"
          value={String(product.sold)}
          label="Sold"
          color="var(--accent-primary)"
          iconBg="rgba(232,168,56,0.12)"
        />
        <StatCard
          icon="fa-coins"
          value={`KSh ${product.revenue || '0'}`}
          label="Revenue"
          color="var(--success)"
          iconBg="rgba(74,222,128,0.12)"
        />
      </div>

      {/* ── Category Card ── */}
      <InfoCard icon="fa-tag" title="Category">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 'var(--radius-full)',
            background: 'var(--accent-gradient-soft)',
            border: '1px solid var(--border-glow)',
            fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)',
          }}>
            <span style={{ fontSize: 16 }}>{product.emoji}</span>
            {product.category}
          </span>
          {product.subcategory && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
            }}>
              {product.subcategory}
            </span>
          )}
        </div>
      </InfoCard>

      {/* ── Description Card ── */}
      {(product.desc || product.specs) && (
        <InfoCard icon="fa-info-circle" title="Description">
          {product.desc && (
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>{product.desc}</p>
          )}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div style={{ marginTop: product.desc ? 12 : 0 }}>
              {Object.entries(product.specs).map(([specKey, values]) => (
                <div key={specKey} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '8px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                    minWidth: 80, flexShrink: 0, textTransform: 'capitalize',
                  }}>{specKey}</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {values.map((v, i) => (
                      <span key={i} style={{
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        background: 'var(--accent-gradient-soft)',
                        fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)',
                      }}>{v}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </InfoCard>
      )}

      {/* ── Product Info Card ── */}
      <InfoCard icon="fa-box" title="Product Info">
        <InfoRow icon="fa-hashtag" label="Product ID" value={`#${product.id}`} />
        <InfoRow
          icon="fa-cubes-stacked"
          label="Stock"
          value={
            <span style={{ color: product.stock > 10 ? 'var(--success)' : product.stock > 0 ? 'var(--warning)' : 'var(--error)', fontWeight: 700 }}>
              {product.stock} units
            </span>
          }
        />
        <InfoRow
          icon="fa-warehouse"
          label="Track Inventory"
          value={
            <Badge label={product.trackInventory !== false ? 'Enabled' : 'Disabled'} color={product.trackInventory !== false ? 'var(--success)' : 'var(--text-muted)'} />
          }
        />
        <InfoRow
          icon="fa-whatsapp"
          label="WhatsApp Selling"
          value={
            <Badge label={product.allowWhatsApp !== false ? 'Allowed' : 'Blocked'} color={product.allowWhatsApp !== false ? '#25d366' : 'var(--error)'} />
          }
        />
      </InfoCard>

      {/* ── Variants Card ── */}
      {product.variants.length > 0 && (
        <InfoCard icon="fa-copy" title={`Variants (${product.variants.length})`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {product.variants.map((v, i) => (
              <span key={i} style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                fontSize: 13, fontWeight: 600,
              }}>{v}</span>
            ))}
          </div>
        </InfoCard>
      )}

      {/* ── Image Card ── */}
      {product.imageUrl && (
        <InfoCard icon="fa-image" title="Product Image">
          <div style={{
            width: '100%', height: 200, borderRadius: 'var(--radius-sm)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundImage: `url(${product.imageUrl})`,
            border: '1px solid var(--border-subtle)',
          }} />
        </InfoCard>
      )}

      {/* ── Actions ── */}
      <div className="detail-actions">
        <button className="btn btn-secondary" onClick={handleEnterEdit}>
          <i className="fas fa-pen"></i> Edit
        </button>
        <button className="btn btn-primary" onClick={() => {}}>
          <i className="fab fa-whatsapp"></i> Share
        </button>
      </div>
      <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => { onDelete(product.id); handleClose(); }}>
        <i className="fas fa-trash" style={{ color: 'var(--error)' }}></i>
        <span style={{ color: 'var(--error)' }}>Delete Product</span>
      </button>
    </>
  );

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
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={handleClose} style={{ zIndex: 300 }} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`} style={{
        zIndex: 301, maxHeight: '95vh',
        background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
      }}>
        <div className="sheet-handle"></div>
        <div className="sheet-content" style={{ paddingBottom: 40 }}>
          {editMode ? renderEditView() : renderView()}
        </div>
      </div>
    </>
  );
}
