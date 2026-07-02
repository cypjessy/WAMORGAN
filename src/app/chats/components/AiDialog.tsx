'use client';

interface AiDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function AiDialog({ open, onClose, onConfirm }: AiDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon info"><i className="fas fa-robot"></i></div>
        <h3>Enable AI Assistant?</h3>
        <p>Let the AI handle this conversation automatically. You can take over anytime.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Manual</button>
          <button className="btn btn-primary" onClick={onConfirm}>
            <i className="fas fa-robot"></i> Let AI Handle
          </button>
        </div>
      </div>
    </div>
  );
}
