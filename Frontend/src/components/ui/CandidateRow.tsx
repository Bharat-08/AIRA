// src/components/ui/CandidateRow.tsx
import { Link, Star, Send, Phone } from 'lucide-react';
import React from 'react';

interface CandidateRowProps {
  name: string;
  title: string;
  avatarInitial: string;
  matchScore: number;
}

export function CandidateRow({ name, title, avatarInitial, matchScore }: CandidateRowProps) {
  return (
    <div className="grid grid-cols-12 items-center py-3 border-b border-gray-200 text-sm">
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full font-semibold">
          {avatarInitial}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{name}</p>
          <p className="text-gray-500">{title}</p>
        </div>
      </div>
      <div className="col-span-2 font-semibold text-green-600">{matchScore}%</div>
      <div className="col-span-2">
        <Link size={18} className="text-gray-500" />
      </div>
      <div className="col-span-4 flex items-center gap-4 text-gray-500">
        <button className="hover:text-teal-500"><Star size={18} /></button>
        <button className="hover:text-teal-500"><Send size={18} /></button>
        <button className="hover:text-teal-500"><Phone size={18} /></button>
      </div>
    </div>
  );
}