
'use client';
// import React from 'react';

import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// Import the initial products and types from Products.tsx
import { Product } from './Products';

interface OrderProduct extends Omit<Product, 'stock'> {
  quantity: number;
}





interface OrderProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
  products?: OrderProduct[];
}

interface TrackingStep {
  id: string;
  name: string;
  description: string;
}

interface TrackingModalProps {
  selectedOrder: Order | null;
  setIsTrackingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  trackingSteps: TrackingStep[];
  getStatusIndex: (status: string) => number;
}

function TrackingModal({ selectedOrder, setIsTrackingModalOpen, trackingSteps, getStatusIndex }: TrackingModalProps) {
  if (!selectedOrder) return null;
  const currentStatusIndex = getStatusIndex(selectedOrder.status.toLowerCase());
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Order Tracking</h2>
            <button 
              onClick={() => setIsTrackingModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-6">
            {trackingSteps.map((step: TrackingStep, index: number) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              return (
                <div key={step.id} className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {isCompleted ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className={`w-3 h-3 rounded-full ${isCurrent ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        )}
                      </div>
                      {index < trackingSteps.length - 1 && (
                        <div className={`h-12 w-0.5 mx-auto ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-gray-700'}`}>{step.name}</h3>
                    <p className="text-sm text-gray-500">{step.description}</p>
                    {isCurrent && (<p className="text-xs text-green-600 mt-1">Current Status</p>)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setIsTrackingModalOpen(false)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// Move ProductsModal outside OrdersPage

interface ProductsModalProps {
  selectedOrder: Order | null;
  setIsProductsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function ProductsModal({ selectedOrder, setIsProductsModalOpen }: ProductsModalProps) {
  if (!selectedOrder) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Order #{selectedOrder.id} - Products</h2>
            <button 
              onClick={() => setIsProductsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-light"
            >
              ×
            </button>
          </div>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Customer</span>
              <span className="text-sm text-gray-900">{selectedOrder.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Order Date</span>
              <span className="text-sm text-gray-900">{selectedOrder.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Order Total</span>
              <span className="text-sm font-medium text-gray-900">{selectedOrder.amount}</span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Products ({selectedOrder.products?.length || 0})</h3>
            <div className="space-y-4">
              {selectedOrder.products?.map((product: OrderProduct) => (
                <div key={product.id} className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/80';
                      }}
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">Qty: {product.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">₹{product.price.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500">Total: ₹{(product.price * product.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsProductsModalOpen(false)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function OrdersPage() {
  // State hooks
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Dummy data for demonstration
  const allOrders: Order[] = [];
  const totalItems = allOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentOrders = allOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const hasActiveFilters = false;
  const filters = { status: 'all', selectedDate: '' };
  const handleStatusChange = () => {};
  const handleDateChange = () => {};
  const clearFilters = () => {};
  const handlePageChange = (page: number) => setCurrentPage(page);
  const getStatusBadge = (order: Order) => order.status;
  const trackingSteps: TrackingStep[] = [];
  const getStatusIndex = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'completed': return 3;
      default: return -1;
    }
  };
  const handleViewProducts = (order: Order) => {
    setSelectedOrder(order);
    setIsProductsModalOpen(true);
  };
  return (
    <div className="p-6 relative">
      {isTrackingModalOpen && (
        <TrackingModal 
          selectedOrder={selectedOrder} 
          setIsTrackingModalOpen={setIsTrackingModalOpen} 
          trackingSteps={trackingSteps} 
          getStatusIndex={getStatusIndex} 
        />
      )}
      {isProductsModalOpen && (
        <ProductsModal 
          selectedOrder={selectedOrder} 
          setIsProductsModalOpen={setIsProductsModalOpen} 
        />
      )}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select 
              value={filters.status}
              onChange={handleStatusChange}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
            </select>
          </div>
          <div className="relative">
            <input
              type="date"
              value={filters.selectedDate}
              onChange={handleDateChange}
              max={new Date().toISOString().split('T')[0]}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Select date"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button 
                      onClick={() => handleViewProducts(order)}
                      className="text-green-600 hover:text-green-900"
                    >
                      View Products
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">
                {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
              </span> to {' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{' '}
              of <span className="font-medium">{totalItems}</span> {totalItems === 1 ? 'result' : 'results'}
              {hasActiveFilters && (
                <span className="ml-2 text-sm text-gray-500">
                  (filtered from {allOrders.length} total)
                </span>
              )}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? 'z-10 bg-green-50 border-green-500 text-green-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrdersPage;


