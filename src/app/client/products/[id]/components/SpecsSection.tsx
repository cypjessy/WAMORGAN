'use client';

interface SpecRow {
  label: string;
  value: string;
}

interface SpecsSectionProps {
  specs: SpecRow[];
}

export default function SpecsSection({ specs }: SpecsSectionProps) {
  return (
    <div className="specs-section">
      <h3>Specifications</h3>
      {specs.map((spec, i) => (
        <div key={i} className="spec-row">
          <span className="label">{spec.label}</span>
          <span className="value">{spec.value}</span>
        </div>
      ))}
    </div>
  );
}
