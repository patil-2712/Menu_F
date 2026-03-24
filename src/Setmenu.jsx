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
  FaStore
} from 'react-icons/fa';
import './Setmenu.css';

function Setmenu() {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  // Get backend URL from environment variable or use Render URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Setmenu using backend:', API_URL);
  
  // State management
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
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

  // Helper function to generate local placeholder image (works offline)
  const getPlaceholderImage = (name) => {
    const displayText = name ? name.charAt(0).toUpperCase() : '?';
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='48' font-family='Arial' text-anchor='middle' fill='%239ca3af' dy='.3em'%3E${displayText}%3C/text%3E%3C/svg%3E`;
  };

  // Check backend connection
  const checkBackendConnection = async () => {
    try {
      console.log("🔍 Checking backend connection...");
      // CHANGED: Use full URL with API_URL
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
      console.log(`🔍 Fetching restaurant: ${restaurantSlug}`);
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
      console.log("✅ Restaurant data:", response.data);
      setRestaurant(response.data);
    } catch (error) {
      console.error('❌ Error fetching restaurant:', error);
      setError('Failed to load restaurant details');
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      console.log(`🔍 Fetching categories for: ${restaurantSlug}`);
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(`${API_URL}/api/menu/restaurant/${restaurantSlug}/categories`);
      console.log("✅ Categories:", response.data);
      setCategories(response.data || []);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      // Initialize with default categories if none exist
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
      // CHANGED: Use full URL with API_URL
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
        // CHANGED: Use full URL with API_URL
        await axios.put(`${API_URL}/api/menu/restaurant/${restaurantSlug}/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Menu item updated successfully!');
      } else {
        // CHANGED: Use full URL with API_URL
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
      // CHANGED: Use full URL with API_URL
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

  // Navigation functions
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

  const handleNavigateToKitchen = () => {
    const restaurantSlug = localStorage.getItem('restaurantSlug');
    if (restaurantSlug) {
      navigate(`/${restaurantSlug}/Korder`);
    } else {
      navigate('/');
    }
  };

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
        <p className="loading-text">Loading menu items...</p>
      </div>
    );
  }

  return (
    <div className="setmenu-container full-width">
      {/* Top Bar with User Info */}
      <div className="top-bar">
        <div className="user-info">
          <FaUserCircle className="user-avatar" />
          <span className="user-name">{userName}</span>
          <span className="user-role">{userRole.toUpperCase()}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Header */}
      <div className="setmenu-header">
        <div className="header-content">
          <h1>
            <FaUtensils /> {restaurant?.restaurantName || 'Restaurant'} - Menu Management
          </h1>
          <div className="header-date">
            {formattedToday}
          </div>
        </div>
        <p className="subtitle">
          Restaurant Code: {restaurant?.restaurantCode || 'Loading...'}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="navigation-tabs">
        <button 
          className="nav-tab kitchen-tab" 
          onClick={handleNavigateToKitchen}
          title="Go to Kitchen Orders"
        >
          👨‍🍳  Korders
        </button>
        <button 
          className="nav-tab active-tab" 
          onClick={handleNavigateToDashboard}
          title="Go to Dashboard"
        >
          📋 Set Menu
        </button>
      </div>

      {/* Connection Status */}
      {!backendConnected && (
        <div className="connection-alert">
          <FaExclamationTriangle className="alert-icon" />
          <div className="alert-content">
            <strong>Connection Error:</strong> Cannot connect to backend server. 
            Make sure your backend is running.
          </div>
          <button 
            className="retry-btn"
            onClick={handleRetryConnection}
          >
            <FaSpinner className={loading ? 'spinning' : ''} /> Retry
          </button>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="error-banner">
          <FaExclamationTriangle className="banner-icon" />
          <span>{error}</span>
          <button className="banner-dismiss" onClick={() => setError('')}>
            <FaTimes />
          </button>
        </div>
      )}
      
      {success && (
        <div className="success-banner">
          <FaCheckCircle className="banner-icon" />
          <span>{success}</span>
          <button className="banner-dismiss" onClick={() => setSuccess('')}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaBoxOpen />
          </div>
          <div className="stat-content">
            <h3>{totalItems}</h3>
            <p>Total Items</p>
          </div>
        </div>
        <div className="stat-card veg">
          <div className="stat-icon">
            <FaLeaf />
          </div>
          <div className="stat-content">
            <h3>{vegItems}</h3>
            <p>Veg Items</p>
          </div>
        </div>
        <div className="stat-card non-veg">
          <div className="stat-icon">
            <FaDrumstickBite />
          </div>
          <div className="stat-content">
            <h3>{nonVegItems}</h3>
            <p>Non-Veg Items</p>
          </div>
        </div>
        <div className="stat-card categories">
          <div className="stat-icon">
            <FaTags />
          </div>
          <div className="stat-content">
            <h3>{categories.length}</h3>
            <p>Categories</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="form-section">
        <div className="form-card">
          <div className="form-header">
            <h3 className="form-title">
              {editingIndex !== null ? <FaEdit /> : <FaPlus />}
              {editingIndex !== null ? ' Edit Dish' : ' Add New Dish'}
            </h3>
            {editingIndex !== null && (
              <button 
                type="button"
                className="cancel-edit-btn"
                onClick={handleResetForm}
              >
                <FaTimes /> Cancel
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="menu-form">
            <div className="form-row">
              <div className="form-group image-group">
                <label className="form-label">Dish Image *</label>
                <div className="image-upload-container">
                  <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                    required={editingIndex === null}
                  />
                  <div className="file-input-label">
                    <FaImage /> Choose Image
                  </div>
                  {form.imagePreview && (
                    <div className="image-preview">
                      <img 
                        src={form.imagePreview} 
                        alt="Preview" 
                        className="preview-image"
                      />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => setForm(prev => ({ ...prev, image: null, imagePreview: null }))}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
                <div className="helper-text">Supported: JPG, PNG, GIF, WebP (max 5MB)</div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Dish Name *</label>
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
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type *</label>
                <div className="type-selector">
                  <label className={`type-option ${form.type === 'Veg' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="Veg"
                      checked={form.type === 'Veg'}
                      onChange={handleChange}
                    />
                    <FaLeaf className="veg-icon" /> Veg
                  </label>
                  <label className={`type-option ${form.type === 'Non-Veg' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="Non-Veg"
                      checked={form.type === 'Non-Veg'}
                      onChange={handleChange}
                    />
                    <FaDrumstickBite className="non-veg-icon" /> Non-Veg
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Category *</label>
                <div className="category-select-container">
                  <select 
                    name="category" 
                    value={form.category} 
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat, index) => (
                      <option key={index} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    className="add-category-btn"
                    onClick={handleAddCategory}
                  >
                    <FaPlus /> New
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
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

            <button 
              type="submit"
              className="submit-btn"
              disabled={!backendConnected}
            >
              <FaSave />
              {editingIndex !== null ? ' Update Dish' : ' Add Dish'}
            </button>
          </form>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by dish name or category..."
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

        <div className="filter-controls">
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="Veg">Veg Only</option>
              <option value="Non-Veg">Non-Veg Only</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Categories Summary */}
      {categories.length > 0 && (
        <div className="categories-section">
          <h3 className="section-title">
            <FaTags /> Categories ({categories.length})
          </h3>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <div key={index} className="category-card">
                <span className="category-name">{category}</span>
                <span className="category-count">
                  {categoryCounts[category] || 0} items
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="results-info">
        <div className="results-left">
          <p>
            {filteredMenuItems.length === 0 ? 
              "No menu items match your filters" : 
              `Showing ${filteredMenuItems.length} of ${menuItems.length} menu items`
            }
          </p>
        </div>
        <div className="results-right">
          <span className="time-info">
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Menu Items Grid */}
      {filteredMenuItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h2 className="empty-title">
            {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
              ? "No matching items found" 
              : "No Menu Items Yet"}
          </h2>
          <p className="empty-subtitle">
            {searchTerm || filterType !== 'all' || filterCategory !== 'all'
              ? "Try adjusting your filters"
              : "Start by adding your first dish to the menu"}
          </p>
          {!searchTerm && filterType === 'all' && filterCategory === 'all' && (
            <div className="empty-tips">
              <h4>💡 Tips:</h4>
              <ul>
                <li>Add high-quality images for better presentation</li>
                <li>Create categories to organize your menu</li>
                <li>Use clear and descriptive dish names</li>
                <li>Price your items competitively</li>
              </ul>
            </div>
          )}
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
                <button 
                  onClick={() => handleEdit(index)}
                  className="action-btn edit-btn"
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(index)}
                  className="action-btn delete-btn"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Setmenu;