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
    // Gracefully handle cancellation from the backend without showing an error
    if (response.status === 499) {
      console.log('Search was cancelled by the user.');
      return []; // Return an empty array to stop processing
    }
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to search for candidates');
  }

  return response.json();
};

/**
 * Sends a request to the backend to stop the current search for the user.
 */
export const stopSearch = async (): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/search/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Use cookie-based credentials to match the rest of the app's auth
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to stop the search.');
  }

  return response.json();
};

/**
 * --- START: NEW FUNCTION ---
 * Calls the backend to rank resumes from the database for a given JD.
 * @param jdId The ID of the job description.
 * @param prompt The user's search prompt (though it might not be used by this specific endpoint, it's good practice to pass it).
 * @returns A list of ranked candidates from the database.
 */
export const rankResumes = async (jdId: string, prompt: string): Promise<Candidate[]> => {
  const response = await fetch(`${API_BASE_URL}/search/rank-resumes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jd_id: jdId, prompt: prompt }),
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 499) {
      console.log('Search was cancelled by the user.');
      return [];
    }
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to rank resumes');
  }

  return response.json();
};
/**
 * --- END: NEW FUNCTION ---
 */

/**
 * Calls the backend to generate a LinkedIn URL for a given candidate.
 * @param profileId The ID of the candidate's profile.
 * @returns An object containing the newly generated profile_url.
 */
export const generateLinkedInUrl = async (profileId: string): Promise<{ linkedin_url: string }> => {
  const response = await fetch(`${API_BASE_URL}/search/generate-linkedin-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profile_id: profileId }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to generate LinkedIn URL');
  }

  return response.json();
};