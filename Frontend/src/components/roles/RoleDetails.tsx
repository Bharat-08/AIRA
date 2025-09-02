import React from 'react';
import type { Role } from '../../types/role';

interface RoleDetailsProps {
  role: Role;
}

const RoleDetails: React.FC<RoleDetailsProps> = ({ role }) => {
  const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
      });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="pb-5 border-b border-slate-100 mb-6">
        <h2 className="text-2xl font-semibold text-slate-800 mb-1">{role.title}</h2>
        <p className="text-sm text-slate-500">
          Created: {formatDate(role.createdAt)} · Last updated: {formatDate(role.updatedAt)}
        </p>
      </div>
      
      <div className="flex-grow space-y-4 text-slate-600 leading-relaxed text-base">
        {role.description.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="pt-8 mt-8 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-8 mb-8">
              <div>
                  <h3 className="text-sm font-medium text-slate-500">Location</h3>
                  <p className="mt-1 text-base text-slate-900">{role.location}</p>
              </div>
              <div>
                  <h3 className="text-sm font-medium text-slate-500">Experience</h3>
                  <p className="mt-1 text-base text-slate-900">{role.experience}</p>
              </div>
              <div>
                  <h3 className="text-sm font-medium text-slate-500">Key Requirements</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                      {role.keyRequirements.map((req) => (
                          <span key={req} className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-700">
                              {req}
                          </span>
                      ))}
                  </div>
              </div>
          </div>
      </div>
      
      <div className="flex justify-between items-center pt-5 border-t border-slate-100">
        <p className="text-sm text-slate-600">
          Candidates Liked: <span className="font-semibold text-slate-900">{role.candidateStats.liked}</span> | Candidates Contacted: <span className="font-semibold text-slate-900">{role.candidateStats.contacted}</span>
        </p>
        <button className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50">
          Go to Pipeline
        </button>
      </div>
    </div>
  );
};

export default RoleDetails;
