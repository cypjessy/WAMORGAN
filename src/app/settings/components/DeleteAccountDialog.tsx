'use client';

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export default function DeleteAccountDialog({ open, onClose, onDelete }: DeleteAccountDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon danger"><i className="fas fa-triangle-exclamation"></i></div>
        <h3>Delete Account?</h3>
        <p>This will permanently delete your account, all products, orders, and customer data. This action cannot be undone.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onDelete}>
            <i className="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
