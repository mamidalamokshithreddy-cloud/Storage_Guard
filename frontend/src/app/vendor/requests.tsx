'use client';

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi';

interface ProductRequest {
  id: string;
  productId: number;
  productName: string;
  requesterName: string;
  requesterType: 'Farmer' | 'Landowner' | 'Other';
  quantity: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  notes?: string;
}

export default function Requests() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Mock data - in a real app, this would come from an API
  useEffect(() => {
    // Simulate API call
    const fetchRequests = async () => {
      try {
        // In a real app, you would fetch this from your API
        const mockRequests: ProductRequest[] = [
          {
            id: 'REQ-1001',
            productId: 1,
            productName: 'Soil Moisture Sensor',
            requesterName: 'John Farmer',
            requesterType: 'Farmer',
            quantity: 2,
            status: 'pending',
            date: '2023-10-30',
            notes: 'Need for my wheat field'
          },
          {
            id: 'REQ-1002',
            productId: 2,
            productName: 'Agricultural Drone X200',
            requesterName: 'Smith Farms',
            requesterType: 'Landowner',
            quantity: 1,
            status: 'approved',
            date: '2023-10-29',
            notes: 'For crop monitoring across 100 acres'
          },
          {
            id: 'REQ-1003',
            productId: 3,
            productName: 'Automatic Harvester',
            requesterName: 'Green Valley Co-op',
            requesterType: 'Other',
            quantity: 1,
            status: 'rejected',
            date: '2023-10-28',
            notes: 'Out of stock at the moment'
          },
        ];
        
        setRequests(mockRequests);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleApprove = (id: string) => {
    setRequests(prevRequests => 
      prevRequests.map(request =>
        request.id === id 
          ? { ...request, status: 'approved' as const }
          : request
      )
    );
    // In a real app, you would also update the backend here
  };

  const handleReject = (id: string) => {
    setRequests(prevRequests => 
      prevRequests.map(request =>
        request.id === id 
          ? { ...request, status: 'rejected' as const }
          : request
      )
    );
    // In a real app, you would also update the backend here
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
    }
  };

  const viewDetails = (request: ProductRequest) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Product Requests</h1>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{request.requesterName}</div>
                      <div className="text-xs text-gray-400">{request.requesterType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewDetails(request)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FiInfo className="w-5 h-5" />
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <FiCheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <FiXCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Request Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Request ID</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.date}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Product</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.productName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.quantity}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Requester</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.requesterName} 
                    <span className="text-gray-500">({selectedRequest.requesterType})</span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
              </div>
              
              {selectedRequest.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setShowDetails(false);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FiCheckCircle className="mr-2 h-4 w-4" />
                      Approve Request
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        setShowDetails(false);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FiXCircle className="mr-2 h-4 w-4" />
                      Reject Request
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}