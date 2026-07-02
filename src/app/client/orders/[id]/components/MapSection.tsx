'use client';

export default function MapSection() {
  return (
    <div className="map-section">
      <div className="map-placeholder">
        <div className="map-route"></div>
        <div className="map-truck"><i className="fas fa-truck"></i></div>
        <i className="fas fa-map-location-dot"></i>
        <p>Live tracking map</p>
      </div>
    </div>
  );
}
