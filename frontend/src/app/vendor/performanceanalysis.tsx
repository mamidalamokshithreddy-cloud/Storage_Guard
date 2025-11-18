"use client";

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

// Star rating component (moved outside main component)
const StarRating = ({ rating }: { rating: number }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-yellow-400" />);
    }
  }
  return <div className="flex">{stars}</div>;
};

const PerformanceAnalysis = () => {
  // Sample data for charts
  const performanceData = [
    { name: 'Jan', sales: 4000, revenue: 2400, users: 2400 },
    { name: 'Feb', sales: 3000, revenue: 1398, users: 2210 },
    { name: 'Mar', sales: 2000, revenue: 9800, users: 2290 },
    { name: 'Apr', sales: 2780, revenue: 3908, users: 2000 },
    { name: 'May', sales: 1890, revenue: 4800, users: 2181 },
    { name: 'Jun', sales: 2390, revenue: 3800, users: 2500 },
  ];

  // Sample reviews data with replies
  const [reviews, setReviews] = useState([
    { 
      id: 1, 
      user: 'John Doe', 
      rating: 4.5, 
      comment: 'Great service and support!', 
      date: '2025-10-15',
      reply: '',
      showReplyBox: false
    },
    { 
      id: 2, 
      user: 'Jane Smith', 
      rating: 5, 
      comment: 'Excellent performance and reliability', 
      date: '2025-10-10',
      reply: 'Thank you for your kind words, Jane! We\'re thrilled to hear about your positive experience.',
      showReplyBox: false
    },
    { 
      id: 3, 
      user: 'Mike Johnson', 
      rating: 3.5, 
      comment: 'Good but could improve response time', 
      date: '2025-10-05',
      reply: 'Thank you for your feedback, Mike. We appreciate your input and are actively working on improving our response times.',
      showReplyBox: false
    },
  ]);

  const [replyText, setReplyText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);

  const handleReplySubmit = (reviewId: number) => {
    setReviews(reviews.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          reply: replyText,
          showReplyBox: false
        };
      }
      return review;
    }));
    setReplyText('');
    setEditingReplyId(null);
  };

  // Removed unused handleEditReply function

  const toggleReplyBox = (reviewId: number) => {
    setEditingReplyId(null);
    setReplyText('');
    setReviews(reviews.map(review => ({
      ...review,
      showReplyBox: review.id === reviewId && !review.showReplyBox
    })));
  };

  // Calculate average rating
  const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

// Removed duplicate StarRating component definition

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Performance Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Average Rating</h3>
          <div className="flex items-center mt-2">
            <StarRating rating={averageRating} />
            <span className="ml-2 text-2xl font-bold">{averageRating.toFixed(1)}/5</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Based on {reviews.length} reviews</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
          <p className="text-2xl font-bold mt-2">$24,780</p>
          <p className="text-sm text-green-500 mt-1">+12% from last month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Active Users</h3>
          <p className="text-2xl font-bold mt-2">1,248</p>
          <p className="text-sm text-green-500 mt-1">+8% from last month</p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sales & Revenue</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#4F46E5" name="Sales ($)" />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#F59E0B" name="Users" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Customer Reviews</h2>
        </div>
        
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{review.user}</h4>
                  <div className="flex items-center mt-1">
                    <StarRating rating={review.rating} />
                    <span className="ml-2 text-sm text-gray-500">{review.date}</span>
                  </div>
                </div>
                <button 
                  onClick={() => toggleReplyBox(review.id)}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-800 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  {review.reply ? 'Edit Reply' : 'Reply'}
                </button>
              </div>
              <p className="mt-2 text-gray-700">{review.comment}</p>
              
              {/* Reply Section */}
              {review.reply && (
                <div className="mt-3 pl-4 border-l-4 border-indigo-100">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-700">Your Reply</span>
                  </div>
                  {!review.showReplyBox ? (
                    <p className="mt-1 text-sm text-gray-600">{review.reply}</p>
                  ) : (
                    <div className="mt-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        rows={3}
                        placeholder="Write your reply here..."
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => toggleReplyBox(review.id)}
                          className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors shadow-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReplySubmit(review.id)}
                          className="px-4 py-1.5 bg-indigo-800 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                          disabled={!replyText.trim()}
                        >
                          {editingReplyId === review.id ? 'Update' : 'Send'} Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Reply Input Box */}
              {review.showReplyBox && !review.reply && (
                <div className="mt-3 pl-4 border-l-4 border-indigo-100">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Write a Reply</h5>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                    rows={3}
                    placeholder="Write your reply here..."
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => toggleReplyBox(review.id)}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 transition-colors shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReplySubmit(review.id)}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                      disabled={!replyText.trim()}
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalysis;