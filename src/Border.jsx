import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Border.css';

const Border = () => {
  const { restaurantSlug } = useParams();
  
  // Get backend URL from environment variable or use Render URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Border using backend:', API_URL);
  
  const [groupedOrders, setGroupedOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantGst, setRestaurantGst] = useState('');
  const [searchTable, setSearchTable] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
  const navigate = useNavigate();

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
    verifyAccess();
  }, [restaurantSlug]);

  const verifyAccess = () => {
    const userRole = localStorage.getItem('userRole');
    const userRestaurantSlug = localStorage.getItem('restaurantSlug');
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Session expired. Please login again.');
      setLoading(false);
      return false;
    }
    
    if (userRole !== 'billing' && userRole !== 'owner') {
      setError('Access denied. This page is for billing staff and owners only.');
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
      fetchOrders();
      fetchMenuItems();
    }
  }, [restaurantSlug]);

  const fetchRestaurantInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(
        `${API_URL}/api/restaurant/by-slug/${restaurantSlug}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        setRestaurantName(response.data.restaurantName);
        setRestaurantGst(response.data.gstNumber || 'N/A');
      }
    } catch (err) {
      console.error('Error fetching restaurant info:', err);
      setRestaurantName(localStorage.getItem('restaurantName') || restaurantSlug);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const restaurantCode = localStorage.getItem('restaurantCode');
      const today = getTodayDate();
      
      console.log("🔍 Fetching orders for billing:", {
        restaurantSlug,
        restaurantCode,
        today
      });

      // First test backend connection - CHANGED to full URL
      try {
        const testResponse = await axios.get(`${API_URL}/api/test`, { timeout: 3000 });
        console.log("✅ Backend connection OK:", testResponse.data);
      } catch (testErr) {
        throw new Error('Backend server not reachable');
      }
      
      // Fetch billing orders - CHANGED to full URL
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
      
      console.log("✅ Billing orders response:", response.data);
      
      if (response.data && response.data.success) {
        const grouped = {};
        
        response.data.orders.forEach(order => {
          // Calculate order totals if not present
          const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const gstAmount = order.gstAmount || order.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity * (item.gstPercentage || 18) / 100);
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
        
        // Sort orders within each date group (completed first, then by status priority)
        Object.keys(grouped).forEach(date => {
          grouped[date].sort((a, b) => {
            // First sort by status: completed first
            const statusPriority = {
              'completed': 1,
              'preparing': 2,
              'pending': 3,
              'cancelled': 4
            };
            
            const priorityA = statusPriority[a.status] || 5;
            const priorityB = statusPriority[b.status] || 5;
            
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            
            // If same status, sort by bill number (newest first)
            return b.billNumber - a.billNumber;
          });
        });
        
        setGroupedOrders(grouped);
        setError(null);
        
        if (response.data.orders.length === 0) {
          setGroupedOrders({});
        }
        
      } else {
        setGroupedOrders({});
        setError('No orders found for today');
      }
      
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      
      let errorMessage = 'Failed to load orders: ';
      
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
          setGroupedOrders({});
        } else {
          errorMessage += `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
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
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(
        `${API_URL}/api/menu/restaurant/${restaurantSlug}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        setMenuItems(response.data);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  // Filter orders by table number
  const filterOrdersByTable = (orders) => {
    if (!searchTable.trim()) return orders;
    
    return orders.filter(order => {
      const tableNum = order.tableNumber?.toString().toLowerCase() || '';
      return tableNum.includes(searchTable.toLowerCase());
    });
  };

  // Filter orders by status
  const filterOrdersByStatus = (orders) => {
    if (statusFilter === 'all') return orders;
    return orders.filter(order => order.status === statusFilter);
  };

  // Apply all filters to grouped orders
  const getFilteredGroupedOrders = () => {
    const filtered = {};
    
    Object.keys(groupedOrders).forEach(date => {
      let dateOrders = groupedOrders[date];
      
      // Apply table filter
      dateOrders = filterOrdersByTable(dateOrders);
      
      // Apply status filter
      dateOrders = filterOrdersByStatus(dateOrders);
      
      if (dateOrders.length > 0) {
        filtered[date] = dateOrders;
      }
    });
    
    return filtered;
  };

  const handleNavigateToPublicMenu = () => {
    navigate(`/${restaurantSlug}/menu`);
  };

  const handleNavigateToSetMenu = () => {
    navigate(`/${restaurantSlug}/setmenu`);
  };

  const handleNavigateToKorder = () => {
    navigate(`/${restaurantSlug}/Korder`);
  };

  const handleNavigateToTotalBill = () => {
    navigate(`/${restaurantSlug}/totalbill`);
  };
  
  const handleNavigateToBorder = () => {
    navigate(`/${restaurantSlug}/border`);
  };
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handlePrint = (orderId) => {
    const printContent = printRefs.current[orderId];
    if (!printContent) {
      alert('Print content not found');
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
    setEditingOrder(order._id);
    setEditFormData({
      customerName: order.customerName || '',
      tableNumber: order.tableNumber || '',
      items: order.items.map(item => ({
        ...item,
        itemId: item.itemId || item._id,
        gstPercentage: item.gstPercentage || 18,
        total: item.price * item.quantity
      })),
      subtotal: order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      gstAmount: order.gstAmount || order.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity * (item.gstPercentage || 18) / 100);
      }, 0),
      total: order.total || 0,
      discount: order.discount || 0,
      discountType: order.discountType || 'amount',
      discountedTotal: order.discountedTotal || order.total || 0,
      status: order.status || 'pending'
    });
  };

  // FIXED: handleEditChange with proper discount handling
  const handleEditChange = (e, index) => {
    const { name, value } = e.target;
    
    if (name === 'status') {
      setEditFormData(prev => ({
        ...prev,
        status: value
      }));
      return;
    }

    if (name === 'discountType') {
      // When discount type changes, recalculate discounted total without changing status
      setEditFormData(prev => {
        const newDiscountedTotal = calculateDiscountedTotal(prev.total, prev.discount, value);
        return {
          ...prev,
          discountType: value,
          discountedTotal: newDiscountedTotal
        };
      });
      return;
    }

    if (name === 'customerName' || name === 'tableNumber') {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (name === 'discount') {
      const discountValue = parseFloat(value) || 0;
      
      // When discount changes, recalculate discounted total without changing status
      setEditFormData(prev => {
        const newDiscountedTotal = calculateDiscountedTotal(prev.total, discountValue, prev.discountType);
        return {
          ...prev,
          discount: discountValue,
          discountedTotal: newDiscountedTotal
        };
      });
    } else if (name === 'menuItem') {
      const selectedMenuItem = menuItems.find(item => item._id === value);
      if (selectedMenuItem) {
        const updatedItems = [...editFormData.items];
        updatedItems[index] = {
          ...updatedItems[index],
          itemId: selectedMenuItem._id,
          name: selectedMenuItem.name,
          price: selectedMenuItem.price,
          gstPercentage: 18,
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
        updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
      } else {
        updatedItems[index][name] = value;
      }
      
      updateOrderTotals(updatedItems, editFormData.discount, editFormData.discountType);
    }
  };

  const updateOrderTotals = (items, discount, discountType) => {
    const newSubtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const newGstAmount = items.reduce((sum, item) => {
      return sum + ((item.total || 0) * (item.gstPercentage || 18) / 100);
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

  // FIXED: handleUpdateOrder with proper discount handling - CHANGED to full URL
  const handleUpdateOrder = async (orderId) => {
    try {
      console.log('🔄 Starting order update process...');

      // Find the order to get restaurantCode and billNumber
      const allOrders = Object.values(groupedOrders).flat();
      const orderToUpdate = allOrders.find(order => order._id === orderId);
      
      if (!orderToUpdate) {
        alert('❌ Order not found');
        return;
      }

      // Validate and clean items data
      const validItems = editFormData.items.map((item, index) => {
        const cleanItem = {
          itemId: item.itemId || item._id,
          name: item.name?.trim() || `Item ${index + 1}`,
          price: Math.max(0, parseFloat(item.price) || 0),
          quantity: Math.max(1, parseInt(item.quantity) || 1),
          gstPercentage: Math.max(0, Math.min(100, parseFloat(item.gstPercentage) || 18)),
        };
        return cleanItem;
      });

      // Filter out invalid items
      const filteredItems = validItems.filter(item => 
        item.name && item.name !== 'Item' && item.price > 0
      );

      if (filteredItems.length === 0) {
        alert('❌ Please add at least one valid item with a name and price');
        return;
      }

      // Calculate totals
      const subtotal = parseFloat(filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
      const gstAmount = parseFloat(filteredItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity * (item.gstPercentage || 18) / 100);
      }, 0).toFixed(2));
      const total = parseFloat((subtotal + gstAmount).toFixed(2));
      const discount = parseFloat(editFormData.discount) || 0;
      const discountType = editFormData.discountType || 'amount';
      
      const discountedTotal = calculateDiscountedTotal(total, discount, discountType);
      
      // IMPORTANT: Preserve the original status - don't change it when applying discount
      const finalStatus = editFormData.status || orderToUpdate.status || 'pending';
      
      // Prepare final data for PUT request
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
        status: finalStatus  // Keep the original status
      };

      console.log('📦 Final data to send:', finalData);
      console.log('🔗 Sending PUT request to:', `${API_URL}/api/order/${orderToUpdate.restaurantCode}/${orderToUpdate.billNumber}`);

      const token = localStorage.getItem('token');
      
      // CHANGED: Use full URL with API_URL
      const response = await axios.put(
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

      console.log('✅ Update successful! Response:', response.data);
      
      await fetchOrders();
      setEditingOrder(null);
      alert('✅ Order updated successfully with discount applied!');
      
    } catch (err) {
      console.error('❌ Error updating order:', err);
      
      if (err.code === 'ECONNABORTED') {
        alert('⏰ Request timeout - please try again');
        return;
      }

      if (err.response) {
        const serverMessage = err.response.data?.message || err.response.data?.error || 'Unknown server error';
        alert(`❌ Server Error (${err.response.status}): ${serverMessage}`);
      } else if (err.request) {
        alert('❌ No response from server - please check if the server is running');
      } else {
        alert(`❌ Request error: ${err.message}`);
      }
    }
  };

  // FIXED: Dedicated function for applying discount without changing status - CHANGED to full URL
  const handleApplyDiscountOnly = async (orderId) => {
    try {
      const allOrders = Object.values(groupedOrders).flat();
      const order = allOrders.find(o => o._id === orderId);
      if (!order) return;
      
      const token = localStorage.getItem('token');
      
      const discountData = {
        discount: parseFloat(editFormData.discount) || 0,
        discountType: editFormData.discountType || 'amount'
      };
      
      console.log('🎯 Applying discount only:', discountData);
      
      // CHANGED: Use full URL with API_URL
      const response = await axios.post(
        `${API_URL}/api/order/${order.restaurantCode}/${order.billNumber}/discount`,
        discountData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Discount applied successfully:', response.data);
      await fetchOrders();
      alert('✅ Discount applied successfully!');
    } catch (err) {
      console.error('❌ Error applying discount:', err);
      alert('❌ Failed to apply discount');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        const allOrders = Object.values(groupedOrders).flat();
        const orderToDelete = allOrders.find(order => order._id === orderId);
        
        if (!orderToDelete) {
          alert('❌ Order not found');
          return;
        }
        
        const token = localStorage.getItem('token');
        
        // CHANGED: Use full URL with API_URL
        await axios.delete(
          `${API_URL}/api/order/${orderToDelete.restaurantCode}/${orderToDelete.billNumber}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        fetchOrders();
        alert('✅ Order deleted successfully!');
      } catch (err) {
        console.error('Error deleting order:', err);
        alert('❌ Failed to delete order');
      }
    }
  };

  const addItemRow = () => {
    setEditFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        _id: `temp_${Date.now()}_${prev.items.length}`,
        itemId: `temp_${Date.now()}_${prev.items.length}`,
        name: '', 
        quantity: 1, 
        price: 0, 
        gstPercentage: 18,
        total: 0 
      }]
    }));
  };

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

  const handleRefresh = () => {
    fetchOrders();
  };

  const clearFilters = () => {
    setSearchTable('');
    setStatusFilter('all');
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading {restaurantName || restaurantSlug}'s orders...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p className="error-message">Error: {error}</p>
      <div className="error-actions">
        <button className="retry-button" onClick={fetchOrders}>Retry</button>
        <button className="logout-button" onClick={handleLogout}>Login Again</button>
      </div>
    </div>
  );

  const filteredGroupedOrders = getFilteredGroupedOrders();
  const allOrders = Object.values(groupedOrders).flat();
  const filteredOrders = Object.values(filteredGroupedOrders).flat();
  const today = getTodayDate();

  return (
    <div className="border-container">
      {/* Header */}
      <div className="border-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="border-title">
              <span className="title-icon">📊</span>
              {restaurantName} - Order Management
            </h1>
            <p className="border-subtitle">Manage and track all today's orders with real-time updates</p>
            <div className="restaurant-info">
              <span className="restaurant-code">{localStorage.getItem('restaurantCode')}</span>
              <span className="restaurant-date">Today: {today}</span>
            </div>
          </div>
          <div className="header-actions">
            {/* Search by Table Number */}
            <div className="search-table-container">
              <input
                type="text"
                className="search-table-input"
                placeholder="🔍 Search by table number..."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
              />
              {searchTable && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchTable('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Status Filter */}
            <select
              className="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">📋 All Orders</option>
              <option value="pending">⏳ Pending Orders</option>
              <option value="preparing">👨‍🍳 Preparing Orders</option>
              <option value="completed">✅ Completed Orders</option>
            </select>
            
            {(searchTable || statusFilter !== 'all') && (
              <button 
                className="clear-filters-btn"
                onClick={clearFilters}
                title="Clear all filters"
              >
                ✕ Clear Filters
              </button>
            )}
            
            <button 
              className="nav-btn border-btn"
              onClick={handleNavigateToBorder}
            >
              <span className="nav-btn-icon">📊</span>
              Border
            </button>

            <button 
              className="nav-btn totalbill-btn"
              onClick={handleNavigateToTotalBill}
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

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{allOrders.length}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card service">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{allOrders.filter(order => order.status === 'pending').length}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
        <div className="stat-card food">
          <div className="stat-icon">👨‍🍳</div>
          <div className="stat-content">
            <h3>{allOrders.filter(order => order.status === 'preparing').length}</h3>
            <p>Preparing Orders</p>
          </div>
        </div>
        <div className="stat-card overall">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{allOrders.filter(order => order.status === 'completed').length}</h3>
            <p>Completed Orders</p>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <div className="results-left">
          <p>
            {Object.keys(filteredGroupedOrders).length === 0 ? 
              (searchTable ? `No orders found for table "${searchTable}"` : `No orders for today (${today})`) : 
              `Showing ${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''} for today (${today})`
            }
            {searchTable && ` • Filtered by table: ${searchTable}`}
            {statusFilter !== 'all' && ` • Status: ${statusFilter}`}
          </p>
        </div>
        <div className="results-right">
          <button className="refresh-btn" onClick={handleRefresh}>
            🔄 Refresh Orders
          </button>
        </div>
      </div>

      {Object.keys(filteredGroupedOrders).length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2 className="empty-title">
            {searchTable ? `No Orders for Table ${searchTable}` : "No Orders for Today"}
          </h2>
          <p className="empty-subtitle">
            {searchTable 
              ? `No orders found matching table number "${searchTable}"` 
              : "All orders placed today will appear here automatically"}
          </p>
          <div className="empty-tips">
            <h4>💡 Tips:</h4>
            <ul>
              <li>Orders are automatically synced from the kitchen system</li>
              <li>New orders will appear in real-time</li>
              <li>Use the search by table number to find specific orders</li>
              <li>Filter by status to focus on pending, preparing, or completed orders</li>
              <li>Print bills only for completed orders</li>
            </ul>
          </div>
        </div>
      ) : (
        Object.keys(filteredGroupedOrders)
          .sort((a, b) => new Date(b) - new Date(a))
          .map(date => (
            <div key={date} className="date-group">
              <h3 className="date-header">Today's Date: {date}</h3>
              <div className="orders-grid">
                {filteredGroupedOrders[date].map(order => (
                  <div key={order._id} className="order-card-wrapper">
                    {editingOrder === order._id ? (
                      <div className="edit-order-form">
                        <div className="edit-header">
                          <h3>Edit Order #{order.billNumber}</h3>
                          <button 
                            className="close-edit-btn"
                            onClick={() => setEditingOrder(null)}
                          >
                            ×
                          </button>
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Status:</label>
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
                            <label className="form-label">Customer Name:</label>
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
                            <label className="form-label">Table Number:</label>
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
                          <h4>Order Items:</h4>
                          {editFormData.items.map((item, index) => (
                            <div key={index} className="item-row-editable">
                              <select
                                name="menuItem"
                                value={item.itemId || item._id || ''}
                                onChange={(e) => handleEditChange(e, index)}
                                className="menu-dropdown"
                              >
                                <option value="">Select Menu Item</option>
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
                                value={item.quantity}
                                onChange={(e) => handleEditChange(e, index)}
                                className="quantity-input"
                                placeholder="Qty"
                              />
                              <input
                                type="number"
                                name="price"
                                min="0"
                                step="0.01"
                                value={item.price}
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
                                value={item.gstPercentage}
                                onChange={(e) => handleEditChange(e, index)}
                                className="gst-input"
                                placeholder="GST %"
                              />
                              <span className="item-total-display">
                                ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                              </span>
                              <button 
                                type="button" 
                                onClick={() => removeItemRow(index)}
                                className="remove-item-btn"
                                title="Remove item"
                              >
                                🗑️
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={addItemRow} className="add-item-btn">
                            ➕ Add New Item
                          </button>
                        </div>
                        
                        <div className="discount-section">
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">Discount Type:</label>
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
                              <label className="form-label">
                                {editFormData.discountType === 'percentage' ? 'Discount Percentage (%):' : 'Discount Amount (₹):'}
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
                        
                        <div className="total-display-edit">
                          <div className="total-row">
                            <span>Subtotal:</span>
                            <span>₹{editFormData.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="total-row">
                            <span>GST Amount:</span>
                            <span>₹{editFormData.gstAmount.toFixed(2)}</span>
                          </div>
                          <div className="total-row">
                            <span>Total Before Discount:</span>
                            <span>₹{editFormData.total.toFixed(2)}</span>
                          </div>
                          {editFormData.discount > 0 && (
                            <>
                              <div className="total-row discount-row">
                                <span>
                                  Discount: {editFormData.discountType === 'percentage' 
                                    ? `${editFormData.discount}%` 
                                    : `₹${editFormData.discount.toFixed(2)}`}
                                </span>
                                <span>-₹{(editFormData.total - editFormData.discountedTotal).toFixed(2)}</span>
                              </div>
                              <div className="total-row final-total">
                                <span>Final Total:</span>
                                <span>₹{editFormData.discountedTotal.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          {editFormData.discount === 0 && (
                            <div className="total-row final-total">
                              <span>Total:</span>
                              <span>₹{editFormData.total.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="form-actions">
                          <button onClick={() => handleUpdateOrder(order._id)} className="save-btn">
                            💾 Save Changes
                          </button>
                          <button onClick={() => setEditingOrder(null)} className="cancel-btn">
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="order-card">
                        <div
                          className={`bill-card ${getStatusClass(order.status)}`}
                          ref={(el) => (printRefs.current[order._id] = el)}
                        >
                          <h2 className="restaurant-name">{restaurantName}</h2>
                          <div className="bill-header">
                            <span>📅 Date: {order.date}</span>
                            <span>🕒 Time: {order.time}</span>
                          </div>
                          <div className="bill-header">
                            <span>📋 GST No: {restaurantGst}</span>
                            <span>🧾 Bill No: {order.billNumber}</span>
                          </div>
                          <div className="bill-header">
                            <span>👤 Customer: {order.customerName || 'Guest'}</span>
                            <span>🪑 Table: {order.tableNumber || 'Takeaway'}</span>
                          </div>

                          <table className="order-items-table">
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
                                  <td className="item-gst">{item.gstPercentage}%</td>
                                  <td className="item-total">₹{(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="bill-totals">
                            <div className="total-row">
                              <span>Subtotal:</span>
                              <span>₹{order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                              <span>GST Amount:</span>
                              <span>₹{order.gstAmount.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                              <span>Total Before Discount:</span>
                              <span>₹{order.total.toFixed(2)}</span>
                            </div>
                            {order.discount > 0 && (
                              <>
                                <div className="total-row discount-row">
                                  <span>
                                    Discount: {order.discountType === 'percentage' 
                                      ? `${order.discount}%` 
                                      : `₹${order.discount.toFixed(2)}`}
                                  </span>
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

                          <div className={`order-status-display ${getStatusClass(order.status)}`}>
                            <strong>Status:</strong> 
                            {order.status === 'pending' && ' ⏳ Pending'}
                            {order.status === 'preparing' && ' 👨‍🍳 Preparing'}
                            {order.status === 'completed' && ' ✅ Completed'}
                          </div>

                          <div className="thank-you-message">
                            <p>🙏 Thank you for dining with us!</p>
                            <p>😊 Please visit again!</p>
                          </div>
                        </div>

                        <div className="order-actions">
                          <button 
                            className="action-btn print-btn" 
                            onClick={() => handlePrint(order._id)}
                            disabled={order.status !== 'completed'}
                            title={order.status !== 'completed' ? 'Complete order to print' : 'Print bill'}
                          >
                            <span className="btn-icon">🖨️</span>
                            Print Bill
                          </button>
                          <button className="action-btn edit-btn" onClick={() => handleEdit(order)}>
                            <span className="btn-icon">✏️</span>
                            Edit Order
                          </button>
                          <button className="action-btn delete-btn" onClick={() => handleDeleteOrder(order._id)}>
                            <span className="btn-icon">🗑️</span>
                            Delete Order
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
      
      {/* Footer */}
      <div className="border-footer">
        <p>
          {restaurantName} Order Management • 
          <span className="footer-restaurant-code"> {localStorage.getItem('restaurantCode')}</span> • 
          Today: {today}
        </p>
        <p className="footer-note">
          All orders are restaurant-specific and accessible only to authorized staff
        </p>
      </div>
    </div>
  );
};

export default Border;