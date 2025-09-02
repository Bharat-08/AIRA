// src/pages/RecruiterDashboardPage.tsx
import { ArrowRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { KpiCard } from '../components/ui/KpiCard';
import type { User } from '../types/user';
import { Link } from 'react-router-dom';

// Mock data - in a real app, this would come from your backend
const kpis = [
  { id: 1, icon: 'folder-open', value: 0, label: "Open Roles" },
  { id: 2, icon: 'users', value: 0, label: "Candidates Contacted" },
  { id: 3, icon: 'star', value: 0, label: "Profiles Favourited" },
];
const lastActivity = { roleName: "Product Manager (SG)", lastUpdated: "2 days ago" };
const recommendedProfiles = { count: 5, roleName: "PM (SG)" };

export function RecruiterDashboardPage({ user }: { user: User }) {
  const userName = user.name || 'User'; 

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header userName={userName} />

      <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* Section 1: Welcome Message and Actions */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {userName}!</h2>
          <p className="text-gray-500 mt-1">From JD to first outreach in under an hour</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-left">
              MANAGE ROLES
              <span className="block text-xs font-normal text-gray-500">upload JD, edit requirements</span>
            </button>
            <Link to="/search" className="px-6 py-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors text-left">
              START SEARCH
              <span className="block text-xs font-normal text-teal-100">find your perfect candidate</span>
            </Link>
          </div>
        </section>

        {/* Section 2: Activity and Recommendations */}
        <section className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-500 mb-4">Continue where you left off</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-900">{lastActivity.roleName}</p>
                <p className="text-sm text-gray-400">Last updated: {lastActivity.lastUpdated}</p>
              </div>
              <a href="#" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <ArrowRight className="text-gray-600" />
              </a>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-500 mb-4">Recommended Profiles</h3>
            <div>
              <p className="font-semibold text-gray-900">{recommendedProfiles.count} profiles recommended for {recommendedProfiles.roleName}</p>
              <a href="#" className="flex items-center gap-2 mt-2 text-sm font-semibold text-teal-600 hover:underline">
                View Pipeline <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* Section 3: KPIs */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpis.map(kpi => (
            <KpiCard key={kpi.id} icon={kpi.icon} value={kpi.value} label={kpi.label} />
          ))}
        </section>
      </main>
    </div>
  );
}