'use client';

import { useState, useEffect } from 'react';
import { customerService } from '@/lib/db';
import type { Customer } from '@/lib/db';

interface NewChatSheetProps {
  open: boolean;
  onClose: () => void;
  onStartChat: (name: string, avatar: string, phone: string) => void;
}

export default function NewChatSheet({ open, onClose, onStartChat }: NewChatSheetProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSearch('');
    customerService.getCustomers().then(all => {
      setCustomers(all);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [open]);

  const filtered = search
    ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search))
    : customers;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content">
          <h3 className="sheet-title">New Conversation</h3>
          <p className="sheet-subtitle">Select a customer to start chatting</p>
          <div className="search-bar-chat" style={{ marginBottom: '16px' }}>
            <i className="fas fa-search search-icon-chat"></i>
            <input
              type="text"
              className="search-input-chat"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="loading-state"><div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '32px auto' }} /></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="fas fa-users" style={{ fontSize: 24, marginBottom: 8, display: 'block' }}></i>
              <span style={{ fontSize: 13, fontWeight: 500 }}>No customers found</span>
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="new-chat-item" onClick={() => { onStartChat(c.name, '👤', c.phone || ''); onClose(); }}>
                <div className="new-chat-avatar">👤</div>
                <div className="new-chat-info">
                  <h4>{c.name}</h4>
                  <p>{c.phone || 'No phone'} • {c.orders || 0} orders</p>
                </div>
                <button className="new-chat-btn-add"><i className="fas fa-plus"></i></button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}