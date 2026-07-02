'use client';

import { useEffect, useRef, useState } from 'react';

interface ChartCardProps {
  weeklyData?: { labels: string[]; values: number[] };
  monthlyData?: { labels: string[]; values: number[] };
  yearlyData?: { labels: string[]; values: number[] };
}

export default function ChartCard({ weeklyData, monthlyData, yearlyData }: ChartCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('weekly');
  const chartPointsRef = useRef<{ x: number; y: number; val: number; label: string }[]>([]);

  const chartData: Record<string, { labels: string[]; values: number[] }> = {
    weekly: weeklyData || { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [0, 0, 0, 0, 0, 0, 0] },
    monthly: monthlyData || { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [0, 0, 0, 0] },
    yearly: yearlyData || { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], values: [0, 0, 0, 0, 0, 0] },
  };

  const drawChart = (data: { labels: string[]; values: number[] }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(2, 2);

    const width = canvas.width / 2;
    const height = canvas.height / 2;
    const padding = { top: 20, right: 10, bottom: 30, left: 10 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...data.values) * 1.2;
    const stepX = chartW / (data.labels.length - 1);

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Area gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(232, 168, 56, 0.3)');
    gradient.addColorStop(1, 'rgba(232, 168, 56, 0)');

    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    data.values.forEach((val, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartH - (val / maxVal) * chartH;
      if (i === 0) ctx.lineTo(x, y);
      else {
        const prevX = padding.left + (i - 1) * stepX;
        const prevY = padding.top + chartH - (data.values[i - 1] / maxVal) * chartH;
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#E8A838';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    data.values.forEach((val, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartH - (val / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prevX = padding.left + (i - 1) * stepX;
        const prevY = padding.top + chartH - (data.values[i - 1] / maxVal) * chartH;
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });
    ctx.stroke();

    // Glow under line
    ctx.shadowColor = 'rgba(232, 168, 56, 0.5)';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Points
    data.values.forEach((val, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartH - (val / maxVal) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0f';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#E8A838';
      ctx.fill();
    });

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    data.labels.forEach((label, i) => {
      const x = padding.left + i * stepX;
      ctx.fillText(label, x, height - 8);
    });

    // Store points
    chartPointsRef.current = data.values.map((val, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + chartH - (val / maxVal) * chartH,
      val,
      label: data.labels[i],
    }));
  };

  useEffect(() => {
    drawChart(chartData[activeTab]);
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => drawChart(chartData[activeTab]);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const handleHover = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip || chartPointsRef.current.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const scaleX = canvas.width / 2 / rect.width;

    const points = chartPointsRef.current;
    if (points.length === 0) return;

    type ChartPoint = { x: number; y: number; val: number; label: string };
    let closest: ChartPoint | null = null;
    let minDist = Infinity;
    for (const pt of points) {
      const dist = Math.abs(pt.x / scaleX - x);
      if (dist < minDist) { minDist = dist; closest = pt; }
    }

    if (closest && minDist < 40) {
      tooltip.innerHTML = `<div style="font-weight: 700; color: var(--text-primary);">KSh ${closest.val.toLocaleString()}</div><div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">KSh {closest.label}</div>`;
      tooltip.style.left = (closest.x / scaleX - tooltip.offsetWidth / 2) + 'px';
      tooltip.style.top = (closest.y / scaleX - tooltip.offsetHeight - 12) + 'px';
      tooltip.classList.add('show');
    }
  };

  const tabs = ['weekly', 'monthly', 'yearly'];

  return (
    <div className="chart-card">
      <div className="chart-tabs">
        {tabs.map((tab) => (
          <button key={tab} className={`chart-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <div className="chart-container">
        <canvas
          ref={canvasRef}
          className="chart-canvas"
          onMouseMove={handleHover}
          onMouseLeave={() => tooltipRef.current?.classList.remove('show')}
          onTouchStart={handleHover}
          onTouchMove={handleHover}
          onTouchEnd={() => tooltipRef.current?.classList.remove('show')}
        />
        <div ref={tooltipRef} className="chart-tooltip"></div>
      </div>
    </div>
  );
}
