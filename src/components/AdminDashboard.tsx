import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Plus, Edit, Trash2, LogOut, Users, DollarSign, Ticket, TrendingUp, X, Save, Crown, Shield, Zap, Star, Trophy, Target, QrCode, Activity, Filter, Search, ChevronDown } from 'lucide-react';
import QRCode from 'qrcode';

interface TicketType {
  id: string;
  ticketType: string;
  price: number;
  quantity: number;
  userName?: string;
  userEmail?: string;
  userId?: string;
  purchaseDate?: string;
  status: string;
  scanned: boolean;
  qrCodeGenerated?: boolean;
  qrGeneratedAt?: string;
  scannedAt?: string;
}

interface QRLog {
  id: string;
  ticketId: string;
  ticketType: string;
  userName: string;
  userEmail: string;
  qrData: string;
  generatedAt: string;
  scannedAt?: string;
  scanned: boolean;
}

const AdminDashboard = () => {
  const { userData } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketType[]>([]);
  const [qrLogs, setQrLogs] = useState<QRLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRLogsModal, setShowQRLogsModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [newTicket, setNewTicket] = useState({
    ticketType: 'General',
    price: 70,
    quantity: 1
  });
  const [createStep, setCreateStep] = useState(1);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [scannedFilter, setScannedFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchQRLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, searchTerm, statusFilter, typeFilter, scannedFilter]);

  const applyFilters = () => {
    let filtered = [...tickets];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.ticketType === typeFilter);
    }

    // Scanned filter
    if (scannedFilter !== 'all') {
      filtered = filtered.filter(ticket => 
        scannedFilter === 'scanned' ? ticket.scanned : !ticket.scanned
      );
    }

    setFilteredTickets(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setScannedFilter('all');
  };

  const fetchTickets = async () => {
    try {
      const q = query(collection(db, 'tickets'), orderBy('ticketType'));
      const querySnapshot = await getDocs(q);
      const ticketList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TicketType[];
      setTickets(ticketList);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQRLogs = async () => {
    try {
      const q = query(collection(db, 'qrLogs'), orderBy('generatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const qrLogsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QRLog[];
      setQrLogs(qrLogsList);
    } catch (error) {
      console.error('Error fetching QR logs:', error);
    }
  };

  const handleCreateTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreateStep(2);

    try {
      const promises = [];
      for (let i = 0; i < newTicket.quantity; i++) {
        // Create the ticket first
        const ticketRef = await addDoc(collection(db, 'tickets'), {
          ticketType: newTicket.ticketType,
          price: newTicket.price,
          userName: '',
          userEmail: '',
          userId: '',
          purchaseDate: '',
          status: 'available',
          scanned: false,
          qrCodeGenerated: false,
          createdAt: new Date().toISOString()
        });
        // Generate QR code using the Firestore document ID
        const qrData = ticketRef.id;
        const qrCodeUrl = await QRCode.toDataURL(qrData);
        // Update the ticket with QR code info
        await updateDoc(ticketRef, {
          qrCodeGenerated: true,
          qrGeneratedAt: new Date().toISOString(),
          qrData,
          qrCodeUrl
        });
        // Optionally log QR code creation in qrLogs
        await addDoc(collection(db, 'qrLogs'), {
          ticketId: ticketRef.id,
          ticketType: newTicket.ticketType,
          userName: '',
          userEmail: '',
          qrData,
          generatedAt: new Date().toISOString(),
          scanned: false
        });
      }
      setCreateStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await fetchTickets();
      setShowCreateModal(false);
      setNewTicket({ ticketType: 'General', price: 70, quantity: 1 });
      setCreateStep(1);
    } catch (error) {
      console.error('Error creating tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;

    try {
      await updateDoc(doc(db, 'tickets', editingTicket.id), {
        ticketType: editingTicket.ticketType,
        price: editingTicket.price,
        userName: editingTicket.userName || '',
        userEmail: editingTicket.userEmail || '',
        status: editingTicket.status,
        scanned: editingTicket.scanned
      });
      
      await fetchTickets();
      setShowEditModal(false);
      setEditingTicket(null);
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
      await fetchTickets();
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  // Delete all tickets
  const handleDeleteAllTickets = async () => {
    if (!confirm('Are you sure you want to delete ALL tickets? This cannot be undone.')) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'tickets'));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, 'tickets', docSnap.id)));
      await Promise.all(deletePromises);
      await fetchTickets();
    } catch (error) {
      console.error('Error deleting all tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const stats = {
    totalTickets: tickets.length,
    soldTickets: tickets.filter(t => t.status === 'confirmed').length,
    scannedTickets: tickets.filter(t => t.scanned).length,
    qrGenerated: tickets.filter(t => t.qrCodeGenerated).length,
    revenue: tickets.filter(t => t.status === 'confirmed').reduce((sum, t) => sum + t.price, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Crown className="text-white" size={32} />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-white mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-16"> {/* Add padding-top for navigation */}
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-700 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Crown className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  Admin Dashboard
                  <Shield className="ml-2 text-yellow-300" size={20} />
                </h1>
                <p className="text-pink-100">Welcome back, {userData?.displayName || userData?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-white hover:text-pink-200 transition-colors bg-white bg-opacity-10 px-4 py-2 rounded-lg hover:bg-opacity-20"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Tickets</p>
                <p className="text-3xl font-bold">{stats.totalTickets}</p>
              </div>
              <Ticket className="text-blue-200" size={32} />
            </div>
            <div className="mt-2 flex items-center">
              <Target className="text-blue-200 mr-1" size={16} />
              <span className="text-blue-100 text-sm">Inventory</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Sold Tickets</p>
                <p className="text-3xl font-bold">{stats.soldTickets}</p>
              </div>
              <Users className="text-green-200" size={32} />
            </div>
            <div className="mt-2 flex items-center">
              <Star className="text-green-200 mr-1" size={16} />
              <span className="text-green-100 text-sm">Sales</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Scanned</p>
                <p className="text-3xl font-bold">{stats.scannedTickets}</p>
              </div>
              <TrendingUp className="text-purple-200" size={32} />
            </div>
            <div className="mt-2 flex items-center">
              <Zap className="text-purple-200 mr-1" size={16} />
              <span className="text-purple-100 text-sm">Check-ins</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm">QR Generated</p>
                <p className="text-3xl font-bold">{stats.qrGenerated}</p>
              </div>
              <QrCode className="text-cyan-200" size={32} />
            </div>
            <div className="mt-2 flex items-center">
              <Activity className="text-cyan-200 mr-1" size={16} />
              <span className="text-cyan-100 text-sm">QR Codes</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Revenue</p>
                <p className="text-3xl font-bold">R{stats.revenue}</p>
              </div>
              <DollarSign className="text-yellow-200" size={32} />
            </div>
            <div className="mt-2 flex items-center">
              <Trophy className="text-yellow-200 mr-1" size={16} />
              <span className="text-yellow-100 text-sm">Earnings</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Shield className="mr-2 text-pink-400" size={24} />
            Ticket Management
          </h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={() => setShowQRLogsModal(true)}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <QrCode size={16} />
              <span>QR Logs</span>
              <Activity size={14} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus size={16} />
              <span>Create Tickets</span>
              <Zap size={14} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Filter size={16} />
                <span>Filters</span>
                <ChevronDown className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} size={16} />
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="all">All Types</option>
                    <option value="General">General</option>
                    <option value="Student">Student</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Scanned</label>
                  <select
                    value={scannedFilter}
                    onChange={(e) => setScannedFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="all">All</option>
                    <option value="scanned">Scanned</option>
                    <option value="not-scanned">Not Scanned</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-400">
              Showing {filteredTickets.length} of {tickets.length} tickets
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    QR Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Scanned
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                      {ticket.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        ticket.ticketType === 'Student' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ticket.ticketType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">
                      R{ticket.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {ticket.userName || (
                        <span className="text-gray-500 italic">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        ticket.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        ticket.qrCodeGenerated ? 'bg-cyan-100 text-cyan-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.qrCodeGenerated ? 'Generated' : 'Not Generated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        ticket.scanned ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {ticket.scanned ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingTicket(ticket);
                            setShowEditModal(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete All Tickets Button - Desktop */}
        <div className="hidden sm:block">
          <button
            onClick={handleDeleteAllTickets}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg mt-4"
          >
            <Trash2 size={16} />
            <span>Delete All Tickets</span>
          </button>
        </div>
      </div>

      {/* QR Logs Modal */}
      {showQRLogsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-cyan-500 to-blue-600">
              <div className="flex items-center space-x-2">
                <QrCode className="text-white" size={24} />
                <h3 className="text-xl font-bold text-white">QR Code Activity Logs</h3>
                <Activity className="text-white" size={20} />
              </div>
              <button
                onClick={() => setShowQRLogsModal(false)}
                className="text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ticket ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Generated</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Scanned</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {qrLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                          {log.ticketId.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            log.ticketType === 'Student' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.ticketType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          <div>
                            <div className="font-medium text-white">{log.userName}</div>
                            <div className="text-xs text-gray-400">{log.userEmail}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {new Date(log.generatedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {log.scannedAt ? new Date(log.scannedAt).toLocaleString() : 'Not scanned'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            log.scanned ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {log.scanned ? 'Used' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal - Mobile Optimized */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 bg-gradient-to-r from-pink-500 to-purple-600">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Plus className="text-white" size={16} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Create New Tickets</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="p-4 sm:p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Creation Progress</span>
                  <span className="text-sm text-pink-400">
                    {createStep === 1 ? 'Configure' : createStep === 2 ? 'Creating...' : 'Complete!'}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(createStep / 3) * 100}%` }}
                  ></div>
                </div>
              </div>

              <form onSubmit={handleCreateTickets} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center">
                    <Ticket className="mr-2 text-pink-400" size={16} />
                    Ticket Type
                  </label>
                  <select
                    value={newTicket.ticketType}
                    onChange={(e) => {
                      const type = e.target.value;
                      setNewTicket({
                        ...newTicket,
                        ticketType: type,
                        price: type === 'Student' ? 50 : 70
                      });
                    }}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="General">General (R70)</option>
                    <option value="Student">Student (R50)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center">
                    <DollarSign className="mr-2 text-green-400" size={16} />
                    Price
                  </label>
                  <input
                    type="number"
                    value={newTicket.price}
                    onChange={(e) => setNewTicket({ ...newTicket, price: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center">
                    <Target className="mr-2 text-blue-400" size={16} />
                    Quantity (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newTicket.quantity}
                    onChange={(e) => setNewTicket({ ...newTicket, quantity: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <Star className="mr-2 text-yellow-400" size={16} />
                    Summary
                  </h4>
                  <div className="text-gray-200 text-sm space-y-1">
                    <div>Creating {newTicket.quantity} {newTicket.ticketType} ticket{newTicket.quantity > 1 ? 's' : ''}</div>
                    <div>Price per ticket: R{newTicket.price}</div>
                    <div className="font-bold">Total value: R{newTicket.quantity * newTicket.price}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-md hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2 transform hover:scale-105 transition-all"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>Create {newTicket.quantity} Ticket{newTicket.quantity > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ticket Modal - Mobile Optimized */}
      {showEditModal && editingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Edit className="text-white" size={16} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Edit Ticket</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditTicket} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center">
                  <Ticket className="mr-2 text-blue-400" size={16} />
                  Ticket Type
                </label>
                <select
                  value={editingTicket.ticketType}
                  onChange={(e) => setEditingTicket({ ...editingTicket, ticketType: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="General">General</option>
                  <option value="Student">Student</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center">
                  <DollarSign className="mr-2 text-green-400" size={16} />
                  Price
                </label>
                <input
                  type="number"
                  value={editingTicket.price}
                  onChange={(e) => setEditingTicket({ ...editingTicket, price: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center">
                  <Users className="mr-2 text-purple-400" size={16} />
                  Customer Name
                </label>
                <input
                  type="text"
                  value={editingTicket.userName || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, userName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center">
                  <Users className="mr-2 text-cyan-400" size={16} />
                  Customer Email
                </label>
                <input
                  type="email"
                  value={editingTicket.userEmail || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, userEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="customer@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center">
                  <Target className="mr-2 text-yellow-400" size={16} />
                  Status
                </label>
                <select
                  value={editingTicket.status}
                  onChange={(e) => setEditingTicket({ ...editingTicket, status: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>

              <div className="flex items-center bg-gray-800 rounded-lg p-4 border border-gray-600">
                <input
                  type="checkbox"
                  id="scanned"
                  checked={editingTicket.scanned}
                  onChange={(e) => setEditingTicket({ ...editingTicket, scanned: e.target.checked })}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="scanned" className="text-white flex items-center">
                  <Zap className="mr-2 text-blue-400" size={16} />
                  Ticket Scanned
                </label>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-md hover:from-blue-600 hover:to-blue-700 flex items-center justify-center space-x-2 transform hover:scale-105 transition-all"
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;