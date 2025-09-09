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

