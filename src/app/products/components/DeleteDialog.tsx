'use client';

interface DeleteDialogProps {
  open: boolean;
  productName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteDialog({ open, productName, onClose, onConfirm }: DeleteDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={onClose}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon danger">
          <i className="fas fa-trash"></i>
        </div>
        <h3>Delete Product</h3>
        <p>Are you sure you want to delete "{productName}"? This action cannot be undone.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
