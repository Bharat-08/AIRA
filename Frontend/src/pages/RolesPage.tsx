import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import RoleList from '../components/roles/RoleList';
import RoleDetails from '../components/roles/RoleDetails';
import type { Role } from '../types/role';
import type { User } from '../types/user';
import { mockRoles } from '../api/roles';

// --- THIS IS THE FIX ---
// This component is exported as a default export.
// This is required by the App.tsx file which imports it using: `import RolesPage from ...`
// If the build error persists, it is likely a Docker cache issue.
export default function RolesPage({ user }: { user: User }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const userName = user.name || 'User';

  useEffect(() => {
    const rolesData = mockRoles; 
    setRoles(rolesData);
    
    if (rolesData.length > 0) {
      setSelectedRole(rolesData[0]);
    }
  }, []);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
  };

  return (
    <div className="h-screen bg-gray-50 text-gray-800 flex flex-col">
      <Header userName={userName} />
      <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-screen-2xl mx-auto w-full overflow-y-hidden">
        <div className="grid grid-cols-12 gap-8 h-full">
          <div className="col-span-4 h-full overflow-y-auto">
            <RoleList roles={roles} onSelectRole={handleSelectRole} selectedRoleId={selectedRole?.id} />
          </div>
          <div className="col-span-8 h-full overflow-y-auto">
            {selectedRole ? (
              <RoleDetails role={selectedRole} />
            ) : (
              <div className="flex items-center justify-center h-full bg-white rounded-lg border">
                <p className="text-gray-500">Select a role to see the details.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}