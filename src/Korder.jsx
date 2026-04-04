// Korder.jsx - Complete fixed version with proper colors and always visible items
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
  FaBuilding,
  FaUtensils,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaSearch,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaBars,
  FaTimesCircle,
  FaReceipt,
  FaWallet,
  FaClipboardList,
  FaStar,
  FaChartBar,
  FaCalendarAlt,
  FaHourglassHalf,
  FaFire,
  FaCheckDouble
} from 'react-icons/fa';
import './Korder.css';

const Korder = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Korder using backend:', API_URL);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingItems, setUpdatingItems] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    orders: true
  });
  let autoRefreshInterval = null;

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const storedRestaurantSlug = localStorage.getItem('restaurantSlug');
    
    if (!token) {
      setError('Session expired. Please login again.');
      setLoading(false);
      navigate('/');
      return;
    }
    
    if (userRole !== 'kitchen') {
      setError('Access denied. This page is for kitchen staff only.');
      setLoading(false);
      navigate('/');
      return;
    }
    
    if (storedRestaurantSlug !== restaurantSlug) {
      navigate(`/${storedRestaurantSlug}/Korder`);
    }
  };

  useEffect(() => {
    if (restaurantSlug) {
      fetchRestaurantData();
      fetchKitchenOrders();
    }
  }, [restaurantSlug]);

  useEffect(() => {
    if (restaurantData && autoRefresh) {
      autoRefreshInterval = setInterval(() => {
        fetchKitchenOrders();
      }, 30000);
      return () => {
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
        }
      };
    }
  }, [restaurantData, autoRefresh]);

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

  const fetchKitchenOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/order/kitchen/${restaurantSlug}`,
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
          formattedDate: formatDate(order.date),
          items: Array.isArray(order.items) ? order.items.map(item => ({
            ...item,
            itemStatus: item.itemStatus || item.status || 'pending',
            _id: item._id || item.itemId || Math.random().toString(36).substr(2, 9)
          })) : []
        }));
        
        setOrders(processedOrders);
        setError(null);
      } else {
        setOrders([]);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Error in fetchKitchenOrders:', err);
      let errorMessage = 'Failed to load orders. ';
      
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
    const statusA = a.status === 'pending' ? 1 : a.status === 'preparing' ? 2 : 3;
    const statusB = b.status === 'pending' ? 1 : b.status === 'preparing' ? 2 : 3;
    if (statusA !== statusB) return statusA - statusB;
    return b.billNumber - a.billNumber;
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNavigateToSetMenu = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/setmenu`);
  };

  const handleNavigateToKorder = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/Korder`);
  };

  const handleNavigateToBorder = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/border`);
  };
  
  const handleNavigateToTotalBill = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/totalbill`);
  };
  
  const handleLogout = () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
    localStorage.clear();
    sessionStorage.clear();
    navigate("/", { replace: true });
    setTimeout(() => {
      window.location.href = "/";
    }, 50);
  };

  const handleRefresh = () => {
    fetchKitchenOrders();
  };

  const navItems = [
    { icon: FaClipboardList, label: 'KOT', action: handleNavigateToKorder },
    { icon: FaUtensils, label: 'Set Menu', action: handleNavigateToSetMenu }
  ];

  const today = new Date();
  const formattedToday = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

  if (loading && orders.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading kitchen orders...</p>
      </div>
    );
  }

  return (
    <div className="korder-container">
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
      <div className="korder-header">
        <div className="header-content">
          <h1>
            <FaUtensils /> Kitchen Dashboard
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
        <button className="nav-tab active" onClick={handleNavigateToKorder}>
          <FaClipboardList /> KOT
        </button>
        <button className="nav-tab" onClick={handleNavigateToSetMenu}>
          <FaUtensils /> Set Menu
        </button>
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
          <h2><FaChartBar /> Kitchen Statistics</h2>
          <button className="expand-toggle">
            {expandedSections.stats ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.stats && (
          <div className="summary-cards">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <h3>Total Orders</h3>
                <p className="stat-number">{statistics.totalOrders}</p>
              </div>
            </div>
            <div className="stat-card pending-stat">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>Pending Items</h3>
                <p className="stat-number">{statistics.pendingItems}</p>
              </div>
            </div>
            <div className="stat-card preparing-stat">
              <div className="stat-icon">👨‍🍳</div>
              <div className="stat-content">
                <h3>Preparing Items</h3>
                <p className="stat-number">{statistics.preparingItems}</p>
              </div>
            </div>
            <div className="stat-card completed-stat">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Completed Items</h3>
                <p className="stat-number">{statistics.completedItems}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Section */}
      <div className="summary-section">
        <div className="section-header">
          <h2><FaSearch /> Search Orders</h2>
          <div className="header-actions">
            <button className="refresh-btn-small" onClick={handleRefresh} disabled={loading}>
              <FaSpinner className={loading ? 'spinner' : ''} /> Refresh
            </button>
          </div>
        </div>
        
        <div className="filters-section">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by table, customer, bill number, or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            )}
          </div>
          
          <div className="results-info">
            {searchTerm ? (
              <span>Found {filteredOrders.length} orders matching "{searchTerm}"</span>
            ) : (
              <span>Showing {filteredOrders.length} active order{filteredOrders.length !== 1 ? 's' : ''}</span>
            )}
            {autoRefresh && (
              <span className="auto-refresh-badge">
                <FaSpinner className="spinner-small" /> Auto-refresh every 30s
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Orders Section - Items Always Visible */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('orders')}>
          <h2><FaClipboardList /> Active Orders</h2>
          <button className="expand-toggle">
            {expandedSections.orders ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.orders && (
          <div className="orders-content">
            {sortedOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🍽️</div>
                <h3>No Active Orders</h3>
                <p>
                  {searchTerm 
                    ? "No orders match your search criteria" 
                    : "All orders are completed. New orders will appear here automatically"}
                </p>
              </div>
            ) : (
              <div className="orders-grid">
                {sortedOrders.map(order => {
                  const completedCount = order.items.filter(item => item.itemStatus === 'completed').length;
                  const totalCount = order.items.length;
                  const progressPercent = (completedCount / totalCount) * 100;
                  
                  return (
                    <div key={order._id} className={`order-card ${getStatusClass(order.status)}`}>
                      {/* Order Header */}
                      <div className="order-header">
                        <div className="order-header-left">
                          <div className="order-bill-info">
                            <span className="bill-label">Bill #</span>
                            <span className="bill-number">{order.billNumber}</span>
                          </div>
                          <div className="order-meta">
                            <span className="order-time">
                              <FaClock /> {formatTime(order.time)}
                            </span>
                            <span className="order-customer">
                              {order.customerName || 'Walk-in'}
                            </span>
                            {order.tableNumber && (
                              <span className="table-badge">
                                Table {order.tableNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="order-header-right">
                          <div className={`order-status-badge ${getStatusClass(order.status)}`}>
                            {order.status === 'pending' && <FaHourglassHalf />}
                            {order.status === 'preparing' && <FaFire />}
                            {order.status === 'completed' && <FaCheckCircle />}
                            <span>
                              {order.status === 'pending' && ' Pending'}
                              {order.status === 'preparing' && ' Preparing'}
                              {order.status === 'completed' && ' Completed'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="order-progress">
                        <div className="progress-info">
                          <span className="progress-text">
                            {completedCount} of {totalCount} items completed
                          </span>
                          <span className="progress-percent">
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Items List - Always Visible */}
                      <div className="order-items-container">
                        <div className="items-scrollable">
                          {order.items.map((item, idx) => {
                            const isUpdating = updatingItems[`${order._id}-${item._id}`];
                            const itemStatus = item.itemStatus || 'pending';
                            
                            return (
                              <div 
                                key={item._id || idx} 
                                className={`item-box ${getItemStatusClass(itemStatus)}`}
                              >
                                <div className="item-box-content">
                                  <div className="item-info">
                                    <div className="item-quantity-badge">
                                      {item.quantity}x
                                    </div>
                                    <div className="item-name-details">
                                      <span className="item-name">{item.name}</span>
                                      {item.note && (
                                        <span className="item-note-text">
                                          📝 {item.note}
                                        </span>
                                      )}
                                    </div>
                                    <div className="item-status-icon">
                                      {itemStatus === 'pending' && '⏳'}
                                      {itemStatus === 'preparing' && '👨‍🍳'}
                                      {itemStatus === 'completed' && '✅'}
                                    </div>
                                  </div>
                                  
                                  <div className="item-actions">
                                    <select
                                      className={`item-status-select ${getItemStatusClass(itemStatus)}`}
                                      value={itemStatus}
                                      onChange={(e) => 
                                        handleIndividualItemStatusChange(order._id, item._id, e.target.value)
                                      }
                                      disabled={isUpdating}
                                    >
                                      <option value="pending">⏳ Pending</option>
                                      <option value="preparing">👨‍🍳 Preparing</option>
                                      <option value="completed">✅ Completed</option>
                                    </select>
                                    {isUpdating && <FaSpinner className="spinner-small" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Batch Actions */}
                        <div className="batch-actions-footer">
                          <button 
                            className="batch-action-btn preparing-btn"
                            onClick={() => {
                              order.items.forEach(item => {
                                if (item.itemStatus === 'pending') {
                                  handleIndividualItemStatusChange(order._id, item._id, 'preparing');
                                }
                              });
                            }}
                          >
                            <FaFire /> Mark All as Preparing
                          </button>
                          <button 
                            className="batch-action-btn completed-btn"
                            onClick={() => {
                              order.items.forEach(item => {
                                if (item.itemStatus !== 'completed') {
                                  handleIndividualItemStatusChange(order._id, item._id, 'completed');
                                }
                              });
                            }}
                          >
                            <FaCheckDouble /> Mark All as Completed
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="korder-footer">
        <p>
          {restaurantData?.restaurantName} Kitchen Dashboard • 
          <span className="footer-code"> {restaurantData?.restaurantCode}</span> • 
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