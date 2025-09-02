import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Search, ChevronDown, Link, Star, Send, Phone, Trash2 } from 'lucide-react';
import type { User } from '../types/user';
import { getPipelineCandidates } from '../api/pipeline';
// MODIFIED: Restored imports for the interactive stage dropdown
import { candidateStages, type Candidate, type CandidateStage } from '../types/candidate';

// MODIFIED: The row component now includes the onStageChange prop again
const PipelineCandidateRow: React.FC<{
  candidate: Candidate;
  onStageChange: (id: string, newStage: CandidateStage) => void;
}> = ({ candidate, onStageChange }) => {
  const avatarInitial = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase();

  const getStatusTextClass = (status: Candidate['status']) => {
    switch (status) {
      case 'Favourited':
        return 'text-yellow-600 font-semibold';
      case 'Contacted':
        return 'text-blue-600 font-semibold';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-12 items-center py-3 px-2 border-b border-slate-100 text-sm hover:bg-slate-50">
      <div className="col-span-1 flex justify-center">
        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
      </div>

      <div className="col-span-4 flex items-center gap-3">
        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-slate-200 text-slate-600 rounded-full font-bold text-xs">
          {avatarInitial}
        </div>
        <div>
          <p className="font-bold text-slate-800">{candidate.name}</p>
          <p className="text-slate-500">{`${candidate.role} at ${candidate.company}`}</p>
        </div>
      </div>

      <div className="col-span-2">
        <span className={`text-xs ${getStatusTextClass(candidate.status)}`}>
          {candidate.status}
        </span>
      </div>

      <div className="col-span-1">
        <a href="#" className="text-slate-400 hover:text-teal-600">
            <Link size={18} />
        </a>
      </div>

      <div className="col-span-2">
        {/* MODIFIED: Replaced the static pill with the interactive select dropdown */}
        <select
          value={candidate.stage}
          onChange={(e) => onStageChange(candidate.id, e.target.value as CandidateStage)}
          className="w-full p-1.5 border-none rounded-md bg-slate-100 text-slate-700 text-xs focus:ring-2 focus:ring-teal-500 appearance-none text-left"
        >
          {candidateStages.map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </div>

      <div className="col-span-2 flex items-center gap-4 text-slate-400">
        <button className="hover:text-yellow-500"><Star size={18} /></button>
        <button className="hover:text-blue-500"><Send size={18} /></button>
        <button className="hover:text-green-500"><Phone size={18} /></button>
        <button className="hover:text-red-500"><Trash2 size={18} /></button>
      </div>
    </div>
  );
};

// The main page component
export const PipelinePage = ({ user }: { user: User }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      setIsLoading(true);
      const fetchedCandidates = await getPipelineCandidates();
      setCandidates(fetchedCandidates);
      setIsLoading(false);
    };
    fetchCandidates();
  }, []);
  
  // MODIFIED: The handler function for the dropdown is now restored.
  const handleStageChange = (id: string, newStage: CandidateStage) => {
    setCandidates(prevCandidates =>
      prevCandidates.map(candidate =>
        candidate.id === id ? { ...candidate, stage: newStage } : candidate
      )
    );
    console.log(`Candidate ${id} moved to stage: ${newStage}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <Header userName={user.name || "User"} />
      <main className="flex-grow p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Pipeline</h1>
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex border-b border-slate-200 mb-6">
            <button className="px-1 pb-3 text-sm font-semibold text-teal-600 border-b-2 border-teal-600">Role Pipeline</button>
            <button className="ml-6 px-1 pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800">All Candidates</button>
          </div>
          <div className="mb-6">
            <select className="w-full p-2.5 border border-slate-200 rounded-md text-sm text-slate-600 focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white">
              <option>Select role to view pipeline</option>
            </select>
          </div>
          <div className="relative mb-4">
             <div className="p-1 bg-cyan-50/60 rounded-lg">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-800/50" size={18} />
                 <input type="text" placeholder="Search candidates" className="w-full pl-10 pr-4 py-2 border-none rounded-md text-sm bg-transparent focus:ring-2 focus:ring-teal-500 text-cyan-900 placeholder:text-cyan-800/50" />
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-3 text-sm">
            <button className="px-3 py-1.5 rounded-md bg-slate-100 font-semibold text-slate-800">All</button>
            <button className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100">Favourited (5)</button>
            <button className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100">Contacted (5)</button>
            <button className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 flex items-center gap-1">Stage <ChevronDown size={16}/></button>
          </div>

          <div className="candidates-table">
            <div className="grid grid-cols-12 text-xs font-semibold text-slate-500 uppercase py-3 px-2 border-b-2 border-slate-200">
              <div className="col-span-1"></div>
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Profile Link</div>
              <div className="col-span-2">Stage</div>
              <div className="col-span-2">Actions</div>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <p className="text-center py-8 text-slate-500">Loading candidates...</p>
              ) : (
                // MODIFIED: The onStageChange prop is now passed to the row component
                candidates.map(candidate => (
                  <PipelineCandidateRow 
                    key={candidate.id} 
                    candidate={candidate} 
                    onStageChange={handleStageChange}
                  />
                ))
              )}
            </div>
          </div>
          
           <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md text-sm hover:bg-teal-700">Contact Selected</button>
                <button className="px-4 py-2 bg-white border border-slate-300 font-semibold rounded-md text-sm text-slate-700 hover:bg-slate-50">Save Selected for Future</button>
                <button className="px-4 py-2 bg-white border border-slate-300 font-semibold rounded-md text-sm text-slate-700 hover:bg-slate-50">Remove Selected</button>
              </div>
              <button className="px-4 py-2 bg-white border border-slate-300 font-semibold rounded-md text-sm text-slate-700 hover:bg-slate-50">
                Search More Candidates
              </button>
           </div>
        </div>
      </main>
    </div>
  );
};