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
  FaChartBar
} from 'react-icons/fa';
import './AllRecord.css';

const AllRecord = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  // Get backend URL from environment variable or use Render URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 AllRecord using backend:', API_URL);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // User info
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  
  // Filter states - EXACT same as Feedback page
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Sorting - EXACT same as Feedback page
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Statistics
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalGST: 0,
    averageOrderValue: 0
  });

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (restaurantSlug) {
      fetchRestaurantInfo();
      fetchAllOrders();
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
    
    // If user is not authorized, redirect
    if (role !== 'owner' && role !== 'billing' && role !== 'admin') {
      setError('Access denied. This page is for authorized personnel only.');
      setLoading(false);
      navigate('/');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const fetchRestaurantInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedRestaurantName = localStorage.getItem('restaurantName');
      
      if (storedRestaurantName) {
        setRestaurantName(storedRestaurantName);
      }
      
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setRestaurantName(response.data.restaurantName);
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
      
      // CHANGED: Use full URL with API_URL
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
        averageOrderValue: 0
      });
      return;
    }
    
    const totalOrders = ordersData.length;
    const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalGST = ordersData.reduce((sum, order) => sum + (order.gstAmount || 0), 0);
    const averageOrderValue = totalRevenue / totalOrders;
    
    setStats({
      totalOrders,
      totalRevenue,
      totalGST,
      averageOrderValue
    });
  };

  // Filter functions - EXACT same pattern as Feedback page
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
    
    // Apply sorting - EXACT same as Feedback page
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
        return <span className="status-badge reviewed"><FaClock /> Preparing</span>;
      case 'completed':
        return <span className="status-badge resolved"><FaCheckCircle /> Completed</span>;
      case 'cancelled':
        return <span className="status-badge archived"><FaTimes /> Cancelled</span>;
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

  // Navigation Functions - EXACT same as Feedback page
  const handleNavigateToAdmin = () => {
    navigate(`/${restaurantSlug}/admin`);
  };

  const handleNavigateToAnalytics = () => {
    navigate(`/${restaurantSlug}/analytics`);
  };

  const handleNavigateToRecords = () => {
    navigate(`/${restaurantSlug}/records`);
  };

  const handleNavigateToFeedback = () => {
    navigate(`/${restaurantSlug}/feedback`);
  };

  const handleNavigateToDashboard = () => {
    navigate(`/${restaurantSlug}/dashboard`);
  };

  const handleRefresh = () => {
    fetchAllOrders();
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading orders data...</p>
      </div>
    );
  }

  return (
    <div className="records-container full-width">
      {/* Top Bar with Logout - EXACT same as Feedback page */}
      <div className="top-bar">
        <div className="user-info">
          <FaUserCircle className="user-icon" />
          <span className="user-name">{userName}</span>
          <span className="user-role">{userRole}</span>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Header - EXACT same as Feedback page */}
      <div className="records-header">
        <div className="header-content">
          <h1>
            <FaDatabase /> Order Records Dashboard
          </h1>
          <p className="subtitle">
            {userRole === 'admin' ? 'All Restaurants Orders' : `${restaurantName} - Order History`}
          </p>
        </div>
        <div className="header-right">
          <button className="refresh-button" onClick={handleRefresh}>
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Navigation Tabs - EXACT same as Feedback page */}
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
          className="nav-tab active-tab" 
          onClick={handleNavigateToRecords}
          title="Go to Records"
        >
          <FaDatabase />  Records
        </button>
        
        <button 
          className="nav-tab" 
          onClick={handleNavigateToFeedback}
          title="Go to Feedback"
        >
          <FaChartBar /> Feedback
        </button>
      </div>

      {/* Statistics Cards - EXACT same style as Feedback page */}
      <div className="stats-cards">
        <div className="stat-card total-orders">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-number">{stats.totalOrders}</p>
          </div>
        </div>
        
        <div className="stat-card total-revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-number">₹{stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="stat-card total-gst">
          <div className="stat-icon">🏛️</div>
          <div className="stat-content">
            <h3>Total GST</h3>
            <p className="stat-number">₹{stats.totalGST.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="stat-card avg-order">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Avg Order Value</h3>
            <p className="stat-number">₹{stats.averageOrderValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filters Section - EXACT same as Feedback page */}
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
        </div>
      </div>

      {/* Error Display - EXACT same as Feedback page */}
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Main Content - Table with sorting - EXACT same style as Feedback page */}
      <div className="records-content">
        {filteredOrders.length > 0 ? (
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('date')}>
                    Date/Time {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('billNumber')}>
                    Bill # {sortBy === 'billNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('customer')}>
                    Customer {sortBy === 'customer' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Table</th>
                  <th>Items</th>
                  <th onClick={() => handleSort('total')}>
                    Total {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order._id}>
                    <td>{formatDateTime(order.date, order.time)}</td>
                    <td>
                      <span className="bill-number">#{order.billNumber}</span>
                    </td>
                    <td>
                      <div className="customer-info">
                        <strong>{order.customerName || 'Guest'}</strong>
                        {order.gstNumber && (
                          <small>GST: {order.gstNumber}</small>
                        )}
                      </div>
                    </td>
                    <td>{order.tableNumber || '-'}</td>
                    <td>
                      <ul className="items-list">
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} × {item.quantity}
                            <small>₹{item.price}</small>
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
            <button
              className="reset-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateRange('all');
                setSelectedDate(null);
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllRecord;