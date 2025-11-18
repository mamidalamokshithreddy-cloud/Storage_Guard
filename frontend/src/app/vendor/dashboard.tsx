'use client';

import { FiBell, FiChevronDown } from 'react-icons/fi';
import { useState, useEffect } from 'react';
// import { usePathname } from 'next/navigation';
import Products from './Products';


const recentOrders = [
  { id: '#1', customer: 'John Doe', date: '2023-05-15', amount: '₹9,600.00', status: 'Completed' },
  { id: '#2', customer: 'Jane Smith', date: '2023-05-14', amount: '₹7,160.00', status: 'Processing' },
  { id: '#3', customer: 'Robert Johnson', date: '2023-05-14', amount: '₹12,540.00', status: 'Completed' },
  { id: '#4', customer: 'Emily Davis', date: '2023-05-13', amount: '₹16,800.00', status: 'Pending' },
  { id: '#5', customer: 'Michael Brown', date: '2023-05-12', amount: '₹5,280.00', status: 'Completed' },
];

// Calculate total revenue from recent orders
const totalRevenue = recentOrders.reduce((sum, order) => {
  const amount = parseFloat(order.amount.replace(/[^0-9.-]+/g, ''));
  return sum + amount;
}, 0);

const stats = [
  { name: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, change: '+8% from last month' },
  { name: 'New Customers', value: '56', change: '+3 from last week' },
  { name: 'Active Products', value: '89', change: '+5 from last month' },
  { name: 'Total Orders', value: '1,234', change: '+12% from last month' },
];

// Mock notification data
const notifications = [
  { id: 1, text: 'New order #1234 has been placed', time: '2 min ago', read: false },
  { id: 2, text: 'Payment received from John Doe', time: '1 hour ago', read: false },
  { id: 3, text: 'Your product has been approved', time: '5 hours ago', read: true },
  { id: 4, text: 'New review received', time: '1 day ago', read: true },
];

type ActiveView = 'dashboard' | 'products' | 'customers' | 'orders' | 'payments' | 'performance';

export default function Dashboard() {
  const [sidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRevenue, setShowRevenue] = useState(true);
  const [activeView] = useState<ActiveView>('dashboard');
  const [unreadCount, setUnreadCount] = useState(
    notifications.filter(n => !n.read).length
  );
  
  // const handleNavigation = (view: ActiveView) => {
  //   setActiveView(view);
  //   setCurrentPage(1); // Reset pagination when changing views
  //   setShowNotifications(false);
  //   setShowProfileMenu(false);
  // };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowNotifications(false);
      setShowProfileMenu(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleRevenue = (e: React.MouseEvent, statName: string) => {
    if (statName === 'Total Revenue') {
      e.stopPropagation();
      setShowRevenue(!showRevenue);
    }
  };
  
  const itemsPerPage = 5;
  const totalItems = 24; // Total number of items (you can replace this with your actual data length)
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
    
    // Mark notifications as read when opening the dropdown
    if (!showNotifications) {
      setUnreadCount(0);
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
  };

  // Close dropdowns when clicking outside
  const closeAllDropdowns = () => {
    setShowNotifications(false);
    setShowProfileMenu(false);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Here you would typically fetch data for the new page
      // For now, we'll just update the current page
    }
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex h-screen bg-gray-50" onClick={closeAllDropdowns}>
      {/* Click outside overlay */}
      {(showNotifications || showProfileMenu) && (
        <div className="fixed inset-0 z-10" onClick={closeAllDropdowns}></div>
      )}
      {/* Sidebar
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          {sidebarOpen ? (
            <div className="flex items-center">
              <img 
                src="/images.png" 
                alt="Agrihub Logo" 
                className="w-8 h-8 mr-2 rounded-md"
              />
              <h1 className="text-xl font-bold text-green-600">Agrihub</h1>
            </div>
          ) : (
            <img 
              src="/images.png" 
              alt="Agrihub" 
              className="w-8 h-8 rounded-md"
            />
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <FiMenu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <nav className="mt-6 space-y-1">
          <button 
            onClick={() => handleNavigation('dashboard')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
              activeView === 'dashboard'
                ? 'text-green-600 bg-green-50 border-r-4 border-green-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
            } ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <FiHome className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Dashboard</span>}
          </button>
          <button 
            onClick={() => handleNavigation('products')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
              activeView === 'products'
                ? 'text-green-600 bg-green-50 border-r-4 border-green-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
            } ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <FiShoppingBag className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Products</span>}
          </button>
          <button 
            onClick={() => handleNavigation('customers')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
              activeView === 'customers'
                ? 'text-green-600 bg-green-50 border-r-4 border-green-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
            } ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <FiUsers className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Customers</span>}
          </button>
          <button 
            onClick={() => handleNavigation('orders')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
              activeView === 'orders'
                ? 'text-green-600 bg-green-50 border-r-4 border-green-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
            } ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <FiTruck className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Orders</span>}
          </button>
          <button 
            onClick={() => handleNavigation('payments')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
              activeView === 'payments'
                ? 'text-green-600 bg-green-50 border-r-4 border-green-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
            } ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <FiCreditCard className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Payments</span>}
          </button>
          <button 
            onClick={() => handleNavigation('performance')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
              activeView === 'performance'
                ? 'text-green-600 bg-green-50 border-r-4 border-green-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
            } ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <FiBarChart2 className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Performance</span>}
          </button>
        </nav>
      </div> */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeView === 'dashboard' ? (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
            {/* Dashboard content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="bg-white p-6 rounded-xl shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md"
                  onClick={(e) => toggleRevenue(e, stat.name)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">
                        {stat.name === 'Total Revenue' && !showRevenue ? '*****' : stat.value}
                      </p>
                      <p className="mt-1 text-xs text-green-600">
                        {stat.name === 'Total Revenue' && !showRevenue ? 'Click to show' : stat.change}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
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
        ) : (
          <div className="p-6">
            {activeView === 'products' && <Products />}
            {activeView === 'customers' && <div>Customers Content</div>}
            {activeView === 'orders' && <div>Orders Content</div>}
            {activeView === 'payments' && <div>Payments Content</div>}
            {activeView === 'performance' && <div>Performance Content</div>}
          </div>
        )}
        
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-end p-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNotifications();
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 relative"
                >
                  <FiBell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
                    <div className="p-3 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-900">Notifications</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          Mark all as read
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}
                        >
                          <p className="text-sm">{notification.text}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 text-center">
                      <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        View all notifications
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProfileMenu();
                  }}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                    JD
                  </div>
                  {sidebarOpen && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">John Doe</span>
                      <FiChevronDown className={`ml-1 text-gray-500 transition-transform ${showProfileMenu ? 'transform rotate-180' : ''}`} />
                    </div>
                  )}
                </div>
                
                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                    <div className="py-1">
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Your Profile
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow w-full">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <div 
                  className={`mt-1 text-2xl font-semibold ${stat.name === 'Total Revenue' ? 'cursor-pointer' : ''}`}
                  onClick={(e) => stat.name === 'Total Revenue' && toggleRevenue(e, stat.name)}
                >
                  {stat.name === 'Total Revenue' && !showRevenue ? '******' : stat.value}
                </div>
                <p className="mt-1 text-xs text-green-600">{stat.name === 'Total Revenue' && !showRevenue ? '' : stat.change}</p>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'Completed' 
                            ? 'bg-green-100 text-green-800' 
                            : order.status === 'Processing' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{' '}
                of <span className="font-medium">{totalItems}</span> orders
              </p>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3.5 py-1.5 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 ${
                    currentPage === 1
                      ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && handlePageChange(page)}
                    disabled={page === '...'}
                    className={`px-3.5 py-1.5 min-w-[40px] border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 ${
                      page === currentPage
                        ? 'border-green-500 bg-green-50 text-green-600 hover:bg-green-100'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    } ${page === '...' ? 'border-transparent hover:bg-transparent' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3.5 py-1.5 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 ${
                    currentPage === totalPages
                      ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Removed NavItem related code as it's no longer used