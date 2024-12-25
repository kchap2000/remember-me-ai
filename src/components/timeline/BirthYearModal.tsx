import React, { useState } from 'react';
import { X } from 'lucide-react';

interface BirthYearModalProps {
  onSubmit: (year: number) => void;
  onClose: () => void;
}

export function BirthYearModal({ onSubmit, onClose }: BirthYearModalProps) {
  const [year, setYear] = useState(new Date().getFullYear() - 30);
  const currentYear = new Date().getFullYear();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(year);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1e1c26] rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#a29db8] hover:text-white"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-white text-xl font-bold mb-6">
          When were you born?
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="number"
              min={1900}
              max={currentYear}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-[#2b2938] text-white rounded-lg 
                       border border-[#403c53] focus:border-[#3b19e6] 
                       focus:outline-none"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 bg-[#3b19e6] text-white rounded-lg 
                     hover:bg-[#2f14b8] transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}