import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { User, LogOut, Receipt, Settings } from 'lucide-react';
import StudentReceipts from './StudentReceipts'; // Import the StudentReceipts component

interface UserProfileProps {
  onClose: () => void;
  onViewReceipts?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose, onViewReceipts }) => {
  const { userData } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTickets, setShowTickets] = useState(false); // Manage ticket visibility

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!userData) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
      >
        <User size={20} />
        <span>{userData.displayName || userData.email}</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-50">
          <div className="p-4 border-b border-gray-700">
            <p className="text-white font-medium">{userData.displayName || 'User'}</p>
            <p className="text-gray-400 text-sm">{userData.email}</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              userData.role === 'admin' ? 'bg-red-500 text-white' :
              userData.role === 'staff' ? 'bg-blue-500 text-white' :
              'bg-green-500 text-white'
            }`}>
              {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
            </span>
          </div>

          <div className="p-2">
            {userData.role === 'student' && (
              <button
                onClick={() => setShowTickets(!showTickets)}
                className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              >
                <Receipt size={16} />
                <span>My Tickets</span>
              </button>
            )}
            {showTickets && userData.role === 'student' && (
              <div className="mt-2 bg-gray-800 rounded-lg p-2 max-h-60 overflow-y-auto border border-gray-700">
                <StudentReceipts onClose={() => setShowTickets(false)} />
              </div>
            )}
            <button
              onClick={() => setShowDropdown(false)}
              className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-md transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;