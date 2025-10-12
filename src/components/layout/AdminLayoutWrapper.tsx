'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  ClipboardList, 
  Settings,
  Menu,
  X,
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Templates', href: '/admin/templates', icon: FileText },
  { name: 'Services', href: '/admin/services', icon: Briefcase },
  { name: 'Intakes', href: '/admin/intakes', icon: ClipboardList },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  
  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <Link href="/admin" className="flex items-center">
            <span className="text-xl font-bold text-gray-900">Smart Forms AI</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => onClose()}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

interface TopBarProps {
  onMenuClick: () => void;
  user?: {
    email: string | null;
    displayName?: string | null;
  };
  userProfile?: {
    displayName?: string;
    role?: string;
  };
  onSignOut: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick, user, userProfile, onSignOut }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
      
      {/* Desktop logo (hidden on mobile since sidebar has it) */}
      <Link href="/admin" className="hidden lg:flex items-center">
        <span className="text-xl font-bold text-gray-900">Smart Forms AI</span>
      </Link>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* User menu */}
      {user && (
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-900 font-medium">
                {userProfile?.displayName || user.email}
              </span>
              {userProfile?.role && (
                <span className="text-xs text-gray-500">{userProfile.role}</span>
              )}
            </div>
          </div>
          
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  user?: {
    email: string | null;
  };
  userProfile?: {
    displayName?: string;
    role?: string;
  };
  onSignOut: () => void;
}

export const AdminLayoutWrapper: React.FC<AdminLayoutWrapperProps> = ({
  children,
  user,
  userProfile,
  onSignOut,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          userProfile={userProfile}
          onSignOut={onSignOut}
        />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
