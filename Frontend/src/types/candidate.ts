// src/types/candidate.ts
export type CandidateStatus = 'Favourited' | 'Contacted';
export type CandidateStage = 'Rejected' | 'Offer Extended' | 'Interviewing' | 'In Consideration';

// This array is correctly exported and used by the Pipeline page
export const candidateStages: CandidateStage[] = ['In Consideration', 'Interviewing', 'Offer Extended', 'Rejected'];

// RENAMED: This interface is now specific to the pipeline page's data structure.
// This preserves the logic for your existing Pipeline page.
export interface PipelineCandidate {
  id: string;
  name: string;
  role: string;
  company: string;
  status: CandidateStatus;
  stage: CandidateStage;
}

// NEW: This new interface matches the data structure for the Search page UI.
// It only includes fields that the UI is designed to display.
export interface Candidate {
  // This will be the main name displayed in the "Candidate" column.
  full_name: string;

  // These are used to construct the subtitle (e.g., "Software Engineer at TechCorp").
  current_title: string;
  current_company: string;

  // This is required for the "Match Score" column.
  match_score: number;

  // While not directly displayed as a column, this can be used for the profile link icon.
  validated_url?: string | null;
}