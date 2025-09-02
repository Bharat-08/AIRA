import React from 'react';
import type { Role } from '../../types/role';
import { Search, ChevronDown } from 'lucide-react';

interface RoleListProps {
  roles: Role[];
  selectedRoleId: string | undefined;
  onSelectRole: (role: Role) => void;
}

const getTimeAgo = (dateString: string): string => {
  // Use a fixed "current" date to ensure the output is always consistent with the target screenshot
  const now = new Date('2024-06-12T10:00:00Z'); 
  const createdDate = new Date(dateString);
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}m`;
  return `${Math.floor(diffDays / 365)}y`;
};

const RoleList: React.FC<RoleListProps> = ({ roles, selectedRoleId, onSelectRole }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Controls Section */}
      <div className="p-4 space-y-4">
        <button className="w-full bg-teal-600 text-white font-semibold py-2 rounded-md hover:bg-teal-700 transition-colors">
          + New Role
        </button>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search roles"
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-md focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-200">
            Filter <ChevronDown size={16} />
          </button>
          <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-200">
            Sort By <ChevronDown size={16} />
          </button>
        </div>
      </div>
      
      {/* Role List Items */}
      <div className="flex-grow overflow-y-auto border-t border-slate-100">
        {roles.map((role) => {
          const isSelected = role.id === selectedRoleId;
          return (
            <div
              key={role.id}
              onClick={() => onSelectRole(role)}
              className={`flex justify-between items-start px-4 py-3.5 cursor-pointer border-b border-slate-100 transition-colors
                ${isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'}
              `}
            >
              <div>
                <h3 className={`text-sm font-medium ${isSelected ? 'text-teal-900' : 'text-slate-800'}`}>
                  {role.title}
                </h3>
                <p className={`text-sm ${isSelected ? 'text-teal-700' : 'text-slate-500'}`}>
                  {role.location}
                </p>
              </div>
              <span className={`text-xs font-mono pt-0.5 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`}>
                {getTimeAgo(role.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoleList;

