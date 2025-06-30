import React from 'react';
import { Phone, Mail, Store, Palette, MessageCircle, Scissors, Star } from 'lucide-react';

const VendorSection = () => {
  const vendors = [
    {
      name: "Anelisiwe",
      role: "Sellers Coordinator",
      phone: "+27 74 497 3571",
      description: "Connect with Anelisiwe for all selling opportunities at the event. Whether you have vintage items, handmade crafts, or unique products that fit the 80s theme.",
      icon: Store,
      color: "from-pink-500 to-purple-600"
    },
    {
      name: "Minenhle",
      role: "Fashion Designers Coordinator",
      phone: "+27 78 717 5947",
      description: "Reach out to Minenhle if you're a fashion designer looking to showcase your 80s-inspired creations or vintage fashion pieces.",
      icon: Palette,
      color: "from-purple-500 to-cyan-600"
    }
  ];

  const handleWhatsAppContact = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hi ${name}, I'm interested in participating as a vendor at The Man Carve's 80s Flashbacks event. Could you please provide more information?`);
    window.open(`https://wa.me/${phone.replace(/\s+/g, '')}?text=${message}`, '_blank');
  };

  return (
    <section id="vendors" className="py-20 bg-gray-800">
      <div className="max-w-6xl mx-auto px-4">
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
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Become a Vendor
          </h3>
          <p className="text-gray-200 text-lg max-w-3xl mx-auto leading-relaxed">
            Join us as a vendor and be part of the 80s Flashbacks experience! We're looking for sellers and fashion designers who share our passion for the iconic 1980s era.
          </p>
        </div>

        {/* Vendor Coordinators */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {vendors.map((vendor, index) => (
            <div key={index} className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden hover:border-pink-500 transition-colors">
              <div className="p-8">
                <div className={`w-16 h-16 bg-gradient-to-r ${vendor.color} rounded-full flex items-center justify-center mb-6`}>
                  <vendor.icon className="text-white" size={32} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">{vendor.name}</h3>
                <p className="text-pink-400 font-semibold mb-4">{vendor.role}</p>
                
                <p className="text-gray-200 leading-relaxed mb-6">
                  {vendor.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-200">
                    <Phone className="text-green-400 mr-3" size={20} />
                    <span>{vendor.phone}</span>
                  </div>
                  
                  <button
                    onClick={() => handleWhatsAppContact(vendor.phone, vendor.name)}
                    className={`w-full bg-gradient-to-r ${vendor.color} text-white py-3 px-6 rounded-lg hover:opacity-90 transition-all font-semibold flex items-center justify-center space-x-2`}
                  >
                    <MessageCircle size={20} />
                    <span>Contact via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vendor Information */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center space-x-2">
            <Star className="text-yellow-400 fill-current" size={24} />
            <span>Vendor Opportunities</span>
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-bold text-pink-400 mb-4">For Sellers</h4>
              <ul className="space-y-3 text-gray-200">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3 mt-2"></div>
                  <span>Vintage clothing and accessories</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3 mt-2"></div>
                  <span>Retro collectibles and memorabilia</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3 mt-2"></div>
                  <span>Handmade 80s-inspired crafts</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3 mt-2"></div>
                  <span>Food and beverages</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3 mt-2"></div>
                  <span>Music and entertainment items</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xl font-bold text-purple-400 mb-4">For Fashion Designers</h4>
              <ul className="space-y-3 text-gray-200">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></div>
                  <span>80s-inspired fashion collections</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></div>
                  <span>Neon and bold pattern designs</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></div>
                  <span>Retro accessories and jewelry</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></div>
                  <span>Custom 80s costume designs</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></div>
                  <span>Fashion show participation</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-600">
            <h4 className="text-lg font-bold text-white mb-3">What We Provide</h4>
            <div className="grid md:grid-cols-3 gap-4 text-gray-200">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                <span>Vendor space allocation</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                <span>Event promotion support</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                <span>Setup assistance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-200 text-lg mb-6">
            Ready to be part of The Man Carve's 80s Flashbacks experience?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleWhatsAppContact("+27 74 497 3571", "Anelisiwe")}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-8 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all font-semibold"
            >
              Contact Sellers Coordinator
            </button>
            <button
              onClick={() => handleWhatsAppContact("+27 78 717 5947", "Minenhle")}
              className="bg-gradient-to-r from-purple-500 to-cyan-600 text-white py-3 px-8 rounded-lg hover:from-purple-600 hover:to-cyan-700 transition-all font-semibold"
            >
              Contact Fashion Coordinator
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VendorSection;