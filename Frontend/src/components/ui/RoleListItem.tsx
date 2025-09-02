import React from 'react';
import type { Role } from '../../types/role'; // Import our new type

interface RoleListItemProps {
  role: Role;
  isSelected: boolean;
  onClick: () => void;
}

const RoleListItem: React.FC<RoleListItemProps> = ({ role, isSelected, onClick }) => {
  const baseClasses = "block w-full text-left p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors";
  const selectedClasses = isSelected ? "bg-teal-50 border-l-4 border-teal-500 pl-3" : "";

  return (
    <div onClick={onClick} className={`${baseClasses} ${selectedClasses}`}>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">{role.title}</h3>
        <span className="text-xs text-gray-500">{role.postedAgo}</span>
      </div>
      <p className="text-sm text-gray-600">{role.location}</p>
    </div>
  );
};

export default RoleListItem;