export interface Role {
  id: string;
  title: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  description: string[];
  experience: string;
  keyRequirements: string[];
  candidateStats: {
    liked: number;
    contacted: number;
  };
}
