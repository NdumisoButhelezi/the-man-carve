import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Ticket, Star, Zap, Trophy, Target, Scissors } from 'lucide-react';

const HeroSection = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const eventDate = new Date('2025-08-09T09:00:00');
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = eventDate.getTime() - now;
      
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const scrollToTickets = () => {
    document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Brand Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
              <Scissors className="text-white" size={32} />
            </div>
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                THE MAN CARVE
              </h1>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <Star className="text-yellow-400 fill-current animate-spin" size={20} />
                <span className="text-xl md:text-2xl font-light text-white tracking-wide">
                  Presents
                </span>
                <Star className="text-yellow-400 fill-current animate-spin animation-delay-1000" size={20} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Star className="text-pink-400 animate-spin" size={32} />
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight">
              80s FLASHBACKS
            </h2>
            <Zap className="text-cyan-400 animate-bounce" size={32} />
          </div>
          
          <p className="text-2xl md:text-4xl font-light text-white mb-6 tracking-wide flex items-center justify-center space-x-2">
            <Trophy className="text-yellow-400" size={32} />
            <span>Rewind, Relive, Repeat</span>
            <Trophy className="text-yellow-400" size={32} />
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-pink-500 transition-all transform hover:scale-105">
            <Calendar className="mx-auto text-pink-400 mb-3 animate-pulse" size={32} />
            <h3 className="text-white font-semibold text-lg mb-2 flex items-center justify-center">
              <Target className="mr-2" size={16} />
              Date
            </h3>
            <p className="text-gray-200">August 9, 2025</p>
          </div>
          
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition-all transform hover:scale-105">
            <Clock className="mx-auto text-purple-400 mb-3 animate-pulse animation-delay-1000" size={32} />
            <h3 className="text-white font-semibold text-lg mb-2 flex items-center justify-center">
              <Zap className="mr-2" size={16} />
              Time
            </h3>
            <p className="text-gray-200">9:00 AM</p>
          </div>
          
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-cyan-500 transition-all transform hover:scale-105">
            <MapPin className="mx-auto text-cyan-400 mb-3 animate-pulse animation-delay-2000" size={32} />
            <h3 className="text-white font-semibold text-lg mb-2 flex items-center justify-center">
              <Star className="mr-2" size={16} />
              Venue
            </h3>
            <p className="text-gray-200">DUT Campus</p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center justify-center space-x-2">
            <Clock className="text-pink-400 animate-spin" size={32} />
            <span>Event Countdown</span>
            <Trophy className="text-yellow-400" size={32} />
          </h2>
          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { label: 'Days', value: timeLeft.days, icon: Calendar, color: 'from-pink-400 to-pink-600' },
              { label: 'Hours', value: timeLeft.hours, icon: Clock, color: 'from-purple-400 to-purple-600' },
              { label: 'Minutes', value: timeLeft.minutes, icon: Zap, color: 'from-cyan-400 to-cyan-600' },
              { label: 'Seconds', value: timeLeft.seconds, icon: Target, color: 'from-yellow-400 to-yellow-600' }
            ].map((item, index) => (
              <div key={index} className="bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-4 border border-gray-700 hover:border-pink-500 transition-all transform hover:scale-105">
                <item.icon className={`mx-auto mb-2 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`} size={24} />
                <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                  {item.value.toString().padStart(2, '0')}
                </div>
                <div className="text-gray-300 text-sm uppercase tracking-wide">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={scrollToTickets}
            className="group relative px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg rounded-lg hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-pink-500/25 flex items-center space-x-2"
          >
            <Ticket className="animate-bounce" size={24} />
            <span>Get Your Tickets</span>
            <Star className="fill-current animate-pulse" size={20} />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity -z-10"></div>
          </button>
          
          <button
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 border-2 border-white text-white font-bold text-lg rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
          >
            <Trophy size={20} />
            <span>Learn More</span>
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-gray-300 text-lg mt-8 max-w-2xl mx-auto leading-relaxed flex items-center justify-center space-x-2">
          <Zap className="text-cyan-400" size={20} />
          <span>Step back in time and experience the magic of the 1980s. Join us for an unforgettable journey through vintage fashion, retro music, and nostalgic vibes.</span>
          <Star className="text-pink-400 fill-current" size={20} />
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;