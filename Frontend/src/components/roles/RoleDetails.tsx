import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Role, RoleStatus } from '../../types/role';
import { ChevronDown } from 'lucide-react';

interface RoleDetailsProps {
  role: Role;
  onUpdateStatus: (status: RoleStatus) => void;
}

const RoleDetails: React.FC<RoleDetailsProps> = ({ role, onUpdateStatus }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
      });
  };

  const handleGoToPipeline = () => {
    navigate(`/pipeline/${role.id}`);
  };

  const getStatusStyles = (status: RoleStatus) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'close':
        return 'bg-red-100 text-red-800';
      case 'deprioritized':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="pb-5 border-b border-slate-100 mb-6">
        {/* --- MODIFICATION: Changed 'gap-4' to 'justify-between' --- */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-semibold text-slate-800">{role.title}</h2>
          
          <div className="relative">
            <select
              value={role.status}
              onChange={(e) => onUpdateStatus(e.target.value as RoleStatus)}
              className={`-webkit-appearance-none -moz-appearance-none appearance-none rounded-md py-1 pl-3 pr-8 text-sm font-medium transition-colors ${getStatusStyles(role.status)}`}
            >
              <option value="open">Open</option>
              <option value="close">Close</option>
              <option value="deprioritized">Deprioritized</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Created: {formatDate(role.createdAt)}
        </p>
      </div>

      <div className="flex-grow space-y-4 text-slate-600 leading-relaxed text-base max-h-[40vh] overflow-y-auto pr-4">
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

        <button
          onClick={handleGoToPipeline}
          className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50"
        >
          Go to Pipeline
        </button>
      </div>
    </div>
  );
};

export default RoleDetails;