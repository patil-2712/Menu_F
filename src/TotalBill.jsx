//import React, { useEffect, useState } from 'react';
//import axios from 'axios';
//import { useParams, useNavigate } from 'react-router-dom';
//import {
//  FaSignOutAlt,
//  FaTimes,
//  FaClock,
//  FaCheckCircle,
//  FaHourglassHalf,
//  FaSpinner,
//  FaBars,
//  FaTimesCircle,
//  FaChevronDown,
//  FaChevronUp,
//  FaExclamationTriangle,
//  FaReceipt,
//  FaWallet,
//  FaChartLine,
//  FaChartBar,
//  FaCalendarAlt,
//  FaCommentDots,
//  FaMoneyBillWave,
//  FaCreditCard,
//  FaUtensils,
//  FaBoxes,
//  FaShoppingCart,
//  FaRupeeSign,
//  FaPercent,
//  FaMobileAlt,
//  FaMoneyBill
//} from 'react-icons/fa';
//import './TotalBill.css';
//
//const TotalBill = () => {
//  const { restaurantSlug } = useParams();
//  const navigate = useNavigate();
//  
//  const [orders, setOrders] = useState([]);
//  const [loading, setLoading] = useState(true);
//  const [error, setError] = useState(null);
//  const [restaurantData, setRestaurantData] = useState(null);
//  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//  const [expandedSections, setExpandedSections] = useState({
//    stats: true,
//    payment: true,
//    items: true,
//    orders: true,
//    revenue: true
//  });
//
//  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
//  
//  console.log('🔧 TotalBill using backend:', API_URL);
//
//  const getTodayDate = () => {
//    const today = new Date();
//    const year = today.getFullYear();
//    const month = String(today.getMonth() + 1).padStart(2, '0');
//    const day = String(today.getDate()).padStart(2, '0');
//    return `${year}-${month}-${day}`;
//  };
//
//  const isSameDate = (date1, date2) => {
//    return new Date(date1).toDateString() === new Date(date2).toDateString();
//  };
//
//  useEffect(() => {
//    checkAuthentication();
//  }, [restaurantSlug]);
//
//  const checkAuthentication = () => {
//    const userRole = localStorage.getItem('userRole');
//    const token = localStorage.getItem('token');
//    const userRestaurantSlug = localStorage.getItem('restaurantSlug');
//    
//    if (!token) {
//      setError('Session expired. Please login again.');
//      setLoading(false);
//      navigate('/');
//      return;
//    }
//    
//    if (userRole !== 'owner' && userRole !== 'billing') {
//      setError('Access denied. This page is for owners and billing staff only.');
//      setLoading(false);
//      navigate('/');
//      return;
//    }
//    
//    if (userRestaurantSlug !== restaurantSlug) {
//      setError(`You don't have access to ${restaurantSlug}'s billing system.`);
//      setLoading(false);
//      navigate('/');
//      return;
//    }
//  };
//
//  useEffect(() => {
//    if (restaurantSlug) {
//      fetchRestaurantData();
//      fetchTodayOrders();
//    }
//  }, [restaurantSlug]);
//
//  const fetchRestaurantData = async () => {
//    try {
//      const token = localStorage.getItem('token');
//      const response = await axios.get(
//        `${API_URL}/api/restaurant/by-slug/${restaurantSlug}`,
//        { headers: { 'Authorization': `Bearer ${token}` } }
//      );
//      
//      if (response.data) {
//        setRestaurantData(response.data);
//        localStorage.setItem('restaurantName', response.data.restaurantName);
//        localStorage.setItem('restaurantCode', response.data.restaurantCode);
//      } else {
//        setRestaurantData({
//          restaurantName: localStorage.getItem('restaurantName') || restaurantSlug,
//          restaurantCode: localStorage.getItem('restaurantCode') || 'N/A',
//          gstNumber: 'N/A',
//          gstPercentage: 18
//        });
//      }
//    } catch (err) {
//      console.error('Error fetching restaurant info:', err);
//      setRestaurantData({
//        restaurantName: localStorage.getItem('restaurantName') || restaurantSlug,
//        restaurantCode: localStorage.getItem('restaurantCode') || 'N/A',
//        gstNumber: 'N/A',
//        gstPercentage: 18
//      });
//    }
//  };
//
//  const fetchTodayOrders = async () => {
//    try {
//      setLoading(true);
//      setError(null);
//      
//      const token = localStorage.getItem('token');
//      const today = getTodayDate();
//      
//      const response = await axios.get(
//        `${API_URL}/api/order/billing/${restaurantSlug}`,
//        {
//          headers: {
//            'Authorization': `Bearer ${token}`,
//            'Content-Type': 'application/json'
//          },
//          timeout: 10000
//        }
//      );
//      
//      if (response.data && response.data.success) {
//        const todayOrders = response.data.orders.filter(order => 
//          isSameDate(order.date, today)
//        );
//        
//        setOrders(todayOrders);
//        setError(null);
//      } else {
//        setOrders([]);
//        setError('No orders found for today');
//      }
//      
//    } catch (err) {
//      console.error('❌ Error fetching orders:', err);
//      let errorMessage = 'Failed to load today\'s orders. ';
//      
//      if (err.response?.status === 401) {
//        errorMessage = 'Session expired. Please login again.';
//        localStorage.clear();
//        setTimeout(() => navigate('/'), 2000);
//      } else if (err.response?.status === 404) {
//        errorMessage = `No orders found for ${restaurantData?.restaurantName || restaurantSlug}`;
//        setOrders([]);
//      } else if (err.code === 'ECONNABORTED') {
//        errorMessage = 'Request timeout. Server is not responding.';
//      } else if (!err.response) {
//        errorMessage = 'Cannot connect to server. Please check backend is running.';
//      } else {
//        errorMessage += err.message;
//      }
//      
//      setError(errorMessage);
//      setOrders([]);
//    } finally {
//      setLoading(false);
//    }
//  };
//
//  const formatDisplayDate = (dateString) => {
//    const options = { year: 'numeric', month: 'long', day: 'numeric' };
//    return new Date(dateString).toLocaleDateString(undefined, options);
//  };
//
//  // Calculate complete summary including payment methods and item details
//  const calculateFullSummary = (orders) => {
//    const itemSales = {};
//    let dailyTotal = 0;
//    let totalBills = 0;
//    let totalGST = 0;
//    let completedOrders = 0;
//    let pendingOrders = 0;
//    let preparingOrders = 0;
//    
//    // Payment method breakdown
//    let upiPayments = { count: 0, amount: 0 };
//    let cashPayments = { count: 0, amount: 0 };
//    let pendingPayments = { count: 0, amount: 0 };
//    
//    // Order status breakdown
//    let orderStatusCount = {
//      pending: 0,
//      preparing: 0,
//      completed: 0,
//      cancelled: 0
//    };
//
//    orders.forEach(order => {
//      const orderTotal = order.discountedTotal || order.total || 0;
//      dailyTotal += orderTotal;
//      totalBills += 1;
//      totalGST += order.gstAmount || 0;
//
//      // Order status counting
//      const status = (order.status || 'pending').toLowerCase();
//      orderStatusCount[status] = (orderStatusCount[status] || 0) + 1;
//      
//      switch (status) {
//        case 'completed':
//          completedOrders++;
//          break;
//        case 'preparing':
//          preparingOrders++;
//          break;
//        case 'pending':
//        default:
//          pendingOrders++;
//          break;
//      }
//
//      // Payment method breakdown
//      const paymentMethod = order.paymentMethod?.toLowerCase() || 'pending';
//      const paymentStatus = order.paymentStatus?.toLowerCase() || 'pending';
//      
//      if (paymentMethod === 'upi' && paymentStatus === 'paid') {
//        upiPayments.count++;
//        upiPayments.amount += orderTotal;
//      } else if (paymentMethod === 'cash' && paymentStatus === 'paid') {
//        cashPayments.count++;
//        cashPayments.amount += orderTotal;
//      } else {
//        pendingPayments.count++;
//        pendingPayments.amount += orderTotal;
//      }
//
//      // Item sales calculation with GST
//      order.items.forEach(item => {
//        if (!itemSales[item.name]) {
//          itemSales[item.name] = {
//            quantity: 0,
//            totalAmount: 0,
//            gstAmount: 0,
//            gstPercentage: item.gstPercentage || restaurantData?.gstPercentage || 18,
//            price: item.price,
//            category: item.category || 'Uncategorized',
//            type: item.type || 'Veg'
//          };
//        }
//        const itemTotal = item.price * item.quantity;
//        const itemGst = itemTotal * (itemSales[item.name].gstPercentage / 100);
//        itemSales[item.name].quantity += item.quantity;
//        itemSales[item.name].totalAmount += itemTotal;
//        itemSales[item.name].gstAmount += itemGst;
//      });
//    });
//
//    return { 
//      itemSales, 
//      dailyTotal, 
//      totalBills, 
//      totalGST, 
//      completedOrders, 
//      preparingOrders,
//      pendingOrders,
//      orderStatusCount,
//      upiPayments,
//      cashPayments,
//      pendingPayments
//    };
//  };
//
//  const getStatusBadge = (status) => {
//    const safeStatus = (status || 'pending').toLowerCase();
//    switch (safeStatus) {
//      case 'pending': 
//        return <span className="status-badge pending"><FaHourglassHalf /> Pending</span>;
//      case 'preparing': 
//        return <span className="status-badge preparing"><FaSpinner /> Preparing</span>;
//      case 'completed': 
//        return <span className="status-badge completed"><FaCheckCircle /> Completed</span>;
//      default: 
//        return <span className="status-badge pending"><FaClock /> Pending</span>;
//    }
//  };
//
//  const getPaymentMethodBadge = (paymentMethod, paymentStatus) => {
//    const method = (paymentMethod || 'pending').toLowerCase();
//    const status = (paymentStatus || 'pending').toLowerCase();
//    
//    if (method === 'upi' && status === 'paid') {
//      return <span className="payment-method-badge upi-paid"><FaMobileAlt /> UPI Paid</span>;
//    } else if (method === 'cash' && status === 'paid') {
//      return <span className="payment-method-badge cash-paid"><FaMoneyBill /> Cash Paid</span>;
//    } else if (method === 'cash') {
//      return <span className="payment-method-badge cash-pending"><FaMoneyBillWave /> Cash Pending</span>;
//    } else {
//      return <span className="payment-method-badge pending"><FaClock /> Payment Pending</span>;
//    }
//  };
//
//  const toggleSection = (section) => {
//    setExpandedSections(prev => ({
//      ...prev,
//      [section]: !prev[section]
//    }));
//  };
//
//  const handleNavigateToBorder = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/border`);
//  };
//  
//  const handleNavigateToTotalBill = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/totalbill`);
//  };
//
//  const handleNavigateToCustomerRequests = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/customer-requests`);
//  };
//  
//  const handleLogout = () => {
//    console.log("🔓 Logging out from TotalBill...");
//    localStorage.clear();
//    sessionStorage.clear();
//    navigate("/", { replace: true });
//    setTimeout(() => {
//      window.location.href = "/";
//    }, 50);
//  };
//
//  const handleRefresh = () => {
//    fetchTodayOrders();
//  };
//
//  const { 
//    itemSales, 
//    dailyTotal, 
//    totalBills, 
//    totalGST, 
//    completedOrders, 
//    preparingOrders,
//    pendingOrders,
//    orderStatusCount,
//    upiPayments,
//    cashPayments,
//    pendingPayments
//  } = calculateFullSummary(orders);
//  const today = getTodayDate();
//
//  const navItems = [
//    { icon: FaWallet, label: 'Border', action: handleNavigateToBorder },
//    { icon: FaReceipt, label: 'Total Bill', action: handleNavigateToTotalBill },
//    { icon: FaCommentDots, label: 'Customer Requests', action: handleNavigateToCustomerRequests }
//  ];
//
//  // Get top 10 selling items
//  const topItems = Object.entries(itemSales)
//    .sort((a, b) => b[1].quantity - a[1].quantity)
//    .slice(0, 10);
//
//  if (loading) {
//    return (
//      <div className="loading-container">
//        <div className="loading-spinner"></div>
//        <p>Loading today's orders...</p>
//      </div>
//    );
//  }
//
//  return (
//    <div className="totalbill-container">
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
//      <div className="totalbill-header">
//        <div className="header-content">
//          <h1>
//            <FaReceipt /> Total Bill Summary
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
//        <button className="nav-tab" onClick={handleNavigateToBorder}>
//          <FaWallet /> Border
//        </button>
//        <button className="nav-tab active" onClick={handleNavigateToTotalBill}>
//          <FaReceipt /> Total Bill
//        </button>
//        <button className="nav-tab" onClick={handleNavigateToCustomerRequests}>
//          <FaCommentDots /> Customer Requests
//        </button>
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
//      {orders.length === 0 ? (
//        <div className="empty-state">
//          <div className="empty-icon">💰</div>
//          <h2 className="empty-title">No Orders for Today</h2>
//          <p className="empty-subtitle">
//            No orders have been placed today for {restaurantData?.restaurantName}. All orders will appear here automatically.
//          </p>
//          <button className="refresh-data-btn" onClick={handleRefresh}>
//            <FaSpinner /> Refresh Data
//          </button>
//        </div>
//      ) : (
//        <>
//          {/* Statistics Section */}
//          <div className="summary-section">
//            <div className="section-header" onClick={() => toggleSection('stats')}>
//              <h2><FaChartBar /> Today's Statistics</h2>
//              <div className="header-actions">
//                <span className="date-badge"><FaCalendarAlt /> {formatDisplayDate(today)}</span>
//                <button className="expand-toggle">
//                  {expandedSections.stats ? <FaChevronUp /> : <FaChevronDown />}
//                </button>
//              </div>
//            </div>
//            
//            {expandedSections.stats && (
//              <div className="summary-cards">
//                <div className="stat-card">
//                  <div className="stat-icon">📦</div>
//                  <div className="stat-content">
//                    <h3>Total Orders</h3>
//                    <p className="stat-number">{totalBills}</p>
//                  </div>
//                </div>
//                <div className="stat-card completed-stat">
//                  <div className="stat-icon">✅</div>
//                  <div className="stat-content">
//                    <h3>Completed</h3>
//                    <p className="stat-number">{completedOrders}</p>
//                  </div>
//                </div>
//                <div className="stat-card preparing-stat">
//                  <div className="stat-icon">👨‍🍳</div>
//                  <div className="stat-content">
//                    <h3>Preparing</h3>
//                    <p className="stat-number">{preparingOrders}</p>
//                  </div>
//                </div>
//                <div className="stat-card pending-stat">
//                  <div className="stat-icon">⏳</div>
//                  <div className="stat-content">
//                    <h3>Pending</h3>
//                    <p className="stat-number">{pendingOrders}</p>
//                  </div>
//                </div>
//                <div className="stat-card revenue-stat">
//                  <div className="stat-icon">💰</div>
//                  <div className="stat-content">
//                    <h3>Total Revenue</h3>
//                    <p className="stat-number">₹{dailyTotal.toFixed(2)}</p>
//                  </div>
//                </div>
//              </div>
//            )}
//          </div>
//
//          {/* Payment Method Breakdown Section - NEW */}
//          <div className="summary-section">
//            <div className="section-header" onClick={() => toggleSection('payment')}>
//              <h2><FaCreditCard /> Payment Method Breakdown</h2>
//              <button className="expand-toggle">
//                {expandedSections.payment ? <FaChevronUp /> : <FaChevronDown />}
//              </button>
//            </div>
//            
//            {expandedSections.payment && (
//              <>
//                <div className="payment-breakdown-grid">
//                  <div className="payment-card upi-card">
//                    <div className="payment-icon"><FaMobileAlt /></div>
//                    <div className="payment-details">
//                      <h3>UPI Payments</h3>
//                      <div className="payment-amount">₹{upiPayments.amount.toFixed(2)}</div>
//                      <div className="payment-count">{upiPayments.count} orders</div>
//                    </div>
//                  </div>
//                  <div className="payment-card cash-card">
//                    <div className="payment-icon"><FaMoneyBill /></div>
//                    <div className="payment-details">
//                      <h3>Cash Payments</h3>
//                      <div className="payment-amount">₹{cashPayments.amount.toFixed(2)}</div>
//                      <div className="payment-count">{cashPayments.count} orders</div>
//                    </div>
//                  </div>
//                  <div className="payment-card pending-payment-card">
//                    <div className="payment-icon"><FaClock /></div>
//                    <div className="payment-details">
//                      <h3>Pending Payments</h3>
//                      <div className="payment-amount">₹{pendingPayments.amount.toFixed(2)}</div>
//                      <div className="payment-count">{pendingPayments.count} orders</div>
//                    </div>
//                  </div>
//                </div>
//                
//                <div className="collection-summary">
//                  <div className="collection-total">
//                    <span>Total Collection Today:</span>
//                    <strong>₹{(upiPayments.amount + cashPayments.amount).toFixed(2)}</strong>
//                  </div>
//                  <div className="collection-breakdown">
//                    <span>💳 UPI: ₹{upiPayments.amount.toFixed(2)}</span>
//                    <span>💵 Cash: ₹{cashPayments.amount.toFixed(2)}</span>
//                  </div>
//                </div>
//              </>
//            )}
//          </div>
//
//          {/* Top Selling Items Section with GST Details */}
//          <div className="summary-section">
//            <div className="section-header" onClick={() => toggleSection('items')}>
//              <h2><FaChartLine /> Top Selling Items</h2>
//              <div className="header-actions">
//                <span className="summary-badge">Total Items Sold: {Object.values(itemSales).reduce((sum, item) => sum + item.quantity, 0)}</span>
//                <button className="expand-toggle">
//                  {expandedSections.items ? <FaChevronUp /> : <FaChevronDown />}
//                </button>
//              </div>
//            </div>
//            
//            {expandedSections.items && (
//              <div className="top-items-container">
//                <div className="items-summary-header">
//                  <div className="item-name-header">Item</div>
//                  <div className="item-qty-header">Quantity</div>
//                  <div className="item-revenue-header">Revenue</div>
//                  <div className="item-gst-header">GST Amount</div>
//                  <div className="item-avg-header">Avg Price</div>
//                </div>
//                {topItems.map(([itemName, sales]) => (
//                  <div key={itemName} className="item-row">
//                    <div className="item-name-cell">
//                      <span className={`item-type-indicator ${sales.type === 'Veg' ? 'veg' : 'non-veg'}`}></span>
//                      <span className="item-name-text">{itemName}</span>
//                      <span className="item-category-badge">{sales.category}</span>
//                    </div>
//                    <div className="item-qty-cell">{sales.quantity}</div>
//                    <div className="item-revenue-cell">₹{sales.totalAmount.toFixed(2)}</div>
//                    <div className="item-gst-cell">₹{sales.gstAmount.toFixed(2)}</div>
//                    <div className="item-avg-cell">₹{(sales.totalAmount / sales.quantity).toFixed(2)}</div>
//                  </div>
//                ))}
//                
//                <div className="items-total-footer">
//                  <div className="total-label">Total</div>
//                  <div className="total-qty">{Object.values(itemSales).reduce((sum, item) => sum + item.quantity, 0)}</div>
//                  <div className="total-revenue">₹{dailyTotal.toFixed(2)}</div>
//                  <div className="total-gst">₹{totalGST.toFixed(2)}</div>
//                  <div className="total-avg">-</div>
//                </div>
//              </div>
//            )}
//          </div>
//
//          {/* Orders Table Section with Payment Method */}
//          <div className="summary-section">
//            <div className="section-header" onClick={() => toggleSection('orders')}>
//              <h2><FaReceipt /> Today's Order Details</h2>
//              <div className="header-actions">
//                <span className="summary-badge">Total: ₹{dailyTotal.toFixed(2)}</span>
//                <button className="refresh-btn-small" onClick={handleRefresh}>
//                  <FaSpinner /> Refresh
//                </button>
//                <button className="expand-toggle">
//                  {expandedSections.orders ? <FaChevronUp /> : <FaChevronDown />}
//                </button>
//              </div>
//            </div>
//            
//            {expandedSections.orders && (
//              <div className="table-responsive">
//                <table className="orders-table">
//                  <thead>
//                    <tr>
//                      <th>Bill No</th>
//                      <th>Status</th>
//                      <th>Payment</th>
//                      <th>Time</th>
//                      <th>Customer</th>
//                      <th>Table</th>
//                      <th>Items</th>
//                      <th>Total</th>
//                    </tr>
//                  </thead>
//                  <tbody>
//                    {orders
//                      .sort((a, b) => b.billNumber - a.billNumber)
//                      .map((order) => (
//                        <tr key={order._id}>
//                          <td className="bill-number">#{order.billNumber}</td>
//                          <td>{getStatusBadge(order.status)}</td>
//                          <td>{getPaymentMethodBadge(order.paymentMethod, order.paymentStatus)}</td>
//                          <td className="order-time">
//                            {order.time ? order.time.split(':').slice(0, 2).join(':') : '--:--'}
//                          </td>
//                          <td className="customer-name">{order.customerName || 'Guest'}</td>
//                          <td className="table-number">{order.tableNumber || 'Takeaway'}</td>
//                          <td className="order-items">
//                            <div className="items-list">
//                              {order.items.slice(0, 2).map((item, index) => (
//                                <span key={index} className="item-tag">
//                                  {item.name} (x{item.quantity})
//                                </span>
//                              ))}
//                              {order.items.length > 2 && (
//                                <span className="item-tag more-items">
//                                  +{order.items.length - 2} more
//                                </span>
//                              )}
//                            </div>
//                          </td>
//                          <td className="order-total">
//                            <strong>₹{(order.discountedTotal || order.total || 0).toFixed(2)}</strong>
//                          </td>
//                        </tr>
//                      ))}
//                  </tbody>
//                  <tfoot>
//                    <tr className="table-footer">
//                      <td colSpan="7" className="footer-label">
//                        <strong>Grand Total for {restaurantData?.restaurantName} today:</strong>
//                      </td>
//                      <td className="grand-total">
//                        <strong>₹{dailyTotal.toFixed(2)}</strong>
//                      </td>
//                    </tr>
//                  </tfoot>
//                </table>
//              </div>
//            )}
//          </div>
//
//          {/* Revenue Summary Section */}
//          <div className="summary-section">
//            <div className="section-header" onClick={() => toggleSection('revenue')}>
//              <h2><FaChartBar /> Revenue Summary</h2>
//              <button className="expand-toggle">
//                {expandedSections.revenue ? <FaChevronUp /> : <FaChevronDown />}
//              </button>
//            </div>
//            
//            {expandedSections.revenue && (
//              <div className="revenue-grid">
//                <div className="revenue-card">
//                  <div className="revenue-icon">💵</div>
//                  <div className="revenue-content">
//                    <h3>₹{dailyTotal.toFixed(2)}</h3>
//                    <p>Total Revenue</p>
//                  </div>
//                </div>
//                <div className="revenue-card">
//                  <div className="revenue-icon">🧾</div>
//                  <div className="revenue-content">
//                    <h3>₹{totalGST.toFixed(2)}</h3>
//                    <p>Total GST Collected</p>
//                  </div>
//                </div>
//                <div className="revenue-card">
//                  <div className="revenue-icon">📊</div>
//                  <div className="revenue-content">
//                    <h3>{totalBills}</h3>
//                    <p>Total Bills</p>
//                  </div>
//                </div>
//                <div className="revenue-card">
//                  <div className="revenue-icon">📈</div>
//                  <div className="revenue-content">
//                    <h3>₹{(dailyTotal / (totalBills || 1)).toFixed(2)}</h3>
//                    <p>Average Bill Value</p>
//                  </div>
//                </div>
//                <div className="revenue-card">
//                  <div className="revenue-icon"><FaMobileAlt /></div>
//                  <div className="revenue-content">
//                    <h3>{upiPayments.count}</h3>
//                    <p>UPI Transactions</p>
//                  </div>
//                </div>
//                <div className="revenue-card">
//                  <div className="revenue-icon"><FaMoneyBill /></div>
//                  <div className="revenue-content">
//                    <h3>{cashPayments.count}</h3>
//                    <p>Cash Transactions</p>
//                  </div>
//                </div>
//              </div>
//            )}
//          </div>
//        </>
//      )}
//
//      {/* Footer */}
//      <div className="totalbill-footer">
//        <p>
//          {restaurantData?.restaurantName} Total Bill Summary • 
//          <span className="footer-code"> {restaurantData?.restaurantCode}</span> • 
//          Today: {formatDisplayDate(today)}
//        </p>
//        <p className="footer-note">
//          All orders are restaurant-specific and accessible only to authorized staff
//        </p>
//      </div>
//    </div>
//  );
//};
//
//export default TotalBill;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaSignOutAlt,
  FaTimes,
  FaClock,
  FaCheckCircle,
  FaHourglassHalf,
  FaSpinner,
  FaBars,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaReceipt,
  FaWallet,
  FaChartLine,
  FaChartBar,
  FaCalendarAlt,
  FaCommentDots,
  FaMoneyBillWave,
  FaCreditCard,
  FaUtensils,
  FaBoxes,
  FaShoppingCart,
  FaRupeeSign,
  FaPercent,
  FaMobileAlt,
  FaMoneyBill
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
    payment: true,
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
          gstNumber: 'N/A',
          gstPercentage: 18
        });
      }
    } catch (err) {
      console.error('Error fetching restaurant info:', err);
      setRestaurantData({
        restaurantName: localStorage.getItem('restaurantName') || restaurantSlug,
        restaurantCode: localStorage.getItem('restaurantCode') || 'N/A',
        gstNumber: 'N/A',
        gstPercentage: 18
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

  // Calculate complete summary including payment methods and item details
  const calculateFullSummary = (orders) => {
    const itemSales = {};
    let dailyTotal = 0;
    let totalBills = 0;
    let totalGST = 0;
    let completedOrders = 0;
    let pendingOrders = 0;
    let preparingOrders = 0;
    
    // Payment method breakdown
    let upiPayments = { count: 0, amount: 0 };
    let cashPayments = { count: 0, amount: 0 };
    let pendingPayments = { count: 0, amount: 0 };
    
    // Order status breakdown
    let orderStatusCount = {
      pending: 0,
      preparing: 0,
      completed: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      const orderTotal = order.discountedTotal || order.total || 0;
      dailyTotal += orderTotal;
      totalBills += 1;
      totalGST += order.gstAmount || 0;

      // Order status counting
      const status = (order.status || 'pending').toLowerCase();
      orderStatusCount[status] = (orderStatusCount[status] || 0) + 1;
      
      switch (status) {
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

      // Payment method breakdown
      const paymentMethod = order.paymentMethod?.toLowerCase() || 'pending';
      const paymentStatus = order.paymentStatus?.toLowerCase() || 'pending';
      
      if (paymentMethod === 'upi' && paymentStatus === 'paid') {
        upiPayments.count++;
        upiPayments.amount += orderTotal;
      } else if (paymentMethod === 'cash' && paymentStatus === 'paid') {
        cashPayments.count++;
        cashPayments.amount += orderTotal;
      } else {
        pendingPayments.count++;
        pendingPayments.amount += orderTotal;
      }

      // Item sales calculation with GST
      order.items.forEach(item => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = {
            quantity: 0,
            totalAmount: 0,
            gstAmount: 0,
            gstPercentage: item.gstPercentage || restaurantData?.gstPercentage || 18,
            price: item.price,
            category: item.category || 'Uncategorized',
            type: item.type || 'Veg'
          };
        }
        const itemTotal = item.price * item.quantity;
        const itemGst = itemTotal * (itemSales[item.name].gstPercentage / 100);
        itemSales[item.name].quantity += item.quantity;
        itemSales[item.name].totalAmount += itemTotal;
        itemSales[item.name].gstAmount += itemGst;
      });
    });

    return { 
      itemSales, 
      dailyTotal, 
      totalBills, 
      totalGST, 
      completedOrders, 
      preparingOrders,
      pendingOrders,
      orderStatusCount,
      upiPayments,
      cashPayments,
      pendingPayments
    };
  };

  const getStatusBadge = (status) => {
    const safeStatus = (status || 'pending').toLowerCase();
    switch (safeStatus) {
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

  const getPaymentMethodBadge = (paymentMethod, paymentStatus) => {
    const method = (paymentMethod || 'pending').toLowerCase();
    const status = (paymentStatus || 'pending').toLowerCase();
    
    if (method === 'upi' && status === 'paid') {
      return <span className="payment-method-badge upi-paid"><FaMobileAlt /> UPI Paid</span>;
    } else if (method === 'cash' && status === 'paid') {
      return <span className="payment-method-badge cash-paid"><FaMoneyBill /> Cash Paid</span>;
    } else if (method === 'cash') {
      return <span className="payment-method-badge cash-pending"><FaMoneyBillWave /> Cash Pending</span>;
    } else {
      return <span className="payment-method-badge pending"><FaClock /> Payment Pending</span>;
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
  
  const handleLogout = () => {
    console.log("🔓 Logging out from TotalBill...");
    localStorage.clear();
    sessionStorage.clear();
    navigate("/", { replace: true });
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
    pendingOrders,
    upiPayments,
    cashPayments,
    pendingPayments
  } = calculateFullSummary(orders);
  const today = getTodayDate();

  // Get top 10 selling items
  const topItems = Object.entries(itemSales)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 10);

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
      {/* Sidebar Navigation - LEFT side */}
      <div className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <FaReceipt className="logo-icon" />
            <span>{restaurantData?.restaurantName?.split(' ')[0] || 'Bill'}</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={handleNavigateToBorder}>
            <FaWallet /> Border
          </button>
          <button className="nav-item active" onClick={handleNavigateToTotalBill}>
            <FaReceipt /> Total Bill
          </button>
          <button className="nav-item" onClick={handleNavigateToCustomerRequests}>
            <FaCommentDots /> Customer Requests
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="content-header">
          <div className="header-info">
            <h1>Total Bill Summary</h1>
            <p className="restaurant-subtitle">{restaurantData?.restaurantName} • {restaurantData?.restaurantCode}</p>
          </div>
          <button className="refresh-btn" onClick={handleRefresh}>
            <FaSpinner /> Refresh
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
            <button className="refresh-data-btn" onClick={handleRefresh}>
              <FaSpinner /> Refresh Data
            </button>
          </div>
        ) : (
          <>
            {/* Statistics Section */}
            <div className="stats-section">
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
                <div className="stats-cards">
                  <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                      <h3>Total Orders</h3>
                      <p className="stat-number">{totalBills}</p>
                    </div>
                  </div>
                  <div className="stat-card completed-stat">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                      <h3>Completed</h3>
                      <p className="stat-number">{completedOrders}</p>
                    </div>
                  </div>
                  <div className="stat-card preparing-stat">
                    <div className="stat-icon">👨‍🍳</div>
                    <div className="stat-info">
                      <h3>Preparing</h3>
                      <p className="stat-number">{preparingOrders}</p>
                    </div>
                  </div>
                  <div className="stat-card pending-stat">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                      <h3>Pending</h3>
                      <p className="stat-number">{pendingOrders}</p>
                    </div>
                  </div>
                  <div className="stat-card revenue-stat">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                      <h3>Total Revenue</h3>
                      <p className="stat-number">₹{dailyTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Breakdown Section */}
            <div className="stats-section">
              <div className="section-header" onClick={() => toggleSection('payment')}>
                <h2><FaCreditCard /> Payment Method Breakdown</h2>
                <button className="expand-toggle">
                  {expandedSections.payment ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              
              {expandedSections.payment && (
                <>
                  <div className="payment-cards">
                    <div className="payment-card upi-card">
                      <div className="payment-icon"><FaMobileAlt /></div>
                      <div className="payment-details">
                        <h3>UPI Payments</h3>
                        <div className="payment-amount">₹{upiPayments.amount.toFixed(2)}</div>
                        <div className="payment-count">{upiPayments.count} orders</div>
                      </div>
                    </div>
                    <div className="payment-card cash-card">
                      <div className="payment-icon"><FaMoneyBill /></div>
                      <div className="payment-details">
                        <h3>Cash Payments</h3>
                        <div className="payment-amount">₹{cashPayments.amount.toFixed(2)}</div>
                        <div className="payment-count">{cashPayments.count} orders</div>
                      </div>
                    </div>
                    <div className="payment-card pending-payment-card">
                      <div className="payment-icon"><FaClock /></div>
                      <div className="payment-details">
                        <h3>Pending Payments</h3>
                        <div className="payment-amount">₹{pendingPayments.amount.toFixed(2)}</div>
                        <div className="payment-count">{pendingPayments.count} orders</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="collection-summary">
                    <div className="collection-total">
                      <span>Total Collection Today:</span>
                      <strong>₹{(upiPayments.amount + cashPayments.amount).toFixed(2)}</strong>
                    </div>
                    <div className="collection-breakdown">
                      <span>💳 UPI: ₹{upiPayments.amount.toFixed(2)}</span>
                      <span>💵 Cash: ₹{cashPayments.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Top Selling Items Section */}
            <div className="stats-section">
              <div className="section-header" onClick={() => toggleSection('items')}>
                <h2><FaChartLine /> Top Selling Items</h2>
                <div className="header-actions">
                  <span className="summary-badge">Total Items Sold: {Object.values(itemSales).reduce((sum, item) => sum + item.quantity, 0)}</span>
                  <button className="expand-toggle">
                    {expandedSections.items ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>
              </div>
              
              {expandedSections.items && (
                <div className="top-items-container">
                  <div className="items-summary-header">
                    <div className="item-name-header">Item</div>
                    <div className="item-qty-header">Quantity</div>
                    <div className="item-revenue-header">Revenue</div>
                    <div className="item-gst-header">GST Amount</div>
                    <div className="item-avg-header">Avg Price</div>
                  </div>
                  {topItems.map(([itemName, sales]) => (
                    <div key={itemName} className="item-row">
                      <div className="item-name-cell">
                        <span className={`item-type-indicator ${sales.type === 'Veg' ? 'veg' : 'non-veg'}`}></span>
                        <span className="item-name-text">{itemName}</span>
                        <span className="item-category-badge">{sales.category}</span>
                      </div>
                      <div className="item-qty-cell">{sales.quantity}</div>
                      <div className="item-revenue-cell">₹{sales.totalAmount.toFixed(2)}</div>
                      <div className="item-gst-cell">₹{sales.gstAmount.toFixed(2)}</div>
                      <div className="item-avg-cell">₹{(sales.totalAmount / sales.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                  
                  <div className="items-total-footer">
                    <div className="total-label">Total</div>
                    <div className="total-qty">{Object.values(itemSales).reduce((sum, item) => sum + item.quantity, 0)}</div>
                    <div className="total-revenue">₹{dailyTotal.toFixed(2)}</div>
                    <div className="total-gst">₹{totalGST.toFixed(2)}</div>
                    <div className="total-avg">-</div>
                  </div>
                </div>
              )}
            </div>

            {/* Orders Table Section */}
            <div className="stats-section">
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
                        <th>Payment</th>
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
                            <td className="bill-number">#{order.billNumber}</td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td>{getPaymentMethodBadge(order.paymentMethod, order.paymentStatus)}</td>
                            <td className="order-time">
                              {order.time ? order.time.split(':').slice(0, 2).join(':') : '--:--'}
                            </td>
                            <td className="customer-name">{order.customerName || 'Guest'}</td>
                            <td className="table-number">{order.tableNumber || 'Takeaway'}</td>
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
                        <td colSpan="7" className="footer-label">
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
            <div className="stats-section">
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
                      <p>Total GST Collected</p>
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
                  <div className="revenue-card">
                    <div className="revenue-icon"><FaMobileAlt /></div>
                    <div className="revenue-content">
                      <h3>{upiPayments.count}</h3>
                      <p>UPI Transactions</p>
                    </div>
                  </div>
                  <div className="revenue-card">
                    <div className="revenue-icon"><FaMoneyBill /></div>
                    <div className="revenue-content">
                      <h3>{cashPayments.count}</h3>
                      <p>Cash Transactions</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="footer">
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
    </div>
  );
};

export default TotalBill;