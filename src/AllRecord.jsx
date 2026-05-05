//import React, { useEffect, useState } from 'react';
//import axios from 'axios';
//import Calendar from 'react-calendar';
//import 'react-calendar/dist/Calendar.css';
//import { useParams, useNavigate } from 'react-router-dom';
//import {
//  FaTachometerAlt,
//  FaChartLine,
//  FaDatabase,
//  FaHome,
//  FaSignOutAlt,
//  FaUserCircle,
//  FaBuilding,
//  FaSearch,
//  FaTimes,
//  FaDownload,
//  FaClock,
//  FaCheckCircle,
//  FaExclamationTriangle,
//  FaCalendarAlt,
//  FaStar,
//  FaStarHalfAlt,
//  FaChartBar,
//  FaBars,
//  FaTimesCircle,
//  FaSpinner,
//  FaChevronDown,
//  FaChevronUp,
//  FaEye,
//  FaWallet,
//  FaCreditCard,
//  FaMoneyBill,
//  FaMobileAlt,
//  FaFilter,
//  FaChartPie
//} from 'react-icons/fa';
//import './AllRecord.css';
//
//const AllRecord = () => {
//  const { restaurantSlug } = useParams();
//  const navigate = useNavigate();
//  
//  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
//  
//  console.log('🔧 AllRecord using backend:', API_URL);
//  
//  const [orders, setOrders] = useState([]);
//  const [loading, setLoading] = useState(true);
//  const [error, setError] = useState(null);
//  const [restaurantData, setRestaurantData] = useState(null);
//  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//  
//  // User info
//  const [userRole, setUserRole] = useState('');
//  const [userName, setUserName] = useState('');
//  
//  // Filter states
//  const [searchTerm, setSearchTerm] = useState('');
//  const [selectedDate, setSelectedDate] = useState(null);
//  const [dateRange, setDateRange] = useState('all');
//  const [showCalendar, setShowCalendar] = useState(false);
//  const [statusFilter, setStatusFilter] = useState('all');
//  const [paymentFilter, setPaymentFilter] = useState('all');
//  const [startDate, setStartDate] = useState('');
//  const [endDate, setEndDate] = useState('');
//  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
//  
//  // Sorting
//  const [sortBy, setSortBy] = useState('date');
//  const [sortOrder, setSortOrder] = useState('desc');
//  
//  // Section expansion
//  const [expandedSections, setExpandedSections] = useState({
//    stats: true,
//    paymentStats: true,
//    filters: true,
//    table: true
//  });
//  
//  // Active filter indicator
//  const [activePaymentFilter, setActivePaymentFilter] = useState(null);
//  
//  // Statistics
//  const [stats, setStats] = useState({
//    totalOrders: 0,
//    totalRevenue: 0,
//    totalGST: 0,
//    averageOrderValue: 0,
//    pendingOrders: 0,
//    preparingOrders: 0,
//    completedOrders: 0,
//    cancelledOrders: 0,
//    upiPayments: { count: 0, amount: 0 },
//    cashPayments: { count: 0, amount: 0 },
//    pendingPayments: { count: 0, amount: 0 }
//  });
//
//  useEffect(() => {
//    checkAuthentication();
//  }, []);
//
//  useEffect(() => {
//    if (restaurantSlug) {
//      fetchRestaurantData();
//      fetchAllOrders();
//    }
//  }, [restaurantSlug]);
//
//  const checkAuthentication = () => {
//    const token = localStorage.getItem('token');
//    const role = localStorage.getItem('userRole');
//    const name = localStorage.getItem('userName') || 'User';
//    const storedRestaurantSlug = localStorage.getItem('restaurantSlug');
//    
//    if (!token) {
//      setError('Session expired. Please login again.');
//      setLoading(false);
//      navigate('/');
//      return;
//    }
//    
//    setUserRole(role);
//    setUserName(name);
//    
//    if (role !== 'owner' && role !== 'billing' && role !== 'admin') {
//      setError('Access denied. This page is for authorized personnel only.');
//      setLoading(false);
//      navigate('/');
//    }
//    
//    if (storedRestaurantSlug !== restaurantSlug) {
//      navigate(`/${storedRestaurantSlug}/records`);
//    }
//  };
//
//  const handleLogout = () => {
//    console.log("🔓 Logging out from AllRecord...");
//    localStorage.clear();
//    sessionStorage.clear();
//    navigate("/", { replace: true });
//    setTimeout(() => {
//      window.location.href = "/";
//    }, 50);
//  };
//
//  const fetchRestaurantData = async () => {
//    try {
//      const token = localStorage.getItem('token');
//      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`, {
//        headers: { Authorization: `Bearer ${token}` }
//      });
//      
//      if (response.data) {
//        setRestaurantData(response.data);
//        localStorage.setItem('restaurantName', response.data.restaurantName);
//      }
//    } catch (error) {
//      console.log('Could not fetch restaurant details:', error.message);
//    }
//  };
//
//  const fetchAllOrders = async () => {
//    try {
//      setLoading(true);
//      setError(null);
//      
//      const token = localStorage.getItem('token');
//      const restaurantCode = localStorage.getItem('restaurantCode');
//      
//      const response = await axios.get(`${API_URL}/api/order/${restaurantCode}/orders`, {
//        headers: { Authorization: `Bearer ${token}` },
//        timeout: 10000
//      });
//      
//      if (response.data && Array.isArray(response.data)) {
//        const processedOrders = response.data.map(order => {
//          const subtotal = order.subtotal || order.items.reduce((sum, item) => 
//            sum + (item.price * item.quantity), 0);
//          const gstAmount = order.gstAmount || order.items.reduce((sum, item) => {
//            return sum + (item.price * item.quantity * (item.gstPercentage || 18) / 100);
//          }, 0);
//          const total = subtotal + gstAmount;
//          
//          return {
//            ...order,
//            subtotal,
//            gstAmount,
//            total
//          };
//        });
//        
//        setOrders(processedOrders);
//        calculateStats(processedOrders);
//      } else {
//        setOrders([]);
//      }
//      
//    } catch (err) {
//      console.error('❌ Error fetching orders:', err);
//      
//      let errorMessage = 'Failed to load orders. ';
//      
//      if (err.response?.status === 401) {
//        errorMessage = 'Session expired. Please login again.';
//        localStorage.clear();
//        setTimeout(() => navigate('/'), 2000);
//      } else if (err.response?.status === 404) {
//        errorMessage = 'No orders found.';
//        setOrders([]);
//      } else if (err.code === 'ECONNABORTED') {
//        errorMessage = 'Request timeout. Server is not responding.';
//      } else if (!err.response) {
//        errorMessage = 'Cannot connect to server. Please check backend is running.';
//      }
//      
//      setError(errorMessage);
//      setOrders([]);
//    } finally {
//      setLoading(false);
//    }
//  };
//
//  const calculateStats = (ordersData) => {
//    if (ordersData.length === 0) {
//      setStats({
//        totalOrders: 0,
//        totalRevenue: 0,
//        totalGST: 0,
//        averageOrderValue: 0,
//        pendingOrders: 0,
//        preparingOrders: 0,
//        completedOrders: 0,
//        cancelledOrders: 0,
//        upiPayments: { count: 0, amount: 0 },
//        cashPayments: { count: 0, amount: 0 },
//        pendingPayments: { count: 0, amount: 0 }
//      });
//      return;
//    }
//    
//    const totalOrders = ordersData.length;
//    const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
//    const totalGST = ordersData.reduce((sum, order) => sum + (order.gstAmount || 0), 0);
//    const averageOrderValue = totalRevenue / totalOrders;
//    
//    const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
//    const preparingOrders = ordersData.filter(order => order.status === 'preparing').length;
//    const completedOrders = ordersData.filter(order => order.status === 'completed').length;
//    const cancelledOrders = ordersData.filter(order => order.status === 'cancelled').length;
//    
//    // Calculate payment statistics
//    let upiCount = 0, upiAmount = 0;
//    let cashCount = 0, cashAmount = 0;
//    let pendingCount = 0, pendingAmount = 0;
//    
//    ordersData.forEach(order => {
//      const orderTotal = order.total || 0;
//      const paymentMethod = order.paymentMethod?.toLowerCase() || 'pending';
//      const paymentStatus = order.paymentStatus?.toLowerCase() || 'pending';
//      
//      if (paymentMethod === 'upi' && paymentStatus === 'paid') {
//        upiCount++;
//        upiAmount += orderTotal;
//      } else if (paymentMethod === 'cash' && paymentStatus === 'paid') {
//        cashCount++;
//        cashAmount += orderTotal;
//      } else {
//        pendingCount++;
//        pendingAmount += orderTotal;
//      }
//    });
//    
//    setStats({
//      totalOrders,
//      totalRevenue,
//      totalGST,
//      averageOrderValue,
//      pendingOrders,
//      preparingOrders,
//      completedOrders,
//      cancelledOrders,
//      upiPayments: { count: upiCount, amount: upiAmount },
//      cashPayments: { count: cashCount, amount: cashAmount },
//      pendingPayments: { count: pendingCount, amount: pendingAmount }
//    });
//  };
//
//  // Function to apply payment filter from clicking on stat card
//  const applyPaymentFilter = (filterType) => {
//    if (activePaymentFilter === filterType) {
//      // If already active, clear the filter
//      setPaymentFilter('all');
//      setActivePaymentFilter(null);
//    } else {
//      // Apply the new filter
//      setPaymentFilter(filterType);
//      setActivePaymentFilter(filterType);
//    }
//    // Close mobile menu if open
//    setMobileMenuOpen(false);
//  };
//
//  // Get filtered orders with all filters
//  const getFilteredOrders = () => {
//    let filtered = [...orders];
//    
//    // Filter by status
//    if (statusFilter !== 'all') {
//      filtered = filtered.filter(order => order.status === statusFilter);
//    }
//    
//    // Filter by payment method
//    if (paymentFilter !== 'all') {
//      filtered = filtered.filter(order => {
//        const paymentMethod = order.paymentMethod?.toLowerCase() || 'pending';
//        const paymentStatus = order.paymentStatus?.toLowerCase() || 'pending';
//        
//        if (paymentFilter === 'upi') {
//          return paymentMethod === 'upi' && paymentStatus === 'paid';
//        } else if (paymentFilter === 'cash') {
//          return paymentMethod === 'cash' && paymentStatus === 'paid';
//        } else if (paymentFilter === 'pending') {
//          return paymentStatus !== 'paid';
//        }
//        return true;
//      });
//    }
//    
//    // Filter by date range (preset)
//    if (dateRange !== 'all' && !startDate && !endDate) {
//      const now = new Date();
//      let startDateObj = new Date();
//      
//      switch (dateRange) {
//        case 'today':
//          startDateObj.setHours(0, 0, 0, 0);
//          break;
//        case 'week':
//          startDateObj.setDate(now.getDate() - 7);
//          break;
//        case 'month':
//          startDateObj.setMonth(now.getMonth() - 1);
//          break;
//        case 'year':
//          startDateObj.setFullYear(now.getFullYear() - 1);
//          break;
//        default:
//          startDateObj = null;
//      }
//      
//      if (startDateObj) {
//        filtered = filtered.filter(order => {
//          const orderDate = new Date(order.date);
//          return orderDate >= startDateObj;
//        });
//      }
//    }
//    
//    // Filter by custom date range
//    if (startDate && endDate) {
//      const start = new Date(startDate);
//      const end = new Date(endDate);
//      end.setHours(23, 59, 59, 999);
//      
//      filtered = filtered.filter(order => {
//        const orderDate = new Date(order.date);
//        return orderDate >= start && orderDate <= end;
//      });
//    }
//    
//    // Filter by specific date
//    if (selectedDate && !startDate) {
//      const selectedDateStr = selectedDate.toISOString().split('T')[0];
//      filtered = filtered.filter(order => order.date === selectedDateStr);
//    }
//    
//    // Filter by search term
//    if (searchTerm) {
//      const term = searchTerm.toLowerCase();
//      filtered = filtered.filter(order =>
//        order.billNumber?.toString().toLowerCase().includes(term) ||
//        order.customerName?.toLowerCase().includes(term) ||
//        order.tableNumber?.toString().toLowerCase().includes(term)
//      );
//    }
//    
//    // Apply sorting
//    filtered.sort((a, b) => {
//      let comparison = 0;
//      
//      switch (sortBy) {
//        case 'date':
//          comparison = new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time);
//          break;
//        case 'billNumber':
//          comparison = a.billNumber - b.billNumber;
//          break;
//        case 'total':
//          comparison = (b.total || 0) - (a.total || 0);
//          break;
//        case 'customer':
//          comparison = (a.customerName || '').localeCompare(b.customerName || '');
//          break;
//        default:
//          comparison = 0;
//      }
//      
//      return sortOrder === 'desc' ? comparison : -comparison;
//    });
//    
//    return filtered;
//  };
//
//  // Get filtered stats for current filters
//  const getFilteredStats = () => {
//    const filteredOrders = getFilteredOrders();
//    let upiCount = 0, upiAmount = 0;
//    let cashCount = 0, cashAmount = 0;
//    let pendingCount = 0, pendingAmount = 0;
//    
//    filteredOrders.forEach(order => {
//      const orderTotal = order.total || 0;
//      const paymentMethod = order.paymentMethod?.toLowerCase() || 'pending';
//      const paymentStatus = order.paymentStatus?.toLowerCase() || 'pending';
//      
//      if (paymentMethod === 'upi' && paymentStatus === 'paid') {
//        upiCount++;
//        upiAmount += orderTotal;
//      } else if (paymentMethod === 'cash' && paymentStatus === 'paid') {
//        cashCount++;
//        cashAmount += orderTotal;
//      } else {
//        pendingCount++;
//        pendingAmount += orderTotal;
//      }
//    });
//    
//    return {
//      upiPayments: { count: upiCount, amount: upiAmount },
//      cashPayments: { count: cashCount, amount: cashAmount },
//      pendingPayments: { count: pendingCount, amount: pendingAmount },
//      totalCollection: upiAmount + cashAmount
//    };
//  };
//
//  const handleSort = (column) => {
//    if (sortBy === column) {
//      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
//    } else {
//      setSortBy(column);
//      setSortOrder('desc');
//    }
//  };
//
//  const handleDateChange = (date) => {
//    setSelectedDate(date);
//    setShowCalendar(false);
//    setStartDate('');
//    setEndDate('');
//    setDateRange('all');
//  };
//
//  const handleCustomDateRange = () => {
//    if (startDate && endDate) {
//      setSelectedDate(null);
//      setDateRange('all');
//      setShowDateRangePicker(false);
//    }
//  };
//
//  const clearDateFilter = () => {
//    setSelectedDate(null);
//    setStartDate('');
//    setEndDate('');
//    setDateRange('all');
//  };
//
//  const formatDate = (dateString) => {
//    const date = new Date(dateString);
//    return date.toLocaleDateString('en-US', {
//      year: 'numeric',
//      month: 'short',
//      day: 'numeric'
//    });
//  };
//
//  const formatDateTime = (dateString, timeString) => {
//    return `${formatDate(dateString)} ${timeString}`;
//  };
//
//  const getStatusBadge = (status) => {
//    switch (status?.toLowerCase()) {
//      case 'pending':
//        return <span className="status-badge pending"><FaClock /> Pending</span>;
//      case 'preparing':
//        return <span className="status-badge preparing"><FaClock /> Preparing</span>;
//      case 'completed':
//        return <span className="status-badge completed"><FaCheckCircle /> Completed</span>;
//      case 'cancelled':
//        return <span className="status-badge cancelled"><FaTimes /> Cancelled</span>;
//      default:
//        return <span className="status-badge pending">Pending</span>;
//    }
//  };
//
//  const getPaymentBadge = (paymentMethod, paymentStatus) => {
//    const method = (paymentMethod || 'pending').toLowerCase();
//    const status = (paymentStatus || 'pending').toLowerCase();
//    
//    if (method === 'upi' && status === 'paid') {
//      return <span className="payment-badge upi-paid"><FaMobileAlt /> UPI Paid</span>;
//    } else if (method === 'cash' && status === 'paid') {
//      return <span className="payment-badge cash-paid"><FaMoneyBill /> Cash Paid</span>;
//    } else if (method === 'cash') {
//      return <span className="payment-badge cash-pending"><FaWallet /> Cash Pending</span>;
//    } else {
//      return <span className="payment-badge pending"><FaClock /> Payment Pending</span>;
//    }
//  };
//
//  const handleExportCSV = () => {
//    const filteredOrders = getFilteredOrders();
//    
//    if (filteredOrders.length === 0) {
//      alert('No data to export');
//      return;
//    }
//    
//    const headers = [
//      'Bill Number', 'Date', 'Time', 'Customer Name', 'Table Number',
//      'Payment Method', 'Payment Status', 'Status', 'Items', 'Subtotal', 'GST Amount', 'Total'
//    ];
//    
//    const csvRows = filteredOrders.map(order => [
//      order.billNumber,
//      order.date,
//      order.time,
//      `"${order.customerName || 'Guest'}"`,
//      order.tableNumber || '-',
//      order.paymentMethod || 'pending',
//      order.paymentStatus || 'pending',
//      order.status || 'pending',
//      `"${order.items.map(item => `${item.name}(${item.quantity})`).join(', ')}"`,
//      order.subtotal?.toFixed(2) || '0.00',
//      order.gstAmount?.toFixed(2) || '0.00',
//      order.total?.toFixed(2) || '0.00'
//    ]);
//    
//    const csvContent = [
//      headers.join(','),
//      ...csvRows.map(row => row.join(','))
//    ].join('\n');
//    
//    const blob = new Blob([csvContent], { type: 'text/csv' });
//    const url = window.URL.createObjectURL(blob);
//    const a = document.createElement('a');
//    a.href = url;
//    a.download = `orders_${restaurantSlug}_${new Date().toISOString().split('T')[0]}.csv`;
//    document.body.appendChild(a);
//    a.click();
//    document.body.removeChild(a);
//    window.URL.revokeObjectURL(url);
//  };
//
//  const handleNavigateToAdmin = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/admin`);
//  };
//
//  const handleNavigateToAnalytics = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/analytics`);
//  };
//
//  const handleNavigateToRecords = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/records`);
//  };
//
//  const handleNavigateToFeedback = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/feedback`);
//  };
//
//  const handleRefresh = () => {
//    fetchAllOrders();
//  };
//
//  const resetFilters = () => {
//    setSearchTerm('');
//    setStatusFilter('all');
//    setPaymentFilter('all');
//    setActivePaymentFilter(null);
//    setDateRange('all');
//    setSelectedDate(null);
//    setStartDate('');
//    setEndDate('');
//  };
//
//  const toggleSection = (section) => {
//    setExpandedSections(prev => ({
//      ...prev,
//      [section]: !prev[section]
//    }));
//  };
//
//  const filteredOrders = getFilteredOrders();
//  const filteredPaymentStats = getFilteredStats();
//
//  const navItems = [
//    { icon: FaTachometerAlt, label: 'Admin Dashboard', action: handleNavigateToAdmin },
//    { icon: FaChartLine, label: 'Analytics', action: handleNavigateToAnalytics },
//    { icon: FaDatabase, label: 'Records', action: handleNavigateToRecords },
//    { icon: FaEye, label: 'Feedback', action: handleNavigateToFeedback },
//  ];
//
//  if (loading) {
//    return (
//      <div className="loading-container">
//        <div className="loading-spinner"></div>
//        <p>Loading orders data...</p>
//      </div>
//    );
//  }
//
//  return (
//    <div className="records-container">
//      {/* Mobile Menu Toggle */}
//      <button 
//        className="mobile-menu-toggle"
//        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//      >
//        {mobileMenuOpen ? <FaTimesCircle /> : <FaBars />}
//      </button>
//
//      {/* Mobile Navigation Overlay */}
//      {mobileMenuOpen && (
//        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
//          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
//            <div className="mobile-nav-header">
//              <h3>Menu</h3>
//              <button onClick={() => setMobileMenuOpen(false)}>
//                <FaTimes />
//              </button>
//            </div>
//            {navItems.map((item, index) => (
//              <button 
//                key={index}
//                className="mobile-nav-item"
//                onClick={item.action}
//              >
//                <item.icon /> {item.label}
//              </button>
//            ))}
//            <button className="mobile-nav-item logout" onClick={handleLogout}>
//              <FaSignOutAlt /> Logout
//            </button>
//          </div>
//        </div>
//      )}
//
//      {/* Header */}
//      <div className="records-header">
//        <div className="header-content">
//          <h1>
//            <FaDatabase /> Order Records
//          </h1>
//          <p className="subtitle">
//            {restaurantData?.restaurantName} • {restaurantData?.restaurantCode}
//          </p>
//        </div>
//        <div className="header-right desktop-only">
//          <button className="logout-button" onClick={handleLogout}>
//            <FaSignOutAlt /> Logout
//          </button>
//        </div>
//      </div>
//
//      {/* Desktop Navigation Tabs */}
//      <div className="navigation-tabs desktop-only">
//        {navItems.map((item, index) => (
//          <button 
//            key={index}
//            className={`nav-tab ${item.label === 'Records' ? 'active' : ''}`}
//            onClick={item.action}
//          >
//            <item.icon /> {item.label}
//          </button>
//        ))}
//      </div>
//
//      {/* Error Display */}
//      {error && (
//        <div className="error-message">
//          <FaExclamationTriangle /> {error}
//          <button onClick={() => setError(null)}>✕</button>
//        </div>
//      )}
//
//      {/* Active Filter Indicator */}
//      {(paymentFilter !== 'all' || statusFilter !== 'all' || searchTerm || dateRange !== 'all' || selectedDate || startDate) && (
//        <div className="active-filters-bar">
//          <FaFilter className="filter-icon" />
//          <span>Active Filters:</span>
//          {paymentFilter !== 'all' && (
//            <span className="filter-tag payment-filter">
//              {paymentFilter === 'upi' ? '💳 UPI Only' : paymentFilter === 'cash' ? '💵 Cash Only' : '⏳ Pending Only'}
//              <button onClick={() => { setPaymentFilter('all'); setActivePaymentFilter(null); }}><FaTimes /></button>
//            </span>
//          )}
//          {statusFilter !== 'all' && (
//            <span className="filter-tag status-filter">
//              {statusFilter}
//              <button onClick={() => setStatusFilter('all')}><FaTimes /></button>
//            </span>
//          )}
//          {(dateRange !== 'all' || selectedDate || startDate) && (
//            <span className="filter-tag date-filter">
//              📅 {selectedDate ? formatDate(selectedDate) : startDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : dateRange}
//              <button onClick={clearDateFilter}><FaTimes /></button>
//            </span>
//          )}
//          {searchTerm && (
//            <span className="filter-tag search-filter">
//              🔍 {searchTerm}
//              <button onClick={() => setSearchTerm('')}><FaTimes /></button>
//            </span>
//          )}
//          <button className="clear-all-filters" onClick={resetFilters}>Clear All</button>
//        </div>
//      )}
//
//      {/* Statistics Section */}
//      <div className="summary-section">
//        <div className="section-header" onClick={() => toggleSection('stats')}>
//          <h2><FaChartBar /> Key Metrics</h2>
//          <button className="expand-toggle">
//            {expandedSections.stats ? <FaChevronUp /> : <FaChevronDown />}
//          </button>
//        </div>
//        
//        {expandedSections.stats && (
//          <>
//            <div className="summary-cards">
//              <div className="stat-card">
//                <div className="stat-icon">📋</div>
//                <div className="stat-content">
//                  <h3>Total Orders</h3>
//                  <p className="stat-number">{stats.totalOrders}</p>
//                </div>
//              </div>
//              
//              <div className="stat-card">
//                <div className="stat-icon">💰</div>
//                <div className="stat-content">
//                  <h3>Total Revenue</h3>
//                  <p className="stat-number">₹{stats.totalRevenue.toFixed(2)}</p>
//                </div>
//              </div>
//              
//              <div className="stat-card">
//                <div className="stat-icon">🏛️</div>
//                <div className="stat-content">
//                  <h3>Total GST</h3>
//                  <p className="stat-number">₹{stats.totalGST.toFixed(2)}</p>
//                </div>
//              </div>
//              
//              <div className="stat-card">
//                <div className="stat-icon">📊</div>
//                <div className="stat-content">
//                  <h3>Avg Order Value</h3>
//                  <p className="stat-number">₹{stats.averageOrderValue.toFixed(2)}</p>
//                </div>
//              </div>
//            </div>
//
//            <div className="status-cards">
//              <div className="status-card pending">
//                <FaClock className="status-icon" />
//                <div className="status-info">
//                  <h4>Pending</h4>
//                  <p className="status-count">{stats.pendingOrders}</p>
//                </div>
//              </div>
//              
//              <div className="status-card preparing">
//                <FaClock className="status-icon" />
//                <div className="status-info">
//                  <h4>Preparing</h4>
//                  <p className="status-count">{stats.preparingOrders}</p>
//                </div>
//              </div>
//              
//              <div className="status-card completed">
//                <FaCheckCircle className="status-icon" />
//                <div className="status-info">
//                  <h4>Completed</h4>
//                  <p className="status-count">{stats.completedOrders}</p>
//                </div>
//              </div>
//              
//              <div className="status-card cancelled">
//                <FaTimes className="status-icon" />
//                <div className="status-info">
//                  <h4>Cancelled</h4>
//                  <p className="status-count">{stats.cancelledOrders}</p>
//                </div>
//              </div>
//            </div>
//          </>
//        )}
//      </div>
//
//      {/* Filterable Payment Statistics Section - CLICKABLE CARDS */}
//      <div className="summary-section">
//        <div className="section-header" onClick={() => toggleSection('paymentStats')}>
//          <h2><FaCreditCard /> Payment Statistics</h2>
//          <div className="header-actions">
//            {paymentFilter !== 'all' && (
//              <span className="active-filter-badge">Filtered: {paymentFilter === 'upi' ? 'UPI Only' : paymentFilter === 'cash' ? 'Cash Only' : 'Pending Only'}</span>
//            )}
//            <button className="expand-toggle">
//              {expandedSections.paymentStats ? <FaChevronUp /> : <FaChevronDown />}
//            </button>
//          </div>
//        </div>
//        
//        {expandedSections.paymentStats && (
//          <div className="payment-stats-container">
//            {/* UPI Card - Clickable */}
//            <div 
//              className={`payment-stat-card upi ${activePaymentFilter === 'upi' ? 'active-filter' : ''}`}
//              onClick={() => applyPaymentFilter('upi')}
//            >
//              <div className="payment-stat-icon"><FaMobileAlt /></div>
//              <div className="payment-stat-details">
//                <h3>UPI Payments</h3>
//                <div className="payment-stat-amount">₹{filteredPaymentStats.upiPayments.amount.toFixed(2)}</div>
//                <div className="payment-stat-count">{filteredPaymentStats.upiPayments.count} orders</div>
//              </div>
//              {activePaymentFilter === 'upi' && (
//                <div className="filter-active-indicator">✓ Filter Active</div>
//              )}
//            </div>
//
//            {/* Cash Card - Clickable */}
//            <div 
//              className={`payment-stat-card cash ${activePaymentFilter === 'cash' ? 'active-filter' : ''}`}
//              onClick={() => applyPaymentFilter('cash')}
//            >
//              <div className="payment-stat-icon"><FaMoneyBill /></div>
//              <div className="payment-stat-details">
//                <h3>Cash Payments</h3>
//                <div className="payment-stat-amount">₹{filteredPaymentStats.cashPayments.amount.toFixed(2)}</div>
//                <div className="payment-stat-count">{filteredPaymentStats.cashPayments.count} orders</div>
//              </div>
//              {activePaymentFilter === 'cash' && (
//                <div className="filter-active-indicator">✓ Filter Active</div>
//              )}
//            </div>
//
//            {/* Pending Card - Clickable */}
//            <div 
//              className={`payment-stat-card pending-payment ${activePaymentFilter === 'pending' ? 'active-filter' : ''}`}
//              onClick={() => applyPaymentFilter('pending')}
//            >
//              <div className="payment-stat-icon"><FaClock /></div>
//              <div className="payment-stat-details">
//                <h3>Pending Payments</h3>
//                <div className="payment-stat-amount">₹{filteredPaymentStats.pendingPayments.amount.toFixed(2)}</div>
//                <div className="payment-stat-count">{filteredPaymentStats.pendingPayments.count} orders</div>
//              </div>
//              {activePaymentFilter === 'pending' && (
//                <div className="filter-active-indicator">✓ Filter Active</div>
//              )}
//            </div>
//
//            {/* Total Collection Card - Shows current filter totals */}
//            <div className="payment-stat-card total-collection">
//              <div className="payment-stat-icon"><FaWallet /></div>
//              <div className="payment-stat-details">
//                <h3>Total Collection</h3>
//                <div className="payment-stat-amount">₹{filteredPaymentStats.totalCollection.toFixed(2)}</div>
//                <div className="payment-stat-count">
//                  {paymentFilter !== 'all' ? 'Filtered Results' : 'UPI + Cash'}
//                </div>
//              </div>
//            </div>
//          </div>
//        )}
//      </div>
//
//      {/* Filters Section */}
//      <div className="summary-section">
//        <div className="section-header" onClick={() => toggleSection('filters')}>
//          <h2><FaSearch /> Advanced Filters</h2>
//          <button className="expand-toggle">
//            {expandedSections.filters ? <FaChevronUp /> : <FaChevronDown />}
//          </button>
//        </div>
//        
//        {expandedSections.filters && (
//          <div className="filters-section">
//            <div className="search-box">
//              <FaSearch className="search-icon" />
//              <input
//                type="text"
//                placeholder="Search by bill number, customer, or table..."
//                value={searchTerm}
//                onChange={(e) => setSearchTerm(e.target.value)}
//                className="search-input"
//              />
//              {searchTerm && (
//                <button className="clear-search" onClick={() => setSearchTerm('')}>
//                  <FaTimes />
//                </button>
//              )}
//            </div>
//
//            <div className="filter-controls">
//              <div className="filter-group">
//                <label><FaClock /> Order Status:</label>
//                <select
//                  value={statusFilter}
//                  onChange={(e) => setStatusFilter(e.target.value)}
//                  className="filter-select"
//                >
//                  <option value="all">All Status</option>
//                  <option value="pending">Pending</option>
//                  <option value="preparing">Preparing</option>
//                  <option value="completed">Completed</option>
//                  <option value="cancelled">Cancelled</option>
//                </select>
//              </div>
//
//              <div className="filter-group">
//                <label><FaWallet /> Payment Method:</label>
//                <select
//                  value={paymentFilter}
//                  onChange={(e) => {
//                    setPaymentFilter(e.target.value);
//                    setActivePaymentFilter(e.target.value === 'all' ? null : e.target.value);
//                  }}
//                  className="filter-select"
//                >
//                  <option value="all">All Payments</option>
//                  <option value="upi">💳 UPI Paid</option>
//                  <option value="cash">💵 Cash Paid</option>
//                  <option value="pending">⏳ Pending Payment</option>
//                </select>
//              </div>
//
//              <div className="filter-group">
//                <label>📅 Date Preset:</label>
//                <select
//                  value={dateRange}
//                  onChange={(e) => {
//                    setDateRange(e.target.value);
//                    setSelectedDate(null);
//                    setStartDate('');
//                    setEndDate('');
//                  }}
//                  className="filter-select"
//                >
//                  <option value="all">All Time</option>
//                  <option value="today">Today</option>
//                  <option value="week">Last 7 Days</option>
//                  <option value="month">Last 30 Days</option>
//                  <option value="year">Last Year</option>
//                </select>
//              </div>
//
//              <div className="filter-group date-picker">
//                <button 
//                  className="date-button"
//                  onClick={() => setShowCalendar(!showCalendar)}
//                >
//                  <FaCalendarAlt /> {selectedDate ? formatDate(selectedDate) : 'Select Date'}
//                </button>
//                {showCalendar && (
//                  <div className="calendar-popup">
//                    <Calendar onChange={handleDateChange} value={selectedDate} />
//                  </div>
//                )}
//              </div>
//
//              <div className="filter-group custom-range">
//                <button 
//                  className="date-range-button"
//                  onClick={() => setShowDateRangePicker(!showDateRangePicker)}
//                >
//                  📅 Custom Range
//                </button>
//                {showDateRangePicker && (
//                  <div className="date-range-popup">
//                    <div className="date-range-inputs">
//                      <input
//                        type="date"
//                        value={startDate}
//                        onChange={(e) => setStartDate(e.target.value)}
//                        placeholder="Start Date"
//                      />
//                      <span>to</span>
//                      <input
//                        type="date"
//                        value={endDate}
//                        onChange={(e) => setEndDate(e.target.value)}
//                        placeholder="End Date"
//                      />
//                      <button onClick={handleCustomDateRange} className="apply-range-btn">
//                        Apply
//                      </button>
//                    </div>
//                  </div>
//                )}
//              </div>
//
//              {(selectedDate || startDate || dateRange !== 'all' || statusFilter !== 'all' || paymentFilter !== 'all' || searchTerm) && (
//                <button className="reset-filters-btn" onClick={resetFilters}>
//                  <FaTimes /> Reset All
//                </button>
//              )}
//            </div>
//
//            <div className="export-actions">
//              <button
//                className="export-btn"
//                onClick={handleExportCSV}
//                disabled={filteredOrders.length === 0}
//              >
//                <FaDownload /> Export CSV ({filteredOrders.length} orders)
//              </button>
//            </div>
//          </div>
//        )}
//      </div>
//
//      {/* Orders Table Section */}
//      <div className="summary-section">
//        <div className="section-header" onClick={() => toggleSection('table')}>
//          <h2><FaDatabase /> Order Details</h2>
//          <div className="header-actions">
//            <button className="refresh-btn-small" onClick={handleRefresh}>
//              <FaSpinner className={loading ? 'spinner' : ''} /> Refresh
//            </button>
//            <span className="record-count">Showing {filteredOrders.length} of {orders.length} orders</span>
//            <button className="expand-toggle">
//              {expandedSections.table ? <FaChevronUp /> : <FaChevronDown />}
//            </button>
//          </div>
//        </div>
//        
//        {expandedSections.table && (
//          <div className="records-content">
//            {filteredOrders.length > 0 ? (
//              <div className="table-responsive">
//                <table className="orders-table">
//                  <thead>
//                    <tr>
//                      <th onClick={() => handleSort('date')} className="sortable">
//                        Date/Time {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
//                      </th>
//                      <th onClick={() => handleSort('billNumber')} className="sortable">
//                        Bill # {sortBy === 'billNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
//                      </th>
//                      <th onClick={() => handleSort('customer')} className="sortable">
//                        Customer {sortBy === 'customer' && (sortOrder === 'asc' ? '↑' : '↓')}
//                      </th>
//                      <th>Table</th>
//                      <th>Payment</th>
//                      <th>Items</th>
//                      <th onClick={() => handleSort('total')} className="sortable">
//                        Total {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}
//                      </th>
//                      <th>Status</th>
//                    </tr>
//                  </thead>
//                  <tbody>
//                    {filteredOrders.map(order => (
//                      <tr key={order._id}>
//                        <td className="date-cell">{formatDateTime(order.date, order.time)}</td>
//                        <td>
//                          <span className="bill-number">#{order.billNumber}</span>
//                        </td>
//                        <td>
//                          <div className="customer-info">
//                            <strong>{order.customerName || 'Guest'}</strong>
//                            {order.customerPhone && (
//                              <small className="customer-phone">{order.customerPhone}</small>
//                            )}
//                          </div>
//                        </td>
//                        <td className="table-number">{order.tableNumber || '-'}</td>
//                        <td>{getPaymentBadge(order.paymentMethod, order.paymentStatus)}</td>
//                        <td>
//                          <ul className="items-list">
//                            {order.items.slice(0, 3).map((item, idx) => (
//                              <li key={idx}>
//                                <span className="item-name">{item.name}</span>
//                                <span className="item-quantity">×{item.quantity}</span>
//                              </li>
//                            ))}
//                            {order.items.length > 3 && (
//                              <li className="more-items">+{order.items.length - 3} more</li>
//                            )}
//                          </ul>
//                        </td>
//                        <td className="amount-cell">₹{order.total?.toFixed(2)}</td>
//                        <td>{getStatusBadge(order.status)}</td>
//                      </tr>
//                    ))}
//                  </tbody>
//                  <tfoot>
//                    <tr className="table-footer">
//                      <td colSpan="6" className="footer-label">Total Revenue (Filtered):</td>
//                      <td className="footer-total">₹{filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}</td>
//                      <td></td>
//                    </tr>
//                  </tfoot>
//                </table>
//              </div>
//            ) : (
//              <div className="no-records">
//                <div className="no-records-icon">📭</div>
//                <h3>No Orders Found</h3>
//                <p>Try adjusting your filters or check back later.</p>
//                <button className="reset-filters-btn" onClick={resetFilters}>
//                  Reset All Filters
//                </button>
//              </div>
//            )}
//          </div>
//        )}
//      </div>
//    </div>
//  );
//};
//
//export default AllRecord;
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
  FaEye,
  FaWallet,
  FaCreditCard,
  FaMoneyBill,
  FaMobileAlt,
  FaFilter,
  FaChartPie,
  FaUtensils,
  FaClipboardList,
  FaReceipt,
  FaCommentDots
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
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Section expansion
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    paymentStats: true,
    filters: true,
    table: true
  });
  
  // Active filter indicator
  const [activePaymentFilter, setActivePaymentFilter] = useState(null);
  
  // Statistics
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalGST: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    upiPayments: { count: 0, amount: 0 },
    cashPayments: { count: 0, amount: 0 },
    pendingPayments: { count: 0, amount: 0 }
  });

  useEffect(() => {
    const handleLinkClick = (e) => {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

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
    console.log("🔓 Logging out from AllRecord...");
    localStorage.clear();
    sessionStorage.clear();
    navigate("/", { replace: true });
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
        cancelledOrders: 0,
        upiPayments: { count: 0, amount: 0 },
        cashPayments: { count: 0, amount: 0 },
        pendingPayments: { count: 0, amount: 0 }
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
    
    let upiCount = 0, upiAmount = 0;
    let cashCount = 0, cashAmount = 0;
    let pendingCount = 0, pendingAmount = 0;
    
    ordersData.forEach(order => {
      const orderTotal = order.total || 0;
      const paymentMethod = order.paymentMethod?.toLowerCase() || 'pending';
      const paymentStatus = order.paymentStatus?.toLowerCase() || 'pending';
      
      if (paymentMethod === 'upi' && paymentStatus === 'paid') {
        upiCount++;
        upiAmount += orderTotal;
      } else if (paymentMethod === 'cash' && paymentStatus === 'paid') {
        cashCount++;
        cashAmount += orderTotal;
      } else {
        pendingCount++;
        pendingAmount += orderTotal;
      }
    });
    
    setStats({
      totalOrders,
      totalRevenue,
      totalGST,
      averageOrderValue,
      pendingOrders,
      preparingOrders,
      completedOrders,
      cancelledOrders,
      upiPayments: { count: upiCount, amount: upiAmount },
      cashPayments: { count: cashCount, amount: cashAmount },
      pendingPayments: { count: pendingCount, amount: pendingAmount }
    });
  };

  const applyPaymentFilter = (filterType) => {
    if (activePaymentFilter === filterType) {
      setPaymentFilter('all');
      setActivePaymentFilter(null);
    } else {
      setPaymentFilter(filterType);
      setActivePaymentFilter(filterType);
    }
    setMobileMenuOpen(false);
  };

  const getFilteredOrders = () => {
    let filtered = [...orders];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => {
        const paymentMethod = order.paymentMethod?.toLowerCase() || 'pending';
        const paymentStatus = order.paymentStatus?.toLowerCase() || 'pending';
        
        if (paymentFilter === 'upi') {
          return paymentMethod === 'upi' && paymentStatus === 'paid';
        } else if (paymentFilter === 'cash') {
          return paymentMethod === 'cash' && paymentStatus === 'paid';
        } else if (paymentFilter === 'pending') {
          return paymentStatus !== 'paid';
        }
        return true;
      });
    }
    
    if (dateRange !== 'all' && !startDate && !endDate) {
      const now = new Date();
      let startDateObj = new Date();
      
      switch (dateRange) {
        case 'today':
          startDateObj.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDateObj.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDateObj.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDateObj.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDateObj = null;
      }
      
      if (startDateObj) {
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= startDateObj;
        });
      }
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= start && orderDate <= end;
      });
    }
    
    if (selectedDate && !startDate) {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(order => order.date === selectedDateStr);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.billNumber?.toString().toLowerCase().includes(term) ||
        order.customerName?.toLowerCase().includes(term) ||
        order.tableNumber?.toString().toLowerCase().includes(term)
      );
    }
    
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time);
          break;
        case 'billNumber':
          comparison = a.billNumber - b.billNumber;
          break;
        case 'total':
          comparison = (b.total || 0) - (a.total || 0);
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

  const getFilteredStats = () => {
    const filteredOrders = getFilteredOrders();
    let upiCount = 0, upiAmount = 0;
    let cashCount = 0, cashAmount = 0;
    let pendingCount = 0, pendingAmount = 0;
    
    filteredOrders.forEach(order => {
      const orderTotal = order.total || 0;
      const paymentMethod = order.paymentMethod?.toLowerCase() || 'pending';
      const paymentStatus = order.paymentStatus?.toLowerCase() || 'pending';
      
      if (paymentMethod === 'upi' && paymentStatus === 'paid') {
        upiCount++;
        upiAmount += orderTotal;
      } else if (paymentMethod === 'cash' && paymentStatus === 'paid') {
        cashCount++;
        cashAmount += orderTotal;
      } else {
        pendingCount++;
        pendingAmount += orderTotal;
      }
    });
    
    return {
      upiPayments: { count: upiCount, amount: upiAmount },
      cashPayments: { count: cashCount, amount: cashAmount },
      pendingPayments: { count: pendingCount, amount: pendingAmount },
      totalCollection: upiAmount + cashAmount
    };
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
    setStartDate('');
    setEndDate('');
    setDateRange('all');
  };

  const handleCustomDateRange = () => {
    if (startDate && endDate) {
      setSelectedDate(null);
      setDateRange('all');
      setShowDateRangePicker(false);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setStartDate('');
    setEndDate('');
    setDateRange('all');
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

  const getPaymentBadge = (paymentMethod, paymentStatus) => {
    const method = (paymentMethod || 'pending').toLowerCase();
    const status = (paymentStatus || 'pending').toLowerCase();
    
    if (method === 'upi' && status === 'paid') {
      return <span className="payment-badge upi-paid"><FaMobileAlt /> UPI Paid</span>;
    } else if (method === 'cash' && status === 'paid') {
      return <span className="payment-badge cash-paid"><FaMoneyBill /> Cash Paid</span>;
    } else if (method === 'cash') {
      return <span className="payment-badge cash-pending"><FaWallet /> Cash Pending</span>;
    } else {
      return <span className="payment-badge pending"><FaClock /> Payment Pending</span>;
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
      'Payment Method', 'Payment Status', 'Status', 'Items', 'Subtotal', 'GST Amount', 'Total'
    ];
    
    const csvRows = filteredOrders.map(order => [
      order.billNumber,
      order.date,
      order.time,
      `"${order.customerName || 'Guest'}"`,
      order.tableNumber || '-',
      order.paymentMethod || 'pending',
      order.paymentStatus || 'pending',
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

  // Navigation handlers - ALL REQUIRED FUNCTIONS
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
    setPaymentFilter('all');
    setActivePaymentFilter(null);
    setDateRange('all');
    setSelectedDate(null);
    setStartDate('');
    setEndDate('');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredOrders = getFilteredOrders();
  const filteredPaymentStats = getFilteredStats();

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
      {/* Sidebar Navigation - LEFT SIDE */}
      <div className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <FaDatabase className="logo-icon" />
            <span>{restaurantData?.restaurantName?.split(' ')[0] || 'Records'}</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={handleNavigateToAdmin}>
            <FaBuilding /> Admin
          </button>
         
        
          <button className="nav-item" onClick={handleNavigateToAnalytics}>
            <FaChartLine /> Analytics
          </button>
          <button className="nav-item active" onClick={handleNavigateToRecords}>
            <FaDatabase /> Records
          </button>
          <button className="nav-item" onClick={handleNavigateToFeedback}>
            <FaEye /> Feedback
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="content-header">
          <div className="header-info">
            <h1><FaDatabase /> Order Records</h1>
            <p className="restaurant-subtitle">{restaurantData?.restaurantName} • {restaurantData?.restaurantCode}</p>
          </div>
          <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
            {loading ? <FaSpinner className="spinner" /> : <FaSpinner />} Refresh
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <FaExclamationTriangle /> {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Active Filter Indicator */}
        {(paymentFilter !== 'all' || statusFilter !== 'all' || searchTerm || dateRange !== 'all' || selectedDate || startDate) && (
          <div className="active-filters-bar">
            <FaFilter className="filter-icon" />
            <span>Active Filters:</span>
            {paymentFilter !== 'all' && (
              <span className="filter-tag payment-filter">
                {paymentFilter === 'upi' ? '💳 UPI Only' : paymentFilter === 'cash' ? '💵 Cash Only' : '⏳ Pending Only'}
                <button onClick={() => { setPaymentFilter('all'); setActivePaymentFilter(null); }}><FaTimes /></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="filter-tag status-filter">
                {statusFilter}
                <button onClick={() => setStatusFilter('all')}><FaTimes /></button>
              </span>
            )}
            {(dateRange !== 'all' || selectedDate || startDate) && (
              <span className="filter-tag date-filter">
                📅 {selectedDate ? formatDate(selectedDate) : startDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : dateRange}
                <button onClick={clearDateFilter}><FaTimes /></button>
              </span>
            )}
            {searchTerm && (
              <span className="filter-tag search-filter">
                🔍 {searchTerm}
                <button onClick={() => setSearchTerm('')}><FaTimes /></button>
              </span>
            )}
            <button className="clear-all-filters" onClick={resetFilters}>Clear All</button>
          </div>
        )}

        {/* Statistics Section */}
        <div className="stats-section">
          <div className="section-header" onClick={() => toggleSection('stats')}>
            <h2><FaChartBar /> Key Metrics</h2>
            <button className="expand-toggle">
              {expandedSections.stats ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
          
          {expandedSections.stats && (
            <>
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-info">
                    <h3>Total Orders</h3>
                    <p className="stat-number">{stats.totalOrders}</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <h3>Total Revenue</h3>
                    <p className="stat-number">₹{stats.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🏛️</div>
                  <div className="stat-info">
                    <h3>Total GST</h3>
                    <p className="stat-number">₹{stats.totalGST.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
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

        {/* Filterable Payment Statistics Section */}
        <div className="stats-section">
          <div className="section-header" onClick={() => toggleSection('paymentStats')}>
            <h2><FaCreditCard /> Payment Statistics</h2>
            <div className="header-actions">
              {paymentFilter !== 'all' && (
                <span className="active-filter-badge">Filtered: {paymentFilter === 'upi' ? 'UPI Only' : paymentFilter === 'cash' ? 'Cash Only' : 'Pending Only'}</span>
              )}
              <button className="expand-toggle">
                {expandedSections.paymentStats ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>
          </div>
          
          {expandedSections.paymentStats && (
            <div className="payment-stats-container">
              <div 
                className={`payment-stat-card upi ${activePaymentFilter === 'upi' ? 'active-filter' : ''}`}
                onClick={() => applyPaymentFilter('upi')}
              >
                <div className="payment-stat-icon"><FaMobileAlt /></div>
                <div className="payment-stat-details">
                  <h3>UPI Payments</h3>
                  <div className="payment-stat-amount">₹{filteredPaymentStats.upiPayments.amount.toFixed(2)}</div>
                  <div className="payment-stat-count">{filteredPaymentStats.upiPayments.count} orders</div>
                </div>
                {activePaymentFilter === 'upi' && (
                  <div className="filter-active-indicator">✓ Filter Active</div>
                )}
              </div>

              <div 
                className={`payment-stat-card cash ${activePaymentFilter === 'cash' ? 'active-filter' : ''}`}
                onClick={() => applyPaymentFilter('cash')}
              >
                <div className="payment-stat-icon"><FaMoneyBill /></div>
                <div className="payment-stat-details">
                  <h3>Cash Payments</h3>
                  <div className="payment-stat-amount">₹{filteredPaymentStats.cashPayments.amount.toFixed(2)}</div>
                  <div className="payment-stat-count">{filteredPaymentStats.cashPayments.count} orders</div>
                </div>
                {activePaymentFilter === 'cash' && (
                  <div className="filter-active-indicator">✓ Filter Active</div>
                )}
              </div>

              <div 
                className={`payment-stat-card pending-payment ${activePaymentFilter === 'pending' ? 'active-filter' : ''}`}
                onClick={() => applyPaymentFilter('pending')}
              >
                <div className="payment-stat-icon"><FaClock /></div>
                <div className="payment-stat-details">
                  <h3>Pending Payments</h3>
                  <div className="payment-stat-amount">₹{filteredPaymentStats.pendingPayments.amount.toFixed(2)}</div>
                  <div className="payment-stat-count">{filteredPaymentStats.pendingPayments.count} orders</div>
                </div>
                {activePaymentFilter === 'pending' && (
                  <div className="filter-active-indicator">✓ Filter Active</div>
                )}
              </div>

              <div className="payment-stat-card total-collection">
                <div className="payment-stat-icon"><FaWallet /></div>
                <div className="payment-stat-details">
                  <h3>Total Collection</h3>
                  <div className="payment-stat-amount">₹{filteredPaymentStats.totalCollection.toFixed(2)}</div>
                  <div className="payment-stat-count">
                    {paymentFilter !== 'all' ? 'Filtered Results' : 'UPI + Cash'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters Section */}
        <div className="stats-section">
          <div className="section-header" onClick={() => toggleSection('filters')}>
            <h2><FaSearch /> Advanced Filters</h2>
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
                  <label><FaClock /> Order Status:</label>
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
                  <label><FaWallet /> Payment Method:</label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => {
                      setPaymentFilter(e.target.value);
                      setActivePaymentFilter(e.target.value === 'all' ? null : e.target.value);
                    }}
                    className="filter-select"
                  >
                    <option value="all">All Payments</option>
                    <option value="upi">💳 UPI Paid</option>
                    <option value="cash">💵 Cash Paid</option>
                    <option value="pending">⏳ Pending Payment</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>📅 Date Preset:</label>
                  <select
                    value={dateRange}
                    onChange={(e) => {
                      setDateRange(e.target.value);
                      setSelectedDate(null);
                      setStartDate('');
                      setEndDate('');
                    }}
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
                  {showCalendar && (
                    <div className="calendar-popup">
                      <Calendar onChange={handleDateChange} value={selectedDate} />
                    </div>
                  )}
                </div>

                <div className="filter-group custom-range">
                  <button 
                    className="date-range-button"
                    onClick={() => setShowDateRangePicker(!showDateRangePicker)}
                  >
                    📅 Custom Range
                  </button>
                  {showDateRangePicker && (
                    <div className="date-range-popup">
                      <div className="date-range-inputs">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          placeholder="Start Date"
                        />
                        <span>to</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          placeholder="End Date"
                        />
                        <button onClick={handleCustomDateRange} className="apply-range-btn">
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {(selectedDate || startDate || dateRange !== 'all' || statusFilter !== 'all' || paymentFilter !== 'all' || searchTerm) && (
                  <button className="reset-filters-btn" onClick={resetFilters}>
                    <FaTimes /> Reset All
                  </button>
                )}
              </div>

              <div className="export-actions">
                <button
                  className="export-btn"
                  onClick={handleExportCSV}
                  disabled={filteredOrders.length === 0}
                >
                  <FaDownload /> Export CSV ({filteredOrders.length} orders)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Orders Table Section */}
        <div className="stats-section">
          <div className="section-header" onClick={() => toggleSection('table')}>
            <h2><FaDatabase /> Order Details</h2>
            <div className="header-actions">
              <button className="refresh-btn-small" onClick={handleRefresh}>
                <FaSpinner className={loading ? 'spinner' : ''} /> Refresh
              </button>
              <span className="record-count">Showing {filteredOrders.length} of {orders.length} orders</span>
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
                        <th>Payment</th>
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
                              {order.customerPhone && (
                                <small className="customer-phone">{order.customerPhone}</small>
                              )}
                            </div>
                          </td>
                          <td className="table-number">{order.tableNumber || '-'}</td>
                          <td>{getPaymentBadge(order.paymentMethod, order.paymentStatus)}</td>
                          <td>
                            <ul className="items-list">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <li key={idx}>
                                  <span className="item-name">{item.name}</span>
                                  <span className="item-quantity">×{item.quantity}</span>
                                </li>
                              ))}
                              {order.items.length > 3 && (
                                <li className="more-items">+{order.items.length - 3} more</li>
                              )}
                            </ul>
                          </td>
                          <td className="amount-cell">₹{order.total?.toFixed(2)}</td>
                          <td>{getStatusBadge(order.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-footer">
                        <td colSpan="6" className="footer-label">Total Revenue (Filtered):</td>
                        <td className="footer-total">₹{filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
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
    </div>
  );
};

export default AllRecord;