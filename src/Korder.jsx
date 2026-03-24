import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaChartLine, 
  FaDatabase, 
  FaHome, 
  FaSignOutAlt,
  FaUserCircle,
  FaUtensils,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaSearch,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle
} from 'react-icons/fa';
import './Korder.css';

const Korder = () => {
  const { restaurantSlug } = useParams();
  
  // Get backend URL from environment variable or use Render URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Korder using backend:', API_URL);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [updatingItems, setUpdatingItems] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAccess = () => {
      const userRole = localStorage.getItem('userRole');
      const token = localStorage.getItem('token');
      const name = localStorage.getItem('userName') || 'Kitchen Staff';
      
      setUserRole(userRole);
      setUserName(name);
      
      if (userRole !== 'kitchen') {
        setError('Access denied. This page is for kitchen staff only.');
        setLoading(false);
        return false;
      }
      
      if (!token) {
        setError('Session expired. Please login again.');
        setLoading(false);
        return false;
      }
      
      return true;
    };
    
    if (!verifyAccess()) {
      return;
    }
    
    fetchRestaurantInfo();
  }, [restaurantSlug]);

  useEffect(() => {
    if (restaurantInfo && autoRefresh) {
      const interval = setInterval(() => {
        fetchKitchenOrders();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [restaurantInfo, autoRefresh]);

  const fetchRestaurantInfo = async () => {
    try {
      const storedRestaurantName = localStorage.getItem('restaurantName');
      const storedRestaurantCode = localStorage.getItem('restaurantCode');
      
      if (storedRestaurantName) {
        setRestaurantName(storedRestaurantName);
        setRestaurantInfo({
          name: storedRestaurantName,
          code: storedRestaurantCode
        });
      }
      
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
      if (response.data) {
        setRestaurantName(response.data.restaurantName);
        setRestaurantInfo(response.data);
        
        localStorage.setItem('restaurantName', response.data.restaurantName);
        localStorage.setItem('restaurantCode', response.data.restaurantCode);
      }
      
      fetchKitchenOrders();
      
    } catch (err) {
      console.error('Error fetching restaurant info:', err);
      setError('Failed to load restaurant information');
      setLoading(false);
    }
  };

  const fetchKitchenOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const slugToUse = restaurantSlug;
      
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(
        `${API_URL}/api/order/kitchen/${slugToUse}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data && response.data.success) {
        const processedOrders = response.data.orders.map(order => ({
          ...order,
          expanded: true,
          formattedDate: formatDate(order.date),
          items: Array.isArray(order.items) ? order.items.map(item => ({
            ...item,
            itemStatus: item.itemStatus || item.status || 'pending',
            _id: item._id || item.itemId || Math.random().toString(36).substr(2, 9)
          })) : []
        }));
        
        setOrders(processedOrders);
        setError(null);
        
        if (processedOrders.length > 0 && !restaurantName) {
          const firstOrder = processedOrders[0];
          setRestaurantName(firstOrder.restaurantName);
          setRestaurantInfo({
            name: firstOrder.restaurantName,
            code: firstOrder.restaurantCode,
            slug: firstOrder.restaurantSlug
          });
        }
      } else {
        setOrders([]);
        setError(null);
      }
      
    } catch (err) {
      console.error('❌ Error in fetchKitchenOrders:', err);
      
      let errorMessage = 'Failed to load orders. ';
      
      if (err.response) {
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}-${month}-${year}`;
    } catch (e) {
      return '';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    try {
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
      return timeString;
    } catch (e) {
      return timeString;
    }
  };

  // =========== FIXED: handleIndividualItemStatusChange ===========
  const handleIndividualItemStatusChange = async (orderId, itemId, newItemStatus) => {
    const key = `${orderId}-${itemId}`;
    setUpdatingItems(prev => ({ ...prev, [key]: true }));
    
    try {
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        setError('Order not found');
        return;
      }

      const token = localStorage.getItem('token');
      
      // CHANGED: Use full URL with API_URL
      const response = await axios.patch(
        `${API_URL}/api/order/${order.restaurantCode}/${order.billNumber}/item-status`,
        {
          itemId: itemId,
          itemStatus: newItemStatus.toLowerCase()
        },
        { 
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000 
        }
      );

      console.log('✅ Backend response:', response.data);

      // FIX: Properly update the order in state by merging with existing data
      setOrders(prevOrders => 
        prevOrders.map(prevOrder => {
          if (prevOrder._id === orderId) {
            // Get the updated order from response
            const updatedOrder = response.data.order;
            
            // Merge the updated data while preserving frontend-specific fields
            const mergedOrder = {
              ...updatedOrder,
              expanded: prevOrder.expanded, // Preserve expanded state
              formattedDate: prevOrder.formattedDate, // Preserve formatted date
              // Ensure items have all needed fields and correct status
              items: updatedOrder.items.map(updatedItem => {
                // Find the corresponding item in previous order
                const prevItem = prevOrder.items.find(i => 
                  i._id === updatedItem._id || i.itemId === updatedItem.itemId
                );
                
                return {
                  ...updatedItem,
                  // Use the updated status from backend
                  itemStatus: updatedItem.itemStatus,
                  // Preserve any additional fields
                  _id: updatedItem._id || updatedItem.itemId
                };
              })
            };
            
            console.log('📊 Merged order status:', mergedOrder.status);
            console.log('📊 Merged item statuses:', mergedOrder.items.map(i => ({ name: i.name, status: i.itemStatus })));
            
            return mergedOrder;
          }
          return prevOrder;
        })
      );

    } catch (err) {
      console.error('Error updating item status:', err);
      
      let errorMessage = 'Failed to update item status: ';
      if (err.response) {
        errorMessage += err.response.data?.error || err.response.statusText;
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingItems(prev => ({ ...prev, [key]: false }));
    }
  };

  // Alternative simpler fix: just refresh all orders
  const handleIndividualItemStatusChangeSimple = async (orderId, itemId, newItemStatus) => {
    const key = `${orderId}-${itemId}`;
    setUpdatingItems(prev => ({ ...prev, [key]: true }));
    
    try {
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        setError('Order not found');
        return;
      }

      const token = localStorage.getItem('token');
      
      // CHANGED: Use full URL with API_URL
      await axios.patch(
        `${API_URL}/api/order/${order.restaurantCode}/${order.billNumber}/item-status`,
        {
          itemId: itemId,
          itemStatus: newItemStatus.toLowerCase()
        },
        { 
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000 
        }
      );

      // Simply refresh all orders from the server
      await fetchKitchenOrders();

    } catch (err) {
      console.error('Error updating item status:', err);
      
      let errorMessage = 'Failed to update item status: ';
      if (err.response) {
        errorMessage += err.response.data?.error || err.response.statusText;
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingItems(prev => ({ ...prev, [key]: false }));
    }
  };

  const getStatusPriority = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'pending': return 1;
      case 'preparing': return 2;
      case 'completed': return 3;
      case 'cancelled': return 4;
      default: return 5;
    }
  };

  const getStatusClass = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'pending': return 'status-pending';
      case 'preparing': return 'status-preparing';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getItemStatusClass = (itemStatus) => {
    const statusLower = (itemStatus || 'pending').toLowerCase();
    switch (statusLower) {
      case 'pending': return 'item-status-pending';
      case 'preparing': return 'item-status-preparing';
      case 'completed': return 'item-status-completed';
      default: return 'item-status-pending';
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === orderId 
          ? { ...order, expanded: !order.expanded }
          : order
      )
    );
  };

  const toggleAllExpansions = (expand) => {
    setOrders(prevOrders =>
      prevOrders.map(order => ({
        ...order,
        expanded: expand
      }))
    );
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (order.tableNumber && order.tableNumber.toString().toLowerCase().includes(term)) ||
      (order.customerName && order.customerName.toLowerCase().includes(term)) ||
      (order.billNumber && order.billNumber.toString().includes(term)) ||
      order.items.some(item => item.name.toLowerCase().includes(term))
    );
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const statusA = getStatusPriority(a.status);
    const statusB = getStatusPriority(b.status);
    if (statusA !== statusB) return statusA - statusB;
    return a.billNumber - b.billNumber;
  });

  const statistics = {
    totalOrders: orders.length,
    pendingItems: orders.reduce((count, order) => 
      count + order.items.filter(item => item.itemStatus === 'pending').length, 0
    ),
    preparingItems: orders.reduce((count, order) => 
      count + order.items.filter(item => item.itemStatus === 'preparing').length, 0
    ),
    completedItems: orders.reduce((count, order) => 
      count + order.items.filter(item => item.itemStatus === 'completed').length, 0
    ),
    totalItems: orders.reduce((count, order) => count + order.items.length, 0)
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchKitchenOrders();
  };

  const handleNavigateToAdmin = () => {
    const restaurantSlug = localStorage.getItem('restaurantSlug');
    if (restaurantSlug) {
      navigate(`/${restaurantSlug}/admin`);
    } else {
      navigate('/');
    }
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

  if (loading && orders.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">
          Loading kitchen orders for {restaurantName || restaurantSlug}...
        </p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="error-container">
        <div className="error-icon">🔒</div>
        <h2 className="error-title">Kitchen Access Restricted</h2>
        <div className="error-message">
          <p><strong>{error}</strong></p>
          <div className="error-details">
            <h4>Troubleshooting Steps:</h4>
            <ol>
              <li>Check if backend server is running</li>
              <li>Open backend API in new tab</li>
              <li>Verify backend API endpoint exists</li>
              <li>Check browser console for detailed errors (F12)</li>
            </ol>
          </div>
        </div>
        <div className="error-actions">
          <button className="retry-button" onClick={fetchKitchenOrders}>
            🔄 Retry Connection
          </button>
          <button className="logout-button" onClick={handleLogout}>
            🔑 Login Again
          </button>
          <button className="test-button" onClick={async () => {
            try {
              const test = await axios.get(`${API_URL}/api/test`);
              alert(`Backend is running: ${JSON.stringify(test.data)}`);
            } catch (err) {
              alert(`Backend error: ${err.message}`);
            }
          }}>
            🧪 Test Backend
          </button>
        </div>
      </div>
    );
  }

  const today = new Date();
  const formattedToday = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

  return (
    <div className="korder-container full-width">
      {/* Top Bar with User Info */}
      <div className="top-bar">
        <div className="user-info">
          <FaUserCircle className="user-avatar" />
          <span className="user-name">{userName}</span>
          <span className="user-role">KITCHEN STAFF</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Header */}
      <div className="korder-header">
        <div className="header-content">
          <h1>
            <FaUtensils /> {restaurantName} - Kitchen Dashboard
          </h1>
          <p className="subtitle">
            Real-time order management with independent item status tracking
          </p>
        </div>
        <div className="header-date">
          {formattedToday}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="navigation-tabs">
        <button 
          className="nav-tab active-tab" 
          onClick={() => toggleAllExpansions(false)}
          title="Go to Records"
        >
           👨‍🍳 Korder
        </button>
        <button 
          className="nav-tab" 
          onClick={() => navigate(`/${restaurantSlug}/setmenu`)}
          title="Go to Admin Dashboard"
        >
           📋 Set Menu
        </button>
      </div>

      {/* Header Controls */}
      <div className="header-controls-section">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by table, customer, bill number, or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        <div className="header-actions">
          <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
            <FaSpinner className={loading ? 'spinning' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <FaExclamationTriangle className="error-banner-icon" />
          <span>{error}</span>
          <button 
            className="error-banner-dismiss"
            onClick={() => setError(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-number">{statistics.totalOrders}</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending Items</h3>
            <p className="stat-number">{statistics.pendingItems}</p>
          </div>
        </div>
        <div className="stat-card preparing">
          <div className="stat-icon">👨‍🍳</div>
          <div className="stat-content">
            <h3>Preparing Items</h3>
            <p className="stat-number">{statistics.preparingItems}</p>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Completed Items</h3>
            <p className="stat-number">{statistics.completedItems}</p>
          </div>
        </div>
        <div className="stat-card items">
          <div className="stat-icon">🍽️</div>
          <div className="stat-content">
            <h3>Total Items</h3>
            <p className="stat-number">{statistics.totalItems}</p>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <div className="results-left">
          <p>
            {searchTerm ? 
              `Found ${filteredOrders.length} orders matching "${searchTerm}"` : 
              `Showing ${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <div className="results-right">
          {autoRefresh && (
            <div className="auto-refresh-info">
              <span className="refresh-indicator"></span>
              Auto-refreshing every 30 seconds
            </div>
          )}
          <div className="time-info">
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {sortedOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h2 className="empty-title">
            {searchTerm ? "No matching orders found" : "No orders for today"}
          </h2>
          <p className="empty-subtitle">
            {searchTerm 
              ? "Try adjusting your search terms" 
              : "New orders will appear here automatically"}
          </p>
          {!searchTerm && (
            <div className="empty-tips">
              <h4>📝 Tips for Kitchen Staff:</h4>
              <ul>
                <li>Orders are automatically refreshed every 30 seconds</li>
                <li>Update item status as you prepare them</li>
                <li>Click on an order to expand/collapse items</li>
                <li>Use search to find specific orders quickly</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="orders-grid">
          {sortedOrders.map(order => (
            <div 
              key={order._id} 
              className={`order-card ${order.expanded ? 'expanded' : 'collapsed'}`}
            >
              <div 
                className="order-header"
                onClick={() => toggleOrderExpansion(order._id)}
              >
                <div className="order-title-section">
                  <div className="order-number-time">
                    <h3 className="order-number">Order #{order.billNumber}</h3>
                    <div className="order-time">{formatTime(order.time)}</div>
                  </div>
                  <div className="order-customer">
                    <span className="customer-label">Customer: </span>
                    <span className="customer-name">{order.customerName || 'Walk-in'}</span>
                  </div>
                </div>
                <div className="order-header-right">
                  <div className="table-info">
                    <span className="table-label">Table:</span>
                    <span className="table-number">{order.tableNumber || 'N/A'}</span>
                  </div>
                  <div className={`order-status-badge ${getStatusClass(order.status)}`}>
                    {order.status || 'Pending'}
                  </div>
                  <div className="expand-icon">
                    {order.expanded ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </div>
              </div>

              {order.expanded && (
                <>
                  <div className="order-items-section">
                    <div className="items-header">
                      <span>Order Items</span>
                      <span className="items-count">
                        ({order.items.filter(item => item.itemStatus === 'completed').length}/
                        {order.items.length} completed)
                      </span>
                    </div>
                    <div className="order-items-container">
                      {order.items.map((item) => {
                        const isUpdating = updatingItems[`${order._id}-${item._id}`];
                        return (
                          <div 
                            key={item._id || item.itemId} 
                            className={`order-item ${getItemStatusClass(item.itemStatus)} ${isUpdating ? 'updating' : ''}`}
                          >
                            <div className="item-main-info">
                              <div className="item-roll-number">{item.rollNumber}.</div>
                              <div className="item-quantity-name">
                                <span className="item-quantity">{item.quantity}x</span>
                                <span className="item-name">{item.name}</span>
                              </div>
                              <div className="item-status-indicator">
                                {item.itemStatus === 'completed' ? '✅' : 
                                 item.itemStatus === 'preparing' ? '👨‍🍳' : '⏳'}
                              </div>
                            </div>
                            
                            <div className="item-controls">
                              <select
                                className={`item-status-select ${getItemStatusClass(item.itemStatus)}`}
                                value={item.itemStatus || 'pending'}
                                onChange={(e) => 
                                  handleIndividualItemStatusChange(order._id, item._id || item.itemId, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                disabled={isUpdating}
                              >
                                <option value="pending">⏳ Pending</option>
                                <option value="preparing">👨‍🍳 Preparing</option>
                                <option value="completed">✅ Completed</option>
                              </select>
                              {isUpdating && <div className="updating-spinner"></div>}
                            </div>

                            {item.note && (
                              <div className="item-note">
                                <span className="note-label">Note: </span>
                                {item.note}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="order-footer">
                    <div className="order-progress">
                      <div className="progress-text">
                        {order.items.filter(item => item.itemStatus === 'completed').length} of {order.items.length} items completed
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${(order.items.filter(item => item.itemStatus === 'completed').length / order.items.length) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="order-totals">
                      <div className="total-amount">
                        <span className="total-label">Order Total:</span>
                        <span className="total-value">₹{order.total?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="order-actions">
                        <button 
                          className="action-btn mark-all-preparing"
                          onClick={() => {
                            order.items.forEach(item => {
                              if (item.itemStatus === 'pending') {
                                handleIndividualItemStatusChange(order._id, item._id || item.itemId, 'preparing');
                              }
                            });
                          }}
                        >
                          Mark All as Preparing
                        </button>
                        <button 
                          className="action-btn mark-all-completed"
                          onClick={() => {
                            order.items.forEach(item => {
                              if (item.itemStatus !== 'completed') {
                                handleIndividualItemStatusChange(order._id, item._id || item.itemId, 'completed');
                              }
                            });
                          }}
                        >
                          Mark All as Completed
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Kitchen Instructions Footer */}
      <div className="kitchen-footer">
        <div className="footer-header">
          <h3>👨‍🍳 Kitchen Instructions:</h3>
          <div className="footer-stats">
            <span className="footer-stat">
              <FaClock /> {orders.length} Active Orders
            </span>
            <span className="footer-stat">
              <FaSpinner /> {statistics.preparingItems} Preparing
            </span>
          </div>
        </div>
        <div className="instructions-grid">
          <div className="instruction">
            <span className="instruction-icon status-pending-icon">⏳</span>
            <div className="instruction-content">
              <strong>Pending Items</strong>
              <p>Need to be prepared</p>
            </div>
          </div>
          <div className="instruction">
            <span className="instruction-icon status-preparing-icon">👨‍🍳</span>
            <div className="instruction-content">
              <strong>Preparing Items</strong>
              <p>Currently being cooked</p>
            </div>
          </div>
          <div className="instruction">
            <span className="instruction-icon status-completed-icon">✅</span>
            <div className="instruction-content">
              <strong>Completed Items</strong>
              <p>Ready to serve</p>
            </div>
          </div>
          <div className="instruction">
            <span className="instruction-icon status-action-icon">🔄</span>
            <div className="instruction-content">
              <strong>Update Status</strong>
              <p>Change as you work on each item</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <div className="page-footer">
        <p>
          {restaurantName} Kitchen Dashboard • 
          <span className="footer-restaurant-code"> {restaurantInfo?.code}</span> • 
          Today: {formattedToday}
        </p>
        <p className="footer-note">
          All orders are restaurant-specific and accessible only to authorized kitchen staff
        </p>
      </div>
    </div>
  );
};

export default Korder;