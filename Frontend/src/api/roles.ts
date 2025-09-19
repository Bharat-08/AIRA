import type { Role } from '../types/role';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface JdSummary {
  jd_id: string;
  title: string;
  role: string | null;
  location?: string;
  job_type?: string;
  experience_required?: string;
  jd_parsed_summary?: string;
  created_at: string;
  key_requirements?: string;
}

/**
 * Fetches real job descriptions uploaded by the current user using cookie authentication.
 */
export const fetchJdsForUser = async (): Promise<JdSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/roles/`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch roles');
  }
  return response.json();
};

/**
 * Creates a new role by uploading a Job Description file using cookie authentication.
 */
export const createRole = async (file: File): Promise<Role> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/roles/`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create the new role.');
  }

  const createdJd: JdSummary = await response.json();
  // Transform the API response to the frontend's Role type
  return {
    id: createdJd.jd_id,
    title: createdJd.title,
    location: createdJd.location || 'N/A',
    createdAt: createdJd.created_at,
    description: [createdJd.jd_parsed_summary || 'No summary available.'],
    experience: createdJd.experience_required || 'N/A',
    keyRequirements: createdJd.key_requirements ? createdJd.key_requirements.split(', ') : [],
    candidateStats: { liked: 0, contacted: 0 },
    status: 'open',
  };
};

/**
 * A wrapper function that uses fetchJdsForUser and transforms the data
 * to the format expected by the frontend components.
 */
export const getRoles = async (): Promise<Role[]> => {
  const jds = await fetchJdsForUser();
  // --- FIX ---
  // The 'id' field is now correctly mapped from the API's 'jd_id'.
  // This was the final issue preventing the roles from displaying correctly.
  return jds.map(jd => ({
    id: jd.jd_id, // This line is now correct
    title: jd.role,
    location: jd.location || 'N/A',
    createdAt: jd.created_at,
    description: jd.jd_parsed_summary ? [jd.jd_parsed_summary] : ['No description available.'],
    experience: jd.experience_required || 'Not specified',
    keyRequirements: jd.key_requirements ? jd.key_requirements.split(', ') : [],
    candidateStats: { liked: 0, contacted: 0 },
    status: 'open',
  }));
};