import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Ticket, CreditCard, User, Mail, Phone, X, Download, Calendar, MapPin, Clock, Star, Zap, Gift, Trophy, Shield, CheckCircle, AlertCircle, Scissors, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import AuthModal from './AuthModal';
import axios from 'axios';

interface TicketOption {
  type: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  savings?: number;
}

interface PurchaseData {
  fullName: string;
  email: string;
  phone: string;
  ticketType: string;
  isStudent: boolean;
}

interface TicketReceipt {
  id: string;
  ticketType: string;
  price: number;
  userName: string;
  userEmail: string;
  purchaseDate: string;
  scanned: boolean;
}

const TicketSection = () => {
  const { user, userData } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<TicketOption | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [purchaseData, setPurchaseData] = useState<PurchaseData>({
    fullName: '',
    email: '',
    phone: '',
    ticketType: '',
    isStudent: false
  });
  const [loading, setLoading] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<TicketReceipt | null>(null);
  const [paymentStep, setPaymentStep] = useState(1);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string>('');
  const [yocoCheckoutId, setYocoCheckoutId] = useState<string>('');

  const ticketOptions: TicketOption[] = [
    {
      type: 'Student',
      price: 50,
      description: 'Special student pricing with valid student ID',
      popular: true,
      savings: 20,
      features: [
        'Entry to main event',
        'Access to all entertainment areas',
        'Photo booth access',
        'Dance floor access',
        'Food vendor area access',
        'Student discount applied',
        'Free 80s playlist download'
      ]
    },
    {
      type: 'General',
      price: 70,
      description: 'Full access to the 80s Flashbacks experience',
      features: [
        'Entry to main event',
        'Access to all entertainment areas',
        'Photo booth access',
        'Dance floor access',
        'Food vendor area access',
        'VIP parking spot',
        'Welcome drink included'
      ]
    }
  ];

  // Pre-fill user data when modal opens
  useEffect(() => {
    if (user && userData && showPurchaseModal) {
      setPurchaseData(prev => ({
        ...prev,
        fullName: userData.displayName || prev.fullName,
        email: user.email || prev.email
      }));
    }
  }, [user, userData, showPurchaseModal]);

  const handleTicketSelect = (ticket: TicketOption) => {
    setSelectedTicket(ticket);
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setPurchaseData({
      fullName: userData?.displayName || '',
      email: user.email || '',
      phone: '',
      ticketType: ticket.type,
      isStudent: ticket.type === 'Student'
    });
    setShowPurchaseModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (selectedTicket) {
      setPurchaseData({
        fullName: userData?.displayName || '',
        email: user?.email || '',
        phone: '',
        ticketType: selectedTicket.type,
        isStudent: selectedTicket.type === 'Student'
      });
      setShowPurchaseModal(true);
    }
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (purchaseData.isStudent && purchaseData.ticketType === 'Student') {
      console.log('Student ticket selected - would verify student ID');
    }
    
    setShowPurchaseModal(false);
    setShowPaymentModal(true);
    setPaymentStep(1);
  };

  const generateQRCode = async (ticketId: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(ticketId);
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const logQRCodeGeneration = async (ticketId: string, ticketType: string, userName: string, userEmail: string) => {
    try {
      await addDoc(collection(db, 'qrLogs'), {
        ticketId,
        ticketType,
        userName,
        userEmail,
        qrData: ticketId,
        generatedAt: new Date().toISOString(),
        scanned: false
      });
    } catch (error) {
      console.error('Error logging QR generation:', error);
    }
  };

  const downloadReceiptPDF = async (receipt: TicketReceipt) => {
    try {
      const qrCodeDataUrl = await generateQRCode(receipt.id);
      
      const pdf = new jsPDF();
      
      // Set up elegant styling
      const primaryColor = [255, 20, 147]; // Pink
      const secondaryColor = [138, 43, 226]; // Purple
      const accentColor = [0, 191, 255]; // Cyan
      
      // Header with gradient effect simulation
      pdf.setFillColor(...primaryColor);
      pdf.rect(0, 0, 210, 40, 'F');
      
      pdf.setFillColor(...secondaryColor);
      pdf.rect(0, 30, 210, 10, 'F');
      
      // Brand Logo/Title
      pdf.setFontSize(24);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('THE MAN CARVE', 105, 18, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('80s FLASHBACKS EVENT', 105, 28, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text('Rewind • Relive • Repeat', 105, 35, { align: 'center' });
      
      // Ticket Receipt Header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, 50, 180, 15, 'F');
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OFFICIAL TICKET RECEIPT', 105, 60, { align: 'center' });
      
      // Event Details Section
      pdf.setFillColor(...accentColor);
      pdf.rect(15, 75, 180, 8, 'F');
      
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EVENT INFORMATION', 20, 81);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      
      const eventDetails = [
        ['Event:', 'The Man Carve presents 80s Flashbacks'],
        ['Date:', 'Saturday, August 9, 2025'],
        ['Time:', '9:00 AM - Late'],
        ['Venue:', 'Durban University of Technology'],
        ['Address:', 'Steve Biko Campus, Durban, KwaZulu-Natal']
      ];
      
      let yPos = 95;
      eventDetails.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, 50, yPos);
        yPos += 8;
      });
      
      // Ticket Details Section
      pdf.setFillColor(...primaryColor);
      pdf.rect(15, 140, 180, 8, 'F');
      
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TICKET DETAILS', 20, 146);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      
      const ticketDetails = [
        ['Ticket Type:', `${receipt.ticketType} Admission`],
        ['Price:', `R${receipt.price}.00`],
        ['Customer:', receipt.userName],
        ['Email:', receipt.userEmail],
        ['Purchase Date:', new Date(receipt.purchaseDate).toLocaleDateString('en-ZA')],
        ['Ticket ID:', receipt.id],
        ['Status:', receipt.scanned ? 'USED - Entry Granted' : 'VALID - Ready for Entry']
      ];
      
      yPos = 160;
      ticketDetails.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, 60, yPos);
        yPos += 8;
      });
      
      // QR Code Section
      if (qrCodeDataUrl) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(140, 155, 50, 50, 'F');
        pdf.addImage(qrCodeDataUrl, 'PNG', 145, 160, 40, 40);
        
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Scan for Entry', 165, 208, { align: 'center' });
      }
      
      // Important Information Box
      pdf.setFillColor(255, 248, 220);
      pdf.rect(15, 220, 180, 30, 'F');
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(1);
      pdf.rect(15, 220, 180, 30);
      
      pdf.setFontSize(10);
      pdf.setTextColor(...primaryColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('IMPORTANT INFORMATION', 20, 230);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('• Present this ticket (digital or printed) at the event entrance', 20, 237);
      pdf.text('• Ticket is NON-REFUNDABLE and valid for one entry only', 20, 242);
      pdf.text('• All sales are final - no refunds or exchanges permitted', 20, 247);
      
      // Footer
      pdf.setFillColor(...secondaryColor);
      pdf.rect(0, 260, 210, 40, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'normal');
      pdf.text('For support and inquiries:', 105, 275, { align: 'center' });
      pdf.text('📧 info@themancarve.co.za', 105, 285, { align: 'center' });
      pdf.text('🎉 Get ready to party like it\'s 1985! 🎉', 105, 295, { align: 'center' });
      
      pdf.save(`the-man-carve-80s-flashbacks-ticket-${receipt.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const processYocoPayment = async () => {
    try {
      setPaymentStep(2);
      setPaymentError('');
      setLoading(true);

      const paymentPayload = {
        amount: selectedTicket!.price * 100, // Amount in cents
        currency: 'ZAR',
        metadata: {
          ticketType: purchaseData.ticketType,
          customerName: purchaseData.fullName,
          customerEmail: purchaseData.email,
          customerPhone: purchaseData.phone,
          eventName: 'The Man Carve - 80s Flashbacks',
          eventDate: '2025-08-09',
          userId: user?.uid || 'guest'
        },
        successUrl: `${window.location.origin}?payment=success`,
        cancelUrl: `${window.location.origin}?payment=cancelled`,
        failureUrl: `${window.location.origin}?payment=failed`
      };

      console.log('Processing payment with Yoco:', paymentPayload);
      
      // For demo purposes, simulate the payment process
      // In production, you would call your Yoco API endpoint:
      // const response = await axios.post('/api/yoco-checkout', paymentPayload);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment response
      const mockResponse = {
        id: `checkout_${Date.now()}`,
        status: 'successful',
        amount: paymentPayload.amount,
        currency: paymentPayload.currency
      };
      
      setYocoCheckoutId(mockResponse.id);
      setPaymentStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Proceed with ticket creation after successful payment
      await createTicketAfterPayment(mockResponse.id);

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError('Payment failed. Please try again.');
      setPaymentStep(1);
    } finally {
      setLoading(false);
    }
  };

  const createTicketAfterPayment = async (paymentId: string) => {
    try {
      // Try to find an available ticket first
      const availableTicketsQuery = query(
        collection(db, 'tickets'),
        where('ticketType', '==', purchaseData.ticketType),
        where('status', '==', 'available')
      );
      
      const availableTicketsSnapshot = await getDocs(availableTicketsQuery);
      
      let ticketId: string;
      
      if (!availableTicketsSnapshot.empty) {
        // Use existing available ticket
        const availableTicket = availableTicketsSnapshot.docs[0];
        ticketId = availableTicket.id;
        
        // Update the ticket with customer information
        await updateDoc(doc(db, 'tickets', ticketId), {
          userName: purchaseData.fullName,
          userEmail: purchaseData.email,
          userId: user?.uid,
          purchaseDate: new Date().toISOString(),
          status: 'confirmed',
          phone: purchaseData.phone,
          scanned: false,
          qrCodeGenerated: true,
          qrGeneratedAt: new Date().toISOString(),
          paymentId: paymentId,
          paymentMethod: 'yoco'
        });
      } else {
        // Create new ticket if none available
        const newTicketRef = await addDoc(collection(db, 'tickets'), {
          ticketType: purchaseData.ticketType,
          price: selectedTicket?.price || 0,
          userName: purchaseData.fullName,
          userEmail: purchaseData.email,
          userId: user?.uid,
          purchaseDate: new Date().toISOString(),
          status: 'confirmed',
          scanned: false,
          phone: purchaseData.phone,
          qrCodeGenerated: true,
          qrGeneratedAt: new Date().toISOString(),
          paymentId: paymentId,
          paymentMethod: 'yoco'
        });
        ticketId = newTicketRef.id;
      }

      // Generate QR code for the ticket
      const qrCode = await generateQRCode(ticketId);
      setQrCodeUrl(qrCode);

      // Log QR code generation for admin tracking
      await logQRCodeGeneration(ticketId, purchaseData.ticketType, purchaseData.fullName, purchaseData.email);

      // Create receipt data
      const receipt: TicketReceipt = {
        id: ticketId,
        ticketType: purchaseData.ticketType,
        price: selectedTicket?.price || 0,
        userName: purchaseData.fullName,
        userEmail: purchaseData.email,
        purchaseDate: new Date().toISOString(),
        scanned: false
      };

      setCurrentReceipt(receipt);
      setShowPaymentModal(false);
      setShowReceiptModal(true);

      // Reset forms
      setPurchaseData({
        fullName: '',
        email: '',
        phone: '',
        ticketType: '',
        isStudent: false
      });
      setSelectedTicket(null);
      setPaymentStep(1);

    } catch (error) {
      console.error('Error creating ticket:', error);
      setPaymentError('Failed to create ticket. Please contact support.');
    }
  };

  return (
    <section id="tickets" className="py-20 bg-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
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
            <Ticket className="text-pink-400 animate-bounce" size={32} />
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              80s Flashbacks Tickets
            </h3>
            <Ticket className="text-purple-400 animate-bounce animation-delay-1000" size={32} />
          </div>
          <p className="text-gray-200 text-lg max-w-2xl mx-auto">
            🎉 Secure your spot at the most anticipated 80s event of the year! Limited tickets available!
          </p>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="flex items-center text-yellow-400">
              <Star className="fill-current" size={16} />
              <span className="ml-1 text-sm">4.9/5 Rating</span>
            </div>
            <div className="flex items-center text-green-400">
              <Trophy size={16} />
              <span className="ml-1 text-sm">Award Winning Event</span>
            </div>
          </div>
          
          {/* Non-Refundable Policy Notice */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-left">
                <h4 className="text-red-300 font-semibold mb-2">Important Policy Notice</h4>
                <p className="text-red-200 text-sm leading-relaxed">
                  <strong>All ticket sales are FINAL and NON-REFUNDABLE.</strong> No refunds, exchanges, or cancellations will be processed under any circumstances. Please ensure you can attend before purchasing. By proceeding with your purchase, you acknowledge and agree to this policy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {ticketOptions.map((ticket, index) => (
            <div key={index} className={`relative bg-gray-800 rounded-lg border-2 overflow-hidden hover:border-pink-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
              ticket.popular ? 'border-pink-500 shadow-pink-500/20' : 'border-gray-700'
            }`}>
              {ticket.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1 text-sm font-bold rounded-bl-lg flex items-center">
                  <Star className="mr-1 fill-current" size={14} />
                  POPULAR
                </div>
              )}
              
              {ticket.savings && (
                <div className="absolute top-0 left-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 text-xs font-bold rounded-br-lg flex items-center">
                  <Gift className="mr-1" size={12} />
                  SAVE R{ticket.savings}
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      ticket.type === 'Student' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-pink-500 to-purple-600'
                    }`}>
                      {ticket.type === 'Student' ? <User className="text-white" size={24} /> : <Zap className="text-white" size={24} />}
                    </div>
                    <h3 className="text-2xl font-bold text-white">{ticket.type} Ticket</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                      R{ticket.price}
                    </div>
                    {ticket.type === 'Student' && (
                      <div className="text-sm text-green-400 flex items-center">
                        <User size={12} className="mr-1" />
                        Student ID Required
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-200 mb-6">{ticket.description}</p>

                <ul className="space-y-3 mb-8">
                  {ticket.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-200 group">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mr-3 group-hover:animate-ping"></div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Non-refundable notice on each ticket */}
                <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-3 mb-6">
                  <div className="flex items-center text-red-300 text-sm">
                    <AlertTriangle size={14} className="mr-2 flex-shrink-0" />
                    <span className="font-semibold">NON-REFUNDABLE - All sales final</span>
                  </div>
                </div>

                <button
                  onClick={() => handleTicketSelect(ticket)}
                  className={`w-full py-3 px-6 rounded-lg transition-all font-semibold flex items-center justify-center space-x-2 transform hover:scale-105 ${
                    ticket.popular 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-pink-500/25' 
                      : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-500 hover:to-gray-600'
                  }`}
                >
                  <Ticket size={20} />
                  <span>Select This Ticket</span>
                  {ticket.popular && <Star className="fill-current" size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />

        {/* Purchase Modal */}
        {showPurchaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-pink-500 to-purple-600">
                <div className="flex items-center space-x-2">
                  <User className="text-white" size={24} />
                  <h3 className="text-xl font-bold text-white">Purchase Details</h3>
                </div>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handlePurchaseSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center">
                    <User className="mr-2 text-pink-400" size={16} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={purchaseData.fullName}
                    onChange={(e) => setPurchaseData({ ...purchaseData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center">
                    <Mail className="mr-2 text-purple-400" size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={purchaseData.email}
                    onChange={(e) => setPurchaseData({ ...purchaseData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center">
                    <Phone className="mr-2 text-cyan-400" size={16} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={purchaseData.phone}
                    onChange={(e) => setPurchaseData({ ...purchaseData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                    placeholder="+27 XX XXX XXXX"
                    required
                  />
                </div>

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <Ticket className="mr-2 text-yellow-400" size={16} />
                    Order Summary
                  </h4>
                  <div className="flex justify-between text-gray-200 mb-2">
                    <span>{selectedTicket?.type} Ticket</span>
                    <span>R{selectedTicket?.price}</span>
                  </div>
                  {selectedTicket?.savings && (
                    <div className="flex justify-between text-green-400 text-sm mb-2">
                      <span>You Save</span>
                      <span>-R{selectedTicket.savings}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-600 mt-2 pt-2 flex justify-between text-white font-bold">
                    <span>Total</span>
                    <span>R{selectedTicket?.price}</span>
                  </div>
                </div>

                {/* Non-refundable acknowledgment */}
                <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-red-200 text-sm font-semibold mb-1">Non-Refundable Purchase</p>
                      <p className="text-red-300 text-xs">
                        By proceeding, you acknowledge that this purchase is final and non-refundable.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all font-semibold flex items-center justify-center space-x-2 transform hover:scale-105"
                >
                  <CreditCard size={20} />
                  <span>Continue to Payment</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-green-500 to-blue-600">
                <div className="flex items-center space-x-2">
                  <Shield className="text-white" size={24} />
                  <h3 className="text-xl font-bold text-white">Secure Payment</h3>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Payment Progress */}
              <div className="p-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Payment Progress</span>
                  <span className="text-sm text-green-400">
                    {paymentStep === 1 ? 'Ready to Pay' : paymentStep === 2 ? 'Processing...' : 'Complete!'}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(paymentStep / 3) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-6">
                {paymentError && (
                  <div className="mb-4 p-4 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg flex items-center">
                    <AlertCircle className="text-red-400 mr-2" size={20} />
                    <span className="text-red-200">{paymentError}</span>
                  </div>
                )}

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 mb-6">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <Ticket className="mr-2 text-yellow-400" size={16} />
                    Payment Summary
                  </h4>
                  <div className="space-y-2 text-gray-200 text-sm">
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-semibold">{purchaseData.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-semibold">{purchaseData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ticket Type:</span>
                      <span className="font-semibold">{purchaseData.ticketType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-semibold">R{selectedTicket?.price}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-600 mt-3 pt-3 flex justify-between text-white font-bold">
                    <span>Total Amount:</span>
                    <span>R{selectedTicket?.price}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <Shield className="text-blue-600 mr-2" size={20} />
                    <span className="text-blue-800 font-semibold">Secure Payment with Yoco</span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Your payment is processed securely through Yoco's encrypted payment gateway. All card details are protected with industry-standard encryption.
                  </p>
                </div>

                <button
                  onClick={processYocoPayment}
                  disabled={loading || paymentStep > 1}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center space-x-2 transform hover:scale-105"
                >
                  {paymentStep === 1 ? (
                    <>
                      <Shield size={20} />
                      <span>Pay R{selectedTicket?.price} with Yoco</span>
                    </>
                  ) : paymentStep === 2 ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      <span>Payment Complete!</span>
                    </>
                  )}
                </button>

                <p className="text-gray-400 text-xs text-center mt-4 flex items-center justify-center">
                  <Zap className="mr-1" size={12} />
                  Demo mode - No actual payment will be processed
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && currentReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-green-500 to-green-600">
                <div className="flex items-center space-x-2">
                  <Trophy className="text-white" size={24} />
                  <h3 className="text-xl font-bold text-white">Ticket Receipt</h3>
                </div>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Scissors className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    THE MAN CARVE
                  </h2>
                  <h3 className="text-xl font-bold text-white mb-2">80s FLASHBACKS</h3>
                  <p className="text-gray-200">Rewind, Relive, Repeat</p>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center mt-2">
                    <Star className="mr-1 fill-current" size={14} />
                    Payment Successful!
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-600">
                  <h4 className="text-white font-semibold mb-4 flex items-center">
                    <Calendar className="mr-2 text-pink-400" size={16} />
                    Event Details
                  </h4>
                  <div className="space-y-3 text-gray-200">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-pink-400" />
                      <span>August 9, 2025</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 text-purple-400" />
                      <span>9:00 AM</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-2 text-cyan-400" />
                      <span>Durban University of Technology</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-600">
                  <h4 className="text-white font-semibold mb-4 flex items-center">
                    <Ticket className="mr-2 text-yellow-400" size={16} />
                    Ticket Information
                  </h4>
                  <div className="space-y-2 text-gray-200">
                    <div className="flex justify-between">
                      <span>Ticket Type:</span>
                      <span className="font-semibold">{currentReceipt.ticketType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-semibold">R{currentReceipt.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-semibold">{currentReceipt.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-semibold text-xs">{currentReceipt.userEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ticket ID:</span>
                      <span className="font-semibold text-xs">{currentReceipt.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Purchase Date:</span>
                      <span className="font-semibold">{new Date(currentReceipt.purchaseDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-semibold ${currentReceipt.scanned ? 'text-green-400' : 'text-yellow-400'}`}>
                        {currentReceipt.scanned ? '✅ Scanned' : '⏳ Not Scanned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code Display */}
                <div className="text-center mb-6">
                  <div className="bg-white p-4 rounded-lg inline-block border-2 border-dashed border-gray-400">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                    ) : (
                      <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 text-xs">Generating QR...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-2 flex items-center justify-center">
                    <Zap className="mr-1" size={14} />
                    Present this QR code at the event entrance
                  </p>
                </div>

                <button
                  onClick={() => downloadReceiptPDF(currentReceipt)}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all font-semibold flex items-center justify-center space-x-2 transform hover:scale-105"
                >
                  <Download size={20} />
                  <span>Download PDF Receipt</span>
                </button>

                <p className="text-gray-400 text-xs text-center mt-4 flex items-center justify-center">
                  <Star className="mr-1" size={12} />
                  Your ticket has been confirmed. Check your email for additional details.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TicketSection;