'use client';

import { FiDollarSign, FiCalendar, FiX, FiPackage } from 'react-icons/fi';
import { useState } from 'react';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Transaction {
  id: string;
  customer: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  type: 'credit' | 'debit';
  products?: Product[];
  shippingAddress?: string;
  paymentMethod?: string;
}

export default function PaymentsPage() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sample transaction data with products
  const [transactions] = useState<Transaction[]>([
    {
      id: 'TXN-1001',
      customer: 'John Doe',
      amount: 1250.50,
      date: '2023-10-28',
      status: 'completed',
      type: 'credit',
      paymentMethod: 'Credit Card',
      shippingAddress: '123 Farm St, Agriculture City, 10001',
      products: [
        { id: 1, name: 'Soil Moisture Sensor', price: 89.99, quantity: 5, image: '/sensor.jpg' },
        { id: 4, name: 'Weather Station Pro', price: 349.99, quantity: 2, image: '/weather-station.jpg' }
      ]
    },
    {
      id: 'TXN-1002',
      customer: 'Jane Smith',
      amount: 890.75,
      date: '2023-10-27',
      status: 'completed',
      type: 'credit'
    },
    {
      id: 'TXN-1003',
      customer: 'Robert Johnson',
      amount: 1560.25,
      date: '2023-10-26',
      status: 'pending',
      type: 'credit'
    },
    {
      id: 'TXN-1004',
      customer: 'Vendor Refund',
      amount: 450.00,
      date: '2023-10-25',
      status: 'completed',
      type: 'debit'
    }
  ]);
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTransactionClick = (txn: Transaction) => {
    setSelectedTransaction(txn);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h1>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {transactions.map((txn) => (
                <li 
                  key={txn.id} 
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleTransactionClick(txn)}
                >
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${txn.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      <FiDollarSign className="h-5 w-5" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {txn.customer}
                        </p>
                        <p className={`text-sm ${txn.type === 'credit' ? 'text-green-600' : 'text-blue-600'}`}>
                          {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <FiCalendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {formatDate(txn.date)}
                        </div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(txn.status)}`}>
                          {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Order Details</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Order ID</p>
                      <p>{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p>{formatDate(selectedTransaction.date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Payment Method</p>
                      <p>{selectedTransaction.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Shipping Information */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Shipping Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedTransaction.customer}</p>
                    <p className="text-gray-600 text-sm">{selectedTransaction.shippingAddress || 'No shipping address provided'}</p>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Products</h3>
                  <div className="space-y-4">
                    {selectedTransaction.products?.length ? (
                      selectedTransaction.products.map((product) => (
                        <div key={product.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="h-16 w-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                            <Image 
                              src={product.image || '/placeholder-product.jpg'} 
                              alt={product.name}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <p className="text-sm text-gray-500">Qty: {product.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{(product.price * product.quantity).toFixed(2)}</p>
                            <p className="text-sm text-gray-500">₹{product.price.toFixed(2)} each</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FiPackage className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-2">No products found for this transaction</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-medium">
                    <span>Total</span>
                    <span>₹{selectedTransaction.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}