import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  FaStar,
  FaStarHalfAlt,
  FaChartBar,
  FaDownload,
  FaFilter,
  FaSearch,
  FaTimes,
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaComment,
  FaReply,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaEyeSlash,
  FaBuilding,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPrint,
  FaWhatsapp,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaThumbsUp,
  FaThumbsDown,
  FaTachometerAlt,
  FaChartLine,
  FaDatabase,
  FaHome,
  FaSignOutAlt,
  FaUserCircle
} from 'react-icons/fa';
import './FeedbackPage.css';

const FeedbackPage = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  // Get backend URL from environment variable or use Render URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 FeedbackPage using backend:', API_URL);
  
  const [allFeedback, setAllFeedback] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // User info
  const [userRole, setUserRole] = useState('');
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [userName, setUserName] = useState('');
  
  // Filter states
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Statistics
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    restaurantsCount: 0,
    pendingCount: 0,
    resolvedCount: 0
  });
  
  // Grouped data
  const [groupedByRestaurant, setGroupedByRestaurant] = useState({});
  const [expandedRestaurants, setExpandedRestaurants] = useState({});
  
  // Modal states
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  
  // REMOVED: const API_BASE = 'http://localhost:5001/api';

  useEffect(() => {
    checkUserRole();
    fetchAllFeedback();
  }, []);

  useEffect(() => {
    if (restaurantSlug) {
      setSelectedRestaurant(restaurantSlug);
      fetchRestaurantDetails(restaurantSlug);
    }
  }, [restaurantSlug]);

  const checkUserRole = () => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName') || 'User';
    
    if (!token) {
      setError('Session expired. Please login again.');
      setLoading(false);
      navigate('/');
      return;
    }
    
    setUserRole(role);
    setUserName(name);
    
    // If user is not owner/admin, redirect
    if (role !== 'owner' && role !== 'admin') {
      setError('Access denied. This page is for owners and admins only.');
      setLoading(false);
      navigate('/');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const fetchRestaurantDetails = async (slug) => {
    try {
      const token = localStorage.getItem('token');
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${slug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setCurrentRestaurant(response.data);
      }
    } catch (error) {
      console.log('Could not fetch restaurant details:', error.message);
    }
  };

  const fetchAllFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      let response;
      
      if (userRole === 'admin') {
        // Admin can see all feedback from all restaurants
        // CHANGED: Use full URL with API_URL
        response = await axios.get(`${API_URL}/api/feedback/all`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 }
        });
      } else {
        // Regular owner can only see their restaurant's feedback
        const restaurantSlug = localStorage.getItem('restaurantSlug');
        // CHANGED: Use full URL with API_URL
        response = await axios.get(`${API_URL}/api/feedback/restaurant/${restaurantSlug}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 }
        });
      }
      
      if (response.data && response.data.success) {
        const feedbackData = response.data.feedback || [];
        setAllFeedback(feedbackData);
        
        // Group feedback by restaurant
        groupFeedbackByRestaurant(feedbackData);
        
        // Extract unique restaurants
        extractRestaurants(feedbackData);
        
        // Calculate statistics
        calculateStats(feedbackData);
        
        console.log(`📊 Loaded ${feedbackData.length} feedback records`);
      } else {
        setAllFeedback([]);
        setError('No feedback data available');
      }
      
    } catch (err) {
      console.error('❌ Error fetching feedback:', err);
      
      let errorMessage = 'Failed to load feedback data. ';
      
      if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        localStorage.clear();
        setTimeout(() => navigate('/'), 2000);
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view feedback.';
      } else if (err.response?.status === 404) {
        errorMessage = 'No feedback data found.';
        setAllFeedback([]);
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Server is not responding.';
      } else if (!err.response) {
        errorMessage = 'Cannot connect to server. Please check backend is running.';
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setAllFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  const groupFeedbackByRestaurant = (feedbackData) => {
    const grouped = {};
    
    feedbackData.forEach(feedback => {
      const key = feedback.restaurantSlug || feedback.restaurantCode;
      
      if (!grouped[key]) {
        grouped[key] = {
          restaurantName: feedback.restaurantName,
          restaurantCode: feedback.restaurantCode,
          restaurantSlug: feedback.restaurantSlug,
          feedbacks: [],
          stats: {
            total: 0,
            averageRating: 0,
            pending: 0,
            resolved: 0,
            lowRatings: 0
          }
        };
      }
      
      grouped[key].feedbacks.push(feedback);
      grouped[key].stats.total++;
      
      // Count status
      if (feedback.status === 'pending') {
        grouped[key].stats.pending++;
      } else if (feedback.status === 'resolved') {
        grouped[key].stats.resolved++;
      }
      
      // Count low ratings (3 stars or less)
      if (feedback.overallRating <= 3) {
        grouped[key].stats.lowRatings++;
      }
    });
    
    // Calculate average ratings for each restaurant
    Object.keys(grouped).forEach(key => {
      const restaurant = grouped[key];
      if (restaurant.feedbacks.length > 0) {
        const totalRating = restaurant.feedbacks.reduce((sum, fb) => sum + fb.overallRating, 0);
        restaurant.stats.averageRating = parseFloat((totalRating / restaurant.feedbacks.length).toFixed(1));
      }
    });
    
    setGroupedByRestaurant(grouped);
  };

  const extractRestaurants = (feedbackData) => {
    const restaurantMap = new Map();
    
    feedbackData.forEach(feedback => {
      const key = feedback.restaurantSlug || feedback.restaurantCode;
      if (!restaurantMap.has(key)) {
        restaurantMap.set(key, {
          slug: feedback.restaurantSlug,
          code: feedback.restaurantCode,
          name: feedback.restaurantName,
          count: 0
        });
      }
      
      const restaurant = restaurantMap.get(key);
      restaurant.count++;
    });
    
    const restaurantList = Array.from(restaurantMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    setRestaurants(restaurantList);
  };

  const calculateStats = (feedbackData) => {
    if (feedbackData.length === 0) {
      setStats({
        totalFeedback: 0,
        averageRating: 0,
        restaurantsCount: 0,
        pendingCount: 0,
        resolvedCount: 0
      });
      return;
    }
    
    const total = feedbackData.length;
    const avgRating = feedbackData.reduce((sum, fb) => sum + fb.overallRating, 0) / total;
    const restaurants = [...new Set(feedbackData.map(fb => fb.restaurantSlug))];
    const pendingCount = feedbackData.filter(fb => fb.status === 'pending').length;
    const resolvedCount = feedbackData.filter(fb => fb.status === 'resolved').length;
    
    setStats({
      totalFeedback: total,
      averageRating: parseFloat(avgRating.toFixed(1)),
      restaurantsCount: restaurants.length,
      pendingCount,
      resolvedCount
    });
  };

  const handleFilterChange = () => {
    // Filtering logic will be applied in getFilteredFeedback
  };

  const getFilteredFeedback = () => {
    let filtered = [...allFeedback];
    
    // Filter by restaurant
    if (selectedRestaurant !== 'all') {
      filtered = filtered.filter(fb => 
        fb.restaurantSlug === selectedRestaurant || 
        fb.restaurantCode === selectedRestaurant
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(fb => fb.status === statusFilter);
    }
    
    // Filter by rating
    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter);
      filtered = filtered.filter(fb => fb.overallRating >= minRating);
    }
    
    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(fb => {
        const feedbackDate = new Date(fb.submittedAt);
        return feedbackDate >= startDate;
      });
    }
    
    // Filter by specific date
    if (selectedDate) {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(fb => {
        const feedbackDate = new Date(fb.submittedAt).toISOString().split('T')[0];
        return feedbackDate === selectedDateStr;
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(fb =>
        fb.customerName?.toLowerCase().includes(term) ||
        fb.billNumber?.toString().toLowerCase().includes(term) ||
        fb.comments?.toLowerCase().includes(term) ||
        fb.restaurantName?.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.submittedAt) - new Date(a.submittedAt);
          break;
        case 'rating':
          comparison = b.overallRating - a.overallRating;
          break;
        case 'restaurant':
          comparison = a.restaurantName.localeCompare(b.restaurantName);
          break;
        case 'customer':
          comparison = (a.customerName || '').localeCompare(b.customerName || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const toggleRestaurantExpand = (restaurantKey) => {
    setExpandedRestaurants(prev => ({
      ...prev,
      [restaurantKey]: !prev[restaurantKey]
    }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="star-rating">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="star full" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="star half" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaStar key={`empty-${i}`} className="star empty" />
        ))}
        <span className="rating-number">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge pending"><FaClock /> Pending</span>;
      case 'reviewed':
        return <span className="status-badge reviewed"><FaEye /> Reviewed</span>;
      case 'resolved':
        return <span className="status-badge resolved"><FaCheckCircle /> Resolved</span>;
      case 'archived':
        return <span className="status-badge archived"><FaEyeSlash /> Archived</span>;
      default:
        return <span className="status-badge pending">Pending</span>;
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !selectedFeedback) return;
    
    setSubmittingResponse(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // CHANGED: Use full URL with API_URL
      const response = await axios.put(
        `${API_URL}/api/feedback/${selectedFeedback._id}/response`,
        { response: responseText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Update local state
        const updatedFeedback = allFeedback.map(fb => {
          if (fb._id === selectedFeedback._id) {
            return {
              ...fb,
              restaurantResponse: responseText,
              status: 'resolved',
              respondedAt: new Date().toISOString()
            };
          }
          return fb;
        });
        
        setAllFeedback(updatedFeedback);
        groupFeedbackByRestaurant(updatedFeedback);
        
        // Close modal
        setShowResponseModal(false);
        setSelectedFeedback(null);
        setResponseText('');
        
        alert('✅ Response submitted successfully!');
      }
    } catch (err) {
      console.error('❌ Error submitting response:', err);
      alert('Failed to submit response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleUpdateStatus = async (feedbackId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      // CHANGED: Use full URL with API_URL
      const response = await axios.put(
        `${API_URL}/api/feedback/${feedbackId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Update local state
        const updatedFeedback = allFeedback.map(fb => {
          if (fb._id === feedbackId) {
            return {
              ...fb,
              status: newStatus,
              updatedAt: new Date().toISOString()
            };
          }
          return fb;
        });
        
        setAllFeedback(updatedFeedback);
        groupFeedbackByRestaurant(updatedFeedback);
        
        alert(`✅ Status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('❌ Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleExportFeedback = () => {
    const filteredData = getFilteredFeedback();
    
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Create CSV content
    const headers = [
      'Restaurant Name', 'Restaurant Code', 'Bill Number', 'Customer Name',
      'Table', 'Order Date', 'Order Time', 'Service Rating', 'Food Rating',
      'Cleanliness Rating', 'Overall Rating', 'Comments', 'Status',
      'Submitted At', 'Restaurant Response', 'Customer Email', 'Customer Phone'
    ];
    
    const csvRows = filteredData.map(fb => [
      `"${fb.restaurantName}"`,
      fb.restaurantCode,
      fb.billNumber,
      `"${fb.customerName}"`,
      fb.tableNumber,
      fb.orderDate,
      fb.orderTime,
      fb.serviceRating,
      fb.foodRating,
      fb.cleanlinessRating,
      fb.overallRating,
      `"${(fb.comments || '').replace(/"/g, '""')}"`,
      fb.status,
      new Date(fb.submittedAt).toLocaleString(),
      `"${(fb.restaurantResponse || '').replace(/"/g, '""')}"`,
      fb.customerEmail || '',
      fb.customerPhone || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Navigation Functions
  const handleNavigateToAdmin = () => {
    const restaurantSlug = localStorage.getItem('restaurantSlug');
    if (restaurantSlug) {
      navigate(`/${restaurantSlug}/admin`);
    } else {
      navigate('/');
    }
  };
  
  const handleNavigateToFeedback = () => {
    navigate(`/${restaurantSlug}/feedback`);
  };
  
  const handleNavigateToAnalytics = () => {
    const restaurantSlug = localStorage.getItem('restaurantSlug');
    if (restaurantSlug) {
      navigate(`/${restaurantSlug}/analytics`);
    } else {
      navigate('/');
    }
  };

  const handleNavigateToRecords = () => {
    const restaurantSlug = localStorage.getItem('restaurantSlug');
    if (restaurantSlug) {
      navigate(`/${restaurantSlug}/records`);
    } else {
      navigate('/');
    }
  };

  const handleNavigateToDashboard = () => {
    const restaurantSlug = localStorage.getItem('restaurantSlug');
    if (restaurantSlug) {
      navigate(`/${restaurantSlug}/admin`);
    } else {
      navigate('/');
    }
  };

  const handleRefresh = () => {
    fetchAllFeedback();
  };

  const filteredFeedback = getFilteredFeedback();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading feedback data...</p>
      </div>
    );
  }

  return (
    <div className="feedback-container full-width">
      {/* Header */}
      <div className="feedback-header">
        <div className="header-content">
          <h1>
            <FaChartBar /> Customer Feedback Dashboard
            {currentRestaurant && ` - ${currentRestaurant.restaurantName}`}
          </h1>
          <p className="subtitle">
            {userRole === 'admin' ? 'All Restaurants Feedback' : 'Your Restaurant Feedback'}
          </p>
        </div>
        <div className="header-right">
         <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="navigation-tabs">
        <button 
          className="nav-tab" 
          onClick={handleNavigateToAdmin}
          title="Go to Admin Dashboard"
        >
          <FaTachometerAlt /> Admin Dashboard
        </button>
        
        <button 
          className="nav-tab" 
          onClick={handleNavigateToAnalytics}
          title="Go to Analytics"
        >
          <FaChartLine /> Analytics
        </button>
        
        <button 
          className="nav-tab " 
          onClick={handleNavigateToRecords}
          title="Go to Records"
        >
          <FaDatabase />  Records
        </button>
        <button 
				 className="nav-tab active-tab" 
				 onClick={handleNavigateToFeedback}
				 title="Go to Feedback"
			   >
				 <FaDatabase /> Feedback
			   </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card total-feedback">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Total Feedback</h3>
            <p className="stat-number">{stats.totalFeedback}</p>
          </div>
        </div>
        
        <div className="stat-card avg-rating">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Average Rating</h3>
            <p className="stat-number">{stats.averageRating}/5</p>
          </div>
        </div>
        
        {userRole === 'admin' && (
          <div className="stat-card restaurants-count">
            <div className="stat-icon">🏪</div>
            <div className="stat-content">
              <h3>Restaurants</h3>
              <p className="stat-number">{stats.restaurantsCount}</p>
            </div>
          </div>
        )}
        
        <div className="stat-card pending-feedback">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>Pending Review</h3>
            <p className="stat-number">{stats.pendingCount}</p>
          </div>
        </div>

        <div className="stat-card resolved-feedback">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Resolved</h3>
            <p className="stat-number">{stats.resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer, bill number, or comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className="filter-controls">
          {userRole === 'admin' && (
            <div className="filter-group">
              <label><FaBuilding /> Restaurant:</label>
              <select
                value={selectedRestaurant}
                onChange={(e) => setSelectedRestaurant(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Restaurants</option>
                {restaurants.map(rest => (
                  <option key={rest.slug || rest.code} value={rest.slug || rest.code}>
                    {rest.name} ({rest.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label><FaClock /> Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="filter-group">
            <label><FaStar /> Rating:</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Stars</option>
            </select>
          </div>

          <div className="filter-group">
            <label>📅 Date Range:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div className="filter-group date-picker">
            <button 
              className="date-button"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              {selectedDate ? formatDateOnly(selectedDate.toISOString()) : 'Select Date'}
            </button>
            {selectedDate && (
              <button className="clear-date" onClick={clearDateFilter}>
                <FaTimes />
              </button>
            )}
            {showCalendar && (
              <div className="calendar-popup">
                <Calendar onChange={handleDateChange} value={selectedDate} />
              </div>
            )}
          </div>

          <button
            className="export-btn"
            onClick={handleExportFeedback}
            disabled={filteredFeedback.length === 0}
          >
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Main Content - Grouped by Restaurant */}
      <div className="feedback-content">
        {userRole === 'admin' && Object.keys(groupedByRestaurant).length > 0 ? (
          <div className="restaurant-groups">
            {Object.keys(groupedByRestaurant)
              .filter(restKey => {
                if (selectedRestaurant === 'all') return true;
                return restKey === selectedRestaurant;
              })
              .map(restKey => {
                const restaurant = groupedByRestaurant[restKey];
                const restaurantFeedbacks = restaurant.feedbacks.filter(fb => {
                  if (statusFilter !== 'all' && fb.status !== statusFilter) return false;
                  if (ratingFilter !== 'all' && fb.overallRating < parseInt(ratingFilter)) return false;
                  if (searchTerm && !fb.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                      !fb.billNumber?.toString().toLowerCase().includes(searchTerm.toLowerCase()) &&
                      !fb.comments?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  return true;
                });

                if (restaurantFeedbacks.length === 0) return null;

                const isExpanded = expandedRestaurants[restKey];

                return (
                  <div key={restKey} className="restaurant-group">
                    <div 
                      className="restaurant-header"
                      onClick={() => toggleRestaurantExpand(restKey)}
                    >
                      <div className="restaurant-info">
                        <h3>
                          <FaBuilding /> {restaurant.restaurantName}
                          <span className="restaurant-code">({restaurant.restaurantCode})</span>
                        </h3>
                        <div className="restaurant-stats">
                          <span className="stat-item">
                            <FaStar /> Avg: {restaurant.stats.averageRating}/5
                          </span>
                          <span className="stat-item">
                            📝 Total: {restaurantFeedbacks.length}
                          </span>
                          <span className="stat-item pending">
                            ⏰ Pending: {restaurant.stats.pending}
                          </span>
                          <span className="stat-item low-rating">
                            <FaExclamationTriangle /> Low Ratings: {restaurant.stats.lowRatings}
                          </span>
                        </div>
                      </div>
                      <div className="expand-toggle">
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="restaurant-feedbacks">
                        <div className="table-responsive">
                          <table className="feedback-table">
                            <thead>
                              <tr>
                                <th onClick={() => handleSort('date')}>
                                  Date {sortBy === 'date' && (sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                                </th>
                                <th>Bill #</th>
                                <th>Customer</th>
                                <th onClick={() => handleSort('rating')}>
                                  Rating {sortBy === 'rating' && (sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                                </th>
                                <th>Comments</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {restaurantFeedbacks.map(feedback => (
                                <tr key={feedback._id}>
                                  <td>{formatDate(feedback.submittedAt)}</td>
                                  <td>
                                    <strong>#{feedback.billNumber}</strong>
                                    <small>{feedback.orderDate} {feedback.orderTime}</small>
                                  </td>
                                  <td>
                                    <div className="customer-info">
                                      <strong>{feedback.customerName || 'Guest'}</strong>
                                      {feedback.tableNumber && (
                                        <small>Table: {feedback.tableNumber}</small>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    {renderStars(feedback.overallRating)}
                                    <div className="detailed-ratings">
                                      <small>S: {feedback.serviceRating} | F: {feedback.foodRating} | C: {feedback.cleanlinessRating}</small>
                                    </div>
                                  </td>
                                  <td className="comments-cell">
                                    {feedback.comments ? (
                                      <div className="comment-preview">
                                        "{feedback.comments.substring(0, 60)}
                                        {feedback.comments.length > 60 ? '...' : ''}"
                                      </div>
                                    ) : (
                                      <span className="no-comment">No comments</span>
                                    )}
                                  </td>
                                  <td>{getStatusBadge(feedback.status)}</td>
                                  <td>
                                    <div className="action-buttons">
                                      <button
                                        className="view-btn"
                                        onClick={() => {
                                          setSelectedFeedback(feedback);
                                          setResponseText(feedback.restaurantResponse || '');
                                          setShowResponseModal(true);
                                        }}
                                      >
                                        <FaEye /> View & Respond
                                      </button>
                                      <select
                                        value={feedback.status}
                                        onChange={(e) => handleUpdateStatus(feedback._id, e.target.value)}
                                        className="status-select"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="archived">Archived</option>
                                      </select>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          // Single restaurant view or no grouped data
          <div className="feedback-table-container">
            {filteredFeedback.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="feedback-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('date')}>
                          Date {sortBy === 'date' && (sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                        </th>
                        <th>Bill #</th>
                        <th onClick={() => handleSort('customer')}>
                          Customer {sortBy === 'customer' && (sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                        </th>
                        <th onClick={() => handleSort('rating')}>
                          Rating {sortBy === 'rating' && (sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                        </th>
                        <th>Comments</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFeedback.map(feedback => (
                        <tr key={feedback._id}>
                          <td>{formatDate(feedback.submittedAt)}</td>
                          <td>
                            <strong>#{feedback.billNumber}</strong>
                            <small>{feedback.orderDate} {feedback.orderTime}</small>
                          </td>
                          <td>
                            <div className="customer-info">
                              <strong>{feedback.customerName || 'Guest'}</strong>
                              {feedback.tableNumber && (
                                <small>Table: {feedback.tableNumber}</small>
                              )}
                            </div>
                          </td>
                          <td>
                            {renderStars(feedback.overallRating)}
                            <div className="detailed-ratings">
                              <small>S: {feedback.serviceRating} | F: {feedback.foodRating} | C: {feedback.cleanlinessRating}</small>
                            </div>
                          </td>
                          <td className="comments-cell">
                            {feedback.comments ? (
                              <div className="comment-preview">
                                "{feedback.comments.substring(0, 60)}
                                {feedback.comments.length > 60 ? '...' : ''}"
                              </div>
                            ) : (
                              <span className="no-comment">No comments</span>
                            )}
                           </td>
                          <td>{getStatusBadge(feedback.status)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="view-btn"
                                onClick={() => {
                                  setSelectedFeedback(feedback);
                                  setResponseText(feedback.restaurantResponse || '');
                                  setShowResponseModal(true);
                                }}
                              >
                                <FaEye /> View & Respond
                              </button>
                              <select
                                value={feedback.status}
                                onChange={(e) => handleUpdateStatus(feedback._id, e.target.value)}
                                className="status-select"
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="resolved">Resolved</option>
                                <option value="archived">Archived</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="no-feedback">
                <div className="no-feedback-icon">📭</div>
                <h3>No Feedback Found</h3>
                <p>Try adjusting your filters or check back later.</p>
                <button
                  className="reset-filters-btn"
                  onClick={() => {
                    setSelectedRestaurant('all');
                    setStatusFilter('all');
                    setRatingFilter('all');
                    setDateRange('all');
                    setSelectedDate(null);
                    setSearchTerm('');
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedFeedback && (
        <div className="modal-overlay">
          <div className="response-modal">
            <div className="modal-header">
              <h3>
                <FaReply /> Respond to Feedback
              </h3>
              <button
                className="close-modal"
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedFeedback(null);
                  setResponseText('');
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-content">
              <div className="feedback-details">
                <h4>
                  {selectedFeedback.restaurantName} - Bill #{selectedFeedback.billNumber}
                </h4>
                <p><strong>Customer:</strong> {selectedFeedback.customerName || 'Guest'}</p>
                <p><strong>Date & Time:</strong> {selectedFeedback.orderDate} {selectedFeedback.orderTime}</p>
                <p><strong>Submitted:</strong> {formatDate(selectedFeedback.submittedAt)}</p>
                
                <div className="modal-ratings">
                  <div className="rating-item">
                    <span>Service:</span>
                    {renderStars(selectedFeedback.serviceRating)}
                  </div>
                  <div className="rating-item">
                    <span>Food:</span>
                    {renderStars(selectedFeedback.foodRating)}
                  </div>
                  <div className="rating-item">
                    <span>Cleanliness:</span>
                    {renderStars(selectedFeedback.cleanlinessRating)}
                  </div>
                  <div className="rating-item overall">
                    <span><strong>Overall Rating:</strong></span>
                    {renderStars(selectedFeedback.overallRating)}
                  </div>
                </div>
                
                {selectedFeedback.comments && (
                  <div className="modal-comments">
                    <strong>Customer Comments:</strong>
                    <p className="customer-comment">"{selectedFeedback.comments}"</p>
                  </div>
                )}
                
                {selectedFeedback.restaurantResponse && (
                  <div className="existing-response">
                    <strong>Previous Response:</strong>
                    <p>"{selectedFeedback.restaurantResponse}"</p>
                  </div>
                )}
              </div>

              <div className="response-editor">
                <label htmlFor="responseText">
                  <FaReply /> Your Response:
                </label>
                <textarea
                  id="responseText"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response to the customer here..."
                  rows={6}
                />
              </div>

              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedFeedback(null);
                    setResponseText('');
                  }}
                  disabled={submittingResponse}
                >
                  Cancel
                </button>
                <button
                  className="submit-btn"
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim() || submittingResponse}
                >
                  {submittingResponse ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;