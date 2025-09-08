import type { Role } from '../types/role';

// --- MOCK DATA SECTION (Preserved for RolesPage) ---

// A fixed "current" date to ensure the time-ago logic is consistent
const now = new Date('2024-06-12T10:00:00Z'); 

const daysAgo = (days: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// This mock data is kept to ensure the RolesPage continues to work as expected.
export const mockRoles: Role[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    location: 'Bangalore',
    createdAt: daysAgo(2),
    updatedAt: '2024-06-10T00:00:00Z',
    description: [
      'We are seeking a highly motivated and experienced Senior Software Engineer to join our growing team. In this role, you will be responsible for designing, developing, and maintaining high-quality software solutions that meet the needs of our clients.',
      'You will work closely with other engineers, product managers, and designers to deliver innovative and impactful products.',
    ],
    experience: '5+ years',
    keyRequirements: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    candidateStats: { liked: 12, contacted: 4 },
  },
  {
    id: '2',
    title: 'Product Manager',
    location: 'San Francisco',
    createdAt: daysAgo(10),
    updatedAt: '2024-06-05T00:00:00Z',
    description: ['Define product vision, strategy, and roadmap. Work with cross-functional teams to design, build, and roll-out products that deliver the company’s vision and strategy.'],
    experience: '4+ years',
    keyRequirements: ['Agile', 'Roadmapping', 'User Research'],
    candidateStats: { liked: 25, contacted: 10 },
  },
  {
    id: '3',
    title: 'UX/UI Designer',
    location: 'New York',
    createdAt: daysAgo(30),
    updatedAt: '2024-05-13T00:00:00Z',
    description: ['Create user-centered designs by understanding business requirements, and user feedback. Create user flows, wireframes, prototypes, and mockups.'],
    experience: '3+ years',
    keyRequirements: ['Figma', 'Sketch', 'Adobe XD'],
    candidateStats: { liked: 18, contacted: 8 },
  },
];


// --- LIVE API SECTION (Added for SearchPage) ---

const API_BASE_URL = 'http://localhost:8000';

/**
 * Defines the TypeScript interface for the summarized JD data.
 * This matches the data structure from the GET /roles endpoint.
 */
export interface JdSummary {
  jd_id: string;
  title: string;
  location?: string;
  job_type?: string;
  experience_required?: string;
  jd_parsed_summary?: string;
}

/**
 * Fetches real job descriptions uploaded by the current user.
 * This function is used by the SearchPage dropdown.
 * @returns A promise that resolves to an array of JD summaries.
 */
export const fetchJdsForUser = async (): Promise<JdSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/roles`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Ensures the auth cookie is sent
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch your saved Job Descriptions.');
  }

  return response.json();
};

