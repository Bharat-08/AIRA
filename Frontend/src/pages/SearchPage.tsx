import React, { useState, useRef } from 'react';
import { Header } from '../components/layout/Header';
import { CandidateRow } from '../components/ui/CandidateRow';
import { Plus, UploadCloud, Search as SearchIcon, SendHorizonal, Bot, Eye, History, RefreshCw } from 'lucide-react';
import type { User } from '../types/user';
import { uploadJdFile } from '../api/upload';
// --- MODIFICATION START ---
// 1. Import the new search API function and the correct Candidate type
import { searchCandidates } from '../api/search';
import type { Candidate } from '../types/candidate'; // This now refers to the new interface for ranked candidates
// --- MODIFICATION END ---


// This interface correctly matches the data from the JD upload API
interface JobDescription {
  jd_id: string;
  jd_parsed_summary: string;
  location: string;
  job_type: string;
  experience_required: string;
}

export function SearchPage({ user }: { user: User }) {
  const userName = user.name || 'User';

  const [currentJd, setCurrentJd] = useState<JobDescription | null>(null);
  const [resumeFiles, setResumeFiles] = useState<FileList | null>(null); // This state is preserved for the UI
  const [isJdLoading, setIsJdLoading] = useState(false);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  // --- MODIFICATION START ---
  // 2. This state now holds the ranked candidates returned from the full workflow
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  // --- MODIFICATION END ---

  const jdInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const handleJdFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setIsJdLoading(true);
      setUploadStatus(null);
      setCandidates([]); // Clear old candidate results when a new JD is uploaded
      try {
        const result = await uploadJdFile(file);
        setCurrentJd(result);
        setUploadStatus({ message: 'JD uploaded and parsed successfully!', type: 'success' });
      } catch (error) {
        setUploadStatus({ message: (error as Error).message, type: 'error' });
      } finally {
        setIsJdLoading(false);
      }
    }
  };

  const handleResumeFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setResumeFiles(event.target.files);
    }
  };

  // --- MODIFICATION START ---
  // 3. This function now triggers the full search-then-rank workflow on the backend.
  const handleSearchAndRank = async () => {
    if (!currentJd) {
      setUploadStatus({ message: 'Please upload a Job Description first.', type: 'error' });
      return;
    }
    if (!chatMessage) {
        setUploadStatus({ message: 'Please enter a prompt in the chat box to start the search.', type: 'error' });
        return;
    }

    setIsRankingLoading(true);
    setUploadStatus(null);
    setCandidates([]); // Clear previous results before starting a new search

    try {
      // Call the search API which now handles both searching and ranking
      const result = await searchCandidates(currentJd.jd_id, chatMessage);
      setCandidates(result);

      if (result.length > 0) {
        setUploadStatus({ message: `Found and ranked ${result.length} new candidates!`, type: 'success' });
      } else {
        setUploadStatus({ message: 'Search complete. No new candidates were found for this prompt.', type: 'success' });
      }
    } catch (error) {
      setUploadStatus({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsRankingLoading(false);
    }
  };
  // --- MODIFICATION END ---

  const getButtonText = () => {
    if (isJdLoading) return 'Parsing JD...';
    if (isRankingLoading) return 'Searching & Ranking...';
    return <><SearchIcon size={18}/> Search and Rank</>;
  };

  return (
    <div className="h-screen bg-gray-50 text-gray-800 flex flex-col">
      <Header userName={userName} showBackButton={true} />
      <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-screen-2xl mx-auto w-full overflow-y-auto">
        <div className="grid grid-cols-12 gap-8 h-full">
          <aside className="col-span-3 flex flex-col gap-6">
            {/* This entire aside section is preserved to maintain the UI */}
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-gray-700">Select Role</label>
                <button onClick={() => jdInputRef.current?.click()} className="text-sm text-teal-600 hover:underline flex items-center gap-1">
                  <Plus size={14}/> Add New Role
                </button>
                <input type="file" ref={jdInputRef} onChange={handleJdFileChange} className="hidden" accept=".pdf,.docx,.txt"/>
              </div>
              
              {currentJd ? (
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
                  {currentJd.jd_parsed_summary.substring(0, 50)}...
                </div>
              ) : (
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-sm text-gray-500">
                  Upload a JD to begin
                </div>
              )}
              
              {currentJd && (
                <div className="mt-4 text-sm text-gray-600 space-y-2">
                  <p><span className="font-medium">Location:</span> {currentJd.location}</p>
                  <p><span className="font-medium">Type:</span> {currentJd.job_type}</p>
                  <p><span className="font-medium">Experience:</span> {currentJd.experience_required}</p>
                </div>
              )}

              <div className="mt-4 flex flex-col items-stretch gap-2 text-sm">
                <button className="flex items-center justify-center gap-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 font-medium">
                  <Eye size={16} /> View JD
                </button>
                <button className="flex items-center justify-center gap-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 font-medium">
                  <History size={16} /> Edit History
                </button>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-3">Sourcing Options</h3>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2"><input type="radio" name="sourcing" value="db" /> My Database</label>
                <label className="flex items-center gap-2"><input type="radio" name="sourcing" value="web" defaultChecked /> Web Search</label>
                <label className="flex items-center gap-2"><input type="radio" name="sourcing" value="web" defaultChecked /> oth</label>
              </div>
              <button onClick={() => resumeInputRef.current?.click()} className="mt-4 w-full border-dashed border-2 border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 hover:text-teal-500 transition-colors">
                <UploadCloud size={24} className="mx-auto text-gray-400"/>
                <p className="text-sm text-gray-500 mt-2">
                  {resumeFiles ? `${resumeFiles.length} resumes selected` : 'Upload Resumes'}
                </p>
              </button>
              <input type="file" ref={resumeInputRef} onChange={handleResumeFilesChange} className="hidden" accept=".pdf,.docx,.txt" multiple/>
            </div>
            
            <button onClick={handleSearchAndRank} disabled={isJdLoading || isRankingLoading} className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 disabled:bg-gray-400">
              {getButtonText()}
            </button>

            {uploadStatus && (
              <div className={`mt-4 p-3 rounded-md text-sm text-center ${uploadStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {uploadStatus.message}
              </div>
            )}
          </aside>
          
          <div className="col-span-9 flex flex-col gap-8">
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Top Matching Candidates</h2>
                {isRankingLoading && <span className="text-sm text-teal-600">Searching & Ranking...</span>}
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {isRankingLoading ? "The AI agent is searching and ranking candidates. This may take a moment..." : 
                 candidates.length > 0 ? `Found and ranked ${candidates.length} candidates matching your prompt.` :
                 "Enter a prompt below and click 'Search and Rank' to find candidates."}
              </p>
              <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase py-2 border-b-2">
                <div className="col-span-4">Candidate</div>
                <div className="col-span-2">Match Score</div>
                <div className="col-span-2">Profile Link</div>
                <div className="col-span-4">Actions</div>
              </div>
              <div>
                {/* --- MODIFICATION START --- */}
                {/* 4. Render real, ranked candidates and pass the match score */}
                {candidates.map((candidate, index) => (
                  <CandidateRow 
                    key={index}
                    name={candidate.full_name || 'N/A'}
                    title={`${candidate.current_title || 'N/A'} at ${candidate.current_company || 'N/A'}`}
                    avatarInitial={candidate.full_name ? candidate.full_name.split(' ').map(n => n[0]).join('') : 'C'}
                    matchScore={Math.round(candidate.match_score)} // Pass the match score from the ranker
                  />
                ))}
                {/* --- MODIFICATION END --- */}
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-base font-semibold text-gray-800">Refine Search with AIRA</h3>
                  <Bot size={16} className="text-teal-600"/>
                </div>
                
                <div className="flex flex-col gap-4 mb-4">
                    <div className="self-start">
                        <button className="flex items-center gap-2 text-sm text-left p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-gray-700">
                            <Bot size={16} className="text-teal-600 flex-shrink-0"/>
                            <span>Find candidates with 5+ years of SaaS experience.</span>
                        </button>
                    </div>
                    
                    <div className="self-end">
                        <div className="p-3 text-sm rounded-lg bg-green-100 text-green-800">
                           Okay, filtering for candidates with over 5 years of SaaS experience. Here are the top results.
                        </div>
                    </div>
                </div>

                <div className="relative mb-4">
                    <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Enter your prompt here, e.g., Find senior developers..."
                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchAndRank()}
                    />
                    <button onClick={handleSearchAndRank} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-teal-600">
                        <SendHorizonal size={20} />
                    </button>
                </div>

                <div className="flex justify-end pt-2">
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                        <RefreshCw size={14} /> Rerun Search
                    </button>
                </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

