import React, { useState, useEffect } from 'react';
import type { Role } from '../types/role';
import { mockRoles } from '../api/roles';
import RoleList from '../components/roles/RoleList';
import RoleDetails from '../components/roles/RoleDetails';
import { Header } from '../components/layout/Header';
// import { User } from '../types/user';

// --- THIS IS THE FIX ---
// The component is no longer expecting a `user` prop, which was causing it to crash.
// We've also removed the unused 'User' type import.
export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // The user name can be hardcoded or fetched differently if needed later.
  const userName = 'User';

  useEffect(() => {
    // This logic correctly uses the mock data from roles.ts
    const rolesData = mockRoles;
    setRoles(rolesData);

    if (rolesData.length > 0) {
      setSelectedRole(rolesData[0]);
    }
    setIsLoading(false);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <Header userName={userName} />
      <main className="flex-grow p-6">
        <div className="flex h-full max-h-[calc(100vh-112px)] bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {/* Left Pane */}
          <div className="w-[380px] flex-shrink-0 border-r border-slate-100 flex flex-col">
            {isLoading ? (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-slate-500">Loading roles...</p>
              </div>
            ) : (
              <RoleList
                roles={roles}
                selectedRoleId={selectedRole?.id}
                onSelectRole={setSelectedRole}
              />
            )}
          </div>
          {/* Right Pane */}
          <div className="flex-grow p-8 overflow-y-auto">
            {isLoading ? (
               <div className="flex h-full items-center justify-center">
                 <p className="text-slate-500">Loading details...</p>
              </div>
            ) : selectedRole ? (
              <RoleDetails role={selectedRole} />
            ) : (
              <div className="flex h-full items-center justify-center">
                 <p className="text-slate-500">Select a role to view details.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}