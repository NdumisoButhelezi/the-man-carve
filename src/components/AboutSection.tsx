import React from 'react';
import { Music, Palette, Users, Star, Scissors } from 'lucide-react';

const AboutSection = () => {
  const features = [
    {
      icon: Music,
      title: "Retro Music",
      description: "Dance to the greatest hits of the 80s with live DJs spinning classic tracks that defined a generation."
    },
    {
      icon: Palette,
      title: "Vintage Fashion",
      description: "Showcase your best 80s look! From neon colors to bold patterns, let your style transport everyone back in time."
    },
    {
      icon: Users,
      title: "Community Vibes",
      description: "Connect with fellow vintage enthusiasts and create memories that will last a lifetime."
    },
    {
      icon: Star,
      title: "Authentic Experience",
      description: "Immerse yourself in carefully curated 80s atmosphere with authentic decorations and activities."
    }
  ];

  return (
    <section id="about" className="py-20 bg-gray-800">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <Scissors className="text-white" size={24} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              About The Man Carve
            </h2>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            80s Flashbacks Event
          </h3>
          <p className="text-gray-200 text-lg max-w-3xl mx-auto leading-relaxed">
            Get ready to travel back to the most iconic decade in history. Our 80s Flashbacks event is more than just a party – it's a complete immersion into the culture, style, and spirit that made the 1980s unforgettable.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-200 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <h3 className="text-3xl font-bold text-white mb-6">
              Why 80s Flashbacks?
            </h3>
            <div className="space-y-4 text-gray-200 leading-relaxed">
              <p>
                The 1980s were a time of bold expression, groundbreaking music, and unforgettable fashion. This event celebrates everything that made the decade special – from the rise of MTV to the birth of hip-hop, from neon fashion to arcade games.
              </p>
              <p>
                Whether you lived through the 80s or just love the aesthetic, this event offers something for everyone. Come dressed in your best vintage outfit, dance to classic hits, and experience the magic of a bygone era.
              </p>
              <p>
                Our carefully curated experience includes authentic 80s decorations, period-appropriate entertainment, and opportunities to connect with fellow enthusiasts who share your passion for this incredible decade.
              </p>
            </div>
            
            <div className="mt-8">
              <h4 className="text-xl font-bold text-white mb-4">What to Expect:</h4>
              <ul className="space-y-2 text-gray-200">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                  <span>Live DJ sets featuring 80s classics</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span>Best dressed competition with prizes</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                  <span>Vintage photo booth with 80s props</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                  <span>Food and beverage vendors</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span>Retro gaming corner</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-lg p-8 text-center">
              <div className="bg-black bg-opacity-20 rounded-lg p-8">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Scissors className="text-white" size={24} />
                  <h4 className="text-2xl font-bold text-white">
                    The Man Carve
                  </h4>
                </div>
                <h5 className="text-xl font-bold text-white mb-4">
                  "Rewind, Relive, Repeat"
                </h5>
                <p className="text-white text-lg leading-relaxed">
                  Join us for an authentic journey back to the decade that changed everything. From the music to the fashion, from the culture to the attitude – experience it all at 80s Flashbacks.
                </p>
                <div className="mt-6">
                  <div className="text-4xl font-bold text-white">August 9, 2025</div>
                  <div className="text-white text-lg">DUT Campus • 9:00 AM</div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-pink-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500 rounded-full opacity-20 animate-pulse animation-delay-2000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;