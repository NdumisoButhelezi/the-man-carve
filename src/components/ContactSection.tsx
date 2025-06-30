import React, { useState } from 'react';
import { MapPin, Phone, Mail, ChevronDown, ChevronUp, User, Star, Trophy, Zap, Scissors } from 'lucide-react';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import StudentReceipts from './StudentReceipts';
import { useAuth } from '../hooks/useAuth';

const ContactSection = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReceipts, setShowReceipts] = useState(false);
  const { user, userData } = useAuth();

  const faqs = [
    {
      question: "What should I wear to the event?",
      answer: "Come dressed in your best 80s-inspired outfit! Think neon colors, bold patterns, leg warmers, oversized blazers, and retro accessories. Prizes will be given for the best dressed!",
      icon: Star
    },
    {
      question: "Is parking available at DUT?",
      answer: "Yes, there is ample parking available on campus. Parking is free for event attendees. We recommend arriving early to secure the best spots.",
      icon: MapPin
    },
    {
      question: "Can I bring my own food and drinks?",
      answer: "Outside food and beverages are not permitted. We'll have various food vendors and refreshment stations available throughout the event.",
      icon: Trophy
    },
    {
      question: "Are tickets refundable?",
      answer: "Tickets are refundable up to 48 hours before the event. Please contact us with your ticket confirmation for refund requests.",
      icon: Zap
    }
  ];

  return (
    <section id="contact" className="py-20 bg-gray-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <Scissors className="text-white" size={24} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              The Man Carve
            </h2>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Mail className="text-pink-400 animate-bounce" size={32} />
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              Get In Touch
            </h3>
            <Phone className="text-purple-400 animate-bounce animation-delay-1000" size={32} />
          </div>
          <p className="text-gray-200 text-lg max-w-2xl mx-auto flex items-center justify-center space-x-2">
            <Star className="text-yellow-400 fill-current" size={20} />
            <span>Questions about the 80s Flashbacks event? Need help with tickets? We're here to help!</span>
            <Trophy className="text-cyan-400" size={20} />
          </p>
        </div>

        {/* Auth/Profile Section */}
        <div className="flex justify-center mb-12">
          {user ? (
            <UserProfile 
              onClose={() => {}} 
              onViewReceipts={() => setShowReceipts(true)}
            />
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <User size={20} />
              <span>Login / Sign Up</span>
              <Zap size={16} />
            </button>
          )}
        </div>

        {/* Contact Info & Map */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Phone className="mr-2 text-pink-400" size={24} />
                Contact Information
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4 bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-pink-500 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold flex items-center">
                      <Star className="mr-1 text-yellow-400 fill-current" size={16} />
                      Location
                    </h4>
                    <p className="text-gray-200">Durban University of Technology</p>
                    <p className="text-gray-200">Steve Biko Campus, Durban</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-cyan-500 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Phone className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold flex items-center">
                      <Trophy className="mr-1 text-cyan-400" size={16} />
                      Vendors Contact
                    </h4>
                    <p className="text-gray-200">Anelisiwe (Sellers): +27 74 497 3571</p>
                    <p className="text-gray-200">Minenhle (Designers): +27 78 717 5947</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-orange-500 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                    <Mail className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold flex items-center">
                      <Zap className="mr-1 text-orange-400" size={16} />
                      Email
                    </h4>
                    <p className="text-gray-200">info@themancarve.co.za</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 hover:border-purple-500 transition-colors">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <MapPin className="mr-2 text-purple-400" size={24} />
              Find Us at DUT
            </h3>
            <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
              <div className="text-center">
                <MapPin className="mx-auto text-gray-400 mb-4 animate-pulse" size={48} />
                <p className="text-gray-200 text-lg font-semibold">Durban University of Technology</p>
                <p className="text-gray-200">Steve Biko Campus</p>
                <p className="text-gray-200 text-sm mt-2 flex items-center justify-center">
                  <Star className="mr-1 text-yellow-400 fill-current" size={14} />
                  Interactive map will be available closer to the event date
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-8 flex items-center justify-center space-x-2">
            <Trophy className="text-yellow-400" size={32} />
            <span>Frequently Asked Questions</span>
            <Star className="text-pink-400 fill-current" size={32} />
          </h3>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 hover:border-pink-500 transition-colors">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-750 transition-colors rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                      <faq.icon className="text-white" size={16} />
                    </div>
                    <h4 className="text-white font-semibold text-lg">{faq.question}</h4>
                  </div>
                  {openFaq === index ? (
                    <ChevronUp className="text-pink-400 animate-bounce" size={24} />
                  ) : (
                    <ChevronDown className="text-pink-400" size={24} />
                  )}
                </button>
                
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-200 leading-relaxed pl-11">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      {showReceipts && (
        <StudentReceipts onClose={() => setShowReceipts(false)} />
      )}
    </section>
  );
};

export default ContactSection;