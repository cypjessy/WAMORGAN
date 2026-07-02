'use client';

interface DateRangeBarProps {
  dateRangeText: string;
  periodLabel: string;
  onDatePickerClick: () => void;
}

export default function DateRangeBar({ dateRangeText, periodLabel, onDatePickerClick }: DateRangeBarProps) {
  return (
    <div className="date-range-bar">
      <span className="date-range-text">{dateRangeText}</span>
      <button className="date-picker-btn" onClick={onDatePickerClick}>
        <i className="fas fa-calendar"></i>
        <span>{periodLabel}</span>
      </button>
    </div>
  );
}
