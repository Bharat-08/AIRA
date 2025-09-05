import type { Candidate } from '../types/candidate';

const API_BASE_URL = 'http://localhost:8000'; // Your FastAPI server URL

/**
 * Calls the backend to search for candidates based on a JD and a prompt.
 * @param jdId The ID of the job description.
 * @param prompt The user's search prompt.
 * @returns A list of candidates found by the agent.
 */
export const searchCandidates = async (jdId: string, prompt: string): Promise<Candidate[]> => {
  const response = await fetch(`${API_BASE_URL}/search/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jd_id: jdId, prompt: prompt }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to search for candidates');
  }

  return response.json();
};