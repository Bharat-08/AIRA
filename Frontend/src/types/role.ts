// src/types/role.ts

// ✨ NEW: Define the possible statuses
export type RoleStatus = 'open' | 'close' | 'deprioritized';

export interface Role {
  id: string;
  title: string;
  location: string;
  createdAt: string;
  description: string[];
  experience: string;
  keyRequirements: string[];
  candidateStats: {
    liked: number;
    contacted: number;
  };
  status: RoleStatus; // ✨ NEW: Add the status field to the interface
}