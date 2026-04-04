// Analytics.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, AreaChart, Area
} from "recharts";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaChartBar,
  FaDownload,
  FaFilter,
  FaSearch,
  FaTimes,
  FaArrowLeft,
  FaBuilding,
  FaCalendarAlt,
  FaTachometerAlt,
  FaDatabase,
  FaHome,
  FaSignOutAlt,
  FaUserCircle,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaClipboardList,
  FaUtensils,
  FaClock,
  FaCheckCircle,
  FaHourglassHalf,
  FaBan,
  FaEye,
  FaBars,
  FaTimesCircle,
  FaSpinner
} from 'react-icons/fa';
import "./Analytics.css";

const Analytics = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Analytics using backend:', API_URL);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("daily");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [restaurantData, setRestaurantData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    charts: true,
    items: true,
    table: true
  });

  // Authentication check
  useEffect(() => {
    checkAuthentication();
    getUserInfo();
  }, [restaurantSlug]);

  const getUserInfo = () => {
    const role = localStorage.getItem('userRole') || 'owner';
    const name = localStorage.getItem('userName') || 'Restaurant Owner';
    setUserRole(role);
    setUserName(name);
  };

  const checkAuthentication = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Please login to view analytics");
        setLoading(false);
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/restaurant/by-slug/${restaurantSlug}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        setIsAuthenticated(true);
        setRestaurantData(response.data);
        localStorage.setItem("restaurantName", response.data.restaurantName);
        localStorage.setItem("restaurantCode", response.data.restaurantCode);
        fetchRestaurantOrders(token);
      } else {
        setError("Access denied to this restaurant");
        setLoading(false);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      handleAuthError(err);
    }
  };

  const fetchRestaurantOrders = async (token) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_URL}/api/order/restaurant/${restaurantSlug}/analytics`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setOrders(response.data.orders || []);
      } else {
        setOrders([]);
        setError("No orders found for this restaurant");
      }
    } catch (err) {
      console.error("Error fetching restaurant orders:", err);
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err) => {
    if (err.response?.status === 401) {
      setError("Session expired. Please login again.");
      localStorage.clear();
      setTimeout(() => navigate("/"), 2000);
    } else if (err.response?.status === 403) {
      setError(`You don't have access to ${restaurantSlug}'s analytics`);
      setLoading(false);
    } else if (err.response?.status === 404) {
      setError(`Restaurant "${restaurantSlug}" not found`);
      setLoading(false);
    } else {
      setError("Failed to verify access. Please try again.");
      setLoading(false);
    }
  };

  const handleFetchError = (err) => {
    let errorMessage = "Failed to load orders. ";
    
    if (err.code === "ECONNABORTED") {
      errorMessage = "Request timeout. Server is not responding.";
    } else if (err.response) {
      if (err.response.status === 401) {
        errorMessage = "Session expired. Please login again.";
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
      } else if (err.response.status === 404) {
        errorMessage = `No orders found for ${restaurantData?.restaurantName || restaurantSlug}`;
        setOrders([]);
      } else {
        errorMessage += `Server error: ${err.response.status}`;
      }
    } else if (err.request) {
      errorMessage = "Cannot connect to server. Please check backend is running.";
    } else {
      errorMessage += err.message;
    }
    
    setError(errorMessage);
    setOrders([]);
  };

  // FIXED: Immediate logout without refresh needed
  const handleLogout = () => {
    console.log("🔓 Logging out from Analytics...");
    
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

  // Get available years from orders
  const availableYears = [...new Set(orders.map(order => new Date(order.date).getFullYear()))].sort((a, b) => b - a);

  // Process data for charts
  const processChartData = () => {
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      const orderYear = orderDate.getFullYear();
      
      if (timeRange === "yearly") {
        return true;
      } else if (timeRange === "monthly") {
        return orderYear === selectedYear;
      } else if (timeRange === "weekly") {
        const orderMonth = orderDate.getMonth() + 1;
        return orderYear === selectedYear && orderMonth === selectedMonth;
      }
      return true;
    });

    const salesByPeriod = {};
    const itemSales = {};
    const statusCounts = {
      pending: 0,
      preparing: 0,
      completed: 0,
      cancelled: 0
    };

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.date);
      let periodKey;

      switch (timeRange) {
        case "daily":
          periodKey = orderDate.toISOString().split("T")[0];
          break;
        case "weekly":
          const weekNumber = getWeekNumber(orderDate);
          periodKey = `Week ${weekNumber}, ${orderDate.getFullYear()}`;
          break;
        case "monthly":
          periodKey = orderDate.toLocaleDateString("en-US", { year: "numeric", month: "long" });
          break;
        case "yearly":
          periodKey = orderDate.getFullYear().toString();
          break;
        default:
          periodKey = orderDate.toISOString().split("T")[0];
      }

      if (!salesByPeriod[periodKey]) {
        salesByPeriod[periodKey] = {
          period: periodKey,
          totalSales: 0,
          totalOrders: 0,
          totalGST: 0,
          pending: 0,
          preparing: 0,
          completed: 0,
          cancelled: 0,
          date: orderDate
        };
      }

      salesByPeriod[periodKey].totalSales += order.total || 0;
      salesByPeriod[periodKey].totalOrders += 1;
      salesByPeriod[periodKey].totalGST += order.gstAmount || 0;
      
      const status = order.status?.toLowerCase() || "pending";
      if (salesByPeriod[periodKey][status] !== undefined) {
        salesByPeriod[periodKey][status] += 1;
      }

      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      }

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (!itemSales[item.name]) {
            itemSales[item.name] = {
              name: item.name,
              quantity: 0,
              totalSales: 0,
              gstAmount: 0
            };
          }
          itemSales[item.name].quantity += item.quantity || 0;
          itemSales[item.name].totalSales += item.total || 0;
          itemSales[item.name].gstAmount += (item.total * (item.gstPercentage || 18) / 100) || 0;
        });
      }
    });

    const salesData = Object.values(salesByPeriod).sort((a, b) => {
      if (timeRange === "yearly") return a.period - b.period;
      return a.date - b.date;
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);

    return { salesData, topItems, filteredOrders, statusCounts };
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#14b8a6", "#f97316"];
  const STATUS_COLORS = {
    pending: "#f59e0b",
    preparing: "#3b82f6",
    completed: "#10b981",
    cancelled: "#ef4444"
  };

  const { salesData, topItems, filteredOrders, statusCounts } = processChartData();

  // Navigation handlers
  const handleBackToDashboard = () => {
    navigate(`/${restaurantSlug}/dashboard`);
  };

  const handleNavigateToAdmin = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/admin`);
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
    const token = localStorage.getItem("token");
    if (token) {
      fetchRestaurantOrders(token);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const statusData = Object.keys(statusCounts).map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: statusCounts[status],
    color: STATUS_COLORS[status]
  }));

  const getStatusTrendData = () => {
    return salesData.map(period => ({
      period: period.period,
      pending: period.pending,
      preparing: period.preparing,
      completed: period.completed,
      cancelled: period.cancelled
    }));
  };

  const getSalesByDayOfWeek = (orders) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const salesByDay = days.map(day => ({ day, sales: 0 }));
    
    orders.forEach(order => {
      const dayIndex = new Date(order.date).getDay();
      salesByDay[dayIndex].sales += order.total || 0;
    });
    
    return salesByDay;
  };

  const getItemPerformanceMatrix = (items) => {
    return items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      revenue: item.totalSales,
      efficiency: item.totalSales / item.quantity
    }));
  };

  const formatCurrency = (value) => {
    return `₹${value.toFixed(2)}`;
  };

  const formatNumber = (value) => {
    return value.toLocaleString();
  };

  const navItems = [
    { icon: FaTachometerAlt, label: 'Admin Dashboard', action: handleNavigateToAdmin },
    { icon: FaChartLine, label: 'Analytics', action: handleRefresh },
    { icon: FaDatabase, label: 'Records', action: handleNavigateToRecords },
    { icon: FaEye, label: 'Feedback', action: handleNavigateToFeedback },
  ];

  if (!isAuthenticated && loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying access to {restaurantSlug}...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading analytics for {restaurantData?.restaurantName || restaurantSlug}...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
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
      <div className="analytics-header">
        <div className="header-content">
          <h1>
            <FaChartLine /> Sales Analytics
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
            className={`nav-tab ${item.label === 'Analytics' ? 'active' : ''}`}
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

      {/* Time Range Controls */}
      <div className="filters-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label><FaCalendarAlt /> Time Range:</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="filter-select"
            >
              <option value="daily">Daily Analysis</option>
              <option value="weekly">Weekly Analysis</option>
              <option value="monthly">Monthly Analysis</option>
              <option value="yearly">Yearly Analysis</option>
            </select>
          </div>

          {(timeRange === "monthly" || timeRange === "weekly") && availableYears.length > 0 && (
            <div className="filter-group">
              <label>Year:</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="filter-select"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          {timeRange === "weekly" && (
            <div className="filter-group">
              <label>Month:</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="filter-select"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(selectedYear, month - 1).toLocaleDateString("en-US", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
            {loading ? <FaSpinner className="spinner" /> : <FaChartLine />}
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('summary')}>
          <h2><FaChartBar /> Key Metrics</h2>
          <button className="expand-toggle">
            {expandedSections.summary ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.summary && (
          <div className="summary-cards">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Total Orders</h3>
                <p className="stat-number">{formatNumber(filteredOrders.length)}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>Total Revenue</h3>
                <p className="stat-number">{formatCurrency(filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0))}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>Avg Order Value</h3>
                <p className="stat-number">{formatCurrency(filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0) / (filteredOrders.length || 1))}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🧾</div>
              <div className="stat-content">
                <h3>Total GST</h3>
                <p className="stat-number">{formatCurrency(filteredOrders.reduce((sum, order) => sum + (order.gstAmount || 0), 0))}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Status Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('charts')}>
          <h2><FaClipboardList /> Order Status Overview</h2>
          <button className="expand-toggle">
            {expandedSections.charts ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.charts && (
          <>
            <div className="status-cards">
              <div className="status-card pending">
                <FaHourglassHalf className="status-icon" />
                <div className="status-info">
                  <h4>Pending</h4>
                  <p className="status-count">{statusCounts.pending}</p>
                </div>
              </div>
              
              <div className="status-card preparing">
                <FaClock className="status-icon" />
                <div className="status-info">
                  <h4>Preparing</h4>
                  <p className="status-count">{statusCounts.preparing}</p>
                </div>
              </div>
              
              <div className="status-card completed">
                <FaCheckCircle className="status-icon" />
                <div className="status-info">
                  <h4>Completed</h4>
                  <p className="status-count">{statusCounts.completed}</p>
                </div>
              </div>
              
              <div className="status-card cancelled">
                <FaBan className="status-icon" />
                <div className="status-info">
                  <h4>Cancelled</h4>
                  <p className="status-count">{statusCounts.cancelled}</p>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
              {/* Sales Trend Chart */}
              <div className="chart-container">
                <h3>Sales Trend ({timeRange.charAt(0).toUpperCase() + timeRange.slice(1)})</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), "Amount"]}
                      contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="totalSales" stroke="#2563eb" name="Total Sales" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="totalGST" stroke="#10b981" name="Total GST" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Order Status Distribution */}
              <div className="chart-container">
                <h3>Order Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [value, name]}
                      contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Orders Count Chart */}
              <div className="chart-container">
                <h3>Orders Count ({timeRange.charAt(0).toUpperCase() + timeRange.slice(1)})</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="totalOrders" fill="#f59e0b" name="Number of Orders" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Order Status Trend */}
              <div className="chart-container">
                <h3>Order Status Trend Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getStatusTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="pending" stackId="1" stroke={STATUS_COLORS.pending} fill={STATUS_COLORS.pending} name="Pending" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="preparing" stackId="1" stroke={STATUS_COLORS.preparing} fill={STATUS_COLORS.preparing} name="Preparing" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="completed" stackId="1" stroke={STATUS_COLORS.completed} fill={STATUS_COLORS.completed} name="Completed" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="cancelled" stackId="1" stroke={STATUS_COLORS.cancelled} fill={STATUS_COLORS.cancelled} name="Cancelled" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Items Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('items')}>
          <h2><FaUtensils /> Top Items Analysis</h2>
          <button className="expand-toggle">
            {expandedSections.items ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.items && (
          <div className="charts-grid">
            {/* Top Items by Revenue */}
            <div className="chart-container">
              <h3>Top Items by Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topItems} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={100} stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), "Revenue"]}
                    contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="totalSales" fill="#8b5cf6" name="Revenue" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Items by Quantity */}
            <div className="chart-container">
              <h3>Top Items by Quantity Sold</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topItems}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [value, "Quantity"]}
                    contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="quantity" fill="#ec4899" name="Quantity Sold" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sales by Day of Week */}
            <div className="chart-container">
              <h3>Sales by Day of Week</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSalesByDayOfWeek(filteredOrders)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), "Sales"]}
                    contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="sales" fill="#06b6d4" name="Sales" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Item Performance Matrix */}
            <div className="chart-container">
              <h3>Item Performance Matrix</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="quantity" name="Quantity" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="revenue" name="Revenue" stroke="#6b7280" tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === "quantity") return [value, "Quantity"];
                      if (name === "revenue") return [formatCurrency(value), "Revenue"];
                      return [value, name];
                    }}
                    contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Scatter data={getItemPerformanceMatrix(topItems)} fill="#14b8a6" shape="circle" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('table')}>
          <h2><FaDatabase /> Detailed Sales Data</h2>
          <button className="expand-toggle">
            {expandedSections.table ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.table && (
          <div className="table-responsive">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Orders</th>
                  <th>Pending</th>
                  <th>Preparing</th>
                  <th>Completed</th>
                  <th>Cancelled</th>
                  <th>Total Sales</th>
                  <th>GST</th>
                  <th>Net Sales</th>
                  <th>Avg Value</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((period, index) => (
                  <tr key={index}>
                    <td><strong>{period.period}</strong></td>
                    <td>{period.totalOrders}</td>
                    <td>
                      <span className={`status-badge pending ${period.pending === 0 ? 'zero' : ''}`}>
                        {period.pending}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge preparing ${period.preparing === 0 ? 'zero' : ''}`}>
                        {period.preparing}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge completed ${period.completed === 0 ? 'zero' : ''}`}>
                        {period.completed}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge cancelled ${period.cancelled === 0 ? 'zero' : ''}`}>
                        {period.cancelled}
                      </span>
                    </td>
                    <td className="amount">{formatCurrency(period.totalSales)}</td>
                    <td className="amount">{formatCurrency(period.totalGST)}</td>
                    <td className="amount">{formatCurrency(period.totalSales - period.totalGST)}</td>
                    <td className="amount">{formatCurrency(period.totalSales / period.totalOrders)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {salesData.length === 0 && (
              <div className="no-data-message">
                <p>No sales data available for the selected time period.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;