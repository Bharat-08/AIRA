import type { Role } from '../types/role';

// A fixed "current" date to ensure the time-ago logic is consistent with the screenshot
const now = new Date('2024-06-12T10:00:00Z'); 

const daysAgo = (days: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const mockRoles: Role[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    location: 'Bangalore',
    createdAt: daysAgo(2), // 2d
    updatedAt: '2024-06-10T00:00:00Z',
    description: [
      'We are seeking a highly motivated and experienced Senior Software Engineer to join our growing team. In this role, you will be responsible for designing, developing, and maintaining high-quality software solutions that meet the needs of our clients.',
      'You will work closely with other engineers, product managers, and designers to deliver innovative and impactful products.'
    ],
    experience: '5+ years',
    keyRequirements: ['Java', 'Python', 'Cloud'],
    candidateStats: { liked: 5, contacted: 2 },
  },
  {
    id: '2',
    title: 'Product Manager',
    location: 'New York',
    createdAt: daysAgo(7), // 1w
    updatedAt: '2024-06-05T00:00:00Z',
    description: ['Lead the product vision, strategy, and roadmap. Define and analyze metrics that inform the success of products.'],
    experience: '3+ years',
    keyRequirements: ['Agile', 'Roadmap Planning', 'User Research'],
    candidateStats: { liked: 12, contacted: 4 },
  },
  {
    id: '3',
    title: 'UX Designer',
    location: 'London',
    createdAt: daysAgo(21), // 3w
    updatedAt: '2024-05-22T00:00:00Z',
    description: ['Create user-centered designs by understanding business requirements, and user feedback. Translate concepts into user flows, wireframes, mockups and prototypes.'],
    experience: '2+ years',
    keyRequirements: ['Figma', 'Prototyping', 'Usability Testing'],
    candidateStats: { liked: 8, contacted: 1 },
  },
  {
    id: '4',
    title: 'Data Scientist',
    location: 'San Francisco',
    createdAt: daysAgo(35), // ~1m
    updatedAt: '2024-05-08T00:00:00Z',
    description: ['Work with stakeholders throughout the organization to identify opportunities for leveraging company data to drive business solutions.'],
    experience: '4+ years',
    keyRequirements: ['Machine Learning', 'SQL', 'Statistics'],
    candidateStats: { liked: 15, contacted: 5 },
  },
  {
    id: '5',
    title: 'Marketing Specialist',
    location: 'Austin',
    createdAt: daysAgo(60), // ~2m
    updatedAt: '2024-04-13T00:00:00Z',
    description: ['Develop and implement marketing strategies to increase brand awareness and drive lead generation.'],
    experience: '3+ years',
    keyRequirements: ['SEO', 'Content Marketing', 'Google Analytics'],
    candidateStats: { liked: 7, contacted: 3 },
  },
   {
    id: '6',
    title: 'Sales Representative',
    location: 'Chicago',
    createdAt: daysAgo(90), // ~3m
    updatedAt: '2024-03-14T00:00:00Z',
    description: ['Build and maintain strong customer relationships, understand their needs, and present solutions.'],
    experience: '2+ years',
    keyRequirements: ['CRM Software', 'Negotiation', 'Communication'],
    candidateStats: { liked: 10, contacted: 6 },
  },
    {
    id: '7',
    title: 'Customer Support Agent',
    location: 'Remote',
    createdAt: daysAgo(120), // ~4m
    updatedAt: '2024-02-13T00:00:00Z',
    description: ['Provide timely and empathetic customer support through various channels, resolving issues and ensuring customer satisfaction.'],
    experience: '1+ year',
    keyRequirements: ['Zendesk', 'Problem-Solving', 'Patience'],
    candidateStats: { liked: 9, contacted: 8 },
  }
];

export const getRoles = (): Promise<Role[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockRoles);
    }, 300);
  });
};

