'use client';

interface ViewToggleProps {
  currentView: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  totalCount: number;
}

export default function ViewToggle({ currentView, onViewChange, totalCount }: ViewToggleProps) {
  return (
    <div className="view-toggle">
      <span className="view-toggle-text">Showing all products</span>
      <div className="view-toggle-btns">
        <button
          className={`view-toggle-btn ${currentView === 'grid' ? 'active' : ''}`}
          onClick={() => onViewChange('grid')}
        >
          <i className="fas fa-grid-2"></i>
        </button>
        <button
          className={`view-toggle-btn ${currentView === 'list' ? 'active' : ''}`}
          onClick={() => onViewChange('list')}
        >
          <i className="fas fa-list"></i>
        </button>
      </div>
    </div>
  );
}
