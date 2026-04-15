import React, { useEffect, useState, useRef } from 'react';
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
  FaCommentDots
} from 'react-icons/fa';
import './Border.css';

const Border = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Border using backend:', API_URL);
  
  const [groupedOrders, setGroupedOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantData, setRestaurantData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTable, setSearchTable] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    filters: true,
    orders: true
  });
  
  // Popup State
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('success');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    tableNumber: '',
    items: [],
    subtotal: 0,
    gstAmount: 0,
    total: 0,
    discount: 0,
    discountType: 'amount',
    discountedTotal: 0,
    status: 'pending'
  });
  
  const printRefs = useRef({});

  // Show popup notification
  const showPopupNotification = (message, type = 'success') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  // Fixed helper function to calculate discounted total
  const calculateDiscountedTotal = (total, discount, discountType) => {
    if (discountType === 'percentage') {
      const validDiscount = Math.min(Math.max(discount, 0), 100);
      const discountAmount = total * (validDiscount / 100);
      return Math.max(0, parseFloat((total - discountAmount).toFixed(2)));
    } else {
      const validDiscount = Math.min(Math.max(discount, 0), total);
      return Math.max(0, parseFloat((total - validDiscount).toFixed(2)));
    }
  };

  // Function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const userRole = localStorage.getItem('userRole');
    const userRestaurantSlug = localStorage.getItem('restaurantSlug');
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Session expired. Please login again.');
      setLoading(false);
      navigate('/');
      return;
    }
    
    if (userRole !== 'billing' && userRole !== 'owner') {
      setError('Access denied. This page is for billing staff and owners only.');
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
      fetchOrders();
      fetchMenuItems();
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
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
        const grouped = {};
        
        response.data.orders.forEach(order => {
          const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const gstAmount = order.gstAmount || order.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity * (item.gstPercentage || restaurantData?.gstPercentage || 18) / 100);
          }, 0);
          const total = subtotal + gstAmount;
          const discount = order.discount || 0;
          const discountType = order.discountType || 'amount';
          
          const discountedTotal = calculateDiscountedTotal(total, discount, discountType);
          
          order.subtotal = parseFloat(subtotal.toFixed(2));
          order.gstAmount = parseFloat(gstAmount.toFixed(2));
          order.total = parseFloat(total.toFixed(2));
          order.discount = parseFloat(discount);
          order.discountType = discountType;
          order.discountedTotal = parseFloat(discountedTotal);
          
          if (!grouped[order.date]) {
            grouped[order.date] = [];
          }
          grouped[order.date].push(order);
        });
        
        Object.keys(grouped).forEach(date => {
          grouped[date].sort((a, b) => {
            const statusPriority = {
              'completed': 1,
              'preparing': 2,
              'pending': 3,
              'cancelled': 4
            };
            const priorityA = statusPriority[a.status] || 5;
            const priorityB = statusPriority[b.status] || 5;
            if (priorityA !== priorityB) return priorityA - priorityB;
            return b.billNumber - a.billNumber;
          });
        });
        
        setGroupedOrders(grouped);
        setError(null);
      } else {
        setGroupedOrders({});
        setError('No orders found');
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      let errorMessage = 'Failed to load orders: ';
      
      if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        localStorage.clear();
        setTimeout(() => navigate('/'), 2000);
      } else if (err.response?.status === 404) {
        errorMessage = `No orders found for ${restaurantData?.restaurantName || restaurantSlug}`;
        setGroupedOrders({});
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Server is not responding.';
      } else if (!err.response) {
        errorMessage = 'Cannot connect to server. Please check backend is running.';
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setGroupedOrders({});
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/menu/restaurant/${restaurantSlug}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data) {
        setMenuItems(response.data);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  // Manual refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchOrders();
      showPopupNotification('Orders refreshed successfully!', 'success');
    } catch (err) {
      showPopupNotification('Failed to refresh orders', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter orders
  const getFilteredGroupedOrders = () => {
    const filtered = {};
    
    Object.keys(groupedOrders).forEach(date => {
      let dateOrders = groupedOrders[date];
      
      if (searchTable.trim()) {
        dateOrders = dateOrders.filter(order => 
          order.tableNumber?.toString().toLowerCase().includes(searchTable.toLowerCase())
        );
      }
      
      if (statusFilter !== 'all') {
        dateOrders = dateOrders.filter(order => order.status === statusFilter);
      }
      
      if (dateOrders.length > 0) {
        filtered[date] = dateOrders;
      }
    });
    
    return filtered;
  };

  // Navigation Functions
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
    console.log("🔓 Logging out from Border...");
    localStorage.clear();
    sessionStorage.clear();
    navigate("/", { replace: true });
    setTimeout(() => {
      window.location.href = "/";
    }, 50);
  };

  const handlePrint = (orderId) => {
    const printContent = printRefs.current[orderId];
    if (!printContent) {
      showPopupNotification('Print content not found', 'error');
      return;
    }
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Print Bill</title>');
    printWindow.document.write('<link rel="stylesheet" type="text/css" href="Border.css"/>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleEdit = (order) => {
    const gstPercentage = restaurantData?.gstPercentage || 18;
    
    setEditingOrder(order._id);
    setEditFormData({
      customerName: order.customerName || '',
      tableNumber: order.tableNumber || '',
      items: order.items.map((item, index) => ({
        ...item,
        uniqueId: `existing_${item._id || item.itemId}_${index}`,
        itemId: item.itemId || item._id,
        gstPercentage: item.gstPercentage || gstPercentage,
        total: (item.price || 0) * (item.quantity || 1)
      })),
      subtotal: order.subtotal || 0,
      gstAmount: order.gstAmount || 0,
      total: order.total || 0,
      discount: order.discount || 0,
      discountType: order.discountType || 'amount',
      discountedTotal: order.discountedTotal || order.total || 0,
      status: order.status || 'pending'
    });
  };

  const handleEditChange = (e, index) => {
    const { name, value } = e.target;
    
    if (name === 'status') {
      setEditFormData(prev => ({ ...prev, status: value }));
      return;
    }

    if (name === 'discountType') {
      setEditFormData(prev => {
        const newDiscountedTotal = calculateDiscountedTotal(prev.total, prev.discount, value);
        return { ...prev, discountType: value, discountedTotal: newDiscountedTotal };
      });
      return;
    }

    if (name === 'customerName' || name === 'tableNumber') {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    } else if (name === 'discount') {
      const discountValue = parseFloat(value) || 0;
      setEditFormData(prev => {
        const newDiscountedTotal = calculateDiscountedTotal(prev.total, discountValue, prev.discountType);
        return { ...prev, discount: discountValue, discountedTotal: newDiscountedTotal };
      });
    } else if (name === 'menuItem') {
      const selectedMenuItem = menuItems.find(item => item._id === value);
      if (selectedMenuItem) {
        const gstPercentage = restaurantData?.gstPercentage || 18;
        const updatedItems = [...editFormData.items];
        updatedItems[index] = {
          ...updatedItems[index],
          itemId: selectedMenuItem._id,
          name: selectedMenuItem.name,
          price: selectedMenuItem.price,
          gstPercentage: gstPercentage,
          quantity: updatedItems[index].quantity || 1,
          total: selectedMenuItem.price * (updatedItems[index].quantity || 1)
        };
        updateOrderTotals(updatedItems, editFormData.discount, editFormData.discountType);
      }
    } else {
      const updatedItems = [...editFormData.items];
      if (name === 'quantity' || name === 'price' || name === 'gstPercentage') {
        const numValue = parseFloat(value) || 0;
        updatedItems[index][name] = numValue;
        updatedItems[index].total = (updatedItems[index].price || 0) * (updatedItems[index].quantity || 1);
      } else {
        updatedItems[index][name] = value;
      }
      updateOrderTotals(updatedItems, editFormData.discount, editFormData.discountType);
    }
  };

  const updateOrderTotals = (items, discount, discountType) => {
    const newSubtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const newGstAmount = items.reduce((sum, item) => {
      return sum + ((item.total || 0) * (item.gstPercentage || restaurantData?.gstPercentage || 18) / 100);
    }, 0);
    const newTotal = parseFloat((newSubtotal + newGstAmount).toFixed(2));
    const newDiscountedTotal = calculateDiscountedTotal(newTotal, discount, discountType);
    
    setEditFormData(prev => ({
      ...prev,
      items: items,
      subtotal: parseFloat(newSubtotal.toFixed(2)),
      gstAmount: parseFloat(newGstAmount.toFixed(2)),
      total: newTotal,
      discountedTotal: newDiscountedTotal
    }));
  };

  const handleUpdateOrder = async (orderId) => {
    try {
      const allOrders = Object.values(groupedOrders).flat();
      const orderToUpdate = allOrders.find(order => order._id === orderId);
      
      if (!orderToUpdate) {
        showPopupNotification('Order not found', 'error');
        return;
      }

      const validItems = editFormData.items.map((item, index) => ({
        itemId: item.itemId || item._id,
        name: item.name?.trim() || `Item ${index + 1}`,
        price: Math.max(0, parseFloat(item.price) || 0),
        quantity: Math.max(1, parseInt(item.quantity) || 1),
        gstPercentage: Math.max(0, Math.min(100, parseFloat(item.gstPercentage) || restaurantData?.gstPercentage || 18)),
      }));

      const filteredItems = validItems.filter(item => item.name && item.name !== 'Item' && item.price > 0);

      if (filteredItems.length === 0) {
        showPopupNotification('Please add at least one valid item', 'error');
        return;
      }

      const subtotal = parseFloat(filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
      const gstAmount = parseFloat(filteredItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity * (item.gstPercentage || restaurantData?.gstPercentage || 18) / 100);
      }, 0).toFixed(2));
      const total = parseFloat((subtotal + gstAmount).toFixed(2));
      const discount = parseFloat(editFormData.discount) || 0;
      const discountType = editFormData.discountType || 'amount';
      const discountedTotal = calculateDiscountedTotal(total, discount, discountType);
      
      const finalData = {
        customerName: editFormData.customerName?.trim() || 'Guest',
        tableNumber: editFormData.tableNumber?.trim() || 'Takeaway',
        items: filteredItems,
        subtotal: subtotal,
        gstAmount: gstAmount,
        total: total,
        discount: discount,
        discountType: discountType,
        discountedTotal: discountedTotal,
        status: editFormData.status
      };

      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API_URL}/api/order/${orderToUpdate.restaurantCode}/${orderToUpdate.billNumber}`,
        finalData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      await fetchOrders();
      setEditingOrder(null);
      showPopupNotification('✅ Order updated successfully!', 'success');
      
    } catch (err) {
      console.error('❌ Error updating order:', err);
      showPopupNotification('Failed to update order', 'error');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        const allOrders = Object.values(groupedOrders).flat();
        const orderToDelete = allOrders.find(order => order._id === orderId);
        
        if (!orderToDelete) {
          showPopupNotification('Order not found', 'error');
          return;
        }
        
        const token = localStorage.getItem('token');
        
        await axios.delete(
          `${API_URL}/api/order/${orderToDelete.restaurantCode}/${orderToDelete.billNumber}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        fetchOrders();
        showPopupNotification('✅ Order deleted successfully!', 'success');
      } catch (err) {
        console.error('Error deleting order:', err);
        showPopupNotification('Failed to delete order', 'error');
      }
    }
  };

  // FIXED: Add item row with unique ID
  const addItemRow = () => {
    const gstPercentage = restaurantData?.gstPercentage || 18;
    const newItem = { 
      uniqueId: `temp_${Date.now()}_${Math.random()}_${editFormData.items.length}`,
      itemId: `temp_${Date.now()}_${Math.random()}_${editFormData.items.length}`,
      name: '', 
      quantity: 1, 
      price: 0, 
      gstPercentage: gstPercentage,
      total: 0 
    };
    
    setEditFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // FIXED: Remove item row by index
  const removeItemRow = (index) => {
    const updatedItems = editFormData.items.filter((_, i) => i !== index);
    updateOrderTotals(updatedItems, editFormData.discount, editFormData.discountType);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'preparing': return 'status-preparing';
      case 'completed': return 'status-completed';
      default: return 'status-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaHourglassHalf />;
      case 'preparing': return <FaSpinner />;
      case 'completed': return <FaCheckCircle />;
      default: return <FaClock />;
    }
  };

  const clearFilters = () => {
    setSearchTable('');
    setStatusFilter('all');
    showPopupNotification('Filters cleared', 'info');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredGroupedOrders = getFilteredGroupedOrders();
  const allOrders = Object.values(groupedOrders).flat();
  const today = getTodayDate();

  // Navigation items for mobile
  const navItems = [
    { icon: FaWallet, label: 'Border', action: handleNavigateToBorder, active: true },
    { icon: FaReceipt, label: 'Total Bill', action: handleNavigateToTotalBill },
    { icon: FaCommentDots, label: 'Customer Requests', action: handleNavigateToCustomerRequests },
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
    <div className="border-container">
      {/* Popup Notification */}
      {showPopup && (
        <div className="popup-overlay">
          <div className={`popup-notification ${popupType}`}>
            <div className="popup-icon">
              {popupType === 'success' && '✅'}
              {popupType === 'error' && '❌'}
              {popupType === 'info' && 'ℹ️'}
            </div>
            <div className="popup-content">
              <p>{popupMessage}</p>
            </div>
            <button className="popup-close-btn" onClick={() => setShowPopup(false)}>
              <FaTimes />
            </button>
          </div>
        </div>
      )}

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
                className={`mobile-nav-item ${item.active ? 'active' : ''}`}
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
      <div className="border-header">
        <div className="header-content">
          <h1>
            <FaWallet /> Order Management
          </h1>
          <p className="subtitle">
            {restaurantData?.restaurantName} • {restaurantData?.restaurantCode}
          </p>
        </div>
        <div className="header-right desktop-only">
          <button className="refresh-btn" onClick={handleManualRefresh} disabled={isRefreshing}>
            {isRefreshing ? <FaSpinner className="spinner" /> : <FaSpinner />} Refresh
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="navigation-tabs desktop-only">
        <button className="nav-tab active" onClick={handleNavigateToBorder}>
          <FaWallet /> Border
        </button>
        <button className="nav-tab" onClick={handleNavigateToTotalBill}>
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

      {/* Statistics Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('stats')}>
          <h2><FaChartLine /> Order Statistics</h2>
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
                <p className="stat-number">{allOrders.length}</p>
              </div>
            </div>
            
            <div className="stat-card pending-stat">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>Pending</h3>
                <p className="stat-number">{allOrders.filter(order => order.status === 'pending').length}</p>
              </div>
            </div>
            
            <div className="stat-card preparing-stat">
              <div className="stat-icon">👨‍🍳</div>
              <div className="stat-content">
                <h3>Preparing</h3>
                <p className="stat-number">{allOrders.filter(order => order.status === 'preparing').length}</p>
              </div>
            </div>
            
            <div className="stat-card completed-stat">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Completed</h3>
                <p className="stat-number">{allOrders.filter(order => order.status === 'completed').length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('filters')}>
          <h2><FaSearch /> Filters & Search</h2>
          <div className="header-actions">
            <button className="refresh-btn-small" onClick={handleManualRefresh}>
              <FaSpinner className={isRefreshing ? 'spinner' : ''} /> Refresh
            </button>
            <button className="expand-toggle">
              {expandedSections.filters ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>
        
        {expandedSections.filters && (
          <div className="filters-section">
            <div className="filter-controls">
              <div className="filter-group">
                <label><FaSearch /> Table Number:</label>
                <div className="search-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by table number..."
                    value={searchTable}
                    onChange={(e) => setSearchTable(e.target.value)}
                    className="filter-input"
                  />
                  {searchTable && (
                    <button className="clear-input" onClick={() => setSearchTable('')}>
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>

              <div className="filter-group">
                <label><FaClock /> Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {(searchTable || statusFilter !== 'all') && (
                <button className="reset-filters-btn" onClick={clearFilters}>
                  <FaTimes /> Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Orders Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('orders')}>
          <h2><FaWallet /> Today's Orders</h2>
          <div className="header-actions">
            <span className="date-badge">📅 {today}</span>
            <button className="expand-toggle">
              {expandedSections.orders ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>
        
        {expandedSections.orders && (
          <div className="orders-content">
            {Object.keys(filteredGroupedOrders).length === 0 ? (
              <div className="no-orders">
                <div className="no-orders-icon">📭</div>
                <h3>No Orders Found</h3>
                <p>
                  {searchTable 
                    ? `No orders found for table "${searchTable}"` 
                    : `No orders for today (${today})`}
                </p>
                {(searchTable || statusFilter !== 'all') && (
                  <button className="reset-filters-btn" onClick={clearFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              Object.keys(filteredGroupedOrders)
                .sort((a, b) => new Date(b) - new Date(a))
                .map(date => (
                  <div key={date} className="date-group">
                    <h3 className="date-header">📅 {date}</h3>
                    <div className="orders-grid">
                      {filteredGroupedOrders[date].map(order => (
                        <div key={order._id} className="order-card-wrapper">
                          {editingOrder === order._id ? (
                            <div className="edit-order-modal">
                              <div className="edit-modal-header">
                                <h3>Edit Order #{order.billNumber}</h3>
                                <button 
                                  className="close-edit-btn"
                                  onClick={() => setEditingOrder(null)}
                                >
                                  <FaTimes />
                                </button>
                              </div>
                              
                              <div className="edit-form">
                                <div className="form-row">
                                  <div className="form-group">
                                    <label>Status:</label>
                                    <select
                                      name="status"
                                      value={editFormData.status}
                                      onChange={handleEditChange}
                                      className="form-select"
                                    >
                                      <option value="pending">⏳ Pending</option>
                                      <option value="preparing">👨‍🍳 Preparing</option>
                                      <option value="completed">✅ Completed</option>
                                    </select>
                                  </div>
                                  
                                  <div className="form-group">
                                    <label>Customer Name:</label>
                                    <input
                                      type="text"
                                      name="customerName"
                                      value={editFormData.customerName}
                                      onChange={handleEditChange}
                                      placeholder="Enter customer name"
                                      className="form-input"
                                    />
                                  </div>
                                  
                                  <div className="form-group">
                                    <label>Table Number:</label>
                                    <input
                                      type="text"
                                      name="tableNumber"
                                      value={editFormData.tableNumber}
                                      onChange={handleEditChange}
                                      placeholder="Enter table number"
                                      className="form-input"
                                    />
                                  </div>
                                </div>
                                
                                <div className="items-section">
                                  <label>Order Items:</label>
                                  {editFormData.items && editFormData.items.length > 0 ? (
                                    editFormData.items.map((item, index) => (
                                      <div key={item.uniqueId || index} className="item-row">
                                        <select
                                          name="menuItem"
                                          value={item.itemId || ''}
                                          onChange={(e) => handleEditChange(e, index)}
                                          className="menu-select"
                                        >
                                          <option value="">Select Item</option>
                                          {menuItems.map(menuItem => (
                                            <option key={menuItem._id} value={menuItem._id}>
                                              {menuItem.name} (₹{menuItem.price})
                                            </option>
                                          ))}
                                        </select>
                                        <input
                                          type="number"
                                          name="quantity"
                                          min="1"
                                          value={item.quantity || 1}
                                          onChange={(e) => handleEditChange(e, index)}
                                          className="qty-input"
                                          placeholder="Qty"
                                        />
                                        <input
                                          type="number"
                                          name="price"
                                          min="0"
                                          step="0.01"
                                          value={item.price || 0}
                                          onChange={(e) => handleEditChange(e, index)}
                                          className="price-input"
                                          placeholder="Price"
                                        />
                                        <input
                                          type="number"
                                          name="gstPercentage"
                                          min="0"
                                          max="100"
                                          step="0.1"
                                          value={item.gstPercentage || restaurantData?.gstPercentage || 18}
                                          onChange={(e) => handleEditChange(e, index)}
                                          className="gst-input"
                                          placeholder="GST%"
                                        />
                                        <span className="item-total">
                                          ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                        </span>
                                        <button 
                                          type="button" 
                                          onClick={() => removeItemRow(index)}
                                          className="remove-item-btn"
                                        >
                                          <FaMinus />
                                        </button>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="no-items-message">No items added. Click "Add Item" to add items.</div>
                                  )}
                                  <button type="button" onClick={addItemRow} className="add-item-btn">
                                    <FaPlus /> Add Item
                                  </button>
                                </div>
                                
                                <div className="discount-section">
                                  <div className="form-row">
                                    <div className="form-group">
                                      <label>Discount Type:</label>
                                      <select
                                        name="discountType"
                                        value={editFormData.discountType}
                                        onChange={handleEditChange}
                                        className="form-select"
                                      >
                                        <option value="amount">₹ Fixed Amount</option>
                                        <option value="percentage">% Percentage</option>
                                      </select>
                                    </div>
                                    
                                    <div className="form-group">
                                      <label>
                                        {editFormData.discountType === 'percentage' ? 'Discount %:' : 'Discount ₹:'}
                                      </label>
                                      <input
                                        type="number"
                                        name="discount"
                                        min="0"
                                        max={editFormData.discountType === 'percentage' ? 100 : undefined}
                                        step="0.01"
                                        value={editFormData.discount}
                                        onChange={handleEditChange}
                                        className="form-input"
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="totals-panel">
                                  <div className="total-line">
                                    <span>Subtotal:</span>
                                    <span>₹{editFormData.subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="total-line">
                                    <span>GST Amount ({restaurantData?.gstPercentage || 18}%):</span>
                                    <span>₹{editFormData.gstAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="total-line">
                                    <span>Total Before Discount:</span>
                                    <span>₹{editFormData.total.toFixed(2)}</span>
                                  </div>
                                  {editFormData.discount > 0 && (
                                    <div className="total-line discount-line">
                                      <span>Discount:</span>
                                      <span>-₹{(editFormData.total - editFormData.discountedTotal).toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="total-line final-total">
                                    <span>Final Total:</span>
                                    <span>₹{editFormData.discountedTotal.toFixed(2)}</span>
                                  </div>
                                </div>
                                
                                <div className="form-actions">
                                  <button onClick={() => handleUpdateOrder(order._id)} className="save-btn">
                                    <FaSave /> Save Changes
                                  </button>
                                  <button onClick={() => setEditingOrder(null)} className="cancel-btn">
                                    <FaTimes /> Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="order-card">
                              <div
                                className={`bill-card ${getStatusClass(order.status)}`}
                                ref={(el) => (printRefs.current[order._id] = el)}
                              >
                                <div className="bill-header-main">
                                  <h2 className="restaurant-name">{restaurantData?.restaurantName}</h2>
                                  <div className="bill-number">Bill #{order.billNumber}</div>
                                </div>
                                
                                <div className="bill-details">
                                  <div className="detail-row">
                                    <span>📅 Date:</span>
                                    <span>{order.date}</span>
                                  </div>
                                  <div className="detail-row">
                                    <span>🕒 Time:</span>
                                    <span>{order.time}</span>
                                  </div>
                                  <div className="detail-row">
                                    <span>📋 GST No:</span>
                                    <span>{restaurantData?.gstNumber || 'N/A'}</span>
                                  </div>
                                  <div className="detail-row">
                                    <span>👤 Customer:</span>
                                    <span>{order.customerName || 'Guest'}</span>
                                  </div>
                                  <div className="detail-row">
                                    <span>🪑 Table:</span>
                                    <span>{order.tableNumber || 'Takeaway'}</span>
                                  </div>
                                </div>

                                <div className="table-responsive">
                                  <table className="items-table">
                                    <thead>
                                      <tr>
                                        <th>Item</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                        <th>GST%</th>
                                        <th>Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.items.map((item, i) => (
                                        <tr key={i}>
                                          <td className="item-name">{item.name}</td>
                                          <td className="item-qty">{item.quantity}</td>
                                          <td className="item-price">₹{item.price.toFixed(2)}</td>
                                          <td className="item-gst">{item.gstPercentage || restaurantData?.gstPercentage || 18}%</td>
                                          <td className="item-total">₹{(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                <div className="totals-section">
                                  <div className="total-row">
                                    <span>Subtotal:</span>
                                    <span>₹{order.subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="total-row">
                                    <span>GST Amount ({restaurantData?.gstPercentage || 18}%):</span>
                                    <span>₹{order.gstAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="total-row">
                                    <span>Total Before Discount:</span>
                                    <span>₹{order.total.toFixed(2)}</span>
                                  </div>
                                  {order.discount > 0 && (
                                    <>
                                      <div className="total-row discount-row">
                                        <span>Discount ({order.discountType === 'percentage' ? `${order.discount}%` : `₹${order.discount.toFixed(2)}`}):</span>
                                        <span>-₹{(order.total - order.discountedTotal).toFixed(2)}</span>
                                      </div>
                                      <div className="total-row final-total">
                                        <span>Final Total:</span>
                                        <span>₹{order.discountedTotal.toFixed(2)}</span>
                                      </div>
                                    </>
                                  )}
                                  {order.discount === 0 && (
                                    <div className="total-row final-total">
                                      <span>Total:</span>
                                      <span>₹{order.total.toFixed(2)}</span>
                                    </div>
                                  )}
                                </div>

                                <div className={`status-badge ${getStatusClass(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  <span>
                                    {order.status === 'pending' && ' Pending'}
                                    {order.status === 'preparing' && ' Preparing'}
                                    {order.status === 'completed' && ' Completed'}
                                  </span>
                                </div>

                                <div className="thank-you">
                                  <p>🙏 Thank you for dining with us!</p>
                                  <p>😊 Please visit again!</p>
                                </div>
                              </div>

                              <div className="order-actions">
                                <button 
                                  className="action-btn print-btn" 
                                  onClick={() => handlePrint(order._id)}
                                  disabled={order.status !== 'completed'}
                                >
                                  <FaPrint /> Print Bill
                                </button>
                                <button className="action-btn edit-btn" onClick={() => handleEdit(order)}>
                                  <FaEdit /> Edit Order
                                </button>
                                <button className="action-btn delete-btn" onClick={() => handleDeleteOrder(order._id)}>
                                  <FaTrash /> Delete Order
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-footer">
        <p>
          {restaurantData?.restaurantName} Order Management • 
          <span className="footer-code"> {restaurantData?.restaurantCode}</span> • 
          Today: {today}
        </p>
        <p className="footer-note">
          Manage orders, process payments, and generate bills
        </p>
      </div>
    </div>
  );
};

export default Border;