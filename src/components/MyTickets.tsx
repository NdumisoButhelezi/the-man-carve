import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Ticket, Calendar, MapPin, Clock, Star, Zap, Trophy, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface TicketReceipt {
  id: string;
  ticketType: string;
  price: number;
  userName: string;
  userEmail: string;
  phone: string;
  purchaseDate: string;
  scanned: boolean;
}

interface MyTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyTickets: React.FC<MyTicketsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTickets = async () => {
      if (!user) return;
      setLoading(true);
      // Fetch tickets by userId or userEmail (for legacy/orphaned tickets)
      const q = query(collection(db, 'tickets'), where('userId', '==', user.uid), where('status', '==', 'confirmed'));
      const snapshot = await getDocs(q);
      let userTickets: TicketReceipt[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        userTickets.push({
          id: docSnap.id,
          ticketType: data.ticketType,
          price: data.price,
          userName: data.userName,
          userEmail: data.userEmail,
          phone: data.phone,
          purchaseDate: data.purchaseDate,
          scanned: data.scanned ?? false
        });
      });
      console.log('[DEBUG] Tickets by userId:', user.uid, userTickets);
      // Also fetch tickets assigned by email (for orphaned/legacy tickets)
      if (user.email) {
        const qEmail = query(collection(db, 'tickets'), where('userEmail', '==', user.email), where('status', '==', 'confirmed'));
        const snapshotEmail = await getDocs(qEmail);
        const emailTickets: TicketReceipt[] = [];
        snapshotEmail.forEach(docSnap => {
          const data = docSnap.data();
          emailTickets.push({
            id: docSnap.id,
            ticketType: data.ticketType,
            price: data.price,
            userName: data.userName,
            userEmail: data.userEmail,
            phone: data.phone,
            purchaseDate: data.purchaseDate,
            scanned: data.scanned ?? false
          });
        });
        console.log('[DEBUG] Tickets by userEmail:', user.email, emailTickets);
        // Merge, avoiding duplicates
        const seen = new Set(userTickets.map(t => t.id));
        userTickets = userTickets.concat(emailTickets.filter(t => !seen.has(t.id)));
      }
      console.log('[DEBUG] Final tickets shown:', userTickets);
      setTickets(userTickets);
      setLoading(false);
    };
    fetchTickets();
  }, [user, isOpen]);

  const downloadReceiptPDF = async (receipt: TicketReceipt) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(receipt.id);
      const pdf = new jsPDF();
      pdf.setFontSize(18);
      pdf.text('THE MAN CARVE - 80s FLASHBACKS', 105, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Ticket Type: ${receipt.ticketType}`, 20, 40);
      pdf.text(`Price: R${receipt.price}`, 20, 50);
      pdf.text(`Customer: ${receipt.userName}`, 20, 60);
      pdf.text(`Email: ${receipt.userEmail}`, 20, 70);
      pdf.text(`Phone: ${receipt.phone}`, 20, 80);
      pdf.text(`Purchase Date: ${new Date(receipt.purchaseDate).toLocaleDateString()}`, 20, 90);
      pdf.text(`Ticket ID: ${receipt.id}`, 20, 100);
      pdf.text(`Status: ${receipt.scanned ? 'Scanned' : 'Not Scanned'}`, 20, 110);
      if (qrCodeDataUrl) {
        pdf.addImage(qrCodeDataUrl, 'PNG', 150, 40, 40, 40);
      }
      pdf.save(`the-man-carve-ticket-${receipt.id}.pdf`);
    } catch (error) {
      alert('Error generating PDF');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] min-h-screen p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[95vh] flex flex-col border border-gray-700 shadow-2xl relative overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300 z-10 bg-gray-800 bg-opacity-60 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          aria-label="Close my tickets modal"
        >
          ×
        </button>
        <h2 className="text-3xl font-bold text-center mb-8 text-white flex items-center justify-center gap-2 mt-8">
          <Ticket className="text-pink-400" /> My Tickets
        </h2>
        <div className="px-6 pb-8">
          {loading ? (
            <div className="text-center text-gray-400">Loading your tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center text-gray-400">You have no tickets yet.</div>
          ) : (
            <div className="space-y-6">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="text-yellow-400" size={16} />
                      <span className="font-bold text-white">{ticket.ticketType} Ticket</span>
                    </div>
                    <div className="text-gray-200 text-sm mb-1">Price: R{ticket.price}</div>
                    <div className="text-gray-400 text-xs">Purchased: {new Date(ticket.purchaseDate).toLocaleDateString()}</div>
                    <div className="text-gray-400 text-xs">Status: {ticket.scanned ? '✅ Scanned' : '⏳ Not Scanned'}</div>
                    <div className="text-gray-400 text-xs">Ticket ID: {ticket.id}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => downloadReceiptPDF(ticket)}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-pink-600 hover:to-purple-700"
                    >
                      <Download size={16} /> Download PDF
                    </button>
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

export default MyTickets;
