import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { X, Download, Calendar, MapPin, Clock, Ticket, Star, Trophy, Gift } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

interface StudentReceiptsProps {
  onClose: () => void;
}

interface Ticket {
  id: string;
  ticketType: string;
  price: number;
  userName: string;
  userEmail: string;
  purchaseDate: string;
  status: string;
  scanned: boolean;
}

const StudentReceipts: React.FC<StudentReceiptsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserTickets();
  }, [user]);

  const fetchUserTickets = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'tickets'),
        where('userId', '==', user.uid),
        where('status', '==', 'confirmed')
      );
      const querySnapshot = await getDocs(q);
      const userTickets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      
      setTickets(userTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (ticketId: string) => {
    try {
      return await QRCode.toDataURL(ticketId);
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const downloadReceipt = async (ticket: Ticket) => {
    try {
      const qrCodeDataUrl = await generateQRCode(ticket.id);
      
      const pdf = new jsPDF();
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(255, 20, 147);
      pdf.text('80s FLASHBACKS EVENT', 105, 30, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('TICKET RECEIPT', 105, 45, { align: 'center' });
      
      // Event Details
      pdf.setFontSize(12);
      pdf.text('Event: 80s Flashbacks - Rewind, Relive, Repeat', 20, 70);
      pdf.text('Date: August 9, 2025', 20, 85);
      pdf.text('Time: 9:00 AM', 20, 100);
      pdf.text('Venue: Durban University of Technology', 20, 115);
      
      // Ticket Details
      pdf.text(`Ticket Type: ${ticket.ticketType}`, 20, 140);
      pdf.text(`Price: R${ticket.price}`, 20, 155);
      pdf.text(`Ticket ID: ${ticket.id}`, 20, 170);
      pdf.text(`Purchase Date: ${new Date(ticket.purchaseDate).toLocaleDateString()}`, 20, 185);
      pdf.text(`Status: ${ticket.scanned ? 'Scanned' : 'Not Scanned'}`, 20, 200);
      
      // QR Code
      if (qrCodeDataUrl) {
        pdf.addImage(qrCodeDataUrl, 'PNG', 150, 140, 40, 40);
      }
      
      // Footer
      pdf.setFontSize(10);
      pdf.text('Present this ticket at the event entrance', 105, 250, { align: 'center' });
      pdf.text('For support: info@80sflashbacks.co.za', 105, 265, { align: 'center' });
      
      pdf.save(`80s-flashbacks-ticket-${ticket.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Ticket className="text-white" size={32} />
            </div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-white mt-4">Loading your tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-pink-500 to-purple-600">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Ticket className="text-white" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">My Tickets</h2>
            <Trophy className="text-yellow-300" size={24} />
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="text-gray-400" size={48} />
              </div>
              <p className="text-gray-400 text-lg">No tickets found</p>
              <p className="text-gray-500 mt-2">Purchase tickets to see them here</p>
              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
                >
                  Browse Tickets
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-pink-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          ticket.ticketType === 'Student' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}>
                          <Ticket className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white flex items-center">
                            80s Flashbacks Event
                            <Star className="ml-2 text-yellow-400 fill-current" size={20} />
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.ticketType === 'Student' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {ticket.ticketType} Ticket
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-pink-400" />
                          <span>August 9, 2025</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={16} className="text-purple-400" />
                          <span>9:00 AM</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} className="text-cyan-400" />
                          <span>DUT Campus</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Gift size={16} className="text-yellow-400" />
                          <span className="font-semibold">R{ticket.price}</span>
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3 mb-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Ticket ID:</span>
                            <p className="text-white font-mono text-xs">{ticket.id}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Status:</span>
                            <p className={`font-semibold ${ticket.scanned ? 'text-green-400' : 'text-yellow-400'}`}>
                              {ticket.scanned ? '✅ Scanned' : '⏳ Not Scanned'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      <button
                        onClick={() => downloadReceipt(ticket)}
                        className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                      >
                        <Download size={16} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentReceipts;