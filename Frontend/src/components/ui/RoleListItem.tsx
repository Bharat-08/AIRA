import React from 'react';
import type { Role } from '../../types/role';

interface RoleListItemProps {
  role: Role;
  isSelected: boolean;
  onClick: () => void;
}

const getTimeAgo = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffDays <= 1) return 'Today';
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 5) return `${diffWeeks}w`;
  if (diffMonths < 12) return `${diffMonths}m`;
  return `${diffYears}y`;
};

const RoleListItem: React.FC<RoleListItemProps> = ({ role, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      // MODIFICATION: Removed the border-b class as the parent now handles separators
      className={`flex justify-between items-start px-4 py-3.5 cursor-pointer transition-colors
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
      <span className={`text-xs pt-0.5 whitespace-nowrap pl-3 ${isSelected ? 'text-teal-600 font-medium' : 'text-slate-400'}`}>
        {getTimeAgo(role.createdAt)}
      </span>
    </div>
  );
};

export default RoleListItem;