import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaSignInAlt, FaShoppingCart, FaSearch, FaTimes, FaPercent, FaIdCard, FaUtensils } from 'react-icons/fa';
import './Publicmenu.css';

const Publicmenu = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get backend URL from environment variable or use Render URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Publicmenu using backend:', API_URL);
  
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [tableError, setTableError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isAddingToExistingOrder, setIsAddingToExistingOrder] = useState(false);
  const [existingOrder, setExistingOrder] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  // Helper function to get full image URL
  const getImageUrl = (imageName) => {
    if (!imageName) {
      return 'https://via.placeholder.com/300x200?text=No+Image';
    }
    
    if (imageName.startsWith('http')) {
      return imageName;
    }
    
    if (imageName.startsWith('/uploads/')) {
      return imageName;
    }
    
    if (imageName.startsWith('/')) {
      return imageName;
    }
    
    return `/uploads/menu/${imageName}`;
  };

  const handleImageError = (itemId) => {
    console.log(`Image failed to load for item ${itemId}`);
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      console.log('Testing backend connection...');
      
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(`${API_URL}/api/test`, { timeout: 3000 });
      console.log(`✅ Backend reachable at: ${API_URL}/api/test`);
      return true;
      
    } catch (error) {
      console.error('Connection error:', error.message);
      return false;
    }
  };

  // Fetch restaurant details
  const fetchRestaurantDetails = async () => {
    try {
      console.log(`Fetching restaurant: ${restaurantSlug}`);
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
      setRestaurant(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      setError('Failed to load restaurant details');
      return null;
    }
  };

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      console.log(`Fetching menu for: ${restaurantSlug}`);
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(`${API_URL}/api/menu/restaurant/${restaurantSlug}`);
      
      if (response.data && Array.isArray(response.data)) {
        const processedItems = response.data.map(item => ({
          ...item,
          imagePath: item.imageUrl || item.image || null
        }));
        
        setMenuItems(processedItems);
        setFilteredItems(processedItems);
        
        const uniqueCategories = [...new Set(processedItems.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);
      }
      
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  // Clear order when component mounts (for browser back button)
  useEffect(() => {
    // Clear the current order from localStorage when component mounts
    localStorage.removeItem(`currentOrder_${restaurantSlug}`);
    
    // Reset all order-related state
    setOrderItems([]);
    setCustomerName('');
    setTableNumber('');
    setIsAddingToExistingOrder(false);
    setExistingOrder(null);
    
    console.log('🧹 Cleared order on component mount - starting fresh');
  }, [restaurantSlug]);

  // Initialize
  useEffect(() => {
    const initializePage = async () => {
      if (!restaurantSlug) {
        setError('Restaurant not found');
        setLoading(false);
        return;
      }

      const isConnected = await testBackendConnection();
      if (!isConnected) {
        setError('Cannot connect to server. Make sure backend is running.');
        setLoading(false);
        return;
      }

      await fetchRestaurantDetails();
      await fetchMenuItems();
    };

    initializePage();
  }, [restaurantSlug]);

  // Filter items
  useEffect(() => {
    let result = menuItems;
    
    if (activeCategory !== 'all') {
      result = result.filter(item => 
        item.category && item.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }
    
    if (searchTerm) {
      result = result.filter(item => 
        item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredItems(result);
  }, [activeCategory, searchTerm, menuItems]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add to order
  const addToOrder = (item) => {
    setOrderItems(prev => {
      const existingItem = prev.find(i => i._id === item._id);
      if (existingItem) {
        return prev.map(i => 
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  // Remove from order
  const removeFromOrder = (itemId) => {
    setOrderItems(prev =>
      prev.map(item => item._id === itemId
        ? { ...item, quantity: item.quantity - 1 }
        : item
      ).filter(item => item.quantity > 0)
    );
  };

  // Calculations
  const getTotal = () => orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const getGstAmount = () => (getTotal() * (restaurant?.gstPercentage || 18)) / 100;
  const getGrandTotal = () => getTotal() + getGstAmount();

  // Place order
  const handleOrder = async () => {
    if (!customerName.trim()) {
      setNameError(true);
      return;
    }
    
    if (!tableNumber || parseInt(tableNumber) < 1 || parseInt(tableNumber) > 50) {
      setTableError(true);
      return;
    }
    
    if (orderItems.length === 0) {
      alert('Please add items to your order');
      return;
    }

    setSubmitting(true);
    
    try {
      const now = new Date();
      const orderData = {
        restaurantSlug,
        restaurantName: restaurant?.restaurantName || 'Restaurant',
        restaurantCode: restaurant?.restaurantCode || restaurantSlug.toUpperCase(),
        customerName: customerName.trim(),
        tableNumber: parseInt(tableNumber),
        gstNumber: restaurant?.gstNumber || '',
        gstPercentage: restaurant?.gstPercentage || 18,
        foodLicense: restaurant?.foodLicense || '',
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        items: orderItems.map(item => ({
          itemId: item._id,
          name: item.name,
          quantity: Number(item.quantity),
          price: Number(item.price),
          category: item.category,
          type: item.type,
          image: item.image,
          total: Number(item.price * item.quantity)
        })),
        subtotal: Number(getTotal()),
        discount: 0,
        gstAmount: Number(getGstAmount()),
        total: Number(getGrandTotal()),
        status: 'pending'
      };

      // CHANGED: Use full URL with API_URL
      const response = await axios.post(`${API_URL}/api/order`, orderData);
      
      if (response.status === 201) {
        // Store in localStorage for the order page
        localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(response.data.order));
        
        // Use _id instead of billNumber
        navigate(`/${restaurantSlug}/order/${response.data.order._id}`, { 
          state: { 
            order: response.data.order,
            restaurant: restaurant 
          } 
        });
      }
    } catch (error) {
      console.error('Order error:', error);
      
      let errorMessage = 'Order failed. Please try again.';
      if (error.response) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTableNumberChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^([1-9]|[1-4][0-9]|50)$/.test(value)) {
      setTableNumber(value);
      setTableError(false);
    }
  };

  const clearOrder = () => {
    setOrderItems([]);
    setCustomerName('');
    setTableNumber('');
    localStorage.removeItem(`currentOrder_${restaurantSlug}`);
    setIsAddingToExistingOrder(false);
    setExistingOrder(null);
  };

  // Get categories for filter
  const allCategories = [
    { id: 'all', name: 'All Items' },
    ...categories.map(cat => ({ 
      id: cat.toLowerCase().replace(/\s+/g, '-'), 
      name: cat 
    }))
  ];

  // Get item quantity
  const getItemQuantity = (itemId) => {
    const orderItem = orderItems.find(item => item._id === itemId);
    return orderItem ? orderItem.quantity : 0;
  };

  // Render placeholder initials
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="luxury-menu">
      {/* Debug info - remove in production */}
      {import.meta.env.DEV && (
        <div style={{ 
          position: 'fixed', 
          bottom: 10, 
          right: 10, 
          background: '#333', 
          color: '#0f0', 
          padding: '5px 10px', 
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}>
          API: {API_URL}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Cart Button */}
      {orderItems.length > 0 && (
        <button className="cart-button" onClick={() => setShowOrderSummary(true)}>
          <FaShoppingCart />
          <span className="cart-count">{orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </button>
      )}

      {/* Header with Restaurant Info */}
      <header className="menu-header">
        <div className="header-content">
          <h1 className="date ">{restaurant?.restaurantName || 'Loading...'}</h1>
          <p className="date">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </header>

      {/* Search */}
      <div className="search-container">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search menu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm('')}>
            <FaTimes />
          </button>
        )}
      </div>

      {/* Categories */}
      <nav className="menu-categories">
        {allCategories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </nav>

      {/* Menu Items */}
      <main className="menu-items-container">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading delicious menu...</p>
          </div>
        )}
        
        {!loading && filteredItems.length > 0 ? (
          filteredItems.map(item => {
            const quantity = getItemQuantity(item._id);
            const imageUrl = getImageUrl(item.imageUrl || item.image || item.imagePath);
            
            return (
              <div key={item._id} className="menu-item">
                <div className="item-image-container">
                  {!imageErrors[item._id] ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="item-image"
                      onError={() => handleImageError(item._id)}
                    />
                  ) : (
                    <div className="image-fallback">
                      <span className="fallback-text">{getInitials(item.name)}</span>
                    </div>
                  )}
                  <div className={`item-type ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>
                    {item.type === 'Veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                  </div>
                </div>
                <div className="item-details">
                  <div className="item-header">
                    <h3>{item.name}</h3>
                    <span className="price">₹{Number(item.price).toFixed(2)}</span>
                  </div>
                  <div className="item-meta">
                    <span className="category">{item.category}</span>
                  </div>
                  <div className="item-actions">
                    <button 
                      onClick={() => removeFromOrder(item._id)} 
                      className="quantity-btn minus-btn"
                      disabled={quantity === 0}
                    >
                      −
                    </button>
                    <span className="quantity">{quantity}</span>
                    <button onClick={() => addToOrder(item)} className="quantity-btn plus-btn">+</button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          !loading && (
            <div className="no-items">
              <p>No menu items found</p>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="clear-search-btn">
                  Clear Search
                </button>
              )}
            </div>
          )
        )}
      </main>

      {/* Order Summary Modal */}
      {showOrderSummary && (
        <div className="order-summary-overlay" onClick={() => setShowOrderSummary(false)}>
          <div className="order-summary" onClick={e => e.stopPropagation()}>
            <div className="summary-header">
              <h2>
                <FaShoppingCart /> Your Order
              </h2>
              <button className="close-btn" onClick={() => setShowOrderSummary(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="order-items">
              {orderItems.length > 0 ? (
                orderItems.map(item => (
                  <div key={item._id} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">₹{item.price} × {item.quantity}</span>
                    </div>
                    <div className="item-controls">
                      <button onClick={() => removeFromOrder(item._id)} className="control-btn">−</button>
                      <span className="item-quantity">{item.quantity}</span>
                      <button onClick={() => addToOrder(item)} className="control-btn">+</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-order">
                  <p>Your order is empty</p>
                  <button onClick={() => setShowOrderSummary(false)}>Continue Browsing</button>
                </div>
              )}
            </div>
            
            {orderItems.length > 0 && (
              <>
                {/* GST Info */}
                {restaurant && (
                  <div className="gst-summary-card">
                    {restaurant.gstNumber && (
                      <div className="gst-info-row">
                        <span>GST No:</span>
                        <span className="gst-value">{restaurant.gstNumber}</span>
                      </div>
                    )}
                    {restaurant.foodLicense && (
                      <div className="gst-info-row">
                        <span>Food License:</span>
                        <span className="license-value">{restaurant.foodLicense}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="order-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>₹{getTotal().toFixed(2)}</span>
                  </div>
                  <div className="total-row gst-row">
                    <span>
                      GST ({restaurant?.gstPercentage || 18}%) 
                      <FaPercent className="gst-icon-small" />
                    </span>
                    <span>₹{getGstAmount().toFixed(2)}</span>
                  </div>
                  <div className="total-row grand-total">
                    <span>Total (incl. GST)</span>
                    <span>₹{getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="customer-info">
                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setNameError(false);
                    }}
                    className={nameError ? 'error' : ''}
                  />
                  {nameError && <small className="error-text">Please enter your name</small>}
                  
                  <input
                    type="text"
                    placeholder="Table Number (1-50) *"
                    value={tableNumber}
                    onChange={handleTableNumberChange}
                    className={tableError ? 'error' : ''}
                  />
                  {tableError && <small className="error-text">Please enter valid table (1-50)</small>}
                </div>
                
                <div className="order-actions">
                  <button 
                    onClick={handleOrder} 
                    className="place-order-btn"
                    disabled={submitting}
                  >
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                  <button onClick={clearOrder} className="clear-order-btn">
                    Clear Order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Mobile toggle */}
      {isMobile && orderItems.length > 0 && !showOrderSummary && (
        <button className="mobile-order-toggle" onClick={() => setShowOrderSummary(true)}>
          <FaShoppingCart /> View Order ({orderItems.reduce((sum, item) => sum + item.quantity, 0)} items)
        </button>
      )}
    </div>
  );
};

export default Publicmenu;