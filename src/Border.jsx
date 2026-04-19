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

  const showPopupNotification = (message, type = 'success') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

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

  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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
      if (response.data) setRestaurantData(response.data);
    } catch (err) {
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
        { headers: { 'Authorization': `Bearer ${token}` }, timeout: 10000 }
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
          
          if (!grouped[order.date]) grouped[order.date] = [];
          grouped[order.date].push(order);
        });
        
        setGroupedOrders(grouped);
      } else {
        setGroupedOrders({});
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
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
      if (response.data) setMenuItems(response.data);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    showPopupNotification('Orders refreshed!', 'success');
  };

  const handleEdit = (order) => {
    const gstPercentage = restaurantData?.gstPercentage || 18;
    
    setEditingOrder(order._id);
    setEditFormData({
      customerName: order.customerName || '',
      tableNumber: order.tableNumber || '',
      items: order.items.map((item, index) => ({
        uniqueId: `existing_${item._id || item.itemId}_${index}_${Date.now()}`,
        itemId: item.itemId || item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
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
          gstPercentage: selectedMenuItem.gstPercentage || gstPercentage,
          quantity: updatedItems[index].quantity || 1,
          total: selectedMenuItem.price * (updatedItems[index].quantity || 1)
        };
        updateOrderTotals(updatedItems, editFormData.discount, editFormData.discountType);
      }
    } else if (name === 'quantity') {
      const updatedItems = [...editFormData.items];
      const numValue = parseFloat(value) || 1;
      updatedItems[index].quantity = numValue;
      updatedItems[index].total = (updatedItems[index].price || 0) * numValue;
      updateOrderTotals(updatedItems, editFormData.discount, editFormData.discountType);
    }
  };

  const handleUpdateOrder = async (orderId) => {
    try {
      const allOrders = Object.values(groupedOrders).flat();
      const orderToUpdate = allOrders.find(order => order._id === orderId);
      
      if (!orderToUpdate) {
        showPopupNotification('Order not found', 'error');
        return;
      }

      const validItems = editFormData.items.filter(item => item.name && item.name.trim() !== '' && item.price > 0);
      
      if (validItems.length === 0) {
        showPopupNotification('Please add at least one valid item', 'error');
        return;
      }

      const subtotal = parseFloat(validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
      const gstAmount = parseFloat(validItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity * (item.gstPercentage || restaurantData?.gstPercentage || 18) / 100);
      }, 0).toFixed(2));
      const total = parseFloat((subtotal + gstAmount).toFixed(2));
      const discount = parseFloat(editFormData.discount) || 0;
      const discountType = editFormData.discountType || 'amount';
      const discountedTotal = calculateDiscountedTotal(total, discount, discountType);
      
      const finalData = {
        customerName: editFormData.customerName?.trim() || 'Guest',
        tableNumber: editFormData.tableNumber?.trim() || 'Takeaway',
        items: validItems.map(item => ({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          gstPercentage: item.gstPercentage
        })),
        subtotal,
        gstAmount,
        total,
        discount,
        discountType,
        discountedTotal,
        status: editFormData.status
      };

      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/order/${orderToUpdate.restaurantCode}/${orderToUpdate.billNumber}`,
        finalData,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      await fetchOrders();
      setEditingOrder(null);
      showPopupNotification('Order updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating order:', err);
      showPopupNotification('Failed to update order', 'error');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const allOrders = Object.values(groupedOrders).flat();
        const orderToDelete = allOrders.find(order => order._id === orderId);
        const token = localStorage.getItem('token');
        await axios.delete(
          `${API_URL}/api/order/${orderToDelete.restaurantCode}/${orderToDelete.billNumber}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        fetchOrders();
        showPopupNotification('Order deleted!', 'success');
      } catch (err) {
        showPopupNotification('Failed to delete order', 'error');
      }
    }
  };

  const addItemRow = () => {
    const gstPercentage = restaurantData?.gstPercentage || 18;
    const newItem = { 
      uniqueId: `temp_${Date.now()}_${Math.random()}`,
      itemId: '',
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

  const removeItemRow = (index) => {
    const updatedItems = editFormData.items.filter((_, i) => i !== index);
    updateOrderTotals(updatedItems, editFormData.discount, editFormData.discountType);
  };

  const handlePrint = (orderId) => {
    const printContent = printRefs.current[orderId];
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const getFilteredGroupedOrders = () => {
    const filtered = {};
    Object.keys(groupedOrders).forEach(date => {
      let dateOrders = groupedOrders[date];
      if (searchTable.trim()) {
        dateOrders = dateOrders.filter(order => order.tableNumber?.toString().toLowerCase().includes(searchTable.toLowerCase()));
      }
      if (statusFilter !== 'all') {
        dateOrders = dateOrders.filter(order => order.status === statusFilter);
      }
      if (dateOrders.length > 0) filtered[date] = dateOrders;
    });
    return filtered;
  };

  const clearFilters = () => {
    setSearchTable('');
    setStatusFilter('all');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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
      case 'preparing': return <FaSpinner className="spinner" />;
      case 'completed': return <FaCheckCircle />;
      default: return <FaClock />;
    }
  };

  const handleNavigateToBorder = () => navigate(`/${restaurantSlug}/border`);
  const handleNavigateToTotalBill = () => navigate(`/${restaurantSlug}/totalbill`);
  const handleNavigateToCustomerRequests = () => navigate(`/${restaurantSlug}/customer-requests`);
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const filteredGroupedOrders = getFilteredGroupedOrders();
  const allOrders = Object.values(groupedOrders).flat();
  const today = getTodayDate();

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
      {showPopup && (
        <div className="popup-overlay">
          <div className={`popup-notification ${popupType}`}>
            <div className="popup-icon">{popupType === 'success' ? '✅' : popupType === 'error' ? '❌' : 'ℹ️'}</div>
            <div className="popup-content"><p>{popupMessage}</p></div>
            <button className="popup-close-btn" onClick={() => setShowPopup(false)}><FaTimes /></button>
          </div>
        </div>
      )}

      <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <FaTimesCircle /> : <FaBars />}
      </button>

      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header"><h3>Menu</h3><button onClick={() => setMobileMenuOpen(false)}><FaTimes /></button></div>
            <button className="mobile-nav-item active" onClick={handleNavigateToBorder}><FaWallet /> Border</button>
            <button className="mobile-nav-item" onClick={handleNavigateToTotalBill}><FaReceipt /> Total Bill</button>
            <button className="mobile-nav-item" onClick={handleNavigateToCustomerRequests}><FaCommentDots /> Customer Requests</button>
            <button className="mobile-nav-item logout" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
          </div>
        </div>
      )}

      <div className="border-header">
        <div className="header-content">
          <h1><FaWallet /> Order Management</h1>
          <p className="subtitle">{restaurantData?.restaurantName} • {restaurantData?.restaurantCode}</p>
        </div>
        <div className="header-right desktop-only">
          <button className="refresh-btn" onClick={handleManualRefresh} disabled={isRefreshing}>
            {isRefreshing ? <FaSpinner className="spinner" /> : <FaSpinner />} Refresh
          </button>
          <button className="logout-button" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
        </div>
      </div>

      <div className="navigation-tabs desktop-only">
        <button className="nav-tab active" onClick={handleNavigateToBorder}><FaWallet /> Border</button>
        <button className="nav-tab" onClick={handleNavigateToTotalBill}><FaReceipt /> Total Bill</button>
        <button className="nav-tab" onClick={handleNavigateToCustomerRequests}><FaCommentDots /> Customer Requests</button>
      </div>

      {error && <div className="error-message"><FaExclamationTriangle /> {error}<button onClick={() => setError(null)}>✕</button></div>}

      {/* Statistics Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('stats')}>
          <h2><FaChartLine /> Order Statistics</h2>
          <button className="expand-toggle">{expandedSections.stats ? <FaChevronUp /> : <FaChevronDown />}</button>
        </div>
        {expandedSections.stats && (
          <div className="summary-cards">
            <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-content"><h3>Total Orders</h3><p className="stat-number">{allOrders.length}</p></div></div>
            <div className="stat-card pending-stat"><div className="stat-icon">⏳</div><div className="stat-content"><h3>Pending</h3><p className="stat-number">{allOrders.filter(o => o.status === 'pending').length}</p></div></div>
            <div className="stat-card preparing-stat"><div className="stat-icon">👨‍🍳</div><div className="stat-content"><h3>Preparing</h3><p className="stat-number">{allOrders.filter(o => o.status === 'preparing').length}</p></div></div>
            <div className="stat-card completed-stat"><div className="stat-icon">✅</div><div className="stat-content"><h3>Completed</h3><p className="stat-number">{allOrders.filter(o => o.status === 'completed').length}</p></div></div>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('filters')}>
          <h2><FaSearch /> Filters</h2>
          <div className="header-actions"><button className="refresh-btn-small" onClick={handleManualRefresh}><FaSpinner className={isRefreshing ? 'spinner' : ''} /> Refresh</button><button className="expand-toggle">{expandedSections.filters ? <FaChevronUp /> : <FaChevronDown />}</button></div>
        </div>
        {expandedSections.filters && (
          <div className="filters-section">
            <div className="filter-controls">
              <div className="filter-group"><label><FaSearch /> Table Number:</label><input type="text" placeholder="Search table..." value={searchTable} onChange={(e) => setSearchTable(e.target.value)} className="filter-input" /></div>
              <div className="filter-group"><label><FaClock /> Status:</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select"><option value="all">All</option><option value="pending">Pending</option><option value="preparing">Preparing</option><option value="completed">Completed</option></select></div>
              {(searchTable || statusFilter !== 'all') && <button className="reset-filters-btn" onClick={clearFilters}><FaTimes /> Clear</button>}
            </div>
          </div>
        )}
      </div>

      {/* Orders Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('orders')}>
          <h2><FaWallet /> Today's Orders</h2>
          <div className="header-actions"><span className="date-badge">📅 {today}</span><button className="expand-toggle">{expandedSections.orders ? <FaChevronUp /> : <FaChevronDown />}</button></div>
        </div>
        {expandedSections.orders && (
          <div className="orders-content">
            {Object.keys(filteredGroupedOrders).length === 0 ? <div className="no-orders"><div className="no-orders-icon">📭</div><h3>No Orders Found</h3></div> :
              Object.keys(filteredGroupedOrders).sort((a,b) => new Date(b) - new Date(a)).map(date => (
                <div key={date} className="date-group"><h3 className="date-header">📅 {date}</h3>
                  <div className="orders-grid">
                    {filteredGroupedOrders[date].map(order => (
                      <div key={order._id} className="order-card-wrapper">
                        {editingOrder === order._id ? (
                          /* INLINE EDIT FORM */
                          <div className="order-card edit-mode-card">
                            <div className="edit-form-container">
                              <div className="edit-form-header">
                                <h3><FaEdit /> Edit Order #{order.billNumber}</h3>
                                <button className="cancel-edit-btn" onClick={() => setEditingOrder(null)}><FaTimes /></button>
                              </div>
                              
                              <div className="edit-form-content">
                                {/* Status and Customer Info */}
                                <div className="edit-info-grid">
                                  <div className="edit-field">
                                    <label>Status:</label>
                                    <select name="status" value={editFormData.status} onChange={handleEditChange} className="edit-select">
                                      <option value="pending">⏳ Pending</option>
                                      <option value="preparing">👨‍🍳 Preparing</option>
                                      <option value="completed">✅ Completed</option>
                                    </select>
                                  </div>
                                  <div className="edit-field">
                                    <label>Customer Name:</label>
                                    <input type="text" name="customerName" value={editFormData.customerName} onChange={handleEditChange} placeholder="Customer name" className="edit-input" />
                                  </div>
                                  <div className="edit-field">
                                    <label>Table Number:</label>
                                    <input type="text" name="tableNumber" value={editFormData.tableNumber} onChange={handleEditChange} placeholder="Table number" className="edit-input" />
                                  </div>
                                </div>

                                {/* Items List */}
                                <div className="edit-items-section">
                                  <label>Order Items:</label>
                                  <div className="edit-items-list">
                                    {editFormData.items.map((item, index) => (
                                      <div key={item.uniqueId || index} className="edit-item-row">
                                        {/* Product Name - Dropdown (Editable) */}
                                        <div className="edit-item-field edit-item-name-field">
                                          <label>Product Name</label>
                                          <select
                                            name="menuItem"
                                            value={item.itemId || ''}
                                            onChange={(e) => handleEditChange(e, index)}
                                            className="edit-item-select"
                                          >
                                            <option value="">Select Item</option>
                                            {menuItems.map(menuItem => (
                                              <option key={menuItem._id} value={menuItem._id}>
                                                {menuItem.name} (₹{menuItem.price})
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        
                                        {/* Quantity - Editable */}
                                        <div className="edit-item-field">
                                          <label>Quantity</label>
                                          <input
                                            type="number"
                                            name="quantity"
                                            min="1"
                                            value={item.quantity || 1}
                                            onChange={(e) => handleEditChange(e, index)}
                                            className="edit-item-qty"
                                          />
                                        </div>
                                        
                                        {/* Price - READONLY */}
                                        <div className="edit-item-field">
                                          <label>Price (₹)</label>
                                          <input
                                            type="number"
                                            name="price"
                                            value={item.price || 0}
                                            className="edit-item-price readonly-field"
                                            readOnly
                                            disabled
                                          />
                                        </div>
                                        
                                        {/* GST% - READONLY */}
                                        <div className="edit-item-field">
                                          <label>GST%</label>
                                          <input
                                            type="number"
                                            name="gstPercentage"
                                            value={item.gstPercentage || restaurantData?.gstPercentage || 18}
                                            className="edit-item-gst readonly-field"
                                            readOnly
                                            disabled
                                          />
                                        </div>
                                        
                                        {/* Total - READONLY */}
                                        <div className="edit-item-field edit-item-total">
                                          <label>Total</label>
                                          <span>₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                                        </div>
                                        
                                        {/* Remove Button */}
                                        <div className="edit-item-field edit-item-action">
                                          <button type="button" onClick={() => removeItemRow(index)} className="edit-remove-btn">
                                            <FaTrash />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <button type="button" onClick={addItemRow} className="add-item-btn">
                                    <FaPlus /> Add Item
                                  </button>
                                </div>

                                {/* Discount Section */}
                                <div className="edit-discount-section">
                                  <div className="edit-discount-row">
                                    <label>Discount Type:</label>
                                    <select name="discountType" value={editFormData.discountType} onChange={handleEditChange} className="edit-select">
                                      <option value="amount">₹ Fixed Amount</option>
                                      <option value="percentage">% Percentage</option>
                                    </select>
                                  </div>
                                  <div className="edit-discount-row">
                                    <label>{editFormData.discountType === 'percentage' ? 'Discount %:' : 'Discount ₹:'}</label>
                                    <input type="number" name="discount" min="0" max={editFormData.discountType === 'percentage' ? 100 : undefined} step="0.01" value={editFormData.discount} onChange={handleEditChange} className="edit-input discount-input" />
                                  </div>
                                </div>

                                {/* Totals Section */}
                                <div className="edit-totals-section">
                                  <div className="edit-total-row"><span>Subtotal:</span><span>₹{editFormData.subtotal.toFixed(2)}</span></div>
                                  <div className="edit-total-row"><span>GST Amount ({restaurantData?.gstPercentage || 18}%):</span><span>₹{editFormData.gstAmount.toFixed(2)}</span></div>
                                  <div className="edit-total-row"><span>Total Before Discount:</span><span>₹{editFormData.total.toFixed(2)}</span></div>
                                  {editFormData.discount > 0 && (<div className="edit-total-row discount"><span>Discount:</span><span>-₹{(editFormData.total - editFormData.discountedTotal).toFixed(2)}</span></div>)}
                                  <div className="edit-total-row final"><span>Final Total:</span><span>₹{editFormData.discountedTotal.toFixed(2)}</span></div>
                                </div>

                                {/* Action Buttons */}
                                <div className="edit-actions">
                                  <button onClick={() => handleUpdateOrder(order._id)} className="save-edit-btn"><FaSave /> Save Changes</button>
                                  <button onClick={() => setEditingOrder(null)} className="cancel-edit-btn-action"><FaTimes /> Cancel</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="order-card">
                            <div className={`bill-card ${getStatusClass(order.status)}`} ref={(el) => (printRefs.current[order._id] = el)}>
                              <div className="bill-header-main">
                                <h2 className="restaurant-name">{restaurantData?.restaurantName}</h2>
                                <div className="bill-number">Bill #{order.billNumber}</div>
                              </div>
                              <div className="bill-details">
                                <div className="detail-row"><span>📅 Date:</span><span>{order.date}</span></div>
                                <div className="detail-row"><span>🕒 Time:</span><span>{order.time}</span></div>
                                <div className="detail-row"><span>📋 GST No:</span><span>{restaurantData?.gstNumber || 'N/A'}</span></div>
                                <div className="detail-row"><span>👤 Customer:</span><span>{order.customerName || 'Guest'}</span></div>
                                <div className="detail-row"><span>🪑 Table:</span><span>{order.tableNumber || 'Takeaway'}</span></div>
                              </div>
                              <div className="table-responsive">
                                <table className="items-table">
                                  <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>GST%</th><th>Total</th></tr></thead>
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
                                <div className="total-row"><span>Subtotal:</span><span>₹{order.subtotal.toFixed(2)}</span></div>
                                <div className="total-row"><span>GST Amount:</span><span>₹{order.gstAmount.toFixed(2)}</span></div>
                                {order.discount > 0 && (<div className="total-row discount-row"><span>Discount:</span><span>-₹{(order.total - order.discountedTotal).toFixed(2)}</span></div>)}
                                <div className="total-row final-total"><span>Total:</span><span>₹{order.discountedTotal.toFixed(2)}</span></div>
                              </div>
                              <div className={`status-badge ${getStatusClass(order.status)}`}>{getStatusIcon(order.status)}<span>{order.status === 'pending' ? ' Pending' : order.status === 'preparing' ? ' Preparing' : ' Completed'}</span></div>
                              <div className="thank-you"><p>🙏 Thank you for dining with us!</p></div>
                            </div>
                            <div className="order-actions">
                              <button className="action-btn print-btn" onClick={() => handlePrint(order._id)} disabled={order.status !== 'completed'}><FaPrint /> Print</button>
                              <button className="action-btn edit-btn" onClick={() => handleEdit(order)}><FaEdit /> Edit</button>
                              <button className="action-btn delete-btn" onClick={() => handleDeleteOrder(order._id)}><FaTrash /> Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="border-footer">
        <p>{restaurantData?.restaurantName} Order Management • Today: {today}</p>
      </div>
    </div>
  );
};

export default Border;