import React from 'react';
import { Navigate } from 'react-router-dom';
import { User, Users, Phone, Zap, Shield, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePageConfig, getRoleBasedTitle } from '../utils/pageUtils';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const [selectedRole, setSelectedRole] = React.useState('CompanyAdmin');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  usePageConfig('login', getRoleBasedTitle(selectedRole));

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const roles = [
    {
      role: 'SuperAdmin',
      title: 'Super Admin',
      icon: <User className="w-8 h-8" />,
      colorClass: 'bg-blue-600',
      hoverClass: 'hover:bg-blue-700'
    },
    {
      role: 'CompanyAdmin',
      title: 'Company Admin',
      icon: <User className="w-8 h-8" />,
      colorClass: 'bg-blue-500',
      hoverClass: 'hover:bg-blue-600'
    },
    {
      role: 'TeamIncharge',
      title: 'Team Incharge',
      icon: <Users className="w-8 h-8" />,
      colorClass: 'bg-green-500',
      hoverClass: 'hover:bg-green-600'
    },
    {
      role: 'Telecaller',
      title: 'Telecaller',
      icon: <Phone className="w-8 h-8" />,
      colorClass: 'bg-orange-500',
      hoverClass: 'hover:bg-orange-600'
    }
  ];

  const currentRole = roles.find(r => r.role === selectedRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password, selectedRole);
    } catch {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 relative overflow-hidden">
      {/* Background Graphics */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 relative z-10">
          {/* Logo and Brand Section */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {/* Logo Background Circle */}
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl mb-4 mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                <Zap className="w-10 h-10 text-white relative z-10" strokeWidth={2.5} />
              </div>
              {/* Decorative rings */}
              <div className="absolute -inset-2 border-2 border-purple-200 rounded-full animate-pulse"></div>
              <div className="absolute -inset-4 border border-purple-100 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
          
          {/* Brand Name with Custom Styling */}
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 mb-2 tracking-tight">
            Shakti
          </h1>
          
          {/* Tagline */}
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-5 h-5 text-purple-600 mr-2" />
            <p className="text-lg font-medium text-gray-700">
              Customer Relationship Management System
            </p>
            <TrendingUp className="w-5 h-5 text-purple-600 ml-2" />
          </div>
        </div>

        <div className="max-w-md mx-auto">
          {(
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6 mb-6 relative z-10">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Select Role</h3>
            <div className="relative bg-gray-100/80 rounded-full p-1 backdrop-blur-sm">
              {/* Sliding Background */}
              <div
                className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out ${currentRole?.colorClass} shadow-lg`}
                style={{
                  left: `${roles.findIndex(r => r.role === selectedRole) * (100 / roles.length)}%`,
                  width: `${100 / roles.length}%`
                }}
              />

              {/* Role Buttons */}
              <div className="relative flex">
                {roles.map((role) => (
                  <button
                    key={role.role}
                    onClick={() => {
                      setSelectedRole(role.role);
                      setError('');
                      setUsername('');
                      setPassword('');
                    }}
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-full transition-all duration-300 relative z-10 ${
                      selectedRole === role.role
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {role.title}
                  </button>
                ))}
              </div>
            </div>
            </div>
          )}

          {/* Login Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-8 relative z-10">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${currentRole?.colorClass} bg-opacity-10 shadow-lg relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full"></div>
                <div className={`${currentRole?.colorClass.replace('bg-', 'text-')}`}>
                  {currentRole?.icon}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentRole?.title} Login</h2>
              <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mx-auto"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedRole === 'SuperAdmin' ? 'Username' : 'Employee ID'}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder={
                    selectedRole === 'SuperAdmin'
                      ? 'Enter your username'
                      : 'Enter your Employee ID (e.g., EMP001)'
                  }
                  required
                />
                {selectedRole !== 'SuperAdmin' && (
                  <p className="mt-2 text-xs text-gray-500">
                    {selectedRole === 'CompanyAdmin'
                      ? 'Use the Employee ID provided by your administrator'
                      : 'Use your assigned Employee ID or mobile number'
                    }
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50/80 backdrop-blur-sm py-2 px-4 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : `${currentRole?.colorClass} ${currentRole?.hoverClass}`
                }`}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 relative z-10">
            Secure access to your loan recovery management system
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;