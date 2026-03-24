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
  FaEye
} from 'react-icons/fa';
import "./Analytics.css";

const Analytics = () => {
  const { restaurantSlug } = useParams();
  
  // Get backend URL from environment variable or use Render URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Analytics using backend:', API_URL);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("daily");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [restaurantName, setRestaurantName] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    charts: true,
    items: true,
    table: true
  });
  
  const navigate = useNavigate();

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

      // CHANGED: Use full URL with API_URL
      const response = await axios.get(
        `${API_URL}/api/order/verify/${restaurantSlug}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setIsAuthenticated(true);
        setRestaurantName(response.data.restaurant.name);
        localStorage.setItem("restaurantName", response.data.restaurant.name);
        localStorage.setItem("restaurantCode", response.data.restaurant.code);
        localStorage.setItem("restaurantSlug", response.data.restaurant.slug);
        fetchRestaurantOrders(token, response.data.restaurant.code);
      } else {
        setError("Access denied to this restaurant");
        setLoading(false);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      handleAuthError(err);
    }
  };

  const fetchRestaurantOrders = async (token, restaurantCode) => {
    try {
      setLoading(true);
      setError(null);

      // CHANGED: Use full URL with API_URL
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
        errorMessage = `No orders found for ${restaurantName || restaurantSlug}`;
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
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleRefresh = () => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchRestaurantOrders(token, localStorage.getItem("restaurantCode"));
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

  if (!isAuthenticated) {
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
        <p>Loading analytics for {restaurantName}...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container full-width">
      {/* Header with Logout */}
      <div className="analytics-header">
        <div className="header-content">
          <h1>
            <FaChartLine /> Sales Analytics Dashboard
            {restaurantName && <span className="restaurant-name"> - {restaurantName}</span>}
          </h1>
          <p className="subtitle">Comprehensive sales insights and performance metrics</p>
        </div>
        <div className="header-right">
          <button className="refresh-button" onClick={handleRefresh} disabled={loading}>
            <FaChartLine /> Refresh
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="navigation-tabs">
        <button 
          className="nav-tab" 
          onClick={() => navigate(`/${restaurantSlug}/admin`)}
          title="Go to Admin Dashboard"
        >
          <FaTachometerAlt /> Admin Dashboard
        </button>
        
        <button 
          className="nav-tab active-tab" 
          onClick={() => navigate(`/${restaurantSlug}/analytics`)}
          title="Go to Analytics"
        >
          <FaChartLine /> Analytics
        </button>
        
        <button 
          className="nav-tab" 
          onClick={() => navigate(`/${restaurantSlug}/records`)}
          title="Go to Records"
        >
          <FaDatabase /> Records
        </button>
        
        <button 
          className="nav-tab" 
          onClick={() => navigate(`/${restaurantSlug}/feedback`)}
          title="Go to Feedback"
        >
          <FaEye /> Feedback
        </button>
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

          {(timeRange === "monthly" || timeRange === "weekly") && (
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

          <button className="export-btn">
            <FaDownload /> Export Report
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
            <div className="stat-card total-orders">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Total Orders</h3>
                <p className="stat-number">{filteredOrders.length}</p>
              </div>
            </div>
            
            <div className="stat-card total-revenue">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>Total Revenue</h3>
                <p className="stat-number">{formatCurrency(filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0))}</p>
              </div>
            </div>
            
            <div className="stat-card avg-order">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>Avg Order Value</h3>
                <p className="stat-number">{formatCurrency(filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0) / (filteredOrders.length || 1))}</p>
              </div>
            </div>
            
            <div className="stat-card total-gst">
              <div className="stat-icon">🧾</div>
              <div className="stat-content">
                <h3>Total GST</h3>
                <p className="stat-number">{formatCurrency(filteredOrders.reduce((sum, order) => sum + (order.gstAmount || 0), 0))}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Summary Cards */}
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
              <div className="stat-card pending" style={{borderLeftColor: STATUS_COLORS.pending}}>
                <div className="stat-icon"><FaHourglassHalf /></div>
                <div className="stat-content">
                  <h3>Pending Orders</h3>
                  <p className="stat-number">{statusCounts.pending}</p>
                </div>
              </div>
              
              <div className="stat-card preparing" style={{borderLeftColor: STATUS_COLORS.preparing}}>
                <div className="stat-icon"><FaClock /></div>
                <div className="stat-content">
                  <h3>Preparing Orders</h3>
                  <p className="stat-number">{statusCounts.preparing}</p>
                </div>
              </div>
              
              <div className="stat-card completed" style={{borderLeftColor: STATUS_COLORS.completed}}>
                <div className="stat-icon"><FaCheckCircle /></div>
                <div className="stat-content">
                  <h3>Completed Orders</h3>
                  <p className="stat-number">{statusCounts.completed}</p>
                </div>
              </div>
              
              <div className="stat-card cancelled" style={{borderLeftColor: STATUS_COLORS.cancelled}}>
                <div className="stat-icon"><FaBan /></div>
                <div className="stat-content">
                  <h3>Cancelled Orders</h3>
                  <p className="stat-number">{statusCounts.cancelled}</p>
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
                    <XAxis dataKey="period" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), "Amount"]}
                      contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="totalSales" stroke="#2563eb" name="Total Sales" strokeWidth={2} />
                    <Line type="monotone" dataKey="totalGST" stroke="#10b981" name="Total GST" strokeWidth={2} />
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
                    <XAxis dataKey="period" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
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
                    <XAxis dataKey="period" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
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
                <BarChart data={topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" tickFormatter={(value) => `₹${value}`} />
                  <YAxis type="category" dataKey="name" width={100} stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), "Revenue"]}
                    contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="totalSales" fill="#8b5cf6" name="Revenue" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Items by Quantity */}
            <div className="chart-container">
              <h3>Top Items by Quantity Sold</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topItems}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    dataKey="quantity"
                    nameKey="name"
                  >
                    {topItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

            {/* Daily Sales Distribution */}
            <div className="chart-container">
              <h3>Sales by Day of Week</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSalesByDayOfWeek(filteredOrders)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), "Sales"]}
                    contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="sales" fill="#ec4899" name="Sales" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Item Performance Matrix */}
            <div className="chart-container">
              <h3>Item Performance Matrix</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={getItemPerformanceMatrix(topItems)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="quantity" name="Quantity" stroke="#6b7280" />
                  <YAxis dataKey="revenue" name="Revenue" stroke="#6b7280" tickFormatter={(value) => `₹${value}`} />
                  <ZAxis dataKey="name" name="Item" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === "quantity") return [value, "Quantity"];
                      if (name === "revenue") return [formatCurrency(value), "Revenue"];
                      return [value, name];
                    }}
                    contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Scatter name="Items" fill="#06b6d4" shape="circle" />
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
                      <span className="status-badge pending">{period.pending}</span>
                    </td>
                    <td>
                      <span className="status-badge preparing">{period.preparing}</span>
                    </td>
                    <td>
                      <span className="status-badge completed">{period.completed}</span>
                    </td>
                    <td>
                      <span className="status-badge cancelled">{period.cancelled}</span>
                    </td>
                    <td className="amount">{formatCurrency(period.totalSales)}</td>
                    <td className="amount">{formatCurrency(period.totalGST)}</td>
                    <td className="amount">{formatCurrency(period.totalSales - period.totalGST)}</td>
                    <td className="amount">{formatCurrency(period.totalSales / period.totalOrders)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;