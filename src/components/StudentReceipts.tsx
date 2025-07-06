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
  phone?: string;
}

const StudentReceipts: React.FC<StudentReceiptsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserTickets();
  }, [user]);

  // Helper: Only show tickets with all required details
  const isValidTicket = (ticket: Ticket) => {
    return !!(
      ticket.userName &&
      ticket.userEmail &&
      ticket.ticketType &&
      ticket.price !== undefined &&
      ticket.purchaseDate
    );
  };

  const fetchUserTickets = async () => {
    if (!user) return;
    try {
      // Fetch tickets where userId matches OR userEmail matches (for legacy/orphaned tickets), and status is confirmed
      const q = query(
        collection(db, 'tickets'),
        where('status', '==', 'confirmed'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      let userTickets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      // Also fetch tickets assigned by email (for orphaned/legacy tickets)
      if (user.email) {
        const qEmail = query(
          collection(db, 'tickets'),
          where('status', '==', 'confirmed'),
          where('userEmail', '==', user.email)
        );
        const querySnapshotEmail = await getDocs(qEmail);
        const emailTickets = querySnapshotEmail.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Ticket[];
        // Merge, avoiding duplicates
        const seen = new Set(userTickets.map(t => t.id));
        userTickets = userTickets.concat(emailTickets.filter(t => !seen.has(t.id)));
      }
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

  // Deduplicate tickets: group by event name and ticket type, only show as many as bought
  const dedupedTickets = Object.values(
    tickets.filter(isValidTicket).reduce((acc, ticket) => {
      // Use event name + ticket type as key (assuming one event)
      const key = `${ticket.ticketType}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(ticket);
      return acc;
    }, {} as { [key: string]: Ticket[] })
  ).flat();

  const downloadReceipt = async (ticket: Ticket) => {
    try {
      const qrCodeDataUrl = await generateQRCode(ticket.id);
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      // Header
      pdf.setFillColor('#1e293b'); // dark background
      pdf.rect(0, 0, 595, 120, 'F');
      pdf.setFontSize(24);
      pdf.setTextColor('#fff');
      pdf.text('THE MAN CARVE', 40, 45);
      pdf.setFontSize(18);
      pdf.text('80s FLASHBACKS EVENT', 40, 75);
      pdf.setFontSize(12);
      pdf.setTextColor('#fbbf24');
      pdf.text('Rewind • Relive • Repeat', 40, 95);
      pdf.setTextColor('#fff');
      pdf.setFontSize(16);
      pdf.text('OFFICIAL TICKET RECEIPT', 420, 45);
      // Event Info
      pdf.setFontSize(13);
      pdf.setTextColor('#000');
      pdf.text('EVENT INFORMATION', 40, 140);
      pdf.setFontSize(12);
      pdf.text('Event: The Man Carve presents 80s Flashbacks', 40, 160);
      pdf.text('Date: Saturday, August 9, 2025', 40, 180);
      pdf.text('Time: 9:00 AM - Late', 40, 200);
      pdf.text('Venue: Durban University of Technology', 40, 220);
      pdf.text('Address: Steve Biko Campus, Durban, KwaZulu-Natal', 40, 240);
      // Ticket Details
      pdf.setFontSize(13);
      pdf.setTextColor('#000');
      pdf.text('TICKET DETAILS', 40, 270);
      pdf.setFontSize(12);
      pdf.text(`Ticket Type: ${ticket.ticketType === 'Student' ? 'Student Admission' : 'General Admission'}`, 40, 290);
      pdf.text(`Price: R${ticket.price.toFixed(2)}`, 40, 310);
      pdf.text(`Customer: ${ticket.userName}`, 40, 330);
      pdf.text(`Email: ${ticket.userEmail}`, 40, 350);
      pdf.text(`Phone: ${ticket.phone || '-'}`, 40, 370);
      pdf.text(`Purchase Date: ${new Date(ticket.purchaseDate).toISOString().slice(0, 10)}`, 40, 390);
      pdf.text(`Ticket ID: ${ticket.id}`, 40, 410);
      pdf.setFontSize(13);
      pdf.setTextColor('#16a34a');
      pdf.text('Status: VALID - Ready for Entry', 40, 430);
      // QR code
      if (qrCodeDataUrl) {
        pdf.setDrawColor('#1e293b');
        pdf.rect(400, 270, 140, 140, 'S');
        pdf.addImage(qrCodeDataUrl, 'PNG', 410, 280, 120, 120);
        pdf.setFontSize(10);
        pdf.setTextColor('#000');
        pdf.text('Scan for Entry', 430, 415);
      }
      // Important Info
      pdf.setFontSize(11);
      pdf.setTextColor('#ef4444');
      pdf.text('IMPORTANT INFORMATION', 40, 470);
      pdf.setFontSize(10);
      pdf.setTextColor('#000');
      pdf.text('• Present this ticket (digital or printed) at the event entrance', 40, 490);
      pdf.text('• Ticket is NON-REFUNDABLE and valid for one entry only', 40, 505);
      pdf.text('• All sales are final - no refunds or exchanges permitted', 40, 520);
      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor('#888');
      pdf.text('For support and inquiries: info@80sflashbacks.co.za', 40, 560);
      pdf.save(`80s-flashbacks-ticket-${ticket.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] min-h-screen backdrop-blur-sm">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Ticket className="text-white" size={32} />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-white mt-2 text-lg font-semibold">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] min-h-screen p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[95vh] flex flex-col border border-gray-700 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300 z-10 bg-gray-800 bg-opacity-60 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          aria-label="Close my tickets modal"
        >
          <X size={28} />
        </button>
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-pink-500 to-purple-600 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Ticket className="text-white" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">My Tickets</h2>
            <Trophy className="text-yellow-300" size={24} />
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {tickets.filter(isValidTicket).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="text-gray-400" size={48} />
              </div>
              <p className="text-gray-400 text-lg">No tickets found</p>
              <p className="text-gray-500 mt-2">Purchase tickets to see them here</p>
              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all font-semibold"
                >
                  Browse Tickets
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {dedupedTickets.map((ticket) => (
                <div key={ticket.id} className="bg-gray-800 rounded-xl p-6 border-2 border-gray-700 hover:border-pink-500 transition-colors shadow-lg flex flex-col justify-between h-full">
                  <div>
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
                    <div className="grid grid-cols-1 gap-2 text-gray-300 mb-4">
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
                          <p className="text-white font-mono text-xs break-all">{ticket.id}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <p className={`font-semibold ${ticket.scanned ? 'text-green-400' : 'text-yellow-400'}`}>{ticket.scanned ? '✅ Scanned' : '⏳ Not Scanned'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadReceipt(ticket)}
                    className="mt-2 flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all font-semibold shadow-lg"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>
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