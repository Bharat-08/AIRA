import { Link as LinkIcon, Star, Send, Phone, Loader2, Linkedin } from 'lucide-react';
import React, { useState } from 'react';
import type { Candidate } from '../../types/candidate';
import { generateLinkedInUrl } from '../../api/search';

interface CandidateRowProps {
  candidate: Candidate;
  onUpdateCandidate: (updatedCandidate: Candidate) => void;
}

export function CandidateRow({ candidate, onUpdateCandidate }: CandidateRowProps) {
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const avatarInitial = candidate.profile_name
    ? candidate.profile_name.split(' ').map(n => n[0]).join('')
    : 'C';

  const handleLinkedInClick = async () => {
    // If we have already generated a URL in this session, just open it.
    if (generatedUrl) {
      window.open(generatedUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    if (isGeneratingUrl) return;

    setIsGeneratingUrl(true);
    setError(null);
    try {
      const result = await generateLinkedInUrl(candidate.profile_id);
      const newUrl = result.profile_url;

      if (newUrl) {
        window.open(newUrl, '_blank', 'noopener,noreferrer');
        setGeneratedUrl(newUrl);
        onUpdateCandidate({ ...candidate, profile_url: newUrl });
      } else {
        throw new Error("API did not return a valid URL.");
      }

    } catch (err) {
      console.error("Failed to generate LinkedIn URL:", err);
      setError("Failed to find URL.");
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  const renderLinkedInButton = () => {
    const finalUrl = generatedUrl || candidate.profile_url;

    if (generatedUrl) {
      return (
        <a 
          href={finalUrl || '#'}
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-teal-600 hover:text-teal-700 transition-colors"
          title="Open LinkedIn Profile"
        >
          <Linkedin size={18} />
        </a>
      );
    }
    
    if (isGeneratingUrl) {
      return <Loader2 size={18} className="animate-spin text-gray-500" />;
    }

    if (error) {
       return (
        <button 
          onClick={handleLinkedInClick}
          className="text-red-500 hover:text-red-700 transition-colors"
          title={`Error: ${error}. Click to try again.`}
        >
          <Linkedin size={18} />
        </button>
       )
    }

    return (
      <button 
        onClick={handleLinkedInClick} 
        className="text-gray-400 hover:text-teal-600 transition-colors"
        title="Find LinkedIn Profile (Costly)"
      >
        <Linkedin size={18} />
      </button>
    );
  };

  return (
    <div className="grid grid-cols-12 items-center py-3 border-b border-gray-200 text-sm">
      {/* Columns 1 and 2 are unchanged */}
      <div className="col-span-6 flex items-center gap-3">
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full font-semibold">
          {avatarInitial}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{candidate.profile_name}</p>
          <p className="text-gray-500">{`${candidate.role} at ${candidate.company}`}</p>
        </div>
      </div>
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

      {/* --- THIS IS THE FIX --- */}
      {/* Both icons are now in the "Profile Link" column, with a gap between them */}
      <div className="col-span-2 flex items-center gap-4">
        {/* Original Link Icon */}
        <a href={generatedUrl || candidate.profile_url || '#'} target="_blank" rel="noopener noreferrer" 
           className={(generatedUrl || candidate.profile_url) ? "text-teal-600 hover:text-teal-700" : "text-gray-400 cursor-not-allowed"}>
          <LinkIcon size={18} />
        </a>
        {/* New Interactive LinkedIn Icon */}
        {renderLinkedInButton()}
      </div>

      {/* Column 4: Action Buttons (Reverted to original state) */}
      <div className="col-span-2 flex items-center gap-4 text-gray-500">
        <button className="hover:text-teal-500" title="Favorite"><Star size={18} /></button>
        <button className="hover:text-teal-500" title="Contact"><Send size={18} /></button>
        <button className="hover:text-teal-500" title="Call"><Phone size={18} /></button>
      </div>
    </div>
  );
}