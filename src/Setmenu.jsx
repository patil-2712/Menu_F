// Setmenu.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUtensils, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSave,
  FaTimes,
  FaImage,
  FaSearch,
  FaFilter,
  FaTachometerAlt,
  FaChartLine,
  FaDatabase,
  FaHome,
  FaSignOutAlt,
  FaUserCircle,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft,
  FaLeaf,
  FaDrumstickBite,
  FaTags,
  FaBoxOpen,
  FaStore,
  FaBars,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaStar,
  FaReceipt,
  FaWallet,
  FaChartBar,
  FaCalendarAlt
} from 'react-icons/fa';
import './Setmenu.css';

function Setmenu() {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Setmenu using backend:', API_URL);
  
  // State management
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'Veg',
    category: '',
    price: '',
    image: null,
    imagePreview: null
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [backendConnected, setBackendConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    categories: true,
    menu: true
  });

  // Helper function to generate local placeholder image (works offline)
  const getPlaceholderImage = (name) => {
    const displayText = name ? name.charAt(0).toUpperCase() : '?';
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='48' font-family='Arial' text-anchor='middle' fill='%239ca3af' dy='.3em'%3E${displayText}%3C/text%3E%3C/svg%3E`;
  };

  // Check backend connection
  const checkBackendConnection = async () => {
    try {
      console.log("🔍 Checking backend connection...");
      const response = await axios.get(`${API_URL}/`, { timeout: 3000 });
      console.log("✅ Backend connected:", response.data);
      setBackendConnected(true);
      return true;
    } catch (err) {
      console.error("❌ Backend not connected:", err.message);
      setBackendConnected(false);
      setError('Backend server is not running. Please start the backend server.');
      return false;
    }
  };

  // Fetch restaurant details
  const fetchRestaurant = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log(`🔍 Fetching restaurant: ${restaurantSlug}`);
      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("✅ Restaurant data:", response.data);
      setRestaurant(response.data);
      setRestaurantData(response.data);
      localStorage.setItem('restaurantName', response.data.restaurantName);
      localStorage.setItem('restaurantCode', response.data.restaurantCode);
    } catch (error) {
      console.error('❌ Error fetching restaurant:', error);
      setError('Failed to load restaurant details');
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      console.log(`🔍 Fetching categories for: ${restaurantSlug}`);
      const response = await axios.get(`${API_URL}/api/menu/restaurant/${restaurantSlug}/categories`);
      console.log("✅ Categories:", response.data);
      setCategories(response.data || []);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      if (!categories.length) {
        setCategories(['Starter', 'Main Course', 'Dessert', 'Drinks']);
      }
    }
  };

  // Fetch menu items
  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError('');
      console.log(`🔍 Fetching menu for: ${restaurantSlug}`);
      const response = await axios.get(`${API_URL}/api/menu/restaurant/${restaurantSlug}`);
      console.log("✅ Menu items received:", response.data);
      setMenuItems(response.data || []);
    } catch (err) {
      console.error('❌ Error fetching menu:', err);
      setError('Failed to load menu items. Please try again.');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setForm(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit menu item (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.price || !form.category) {
      setError('Please fill all required fields');
      return;
    }

    if (!form.image && editingIndex === null) {
      setError('Please select an image for the dish');
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('type', form.type);
    formData.append('category', form.category);
    formData.append('price', form.price);
    
    if (form.image) {
      formData.append('image', form.image);
    }

    try {
      if (editingIndex !== null) {
        await axios.put(`${API_URL}/api/menu/restaurant/${restaurantSlug}/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Menu item updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/menu/restaurant/${restaurantSlug}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Menu item added successfully!');
      }
      
      await fetchMenu();
      await fetchCategories();
      
      setForm({ 
        name: '', 
        type: 'Veg', 
        category: '', 
        price: '', 
        image: null,
        imagePreview: null 
      });
      setEditingIndex(null);
      setEditingId(null);
      
      const fileInput = document.getElementById('imageInput');
      if (fileInput) fileInput.value = null;
      
    } catch (err) {
      console.error('❌ Error saving item:', err);
      setError('Error saving menu item: ' + (err.response?.data?.message || err.message));
    }
  };

  // Edit menu item
  const handleEdit = (index) => {
    const item = menuItems[index];
    setForm({
      name: item.name,
      type: item.type,
      category: item.category,
      price: item.price,
      image: null,
      imagePreview: item.imageUrl ? item.imageUrl : null
    });
    setEditingIndex(index);
    setEditingId(item._id);
  };

  // Delete menu item
  const handleDelete = async (index) => {
    const id = menuItems[index]._id;
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/menu/restaurant/${restaurantSlug}/${id}`);
      setSuccess('Menu item deleted successfully!');
      fetchMenu();
    } catch (err) {
      console.error('❌ Delete error:', err);
      setError('Error deleting menu item: ' + (err.response?.data?.message || err.message));
    }
  };

  // Add new category
  const handleAddCategory = () => {
    const newCategory = prompt('Enter new category name:');
    if (newCategory && newCategory.trim()) {
      const trimmedCategory = newCategory.trim();
      setForm(prev => ({ ...prev, category: trimmedCategory }));
      
      if (!categories.includes(trimmedCategory)) {
        setCategories([...categories, trimmedCategory]);
      }
    }
  };

  // Reset form
  const handleResetForm = () => {
    setForm({ 
      name: '', 
      type: 'Veg', 
      category: '', 
      price: '', 
      image: null,
      imagePreview: null 
    });
    setEditingIndex(null);
    setEditingId(null);
    setError('');
    const fileInput = document.getElementById('imageInput');
    if (fileInput) fileInput.value = null;
  };

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Retry backend connection
  const handleRetryConnection = async () => {
    setError('');
    setLoading(true);
    const connected = await checkBackendConnection();
    if (connected) {
      await fetchRestaurant();
      await fetchMenu();
      await fetchCategories();
      setSuccess('Connected to backend successfully!');
    } else {
      setError('Cannot connect to backend. Make sure server is running.');
    }
    setLoading(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Navigation functions - Complete with all pages
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

  const handleNavigateToFeedback = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/feedback`);
  };

  const handleNavigateToDashboard = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/dashboard`);
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

  // Navigation items for mobile
  const navItems = [
    { icon: FaClipboardList, label: 'KOT', action: handleNavigateToKorder },
    { icon: FaUtensils, label: 'Set Menu', action: handleNavigateToSetMenu }
   
    
  ];

  // Initialize component
  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'staff';
    const name = localStorage.getItem('userName') || 'Staff';
    setUserRole(role);
    setUserName(name);

    const initialize = async () => {
      console.log("🚀 Initializing Setmenu component for:", restaurantSlug);
      
      const connected = await checkBackendConnection();
      if (connected && restaurantSlug) {
        await fetchRestaurant();
        await fetchMenu();
        await fetchCategories();
      } else if (!restaurantSlug) {
        setError('Restaurant slug not found. Please login again.');
        setLoading(false);
      }
    };

    initialize();
  }, [restaurantSlug]);

  // Filter and search logic
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  // Statistics
  const totalItems = menuItems.length;
  const vegItems = menuItems.filter(item => item.type === 'Veg').length;
  const nonVegItems = menuItems.filter(item => item.type === 'Non-Veg').length;
  
  const categoryCounts = {};
  menuItems.forEach(item => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  });

  const today = new Date();
  const formattedToday = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading menu items...</p>
      </div>
    );
  }

  return (
    <div className="setmenu-container">
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
      <div className="setmenu-header">
        <div className="header-content">
          <h1>
            <FaUtensils /> Menu Management
          </h1>
          <p className="subtitle">
            {restaurantData?.restaurantName || restaurant?.restaurantName || 'Restaurant'} • {restaurantData?.restaurantCode || restaurant?.restaurantCode || 'N/A'}
          </p>
        </div>
        <div className="header-right desktop-only">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tabs - Complete with all pages */}
      <div className="navigation-tabs desktop-only">
        <button className="nav-tab" onClick={handleNavigateToKorder}>
          <FaClipboardList /> KOT
        </button>
       
        <button className="nav-tab active" onClick={handleNavigateToSetMenu}>
          <FaUtensils /> Set Menu
        </button>
       
      </div>

      {/* Connection Status */}
      {!backendConnected && (
        <div className="error-message">
          <FaExclamationTriangle /> Cannot connect to backend server. Make sure your backend is running.
          <button className="retry-btn" onClick={handleRetryConnection}>
            <FaSpinner className={loading ? 'spinner' : ''} /> Retry
          </button>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <FaCheckCircle /> {success}
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Statistics Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('stats')}>
          <h2><FaChartBar /> Menu Statistics</h2>
          <div className="header-actions">
            <span className="date-badge"><FaCalendarAlt /> {formattedToday}</span>
            <button className="expand-toggle">
              {expandedSections.stats ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>
        
        {expandedSections.stats && (
          <div className="summary-cards">
            <div className="stat-card">
              <div className="stat-icon"><FaBoxOpen /></div>
              <div className="stat-content">
                <h3>Total Items</h3>
                <p className="stat-number">{totalItems}</p>
              </div>
            </div>
            <div className="stat-card veg-stat">
              <div className="stat-icon"><FaLeaf /></div>
              <div className="stat-content">
                <h3>Veg Items</h3>
                <p className="stat-number">{vegItems}</p>
              </div>
            </div>
            <div className="stat-card nonveg-stat">
              <div className="stat-icon"><FaDrumstickBite /></div>
              <div className="stat-content">
                <h3>Non-Veg Items</h3>
                <p className="stat-number">{nonVegItems}</p>
              </div>
            </div>
            <div className="stat-card category-stat">
              <div className="stat-icon"><FaTags /></div>
              <div className="stat-content">
                <h3>Categories</h3>
                <p className="stat-number">{categories.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Section */}
      <div className="summary-section">
        <div className="section-header">
          <h2>{editingIndex !== null ? <FaEdit /> : <FaPlus />} {editingIndex !== null ? 'Edit Dish' : 'Add New Dish'}</h2>
          {editingIndex !== null && (
            <button className="cancel-edit-btn" onClick={handleResetForm}>
              <FaTimes /> Cancel
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="menu-form">
          <div className="form-row">
            <div className="form-group">
              <label>Dish Name *</label>
              <input
                type="text"
                name="name"
                placeholder="Enter dish name"
                value={form.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                placeholder="Enter price"
                value={form.price}
                onChange={handleChange}
                className="form-input"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <div className="type-selector">
                <label className={`type-option ${form.type === 'Veg' ? 'selected' : ''}`}>
                  <input type="radio" name="type" value="Veg" checked={form.type === 'Veg'} onChange={handleChange} />
                  <FaLeaf /> Veg
                </label>
                <label className={`type-option ${form.type === 'Non-Veg' ? 'selected' : ''}`}>
                  <input type="radio" name="type" value="Non-Veg" checked={form.type === 'Non-Veg'} onChange={handleChange} />
                  <FaDrumstickBite /> Non-Veg
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Category *</label>
              <div className="category-select-container">
                <select name="category" value={form.category} onChange={handleChange} className="form-select" required>
                  <option value="">Select Category</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
                <button type="button" className="add-category-btn" onClick={handleAddCategory}>
                  <FaPlus /> New
                </button>
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group image-group">
              <label>Dish Image {editingIndex === null && '*'}</label>
              <div className="image-upload-container">
                <input id="imageInput" type="file" accept="image/*" onChange={handleImageChange} className="file-input" required={editingIndex === null} />
                <div className="file-input-label"><FaImage /> Choose Image</div>
                {form.imagePreview && (
                  <div className="image-preview">
                    <img src={form.imagePreview} alt="Preview" className="preview-image" />
                    <button type="button" className="remove-image-btn" onClick={() => setForm(prev => ({ ...prev, image: null, imagePreview: null }))}>
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
              <small>Supported: JPG, PNG, GIF, WebP (max 5MB)</small>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={!backendConnected}>
            <FaSave /> {editingIndex !== null ? ' Update Dish' : ' Add Dish'}
          </button>
        </form>
      </div>

      {/* Search and Filter Section */}
      <div className="summary-section">
        <div className="section-header">
          <h2><FaSearch /> Search & Filter</h2>
          <div className="header-actions">
            <button className="refresh-btn-small" onClick={fetchMenu}>
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
              placeholder="Search by dish name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            )}
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <label><FaFilter /> Type:</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
                <option value="all">All Types</option>
                <option value="Veg">Veg Only</option>
                <option value="Non-Veg">Non-Veg Only</option>
              </select>
            </div>

            <div className="filter-group">
              <label><FaTags /> Category:</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
                <option value="all">All Categories</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="results-info">
            <span>
              {filteredMenuItems.length === 0 ? 
                "No menu items match your filters" : 
                `Showing ${filteredMenuItems.length} of ${menuItems.length} menu items`
              }
            </span>
            <span className="time-info">
              Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      {categories.length > 0 && (
        <div className="summary-section">
          <div className="section-header" onClick={() => toggleSection('categories')}>
            <h2><FaTags /> Categories ({categories.length})</h2>
            <button className="expand-toggle">
              {expandedSections.categories ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
          
          {expandedSections.categories && (
            <div className="categories-grid">
              {categories.map((category, index) => (
                <div key={index} className="category-card">
                  <span className="category-name">{category}</span>
                  <span className="category-count">{categoryCounts[category] || 0} items</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Menu Items Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('menu')}>
          <h2><FaUtensils /> Menu Items</h2>
          <button className="expand-toggle">
            {expandedSections.menu ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.menu && (
          <div className="menu-content">
            {filteredMenuItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🍽️</div>
                <h3>
                  {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                    ? "No matching items found" 
                    : "No Menu Items Yet"}
                </h3>
                <p>
                  {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                    ? "Try adjusting your filters"
                    : "Start by adding your first dish to the menu"}
                </p>
              </div>
            ) : (
              <div className="menu-grid">
                {filteredMenuItems.map((item, index) => (
                  <div key={item._id || index} className="menu-card">
                    <div className="card-image-container">
                      <img
                        src={item.imageUrl ? item.imageUrl : getPlaceholderImage(item.name)}
                        alt={item.name}
                        className="card-image"
                        onError={(e) => {
                          e.target.src = getPlaceholderImage(item.name);
                        }}
                      />
                      <div className={`card-type-badge ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>
                        {item.type === 'Veg' ? <FaLeaf /> : <FaDrumstickBite />}
                        {item.type === 'Veg' ? ' Veg' : ' Non-Veg'}
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <div className="card-header">
                        <h3 className="dish-name">{item.name}</h3>
                        <span className="dish-price">₹{item.price}</span>
                      </div>
                      <div className="card-meta">
                        <div className="meta-item">
                          <FaTags className="meta-icon" />
                          <span className="meta-value">{item.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button onClick={() => handleEdit(index)} className="action-btn edit-btn">
                        <FaEdit /> Edit
                      </button>
                      <button onClick={() => handleDelete(index)} className="action-btn delete-btn">
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="setmenu-footer">
        <p>
          {restaurantData?.restaurantName || restaurant?.restaurantName} Menu Management • 
          <span className="footer-code"> {restaurantData?.restaurantCode || restaurant?.restaurantCode}</span> • 
          Today: {formattedToday}
        </p>
        <p className="footer-note">
          All menu items are restaurant-specific and accessible only to authorized staff
        </p>
      </div>
    </div>
  );
}

export default Setmenu;