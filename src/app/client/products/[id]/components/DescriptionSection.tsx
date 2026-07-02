'use client';

import { useState } from 'react';

interface DescriptionSectionProps {
  text: string;
}

export default function DescriptionSection({ text }: DescriptionSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="desc-section">
      <div className="desc-header">
        <h3>Description</h3>
        <button className="desc-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show Less' : 'Read More'}
        </button>
      </div>
      <div className={`desc-text ${expanded ? 'expanded' : ''}`}>
        <span className={`desc-fade ${expanded ? 'expanded' : ''}`}>
          {text}
        </span>
      </div>
    </div>
  );
}
