'use client';

interface AttachMenuProps {
  open: boolean;
  onAction: (action: string) => void;
}

const attachItems = [
  { action: 'gallery', icon: 'fa-images', label: 'Gallery' },
  { action: 'camera', icon: 'fa-camera', label: 'Camera' },
  { action: 'product', icon: 'fa-box', label: 'Product' },
  { action: 'location', icon: 'fa-location-dot', label: 'Location' },
];

export default function AttachMenu({ open, onAction }: AttachMenuProps) {
  return (
    <div className={`attach-menu ${open ? 'active' : ''}`}>
      {attachItems.map((item, i) => (
        <div key={i} className="attach-item" onClick={() => onAction(item.action)}>
          <div className="attach-item-icon"><i className={`fas ${item.icon}`}></i></div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
