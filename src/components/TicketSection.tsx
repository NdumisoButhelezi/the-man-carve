import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Ticket } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import AuthModal from './AuthModal';
import axios from 'axios';
import QrScanner from 'react-qr-scanner';

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
  phone: string;
  purchaseDate: string;
  scanned: boolean;
}

const TicketSection = () => {
  // ...existing state...
  // Real-time ticket stats
  const [ticketStats, setTicketStats] = useState<{ [type: string]: { cap: number; sold: number; available: number } }>({});
  const [showAssigningTicket, setShowAssigningTicket] = useState(false); // Used in payment/assignment flow
  const { user, userData } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<TicketOption | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false); // Used in payment flow
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
  const [showAssignErrorModal, setShowAssignErrorModal] = useState(false);
  const [yocoCheckoutId, setYocoCheckoutId] = useState<string>('');

  // Add state for ticket availability
  const [ticketAvailability, setTicketAvailability] = useState<{ [type: string]: { cap: number; sold: number; available: boolean } }>({});

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

  // Save purchaseData and selectedTicket to localStorage before redirecting to Yoco
  const persistPurchaseData = () => {
    localStorage.setItem('purchaseData', JSON.stringify(purchaseData));
    localStorage.setItem('selectedTicket', JSON.stringify(selectedTicket));
    console.log('[DEBUG] Saved to localStorage:', {
      purchaseData,
      selectedTicket
    });
  };

  // Restore purchaseData and selectedTicket from localStorage if missing
  const restorePurchaseData = () => {
    let restored = false;
    if (!purchaseData.fullName || !purchaseData.email || !purchaseData.phone) {
      const stored = localStorage.getItem('purchaseData');
      if (stored) {
        setPurchaseData(JSON.parse(stored));
        restored = true;
      }
    }
    if (!selectedTicket) {
      const stored = localStorage.getItem('selectedTicket');
      if (stored) {
        setSelectedTicket(JSON.parse(stored));
        restored = true;
      }
    }
    return restored;
  };

  // Clear persisted data after ticket creation
  const clearPersistedPurchaseData = () => {
    localStorage.removeItem('purchaseData');
    localStorage.removeItem('selectedTicket');
  };

