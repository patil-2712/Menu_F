//// MasterDashboard.jsx
//import React, { useEffect, useState } from "react";
//import { useNavigate } from "react-router-dom";
//import axios from "axios";
//import {
//  FaChartLine,
//  FaDatabase,
//  FaBuilding,
//  FaUsers,
//  FaSignOutAlt,
//  FaSpinner,
//  FaCheckCircle,
//  FaClock,
//  FaBan,
//  FaEye,
//  FaTimes,
//  FaWallet,
//  FaMoneyBill,
//  FaMobileAlt,
//  FaUtensils,
//  FaChartBar,
//  FaCalendarAlt,
//  FaSearch,
//  FaChevronDown,
//  FaChevronUp,
//  FaDownload,
//  FaEdit,
//  FaSave,
//  FaTrash,
//  FaPlus,
//  FaFilter,
//  FaRupeeSign,
//  FaPercent,
//  FaQrcode,
//  FaUniversity,
//  FaIdCard,
//  FaPhone,
//  FaEnvelope,
//  FaMapMarkerAlt,
//  FaArrowLeft,
//  FaBoxes,
//  FaShoppingCart,
//  FaCalendarWeek,
//  FaCalendarDay
//} from "react-icons/fa";
//import "./MasterDashboard.css";
//
//const MasterDashboard = () => {
//  const navigate = useNavigate();
//  const [user, setUser] = useState(null);
//  const [loading, setLoading] = useState(true);
//  const [restaurants, setRestaurants] = useState([]);
//  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
//  const [restaurantDetails, setRestaurantDetails] = useState(null);
//  const [restaurantOrders, setRestaurantOrders] = useState([]);
//  const [showRestaurantPage, setShowRestaurantPage] = useState(false);
//  const [expandedRestaurant, setExpandedRestaurant] = useState(null);
//  const [searchTerm, setSearchTerm] = useState("");
//  const [isEditing, setIsEditing] = useState(false);
//  const [editForm, setEditForm] = useState({});
//  const [saving, setSaving] = useState(false);
//  const [filterType, setFilterType] = useState("all"); // all, daily, weekly, monthly
//  const [customDate, setCustomDate] = useState("");
//  const [paymentFilter, setPaymentFilter] = useState("all"); // all, upi, cash, pending
//  const [statusFilter, setStatusFilter] = useState("all");
//  const [sortBy, setSortBy] = useState("date");
//  const [sortOrder, setSortOrder] = useState("desc");
//  const [editingItem, setEditingItem] = useState(null);
//  const [showAddItemForm, setShowAddItemForm] = useState(false);
//  const [newItem, setNewItem] = useState({ name: "", price: "", type: "Veg", category: "" });
//  const [menuItems, setMenuItems] = useState([]);
//  const [updatingMenu, setUpdatingMenu] = useState(false);
//  
//  const [stats, setStats] = useState({
//    totalRestaurants: 0,
//    totalOrders: 0,
//    totalRevenue: 0,
//    totalUPI: 0,
//    totalCash: 0,
//    totalGST: 0
//  });
//
//  const API_URL = import.meta.env.VITE_API_URL || "https://menu-b-ym9l.onrender.com";
//
//  useEffect(() => {
//    checkAuthAndFetchData();
//  }, []);
//
//  const checkAuthAndFetchData = async () => {
//    const token = localStorage.getItem("masterToken");
//    
//    if (!token) {
//      navigate("/master-login");
//      return;
//    }
//    
//    try {
//      const response = await axios.get(`${API_URL}/api/master/profile`, {
//        headers: { Authorization: `Bearer ${token}` }
//      });
//      
//      if (response.data.success) {
//        setUser(response.data.user);
//        await fetchAllRestaurants(token);
//        await fetchMasterStats(token);
//      } else {
//        localStorage.removeItem("masterToken");
//        navigate("/master-login");
//      }
//    } catch (error) {
//      console.error("Auth error:", error);
//      localStorage.removeItem("masterToken");
//      navigate("/master-login");
//    } finally {
//      setLoading(false);
//    }
//  };
//
//  const fetchAllRestaurants = async (token) => {
//    try {
//      const response = await axios.get(`${API_URL}/api/restaurant/all`, {
//        headers: { Authorization: `Bearer ${token}` }
//      });
//      
//      if (response.data) {
//        const restaurantsList = response.data.restaurants || [];
//        setRestaurants(restaurantsList);
//        
//        for (const restaurant of restaurantsList) {
//          await fetchRestaurantOrders(restaurant.restaurantSlug, token);
//          await fetchRestaurantMenu(restaurant.restaurantSlug, token);
//        }
//      }
//    } catch (error) {
//      console.error("Error fetching restaurants:", error);
//    }
//  };
//
//  const fetchRestaurantOrders = async (slug, token) => {
//    try {
//      const response = await axios.get(`${API_URL}/api/order/restaurant/${slug}/all-orders`, {
//        headers: { Authorization: `Bearer ${token}` }
//      });
//      
//      if (response.data.success && response.data.orders) {
//        setRestaurantOrders(prev => ({
//          ...prev,
//          [slug]: response.data.orders
//        }));
//      }
//    } catch (error) {
//      console.error(`Error fetching orders for ${slug}:`, error);
//      setRestaurantOrders(prev => ({ ...prev, [slug]: [] }));
//    }
//  };
//
//  const fetchRestaurantMenu = async (slug, token) => {
//    try {
//      const response = await axios.get(`${API_URL}/api/menu/restaurant/${slug}`, {
//        headers: { Authorization: `Bearer ${token}` }
//      });
//      
//      if (response.data) {
//        setMenuItems(prev => ({
//          ...prev,
//          [slug]: response.data
//        }));
//      }
//    } catch (error) {
//      console.error(`Error fetching menu for ${slug}:`, error);
//      setMenuItems(prev => ({ ...prev, [slug]: [] }));
//    }
//  };
//
//  const fetchMasterStats = async (token) => {
//    try {
//      const response = await axios.get(`${API_URL}/api/restaurant/all`, {
//        headers: { Authorization: `Bearer ${token}` }
//      });
//      
//      if (response.data) {
//        const restaurantsList = response.data.restaurants || [];
//        let totalOrders = 0;
//        let totalRevenue = 0;
//        let totalUPI = 0;
//        let totalCash = 0;
//        let totalGST = 0;
//        
//        for (const restaurant of restaurantsList) {
//          const orders = await axios.get(`${API_URL}/api/order/restaurant/${restaurant.restaurantSlug}/all-orders`, {
//            headers: { Authorization: `Bearer ${token}` }
//          });
//          
//          if (orders.data.success && orders.data.orders) {
//            orders.data.orders.forEach(order => {
//              const orderTotal = order.discountedTotal || order.total || 0;
//              totalOrders++;
//              totalRevenue += orderTotal;
//              totalGST += order.gstAmount || 0;
//              
//              const paymentMethod = order.paymentMethod?.toLowerCase();
//              const paymentStatus = order.paymentStatus?.toLowerCase();
//              
//              if (paymentMethod === 'upi' && paymentStatus === 'paid') {
//                totalUPI += orderTotal;
//              } else if (paymentMethod === 'cash' && paymentStatus === 'paid') {
//                totalCash += orderTotal;
//              }
//            });
//          }
//        }
//        
//        setStats({
//          totalRestaurants: restaurantsList.length,
//          totalOrders,
//          totalRevenue,
//          totalUPI,
//          totalCash,
//          totalGST
//        });
//      }
//    } catch (error) {
//      console.error("Error fetching master stats:", error);
//    }
//  };
//
//  const viewRestaurantDetails = async (restaurant) => {
//    setSelectedRestaurant(restaurant);
//    setRestaurantDetails(null);
//    setShowRestaurantPage(true);
//    setIsEditing(false);
//    setFilterType("all");
//    setPaymentFilter("all");
//    setStatusFilter("all");
//    setCustomDate("");
//    
//    const token = localStorage.getItem("masterToken");
//    
//    try {
//      const detailsResponse = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurant.restaurantSlug}`, {
//        headers: { Authorization: `Bearer ${token}` }
//      });
//      setRestaurantDetails(detailsResponse.data);
//      setEditForm(detailsResponse.data);
//      
//      await fetchRestaurantOrders(restaurant.restaurantSlug, token);
//      await fetchRestaurantMenu(restaurant.restaurantSlug, token);
//    } catch (error) {
//      console.error("Error fetching restaurant details:", error);
//    }
//  };
//
//  const getFilteredOrders = (slug) => {
//    let orders = [...(restaurantOrders[slug] || [])];
//    
//    // Filter by date
//    if (filterType === "daily" && customDate) {
//      orders = orders.filter(order => order.date === customDate);
//    } else if (filterType === "weekly") {
//      const weekAgo = new Date();
//      weekAgo.setDate(weekAgo.getDate() - 7);
//      orders = orders.filter(order => new Date(order.date) >= weekAgo);
//    } else if (filterType === "monthly") {
//      const monthAgo = new Date();
//      monthAgo.setMonth(monthAgo.getMonth() - 1);
//      orders = orders.filter(order => new Date(order.date) >= monthAgo);
//    }
//    
//    // Filter by payment
//    if (paymentFilter === "upi") {
//      orders = orders.filter(order => 
//        order.paymentMethod?.toLowerCase() === 'upi' && order.paymentStatus?.toLowerCase() === 'paid'
//      );
//    } else if (paymentFilter === "cash") {
//      orders = orders.filter(order => 
//        order.paymentMethod?.toLowerCase() === 'cash' && order.paymentStatus?.toLowerCase() === 'paid'
//      );
//    } else if (paymentFilter === "pending") {
//      orders = orders.filter(order => order.paymentStatus?.toLowerCase() !== 'paid');
//    }
//    
//    // Filter by status
//    if (statusFilter !== "all") {
//      orders = orders.filter(order => order.status?.toLowerCase() === statusFilter.toLowerCase());
//    }
//    
//    // Sort
//    orders.sort((a, b) => {
//      let comparison = 0;
//      if (sortBy === "date") {
//        comparison = new Date(b.date + " " + b.time) - new Date(a.date + " " + a.time);
//      } else if (sortBy === "amount") {
//        comparison = (b.discountedTotal || b.total || 0) - (a.discountedTotal || a.total || 0);
//      } else if (sortBy === "billNumber") {
//        comparison = b.billNumber - a.billNumber;
//      }
//      return sortOrder === "desc" ? comparison : -comparison;
//    });
//    
//    return orders;
//  };
//
//  const getRestaurantStats = (slug) => {
//    const orders = restaurantOrders[slug] || [];
//    let totalOrders = orders.length;
//    let totalRevenue = 0;
//    let totalUPI = 0;
//    let totalCash = 0;
//    let totalGST = 0;
//    let pendingPayments = 0;
//    let completedOrders = 0;
//    let preparingOrders = 0;
//    
//    const itemSales = {};
//    
//    orders.forEach(order => {
//      const orderTotal = order.discountedTotal || order.total || 0;
//      totalRevenue += orderTotal;
//      totalGST += order.gstAmount || 0;
//      
//      const status = order.status?.toLowerCase();
//      if (status === 'completed') completedOrders++;
//      else if (status === 'preparing') preparingOrders++;
//      else if (status === 'pending') pendingPayments++;
//      
//      const paymentMethod = order.paymentMethod?.toLowerCase();
//      const paymentStatus = order.paymentStatus?.toLowerCase();
//      
//      if (paymentMethod === 'upi' && paymentStatus === 'paid') {
//        totalUPI += orderTotal;
//      } else if (paymentMethod === 'cash' && paymentStatus === 'paid') {
//        totalCash += orderTotal;
//      }
//      
//      if (order.items) {
//        order.items.forEach(item => {
//          if (!itemSales[item.name]) {
//            itemSales[item.name] = {
//              name: item.name,
//              quantity: 0,
//              revenue: 0,
//              type: item.type || 'Veg',
//              price: item.price
//            };
//          }
//          itemSales[item.name].quantity += item.quantity || 0;
//          itemSales[item.name].revenue += (item.price * item.quantity) || 0;
//        });
//      }
//    });
//    
//    const topItems = Object.values(itemSales)
//      .sort((a, b) => b.revenue - a.revenue)
//      .slice(0, 10);
//    
//    return {
//      totalOrders,
//      totalRevenue,
//      totalUPI,
//      totalCash,
//      totalGST,
//      pendingPayments,
//      completedOrders,
//      preparingOrders,
//      topItems
//    };
//  };
//
//  const handleUpdateRestaurant = async () => {
//    try {
//      setSaving(true);
//      const token = localStorage.getItem("masterToken");
//      
//      const response = await axios.put(
//        `${API_URL}/api/restaurant/update/${selectedRestaurant.restaurantSlug}`,
//        editForm,
//        { headers: { Authorization: `Bearer ${token}` } }
//      );
//      
//      if (response.data) {
//        setRestaurantDetails(response.data.restaurant);
//        setIsEditing(false);
//        alert("Restaurant updated successfully!");
//      }
//    } catch (error) {
//      console.error("Error updating restaurant:", error);
//      alert("Failed to update restaurant");
//    } finally {
//      setSaving(false);
//    }
//  };
//
//  const handleUpdateMenuItem = async (itemId, updatedData) => {
//    try {
//      setUpdatingMenu(true);
//      const token = localStorage.getItem("masterToken");
//      
//      const formData = new FormData();
//      formData.append("name", updatedData.name);
//      formData.append("price", updatedData.price);
//      formData.append("type", updatedData.type);
//      formData.append("category", updatedData.category || "Uncategorized");
//      
//      await axios.put(
//        `${API_URL}/api/menu/restaurant/${selectedRestaurant.restaurantSlug}/${itemId}`,
//        formData,
//        { headers: { Authorization: `Bearer ${token}` } }
//      );
//      
//      await fetchRestaurantMenu(selectedRestaurant.restaurantSlug, token);
//      setEditingItem(null);
//      alert("Menu item updated successfully!");
//    } catch (error) {
//      console.error("Error updating menu item:", error);
//      alert("Failed to update menu item");
//    } finally {
//      setUpdatingMenu(false);
//    }
//  };
//
//  const handleAddMenuItem = async () => {
//    if (!newItem.name || !newItem.price) {
//      alert("Please fill item name and price");
//      return;
//    }
//    
//    try {
//      setUpdatingMenu(true);
//      const token = localStorage.getItem("masterToken");
//      
//      const formData = new FormData();
//      formData.append("name", newItem.name);
//      formData.append("price", newItem.price);
//      formData.append("type", newItem.type);
//      formData.append("category", newItem.category || "Uncategorized");
//      
//      await axios.post(
//        `${API_URL}/api/menu/restaurant/${selectedRestaurant.restaurantSlug}`,
//        formData,
//        { headers: { Authorization: `Bearer ${token}` } }
//      );
//      
//      await fetchRestaurantMenu(selectedRestaurant.restaurantSlug, token);
//      setShowAddItemForm(false);
//      setNewItem({ name: "", price: "", type: "Veg", category: "" });
//      alert("Menu item added successfully!");
//    } catch (error) {
//      console.error("Error adding menu item:", error);
//      alert("Failed to add menu item");
//    } finally {
//      setUpdatingMenu(false);
//    }
//  };
//
//  const handleDeleteMenuItem = async (itemId) => {
//    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
//    
//    try {
//      setUpdatingMenu(true);
//      const token = localStorage.getItem("masterToken");
//      
//      await axios.delete(
//        `${API_URL}/api/menu/restaurant/${selectedRestaurant.restaurantSlug}/${itemId}`,
//        { headers: { Authorization: `Bearer ${token}` } }
//      );
//      
//      await fetchRestaurantMenu(selectedRestaurant.restaurantSlug, token);
//      alert("Menu item deleted successfully!");
//    } catch (error) {
//      console.error("Error deleting menu item:", error);
//      alert("Failed to delete menu item");
//    } finally {
//      setUpdatingMenu(false);
//    }
//  };
//
//  const exportData = () => {
//    const orders = getFilteredOrders(selectedRestaurant.restaurantSlug);
//    const stats = getRestaurantStats(selectedRestaurant.restaurantSlug);
//    
//    const report = {
//      restaurant: selectedRestaurant.restaurantName,
//      date: new Date().toISOString(),
//      filterType,
//      paymentFilter,
//      statusFilter,
//      summary: {
//        totalOrders: stats.totalOrders,
//        totalRevenue: stats.totalRevenue,
//        totalUPI: stats.totalUPI,
//        totalCash: stats.totalCash,
//        totalGST: stats.totalGST
//      },
//      orders: orders.map(order => ({
//        billNumber: order.billNumber,
//        date: order.date,
//        time: order.time,
//        customer: order.customerName,
//        table: order.tableNumber,
//        total: order.discountedTotal || order.total,
//        paymentMethod: order.paymentMethod,
//        paymentStatus: order.paymentStatus,
//        status: order.status,
//        items: order.items
//      }))
//    };
//    
//    const dataStr = JSON.stringify(report, null, 2);
//    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
//    const exportFileDefaultName = `${selectedRestaurant.restaurantSlug}_report_${new Date().toISOString().split('T')[0]}.json`;
//    
//    const linkElement = document.createElement('a');
//    linkElement.setAttribute('href', dataUri);
//    linkElement.setAttribute('download', exportFileDefaultName);
//    linkElement.click();
//  };
//
//  const handleLogout = () => {
//    localStorage.removeItem("masterToken");
//    localStorage.removeItem("masterUser");
//    navigate("/master-login");
//  };
//
//  const toggleRestaurantExpand = (slug) => {
//    if (expandedRestaurant === slug) {
//      setExpandedRestaurant(null);
//    } else {
//      setExpandedRestaurant(slug);
//    }
//  };
//
//  const filteredRestaurants = restaurants.filter(restaurant =>
//    restaurant.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//    restaurant.restaurantCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//    restaurant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//    restaurant.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
//  );
//
//  if (loading) {
//    return (
//      <div className="master-loading">
//        <FaSpinner className="spinner" />
//        <p>Loading dashboard...</p>
//      </div>
//    );
//  }
//
//  // Restaurant Detail Page Component
//  if (showRestaurantPage && selectedRestaurant) {
//    const stats = getRestaurantStats(selectedRestaurant.restaurantSlug);
//    const filteredOrders = getFilteredOrders(selectedRestaurant.restaurantSlug);
//    const menu = menuItems[selectedRestaurant.restaurantSlug] || [];
//    
//    return (
//      <div className="restaurant-detail-page">
//        <div className="detail-header">
//          <button className="back-btn" onClick={() => setShowRestaurantPage(false)}>
//            <FaArrowLeft /> Back to Dashboard
//          </button>
//          <div className="detail-title">
//            <h1>{selectedRestaurant.restaurantName}</h1>
//            <p className="detail-code">Code: {selectedRestaurant.restaurantCode} | Slug: {selectedRestaurant.restaurantSlug}</p>
//          </div>
//          <div className="detail-actions">
//            <button className="export-btn" onClick={exportData}>
//              <FaDownload /> Export Report
//            </button>
//            <button className="edit-restaurant-btn" onClick={() => setIsEditing(!isEditing)}>
//              <FaEdit /> {isEditing ? "Cancel" : "Edit Restaurant"}
//            </button>
//          </div>
//        </div>
//
//        {/* Edit Form */}
//        {isEditing && restaurantDetails && (
//          <div className="edit-restaurant-form">
//            <h3>Edit Restaurant Details</h3>
//            <div className="edit-form-grid">
//              <div className="form-group">
//                <label>Restaurant Name</label>
//                <input type="text" name="restaurantName" value={editForm.restaurantName || ""} onChange={(e) => setEditForm({...editForm, restaurantName: e.target.value})} />
//              </div>
//              <div className="form-group">
//                <label>Mobile</label>
//                <input type="text" name="mobile" value={editForm.mobile || ""} onChange={(e) => setEditForm({...editForm, mobile: e.target.value})} />
//              </div>
//              <div className="form-group">
//                <label>Email</label>
//                <input type="email" name="email" value={editForm.email || ""} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
//              </div>
//              <div className="form-group">
//                <label>GST Percentage</label>
//                <input type="number" name="gstPercentage" value={editForm.gstPercentage || ""} onChange={(e) => setEditForm({...editForm, gstPercentage: e.target.value})} />
//              </div>
//              <div className="form-group">
//                <label>GST Number</label>
//                <input type="text" name="gstNumber" value={editForm.gstNumber || ""} onChange={(e) => setEditForm({...editForm, gstNumber: e.target.value})} />
//              </div>
//              <div className="form-group">
//                <label>City</label>
//                <input type="text" name="city" value={editForm.city || ""} onChange={(e) => setEditForm({...editForm, city: e.target.value})} />
//              </div>
//              <div className="form-group">
//                <label>State</label>
//                <input type="text" name="state" value={editForm.state || ""} onChange={(e) => setEditForm({...editForm, state: e.target.value})} />
//              </div>
//              <div className="form-group">
//                <label>UPI ID</label>
//                <input type="text" name="upiId" value={editForm.upiId || ""} onChange={(e) => setEditForm({...editForm, upiId: e.target.value})} />
//              </div>
//              <div className="form-group">
//                <label>Bank Name</label>
//                <input type="text" name="bankName" value={editForm.bankName || ""} onChange={(e) => setEditForm({...editForm, bankName: e.target.value})} />
//              </div>
//              <div className="form-group">
//                <label>Account Holder Name</label>
//                <input type="text" name="bankAccountHolderName" value={editForm.bankAccountHolderName || ""} onChange={(e) => setEditForm({...editForm, bankAccountHolderName: e.target.value})} />
//              </div>
//              <div className="form-group">
//                <label>IFSC Code</label>
//                <input type="text" name="bankIfscCode" value={editForm.bankIfscCode || ""} onChange={(e) => setEditForm({...editForm, bankIfscCode: e.target.value})} />
//              </div>
//              <div className="form-group">
//                <label>PAN Number</label>
//                <input type="text" name="panNumber" value={editForm.panNumber || ""} onChange={(e) => setEditForm({...editForm, panNumber: e.target.value})} />
//              </div>
//            </div>
//            <div className="form-actions">
//              <button className="save-btn" onClick={handleUpdateRestaurant} disabled={saving}>
//                {saving ? <FaSpinner className="spinner" /> : <FaSave />} Save Changes
//              </button>
//              <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
//            </div>
//          </div>
//        )}
//
//        {/* Stats Cards */}
//        <div className="detail-stats-grid">
//          <div className="stat-card"><FaShoppingCart /> <span>Total Orders</span> <strong>{stats.totalOrders}</strong></div>
//          <div className="stat-card"><FaRupeeSign /> <span>Total Revenue</span> <strong>₹{stats.totalRevenue.toLocaleString()}</strong></div>
//          <div className="stat-card"><FaMobileAlt /> <span>UPI Collection</span> <strong>₹{stats.totalUPI.toLocaleString()}</strong></div>
//          <div className="stat-card"><FaMoneyBill /> <span>Cash Collection</span> <strong>₹{stats.totalCash.toLocaleString()}</strong></div>
//          <div className="stat-card"><FaPercent /> <span>GST Collected</span> <strong>₹{stats.totalGST.toLocaleString()}</strong></div>
//          <div className="stat-card"><FaCheckCircle /> <span>Completed Orders</span> <strong>{stats.completedOrders}</strong></div>
//        </div>
//
//        {/* Filter Bar */}
//        <div className="filter-bar">
//          <div className="filter-group">
//            <label><FaCalendarAlt /> Date Filter:</label>
//            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
//              <option value="all">All Time</option>
//              <option value="daily">Daily</option>
//              <option value="weekly">Last 7 Days</option>
//              <option value="monthly">Last 30 Days</option>
//            </select>
//            {filterType === "daily" && (
//              <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
//            )}
//          </div>
//          <div className="filter-group">
//            <label><FaWallet /> Payment:</label>
//            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
//              <option value="all">All Payments</option>
//              <option value="upi">UPI Only</option>
//              <option value="cash">Cash Only</option>
//              <option value="pending">Pending Only</option>
//            </select>
//          </div>
//          <div className="filter-group">
//            <label><FaClock /> Status:</label>
//            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
//              <option value="all">All Status</option>
//              <option value="pending">Pending</option>
//              <option value="preparing">Preparing</option>
//              <option value="completed">Completed</option>
//            </select>
//          </div>
//          <div className="filter-group">
//            <label>Sort By:</label>
//            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
//              <option value="date">Date</option>
//              <option value="amount">Amount</option>
//              <option value="billNumber">Bill Number</option>
//            </select>
//            <button onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}>
//              {sortOrder === "desc" ? "↓" : "↑"}
//            </button>
//          </div>
//        </div>
//
//        {/* Top Selling Items */}
//        <div className="top-items-section">
//          <h3>🍽️ Top Selling Items</h3>
//          <div className="top-items-grid">
//            {stats.topItems.map((item, idx) => (
//              <div key={idx} className="top-item-card">
//                <span className={`item-type ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>
//                  {item.type === 'Veg' ? '🟢' : '🔴'}
//                </span>
//                <div className="item-info">
//                  <div className="item-name">{item.name}</div>
//                  <div className="item-stats">
//                    <span>📦 {item.quantity} sold</span>
//                    <span>💰 ₹{item.revenue.toLocaleString()}</span>
//                  </div>
//                </div>
//              </div>
//            ))}
//          </div>
//        </div>
//
//        {/* Menu Items Management */}
//        <div className="menu-items-section">
//          <div className="section-header">
//            <h3><FaUtensils /> Menu Items Management</h3>
//            <button className="add-item-btn" onClick={() => setShowAddItemForm(true)}>
//              <FaPlus /> Add Item
//            </button>
//          </div>
//          
//          {showAddItemForm && (
//            <div className="add-item-form">
//              <input type="text" placeholder="Item Name" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} />
//              <input type="number" placeholder="Price" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
//              <select value={newItem.type} onChange={(e) => setNewItem({...newItem, type: e.target.value})}>
//                <option value="Veg">Veg</option>
//                <option value="Non-Veg">Non-Veg</option>
//              </select>
//              <input type="text" placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})} />
//              <button onClick={handleAddMenuItem} disabled={updatingMenu}>Add</button>
//              <button onClick={() => setShowAddItemForm(false)}>Cancel</button>
//            </div>
//          )}
//          
//          <div className="menu-items-grid">
//            {menu.map(item => (
//              <div key={item._id} className="menu-item-card">
//                {editingItem === item._id ? (
//                  <div className="edit-item-form">
//                    <input type="text" defaultValue={item.name} id={`name-${item._id}`} />
//                    <input type="number" defaultValue={item.price} id={`price-${item._id}`} />
//                    <select defaultValue={item.type} id={`type-${item._id}`}>
//                      <option value="Veg">Veg</option>
//                      <option value="Non-Veg">Non-Veg</option>
//                    </select>
//                    <button onClick={() => {
//                      const updatedData = {
//                        name: document.getElementById(`name-${item._id}`).value,
//                        price: parseFloat(document.getElementById(`price-${item._id}`).value),
//                        type: document.getElementById(`type-${item._id}`).value,
//                        category: item.category
//                      };
//                      handleUpdateMenuItem(item._id, updatedData);
//                    }}><FaSave /></button>
//                    <button onClick={() => setEditingItem(null)}><FaTimes /></button>
//                  </div>
//                ) : (
//                  <>
//                    <div className="menu-item-info">
//                      <span className={`item-type ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>
//                        {item.type === 'Veg' ? '🟢' : '🔴'}
//                      </span>
//                      <span className="menu-item-name">{item.name}</span>
//                      <span className="menu-item-price">₹{item.price}</span>
//                      <span className="menu-item-category">{item.category}</span>
//                    </div>
//                    <div className="menu-item-actions">
//                      <button onClick={() => setEditingItem(item._id)}><FaEdit /></button>
//                      <button onClick={() => handleDeleteMenuItem(item._id)}><FaTrash /></button>
//                    </div>
//                  </>
//                )}
//              </div>
//            ))}
//          </div>
//        </div>
//
//        {/* Orders Table */}
//        <div className="orders-table-section">
//          <h3>📋 Order Details {filteredOrders.length > 0 && `(${filteredOrders.length} orders)`}</h3>
//          <div className="table-responsive">
//            <table className="orders-detail-table">
//              <thead>
//                <tr>
//                  <th>Bill #</th>
//                  <th>Date & Time</th>
//                  <th>Customer</th>
//                  <th>Table</th>
//                  <th>Items</th>
//                  <th>Total</th>
//                  <th>Payment</th>
//                  <th>Status</th>
//                </tr>
//              </thead>
//              <tbody>
//                {filteredOrders.map(order => (
//                  <tr key={order._id}>
//                    <td>#{order.billNumber}</td>
//                    <td>{order.date} {order.time}</td>
//                    <td>{order.customerName || "Guest"}</td>
//                    <td>{order.tableNumber || "Takeaway"}</td>
//                    <td>
//                      <ul className="order-items-list">
//                        {order.items.slice(0, 2).map((item, i) => (
//                          <li key={i}>{item.name} x{item.quantity}</li>
//                        ))}
//                        {order.items.length > 2 && <li>+{order.items.length - 2} more</li>}
//                      </ul>
//                    </td>
//                    <td className="amount">₹{(order.discountedTotal || order.total || 0).toFixed(2)}</td>
//                    <td>
//                      <span className={`payment-badge ${order.paymentMethod?.toLowerCase()}-${order.paymentStatus?.toLowerCase()}`}>
//                        {order.paymentMethod === "upi" ? "💳 UPI" : order.paymentMethod === "cash" ? "💵 Cash" : "❓"}
//                        {order.paymentStatus === "paid" ? " ✓" : " ⏳"}
//                      </span>
//                    </td>
//                    <td>
//                      <span className={`status-badge ${order.status}`}>
//                        {order.status === "pending" && "⏳ Pending"}
//                        {order.status === "preparing" && "👨‍🍳 Preparing"}
//                        {order.status === "completed" && "✅ Completed"}
//                      </span>
//                    </td>
//                  </tr>
//                ))}
//              </tbody>
//              <tfoot>
//                <tr className="table-footer">
//                  <td colSpan="5" className="footer-label">Total:</td>
//                  <td className="footer-total">₹{filteredOrders.reduce((sum, o) => sum + (o.discountedTotal || o.total || 0), 0).toFixed(2)}</td>
//                  <td colSpan="2"></td>
//                </tr>
//              </tfoot>
//            </table>
//          </div>
//        </div>
//      </div>
//    );
//  }
//
//  return (
//    <div className="master-dashboard">
//      <div className="master-header">
//        <h1>🎯 Master Admin Dashboard</h1>
//        <div className="user-info">
//          <span>Welcome, {user?.name || "Master Admin"}!</span>
//          <button onClick={handleLogout} className="logout-btn">
//            <FaSignOutAlt /> Logout
//          </button>
//        </div>
//      </div>
//
//      <div className="master-content">
//        <div className="welcome-card">
//          <h2>Hello {user?.name || "Master Admin"}! 👋</h2>
//          <p>You have successfully logged into the Master Admin Panel.</p>
//          <div className="admin-info">
//            <p><strong>Email:</strong> {user?.emailId}</p>
//            <p><strong>Phone:</strong> {user?.phoneNumber}</p>
//          </div>
//        </div>
//
//        {/* Global Statistics Cards */}
//        <div className="stats-grid">
//          <div className="stat-card"><FaBuilding className="stat-icon" /><div className="stat-info"><h3>Total Restaurants</h3><p className="stat-number">{stats.totalRestaurants}</p></div></div>
//          <div className="stat-card"><FaUsers className="stat-icon" /><div className="stat-info"><h3>Total Orders</h3><p className="stat-number">{stats.totalOrders.toLocaleString()}</p></div></div>
//          <div className="stat-card"><FaChartLine className="stat-icon" /><div className="stat-info"><h3>Total Revenue</h3><p className="stat-number">₹{stats.totalRevenue.toLocaleString()}</p></div></div>
//          <div className="stat-card upi-card"><FaMobileAlt className="stat-icon" /><div className="stat-info"><h3>UPI Collection</h3><p className="stat-number">₹{stats.totalUPI.toLocaleString()}</p></div></div>
//          <div className="stat-card cash-card"><FaMoneyBill className="stat-icon" /><div className="stat-info"><h3>Cash Collection</h3><p className="stat-number">₹{stats.totalCash.toLocaleString()}</p></div></div>
//          <div className="stat-card gst-card"><FaChartBar className="stat-icon" /><div className="stat-info"><h3>Total GST</h3><p className="stat-number">₹{stats.totalGST.toLocaleString()}</p></div></div>
//        </div>
//
//        {/* Search Bar */}
//        <div className="search-section">
//          <div className="search-container">
//            <FaSearch className="search-icon" />
//            <input type="text" placeholder="Search by restaurant name, code, email, or owner..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
//            {searchTerm && <button className="clear-search" onClick={() => setSearchTerm("")}><FaTimes /></button>}
//          </div>
//        </div>
//
//        {/* Restaurants Table */}
//        <div className="restaurants-table-container">
//          <h3>📋 All Registered Restaurants</h3>
//          <div className="table-responsive">
//            <table className="restaurants-table">
//              <thead>
//                <tr><th>S.No</th><th>Restaurant Name</th><th>Code</th><th>Owner</th><th>Contact</th><th>Location</th><th>Orders</th><th>Revenue</th><th>Actions</th><th></th></tr>
//              </thead>
//              <tbody>
//                {filteredRestaurants.map((restaurant, index) => {
//                  const stats = getRestaurantStats(restaurant.restaurantSlug);
//                  const isExpanded = expandedRestaurant === restaurant.restaurantSlug;
//                  return (
//                    <React.Fragment key={restaurant._id}>
//                      <tr>
//                        <td>{index + 1}</td>
//                        <td className="restaurant-name-cell"><strong>{restaurant.restaurantName}</strong><small className="restaurant-slug">{restaurant.restaurantSlug}</small></td>
//                        <td><code>{restaurant.restaurantCode}</code></td>
//                        <td>{restaurant.ownerName || "N/A"}</td>
//                        <td><div className="contact-info"><span>📞 {restaurant.mobile}</span><span>📧 {restaurant.email}</span></div></td>
//                        <td><div className="location-info"><span>{restaurant.city}, {restaurant.state}</span></div></td>
//                        <td className="stat-number">{stats.totalOrders}</td>
//                        <td className="revenue-cell">₹{stats.totalRevenue.toLocaleString()}</td>
//                        <td><button className="view-details-btn" onClick={() => viewRestaurantDetails(restaurant)}><FaEye /> View Details</button></td>
//                        <td><button className="expand-row-btn" onClick={() => toggleRestaurantExpand(restaurant.restaurantSlug)}>{isExpanded ? <FaChevronUp /> : <FaChevronDown />}</button></td>
//                      </tr>
//                      {isExpanded && (
//                        <tr className="expanded-row">
//                          <td colSpan="10">
//                            <div className="expanded-details">
//                              <div className="expanded-section"><h4>📊 Performance</h4><div className="performance-grid"><div className="perf-card"><span>Total Orders</span><strong>{stats.totalOrders}</strong></div><div className="perf-card"><span>Completed</span><strong>{stats.completedOrders}</strong></div><div className="perf-card"><span>Pending Payment</span><strong>{stats.pendingPayments}</strong></div></div></div>
//                              <div className="expanded-section"><h4>💰 Payment</h4><div className="payment-breakdown"><div className="payment-item upi"><FaMobileAlt /> UPI: ₹{stats.totalUPI.toLocaleString()}</div><div className="payment-item cash"><FaMoneyBill /> Cash: ₹{stats.totalCash.toLocaleString()}</div><div className="payment-item gst"><FaPercent /> GST: ₹{stats.totalGST.toLocaleString()}</div></div></div>
//                              {stats.topItems.length > 0 && (<div className="expanded-section"><h4>🍽️ Top Items</h4><div className="top-items-list">{stats.topItems.slice(0, 3).map((item, idx) => (<div key={idx} className="top-item"><span className="item-name">{item.name}</span><span className="item-stats">{item.quantity} sold | ₹{item.revenue.toLocaleString()}</span></div>))}</div></div>)}
//                            </div>
//                          </td>
//                        </tr>
//                      )}
//                    </React.Fragment>
//                  );
//                })}
//              </tbody>
//            </table>
//          </div>
//          {filteredRestaurants.length === 0 && <div className="no-restaurants"><p>No restaurants found matching your search.</p></div>}
//        </div>
//      </div>
//    </div>
//  );
//};
//
//export default MasterDashboard;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaChartLine,
  FaDatabase,
  FaBuilding,
  FaUsers,
  FaSignOutAlt,
  FaSpinner,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaEye,
  FaTimes,
  FaWallet,
  FaMoneyBill,
  FaMobileAlt,
  FaUtensils,
  FaChartBar,
  FaCalendarAlt,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaEdit,
  FaSave,
  FaTrash,
  FaPlus,
  FaFilter,
  FaRupeeSign,
  FaPercent,
  FaQrcode,
  FaUniversity,
  FaIdCard,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaBoxes,
  FaShoppingCart,
  FaCalendarWeek,
  FaCalendarDay,
  FaReceipt,
  FaCommentDots
} from "react-icons/fa";
import "./MasterDashboard.css";

const MasterDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  const [restaurantOrders, setRestaurantOrders] = useState({});
  const [showRestaurantPage, setShowRestaurantPage] = useState(false);
  const [expandedRestaurant, setExpandedRestaurant] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingItem, setEditingItem] = useState(null);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", price: "", type: "Veg", category: "" });
  const [menuItems, setMenuItems] = useState({});
  const [updatingMenu, setUpdatingMenu] = useState(false);
  
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUPI: 0,
    totalCash: 0,
    totalGST: 0
  });

  const API_URL = import.meta.env.VITE_API_URL || "https://menu-b-ym9l.onrender.com";

  useEffect(() => {
    const handleLinkClick = (e) => {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const token = localStorage.getItem("masterToken");
    
    if (!token) {
      navigate("/master-login");
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/api/master/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        await fetchAllRestaurants(token);
        await fetchMasterStats(token);
      } else {
        localStorage.removeItem("masterToken");
        navigate("/master-login");
      }
    } catch (error) {
      console.error("Auth error:", error);
      localStorage.removeItem("masterToken");
      navigate("/master-login");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRestaurants = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/restaurant/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        const restaurantsList = response.data.restaurants || [];
        setRestaurants(restaurantsList);
        
        for (const restaurant of restaurantsList) {
          await fetchRestaurantOrders(restaurant.restaurantSlug, token);
          await fetchRestaurantMenu(restaurant.restaurantSlug, token);
        }
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    }
  };

  const fetchRestaurantOrders = async (slug, token) => {
    try {
      const response = await axios.get(`${API_URL}/api/order/restaurant/${slug}/all-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.orders) {
        setRestaurantOrders(prev => ({
          ...prev,
          [slug]: response.data.orders
        }));
      }
    } catch (error) {
      console.error(`Error fetching orders for ${slug}:`, error);
      setRestaurantOrders(prev => ({ ...prev, [slug]: [] }));
    }
  };

  const fetchRestaurantMenu = async (slug, token) => {
    try {
      const response = await axios.get(`${API_URL}/api/menu/restaurant/${slug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setMenuItems(prev => ({
          ...prev,
          [slug]: response.data
        }));
      }
    } catch (error) {
      console.error(`Error fetching menu for ${slug}:`, error);
      setMenuItems(prev => ({ ...prev, [slug]: [] }));
    }
  };

  const fetchMasterStats = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/restaurant/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        const restaurantsList = response.data.restaurants || [];
        let totalOrders = 0;
        let totalRevenue = 0;
        let totalUPI = 0;
        let totalCash = 0;
        let totalGST = 0;
        
        for (const restaurant of restaurantsList) {
          const orders = await axios.get(`${API_URL}/api/order/restaurant/${restaurant.restaurantSlug}/all-orders`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (orders.data.success && orders.data.orders) {
            orders.data.orders.forEach(order => {
              const orderTotal = order.discountedTotal || order.total || 0;
              totalOrders++;
              totalRevenue += orderTotal;
              totalGST += order.gstAmount || 0;
              
              const paymentMethod = order.paymentMethod?.toLowerCase();
              const paymentStatus = order.paymentStatus?.toLowerCase();
              
              if (paymentMethod === 'upi' && paymentStatus === 'paid') {
                totalUPI += orderTotal;
              } else if (paymentMethod === 'cash' && paymentStatus === 'paid') {
                totalCash += orderTotal;
              }
            });
          }
        }
        
        setStats({
          totalRestaurants: restaurantsList.length,
          totalOrders,
          totalRevenue,
          totalUPI,
          totalCash,
          totalGST
        });
      }
    } catch (error) {
      console.error("Error fetching master stats:", error);
    }
  };

  const viewRestaurantDetails = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setRestaurantDetails(null);
    setShowRestaurantPage(true);
    setIsEditing(false);
    setFilterType("all");
    setPaymentFilter("all");
    setStatusFilter("all");
    setCustomDate("");
    
    const token = localStorage.getItem("masterToken");
    
    try {
      const detailsResponse = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurant.restaurantSlug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRestaurantDetails(detailsResponse.data);
      setEditForm(detailsResponse.data);
      
      await fetchRestaurantOrders(restaurant.restaurantSlug, token);
      await fetchRestaurantMenu(restaurant.restaurantSlug, token);
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
    }
  };

  const getFilteredOrders = (slug) => {
    let orders = [...(restaurantOrders[slug] || [])];
    
    if (filterType === "daily" && customDate) {
      orders = orders.filter(order => order.date === customDate);
    } else if (filterType === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      orders = orders.filter(order => new Date(order.date) >= weekAgo);
    } else if (filterType === "monthly") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      orders = orders.filter(order => new Date(order.date) >= monthAgo);
    }
    
    if (paymentFilter === "upi") {
      orders = orders.filter(order => 
        order.paymentMethod?.toLowerCase() === 'upi' && order.paymentStatus?.toLowerCase() === 'paid'
      );
    } else if (paymentFilter === "cash") {
      orders = orders.filter(order => 
        order.paymentMethod?.toLowerCase() === 'cash' && order.paymentStatus?.toLowerCase() === 'paid'
      );
    } else if (paymentFilter === "pending") {
      orders = orders.filter(order => order.paymentStatus?.toLowerCase() !== 'paid');
    }
    
    if (statusFilter !== "all") {
      orders = orders.filter(order => order.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    
    orders.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(b.date + " " + b.time) - new Date(a.date + " " + a.time);
      } else if (sortBy === "amount") {
        comparison = (b.discountedTotal || b.total || 0) - (a.discountedTotal || a.total || 0);
      } else if (sortBy === "billNumber") {
        comparison = b.billNumber - a.billNumber;
      }
      return sortOrder === "desc" ? comparison : -comparison;
    });
    
    return orders;
  };

  const getRestaurantStats = (slug) => {
    const orders = restaurantOrders[slug] || [];
    let totalOrders = orders.length;
    let totalRevenue = 0;
    let totalUPI = 0;
    let totalCash = 0;
    let totalGST = 0;
    let pendingPayments = 0;
    let completedOrders = 0;
    let preparingOrders = 0;
    
    const itemSales = {};
    
    orders.forEach(order => {
      const orderTotal = order.discountedTotal || order.total || 0;
      totalRevenue += orderTotal;
      totalGST += order.gstAmount || 0;
      
      const status = order.status?.toLowerCase();
      if (status === 'completed') completedOrders++;
      else if (status === 'preparing') preparingOrders++;
      else if (status === 'pending') pendingPayments++;
      
      const paymentMethod = order.paymentMethod?.toLowerCase();
      const paymentStatus = order.paymentStatus?.toLowerCase();
      
      if (paymentMethod === 'upi' && paymentStatus === 'paid') {
        totalUPI += orderTotal;
      } else if (paymentMethod === 'cash' && paymentStatus === 'paid') {
        totalCash += orderTotal;
      }
      
      if (order.items) {
        order.items.forEach(item => {
          if (!itemSales[item.name]) {
            itemSales[item.name] = {
              name: item.name,
              quantity: 0,
              revenue: 0,
              type: item.type || 'Veg',
              price: item.price
            };
          }
          itemSales[item.name].quantity += item.quantity || 0;
          itemSales[item.name].revenue += (item.price * item.quantity) || 0;
        });
      }
    });
    
    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    return {
      totalOrders,
      totalRevenue,
      totalUPI,
      totalCash,
      totalGST,
      pendingPayments,
      completedOrders,
      preparingOrders,
      topItems
    };
  };

  const handleUpdateRestaurant = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("masterToken");
      
      const response = await axios.put(
        `${API_URL}/api/restaurant/update/${selectedRestaurant.restaurantSlug}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data) {
        setRestaurantDetails(response.data.restaurant);
        setIsEditing(false);
        alert("Restaurant updated successfully!");
      }
    } catch (error) {
      console.error("Error updating restaurant:", error);
      alert("Failed to update restaurant");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMenuItem = async (itemId, updatedData) => {
    try {
      setUpdatingMenu(true);
      const token = localStorage.getItem("masterToken");
      
      const formData = new FormData();
      formData.append("name", updatedData.name);
      formData.append("price", updatedData.price);
      formData.append("type", updatedData.type);
      formData.append("category", updatedData.category || "Uncategorized");
      
      await axios.put(
        `${API_URL}/api/menu/restaurant/${selectedRestaurant.restaurantSlug}/${itemId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchRestaurantMenu(selectedRestaurant.restaurantSlug, token);
      setEditingItem(null);
      alert("Menu item updated successfully!");
    } catch (error) {
      console.error("Error updating menu item:", error);
      alert("Failed to update menu item");
    } finally {
      setUpdatingMenu(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!newItem.name || !newItem.price) {
      alert("Please fill item name and price");
      return;
    }
    
    try {
      setUpdatingMenu(true);
      const token = localStorage.getItem("masterToken");
      
      const formData = new FormData();
      formData.append("name", newItem.name);
      formData.append("price", newItem.price);
      formData.append("type", newItem.type);
      formData.append("category", newItem.category || "Uncategorized");
      
      await axios.post(
        `${API_URL}/api/menu/restaurant/${selectedRestaurant.restaurantSlug}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchRestaurantMenu(selectedRestaurant.restaurantSlug, token);
      setShowAddItemForm(false);
      setNewItem({ name: "", price: "", type: "Veg", category: "" });
      alert("Menu item added successfully!");
    } catch (error) {
      console.error("Error adding menu item:", error);
      alert("Failed to add menu item");
    } finally {
      setUpdatingMenu(false);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    
    try {
      setUpdatingMenu(true);
      const token = localStorage.getItem("masterToken");
      
      await axios.delete(
        `${API_URL}/api/menu/restaurant/${selectedRestaurant.restaurantSlug}/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchRestaurantMenu(selectedRestaurant.restaurantSlug, token);
      alert("Menu item deleted successfully!");
    } catch (error) {
      console.error("Error deleting menu item:", error);
      alert("Failed to delete menu item");
    } finally {
      setUpdatingMenu(false);
    }
  };

  const exportData = () => {
    const orders = getFilteredOrders(selectedRestaurant.restaurantSlug);
    const stats = getRestaurantStats(selectedRestaurant.restaurantSlug);
    
    const report = {
      restaurant: selectedRestaurant.restaurantName,
      date: new Date().toISOString(),
      filterType,
      paymentFilter,
      statusFilter,
      summary: {
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        totalUPI: stats.totalUPI,
        totalCash: stats.totalCash,
        totalGST: stats.totalGST
      },
      orders: orders.map(order => ({
        billNumber: order.billNumber,
        date: order.date,
        time: order.time,
        customer: order.customerName,
        table: order.tableNumber,
        total: order.discountedTotal || order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        items: order.items
      }))
    };
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${selectedRestaurant.restaurantSlug}_report_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleLogout = () => {
    localStorage.removeItem("masterToken");
    localStorage.removeItem("masterUser");
    navigate("/master-login");
  };

  const toggleRestaurantExpand = (slug) => {
    if (expandedRestaurant === slug) {
      setExpandedRestaurant(null);
    } else {
      setExpandedRestaurant(slug);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.restaurantCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="master-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Restaurant Detail Page Component
  if (showRestaurantPage && selectedRestaurant) {
    const stats = getRestaurantStats(selectedRestaurant.restaurantSlug);
    const filteredOrders = getFilteredOrders(selectedRestaurant.restaurantSlug);
    const menu = menuItems[selectedRestaurant.restaurantSlug] || [];
    
    return (
      <div className="restaurant-detail-page">
        <div className="detail-header">
          <button className="back-btn" onClick={() => setShowRestaurantPage(false)}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          <div className="detail-title">
            <h1>{selectedRestaurant.restaurantName}</h1>
            <p className="detail-code">Code: {selectedRestaurant.restaurantCode} | Slug: {selectedRestaurant.restaurantSlug}</p>
          </div>
          <div className="detail-actions">
            <button className="export-btn" onClick={exportData}>
              <FaDownload /> Export Report
            </button>
            <button className="edit-restaurant-btn" onClick={() => setIsEditing(!isEditing)}>
              <FaEdit /> {isEditing ? "Cancel" : "Edit Restaurant"}
            </button>
          </div>
        </div>

        {isEditing && restaurantDetails && (
          <div className="edit-restaurant-form">
            <h3>Edit Restaurant Details</h3>
            <div className="edit-form-grid">
              <div className="form-group">
                <label>Restaurant Name</label>
                <input type="text" name="restaurantName" value={editForm.restaurantName || ""} onChange={(e) => setEditForm({...editForm, restaurantName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Mobile</label>
                <input type="text" name="mobile" value={editForm.mobile || ""} onChange={(e) => setEditForm({...editForm, mobile: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={editForm.email || ""} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>GST Percentage</label>
                <input type="number" name="gstPercentage" value={editForm.gstPercentage || ""} onChange={(e) => setEditForm({...editForm, gstPercentage: e.target.value})} />
              </div>
              <div className="form-group">
                <label>GST Number</label>
                <input type="text" name="gstNumber" value={editForm.gstNumber || ""} onChange={(e) => setEditForm({...editForm, gstNumber: e.target.value})} />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" name="city" value={editForm.city || ""} onChange={(e) => setEditForm({...editForm, city: e.target.value})} />
              </div>
              <div className="form-group">
                <label>State</label>
                <input type="text" name="state" value={editForm.state || ""} onChange={(e) => setEditForm({...editForm, state: e.target.value})} />
              </div>
              <div className="form-group">
                <label>UPI ID</label>
                <input type="text" name="upiId" value={editForm.upiId || ""} onChange={(e) => setEditForm({...editForm, upiId: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" name="bankName" value={editForm.bankName || ""} onChange={(e) => setEditForm({...editForm, bankName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input type="text" name="bankAccountHolderName" value={editForm.bankAccountHolderName || ""} onChange={(e) => setEditForm({...editForm, bankAccountHolderName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input type="text" name="bankIfscCode" value={editForm.bankIfscCode || ""} onChange={(e) => setEditForm({...editForm, bankIfscCode: e.target.value})} />
              </div>
              <div className="form-group">
                <label>PAN Number</label>
                <input type="text" name="panNumber" value={editForm.panNumber || ""} onChange={(e) => setEditForm({...editForm, panNumber: e.target.value})} />
              </div>
            </div>
            <div className="form-actions">
              <button className="save-btn" onClick={handleUpdateRestaurant} disabled={saving}>
                {saving ? <FaSpinner className="spinner" /> : <FaSave />} Save Changes
              </button>
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="detail-stats-grid">
          <div className="stat-card"><FaShoppingCart /> <span>Total Orders</span> <strong>{stats.totalOrders}</strong></div>
          <div className="stat-card"><FaRupeeSign /> <span>Total Revenue</span> <strong>₹{stats.totalRevenue.toLocaleString()}</strong></div>
          <div className="stat-card"><FaMobileAlt /> <span>UPI Collection</span> <strong>₹{stats.totalUPI.toLocaleString()}</strong></div>
          <div className="stat-card"><FaMoneyBill /> <span>Cash Collection</span> <strong>₹{stats.totalCash.toLocaleString()}</strong></div>
          <div className="stat-card"><FaPercent /> <span>GST Collected</span> <strong>₹{stats.totalGST.toLocaleString()}</strong></div>
          <div className="stat-card"><FaCheckCircle /> <span>Completed Orders</span> <strong>{stats.completedOrders}</strong></div>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <label><FaCalendarAlt /> Date Filter:</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
            </select>
            {filterType === "daily" && (
              <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
            )}
          </div>
          <div className="filter-group">
            <label><FaWallet /> Payment:</label>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">All Payments</option>
              <option value="upi">UPI Only</option>
              <option value="cash">Cash Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>
          <div className="filter-group">
            <label><FaClock /> Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sort By:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="billNumber">Bill Number</option>
            </select>
            <button onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}>
              {sortOrder === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </div>

        <div className="top-items-section">
          <h3>🍽️ Top Selling Items</h3>
          <div className="top-items-grid">
            {stats.topItems.map((item, idx) => (
              <div key={idx} className="top-item-card">
                <span className={`item-type ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>
                  {item.type === 'Veg' ? '🟢' : '🔴'}
                </span>
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-stats">
                    <span>📦 {item.quantity} sold</span>
                    <span>💰 ₹{item.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="menu-items-section">
          <div className="section-header">
            <h3><FaUtensils /> Menu Items Management</h3>
            <button className="add-item-btn" onClick={() => setShowAddItemForm(true)}>
              <FaPlus /> Add Item
            </button>
          </div>
          
          {showAddItemForm && (
            <div className="add-item-form">
              <input type="text" placeholder="Item Name" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} />
              <input type="number" placeholder="Price" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
              <select value={newItem.type} onChange={(e) => setNewItem({...newItem, type: e.target.value})}>
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
              </select>
              <input type="text" placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})} />
              <button onClick={handleAddMenuItem} disabled={updatingMenu}>Add</button>
              <button onClick={() => setShowAddItemForm(false)}>Cancel</button>
            </div>
          )}
          
          <div className="menu-items-grid">
            {menu.map(item => (
              <div key={item._id} className="menu-item-card">
                {editingItem === item._id ? (
                  <div className="edit-item-form">
                    <input type="text" defaultValue={item.name} id={`name-${item._id}`} />
                    <input type="number" defaultValue={item.price} id={`price-${item._id}`} />
                    <select defaultValue={item.type} id={`type-${item._id}`}>
                      <option value="Veg">Veg</option>
                      <option value="Non-Veg">Non-Veg</option>
                    </select>
                    <button onClick={() => {
                      const updatedData = {
                        name: document.getElementById(`name-${item._id}`).value,
                        price: parseFloat(document.getElementById(`price-${item._id}`).value),
                        type: document.getElementById(`type-${item._id}`).value,
                        category: item.category
                      };
                      handleUpdateMenuItem(item._id, updatedData);
                    }}><FaSave /></button>
                    <button onClick={() => setEditingItem(null)}><FaTimes /></button>
                  </div>
                ) : (
                  <>
                    <div className="menu-item-info">
                      <span className={`item-type ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>
                        {item.type === 'Veg' ? '🟢' : '🔴'}
                      </span>
                      <span className="menu-item-name">{item.name}</span>
                      <span className="menu-item-price">₹{item.price}</span>
                      <span className="menu-item-category">{item.category}</span>
                    </div>
                    <div className="menu-item-actions">
                      <button onClick={() => setEditingItem(item._id)}><FaEdit /></button>
                      <button onClick={() => handleDeleteMenuItem(item._id)}><FaTrash /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="orders-table-section">
          <h3>📋 Order Details {filteredOrders.length > 0 && `(${filteredOrders.length} orders)`}</h3>
          <div className="table-responsive">
            <table className="orders-detail-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Table</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order._id}>
                    <td>#{order.billNumber}</td>
                    <td>{order.date} {order.time}</td>
                    <td>{order.customerName || "Guest"}</td>
                    <td>{order.tableNumber || "Takeaway"}</td>
                    <td>
                      <ul className="order-items-list">
                        {order.items.slice(0, 2).map((item, i) => (
                          <li key={i}>{item.name} x{item.quantity}</li>
                        ))}
                        {order.items.length > 2 && <li>+{order.items.length - 2} more</li>}
                      </ul>
                    </td>
                    <td className="amount">₹{(order.discountedTotal || order.total || 0).toFixed(2)}</td>
                    <td>
                      <span className={`payment-badge ${order.paymentMethod?.toLowerCase()}-${order.paymentStatus?.toLowerCase()}`}>
                        {order.paymentMethod === "upi" ? "💳 UPI" : order.paymentMethod === "cash" ? "💵 Cash" : "❓"}
                        {order.paymentStatus === "paid" ? " ✓" : " ⏳"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${order.status}`}>
                        {order.status === "pending" && "⏳ Pending"}
                        {order.status === "preparing" && "👨‍🍳 Preparing"}
                        {order.status === "completed" && "✅ Completed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="table-footer">
                  <td colSpan="5" className="footer-label">Total:</td>
                  <td className="footer-total">₹{filteredOrders.reduce((sum, o) => sum + (o.discountedTotal || o.total || 0), 0).toFixed(2)}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="master-dashboard">
      <div className="master-header">
        <h1>🎯 Master Admin Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.name || "Master Admin"}!</span>
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      <div className="master-content">
        <div className="welcome-card">
          <h2>Hello {user?.name || "Master Admin"}! 👋</h2>
          <p>You have successfully logged into the Master Admin Panel.</p>
          <div className="admin-info">
            <p><strong>Email:</strong> {user?.emailId}</p>
            <p><strong>Phone:</strong> {user?.phoneNumber}</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><FaBuilding className="stat-icon" /><div className="stat-info"><h3>Total Restaurants</h3><p className="stat-number">{stats.totalRestaurants}</p></div></div>
          <div className="stat-card"><FaUsers className="stat-icon" /><div className="stat-info"><h3>Total Orders</h3><p className="stat-number">{stats.totalOrders.toLocaleString()}</p></div></div>
          <div className="stat-card"><FaChartLine className="stat-icon" /><div className="stat-info"><h3>Total Revenue</h3><p className="stat-number">₹{stats.totalRevenue.toLocaleString()}</p></div></div>
          <div className="stat-card upi-card"><FaMobileAlt className="stat-icon" /><div className="stat-info"><h3>UPI Collection</h3><p className="stat-number">₹{stats.totalUPI.toLocaleString()}</p></div></div>
          <div className="stat-card cash-card"><FaMoneyBill className="stat-icon" /><div className="stat-info"><h3>Cash Collection</h3><p className="stat-number">₹{stats.totalCash.toLocaleString()}</p></div></div>
          <div className="stat-card gst-card"><FaChartBar className="stat-icon" /><div className="stat-info"><h3>Total GST</h3><p className="stat-number">₹{stats.totalGST.toLocaleString()}</p></div></div>
        </div>

        <div className="search-section">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search by restaurant name, code, email, or owner..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
            {searchTerm && <button className="clear-search" onClick={() => setSearchTerm("")}><FaTimes /></button>}
          </div>
        </div>

        <div className="restaurants-table-container">
          <h3>📋 All Registered Restaurants</h3>
          <div className="table-responsive">
            <table className="restaurants-table">
              <thead>
                <tr><th>S.No</th><th>Restaurant Name</th><th>Code</th><th>Owner</th><th>Contact</th><th>Location</th><th>Orders</th><th>Revenue</th><th>Actions</th><th></th></tr>
              </thead>
              <tbody>
                {filteredRestaurants.map((restaurant, index) => {
                  const stats = getRestaurantStats(restaurant.restaurantSlug);
                  const isExpanded = expandedRestaurant === restaurant.restaurantSlug;
                  return (
                    <React.Fragment key={restaurant._id}>
                      <tr className={isExpanded ? "expanded-parent" : ""}>
                        <td>{index + 1}</td>
                        <td className="restaurant-name-cell"><strong>{restaurant.restaurantName}</strong><small className="restaurant-slug">{restaurant.restaurantSlug}</small></td>
                        <td><code>{restaurant.restaurantCode}</code></td>
                        <td>{restaurant.ownerName || "N/A"}</td>
                        <td><div className="contact-info"><span>📞 {restaurant.mobile}</span><span>📧 {restaurant.email}</span></div></td>
                        <td><div className="location-info"><span>{restaurant.city}, {restaurant.state}</span></div></td>
                        <td className="stat-number">{stats.totalOrders}</td>
                        <td className="revenue-cell">₹{stats.totalRevenue.toLocaleString()}</td>
                        <td><button className="view-details-btn" onClick={() => viewRestaurantDetails(restaurant)}><FaEye /> View Details</button></td>
                        <td><button className="expand-row-btn" onClick={() => toggleRestaurantExpand(restaurant.restaurantSlug)}>{isExpanded ? <FaChevronUp /> : <FaChevronDown />}</button></td>
                      </tr>
                      {isExpanded && (
                        <tr className="expanded-row">
                          <td colSpan="10">
                            <div className="expanded-details">
                              <div className="expanded-section"><h4>📊 Performance</h4><div className="performance-grid"><div className="perf-card"><span>Total Orders</span><strong>{stats.totalOrders}</strong></div><div className="perf-card"><span>Completed</span><strong>{stats.completedOrders}</strong></div><div className="perf-card"><span>Pending Payment</span><strong>{stats.pendingPayments}</strong></div></div></div>
                              <div className="expanded-section"><h4>💰 Payment</h4><div className="payment-breakdown"><div className="payment-item upi"><FaMobileAlt /> UPI: ₹{stats.totalUPI.toLocaleString()}</div><div className="payment-item cash"><FaMoneyBill /> Cash: ₹{stats.totalCash.toLocaleString()}</div><div className="payment-item gst"><FaPercent /> GST: ₹{stats.totalGST.toLocaleString()}</div></div></div>
                              {stats.topItems.length > 0 && (<div className="expanded-section"><h4>🍽️ Top Items</h4><div className="top-items-list">{stats.topItems.slice(0, 3).map((item, idx) => (<div key={idx} className="top-item"><span className="item-name">{item.name}</span><span className="item-stats">{item.quantity} sold | ₹{item.revenue.toLocaleString()}</span></div>))}</div></div>)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredRestaurants.length === 0 && <div className="no-restaurants"><p>No restaurants found matching your search.</p></div>}
        </div>
      </div>
    </div>
  );
};

export default MasterDashboard;