// FeedbackPage.jsx
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
  FaSearch,
  FaTimes,
  FaEnvelope,
  FaPhone,
  FaComment,
  FaReply,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaEyeSlash,
  FaBuilding,
  FaSortUp,
  FaSortDown,
  FaWhatsapp,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaTachometerAlt,
  FaChartLine,
  FaDatabase,
  FaHome,
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaTimesCircle,
  FaSpinner,
  FaCalendarAlt
} from 'react-icons/fa';
import './FeedbackPage.css';

const FeedbackPage = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 FeedbackPage using backend:', API_URL);
  
  const [allFeedback, setAllFeedback] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // User info
  const [userRole, setUserRole] = useState('');
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
  
  // Section expansion
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    filters: true,
    feedback: true
  });
  
  // Statistics
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    restaurantsCount: 0,
    pendingCount: 0,
    resolvedCount: 0,
    lowRatingCount: 0
  });
  
  // Grouped data
  const [groupedByRestaurant, setGroupedByRestaurant] = useState({});
  const [expandedRestaurants, setExpandedRestaurants] = useState({});
  
  // Modal states
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (restaurantSlug) {
      fetchRestaurantData();
      fetchAllFeedback();
    }
  }, [restaurantSlug]);

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName') || 'User';
    const storedRestaurantSlug = localStorage.getItem('restaurantSlug');
    
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
    
    if (storedRestaurantSlug !== restaurantSlug && role !== 'admin') {
      navigate(`/${storedRestaurantSlug}/feedback`);
    }
  };

  // FIXED: Immediate logout without refresh needed
  const handleLogout = () => {
    console.log("🔓 Logging out from FeedbackPage...");
    
    // Clear all localStorage
    localStorage.clear();
    
    // Clear sessionStorage if any
    sessionStorage.clear();
    
    // Force immediate navigation with replace
    navigate("/", { replace: true });
    
    // Hard reload to ensure complete cleanup
    setTimeout(() => {
      window.location.href = "/";
    }, 50);
  };

  const fetchRestaurantData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setRestaurantData(response.data);
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
        response = await axios.get(`${API_URL}/api/feedback/all`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 }
        });
      } else {
        const restaurantSlug = localStorage.getItem('restaurantSlug');
        response = await axios.get(`${API_URL}/api/feedback/restaurant/${restaurantSlug}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 }
        });
      }
      
      if (response.data && response.data.success) {
        const feedbackData = response.data.feedback || [];
        setAllFeedback(feedbackData);
        groupFeedbackByRestaurant(feedbackData);
        extractRestaurants(feedbackData);
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
      
      if (feedback.status === 'pending') {
        grouped[key].stats.pending++;
      } else if (feedback.status === 'resolved') {
        grouped[key].stats.resolved++;
      }
      
      if (feedback.overallRating <= 3) {
        grouped[key].stats.lowRatings++;
      }
    });
    
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
        resolvedCount: 0,
        lowRatingCount: 0
      });
      return;
    }
    
    const total = feedbackData.length;
    const avgRating = feedbackData.reduce((sum, fb) => sum + fb.overallRating, 0) / total;
    const restaurants = [...new Set(feedbackData.map(fb => fb.restaurantSlug))];
    const pendingCount = feedbackData.filter(fb => fb.status === 'pending').length;
    const resolvedCount = feedbackData.filter(fb => fb.status === 'resolved').length;
    const lowRatingCount = feedbackData.filter(fb => fb.overallRating <= 3).length;
    
    setStats({
      totalFeedback: total,
      averageRating: parseFloat(avgRating.toFixed(1)),
      restaurantsCount: restaurants.length,
      pendingCount,
      resolvedCount,
      lowRatingCount
    });
  };

  const getFilteredFeedback = () => {
    let filtered = [...allFeedback];
    
    if (selectedRestaurant !== 'all') {
      filtered = filtered.filter(fb => 
        fb.restaurantSlug === selectedRestaurant || 
        fb.restaurantCode === selectedRestaurant
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(fb => fb.status === statusFilter);
    }
    
    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter);
      filtered = filtered.filter(fb => fb.overallRating >= minRating);
    }
    
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
    
    if (selectedDate) {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(fb => {
        const feedbackDate = new Date(fb.submittedAt).toISOString().split('T')[0];
        return feedbackDate === selectedDateStr;
      });
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(fb =>
        fb.customerName?.toLowerCase().includes(term) ||
        fb.billNumber?.toString().toLowerCase().includes(term) ||
        fb.comments?.toLowerCase().includes(term) ||
        fb.restaurantName?.toLowerCase().includes(term)
      );
    }
    
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
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
      
      const response = await axios.put(
        `${API_URL}/api/feedback/${selectedFeedback._id}/response`,
        { response: responseText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
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
      
      const response = await axios.put(
        `${API_URL}/api/feedback/${feedbackId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
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

  const handleRefresh = () => {
    fetchAllFeedback();
  };

  const resetFilters = () => {
    setSelectedRestaurant('all');
    setStatusFilter('all');
    setRatingFilter('all');
    setDateRange('all');
    setSelectedDate(null);
    setSearchTerm('');
  };

  // Navigation Functions
  const handleNavigateToAdmin = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/admin`);
  };
  
  const handleNavigateToAnalytics = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/analytics`);
  };

  const handleNavigateToRecords = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/records`);
  };

  const handleNavigateToDashboard = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/dashboard`);
  };

  const filteredFeedback = getFilteredFeedback();

  const navItems = [
    { icon: FaTachometerAlt, label: 'Admin Dashboard', action: handleNavigateToAdmin },
    { icon: FaChartLine, label: 'Analytics', action: handleNavigateToAnalytics },
    { icon: FaDatabase, label: 'Records', action: handleNavigateToRecords },
    { icon: FaChartBar, label: 'Feedback', action: handleNavigateToDashboard }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading feedback data...</p>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FaTimesCircle /> : <FaBars />}
      </button>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <h3>Menu</h3>
              <button onClick={() => setMobileMenuOpen(false)}>
                <FaTimes />
              </button>
            </div>
            {navItems.map((item, index) => (
              <button 
                key={index}
                className="mobile-nav-item"
                onClick={item.action}
              >
                <item.icon /> {item.label}
              </button>
            ))}
            <button className="mobile-nav-item logout" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="feedback-header">
        <div className="header-content">
          <h1>
            <FaChartBar /> Customer Feedback
          </h1>
          <p className="subtitle">
            {restaurantData?.restaurantName} • {restaurantData?.restaurantCode}
          </p>
        </div>
        <div className="header-right desktop-only">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="navigation-tabs desktop-only">
        {navItems.map((item, index) => (
          <button 
            key={index}
            className={`nav-tab ${item.label === 'Feedback' ? 'active' : ''}`}
            onClick={item.action}
          >
            <item.icon /> {item.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Statistics Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('stats')}>
          <h2><FaChartBar /> Key Metrics</h2>
          <button className="expand-toggle">
            {expandedSections.stats ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.stats && (
          <div className="summary-cards">
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <h3>Total Feedback</h3>
                <p className="stat-number">{stats.totalFeedback}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <h3>Average Rating</h3>
                <p className="stat-number">{stats.averageRating}/5</p>
              </div>
            </div>
            
            {userRole === 'admin' && (
              <div className="stat-card">
                <div className="stat-icon">🏪</div>
                <div className="stat-content">
                  <h3>Restaurants</h3>
                  <p className="stat-number">{stats.restaurantsCount}</p>
                </div>
              </div>
            )}
            
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-content">
                <h3>Pending Review</h3>
                <p className="stat-number">{stats.pendingCount}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Resolved</h3>
                <p className="stat-number">{stats.resolvedCount}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>Low Ratings (≤3)</h3>
                <p className="stat-number">{stats.lowRatingCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('filters')}>
          <h2><FaSearch /> Filters & Search</h2>
          <button className="expand-toggle">
            {expandedSections.filters ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.filters && (
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
                  <FaCalendarAlt /> {selectedDate ? formatDateOnly(selectedDate.toISOString()) : 'Select Date'}
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

              {(searchTerm || statusFilter !== 'all' || ratingFilter !== 'all' || dateRange !== 'all' || selectedDate || selectedRestaurant !== 'all') && (
                <button className="reset-filters-btn" onClick={resetFilters}>
                  <FaTimes /> Reset Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Content Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('feedback')}>
          <h2><FaComment /> Customer Feedback</h2>
          <div className="header-actions">
            <button className="refresh-btn-small" onClick={handleRefresh}>
              <FaSpinner className={loading ? 'spinner' : ''} /> Refresh
            </button>
            <button className="expand-toggle">
              {expandedSections.feedback ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>
        
        {expandedSections.feedback && (
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
                      <div key={restKey} className="restaurant-group-card">
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
                              <span className="stat-badge rating">
                                <FaStar /> {restaurant.stats.averageRating}/5
                              </span>
                              <span className="stat-badge total">
                                📝 {restaurantFeedbacks.length}
                              </span>
                              <span className="stat-badge pending">
                                ⏰ {restaurant.stats.pending}
                              </span>
                              <span className="stat-badge warning">
                                ⚠️ {restaurant.stats.lowRatings}
                              </span>
                            </div>
                          </div>
                          <div className="expand-toggle-icon">
                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="restaurant-feedbacks">
                            <div className="table-responsive">
                              <table className="feedback-table">
                                <thead>
                                  <tr>
                                    <th onClick={() => handleSort('date')} className="sortable">
                                      Date {sortBy === 'date' && (sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                                    </th>
                                    <th>Bill #</th>
                                    <th onClick={() => handleSort('customer')} className="sortable">
                                      Customer {sortBy === 'customer' && (sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                                    </th>
                                    <th onClick={() => handleSort('rating')} className="sortable">
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
                                      <td className="date-cell">{formatDate(feedback.submittedAt)}</td>
                                      <td>
                                        <span className="bill-number">#{feedback.billNumber}</span>
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
                                            <FaEye /> Respond
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
              <div className="feedback-table-container">
                {filteredFeedback.length > 0 ? (
                  <div className="table-responsive">
                    <table className="feedback-table">
                      <thead>
                        <tr>
                          <th onClick={() => handleSort('date')} className="sortable">
                            Date {sortBy === 'date' && (sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                          </th>
                          <th>Bill #</th>
                          <th onClick={() => handleSort('customer')} className="sortable">
                            Customer {sortBy === 'customer' && (sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                          </th>
                          <th onClick={() => handleSort('rating')} className="sortable">
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
                            <td className="date-cell">{formatDate(feedback.submittedAt)}</td>
                            <td>
                              <span className="bill-number">#{feedback.billNumber}</span>
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
                                  <FaEye /> Respond
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
                ) : (
                  <div className="no-feedback">
                    <div className="no-feedback-icon">📭</div>
                    <h3>No Feedback Found</h3>
                    <p>Try adjusting your filters or check back later.</p>
                    <button className="reset-filters-btn" onClick={resetFilters}>
                      Reset All Filters
                    </button>
                  </div>
                )}
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
                  {submittingResponse ? <><FaSpinner className="spinner" /> Submitting...</> : 'Submit Response'}
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