// ### **`src/pages/RolesPage.tsx`**

// This final file assembles all the components into the complete page layout.

// ```typescript:Roles Page:src/pages/RolesPage.tsx
import React, { useState, useEffect } from 'react';
import type { Role } from '../types/role';
import { getRoles } from '../api/roles';
import RoleList from '../components/roles/RoleList';
import RoleDetails from '../components/roles/RoleDetails';
import { Header } from '../components/layout/Header';

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRoles = async () => {
      const fetchedRoles = await getRoles();
      setRoles(fetchedRoles);
      if (fetchedRoles.length > 0) {
        setSelectedRole(fetchedRoles[0]);
      }
      setIsLoading(false);
    };

    fetchRoles();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <Header />
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
};

export default RolesPage;