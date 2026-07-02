'use client';

interface RemoveItemSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item?: { name: string; imageUrl: string; price: string } | null;
}

export default function RemoveItemSheet({ open, onClose, onConfirm, item }: RemoveItemSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Remove Item?</h3>
          <p className="sheet-subtitle">This item will be removed from your cart</p>
          {item && (
            <div className="remove-item-preview">
              <div className="img" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                {!item.imageUrl && <span style={{ fontSize: 32 }}>📦</span>}
              </div>
              <div className="info">
                <h4>{item.name}</h4>
                <p>{item.price}</p>
              </div>
            </div>
          )}
          <button className="btn btn-danger" onClick={onConfirm}>
            <i className="fas fa-trash"></i> Remove
          </button>
          <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </>
  );
}
