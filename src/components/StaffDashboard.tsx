import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Camera, LogOut, CheckCircle, XCircle, Search, Users, Scan, UserCheck, Zap, Target, Star, Trophy, Video, VideoOff, RotateCcw, RefreshCw } from 'lucide-react';
import QrScanner from 'react-qr-scanner';

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

const StaffDashboard = () => {
  const { userData } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scanResult, setScanResult] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [scannerKey, setScannerKey] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Real-time listener for confirmed tickets
    const q = query(collection(db, 'tickets'), where('status', '==', 'confirmed'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      setTickets(ticketList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchTickets = async () => {
    try {
      const q = query(collection(db, 'tickets'), where('status', '==', 'confirmed'));
      const querySnapshot = await getDocs(q);
      const ticketList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      setTickets(ticketList);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanTicket = async (ticketId: string) => {
    if (isProcessing) return; // Prevent multiple simultaneous scans
    try {
      setIsProcessing(true);
      // DEBUG: Log the ticketId received from QR scan
      console.log('Scanned ticketId from QR:', ticketId);
      // Find the ticket in our local state first
      const ticket = tickets.find(t => t.id === ticketId);
      console.log('Scanned ticket lookup:', ticketId, ticket);
      if (!ticket) {
        setScanResult('❌ Invalid ticket ID - Ticket not found');
        setTimeout(() => setScanResult(''), 3000);
        return;
      }
      if (ticket.scanned) {
        setScanResult('⚠️ Ticket already scanned - Entry already granted');
        setTimeout(() => setScanResult(''), 3000);
        return;
      }
      if (ticket.status !== 'confirmed') {
        setScanResult('❌ Invalid ticket status - Ticket not confirmed');
        setTimeout(() => setScanResult(''), 3000);
        return;
      }
      // Update ticket in database
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        scanned: true
      });
      setScanResult('✅ Entry granted!');
      setTimeout(() => setScanResult(''), 3000);
    } catch (error) {
      setScanResult('❌ Error processing ticket');
      setTimeout(() => setScanResult(''), 3000);
      console.error('Error scanning ticket:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startScanning = () => {
    setCameraError('');
    setScanResult('📱 Point camera at QR code to scan...');
    setScanning(true);
    setIsProcessing(false);
    setScannerKey(prev => prev + 1);
  };

  const stopScanning = () => {
    setScanning(false);
    setCameraError('');
    setScanResult('');
    setIsProcessing(false);
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    setCameraError('');
    setScannerKey(prev => prev + 1);
  };

  const restartScanner = () => {
    setCameraError('');
    setScanResult('📱 Scanner restarted - Point camera at QR code...');
    setIsProcessing(false);
    setScannerKey(prev => prev + 1);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    await fetchTickets();
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group tickets by userEmail
  const ticketsByUser: { [email: string]: Ticket[] } = {};
  filteredTickets.forEach(ticket => {
    if (!ticketsByUser[ticket.userEmail]) {
      ticketsByUser[ticket.userEmail] = [];
    }
    ticketsByUser[ticket.userEmail].push(ticket);
  });
  // Flatten: if user has one ticket, show one; if more, show all
  const uniqueFilteredTickets = Object.values(ticketsByUser).flatMap(ticketsArr =>
    ticketsArr.length === 1 ? [ticketsArr[0]] : ticketsArr
  );

  const stats = {
    totalTickets: tickets.length,
    scannedTickets: tickets.filter(t => t.scanned).length,
    unscannedTickets: tickets.filter(t => !t.scanned).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <UserCheck className="text-white" size={32} />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-700 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserCheck className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                  Staff Dashboard
                  <Scan className="ml-2 text-cyan-200" size={20} />
                </h1>
                <p className="text-blue-100 text-sm">Welcome back, {userData?.displayName || userData?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors bg-white bg-opacity-10 px-3 py-2 rounded-lg hover:bg-opacity-20 text-sm"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* QR Scanner Section */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
              <Camera className="mr-2 text-cyan-400" size={20} />
              Live QR Scanner
              <Trophy className="ml-2 text-yellow-400" size={16} />
            </h2>
            <div className="flex flex-wrap gap-2">
              {scanning && (
                <>
                  <button
                    onClick={restartScanner}
                    className="flex items-center space-x-1 bg-yellow-600 text-white px-2 py-1 rounded text-sm hover:bg-yellow-700 transition-all"
                  >
                    <RefreshCw size={14} />
                    <span>Restart</span>
                  </button>
                  <button
                    onClick={switchCamera}
                    className="flex items-center space-x-1 bg-gray-700 text-white px-2 py-1 rounded text-sm hover:bg-gray-600 transition-all"
                  >
                    <RotateCcw size={14} />
                    <span>Switch</span>
                  </button>
                </>
              )}
              {scanning ? (
                <button
                  onClick={stopScanning}
                  className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-all"
                >
                  <VideoOff size={14} />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={startScanning}
                  className="flex items-center space-x-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3 py-1 rounded text-sm hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  <Video size={14} />
                  <span>Start Scanner</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center space-y-4">
            {scanning ? (
              <div className="relative w-full max-w-sm">
                <div className="w-full aspect-square bg-black rounded-lg overflow-hidden border-4 border-cyan-400 relative">
                  {/* Only mount QrScanner when scanning is active for better UX */}
                  <QrScanner
                    key={scannerKey}
                    onScan={(result: any) => {
                      // Only use result.text as the ticket ID
                      if (result && result.text && !isProcessing) {
                        setCameraError('');
                        handleScanTicket(result.text);
                      }
                    }}
                    onError={setCameraError}
                    facingMode={facingMode} // Only pass to QrScanner, not DOM elements
                    style={{ width: '100%', height: '100%' }}
                  />
                  {/* Scanner overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-cyan-400 rounded-lg">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-400 rounded-br-lg"></div>
                    </div>
                    {/* Scanning line animation */}
                    <div className="absolute inset-4 overflow-hidden rounded-lg">
                      <div className="absolute w-full h-0.5 bg-cyan-400 animate-pulse" style={{
                        top: '50%',
                        boxShadow: '0 0 10px #00bfff'
                      }}></div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <p className="text-cyan-300 font-semibold flex items-center justify-center text-sm">
                    <Scan className="mr-2 animate-pulse" size={16} />
                    Scanner Active
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Camera: {facingMode === 'environment' ? 'Back' : 'Front'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center w-full max-w-sm">
                <div className="w-full aspect-square bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-cyan-400 transition-colors">
                  <div className="text-center">
                    <Camera className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-300 text-base font-semibold">QR Scanner Ready</p>
                    <p className="text-gray-500 text-xs mt-1">Click "Start Scanner" to begin</p>
                  </div>
                </div>
                {/* QrScanner is NOT mounted when scanning is false for better UX */}
                <div className="flex items-center justify-center mt-2 space-x-2">
                  <XCircle size={16} />
                  <span>{cameraError}</span>
                </div>
              </div>
            )}
            {scanResult && (
              <div className={`p-3 rounded-lg border-2 max-w-md text-center text-sm ${
                scanResult.includes('Error') || scanResult.includes('❌') || scanResult.includes('⚠️')
                  ? 'bg-red-900 bg-opacity-50 text-red-200 border-red-500' 
                  : scanResult.includes('✅')
                  ? 'bg-green-900 bg-opacity-50 text-green-200 border-green-500'
                  : 'bg-blue-900 bg-opacity-50 text-blue-200 border-blue-500'
              } flex items-center justify-center space-x-2`}>
                <span>{scanResult}</span>
              </div>
            )}
          </div>
        </div>

        {/* Search and Tickets */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-xl">
          <div className="p-4 sm:p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                <Users className="mr-2 text-blue-400" size={20} />
                Ticket Management
              </h2>
              
              {/* Refresh button */}
              <button
                onClick={handleManualRefresh}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                <RefreshCw className="mr-2" size={18} />
                {loading ? 'Refreshing...' : 'Refresh Tickets'}
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or ticket ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-sm"
              />
            </div>
          </div>

          {/* Mobile-optimized table */}
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              {/* Desktop Table */}
              <table className="w-full hidden sm:table">
                <thead className="bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {uniqueFilteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white flex items-center">
                            <Users className="mr-2 text-blue-400" size={14} />
                            {ticket.userName}
                          </div>
                          <div className="text-xs text-gray-400">{ticket.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.ticketType === 'Student' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.ticketType}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-300 font-mono">
                        {ticket.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          ticket.scanned ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {ticket.scanned ? (
                            <>
                              <CheckCircle className="mr-1" size={10} />
                              Scanned
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1" size={10} />
                              Not Scanned
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {!ticket.scanned && (
                          <button
                            onClick={() => handleScanTicket(ticket.id)}
                            disabled={isProcessing}
                            className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 bg-blue-900 bg-opacity-30 px-2 py-1 rounded text-xs hover:bg-opacity-50 transition-all disabled:opacity-50"
                          >
                            <CheckCircle size={12} />
                            <span>Mark Scanned</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-gray-700">
                {uniqueFilteredTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 hover:bg-gray-750 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <Users className="mr-2 text-blue-400" size={16} />
                          <span className="text-white font-medium text-sm">{ticket.userName}</span>
                        </div>
                        <p className="text-gray-400 text-xs mb-2">{ticket.userEmail}</p>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.ticketType === 'Student' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {ticket.ticketType}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            ticket.scanned ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {ticket.scanned ? (
                              <>
                                <CheckCircle className="mr-1" size={10} />
                                Scanned
                              </>
                            ) : (
                              <>
                                <XCircle className="mr-1" size={10} />
                                Not Scanned
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs font-mono">ID: {ticket.id.slice(0, 12)}...</p>
                      </div>
                      {!ticket.scanned && (
                        <button
                          onClick={() => handleScanTicket(ticket.id)}
                          disabled={isProcessing}
                          className="ml-3 flex items-center space-x-1 bg-blue-900 bg-opacity-30 text-blue-400 hover:text-blue-300 px-3 py-2 rounded text-xs hover:bg-opacity-50 transition-all disabled:opacity-50"
                        >
                          <CheckCircle size={14} />
                          <span>Mark Scanned</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Stats Section at the bottom */}
        <div className="mt-8 flex flex-col sm:flex-row sm:space-x-8 space-y-4 sm:space-y-0 justify-center items-center">
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-6 py-4 text-center shadow">
            <div className="text-2xl font-bold text-white">{stats.totalTickets}</div>
            <div className="text-gray-400 text-sm">Total Tickets</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-6 py-4 text-center shadow">
            <div className="text-2xl font-bold text-green-400">{stats.scannedTickets}</div>
            <div className="text-gray-400 text-sm">Scanned</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-6 py-4 text-center shadow">
            <div className="text-2xl font-bold text-yellow-400">{stats.unscannedTickets}</div>
            <div className="text-gray-400 text-sm">Unscanned</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;