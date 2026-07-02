'use client';

import { useState, useEffect } from 'react';
import { businessProfileService } from '@/lib/db';
import type { PickupStation } from '@/lib/db';

interface StoreSheetProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

const counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Nyeri', 'Machakos', 'Malindi', 'Naivasha'];

export default function StoreSheet({ open, onClose, onShowToast }: StoreSheetProps) {
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [taxRate, setTaxRate] = useState('8.5');
  const [stations, setStations] = useState<PickupStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [editingStation, setEditingStation] = useState<PickupStation | null>(null);
  const [newStation, setNewStation] = useState({
    county: '', town: '', stationName: '', address: '', contactPhone: '', isActive: true,
  });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    businessProfileService.getProfile().then(bp => {
      if (bp) {
        setBusinessName(bp.businessName || '');
        setDescription(bp.description || '');
        setTaxRate(bp.businessName ? '8.5' : '8.5');
        setStations(bp.pickupStations || []);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open]);

  const resetForm = () => {
    setNewStation({ county: '', town: '', stationName: '', address: '', contactPhone: '', isActive: true });
    setEditingStation(null);
    setShowPickupForm(false);
  };

  const handleSaveStation = () => {
    if (!newStation.county || !newStation.town || !newStation.stationName) {
      onShowToast('Please fill in county, town, and station name', 'error');
      return;
    }
    if (editingStation) {
      setStations(prev => prev.map(s => s.id === editingStation.id ? { ...s, ...newStation } : s));
      onShowToast('Pickup station updated', 'success');
    } else {
      setStations(prev => [...prev, { id: Date.now().toString(), ...newStation }]);
      onShowToast('Pickup station added', 'success');
    }
    resetForm();
  };

  const handleEditStation = (station: PickupStation) => {
    setEditingStation(station);
    setNewStation({
      county: station.county, town: station.town, stationName: station.stationName,
      address: station.address, contactPhone: station.contactPhone, isActive: station.isActive,
    });
    setShowPickupForm(true);
  };

  const handleDeleteStation = (id: string) => {
    setStations(prev => prev.filter(s => s.id !== id));
    onShowToast('Pickup station removed', 'success');
    if (editingStation?.id === id) resetForm();
  };

  const handleSave = async () => {
    try {
      await businessProfileService.saveProfile({ businessName, description });
      await businessProfileService.savePickupStations(stations);
      onShowToast('Store settings saved', 'success');
      onClose();
    } catch (err) {
      onShowToast('Failed to save settings', 'error');
    }
  };

  if (loading) return null;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`} style={{ maxHeight: '92vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <div className="sheet-title">Store Settings</div>
          <div className="sheet-subtitle" style={{ marginBottom: 20 }}>Business info & pickup stations</div>

          {/* Business Info */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business Info</h4>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input className="form-input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business name" style={{ paddingLeft: 16, paddingRight: 16 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Business Description</label>
              <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" style={{ height: 'auto', padding: '14px 16px', minHeight: 70, resize: 'none' }} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tax Rate (%)</label>
                <input className="form-input" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0.00" type="number" style={{ paddingLeft: 16, paddingRight: 16 }} />
              </div>
            </div>
          </div>

          {/* Pickup Stations */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <i className="fas fa-map-marker-alt" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Pickup Stations
                <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--accent-gradient-soft)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 700 }}>{stations.length}</span>
              </h4>
              <button onClick={() => { setShowPickupForm(!showPickupForm); if (!showPickupForm) resetForm(); }}
                style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'var(--accent-gradient)', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
              >
                <i className="fas fa-plus" style={{ marginRight: 4 }}></i> Add Station
              </button>
            </div>

            {showPickupForm && (
              <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--accent-primary)' }}>
                  <i className="fas fa-map-pin"></i> {editingStation ? 'Edit Station' : 'New Pickup Station'}
                </h4>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">County/Region *</label>
                  <select className="form-input form-select" value={newStation.county} onChange={(e) => setNewStation(prev => ({ ...prev, county: e.target.value }))} style={{ paddingLeft: 16, paddingRight: 40 }}>
                    <option value="">Select county</option>
                    {counties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-row" style={{ marginBottom: 10 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Town *</label>
                    <input className="form-input" value={newStation.town} onChange={(e) => setNewStation(prev => ({ ...prev, town: e.target.value }))} placeholder="e.g. CBD, Westlands" style={{ paddingLeft: 16, paddingRight: 16 }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Station Name *</label>
                    <input className="form-input" value={newStation.stationName} onChange={(e) => setNewStation(prev => ({ ...prev, stationName: e.target.value }))} placeholder="e.g. CBD Branch" style={{ paddingLeft: 16, paddingRight: 16 }} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" value={newStation.address} onChange={(e) => setNewStation(prev => ({ ...prev, address: e.target.value }))} placeholder="Street address" style={{ paddingLeft: 16, paddingRight: 16 }} />
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">Contact Phone</label>
                  <input className="form-input" value={newStation.contactPhone} onChange={(e) => setNewStation(prev => ({ ...prev, contactPhone: e.target.value }))} placeholder="+254 712 345 678" style={{ paddingLeft: 16, paddingRight: 16 }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveStation}>
                    <i className={`fas ${editingStation ? 'fa-save' : 'fa-plus'}`}></i> {editingStation ? 'Update' : 'Add'} Station
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 0.5 }} onClick={resetForm}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              {stations.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <i className="fas fa-map-marker-alt" style={{ fontSize: 24, marginBottom: 8, display: 'block' }}></i>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>No pickup stations added yet</span>
                </div>
              ) : (
                stations.map((station) => (
                  <div key={station.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', marginBottom: 8, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: `1px solid ${station.isActive ? 'var(--border-subtle)' : 'rgba(239,68,68,0.2)'}`, opacity: station.isActive ? 1 : 0.6 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: station.isActive ? 'var(--success-soft)' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: station.isActive ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}>
                      <i className="fas fa-location-dot"></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{station.stationName}</span>
                        {!station.isActive && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 'var(--radius-full)', background: 'var(--error-soft)', color: 'var(--error)' }}>Inactive</span>}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 1 }}>{station.county}, {station.town}</p>
                      {station.address && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{station.address}</p>}
                      {station.contactPhone && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}><i className="fas fa-phone" style={{ fontSize: 9, marginRight: 4 }}></i>{station.contactPhone}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => handleEditStation(station)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => handleDeleteStation(station.id)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: 'none', color: 'var(--error)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSave}>
            <i className="fas fa-check"></i> Save Settings
          </button>
        </div>
      </div>
    </>
  );
}