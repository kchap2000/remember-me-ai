import React from 'react';
import { Calendar } from 'lucide-react';
import { LIFE_PHASES } from '../../config/timeline.config';

interface YearSelectorProps {
  selectedYear: number;
  birthYear: number | null;
  onChange: (year: number) => void;
  onPhaseChange?: (phaseId: string | undefined) => void;
}

export function YearSelector({ selectedYear, birthYear, onChange, onPhaseChange }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();

  const handleYearChange = (year: number) => {
    onChange(year);
    
    if (birthYear && onPhaseChange) {
      const age = year - birthYear;
      const phase = LIFE_PHASES.find(p => age >= p.startAge && age <= p.endYear);
      onPhaseChange(phase?.id);
    }
  };

  return (
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a29db8]" size={16} />
      <input
        type="number"
        value={selectedYear}
        onChange={(e) => handleYearChange(parseInt(e.target.value))}
        min={birthYear || 1900}
        max={currentYear}
        className="w-full pl-10 pr-4 py-2 bg-[#1e1c26] border border-[#403c53] 
                 rounded-lg text-white focus:border-[#3b19e6] outline-none"
      />
      {birthYear && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a29db8] text-sm">
          Age: {selectedYear - birthYear}
        </div>
      )}
    </div>
  );
}