import React from 'react';

interface ReceiptModalProps {
  show: boolean;
  onClose: () => void;
  ticket: any; // Use your TicketReceipt type if available
  assigning?: boolean;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ show, onClose, ticket, assigning }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative border-2 border-pink-500">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        {assigning || ticket?.id === 'pending' ? (
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="animate-spin h-12 w-12 text-pink-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <div className="text-pink-600 text-lg font-semibold">Assigning your ticket...</div>
            <div className="text-gray-500 text-sm mt-2">Please wait, this may take a few seconds.</div>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl font-bold text-pink-600 mb-4 text-center">Your Ticket Receipt</h3>
            <div className="mb-4 text-center">
              <div className="text-lg font-semibold">{ticket.ticketType} Ticket</div>
              <div className="text-gray-700">Name: {ticket.userName}</div>
              <div className="text-gray-700">Email: {ticket.userEmail}</div>
              <div className="text-gray-700">Phone: {ticket.phone}</div>
              <div className="text-gray-700">Price: R{ticket.price}</div>
              <div className="text-gray-700">Ticket ID: {ticket.id}</div>
              <div className="text-gray-700">Status: {ticket.scanned ? 'Scanned' : 'Valid'}</div>
              <div className="text-gray-700">Purchase Date: {ticket.purchaseDate ? new Date(ticket.purchaseDate).toLocaleString() : ''}</div>
            </div>
            {/* Optionally show QR code here if available */}
            {/* <img src={qrCodeUrl} alt="QR Code" className="mx-auto my-4" /> */}
            <div className="text-center mt-4">
              <button
                className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-bold shadow"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptModal;
