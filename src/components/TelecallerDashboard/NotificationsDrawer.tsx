import React, { useState } from 'react';
import {
  X,
  Bell,
  FileText,
  Clock,
  DollarSign,
  Calendar,
  Settings,
  CheckCircle
} from 'lucide-react';

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    category: 'Cases',
    title: 'New case assigned',
    description: 'Case #1234 has been assigned to you for follow-up',
    timestamp: '2 minutes ago',
    isRead: false,
    icon: FileText
  },
  {
    id: '2',
    category: 'Follow-ups',
    title: 'Follow-up reminder',
    description: 'Scheduled follow-up with customer Rajesh Kumar in 30 minutes',
    timestamp: '15 minutes ago',
    isRead: false,
    icon: Clock
  },
  {
    id: '3',
    category: 'PTP',
    title: 'PTP confirmed',
    description: 'Promise to pay confirmed for ₹25,000 by customer Priya Sharma',
    timestamp: '1 hour ago',
    isRead: true,
    icon: CheckCircle
  },
  {
    id: '4',
    category: 'Payments',
    title: 'Payment received',
    description: '₹15,000 payment received from customer Amit Singh',
    timestamp: '2 hours ago',
    isRead: true,
    icon: DollarSign
  },
  {
    id: '5',
    category: 'Attendance',
    title: 'Attendance marked',
    description: 'Your attendance has been marked for today',
    timestamp: '3 hours ago',
    isRead: true,
    icon: Calendar
  },
  {
    id: '6',
    category: 'System',
    title: 'System maintenance',
    description: 'Scheduled maintenance completed successfully',
    timestamp: '1 day ago',
    isRead: true,
    icon: Settings
  }
];

const categories = ['All', 'Cases', 'Follow-ups', 'PTP', 'Payments', 'Attendance', 'System'];

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('All');

  const filteredNotifications = activeTab === 'All'
    ? mockNotifications
    : mockNotifications.filter(notification => notification.category === activeTab);

  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  const NotificationItem: React.FC<{ notification: NotificationItem }> = ({ notification }) => {
    const IconComponent = notification.icon;

    return (
      <div className={`p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 ${!notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
        }`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="p-2 bg-gray-100 rounded-lg">
              <IconComponent className="w-5 h-5 text-gray-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''
                  }`}>
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {notification.timestamp}
                </p>
              </div>

              {!notification.isRead && (
                <div className="flex-shrink-0 ml-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-sm sm:max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-600">Latest updates from your CRM</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="border-b border-gray-200 p-3">
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === category
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
              >
                {category}
                {category === 'All' && unreadCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">You're all caught up!</h3>
              <p className="text-sm text-gray-600">No new notifications</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3">
          <div className="flex space-x-3">
            <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Mark All as Read
            </button>
            <button className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
              Clear Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};