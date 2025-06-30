import React from 'react';
import { useAuth } from './hooks/useAuth';
import AdminDashboard from './components/AdminDashboard';
import StaffDashboard from './components/StaffDashboard';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import TicketSection from './components/TicketSection';
import VendorSection from './components/VendorSection';
import ContactSection from './components/ContactSection';

function App() {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Show admin dashboard for admin users
  if (userData?.role === 'admin') {
    return <AdminDashboard />;
  }

  // Show staff dashboard for staff users
  if (userData?.role === 'staff') {
    return <StaffDashboard />;
  }

  // Show main event website for students and non-authenticated users
  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <div className="pt-16"> {/* Add padding to account for fixed navigation */}
        <HeroSection />
        <AboutSection />
        <TicketSection />
        <VendorSection />
        <ContactSection />
      </div>
    </div>
  );
}

export default App;