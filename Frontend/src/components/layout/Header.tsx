// src/components/layout/Header.tsx
import { Search, Briefcase, BarChart3, ArrowLeft, LogOut } from 'lucide-react';
import React from 'react';
// MODIFIED: Imported 'Link' and 'useNavigate'
import { Link, useNavigate } from 'react-router-dom';

// Add a new optional prop 'showBackButton'
interface HeaderProps {
  userName: string;
  showBackButton?: boolean;
}

// MODIFIED: This component now uses react-router-dom's Link
const NavLink = ({ children, description, to }: { children: React.ReactNode; description: string; to: string }) => (
  <Link to={to} className="group relative flex items-center gap-2 text-gray-600 hover:text-teal-500 font-medium transition-colors py-2">
    {children}
    <div className="absolute top-full mt-2 w-max p-3 bg-white text-gray-800 border border-gray-200 text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
      {description}
    </div>
  </Link>
);

export function Header({ userName, showBackButton = false }: HeaderProps) {
  const navigate = useNavigate();
  const userInitial = userName ? userName.charAt(0).toUpperCase() : '?';

  // This function calls your backend's logout endpoint
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      window.location.reload();
    }
  };

  return (
    <header className="flex justify-between items-center p-4 border-b bg-white">
      <div className="flex items-center gap-4">
        {/* Conditionally render the back button */}
        {showBackButton && (
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-xl font-bold text-teal-600">AIRA</h1>
        <nav className="hidden md:flex items-center gap-6 ml-4">
          <NavLink to="/search" description="Find the perfect candidate">
            <Search size={18} /> Search
          </NavLink>
          <NavLink to="/roles" description="Access all stored job roles">
            <Briefcase size={18} /> Roles
          </NavLink>
          {/* MODIFIED: Updated this link */}
          <NavLink to="/pipeline" description="Manage candidate pipelines">
            <BarChart3 size={18} /> Pipeline
          </NavLink>
        </nav>
      </div>

      {/* Profile and Logout Section with Hover Effect */}
      <div className="relative group py-2">
        <div className="flex items-center gap-4 cursor-pointer">
          <div className="w-9 h-9 flex items-center justify-center bg-purple-600 text-white rounded-full font-bold text-sm">
            {userInitial}
          </div>
          <span className="hidden sm:block font-medium">{userName}</span>
        </div>
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}