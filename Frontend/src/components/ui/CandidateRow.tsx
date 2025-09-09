import { Link, Star, Send, Phone } from 'lucide-react';
import React from 'react';

// --- MODIFICATION: The component now uses the updated Candidate type for its props ---
import type { Candidate } from '../../types/candidate';

interface CandidateRowProps {
  candidate: Candidate;
}

export function CandidateRow({ candidate }: CandidateRowProps) {
  // --- MODIFICATION: Logic now uses `profile_name` to create the avatar initials ---
  const avatarInitial = candidate.profile_name
    ? candidate.profile_name.split(' ').map(n => n[0]).join('')
    : 'C';

  return (
    // --- FINAL UI: The JSX is updated to match the new design ---
    <div className="grid grid-cols-12 items-center py-3 border-b border-gray-200 text-sm">
      
      {/* Column 1: Candidate Name, Role, and Company */}
      <div className="col-span-6 flex items-center gap-3">
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full font-semibold">
          {avatarInitial}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{candidate.profile_name}</p>
          <p className="text-gray-500">{`${candidate.role} at ${candidate.company}`}</p>
        </div>
      </div>

      {/* Column 2: Match Score with a dynamic progress pill */}
      <div className="col-span-2">
        <div className="relative w-24 h-6 bg-green-100 rounded-full">
          <div
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
            style={{ width: `${Math.round(candidate.match_score)}%` }}
          ></div>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-green-800">
            {Math.round(candidate.match_score)}%
          </span>
        </div>
      </div>

      {/* Column 3: Profile Link Icon */}
      <div className="col-span-2">
        <a href={candidate.profile_url || '#'} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-teal-600">
          <Link size={18} />
        </a>
      </div>

      {/* Column 4: Action Buttons */}
      <div className="col-span-2 flex items-center gap-4 text-gray-500">
        <button className="hover:text-teal-500" title="Favorite"><Star size={18} /></button>
        <button className="hover:text-teal-500" title="Contact"><Send size={18} /></button>
        <button className="hover:text-teal-500" title="Call"><Phone size={18} /></button>
      </div>
    </div>
  );
}