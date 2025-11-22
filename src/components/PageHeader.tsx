import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRoleDisplayName } from '../utils/pageUtils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBreadcrumb?: boolean;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBreadcrumb = true,
  actions
}) => {
  const { user } = useAuth();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {showBreadcrumb && (
            <nav className="flex mb-4" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <span className="text-sm font-medium text-gray-500">
                    Shakti CRM
                  </span>
                </li>
                {user?.role && (
                  <>
                    <li>
                      <div className="flex items-center">
                        <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                        </svg>
                        <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                          {getRoleDisplayName(user.role)}
                        </span>
                      </div>
                    </li>
                  </>
                )}
              </ol>
            </nav>
          )}

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>

            {actions && (
              <div className="ml-4 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>

          {user && (
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Welcome, {user.name}
              </span>
              <span className="ml-2">
                Role: {getRoleDisplayName(user.role)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;