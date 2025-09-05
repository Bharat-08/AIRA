// src/components/ui/AllCandidatesRow.tsx
import React from 'react';
import type { Candidate } from '../../types/candidate';
import { Link, Trash2, Send, CornerUpRight } from 'lucide-react';

interface AllCandidatesRowProps {
  candidate: Candidate;
}

const getStatusPillClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'saved for future':
      return 'bg-blue-100 text-blue-800';
    case 'recommended':
      return 'bg-green-100 text-green-800';
    case 'contacted for ux designer':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

export const AllCandidatesRow: React.FC<AllCandidatesRowProps> = ({ candidate }) => {
  const avatarInitial = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="grid grid-cols-12 items-center py-3 px-2 border-b border-slate-100 text-sm hover:bg-slate-50 transition-colors">
      <div className="col-span-1 flex justify-center">
        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
      </div>
      <div className="col-span-3 flex items-center gap-3">
        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-slate-200 text-slate-600 rounded-full font-bold text-xs">
          {avatarInitial}
        </div>
        <div>
          <p className="font-bold text-slate-800">{candidate.name}</p>
          <p className="text-slate-500 text-xs">{candidate.company}</p>
        </div>
      </div>
      <div className="col-span-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusPillClass(candidate.status)}`}>
            {candidate.status}
        </span>
      </div>
      <div className="col-span-2">
         <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
            {candidate.role}
        </span>
      </div>
      <div className="col-span-1">
        <a href="#" className="text-slate-400 hover:text-teal-600">
          <Link size={18} />
        </a>
      </div>
      <div className="col-span-3 flex items-center gap-4 text-slate-400">
        <button className="hover:text-red-500"><Trash2 size={18} /></button>
        <button className="hover:text-blue-500"><Send size={18} /></button>
        <button className="hover:text-green-500"><CornerUpRight size={18} /></button>
      </div>
    </div>
  );
};