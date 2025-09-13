import React, { useState, useRef, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { CandidateRow } from '../components/ui/CandidateRow';
import { Plus, UploadCloud, Search as SearchIcon, SendHorizonal, Bot, Eye, History, RefreshCw, XCircle } from 'lucide-react';
import type { User } from '../types/user';
import { uploadJdFile, uploadResumeFiles } from '../api/upload';
import { fetchJdsForUser, type JdSummary } from '../api/roles';
// --- START: MODIFICATION ---
// Import the new rankResumes function
import { searchCandidates, stopSearch, rankResumes } from '../api/search';
// --- END: MODIFICATION ---
import type { Candidate } from '../types/candidate';

// Loader component (Unchanged)
const Loader = () => (
  <svg className="animate-spin h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// JobDescriptionDetails interface (Unchanged)
interface JobDescriptionDetails {
  jd_id: string;
  jd_parsed_summary: string;
  location: string;
  job_type: string;
  experience_required: string;
}

export function SearchPage({ user }: { user: User }) {
  const userName = user.name || 'User';

  const [userJds, setUserJds] = useState<JdSummary[]>([]);
  const [currentJd, setCurrentJd] = useState<JobDescriptionDetails | null>(null);
  const [resumeFiles, setResumeFiles] = useState<FileList | null>(null);
  const [isJdLoading, setIsJdLoading] = useState(false);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // --- START: NEW STATE FOR SOURCING OPTION ---
  const [sourcingOption, setSourcingOption] = useState<'web' | 'db'>('web');
  // --- END: NEW STATE ---

  const jdInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // useEffect and original handlers are unchanged
  useEffect(() => {
    const loadUserJds = async () => {
      try {
        const jds = await fetchJdsForUser();
        setUserJds(jds);
        if (jds.length > 0) {
          handleJdSelection(jds[0].jd_id, jds);
        }
      } catch (error) {
        setUploadStatus({ message: 'Could not load your saved roles.', type: 'error' });
      }
    };
    loadUserJds();
  }, []);

  const handleJdFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setIsJdLoading(true);
      setUploadStatus(null);
      try {
        const newJd = await uploadJdFile(file);
        const updatedJds = await fetchJdsForUser();
        setUserJds(updatedJds);
        handleJdSelection(newJd.jd_id, updatedJds);
        setUploadStatus({ message: 'JD uploaded and selected!', type: 'success' });
      } catch (error) {
        setUploadStatus({ message: (error as Error).message, type: 'error' });
      } finally {
        setIsJdLoading(false);
      }
    }
  };
  
  const handleJdSelection = (selectedJdId: string, jds: JdSummary[]) => {
    const selectedJd = jds.find(jd => jd.jd_id === selectedJdId);
    if (selectedJd) {
      setCurrentJd({
        jd_id: selectedJd.jd_id,
        jd_parsed_summary: selectedJd.jd_parsed_summary || '',
        location: selectedJd.location || 'N/A',
        job_type: selectedJd.job_type || 'N/A',
        experience_required: selectedJd.experience_required || 'N/A',
      });
      setCandidates([]);
      setUploadStatus(null);
      setHasSearched(false);
    }
  };

  const handleResumeFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setResumeFiles(event.target.files);
    }
  };

  // --- START: MODIFIED handleSearchAndRank FUNCTION ---
  const handleSearchAndRank = async () => {
    if (!currentJd) {
      setUploadStatus({ message: 'Please upload a Job Description first.', type: 'error' });
      return;
    }
    if (!chatMessage) {
      setUploadStatus({ message: 'Please enter a prompt to start the search.', type: 'error' });
      return;
    }

    setIsRankingLoading(true);
    setUploadStatus(null);
    setHasSearched(true);

    try {
      let result: Candidate[] = [];

      // Always upload resumes first if they are present, regardless of sourcing option
      if (resumeFiles && resumeFiles.length > 0) {
        await uploadResumeFiles(resumeFiles, currentJd.jd_id);
        setResumeFiles(null);
        if (resumeInputRef.current) resumeInputRef.current.value = "";
        setUploadStatus({ message: 'Resumes uploaded. Starting ranking...', type: 'success' });
      }

      // Decide which API to call based on the selected sourcing option
      if (sourcingOption === 'db') {
        result = await rankResumes(currentJd.jd_id, chatMessage);
      } else { // 'web' is the other option
        result = await searchCandidates(currentJd.jd_id, chatMessage);
      }
      
      setCandidates(result);

      if (result.length > 0) {
        setUploadStatus({ message: `Found and ranked ${result.length} total candidates!`, type: 'success' });
      } else {
        setUploadStatus({ message: 'Search complete. No new candidates were found.', type: 'success' });
      }

    } catch (error) {
       if ((error as Error).message !== 'Search cancelled by user.') {
        setUploadStatus({ message: (error as Error).message, type: 'error' });
      }
    } finally {
      setIsRankingLoading(false);
    }
  };
  // --- END: MODIFIED handleSearchAndRank FUNCTION ---
  
  const handleStopSearch = async () => {
    try {
      await stopSearch();
      setUploadStatus({ message: 'Search has been stopped.', type: 'success' });
    } catch (error) {
      setUploadStatus({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsRankingLoading(false);
    }
  };
  
  const handleUpdateCandidate = (updatedCandidate: Candidate) => {
    setCandidates(prevCandidates =>
      prevCandidates.map(c =>
        c.profile_id === updatedCandidate.profile_id ? updatedCandidate : c
      )
    );
  };

  const getMainActionButton = () => {
    if (isRankingLoading) {
      return (
        <button 
          onClick={handleStopSearch} 
          className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
        >
          <XCircle size={18}/> Stop Search
        </button>
      );
    }
    return (
      <button 
        onClick={handleSearchAndRank} 
        disabled={isJdLoading} 
        className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 disabled:bg-gray-400 transition-colors"
      >
        <SearchIcon size={18}/> Search and Rank
      </button>
    );
  };

  return (
    <div className="h-screen bg-gray-50 text-gray-800 flex flex-col">
      <Header userName={userName} showBackButton={true} />
      <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-screen-2xl mx-auto w-full overflow-y-hidden min-h-0">
        <div className="grid grid-cols-12 gap-8 h-full">
          <aside className="col-span-3 flex flex-col gap-6 overflow-y-auto pb-4">
            {/* JD Selection Box (Unchanged) */}
             <div className="p-4 bg-white rounded-lg border border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-gray-700">Select Role</label>
                <button onClick={() => jdInputRef.current?.click()} className="text-sm text-teal-600 hover:underline flex items-center gap-1">
                  <Plus size={14}/> Add New Role
                </button>
                <input type="file" ref={jdInputRef} onChange={handleJdFileChange} className="hidden" accept=".pdf,.docx,.txt"/>
              </div>
              
              <select
                value={currentJd?.jd_id || ''}
                onChange={(e) => handleJdSelection(e.target.value, userJds)}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                disabled={userJds.length === 0}
              >
                {userJds.length > 0 ? (
                  userJds.map(jd => (
                    <option key={jd.jd_id} value={jd.jd_id}>
                      {jd.title}
                    </option>
                  ))
                ) : (
                  <option disabled value="">Upload a JD to begin</option>
                )}
              </select>

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
            {/* --- START: MODIFIED SOURCING OPTIONS --- */}
            <div className="p-4 bg-white rounded-lg border border-gray-200 flex-shrink-0">
              <h3 className="font-semibold text-gray-700 mb-3">Sourcing Options</h3>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="sourcing"
                    value="db"
                    checked={sourcingOption === 'db'}
                    onChange={() => setSourcingOption('db')}
                  /> My Database
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="sourcing"
                    value="web"
                    checked={sourcingOption === 'web'}
                    onChange={() => setSourcingOption('web')}
                  /> Web Search
                </label>
                <label className="flex items-center gap-2 text-gray-400">
                  <input type="radio" name="sourcing" value="both" disabled /> Both (Coming Soon)
                </label>
              </div>
              <button onClick={() => resumeInputRef.current?.click()} className="mt-4 w-full border-dashed border-2 border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 hover:text-teal-500 transition-colors">
                <UploadCloud size={24} className="mx-auto text-gray-400"/>
                <p className="text-sm text-gray-500 mt-2">
                  {resumeFiles ? `${resumeFiles.length} resumes selected` : 'Upload Resumes'}
                </p>
              </button>
              <input type="file" ref={resumeInputRef} onChange={handleResumeFilesChange} className="hidden" accept=".pdf,.docx,.txt" multiple/>
            </div>
            {/* --- END: MODIFIED SOURCING OPTIONS --- */}
            {getMainActionButton()}
            {uploadStatus && (
              <div className={`mt-4 p-3 rounded-md text-sm text-center flex-shrink-0 ${uploadStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {uploadStatus.message}
              </div>
            )}
          </aside>
          
          {/* Main Content Area (Unchanged) */}
          <div className="col-span-9 flex flex-col gap-8 h-full min-h-0">
            <div className="p-6 bg-white rounded-lg border border-gray-200 flex flex-col flex-grow min-h-0">
              <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Top Matching Candidates</h2>
                  {isRankingLoading && (
                    <div className="flex items-center gap-2 text-sm text-teal-600">
                      <Loader />
                      <span>Searching & Ranking...</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4 h-5">
                  {!isRankingLoading && (
                    candidates.length > 0 
                      ? `Found and ranked ${candidates.length} candidates.` 
                      : "Enter a prompt and click 'Search and Rank' to find candidates."
                  )}
                </p>
                <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase py-2 border-b-2">
                  <div className="col-span-6">Candidate</div>
                  <div className="col-span-2">Match Score</div>
                  <div className="col-span-2">Profile Link</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>
              
              <div className="flex-grow overflow-y-auto max-h-[30vh]">
                {candidates.map((candidate) => (
                  <CandidateRow 
                    key={candidate.profile_id} 
                    candidate={candidate} 
                    onUpdateCandidate={handleUpdateCandidate}
                  />
                ))}
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg border border-gray-200 flex-shrink-0">
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
                    {hasSearched && (
                      <div className="self-end">
                          <div className="p-3 text-sm rounded-lg bg-green-100 text-green-800">
                             Okay, filtering for candidates... Here are the top results.
                          </div>
                      </div>
                    )}
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Chat with AIRA..."
                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        onKeyDown={(e) => e.key === 'Enter' && !isRankingLoading && handleSearchAndRank()}
                        disabled={isRankingLoading}
                    />
                    <button 
                      onClick={isRankingLoading ? handleStopSearch : handleSearchAndRank} 
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-teal-600"
                    >
                      {isRankingLoading ? <XCircle size={20} className="text-red-500"/> : <SendHorizonal size={20} />}
                    </button>
                </div>

                {hasSearched && !isRankingLoading && (
                  <div className="flex justify-end pt-4">
                      <button 
                        onClick={handleSearchAndRank}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                          <RefreshCw size={14} /> Rerun Search
                      </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}