import React, { useState, useRef, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { CandidateRow } from '../components/ui/CandidateRow';
import { Plus, UploadCloud, Search as SearchIcon, SendHorizonal, Bot, Eye, History } from 'lucide-react';
import type { User } from '../types/user';
import { uploadJdFile, uploadResumeFiles } from '../api/upload';
// --- 1. Import the new API function and interface ---
import { fetchJdsForUser, type JdSummary } from '../api/roles';
import { searchCandidates } from '../api/search';
import type { Candidate } from '../types/candidate';

// This interface is used for the currently selected JD's full details
interface JobDescriptionDetails {
  jd_id: string;
  jd_parsed_summary: string;
  location: string;
  job_type: string;
  experience_required: string;
}

export function SearchPage({ user }: { user: User }) {
  const userName = user.name || 'User';

  // --- 2. Add state to hold the list of all of the user's JDs ---
  const [userJds, setUserJds] = useState<JdSummary[]>([]);
  
  // This state will hold the full details of the JD selected from the dropdown
  const [currentJd, setCurrentJd] = useState<JobDescriptionDetails | null>(null);
  
  const [resumeFiles, setResumeFiles] = useState<FileList | null>(null);
  const [isJdLoading, setIsJdLoading] = useState(false);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const jdInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // --- 3. Fetch all JDs when the component first loads ---
  useEffect(() => {
    const loadUserJds = async () => {
      try {
        const jds = await fetchJdsForUser();
        setUserJds(jds);
        // If the user has JDs, automatically select the first one
        if (jds.length > 0) {
          handleJdSelection(jds[0].jd_id);
        }
      } catch (error) {
        setUploadStatus({ message: 'Could not load your saved roles.', type: 'error' });
      }
    };
    loadUserJds();
  }, []); // Empty dependency array means this runs once when the component mounts

  // --- 4. Handle a new JD file being uploaded ---
  const handleJdFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setIsJdLoading(true);
      setUploadStatus(null);
      try {
        const newJd = await uploadJdFile(file);
        // After a successful upload, refresh the list of JDs
        const updatedJds = await fetchJdsForUser();
        setUserJds(updatedJds);
        // Automatically select the newly uploaded JD in the dropdown
        handleJdSelection(newJd.jd_id);
        setUploadStatus({ message: 'JD uploaded and selected!', type: 'success' });
      } catch (error) {
        setUploadStatus({ message: (error as Error).message, type: 'error' });
      } finally {
        setIsJdLoading(false);
      }
    }
  };
  
  // --- 5. Handle the user selecting a JD from the dropdown ---
  const handleJdSelection = (selectedJdId: string) => {
    // Find the full details of the selected JD from the list we fetched
    const selectedJd = userJds.find(jd => jd.jd_id === selectedJdId);
    if (selectedJd) {
      // Set the `currentJd` state to display its details
      setCurrentJd({
        jd_id: selectedJd.jd_id,
        jd_parsed_summary: selectedJd.jd_parsed_summary || '',
        location: selectedJd.location || 'N/A',
        job_type: selectedJd.job_type || 'N/A',
        experience_required: selectedJd.experience_required || 'N/A',
      });
      // Clear out results from any previous search
      setCandidates([]);
      setUploadStatus(null);
    }
  };

  // --- (Other functions like handleResumeFilesChange and handleSearchAndRank are preserved) ---
  const handleResumeFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setResumeFiles(event.target.files);
    }
  };

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
    try {
      if (resumeFiles && resumeFiles.length > 0) {
        await uploadResumeFiles(resumeFiles, currentJd.jd_id);
        setResumeFiles(null); 
        if (resumeInputRef.current) resumeInputRef.current.value = "";
        setUploadStatus({ message: 'Resumes uploaded. Starting search & rank...', type: 'success' });
      }

      const result = await searchCandidates(currentJd.jd_id, chatMessage);
      setCandidates(result);

      if (result.length > 0) {
        setUploadStatus({ message: `Found and ranked ${result.length} total candidates!`, type: 'success' });
      } else {
        setUploadStatus({ message: 'Search complete. No new candidates were found.', type: 'success' });
      }

    } catch (error) {
      setUploadStatus({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsRankingLoading(false);
    }
  };

  const getButtonText = () => {
    if (isJdLoading) return 'Parsing JD...';
    if (isRankingLoading) return 'Searching & Ranking...';
    return <><SearchIcon size={18}/> Search and Rank</>;
  };

  return (
    <div className="h-screen bg-gray-50 text-gray-800 flex flex-col">
      <Header userName={userName} showBackButton={true} />
      <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-screen-2xl mx-auto w-full overflow-y-hidden min-h-0">
        <div className="grid grid-cols-12 gap-8 h-full">
          <aside className="col-span-3 flex flex-col gap-6 overflow-y-auto pb-4">
             <div className="p-4 bg-white rounded-lg border border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-gray-700">Select Role</label>
                <button onClick={() => jdInputRef.current?.click()} className="text-sm text-teal-600 hover:underline flex items-center gap-1">
                  <Plus size={14}/> Add New Role
                </button>
                <input type="file" ref={jdInputRef} onChange={handleJdFileChange} className="hidden" accept=".pdf,.docx,.txt"/>
              </div>
              
              {/* --- 6. The UI is now a dropdown menu --- */}
              <select
                value={currentJd?.jd_id || ''}
                onChange={(e) => handleJdSelection(e.target.value)}
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
              {/* --- The rest of the UI and logic is preserved --- */}
              <div className="mt-4 flex flex-col items-stretch gap-2 text-sm">
                <button className="flex items-center justify-center gap-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 font-medium">
                  <Eye size={16} /> View JD
                </button>
                <button className="flex items-center justify-center gap-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 font-medium">
                  <History size={16} /> Edit History
                </button>
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200 flex-shrink-0">
              <h3 className="font-semibold text-gray-700 mb-3">Sourcing Options</h3>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2"><input type="radio" name="sourcing" value="db" /> My Database</label>
                <label className="flex items-center gap-2"><input type="radio" name="sourcing" value="web" defaultChecked /> Web Search</label>
                <label className="flex items-center gap-2"><input type="radio" name="sourcing" value="both" /> Both</label>
              </div>
              <button onClick={() => resumeInputRef.current?.click()} className="mt-4 w-full border-dashed border-2 border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 hover:text-teal-500 transition-colors">
                <UploadCloud size={24} className="mx-auto text-gray-400"/>
                <p className="text-sm text-gray-500 mt-2">
                  {resumeFiles ? `${resumeFiles.length} resumes selected` : 'Upload Resumes'}
                </p>
              </button>
              <input type="file" ref={resumeInputRef} onChange={handleResumeFilesChange} className="hidden" accept=".pdf,.docx,.txt" multiple/>
            </div>
            <button onClick={handleSearchAndRank} disabled={isJdLoading || isRankingLoading} className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 disabled:bg-gray-400 flex-shrink-0">
              {getButtonText()}
            </button>
            {uploadStatus && (
              <div className={`mt-4 p-3 rounded-md text-sm text-center flex-shrink-0 ${uploadStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {uploadStatus.message}
              </div>
            )}
          </aside>
          
          <div className="col-span-9 flex flex-col gap-8 h-full min-h-0">
            <div className="p-6 bg-white rounded-lg border border-gray-200 flex flex-col flex-grow min-h-0">
              <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Top Matching Candidates</h2>
                  {isRankingLoading && <div className="animate-pulse h-4 w-24 bg-gray-200 rounded-md"></div>}
                </div>
                <p className="text-sm text-gray-500 mb-4 h-5">
                  {isRankingLoading ? "The AI agent is searching and ranking candidates..." : 
                   candidates.length > 0 ? `Found and ranked ${candidates.length} candidates.` :
                   "Enter a prompt and click 'Search and Rank' to find candidates."}
                </p>
                <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase py-2 border-b-2">
                  <div className="col-span-4">Candidate</div>
                  <div className="col-span-2">Match Score</div>
                  <div className="col-span-2">Profile Link</div>
                  <div className="col-span-4">Actions</div>
                </div>
              </div>
              
              <div className="flex-grow overflow-y-auto">
                {candidates.map((candidate) => (
                  <CandidateRow key={candidate.profile_id} candidate={candidate} />
                ))}
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg border border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-base font-semibold text-gray-800">Refine Search with AIRA</h3>
                  <Bot size={16} className="text-teal-600"/>
                </div>
                <div className="relative">
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

