'use client';

interface DeleteDialogProps {
  open: boolean;
  customerName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteDialog({ open, customerName, onClose, onConfirm }: DeleteDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={onClose}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon danger">
          <i className="fas fa-trash"></i>
        </div>
        <h3>Delete Customer?</h3>
        <p>
          This will permanently remove {customerName} and all associated order history.
          This action cannot be undone.
        </p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <i className="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