// Robust polling logic after payment to ensure ticket always appears
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    setShowReceiptModal(true);
    setCurrentReceipt(null);
    setShowAssigningTicket(true);
    setPaymentStep(3);
    restorePurchaseData();

    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 30;
    const pollInterval = 1000;

    const pollForTicket = async (uid: string, ticketType: string) => {
      const userTicketsQuery = query(
        collection(db, 'tickets'),
        where('ticketType', '==', ticketType),
        where('userId', '==', uid),
        where('status', '==', 'confirmed')
      );
      const userTicketsSnap = await getDocs(userTicketsQuery);
      if (!userTicketsSnap.empty) {
        const docSnap = userTicketsSnap.docs[0];
        if (isMounted) {
          setCurrentReceipt({
            id: docSnap.id,
            ...(docSnap.data() as any)
          });
          setShowAssignErrorModal(false);
          setShowAssigningTicket(false);
          fetchAvailability(); // <-- update stats after assignment
        }
        return true;
      }
      return false;
    };

    const startPolling = async () => {
      let found = false;
      let pd = JSON.parse(localStorage.getItem('purchaseData') || '{}');
      let st = JSON.parse(localStorage.getItem('selectedTicket') || '{}');
      const ticketType = pd.ticketType || st.type;
      let uid = user?.uid;

      let userPolls = 0;
      while (!uid && userPolls < 10) {
        await new Promise(res => setTimeout(res, 300));
        uid = user?.uid;
        userPolls++;
      }

      // Always simulate ticket assignment after payment (no webhook in prod)
      const availableTicketsQuery = query(
        collection(db, 'tickets'),
        where('ticketType', '==', ticketType),
        where('status', '==', 'available')
      );
      const availableTicketsSnapshot = await getDocs(availableTicketsQuery);
      if (!availableTicketsSnapshot.empty && uid) {
        const availableTicket = availableTicketsSnapshot.docs[0];
        await updateDoc(doc(db, 'tickets', availableTicket.id), {
          status: 'confirmed',
          userId: uid,
          userName: pd.fullName || '',
          userEmail: pd.email || '',
          phone: pd.phone || '',
          purchaseDate: new Date().toISOString()
        });
      }

      while (pollCount < maxPolls && !found && isMounted) {
        if (uid && ticketType) {
          found = await pollForTicket(uid, ticketType);
        } else {
          break;
        }
        if (found) {
          // Ensure ticket stats are updated immediately after finding ticket
          fetchAvailability();
          break;
        }
        pollCount++;
        await new Promise(res => setTimeout(res, pollInterval));
      }
      if (!found && isMounted) {
        setLoading(true);
        const fallbackTicket = {
          id: 'pending',
          ticketType: ticketType || '',
          price: st.price || 0,
          userName: pd.fullName || '',
          userEmail: pd.email || '',
          phone: pd.phone || '',
          purchaseDate: new Date().toISOString(),
          scanned: false
        };
        setTimeout(() => {
          setCurrentReceipt(fallbackTicket);
          setShowAssigningTicket(false);
          setLoading(false);
          fetchAvailability(); // <-- update stats after fallback
          setTimeout(() => {
            window.location.href = '/';
          }, 4000);
        }, 1000);
        (async () => {
          try {
            const availableTicketsQuery = query(
              collection(db, 'tickets'),
              where('ticketType', '==', ticketType),
              where('status', '==', 'available'),
              where('ticketType', '!=', 'Unknown'),
              where('price', '>', 0)
            );
            const availableTicketsSnapshot = await getDocs(availableTicketsQuery);
            if (!availableTicketsSnapshot.empty) {
              const availableTicket = availableTicketsSnapshot.docs[0];
              const ticketId = availableTicket.id;
              await updateDoc(doc(db, 'tickets', ticketId), {
                ticketType,
                price: st.price || 0,
                userName: pd.fullName || '',
                userEmail: pd.email || '',
                userId: uid,
                purchaseDate: new Date().toISOString(),
                status: 'confirmed',
                phone: pd.phone || '',
                scanned: false,
                qrCodeGenerated: true,
                qrGeneratedAt: new Date().toISOString(),
                paymentId: '',
                paymentMethod: 'yoco'
              });
              const ticketDocSnap = await getDocs(query(collection(db, 'tickets'), where('__name__', '==', ticketId)));
              let ticketData: Partial<TicketReceipt> = {};
              ticketDocSnap.forEach(docSnap => {
                ticketData = docSnap.data() as Partial<TicketReceipt>;
              });
              if (ticketData) {
                setCurrentReceipt({
                  id: ticketId,
                  ticketType: ticketData.ticketType || '',
                  price: ticketData.price ?? 0,
                  userName: ticketData.userName || '',
                  userEmail: ticketData.userEmail || '',
                  phone: ticketData.phone || '',
                  purchaseDate: ticketData.purchaseDate || '',
                  scanned: ticketData.scanned ?? false
                });
                fetchAvailability(); // <-- update stats after assignment
              }
            }
          } catch (err) {
            console.error('Error updating Firestore with fallback ticket:', err);
          }
        })();
      } else if (found && isMounted) {
        // Ensure ticket stats are updated after polling success
        fetchAvailability();
        setTimeout(() => {
          window.location.href = '/';
        }, 4000);
      }
    };

    startPolling();
    return () => {
      isMounted = false;
    };
  } else if (params.get('payment') === 'failed' || params.get('payment') === 'cancelled') {
    setPaymentError('Payment was not successful.');
    setPaymentStep(1);
    setShowPaymentModal(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user]);

  // Removed unused handleTicketSelect function

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (selectedTicket) {
      setPurchaseData({
        fullName: userData?.displayName || '',
        email: user?.email || '',
        phone: userData?.phone || '', // Try to get phone from userData if available
        ticketType: selectedTicket.type,
        isStudent: selectedTicket.type === 'Student'
      });
      setShowPurchaseModal(true);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    setLoading(true);
    try {
      // Check real-time ticket availability before showing payment modal
      const availableTicketsQuery = query(
        collection(db, 'tickets'),
        where('ticketType', '==', purchaseData.ticketType),
        where('status', '==', 'available')
      );
      const availableTicketsSnapshot = await getDocs(availableTicketsQuery);
      if (availableTicketsSnapshot.empty) {
        setPaymentError('Sorry, this ticket type is sold out.');
        setLoading(false);
        setShowPurchaseModal(false);
        setShowPaymentModal(false);
        return;
      }
      // If available, proceed as before
      if (purchaseData.isStudent && purchaseData.ticketType === 'Student') {
        console.log('Student ticket selected - would verify student ID');
      }
      setShowPurchaseModal(false);
      // Go straight to payment after user fills in details
      await processYocoPayment();
      setPaymentStep(1);
      setLoading(false);
    } catch (error) {
      setPaymentError('Error checking ticket availability. Please try again.');
      setLoading(false);
    }
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

      // Colors
      const pink: [number, number, number] = [255, 20, 147];
      const purple: [number, number, number] = [138, 43, 226];
      const cyan: [number, number, number] = [0, 191, 255];
      const gray: [number, number, number] = [245, 245, 245];

      // Header: Event Logo/Title
      pdf.setFillColor(...pink);
      pdf.rect(0, 0, 210, 36, 'F');
      pdf.setFontSize(26);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('THE MAN CARVE', 105, 16, { align: 'center' });
      pdf.setFontSize(15);
      pdf.setFont('helvetica', 'normal');
      pdf.text('80s FLASHBACKS EVENT', 105, 27, { align: 'center' });

      // Main Ticket Card
      pdf.setFillColor(...gray);
      pdf.roundedRect(10, 42, 190, 180, 8, 8, 'F');
      pdf.setDrawColor(...pink);
      pdf.setLineWidth(1.2);
      pdf.roundedRect(10, 42, 190, 180, 8, 8);

      // Event Info Section
      pdf.setFontSize(12);
      pdf.setTextColor(...purple);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Event:', 20, 56);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text('The Man Carve presents 80s Flashbacks', 45, 56);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...purple);
      pdf.text('Date:', 20, 66);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Saturday, August 9, 2025', 45, 66);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...purple);
      pdf.text('Time:', 20, 76);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text('9:00 AM - Late', 45, 76);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...purple);
      pdf.text('Venue:', 20, 86);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Durban University of Technology', 45, 86);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...purple);
      pdf.text('Address:', 20, 96);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Steve Biko Campus, Durban, KZN', 45, 96);

      // Ticket Info Section
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.setTextColor(...pink);
      pdf.text('TICKET', 105, 112, { align: 'center' });
      pdf.setDrawColor(...purple);
      pdf.line(60, 115, 150, 115);

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Type:', 20, 126);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${receipt.ticketType} Admission`, 45, 126);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Name:', 20, 134);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.userName, 45, 134);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Email:', 20, 142);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.userEmail, 45, 142);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Phone:', 20, 150);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.phone, 45, 150);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Price:', 20, 158);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`R${receipt.price}.00`, 45, 158);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ticket ID:', 20, 166);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.id, 45, 166);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Status:', 20, 174);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(receipt.scanned ? 255 : 34, receipt.scanned ? 0 : 197, receipt.scanned ? 0 : 94);
      pdf.text(receipt.scanned ? 'USED - Entry Granted' : 'VALID - Ready for Entry', 45, 174);

      // QR Code Section
      if (qrCodeDataUrl) {
        pdf.setFillColor(...cyan);
        pdf.roundedRect(140, 120, 55, 55, 6, 6, 'F');
        pdf.addImage(qrCodeDataUrl, 'PNG', 145, 125, 45, 45);
        pdf.setFontSize(10);
        pdf.setTextColor(...purple);
        pdf.text('Scan for Entry', 167, 177, { align: 'center' });
      }

      // Info/Warning Box
      pdf.setFillColor(255, 248, 220);
      pdf.roundedRect(15, 195, 180, 22, 4, 4, 'F');
      pdf.setDrawColor(...pink);
      pdf.setLineWidth(0.7);
      pdf.roundedRect(15, 195, 180, 22, 4, 4);
      pdf.setFontSize(10);
      pdf.setTextColor(...pink);
      pdf.setFont('helvetica', 'bold');
      pdf.text('IMPORTANT:', 20, 204);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.text('• Present this ticket (digital or printed) at the event entrance', 20, 210);
      pdf.text('• Ticket is NOT TRANSFERABLE and valid for one entry only', 20, 215);

      // Footer
      pdf.setFillColor(...purple);
      pdf.rect(0, 225, 210, 25, 'F');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Thank you for your purchase!', 105, 235, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('For support: info@themancarve.co.za', 105, 243, { align: 'center' });
      pdf.text('Get ready to party like it\'s 1985! 🎉', 105, 250, { align: 'center' });

      pdf.save(`the-man-carve-80s-flashbacks-ticket-${receipt.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const processYocoPayment = async () => {
    // Debug: log current purchaseData and selectedTicket before proceeding
    console.log('[DEBUG] processYocoPayment - purchaseData:', purchaseData);
    console.log('[DEBUG] processYocoPayment - selectedTicket:', selectedTicket);
    // Check for required fields
    if (!purchaseData.fullName || !purchaseData.email || !purchaseData.phone || !purchaseData.ticketType || !selectedTicket) {
      setPaymentError('Please fill in all required fields before proceeding to payment.');
      console.warn('[WARN] Missing required fields:', { purchaseData, selectedTicket });
      return;
    }
    // Before payment, check if ticket is sold out (fetch latest data)
    setPaymentError('');
    setLoading(true);
    try {
      // Re-fetch ticket cap and confirmed count for selected type
      const allTicketsQuery = query(
        collection(db, 'tickets'),
        where('ticketType', '==', purchaseData.ticketType)
      );
      const allTicketsSnapshot = await getDocs(allTicketsQuery);
      const cap = allTicketsSnapshot.size;
      const confirmedTicketsQuery = query(
        collection(db, 'tickets'),
        where('ticketType', '==', purchaseData.ticketType),
        where('status', '==', 'confirmed')
      );
      const confirmedTicketsSnapshot = await getDocs(confirmedTicketsQuery);
      const confirmedCount = confirmedTicketsSnapshot.size;
      if (confirmedCount >= cap) {
        setPaymentError('Sorry, this ticket type is sold out.');
        setLoading(false);
        setPaymentStep(1);
        // Optionally, refresh ticket availability state for UI
        setTicketAvailability(prev => ({
          ...prev,
          [purchaseData.ticketType]: {
            cap,
            sold: confirmedCount,
            available: confirmedCount < cap && cap > 0
          }
        }));
        return;
      }
      try {
        setPaymentStep(2);
        setPaymentError('');
        persistPurchaseData(); // Save before redirect

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

        // Call backend Yoco proxy
        // Use correct endpoint for local dev or production
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        let yocoEndpoint = `${API_BASE_URL.replace(/\/$/, '')}/yoco-checkout`;
        const response = await axios.post(
          yocoEndpoint,
          paymentPayload
        );
        console.log('Yoco response:', response.data);

        // --- NEW: Read from Yoco response and update ticket stats immediately if payment is successful ---
        if (response.data && response.data.status === 'created' && response.data.redirectUrl) {
          // Optionally, you can optimistically update ticket stats here
          fetchAvailability(); // Update ticket stats immediately after Yoco checkout is created
        }

        // Yoco returns redirectUrl, not checkout_url
        const redirectUrl = response.data.redirectUrl || response.data.checkout_url;
        if (redirectUrl) {
          setYocoCheckoutId(response.data.id);
          window.location.href = redirectUrl;
        } else if (response.data.error) {
          setPaymentError('Payment error: ' + (typeof response.data.error === 'string' ? response.data.error : JSON.stringify(response.data.error)));
          setPaymentStep(1);
        } else {
          setPaymentError('Unexpected payment response. Please try again.');
          setPaymentStep(1);
        }
      } catch (error) {
        console.error('Payment error:', error);
        setPaymentError('Payment failed. Please try again.');
        setPaymentStep(1);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking ticket availability:', error);
      setPaymentError('Error verifying ticket availability. Please try again.');
      setLoading(false);
    }
  };

  // Assign an available ticket after payment (do not create new tickets)
  const createTicketAfterPayment = async (paymentId: string) => {
    try {
      // Always get latest values, preferring localStorage if state is empty
      let pd = purchaseData;
      let st = selectedTicket;
      if (!pd.fullName || !pd.email || !pd.phone || !pd.ticketType) {
        const storedPD = localStorage.getItem('purchaseData');
        if (storedPD) pd = JSON.parse(storedPD);
      }
      if (!st || !st.type) {
        const storedST = localStorage.getItem('selectedTicket');
        if (storedST) st = JSON.parse(storedST);
      }
      const userName = pd.fullName || userData?.displayName || user?.displayName || 'Unknown';
      const userEmail = pd.email || userData?.email || user?.email || 'Unknown';
      const userPhone = pd.phone || userData?.phone || 'Unknown';
      const ticketType = pd.ticketType || st?.type || 'Unknown';
      const ticketPrice = st?.price ?? 0;

      // Only assign an available ticket, do not create new tickets
      const availableTicketsQuery = query(
        collection(db, 'tickets'),
        where('ticketType', '==', ticketType),
        where('status', '==', 'available'),
        where('ticketType', '!=', 'Unknown'),
        where('price', '>', 0)
      );
      const availableTicketsSnapshot = await getDocs(availableTicketsQuery);
      if (availableTicketsSnapshot.empty) {
        setLoading(false);
        setShowPaymentModal(false);
        setShowAssigningTicket(false);
        setPaymentError('Sorry, this ticket type is sold out or unavailable.');
        setShowAssignErrorModal(true);
        return;
      }
      // Assign the first available ticket
      const availableTicket = availableTicketsSnapshot.docs[0];
      const ticketId = availableTicket.id;
      if (!user || !user.uid) {
        setPaymentError('User not authenticated. Please log in again.');
        setLoading(false);
        setShowAssigningTicket(false);
        setShowAssignErrorModal(true);
        return;
      }
      await updateDoc(doc(db, 'tickets', ticketId), {
        ticketType,
        price: ticketPrice,
        userName,
        userEmail,
        userId: user.uid,
        purchaseDate: new Date().toISOString(),
        status: 'confirmed',
        phone: userPhone,
        scanned: false,
        qrCodeGenerated: true,
        qrGeneratedAt: new Date().toISOString(),
        paymentId: paymentId,
        paymentMethod: 'yoco'
      });

      // Generate QR code and show receipt
      const qrCode = await generateQRCode(ticketId);
      setQrCodeUrl(qrCode);
      await logQRCodeGeneration(ticketId, ticketType, userName, userEmail);
      const ticketDocSnap = await getDocs(query(collection(db, 'tickets'), where('__name__', '==', ticketId)));
      let ticketData: Partial<TicketReceipt> | undefined;
      ticketDocSnap.forEach(docSnap => {
        ticketData = docSnap.data() as Partial<TicketReceipt>;
      });
      const receipt: TicketReceipt = {
        id: ticketId,
        ticketType: ticketData?.ticketType || ticketType,
        price: ticketData?.price ?? ticketPrice,
        userName: ticketData?.userName || userName,
        userEmail: ticketData?.userEmail || userEmail,
        phone: ticketData?.phone || userPhone,
        purchaseDate: ticketData?.purchaseDate || new Date().toISOString(),
        scanned: ticketData?.scanned ?? false
      };
      setCurrentReceipt(receipt);
      setShowPaymentModal(false);
      setShowAssigningTicket(false);
      setShowReceiptModal(true);

      // Automatically download the PDF receipt when the modal opens
      setTimeout(() => {
        downloadReceiptPDF(receipt);
      }, 500);

      // Refresh ticket availability so UI updates
      fetchAvailability();

      setPurchaseData({
        fullName: '',
        email: '',
        phone: '',
        ticketType: '',
        isStudent: false
      });
      setSelectedTicket(null);
      setPaymentStep(1);
      clearPersistedPurchaseData();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      setPaymentError('Failed to assign ticket. Please contact support.');
      setShowAssigningTicket(false);
      setShowAssignErrorModal(true);
    }
  };

  const handleScan = (data: string | null) => {
    if (data) {
      console.log('QR Data:', data);
    }
  };

  const handleError = (err: any) => {
    console.error(err);
  };

  // Fetch ticket availability for each type
  const fetchAvailability = async () => {
    const availability: { [type: string]: { cap: number; sold: number; available: boolean } } = {};
    for (const ticket of ticketOptions) {
      // Get total tickets (cap) for this type
      const allTicketsQuery = query(
        collection(db, 'tickets'),
        where('ticketType', '==', ticket.type)
      );
      const allTicketsSnapshot = await getDocs(allTicketsQuery);
      const cap = allTicketsSnapshot.size;
      // Get confirmed tickets (sold)
      const confirmedTicketsQuery = query(
        collection(db, 'tickets'),
        where('ticketType', '==', ticket.type),
        where('status', '==', 'confirmed')
      );
      const confirmedTicketsSnapshot = await getDocs(confirmedTicketsQuery);
      const sold = confirmedTicketsSnapshot.size;
      availability[ticket.type] = {
        cap,
        sold,
        available: sold < cap && cap > 0
      };
    }
    setTicketAvailability(availability);
  };


  // Real-time Firestore polling for ticket stats (cap, sold, available)
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    ticketOptions.forEach(option => {
      // Listen for all tickets of this type
      const qAll = query(collection(db, 'tickets'), where('ticketType', '==', option.type));
      const unsubAll = onSnapshot(qAll, (allSnap) => {
        const cap = allSnap.size;
        // Listen for confirmed tickets of this type
        const qSold = query(collection(db, 'tickets'), where('ticketType', '==', option.type), where('status', '==', 'confirmed'));
        const unsubSold = onSnapshot(qSold, (soldSnap) => {
          const sold = soldSnap.size;
          setTicketStats(prev => ({
            ...prev,
            [option.type]: {
              cap,
              sold,
              available: Math.max(cap - sold, 0)
            }
          }));
        });
        unsubscribes.push(unsubSold);
      });
      unsubscribes.push(unsubAll);
    });
    return () => { unsubscribes.forEach(unsub => unsub()); };
  }, []);


  // After payment, robustly poll for ticket assignment and always show receipt modal (with fallback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      // Debug: log localStorage contents after payment
      const storedPD = localStorage.getItem('purchaseData');
      const storedST = localStorage.getItem('selectedTicket');
      console.log('[DEBUG] After payment - localStorage purchaseData:', storedPD);
      console.log('[DEBUG] After payment - localStorage selectedTicket:', storedST);
      restorePurchaseData();
      setShowAssigningTicket(false); // Hide assigning overlay
      setPaymentStep(3);
      // Poll for up to 15 seconds for the user's confirmed ticket
      (async () => {
        let pd = JSON.parse(localStorage.getItem('purchaseData') || '{}');
        let st = JSON.parse(localStorage.getItem('selectedTicket') || '{}');
        const ticketType = pd.ticketType || st.type;
        let found = false;
        let attempts = 0;
        let ticketDoc = null;
        if (user && ticketType) {
          while (attempts < 15 && !found) {
            const userTicketsQuery = query(
              collection(db, 'tickets'),
              where('ticketType', '==', ticketType),
              where('userId', '==', user.uid),
              where('status', '==', 'confirmed')
            );
            const userTicketsSnap = await getDocs(userTicketsQuery);
            if (!userTicketsSnap.empty) {
              ticketDoc = userTicketsSnap.docs[0];
              found = true;
              break;
            }
            await new Promise(res => setTimeout(res, 1000));
            attempts++;
          }
        }
        if (found && ticketDoc) {
          setCurrentReceipt({
            id: ticketDoc.id,
            ...(ticketDoc.data() as any)
          });
          setShowReceiptModal(true);
          setShowAssignErrorModal(false);
        } else {
          // Fallback: show modal with local data
          setCurrentReceipt({
            id: st.id || '',
            ticketType: ticketType || '',
            price: st.price || 0,
            userName: pd.fullName || '',
            userEmail: pd.email || '',
            phone: pd.phone || '',
            purchaseDate: new Date().toISOString(),
            scanned: false
          });
          setShowReceiptModal(true);
        }
      })();
    } else if (params.get('payment') === 'failed' || params.get('payment') === 'cancelled') {
      setPaymentError('Payment was not successful.');
      setPaymentStep(1);
      setShowPaymentModal(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, []);

  return (
    <>
      {(showAssigningTicket || loading) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="flex flex-col items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-pink-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <div className="text-white text-lg font-semibold">Assigning your ticket...</div>
          </div>
        </div>
      )}
      {/* ...existing code for ticket section, modals, etc... */}
      <section id="tickets" className="py-20 bg-gray-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-12 text-center tracking-tight drop-shadow-lg">Get Your 80s Flashbacks Ticket</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {ticketOptions.map(option => {
              const stats = ticketStats[option.type] || { cap: 0, sold: 0, available: 0 };
              const soldOut = stats.available === 0;
              return (
                <div
                  key={option.type}
                  className={`relative bg-gradient-to-br from-pink-500/80 to-purple-700/80 rounded-3xl shadow-2xl p-8 flex flex-col items-center border-4 border-transparent hover:border-pink-400 transition-all duration-300 group overflow-hidden animate-fade-in-up`}
                  style={{ minHeight: 340 }}
                >
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-pink-400 opacity-20 rounded-full blur-2xl animate-pulse" />
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-400 opacity-20 rounded-full blur-2xl animate-pulse" />
                  <div className="z-10 w-full flex flex-col items-center">
                    <Ticket className="text-white drop-shadow-lg mb-4 animate-bounce" size={48} />
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase drop-shadow">{option.type} Ticket</h3>
                    <div className="text-4xl font-extrabold text-yellow-300 mb-2 drop-shadow-lg">R{option.price}</div>
                    <div className="text-white text-center mb-4 opacity-90">{option.description}</div>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-semibold">{stats.cap} Total</span>
                      <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-semibold">{stats.sold} Sold</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${soldOut ? 'bg-red-500/80 text-white' : 'bg-green-400/80 text-gray-900'}`}>{soldOut ? 'Sold Out' : `${stats.available} Left`}</span>
                    </div>
                    <button
                      className={`mt-auto w-full py-3 rounded-xl font-bold text-lg shadow-xl transition-all duration-200 ${soldOut ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-pink-500 hover:to-yellow-400 text-white animate-glow'}`}
                      onClick={() => {
                        if (soldOut) return;
                        // Set selected ticket and purchase data
                        setSelectedTicket(option);
                        setPurchaseData({
                          fullName: userData?.displayName || user?.displayName || '',
                          email: userData?.email || user?.email || '',
                          phone: userData?.phone || '',
                          ticketType: option.type,
                          isStudent: option.type === 'Student'
                        });
                        // If not logged in, show auth modal
                        if (!user) {
                          setShowAuthModal(true);
                          return;
                        }
                        // Show purchase modal for user to fill in details
                        setShowPurchaseModal(true);
                      }}
                      disabled={soldOut}
                    >
                      {soldOut ? 'Sold Out' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full relative border border-pink-500">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={() => setShowPurchaseModal(false)}>&times;</button>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Enter Your Details</h3>
            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Full Name</label>
                <input type="text" className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500" value={purchaseData.fullName} onChange={e => setPurchaseData(pd => ({ ...pd, fullName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500" value={purchaseData.email} onChange={e => setPurchaseData(pd => ({ ...pd, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Phone</label>
                <input type="tel" className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500" value={purchaseData.phone} onChange={e => setPurchaseData(pd => ({ ...pd, phone: e.target.value }))} required />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-pink-500 hover:to-yellow-400 text-white shadow-xl mt-4">Proceed to Payment</button>
              {paymentError && <div className="text-red-400 text-sm mt-2 text-center">{paymentError}</div>}
            </form>
          </div>
        </div>
      )}
      {/* ...existing modals and UI... */}
    </>
  );
};

export default TicketSection;