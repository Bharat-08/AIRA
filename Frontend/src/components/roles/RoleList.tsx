import React from 'react';
import type { Role } from '../../types/role';
import { Search, ChevronDown } from 'lucide-react';
import RoleListItem from '../ui/RoleListItem';

interface RoleListProps {
  roles: Role[];
  selectedRoleId: string | null | undefined;
  onSelectRole: (role: Role) => void;
  onNewRoleClick: () => void;
}

const RoleList: React.FC<RoleListProps> = ({ roles, selectedRoleId, onSelectRole, onNewRoleClick }) => {
  return (
    // MODIFICATION: Removed bg-white as it's now on the parent container
    <div className="flex flex-col h-full">
      {/* Controls Section */}
      <div className="p-4 space-y-4 border-b border-slate-100">
        {/* MODIFICATION: Updated button text and styling */}
        <button
          onClick={onNewRoleClick}
          className="w-full bg-teal-600 text-white font-semibold py-2 rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center"
        >
          + New Role
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input type="text" placeholder="Search roles" className="w-full bg-[#E0F8F3] text-Black font-semibold py-2 pl-10 pr-4 border border-slate-200 rounded-md text-sm focus:ring-teal-600 focus:border-teal-500" />
        </div>
        <div className="flex items-center gap-2">
          {/* MODIFICATION: Updated filter/sort button styling */}
          <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 w-full">Filter <ChevronDown size={16} /></button>
          <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 w-full">Sort By <ChevronDown size={16} /></button>
        </div>
      </div>

      {/* Role List Items */}
      {/* MODIFICATION: Added divide-y for separators and removed border from RoleListItem */}
      <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
        {roles.map((role) => (
          <RoleListItem
            key={role.id}
            role={role}
            isSelected={role.id === selectedRoleId}
            onClick={() => onSelectRole(role)}
          />
        ))}
      </div>
    </div>
  );
};

export default RoleList;