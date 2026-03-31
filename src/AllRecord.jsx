// AllRecord.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaChartLine,
  FaDatabase,
  FaHome,
  FaSignOutAlt,
  FaUserCircle,
  FaBuilding,
  FaSearch,
  FaTimes,
  FaDownload,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaStar,
  FaStarHalfAlt,
  FaChartBar,
  FaBars,
  FaTimesCircle,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaEye
} from 'react-icons/fa';
import './AllRecord.css';

const AllRecord = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 AllRecord using backend:', API_URL);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // User info
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Sorting
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Section expansion
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    filters: true,
    table: true
  });
  
  // Statistics
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalGST: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  });

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (restaurantSlug) {
      fetchRestaurantData();
      fetchAllOrders();
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
    
    // If user is not authorized, redirect
    if (role !== 'owner' && role !== 'billing' && role !== 'admin') {
      setError('Access denied. This page is for authorized personnel only.');
      setLoading(false);
      navigate('/');
    }
    
    if (storedRestaurantSlug !== restaurantSlug) {
      navigate(`/${storedRestaurantSlug}/records`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const fetchRestaurantData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setRestaurantData(response.data);
        localStorage.setItem('restaurantName', response.data.restaurantName);
      }
    } catch (error) {
      console.log('Could not fetch restaurant details:', error.message);
    }
  };

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const restaurantCode = localStorage.getItem('restaurantCode');
      
      const response = await axios.get(`${API_URL}/api/order/${restaurantCode}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      if (response.data && Array.isArray(response.data)) {
        const processedOrders = response.data.map(order => {
          const subtotal = order.subtotal || order.items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);
          const gstAmount = order.gstAmount || order.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity * (item.gstPercentage || 18) / 100);
          }, 0);
          const total = subtotal + gstAmount;
          
          return {
            ...order,
            subtotal,
            gstAmount,
            total
          };
        });
        
        setOrders(processedOrders);
        calculateStats(processedOrders);
      } else {
        setOrders([]);
      }
      
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      
      let errorMessage = 'Failed to load orders. ';
      
      if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        localStorage.clear();
        setTimeout(() => navigate('/'), 2000);
      } else if (err.response?.status === 404) {
        errorMessage = 'No orders found.';
        setOrders([]);
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Server is not responding.';
      } else if (!err.response) {
        errorMessage = 'Cannot connect to server. Please check backend is running.';
      }
      
      setError(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    if (ordersData.length === 0) {
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        totalGST: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        preparingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0
      });
      return;
    }
    
    const totalOrders = ordersData.length;
    const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalGST = ordersData.reduce((sum, order) => sum + (order.gstAmount || 0), 0);
    const averageOrderValue = totalRevenue / totalOrders;
    
    const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
    const preparingOrders = ordersData.filter(order => order.status === 'preparing').length;
    const completedOrders = ordersData.filter(order => order.status === 'completed').length;
    const cancelledOrders = ordersData.filter(order => order.status === 'cancelled').length;
    
    setStats({
      totalOrders,
      totalRevenue,
      totalGST,
      averageOrderValue,
      pendingOrders,
      preparingOrders,
      completedOrders,
      cancelledOrders
    });
  };

  // Filter functions
  const getFilteredOrders = () => {
    let filtered = [...orders];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
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
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= startDate;
      });
    }
    
    // Filter by specific date
    if (selectedDate) {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(order => order.date === selectedDateStr);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.billNumber?.toString().toLowerCase().includes(term) ||
        order.customerName?.toLowerCase().includes(term) ||
        order.tableNumber?.toString().toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.date) - new Date(a.date);
          break;
        case 'billNumber':
          comparison = a.billNumber - b.billNumber;
          break;
        case 'total':
          comparison = b.total - a.total;
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
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString, timeString) => {
    return `${formatDate(dateString)} ${timeString}`;
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <span className="status-badge pending"><FaClock /> Pending</span>;
      case 'preparing':
        return <span className="status-badge preparing"><FaClock /> Preparing</span>;
      case 'completed':
        return <span className="status-badge completed"><FaCheckCircle /> Completed</span>;
      case 'cancelled':
        return <span className="status-badge cancelled"><FaTimes /> Cancelled</span>;
      default:
        return <span className="status-badge pending">Pending</span>;
    }
  };

  const handleExportCSV = () => {
    const filteredOrders = getFilteredOrders();
    
    if (filteredOrders.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = [
      'Bill Number', 'Date', 'Time', 'Customer Name', 'Table Number',
      'GST Number', 'Status', 'Items', 'Subtotal', 'GST Amount', 'Total'
    ];
    
    const csvRows = filteredOrders.map(order => [
      order.billNumber,
      order.date,
      order.time,
      `"${order.customerName || 'Guest'}"`,
      order.tableNumber || '-',
      order.gstNumber || '-',
      order.status || 'pending',
      `"${order.items.map(item => `${item.name}(${item.quantity})`).join(', ')}"`,
      order.subtotal?.toFixed(2) || '0.00',
      order.gstAmount?.toFixed(2) || '0.00',
      order.total?.toFixed(2) || '0.00'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${restaurantSlug}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  const handleNavigateToFeedback = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/feedback`);
  };


  const handleRefresh = () => {
    fetchAllOrders();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange('all');
    setSelectedDate(null);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredOrders = getFilteredOrders();

  const navItems = [
    { icon: FaTachometerAlt, label: 'Admin Dashboard', action: handleNavigateToAdmin },
    { icon: FaChartLine, label: 'Analytics', action: handleNavigateToAnalytics },
    { icon: FaDatabase, label: 'Records', action: handleNavigateToRecords },
    { icon: FaEye, label: 'Feedback', action: handleNavigateToFeedback },
   
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading orders data...</p>
      </div>
    );
  }

  return (
    <div className="records-container">
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
      <div className="records-header">
        <div className="header-content">
          <h1>
            <FaDatabase /> Order Records
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
            className={`nav-tab ${item.label === 'Records' ? 'active' : ''}`}
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
          <>
            <div className="summary-cards">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>Total Orders</h3>
                  <p className="stat-number">{stats.totalOrders}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Total Revenue</h3>
                  <p className="stat-number">₹{stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🏛️</div>
                <div className="stat-content">
                  <h3>Total GST</h3>
                  <p className="stat-number">₹{stats.totalGST.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Avg Order Value</h3>
                  <p className="stat-number">₹{stats.averageOrderValue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="status-cards">
              <div className="status-card pending">
                <FaClock className="status-icon" />
                <div className="status-info">
                  <h4>Pending</h4>
                  <p className="status-count">{stats.pendingOrders}</p>
                </div>
              </div>
              
              <div className="status-card preparing">
                <FaClock className="status-icon" />
                <div className="status-info">
                  <h4>Preparing</h4>
                  <p className="status-count">{stats.preparingOrders}</p>
                </div>
              </div>
              
              <div className="status-card completed">
                <FaCheckCircle className="status-icon" />
                <div className="status-info">
                  <h4>Completed</h4>
                  <p className="status-count">{stats.completedOrders}</p>
                </div>
              </div>
              
              <div className="status-card cancelled">
                <FaTimes className="status-icon" />
                <div className="status-info">
                  <h4>Cancelled</h4>
                  <p className="status-count">{stats.cancelledOrders}</p>
                </div>
              </div>
            </div>
          </>
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
                placeholder="Search by bill number, customer, or table..."
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
              <div className="filter-group">
                <label><FaClock /> Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
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
                  <FaCalendarAlt /> {selectedDate ? formatDate(selectedDate) : 'Select Date'}
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
                onClick={handleExportCSV}
                disabled={filteredOrders.length === 0}
              >
                <FaDownload /> Export CSV
              </button>

              {(searchTerm || statusFilter !== 'all' || dateRange !== 'all' || selectedDate) && (
                <button className="reset-filters-btn" onClick={resetFilters}>
                  <FaTimes /> Reset Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Orders Table Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('table')}>
          <h2><FaDatabase /> Order Details</h2>
          <div className="header-actions">
            <button className="refresh-btn-small" onClick={handleRefresh}>
              <FaSpinner className={loading ? 'spinner' : ''} /> Refresh
            </button>
            <button className="expand-toggle">
              {expandedSections.table ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>
        
        {expandedSections.table && (
          <div className="records-content">
            {filteredOrders.length > 0 ? (
              <div className="table-responsive">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('date')} className="sortable">
                        Date/Time {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('billNumber')} className="sortable">
                        Bill # {sortBy === 'billNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('customer')} className="sortable">
                        Customer {sortBy === 'customer' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Table</th>
                      <th>Items</th>
                      <th onClick={() => handleSort('total')} className="sortable">
                        Total {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order._id}>
                        <td className="date-cell">{formatDateTime(order.date, order.time)}</td>
                        <td>
                          <span className="bill-number">#{order.billNumber}</span>
                        </td>
                        <td>
                          <div className="customer-info">
                            <strong>{order.customerName || 'Guest'}</strong>
                            {order.gstNumber && (
                              <small className="gst-number">GST: {order.gstNumber}</small>
                            )}
                          </div>
                        </td>
                        <td className="table-number">{order.tableNumber || '-'}</td>
                        <td>
                          <ul className="items-list">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                <span className="item-name">{item.name}</span>
                                <span className="item-quantity">×{item.quantity}</span>
                                <span className="item-price">₹{item.price}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="amount-cell">₹{order.total?.toFixed(2)}</td>
                        <td>{getStatusBadge(order.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-records">
                <div className="no-records-icon">📭</div>
                <h3>No Orders Found</h3>
                <p>Try adjusting your filters or check back later.</p>
                <button className="reset-filters-btn" onClick={resetFilters}>
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllRecord;