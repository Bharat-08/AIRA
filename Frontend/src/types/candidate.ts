// src/types/candidate.ts
export type CandidateStatus = 'Favourited' | 'Contacted';
export type CandidateStage = 'Rejected' | 'Offer Extended' | 'Interviewing' | 'In Consideration';

// This array is correctly exported from this file
export const candidateStages: CandidateStage[] = ['In Consideration', 'Interviewing', 'Offer Extended', 'Rejected'];

export interface Candidate {
  id: string;
  name: string;
  role: string;
  company: string;
  status: CandidateStatus;
  stage: CandidateStage;
}