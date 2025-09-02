// src/api/upload.ts

const API_BASE_URL = 'http://localhost:8000'; // Your FastAPI server URL

/**
 * Uploads a single Job Description file to the backend.
 * @param file The JD file to upload.
 * @returns The parsed JD data from the backend.
 */
export const uploadJdFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/jd`, {
    method: 'POST',
    body: formData,
    credentials: 'include', // This line is correct and necessary
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to upload JD');
  }

  return response.json();
};

/**
 * Uploads multiple resume files for a specific JD.
 * @param files The list of resume files to upload.
 * @param jdId The ID of the job description to associate the resumes with.
 * @returns The result of the upload process from the backend.
 */
export const uploadResumeFiles = async (files: FileList, jdId: string) => {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE_URL}/upload/resumes/${jdId}`, {
    method: 'POST',
    body: formData,
    credentials: 'include', // This line is correct and necessary
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to upload resumes');
  }

  return response.json();
};
