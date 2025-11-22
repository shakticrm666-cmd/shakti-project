import React, { useState } from 'react';
import {
  LogOut,
  Menu,
  X,
  Users,
  Phone,
  Building2,
  Shield,
  UserCheck,
  Zap,
  Bell
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Employee } from '../types/employee';
import type { CompanyAdmin } from '../types/admin';

// Union type for all possible users
type User = Employee | CompanyAdmin | {
  id: string;
  name: string;
  role: string;
  tenantId?: string;
};

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  menuItems: Array<{
    name: string;
    icon: LucideIcon;
    active?: boolean;
    onClick?: () => void;
  }>;
  title: string;
  roleColor: string;
}

const Layout: React.FC<LayoutProps> = ({
  user,
  onLogout,
  children,
  menuItems,
  title,
  roleColor
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return Shield;
      case 'companyadmin': return Building2;
      case 'teamincharge': return UserCheck;
      case 'telecaller': return Phone;
      default: return Users;
    }
  };

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        <div className="flex items-center justify-center border-b border-gray-300 flex-shrink-0 bg-white h-20">
          <div className="flex items-center px-6 py-3">
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-2xl shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <Zap className="w-7 h-7 lg:w-8 lg:h-8 text-white relative z-10" strokeWidth={2.5} />
              </div>
              <div className="absolute -inset-1 border-2 border-orange-300/30 rounded-2xl animate-pulse"></div>
            </div>
            <div className="flex flex-col ml-4">
              <h2 className="text-xl lg:text-2xl font-bold text-black tracking-wide drop-shadow-sm">Shakti</h2>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-black absolute right-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-5 px-2 flex-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`${item.active
                  ? `${roleColor} text-white shadow-md`
                  : 'text-gray-700 hover:bg-slate-50 hover:text-slate-800'
                  } group flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full mb-2 transition-all duration-200 border border-transparent hover:border-slate-200`}
              >
                <IconComponent className="mr-3 flex-shrink-0 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="flex-shrink-0 w-full p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center mb-3">
            <div className={`${roleColor} rounded-full p-2 mr-3 shadow-md`}>
              <RoleIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-slate-600 font-medium">
                {user.role === 'TeamIncharge' ? 'Team Incharge' :
                  user.role === 'CompanyAdmin' ? 'Company Admin' :
                    user.role === 'SuperAdmin' ? 'Super Admin' :
                      user.role === 'Telecaller' ? 'Telecaller' :
                        user.role}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-all duration-200 border border-slate-200"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 min-w-0">
        {/* Top bar */}
        <header className="bg-white shadow-lg border-b border-gray-300 flex-shrink-0 h-20">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-black hover:text-gray-700 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Tenant/Role Information */}
            <div className="flex items-center space-x-2 lg:space-x-3 flex-1 min-w-0">
              <div className={`${roleColor} rounded-lg p-2 flex-shrink-0`}>
                <RoleIcon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm lg:text-base font-semibold text-black truncate">{title}</h2>
                <p className="text-xs text-gray-700 hidden sm:block">Tenant Dashboard</p>
              </div>
            </div>

            {/* User Welcome Section */}
            <div className="flex items-center flex-shrink-0 ml-4 space-x-3">
              {/* Notification Bell */}
              <button className="relative p-2 text-black transition-colors rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
                {/* Notification Badge */}
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">
                  3
                </span>
              </button>

              <div className="hidden md:flex items-center space-x-3 text-black">
                <div className="text-right">
                  <p className="text-sm font-medium text-black">Welcome back</p>
                  <p className="text-xs text-gray-700">{user.name}</p>
                </div>
                <div className={`${roleColor} rounded-full p-2`}>
                  <RoleIcon className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;