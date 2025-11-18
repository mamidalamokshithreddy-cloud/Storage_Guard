'use client';

import { useState, useMemo } from 'react';
import { FiSearch, FiMail, FiPhone } from 'react-icons/fi';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
}

const initialCustomers: Customer[] = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    location: 'New York, USA',
    totalOrders: 12,
    totalSpent: 2450.75,
    joinDate: '2023-05-15'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '(555) 987-6543',
    location: 'Los Angeles, USA',
    totalOrders: 5,
    totalSpent: 1200.50,
    joinDate: '2023-06-22'
  },
  {
    id: 3,
    name: 'Michael Brown',
    email: 'michael@example.com',
    phone: '(555) 456-7890',
    location: 'Chicago, USA',
    totalOrders: 8,
    totalSpent: 3250.25,
    joinDate: '2023-04-10'
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily@example.com',
    phone: '(555) 789-0123',
    location: 'Houston, USA',
    totalOrders: 15,
    totalSpent: 4100.00,
    joinDate: '2023-03-05'
  },
  {
    id: 5,
    name: 'Robert Wilson',
    email: 'robert@example.com',
    phone: '(555) 234-5678',
    location: 'Phoenix, USA',
    totalOrders: 3,
    totalSpent: 875.30,
    joinDate: '2023-07-18'
  }
];

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  // Filtered customers are now handled by useMemo

  // Use useMemo to filter customers
  const filteredCustomers = useMemo(() => {
    if (searchTerm === '') {
      return initialCustomers;
    }
    const term = searchTerm.toLowerCase();
    return initialCustomers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        customer.location.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center h-12">
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-800">
                        <FiMail className="h-4 w-4" />
                      </a>
                      <a href={`tel:${customer.phone}`} className="text-green-600 hover:text-green-800">
                        <FiPhone className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{customer.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
