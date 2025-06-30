import React, { useState } from 'react';
import { Menu, X, User, Ticket, Phone, Star, Zap, Scissors } from 'lucide-react';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import StudentReceipts from './StudentReceipts';
import { useAuth } from '../hooks/useAuth';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReceipts, setShowReceipts] = useState(false);
  const { user, userData } = useAuth();

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const navItems = [
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'contact', label: 'Contact', icon: Phone }
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Scissors className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  The Man Carve
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block flex items-center">
                  <Star className="mr-1 fill-current text-yellow-400" size={10} />
                  80s Flashbacks Event
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="flex items-center space-x-1 text-gray-300 hover:text-pink-400 transition-colors duration-300 group"
                >
                  <item.icon size={16} className="group-hover:animate-pulse" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <UserProfile 
                  onClose={() => {}} 
                  onViewReceipts={() => setShowReceipts(true)}
                />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <User size={16} />
                  <span className="hidden sm:inline">Login / Sign Up</span>
                  <span className="sm:hidden">Login</span>
                  <Zap size={14} />
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-gray-300 hover:text-white transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-700 bg-gray-900/98 backdrop-blur-sm">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center space-x-2 w-full text-left px-3 py-2 text-gray-300 hover:text-pink-400 hover:bg-gray-800 rounded-md transition-colors"
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Modals with higher z-index to ensure they appear above navigation */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      {showReceipts && (
        <StudentReceipts onClose={() => setShowReceipts(false)} />
      )}
    </>
  );
};

export default Navigation;