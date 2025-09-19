import React, { useState, useEffect } from 'react';
import type { Role } from '../types/role';
import { getRoles, createRole } from '../api/roles';
import RoleList from '../components/roles/RoleList';
import RoleDetails from '../components/roles/RoleDetails';
import { Header } from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { user, isLoading: isAuthLoading } = useAuth();
  const userName = user?.email || 'User';

  useEffect(() => {
    if (user) {
      const fetchUserRoles = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const userRoles = await getRoles();
          setRoles(userRoles);
          if (userRoles.length > 0) {
            setSelectedRole(userRoles[0]);
          }
        } catch (err) {
          setError('Failed to fetch roles. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserRoles();
    } else if (!isAuthLoading) {
        setIsLoading(false);
    }
  }, [user, isAuthLoading]);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setJdFile(event.target.files[0]);
    }
  };

  const handleUploadAndCreateRole = async () => {
    if (!jdFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (!user) {
      setUploadError("You must be logged in to create a role.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const newRole = await createRole(jdFile);
      setRoles([newRole, ...roles]);
      setSelectedRole(newRole);
      setIsModalOpen(false);
      setJdFile(null);
    } catch (err: any) {
      setUploadError(err.message || 'An unexpected error occurred.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = (roleId: string, newStatus: string) => {
    console.log(`Updating status for role ${roleId} to ${newStatus}`);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Header userName={userName} />
      <main className="flex-grow p-4 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-full gap-4">
          <div className="md:col-span-1 lg:col-span-1 h-full bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
            <RoleList
              roles={roles}
              selectedRoleId={selectedRole?.id}
              onSelectRole={handleSelectRole}
              onNewRoleClick={() => setIsModalOpen(true)}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3 h-full bg-white p-6 rounded-lg shadow-sm">
            {isLoading ? (
              <div className="text-center text-slate-500">Loading roles...</div>
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : selectedRole ? (
              <RoleDetails
                role={selectedRole}
                onUpdateStatus={(newStatus) => handleUpdateStatus(selectedRole.id, newStatus)}
              />
            ) : (
              <div className="text-center text-slate-500">{user ? 'No roles found. Select "New Role" to begin.' : 'Please log in to view roles.'}</div>
            )}
          </div>
        </div>
      </main>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Role</h2>
            <p className="mb-4 text-gray-600">Upload a Job Description.</p>
            {/* --- COLOR CHANGE HERE --- */}
            <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-teal-600 file:text-white  hover:file:bg-teal-200 mb-4" accept=".pdf,.doc,.docx,.txt" />
            {uploadError && <p className="text-red-500 text-sm mb-4">{uploadError}</p>}
            <div className="flex justify-end space-x-4">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded-md" disabled={uploading}>Cancel</button>
              {/* --- COLOR CHANGE HERE --- */}
              <button onClick={handleUploadAndCreateRole} className="px-4 py-2 bg-teal-600 text-white rounded-md disabled:bg-teal-600" disabled={uploading || !jdFile}>
                {uploading ? 'Uploading...' : 'Upload & Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}