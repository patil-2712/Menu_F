import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './TotalBill.css';

const TotalBill = () => {
  const { restaurantSlug } = useParams(); // Get restaurant slug from URL
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const navigate = useNavigate();

  // Get backend URL from environment variable or use Render URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 TotalBill using backend:', API_URL);

  // Function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Function to compare dates (ignoring time)
  const isSameDate = (date1, date2) => {
    return new Date(date1).toDateString() === new Date(date2).toDateString();
  };

  useEffect(() => {
    verifyAccess();
  }, [restaurantSlug]);

  const verifyAccess = () => {
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const userRestaurantSlug = localStorage.getItem('restaurantSlug');
    
    if (!token) {
      setError('Session expired. Please login again.');
      setLoading(false);
      return false;
    }
    
    if (userRole !== 'owner' && userRole !== 'billing') {
      setError('Access denied. This page is for owners and billing staff only.');
      setLoading(false);
      return false;
    }
    
    if (userRestaurantSlug !== restaurantSlug) {
      setError(`You don't have access to ${restaurantSlug}'s billing system.`);
      setLoading(false);
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    if (restaurantSlug) {
      fetchRestaurantInfo();
      fetchAndFilterTodayOrders();
    }
  }, [restaurantSlug]);

  const fetchRestaurantInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedRestaurantName = localStorage.getItem('restaurantName');
      const storedRestaurantCode = localStorage.getItem('restaurantCode');
      
      if (storedRestaurantName) {
        setRestaurantName(storedRestaurantName);
        setRestaurantInfo({
          name: storedRestaurantName,
          code: storedRestaurantCode
        });
      }
      
      // Try to fetch restaurant info from API
      try {
        // CHANGED: Use full URL with API_URL
        const response = await axios.get(
          `${API_URL}/api/restaurant/by-slug/${restaurantSlug}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (response.data) {
          setRestaurantName(response.data.restaurantName);
          setRestaurantInfo(response.data);
          
          localStorage.setItem('restaurantName', response.data.restaurantName);
          localStorage.setItem('restaurantCode', response.data.restaurantCode);
        }
      } catch (apiErr) {
        console.log('Using stored restaurant info');
      }
      
    } catch (err) {
      console.error('Error fetching restaurant info:', err);
      setRestaurantName(localStorage.getItem('restaurantName') || restaurantSlug);
    }
  };

  const fetchAndFilterTodayOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const today = getTodayDate();
      
      console.log("🔍 Fetching today's orders for:", {
        restaurantSlug,
        today
      });
      
      // Test backend connection first
      try {
        // CHANGED: Use full URL with API_URL
        await axios.get(`${API_URL}/api/test`, { timeout: 3000 });
        console.log("✅ Backend connection OK");
      } catch (testErr) {
        throw new Error('Backend server not reachable');
      }
      
      // Fetch billing orders for the restaurant
      // CHANGED: Use full URL with API_URL
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
      
      console.log("✅ Orders response:", response.data);
      
      if (response.data && response.data.success) {
        // Filter orders to only include today's date
        const todayOrders = response.data.orders.filter(order => 
          isSameDate(order.date, today)
        );
        
        console.log(`📊 Found ${todayOrders.length} orders for today`);
        setOrders(todayOrders);
        setError(null);
      } else {
        setOrders([]);
        setError('No orders found for today');
      }
      
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      
      let errorMessage = 'Failed to load today\'s orders. ';
      
      if (err.message.includes('Backend server not reachable')) {
        errorMessage = 'Backend server is not running. Please start the server.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Server is not responding.';
      } else if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          localStorage.clear();
          setTimeout(() => navigate('/'), 2000);
        } else if (err.response.status === 404) {
          errorMessage = `No orders found for ${restaurantName || restaurantSlug}`;
          setOrders([]);
        } else {
          errorMessage += `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
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
      case 'pending': return <span className="status-badge pending">⏳ Pending</span>;
      case 'preparing': return <span className="status-badge preparing">👨‍🍳 Preparing</span>;
      case 'completed': return <span className="status-badge completed">✅ Completed</span>;
      default: return <span className="status-badge pending">⏳ Pending</span>;
    }
  };

  const handleNavigateToBorder = () => {
    navigate(`/${restaurantSlug}/Border`);
  };

  const handleNavigateToPublicMenu = () => {
    navigate(`/${restaurantSlug}/menu`);
  };

  const handleNavigateToKorder = () => {
    navigate(`/${restaurantSlug}/Korder`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleRefresh = () => {
    fetchAndFilterTodayOrders();
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading today's orders for {restaurantName || restaurantSlug}...</p>
    </div>
  );
  
  if (error && orders.length === 0) return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p className="error-message">Error: {error}</p>
      <div className="error-actions">
        <button className="retry-button" onClick={handleRefresh}>Retry</button>
        <button className="logout-button" onClick={handleLogout}>Login Again</button>
      </div>
    </div>
  );

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

  return (
    <div className="totalbill-container">
      {/* Header */}
      <div className="totalbill-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="totalbill-title">
              <span className="title-icon">💰</span>
              {restaurantName} - Today's Total Bill
            </h1>
            <p className="totalbill-subtitle">Complete overview of today's orders and revenue</p>
            <div className="restaurant-info">
              <span className="restaurant-code">{restaurantInfo?.code || restaurantSlug}</span>
              <span className="restaurant-date">Today: {formatDisplayDate(today)}</span>
            </div>
          </div>
          <div className="header-actions">
            {/* ✅ BORDER BUTTON - Navigate to Order Management */}
            <button 
              className="nav-btn border-btn"
              onClick={handleNavigateToBorder}
            >
              <span className="nav-btn-icon">📊</span>
              Border
            </button>
            <button 
              className="nav-btn totalbill-btn"
              onClick={() => navigate(`/${restaurantSlug}/totalbill`)}
            >
              <span className="nav-btn-icon">🧾</span>
              Total Bill
            </button>
            <button 
              className="nav-btn logout-btn"
              onClick={handleLogout}
            >
              <span className="nav-btn-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-banner-icon">⚠️</span>
          <span>{error}</span>
          <button 
            className="error-banner-dismiss"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <h2 className="empty-title">No Orders for Today</h2>
          <p className="empty-subtitle">
            No orders have been placed today for {restaurantName}. All orders will appear here automatically.
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
            🔄 Refresh Data
          </button>
        </div>
      ) : (
        <>
          {/* Summary Section */}
          <div className="stats-container">
            <div className="stat-card total">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <h3>{totalBills}</h3>
                <p>Total Orders</p>
              </div>
            </div>
            <div className="stat-card completed">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{completedOrders}</h3>
                <p>Completed</p>
              </div>
            </div>
            <div className="stat-card preparing">
              <div className="stat-icon">👨‍🍳</div>
              <div className="stat-content">
                <h3>{preparingOrders}</h3>
                <p>Preparing</p>
              </div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{pendingOrders}</h3>
                <p>Pending</p>
              </div>
            </div>
            <div className="stat-card overall">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>₹{dailyTotal.toFixed(2)}</h3>
                <p>Daily Revenue</p>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="results-info">
            <div className="results-left">
              <p>
                Showing {orders.length} orders for today ({formatDisplayDate(today)})
              </p>
            </div>
            <div className="results-right">
              <div className="gst-summary">
                Total GST: ₹{totalGST.toFixed(2)}
              </div>
              <button className="refresh-btn" onClick={handleRefresh}>
                🔄 Refresh Now
              </button>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="summary-section">
            <div className="section-header">
              <h2>📈 Top Selling Items</h2>
              <div className="section-subtitle">
                Best performing items for {restaurantName} today
              </div>
            </div>
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
          </div>

          {/* Orders Table */}
          <div className="orders-section">
            <div className="section-header">
              <h2>📋 Today's Order Details</h2>
              <div className="section-summary">
                <span className="summary-item">
                  <strong>Total Revenue:</strong> ₹{dailyTotal.toFixed(2)}
                </span>
                <span className="summary-item">
                  <strong>Total GST:</strong> ₹{totalGST.toFixed(2)}
                </span>
                <span className="summary-item">
                  <strong>Total Orders:</strong> {totalBills}
                </span>
              </div>
            </div>
            <div className="table-container">
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
                      <tr key={order._id} className="order-row">
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
                      <strong>Grand Total for {restaurantName} today:</strong>
                    </td>
                    <td className="grand-total">
                      <strong>₹{dailyTotal.toFixed(2)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="revenue-summary">
            <div className="revenue-header">
              <h2>💰 Revenue Summary</h2>
            </div>
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
          </div>
        </>
      )}
    </div>
  );
};

export default TotalBill;