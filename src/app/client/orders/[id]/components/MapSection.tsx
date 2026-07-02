'use client';

interface MapSectionProps {
  onViewMap: () => void;
}

export default function MapSection({ onViewMap }: MapSectionProps) {
  return (
    <div className="map-section">
      <div className="map-placeholder">
        <div className="map-route"></div>
        <div className="map-truck"><i className="fas fa-truck"></i></div>
        <i className="fas fa-map-location-dot"></i>
        <p>Live tracking map</p>
        <button className="map-overlay-btn" onClick={onViewMap}>
          <i className="fas fa-expand" style={{ marginRight: 4 }}></i> View Map
        </button>
      </div>
    </div>
  );
}
