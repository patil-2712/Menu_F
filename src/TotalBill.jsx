import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaChartLine,
  FaDatabase,
  FaHome,
  FaSignOutAlt,
  FaBuilding,
  FaSearch,
  FaTimes,
  FaPrint,
  FaEdit,
  FaTrash,
  FaSave,
  FaPlus,
  FaMinus,
  FaClock,
  FaCheckCircle,
  FaHourglassHalf,
  FaSpinner,
  FaBars,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaShoppingCart,
  FaReceipt,
  FaQrcode,
  FaWallet,
  FaUtensils,
  FaClipboardList,
  FaStar,
  FaEye,
  FaChartBar,
  FaCalendarAlt,
  FaCommentDots
} from 'react-icons/fa';
import './TotalBill.css';

const TotalBill = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    items: true,
    orders: true,
    revenue: true
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 TotalBill using backend:', API_URL);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSameDate = (date1, date2) => {
    return new Date(date1).toDateString() === new Date(date2).toDateString();
  };

  useEffect(() => {
    checkAuthentication();
  }, [restaurantSlug]);

  const checkAuthentication = () => {
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const userRestaurantSlug = localStorage.getItem('restaurantSlug');
    
    if (!token) {
      setError('Session expired. Please login again.');
      setLoading(false);
      navigate('/');
      return;
    }
    
    if (userRole !== 'owner' && userRole !== 'billing') {
      setError('Access denied. This page is for owners and billing staff only.');
      setLoading(false);
      navigate('/');
      return;
    }
    
    if (userRestaurantSlug !== restaurantSlug) {
      setError(`You don't have access to ${restaurantSlug}'s billing system.`);
      setLoading(false);
      navigate('/');
      return;
    }
  };

  useEffect(() => {
    if (restaurantSlug) {
      fetchRestaurantData();
      fetchTodayOrders();
    }
  }, [restaurantSlug]);

  const fetchRestaurantData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/restaurant/by-slug/${restaurantSlug}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data) {
        setRestaurantData(response.data);
        localStorage.setItem('restaurantName', response.data.restaurantName);
        localStorage.setItem('restaurantCode', response.data.restaurantCode);
      } else {
        setRestaurantData({
          restaurantName: localStorage.getItem('restaurantName') || restaurantSlug,
          restaurantCode: localStorage.getItem('restaurantCode') || 'N/A',
          gstNumber: 'N/A'
        });
      }
    } catch (err) {
      console.error('Error fetching restaurant info:', err);
      setRestaurantData({
        restaurantName: localStorage.getItem('restaurantName') || restaurantSlug,
        restaurantCode: localStorage.getItem('restaurantCode') || 'N/A',
        gstNumber: 'N/A'
      });
    }
  };

  const fetchTodayOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const today = getTodayDate();
      
      const response = await axios.get(
        `${API_URL}/api/order/billing/${restaurantSlug}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data && response.data.success) {
        const todayOrders = response.data.orders.filter(order => 
          isSameDate(order.date, today)
        );
        
        setOrders(todayOrders);
        setError(null);
      } else {
        setOrders([]);
        setError('No orders found for today');
      }
      
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      let errorMessage = 'Failed to load today\'s orders. ';
      
      if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        localStorage.clear();
        setTimeout(() => navigate('/'), 2000);
      } else if (err.response?.status === 404) {
        errorMessage = `No orders found for ${restaurantData?.restaurantName || restaurantSlug}`;
        setOrders([]);
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Server is not responding.';
      } else if (!err.response) {
        errorMessage = 'Cannot connect to server. Please check backend is running.';
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateSummary = (orders) => {
    const itemSales = {};
    let dailyTotal = 0;
    let totalBills = 0;
    let totalGST = 0;
    let completedOrders = 0;
    let pendingOrders = 0;
    let preparingOrders = 0;

    orders.forEach(order => {
      const orderTotal = order.discountedTotal || order.total || 0;
      dailyTotal += orderTotal;
      totalBills += 1;
      totalGST += order.gstAmount || 0;

      switch (order.status?.toLowerCase()) {
        case 'completed':
          completedOrders++;
          break;
        case 'preparing':
          preparingOrders++;
          break;
        case 'pending':
        default:
          pendingOrders++;
          break;
      }

      order.items.forEach(item => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = {
            quantity: 0,
            totalAmount: 0,
            gstAmount: 0
          };
        }
        const itemTotal = item.price * item.quantity;
        itemSales[item.name].quantity += item.quantity;
        itemSales[item.name].totalAmount += itemTotal;
        itemSales[item.name].gstAmount += (itemTotal * (item.gstPercentage || 18) / 100);
      });
    });

    return { 
      itemSales, 
      dailyTotal, 
      totalBills, 
      totalGST, 
      completedOrders, 
      preparingOrders,
      pendingOrders 
    };
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': 
        return <span className="status-badge pending"><FaHourglassHalf /> Pending</span>;
      case 'preparing': 
        return <span className="status-badge preparing"><FaSpinner /> Preparing</span>;
      case 'completed': 
        return <span className="status-badge completed"><FaCheckCircle /> Completed</span>;
      default: 
        return <span className="status-badge pending"><FaClock /> Pending</span>;
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  const handleNavigateToBorder = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/border`);
  };
  
  const handleNavigateToTotalBill = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/totalbill`);
  };

  const handleNavigateToCustomerRequests = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/customer-requests`);
  };
  
  // FIXED: Immediate logout without refresh needed
  const handleLogout = () => {
    console.log("🔓 Logging out from TotalBill...");
    
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

  const handleRefresh = () => {
    fetchTodayOrders();
  };

  const { 
    itemSales, 
    dailyTotal, 
    totalBills, 
    totalGST, 
    completedOrders, 
    preparingOrders,
    pendingOrders 
  } = calculateSummary(orders);
  const today = getTodayDate();

  // Navigation items for mobile
  const navItems = [
    { icon: FaWallet, label: 'Border', action: handleNavigateToBorder },
    { icon: FaReceipt, label: 'Total Bill', action: handleNavigateToTotalBill },
    { icon: FaCommentDots, label: 'Customer Requests', action: handleNavigateToCustomerRequests }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading today's orders...</p>
      </div>
    );
  }

  return (
    <div className="totalbill-container">
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
      <div className="totalbill-header">
        <div className="header-content">
          <h1>
            <FaReceipt /> Total Bill Summary
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
        <button className="nav-tab" onClick={handleNavigateToBorder}>
          <FaWallet /> Border
        </button>
        <button className="nav-tab active" onClick={handleNavigateToTotalBill}>
          <FaReceipt /> Total Bill
        </button>
        <button className="nav-tab" onClick={handleNavigateToCustomerRequests}>
          <FaCommentDots /> Customer Requests
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <h2 className="empty-title">No Orders for Today</h2>
          <p className="empty-subtitle">
            No orders have been placed today for {restaurantData?.restaurantName}. All orders will appear here automatically.
          </p>
          <div className="empty-tips">
            <h4>💡 Tips:</h4>
            <ul>
              <li>Orders are automatically synced from the kitchen system</li>
              <li>New orders will appear in real-time</li>
              <li>Check back later for today's order summary</li>
            </ul>
          </div>
          <button className="refresh-data-btn" onClick={handleRefresh}>
            <FaSpinner /> Refresh Data
          </button>
        </div>
      ) : (
        <>
          {/* Statistics Section */}
          <div className="summary-section">
            <div className="section-header" onClick={() => toggleSection('stats')}>
              <h2><FaChartBar /> Today's Statistics</h2>
              <div className="header-actions">
                <span className="date-badge"><FaCalendarAlt /> {formatDisplayDate(today)}</span>
                <button className="expand-toggle">
                  {expandedSections.stats ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
            </div>
            
            {expandedSections.stats && (
              <div className="summary-cards">
                <div className="stat-card">
                  <div className="stat-icon">📦</div>
                  <div className="stat-content">
                    <h3>Total Orders</h3>
                    <p className="stat-number">{totalBills}</p>
                  </div>
                </div>
                <div className="stat-card completed-stat">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>Completed</h3>
                    <p className="stat-number">{completedOrders}</p>
                  </div>
                </div>
                <div className="stat-card preparing-stat">
                  <div className="stat-icon">👨‍🍳</div>
                  <div className="stat-content">
                    <h3>Preparing</h3>
                    <p className="stat-number">{preparingOrders}</p>
                  </div>
                </div>
                <div className="stat-card pending-stat">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <h3>Pending</h3>
                    <p className="stat-number">{pendingOrders}</p>
                  </div>
                </div>
                <div className="stat-card revenue-stat">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <h3>Daily Revenue</h3>
                    <p className="stat-number">₹{dailyTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Selling Items Section */}
          <div className="summary-section">
            <div className="section-header" onClick={() => toggleSection('items')}>
              <h2><FaChartLine /> Top Selling Items</h2>
              <button className="expand-toggle">
                {expandedSections.items ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>
            
            {expandedSections.items && (
              <div className="top-items-grid">
                {Object.entries(itemSales)
                  .sort((a, b) => b[1].quantity - a[1].quantity)
                  .slice(0, 8)
                  .map(([itemName, sales]) => (
                    <div key={itemName} className="item-card">
                      <div className="item-header">
                        <h4 className="item-name">{itemName}</h4>
                        <span className="item-quantity-badge">{sales.quantity} sold</span>
                      </div>
                      <div className="item-details">
                        <div className="item-stat">
                          <span className="stat-label">Revenue</span>
                          <span className="stat-value">₹{sales.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="item-stat">
                          <span className="stat-label">GST</span>
                          <span className="stat-value">₹{sales.gstAmount.toFixed(2)}</span>
                        </div>
                        <div className="item-stat">
                          <span className="stat-label">Avg. Price</span>
                          <span className="stat-value">
                            ₹{(sales.totalAmount / sales.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Orders Table Section */}
          <div className="summary-section">
            <div className="section-header" onClick={() => toggleSection('orders')}>
              <h2><FaReceipt /> Today's Order Details</h2>
              <div className="header-actions">
                <span className="summary-badge">Total: ₹{dailyTotal.toFixed(2)}</span>
                <button className="refresh-btn-small" onClick={handleRefresh}>
                  <FaSpinner /> Refresh
                </button>
                <button className="expand-toggle">
                  {expandedSections.orders ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
            </div>
            
            {expandedSections.orders && (
              <div className="table-responsive">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Bill No</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th>Customer</th>
                      <th>Table</th>
                      <th>Items</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .sort((a, b) => b.billNumber - a.billNumber)
                      .map((order) => (
                        <tr key={order._id}>
                          <td className="bill-number">
                            #{order.billNumber}
                            </td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td className="order-time">
                            {order.time ? order.time.split(':').slice(0, 2).join(':') : '--:--'}
                          </td>
                          <td className="customer-name">
                            {order.customerName || 'Guest'}
                          </td>
                          <td className="table-number">
                            {order.tableNumber || 'Takeaway'}
                          </td>
                          <td className="order-items">
                            <div className="items-list">
                              {order.items.slice(0, 2).map((item, index) => (
                                <span key={index} className="item-tag">
                                  {item.name} (x{item.quantity})
                                </span>
                              ))}
                              {order.items.length > 2 && (
                                <span className="item-tag more-items">
                                  +{order.items.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="order-total">
                            <strong>₹{(order.discountedTotal || order.total || 0).toFixed(2)}</strong>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-footer">
                      <td colSpan="6" className="footer-label">
                        <strong>Grand Total for {restaurantData?.restaurantName} today:</strong>
                      </td>
                      <td className="grand-total">
                        <strong>₹{dailyTotal.toFixed(2)}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Revenue Summary Section */}
          <div className="summary-section">
            <div className="section-header" onClick={() => toggleSection('revenue')}>
              <h2><FaChartBar /> Revenue Summary</h2>
              <button className="expand-toggle">
                {expandedSections.revenue ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>
            
            {expandedSections.revenue && (
              <div className="revenue-grid">
                <div className="revenue-card">
                  <div className="revenue-icon">💵</div>
                  <div className="revenue-content">
                    <h3>₹{dailyTotal.toFixed(2)}</h3>
                    <p>Total Revenue</p>
                  </div>
                </div>
                <div className="revenue-card">
                  <div className="revenue-icon">🧾</div>
                  <div className="revenue-content">
                    <h3>₹{totalGST.toFixed(2)}</h3>
                    <p>Total GST</p>
                  </div>
                </div>
                <div className="revenue-card">
                  <div className="revenue-icon">📊</div>
                  <div className="revenue-content">
                    <h3>{totalBills}</h3>
                    <p>Total Bills</p>
                  </div>
                </div>
                <div className="revenue-card">
                  <div className="revenue-icon">📈</div>
                  <div className="revenue-content">
                    <h3>₹{(dailyTotal / (totalBills || 1)).toFixed(2)}</h3>
                    <p>Average Bill Value</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="totalbill-footer">
        <p>
          {restaurantData?.restaurantName} Total Bill Summary • 
          <span className="footer-code"> {restaurantData?.restaurantCode}</span> • 
          Today: {formatDisplayDate(today)}
        </p>
        <p className="footer-note">
          All orders are restaurant-specific and accessible only to authorized staff
        </p>
      </div>
    </div>
  );
};

export default TotalBill;