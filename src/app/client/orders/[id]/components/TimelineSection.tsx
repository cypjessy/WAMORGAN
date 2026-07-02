'use client';

interface TimelineStep {
  icon: string;
  title: string;
  description: string;
  time: string;
  status: 'done' | 'current' | 'pending';
}

interface TimelineSectionProps {
  steps: TimelineStep[];
}

export default function TimelineSection({ steps }: TimelineSectionProps) {
  return (
    <div className="timeline-section">
      <div className="section-title"><i className="fas fa-route"></i> Shipment Timeline</div>
      <div className="timeline">
        {steps.map((step, i) => (
          <div key={i} className={`timeline-item ${step.status === 'current' ? 'current' : ''}`}>
            <div className={`timeline-dot ${step.status}`}><i className={step.icon}></i></div>
            <div className="timeline-content">
              <h4>{step.title}</h4>
              <p>{step.description}</p>
              <div className="time">{step.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
