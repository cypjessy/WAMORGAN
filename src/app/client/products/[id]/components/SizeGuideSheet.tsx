'use client';

interface SizeGuideSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function SizeGuideSheet({ open, onClose }: SizeGuideSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Size Guide</h3>
          <p className="sheet-subtitle">Find your perfect fit</p>
          <table className="size-table">
            <thead>
              <tr><th>Size</th><th>Head Circ.</th><th>Width</th></tr>
            </thead>
            <tbody>
              <tr><td>S</td><td>54-56 cm</td><td>16 cm</td></tr>
              <tr><td>M</td><td>56-58 cm</td><td>17 cm</td></tr>
              <tr><td>L</td><td>58-60 cm</td><td>18 cm</td></tr>
              <tr><td>XL</td><td>60-62 cm</td><td>19 cm</td></tr>
            </tbody>
          </table>
          <button className="btn btn-primary" onClick={onClose}>Got It</button>
        </div>
      </div>
    </>
  );
}
