//import React, { useEffect, useState } from 'react';
//import axios from 'axios';
//import { useNavigate, useParams } from 'react-router-dom';
//import { 
//  FaShoppingCart, 
//  FaSearch, 
//  FaTimes, 
//  FaUtensils,
//  FaCommentDots,
//  FaGlassWhiskey,
//  FaRegStickyNote,
//  FaReceipt,
//  FaSpinner,
//  FaUser,
//  FaChair,
//  FaPaperPlane
//} from 'react-icons/fa';
//import './Publicmenu.css';
//
//const Publicmenu = () => {
//  const { restaurantSlug } = useParams();
//  const navigate = useNavigate();
//  
//  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
//  
//  console.log('🔧 Publicmenu using backend:', API_URL);
//  
//  const [menuItems, setMenuItems] = useState([]);
//  const [filteredItems, setFilteredItems] = useState([]);
//  const [orderItems, setOrderItems] = useState([]);
//  const [tableNumber, setTableNumber] = useState('');
//  const [customerName, setCustomerName] = useState('');
//  const [nameError, setNameError] = useState(false);
//  const [tableError, setTableError] = useState(false);
//  const [loading, setLoading] = useState(true);
//  const [error, setError] = useState(null);
//  const [submitting, setSubmitting] = useState(false);
//  const [activeCategory, setActiveCategory] = useState('all');
//  const [activeTypeFilter, setActiveTypeFilter] = useState('all');
//  const [searchTerm, setSearchTerm] = useState('');
//  const [showOrderSummary, setShowOrderSummary] = useState(false);
//  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
//  const [restaurant, setRestaurant] = useState(null);
//  const [categories, setCategories] = useState([]);
//  const [imageErrors, setImageErrors] = useState({});
//  
//  // Request feature states
//  const [showRequestMenu, setShowRequestMenu] = useState(false);
//  const [submittingRequest, setSubmittingRequest] = useState(false);
//  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
//  const [popupMessage, setPopupMessage] = useState('');
//  const [popupIcon, setPopupIcon] = useState('');
//  const [selectedRequestType, setSelectedRequestType] = useState(null);
//
//  const getImageUrl = (imageName) => {
//    if (!imageName) return null;
//    if (imageName.startsWith('http')) return imageName;
//    if (imageName.startsWith('/uploads/')) return `${API_URL}${imageName}`;
//    if (imageName.startsWith('/')) return `${API_URL}${imageName}`;
//    return `${API_URL}/uploads/menu/${imageName}`;
//  };
//
//  const handleImageError = (itemId) => {
//    console.log(`Image failed to load for item ${itemId}`);
//    setImageErrors(prev => ({ ...prev, [itemId]: true }));
//  };
//
//  // Show popup notification
//  const showPopup = (message, type = 'success') => {
//    setPopupMessage(message);
//    setPopupIcon(type === 'success' ? '✅' : '❌');
//    setShowSuccessPopup(true);
//    
//    setTimeout(() => {
//      setShowSuccessPopup(false);
//    }, 3000);
//  };
//
//  const testBackendConnection = async () => {
//    try {
//      console.log('Testing backend connection...');
//      await axios.get(`${API_URL}/api/test`, { timeout: 3000 });
//      console.log(`✅ Backend reachable`);
//      return true;
//    } catch (error) {
//      console.error('Connection error:', error.message);
//      return false;
//    }
//  };
//
//  const fetchRestaurantDetails = async () => {
//    try {
//      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
//      setRestaurant(response.data);
//      return response.data;
//    } catch (error) {
//      console.error('Error fetching restaurant:', error);
//      setError('Failed to load restaurant details');
//      return null;
//    }
//  };
//
//  const fetchMenuItems = async () => {
//    try {
//      setLoading(true);
//      const response = await axios.get(`${API_URL}/api/menu/restaurant/${restaurantSlug}`);
//      
//      if (response.data && Array.isArray(response.data)) {
//        const processedItems = response.data.map(item => ({
//          ...item,
//          imagePath: item.imageUrl || item.image || null
//        }));
//        
//        setMenuItems(processedItems);
//        setFilteredItems(processedItems);
//        
//        const uniqueCategories = [...new Set(processedItems.map(item => item.category).filter(Boolean))];
//        setCategories(uniqueCategories);
//      }
//    } catch (err) {
//      console.error('Error fetching menu:', err);
//      setError('Failed to load menu');
//    } finally {
//      setLoading(false);
//    }
//  };
//
//  useEffect(() => {
//    localStorage.removeItem(`currentOrder_${restaurantSlug}`);
//    setOrderItems([]);
//  }, [restaurantSlug]);
//
//  useEffect(() => {
//    const initializePage = async () => {
//      if (!restaurantSlug) {
//        setError('Restaurant not found');
//        setLoading(false);
//        return;
//      }
//
//      const isConnected = await testBackendConnection();
//      if (!isConnected) {
//        setError('Cannot connect to server');
//        setLoading(false);
//        return;
//      }
//
//      await fetchRestaurantDetails();
//      await fetchMenuItems();
//    };
//
//    initializePage();
//  }, [restaurantSlug]);
//
//  useEffect(() => {
//    let result = menuItems;
//    
//    if (activeCategory !== 'all') {
//      result = result.filter(item => 
//        item.category && item.category.toLowerCase() === activeCategory.toLowerCase()
//      );
//    }
//    
//    if (activeTypeFilter !== 'all') {
//      result = result.filter(item => 
//        item.type && item.type.toLowerCase() === activeTypeFilter.toLowerCase()
//      );
//    }
//    
//    if (searchTerm) {
//      result = result.filter(item => 
//        item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
//      );
//    }
//    
//    setFilteredItems(result);
//  }, [activeCategory, activeTypeFilter, searchTerm, menuItems]);
//
//  useEffect(() => {
//    const handleResize = () => {
//      setIsMobile(window.innerWidth < 768);
//    };
//    window.addEventListener('resize', handleResize);
//    return () => window.removeEventListener('resize', handleResize);
//  }, []);
//
//  const addToOrder = (item) => {
//    setOrderItems(prev => {
//      const existingItem = prev.find(i => i._id === item._id);
//      if (existingItem) {
//        return prev.map(i => 
//          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
//        );
//      } else {
//        return [...prev, { ...item, quantity: 1 }];
//      }
//    });
//  };
//
//  const removeFromOrder = (itemId) => {
//    setOrderItems(prev =>
//      prev.map(item => item._id === itemId
//        ? { ...item, quantity: item.quantity - 1 }
//        : item
//      ).filter(item => item.quantity > 0)
//    );
//  };
//
//  const getTotal = () => orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//  const getGstAmount = () => (getTotal() * (restaurant?.gstPercentage || 18)) / 100;
//  const getGrandTotal = () => getTotal() + getGstAmount();
//
//  // Open request popup with selected type
//  const openRequestPopup = (option) => {
//    setSelectedRequestType(option);
//    setShowRequestMenu(true);
//  };
//
//  // Handle sending request with name and table
//  const handleSendRequest = async () => {
//    // Validate customer name
//    if (!customerName.trim()) {
//      setNameError(true);
//      showPopup('⚠️ Please enter your name', 'error');
//      return;
//    }
//
//    // Validate table number
//    if (!tableNumber || parseInt(tableNumber) < 1 || parseInt(tableNumber) > 50) {
//      setTableError(true);
//      showPopup('⚠️ Please enter valid table number (1-50)', 'error');
//      return;
//    }
//
//    let requestType = '';
//    let requestMessage = '';
//    let popupTitle = '';
//
//    switch(selectedRequestType) {
//      case 'water':
//        requestType = 'water';
//        requestMessage = 'Customer requested bottle of water';
//        popupTitle = '💧 Water Request Sent!';
//        break;
//      case 'tissue':
//        requestType = 'tissue';
//        requestMessage = 'Customer requested tissue paper';
//        popupTitle = '🧻 Tissue Request Sent!';
//        break;
//      case 'bill':
//        requestType = 'bill';
//        requestMessage = 'Customer requested the bill';
//        popupTitle = '🧾 Bill Request Sent!';
//        break;
//      default:
//        return;
//    }
//
//    setSubmittingRequest(true);
//
//    try {
//      const token = localStorage.getItem('token');
//      
//      const requestData = {
//        orderId: null,
//        billNumber: null,
//        restaurantSlug: restaurantSlug,
//        restaurantCode: restaurant?.restaurantCode,
//        customerName: customerName.trim(),
//        tableNumber: parseInt(tableNumber),
//        requestType: requestType,
//        requestMessage: requestMessage
//      };
//
//      const response = await axios.post(`${API_URL}/api/order/customer-request/create`, requestData, {
//        headers: {
//          'Authorization': `Bearer ${token}`,
//          'Content-Type': 'application/json'
//        }
//      });
//
//      if (response.data.success) {
//        showPopup(`${popupTitle}\n\nTable: ${tableNumber}\nCustomer: ${customerName}\n\nStaff will attend to your request shortly.`, 'success');
//        setShowRequestMenu(false);
//        setSelectedRequestType(null);
//        // Don't clear name and table so user can send more requests
//      }
//    } catch (err) {
//      console.error('Error sending request:', err);
//      showPopup(`Failed to send request: ${err.response?.data?.error || err.message}`, 'error');
//    } finally {
//      setSubmittingRequest(false);
//    }
//  };
//
//  const handleTableNumberChange = (e) => {
//    const value = e.target.value;
//    if (value === '' || /^([1-9]|[1-4][0-9]|50)$/.test(value)) {
//      setTableNumber(value);
//      setTableError(false);
//    }
//  };
//
//  const handleOrder = async () => {
//    if (!customerName.trim()) {
//      setNameError(true);
//      return;
//    }
//    
//    if (!tableNumber || parseInt(tableNumber) < 1 || parseInt(tableNumber) > 50) {
//      setTableError(true);
//      return;
//    }
//    
//    if (orderItems.length === 0) {
//      alert('Please add items to your order');
//      return;
//    }
//
//    setSubmitting(true);
//    
//    try {
//      const now = new Date();
//      const orderData = {
//        restaurantSlug,
//        restaurantName: restaurant?.restaurantName || 'Restaurant',
//        restaurantCode: restaurant?.restaurantCode || restaurantSlug.toUpperCase(),
//        customerName: customerName.trim(),
//        tableNumber: parseInt(tableNumber),
//        gstNumber: restaurant?.gstNumber || '',
//        gstPercentage: restaurant?.gstPercentage || 18,
//        foodLicense: restaurant?.foodLicense || '',
//        date: now.toISOString().split('T')[0],
//        time: now.toTimeString().split(' ')[0],
//        items: orderItems.map(item => ({
//          itemId: item._id,
//          name: item.name,
//          quantity: Number(item.quantity),
//          price: Number(item.price),
//          category: item.category,
//          type: item.type,
//          image: item.image,
//          total: Number(item.price * item.quantity)
//        })),
//        subtotal: Number(getTotal()),
//        discount: 0,
//        gstAmount: Number(getGstAmount()),
//        total: Number(getGrandTotal()),
//        status: 'pending'
//      };
//
//      const response = await axios.post(`${API_URL}/api/order`, orderData);
//      
//      if (response.status === 201) {
//        localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(response.data.order));
//        navigate(`/${restaurantSlug}/order/${response.data.order._id}`, { 
//          state: { order: response.data.order, restaurant: restaurant } 
//        });
//      }
//    } catch (error) {
//      console.error('Order error:', error);
//      let errorMessage = 'Order failed. Please try again.';
//      if (error.response) {
//        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
//      }
//      alert(errorMessage);
//    } finally {
//      setSubmitting(false);
//    }
//  };
//
//  const clearOrder = () => {
//    setOrderItems([]);
//    localStorage.removeItem(`currentOrder_${restaurantSlug}`);
//  };
//
//  const allCategories = [
//    { id: 'all', name: 'All Items' },
//    ...categories.map(cat => ({ id: cat.toLowerCase().replace(/\s+/g, '-'), name: cat }))
//  ];
//
//  const getItemQuantity = (itemId) => {
//    const orderItem = orderItems.find(item => item._id === itemId);
//    return orderItem ? orderItem.quantity : 0;
//  };
//
//  const getInitials = (name) => {
//    return name ? name.charAt(0).toUpperCase() : '?';
//  };
//
//  const getRequestTitle = (type) => {
//    switch(type) {
//      case 'water': return '💧 Water Request';
//      case 'tissue': return '🧻 Tissue Request';
//      case 'bill': return '🧾 Bill Request';
//      default: return 'Request';
//    }
//  };
//
//  return (
//    <div className="luxury-menu">
//      {/* Success Popup Notification */}
//      {showSuccessPopup && (
//        <div className="success-popup-overlay">
//          <div className="success-popup">
//            <div className="popup-icon">{popupIcon}</div>
//            <div className="popup-message">{popupMessage}</div>
//            <button className="popup-close" onClick={() => setShowSuccessPopup(false)}>
//              <FaTimes />
//            </button>
//          </div>
//        </div>
//      )}
//
//      {/* Request Button - Always Visible */}
//      <button 
//        className="request-fab"
//        onClick={() => {
//          setSelectedRequestType(null);
//          setShowRequestMenu(true);
//        }}
//        disabled={submittingRequest}
//      >
//        {submittingRequest ? <FaSpinner className="spinner" /> : <FaCommentDots />}
//      </button>
//
//      {/* Request Popup with Name and Table Fields */}
//      {showRequestMenu && (
//        <div className="request-menu-overlay" onClick={() => {
//          setShowRequestMenu(false);
//          setSelectedRequestType(null);
//          setNameError(false);
//          setTableError(false);
//        }}>
//          <div className="request-menu" onClick={(e) => e.stopPropagation()}>
//            <div className="request-menu-header">
//              <h3>{selectedRequestType ? getRequestTitle(selectedRequestType) : 'Request Something?'}</h3>
//              <button className="close-request-menu" onClick={() => {
//                setShowRequestMenu(false);
//                setSelectedRequestType(null);
//                setNameError(false);
//                setTableError(false);
//              }}>
//                <FaTimes />
//              </button>
//            </div>
//            
//            <div className="request-menu-body">
//              {/* Show request options first */}
//              {!selectedRequestType ? (
//                <div className="request-options">
//                  <button 
//                    className="request-option water"
//                    onClick={() => openRequestPopup('water')}
//                  >
//                    <FaGlassWhiskey className="request-icon" />
//                    <div className="request-text">
//                      <span className="request-title">Bottle of Water</span>
//                      <span className="request-desc">Request drinking water</span>
//                    </div>
//                  </button>
//                  <button 
//                    className="request-option tissue"
//                    onClick={() => openRequestPopup('tissue')}
//                  >
//                    <FaRegStickyNote className="request-icon" />
//                    <div className="request-text">
//                      <span className="request-title">Tissue Paper</span>
//                      <span className="request-desc">Request tissue paper</span>
//                    </div>
//                  </button>
//                  <button 
//                    className="request-option bill"
//                    onClick={() => openRequestPopup('bill')}
//                  >
//                    <FaReceipt className="request-icon" />
//                    <div className="request-text">
//                      <span className="request-title">call waiter</span>
//                      <span className="request-desc">Request to waiter</span>
//                    </div>
//                  </button>
//                </div>
//              ) : (
//                // Show name and table fields after selecting request type
//                <div className="request-details-form">
//                  <div className="form-description">
//                    <p>Please provide your details to send {getRequestTitle(selectedRequestType).toLowerCase()}</p>
//                  </div>
//                  
//                  <div className="form-group">
//                    <label>
//                      <FaUser className="field-icon" />
//                      Your Name
//                    </label>
//                    <input
//                      type="text"
//                      placeholder="Enter your name"
//                      value={customerName}
//                      onChange={(e) => {
//                        setCustomerName(e.target.value);
//                        setNameError(false);
//                      }}
//                      className={nameError ? 'error' : ''}
//                    />
//                    {nameError && <small className="error-text">Please enter your name</small>}
//                  </div>
//                  
//                  <div className="form-group">
//                    <label>
//                      <FaChair className="field-icon" />
//                      Table Number
//                    </label>
//                    <input
//                      type="text"
//                      placeholder="Enter table number (1-50)"
//                      value={tableNumber}
//                      onChange={handleTableNumberChange}
//                      className={tableError ? 'error' : ''}
//                    />
//                    {tableError && <small className="error-text">Please enter valid table number (1-50)</small>}
//                  </div>
//                  
//                  <div className="form-actions">
//                    <button 
//                      className="back-btn"
//                      onClick={() => {
//                        setSelectedRequestType(null);
//                        setNameError(false);
//                        setTableError(false);
//                      }}
//                    >
//                      Back
//                    </button>
//                    <button 
//                      className="send-request-btn"
//                      onClick={handleSendRequest}
//                      disabled={submittingRequest}
//                    >
//                      {submittingRequest ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
//                      Send Request
//                    </button>
//                  </div>
//                </div>
//              )}
//            </div>
//          </div>
//        </div>
//      )}
//
//      {import.meta.env.DEV && (
//        <div style={{ 
//          position: 'fixed', bottom: 10, right: 10, background: '#333', color: '#0f0', 
//          padding: '5px 10px', borderRadius: '5px', fontSize: '12px', zIndex: 9999, fontFamily: 'monospace'
//        }}>
//          API: {API_URL}
//        </div>
//      )}
//
//      {error && (
//        <div className="error-banner">
//          <p>{error}</p>
//          <button onClick={() => window.location.reload()}>Retry</button>
//        </div>
//      )}
//
//      {orderItems.length > 0 && (
//        <button className="cart-button" onClick={() => setShowOrderSummary(true)}>
//          <FaShoppingCart />
//          <span className="cart-count">{orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
//        </button>
//      )}
//
//      <header className="menu-header">
//        <div className="header-content">
//          <h1>{restaurant?.restaurantName || 'Loading...'}</h1>
//          <p className="date">
//            {new Date().toLocaleDateString('en-US', { 
//              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
//            })}
//          </p>
//        </div>
//      </header>
//
//      <div className="search-container">
//        <FaSearch className="search-icon" />
//        <input
//          type="text"
//          placeholder="Search menu..."
//          value={searchTerm}
//          onChange={(e) => setSearchTerm(e.target.value)}
//          className="search-input"
//        />
//        {searchTerm && (
//          <button className="clear-search" onClick={() => setSearchTerm('')}>
//            <FaTimes />
//          </button>
//        )}
//      </div>
//
//      {/* Veg/Non-Veg Filter Buttons */}
//      <div className="type-filter-container">
//        <button
//          className={`type-filter-btn ${activeTypeFilter === 'all' ? 'active' : ''}`}
//          onClick={() => setActiveTypeFilter('all')}
//        >
//          All 
//        </button>
//        <button
//          className={`type-filter-btn veg-btn ${activeTypeFilter === 'veg' ? 'active' : ''}`}
//          onClick={() => setActiveTypeFilter('veg')}
//        >
//          🟢 Veg 
//        </button>
//        <button
//          className={`type-filter-btn nonveg-btn ${activeTypeFilter === 'non-veg' ? 'active' : ''}`}
//          onClick={() => setActiveTypeFilter('non-veg')}
//        >
//          🔴 Non-Veg
//        </button>
//      </div>
//
//      <nav className="menu-categories">
//        {allCategories.map(category => (
//          <button
//            key={category.id}
//            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
//            onClick={() => setActiveCategory(category.id)}
//          >
//            {category.name}
//          </button>
//        ))}
//      </nav>
//
//      <main className="menu-items-container">
//        {loading && (
//          <div className="loading">
//            <div className="spinner"></div>
//            <p>Loading delicious menu...</p>
//          </div>
//        )}
//        
//        {!loading && filteredItems.length > 0 ? (
//          filteredItems.map(item => {
//            const quantity = getItemQuantity(item._id);
//            const imageUrl = getImageUrl(item.imageUrl || item.image || item.imagePath);
//            const hasImage = imageUrl && !imageErrors[item._id];
//            
//            return (
//              <div key={item._id} className="menu-item">
//                <div className="item-image-wrapper">
//                  {hasImage ? (
//                    <img
//                      src={imageUrl}
//                      alt={item.name}
//                      className="item-image"
//                      onError={() => handleImageError(item._id)}
//                      loading="lazy"
//                    />
//                  ) : (
//                    <div className="image-fallback">
//                      <div className="fallback-content">
//                        <FaUtensils className="fallback-icon" />
//                        <span className="fallback-text">{getInitials(item.name)}</span>
//                      </div>
//                    </div>
//                  )}
//                  <div className={`item-type-badge ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>
//                    {item.type === 'Veg' ? '🟢 Veg' : '🔴 Non-Veg'}
//                  </div>
//                </div>
//                
//                <div className="item-details">
//                  <div className="item-header">
//                    <h3>{item.name}</h3>
//                    <span className="price">₹{Number(item.price).toFixed(2)}</span>
//                  </div>
//                  <div className="item-meta">
//                    <span className="category">{item.category}</span>
//                  </div>
//                  <div className="item-actions">
//                    <button 
//                      onClick={() => removeFromOrder(item._id)} 
//                      className="quantity-btn"
//                      disabled={quantity === 0}
//                    >
//                      −
//                    </button>
//                    <span className="quantity">{quantity}</span>
//                    <button onClick={() => addToOrder(item)} className="quantity-btn">+</button>
//                  </div>
//                </div>
//              </div>
//            );
//          })
//        ) : (
//          !loading && (
//            <div className="no-items">
//              <p>No menu items found</p>
//              {(searchTerm || activeTypeFilter !== 'all') && (
//                <button 
//                  onClick={() => {
//                    setSearchTerm('');
//                    setActiveTypeFilter('all');
//                  }} 
//                  className="clear-search-btn"
//                >
//                  Clear Filters
//                </button>
//              )}
//            </div>
//          )
//        )}
//      </main>
//
//      {showOrderSummary && (
//        <div className="order-summary-overlay" onClick={() => setShowOrderSummary(false)}>
//          <div className="order-summary" onClick={e => e.stopPropagation()}>
//            <div className="summary-header">
//              <h2><FaShoppingCart /> Your Order</h2>
//              <button className="close-btn" onClick={() => setShowOrderSummary(false)}>
//                <FaTimes />
//              </button>
//            </div>
//            
//            <div className="order-summary-content">
//              {orderItems.length > 0 ? (
//                <>
//                  <div className="order-items">
//                    {orderItems.map(item => (
//                      <div key={item._id} className="order-item">
//                        <div className="item-info">
//                          <span className="item-name">{item.name}</span>
//                          <span className="item-price">₹{item.price}</span>
//                          <span className="item-quantity-label">× {item.quantity}</span>
//                        </div>
//                        <div className="item-controls">
//                          <button onClick={() => removeFromOrder(item._id)} className="control-btn">−</button>
//                          <span className="item-quantity">{item.quantity}</span>
//                          <button onClick={() => addToOrder(item)} className="control-btn">+</button>
//                        </div>
//                      </div>
//                    ))}
//                  </div>
//                  
//                  <div className="order-totals">
//                    <div className="total-row">
//                      <span>Subtotal</span>
//                      <span>₹{getTotal().toFixed(2)}</span>
//                    </div>
//                    <div className="total-row">
//                      <span>GST ({restaurant?.gstPercentage || 18}%)</span>
//                      <span>₹{getGstAmount().toFixed(2)}</span>
//                    </div>
//                    <div className="total-row grand-total">
//                      <span>Total (incl. GST)</span>
//                      <span>₹{getGrandTotal().toFixed(2)}</span>
//                    </div>
//                  </div>
//                  
//                  <div className="customer-info-order">
//                    <div className="info-row">
//                      <FaUser className="info-icon" />
//                      <span>{customerName || 'Not entered'}</span>
//                    </div>
//                    <div className="info-row">
//                      <FaChair className="info-icon" />
//                      <span>Table {tableNumber || 'Not entered'}</span>
//                    </div>
//                  </div>
//                </>
//              ) : (
//                <div className="empty-order">
//                  <p>Your order is empty</p>
//                  <button onClick={() => setShowOrderSummary(false)}>Continue Browsing</button>
//                </div>
//              )}
//            </div>
//            
//            {orderItems.length > 0 && (
//              <div className="order-actions">
//                <button onClick={handleOrder} className="place-order-btn" disabled={submitting}>
//                  {submitting ? 'Placing Order...' : 'Place Order'}
//                </button>
//                <button onClick={clearOrder} className="clear-order-btn">Clear Order</button>
//              </div>
//            )}
//          </div>
//        </div>
//      )}
//      
//      {isMobile && orderItems.length > 0 && !showOrderSummary && (
//        <button className="mobile-order-toggle" onClick={() => setShowOrderSummary(true)}>
//          <FaShoppingCart /> View Order ({orderItems.reduce((sum, item) => sum + item.quantity, 0)} items)
//        </button>
//      )}
//    </div>
//  );
//};
//
//export default Publicmenu;
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaShoppingCart, 
  FaSearch, 
  FaTimes, 
  FaUtensils,
  FaCommentDots,
  FaGlassWhiskey,
  FaRegStickyNote,
  FaReceipt,
  FaSpinner,
  FaUser,
  FaChair,
  FaPaperPlane,
  FaLocationArrow,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaDirections
} from 'react-icons/fa';
import './Publicmenu.css';

const Publicmenu = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
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
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  
  // Location states
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading');
  const [locationError, setLocationError] = useState('');
  const [distanceToRestaurant, setDistanceToRestaurant] = useState(null);
  const [showLocationPopup, setShowLocationPopup] = useState(true);
  
  // Request feature states
  const [showRequestMenu, setShowRequestMenu] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupIcon, setPopupIcon] = useState('');
  const [selectedRequestType, setSelectedRequestType] = useState(null);
  
  // Refs to avoid stale closures
  const restaurantRef = useRef(null);

  // Haversine formula to calculate distance between two coordinates (in meters)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Open maps for navigation
  const getDirections = () => {
    if (!restaurantRef.current?.latitude || !restaurantRef.current?.longitude) return;
    
    if (userLocation) {
      const origin = `${userLocation.latitude},${userLocation.longitude}`;
      const destination = `${restaurantRef.current.latitude},${restaurantRef.current.longitude}`;
      window.open(`https://www.google.com/maps/dir/${origin}/${destination}`, '_blank');
    } else {
      const destination = `${restaurantRef.current.latitude},${restaurantRef.current.longitude}`;
      window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`, '_blank');
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    setLocationStatus('loading');
    setLocationError('');
    setShowLocationPopup(true);
    
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        console.log('📍 User location:', latitude, longitude);
        
        // Use ref to get latest restaurant data
        const currentRestaurant = restaurantRef.current;
        
        if (currentRestaurant && currentRestaurant.latitude && currentRestaurant.longitude) {
          const restLat = parseFloat(currentRestaurant.latitude);
          const restLon = parseFloat(currentRestaurant.longitude);
          
          console.log('📍 Restaurant location from ref:', restLat, restLon);
          
          if (!isNaN(restLat) && !isNaN(restLon)) {
            const distance = calculateDistance(latitude, longitude, restLat, restLon);
            setDistanceToRestaurant(distance);
            console.log('📏 Distance to restaurant:', Math.round(distance), 'meters');
            
            if (distance <= 40) {
              setLocationStatus('within_range');
              console.log('✅ Within range! Ordering allowed.');
            } else {
              setLocationStatus('outside_range');
              console.log('❌ Outside range! Need to come closer.');
            }
          } else {
            console.log('⚠️ Restaurant coordinates invalid');
            setLocationStatus('within_range');
          }
        } else {
          console.log('⚠️ Restaurant location not set in ref, allowing order');
          setLocationStatus('within_range');
        }
        
        // Auto hide popup after 3 seconds if within range
        if (distanceToRestaurant <= 40) {
          setTimeout(() => setShowLocationPopup(false), 3000);
        }
      },
      (error) => {
        console.error('Location error:', error);
        let errorMsg = '';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location access denied. Please enable location to order.';
            setLocationStatus('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable.';
            setLocationStatus('error');
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out.';
            setLocationStatus('error');
            break;
          default:
            errorMsg = 'Unable to get your location.';
            setLocationStatus('error');
        }
        setLocationError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    if (imageName.startsWith('http')) return imageName;
    if (imageName.startsWith('/uploads/')) return `${API_URL}${imageName}`;
    return `${API_URL}/uploads/menu/${imageName}`;
  };

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const showPopup = (message, type = 'success') => {
    setPopupMessage(message);
    setPopupIcon(type === 'success' ? '✅' : '❌');
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000);
  };

  const testBackendConnection = async () => {
    try {
      await axios.get(`${API_URL}/api/test`, { timeout: 3000 });
      return true;
    } catch (error) {
      return false;
    }
  };

  const fetchRestaurantDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
      const restaurantData = response.data;
      setRestaurant(restaurantData);
      restaurantRef.current = restaurantData; // Update ref
      console.log('📍 Restaurant location from API:', restaurantData.latitude, restaurantData.longitude);
      return restaurantData;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      setError('Failed to load restaurant details');
      return null;
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/menu/restaurant/${restaurantSlug}`);
      
      if (response.data && Array.isArray(response.data)) {
        setMenuItems(response.data);
        setFilteredItems(response.data);
        
        const uniqueCategories = [...new Set(response.data.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.removeItem(`currentOrder_${restaurantSlug}`);
    setOrderItems([]);
  }, [restaurantSlug]);

  useEffect(() => {
    const initializePage = async () => {
      if (!restaurantSlug) {
        setError('Restaurant not found');
        setLoading(false);
        return;
      }

      const isConnected = await testBackendConnection();
      if (!isConnected) {
        setError('Cannot connect to server');
        setLoading(false);
        return;
      }

      await fetchRestaurantDetails();
      await fetchMenuItems();
      // Get user location after restaurant data is loaded
      getUserLocation();
    };

    initializePage();
  }, [restaurantSlug]);

  useEffect(() => {
    let result = menuItems;
    
    if (activeCategory !== 'all') {
      result = result.filter(item => 
        item.category && item.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }
    
    if (activeTypeFilter !== 'all') {
      result = result.filter(item => 
        item.type && item.type.toLowerCase() === activeTypeFilter.toLowerCase()
      );
    }
    
    if (searchTerm) {
      result = result.filter(item => 
        item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredItems(result);
  }, [activeCategory, activeTypeFilter, searchTerm, menuItems]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addToOrder = (item) => {
    if (locationStatus === 'outside_range') {
      showPopup(`⚠️ You are ${Math.round(distanceToRestaurant)} meters away.\nPlease come within 40 meters to order.`, 'error');
      return;
    }
    
    setOrderItems(prev => {
      const existingItem = prev.find(i => i._id === item._id);
      if (existingItem) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromOrder = (itemId) => {
    setOrderItems(prev =>
      prev.map(item => item._id === itemId
        ? { ...item, quantity: item.quantity - 1 }
        : item
      ).filter(item => item.quantity > 0)
    );
  };

  const getTotal = () => orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const getGstAmount = () => (getTotal() * (restaurant?.gstPercentage || 18)) / 100;
  const getGrandTotal = () => getTotal() + getGstAmount();

  const openRequestPopup = (option) => {
    if (locationStatus === 'outside_range') {
      showPopup(`⚠️ You are ${Math.round(distanceToRestaurant)} meters away.\nPlease come within 40 meters to send request.`, 'error');
      return;
    }
    setSelectedRequestType(option);
    setShowRequestMenu(true);
  };

  const handleSendRequest = async () => {
    if (locationStatus === 'outside_range') {
      showPopup(`⚠️ You are ${Math.round(distanceToRestaurant)} meters away.\nPlease come within 40 meters to send request.`, 'error');
      return;
    }
    
    if (!customerName.trim()) {
      setNameError(true);
      showPopup('⚠️ Please enter your name', 'error');
      return;
    }

    if (!tableNumber || parseInt(tableNumber) < 1 || parseInt(tableNumber) > 50) {
      setTableError(true);
      showPopup('⚠️ Please enter valid table number (1-50)', 'error');
      return;
    }

    let requestType = '', requestMessage = '', popupTitle = '';

    switch(selectedRequestType) {
      case 'water':
        requestType = 'water';
        requestMessage = 'Customer requested bottle of water';
        popupTitle = '💧 Water Request Sent!';
        break;
      case 'tissue':
        requestType = 'tissue';
        requestMessage = 'Customer requested tissue paper';
        popupTitle = '🧻 Tissue Request Sent!';
        break;
      case 'bill':
        requestType = 'bill';
        requestMessage = 'Customer requested the bill';
        popupTitle = '🧾 Bill Request Sent!';
        break;
      default: return;
    }

    setSubmittingRequest(true);

    try {
      const token = localStorage.getItem('token');
      
      const requestData = {
        orderId: null,
        billNumber: null,
        restaurantSlug: restaurantSlug,
        restaurantCode: restaurant?.restaurantCode,
        customerName: customerName.trim(),
        tableNumber: parseInt(tableNumber),
        requestType: requestType,
        requestMessage: requestMessage
      };

      const response = await axios.post(`${API_URL}/api/order/customer-request/create`, requestData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        showPopup(`${popupTitle}\n\nTable: ${tableNumber}\nCustomer: ${customerName}`, 'success');
        setShowRequestMenu(false);
        setSelectedRequestType(null);
      }
    } catch (err) {
      showPopup(`Failed to send request: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleTableNumberChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^([1-9]|[1-4][0-9]|50)$/.test(value)) {
      setTableNumber(value);
      setTableError(false);
    }
  };

  const handleOrder = async () => {
    if (locationStatus === 'outside_range') {
      showPopup(`⚠️ You are ${Math.round(distanceToRestaurant)} meters away.\nPlease come within 40 meters to place order.`, 'error');
      return;
    }
    
    if (!customerName.trim()) { 
      setNameError(true); 
      showPopup('⚠️ Please enter your name', 'error');
      return; 
    }
    
    if (!tableNumber || parseInt(tableNumber) < 1 || parseInt(tableNumber) > 50) { 
      setTableError(true); 
      showPopup('⚠️ Please enter valid table number (1-50)', 'error');
      return; 
    }
    
    if (orderItems.length === 0) { 
      showPopup('⚠️ Please add items to your order', 'error');
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

      const response = await axios.post(`${API_URL}/api/order`, orderData);
      
      if (response.status === 201) {
        localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(response.data.order));
        navigate(`/${restaurantSlug}/order/${response.data.order._id}`);
      }
    } catch (error) {
      showPopup('Order failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const clearOrder = () => {
    setOrderItems([]);
    localStorage.removeItem(`currentOrder_${restaurantSlug}`);
  };

  const retryLocation = () => getUserLocation();

  const allCategories = [
    { id: 'all', name: 'All Items' },
    ...categories.map(cat => ({ id: cat.toLowerCase().replace(/\s+/g, '-'), name: cat }))
  ];

  const getItemQuantity = (itemId) => {
    const orderItem = orderItems.find(item => item._id === itemId);
    return orderItem ? orderItem.quantity : 0;
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const getRequestTitle = (type) => {
    switch(type) {
      case 'water': return '💧 Water Request';
      case 'tissue': return '🧻 Tissue Request';
      case 'bill': return '🧾 Bill Request';
      default: return 'Request';
    }
  };

  const isOrderingAllowed = () => {
    return locationStatus === 'within_range';
  };

  // Get distance message
  const getDistanceMessage = () => {
    if (distanceToRestaurant) {
      const km = distanceToRestaurant / 1000;
      if (km > 1) {
        return `${km.toFixed(1)} km`;
      }
      return `${Math.round(distanceToRestaurant)} meters`;
    }
    return 'calculating...';
  };

  // Check if user is outside range and should see restricted view
  const isOutsideRange = locationStatus === 'outside_range';

  return (
    <div className="luxury-menu">
      {/* Location Popup Modal */}
      {showLocationPopup && (locationStatus === 'loading' || locationStatus === 'outside_range' || locationStatus === 'denied' || locationStatus === 'error') && (
        <div className="location-popup-overlay">
          <div className="location-popup">
            <button className="location-popup-close" onClick={() => setShowLocationPopup(false)}>
              <FaTimes />
            </button>
            
            {locationStatus === 'loading' && (
              <div className="location-popup-content loading">
                <div className="popup-spinner"></div>
                <FaLocationArrow className="popup-icon pulse" />
                <h3>Detecting Your Location</h3>
                <p>Please wait while we verify your location...</p>
                <p className="location-note">We need to ensure you're within ordering range (40 meters)</p>
              </div>
            )}
            
            {locationStatus === 'outside_range' && distanceToRestaurant !== null && (
              <div className="location-popup-content warning">
                <FaExclamationTriangle className="popup-icon" />
                <h3>You're Too Far Away!</h3>
                <p>You are <strong>{getDistanceMessage()}</strong> from the restaurant.</p>
                <p>Please come within <strong>40 meters</strong> to view the menu and place orders.</p>
                <div className="distance-indicator">
                  <div className="distance-bar">
                    <div className="distance-fill" style={{ width: `${Math.min(100, (distanceToRestaurant / 40) * 100)}%` }}></div>
                  </div>
                  <span>Required: 40m</span>
                </div>
                <div className="restaurant-address-popup">
                  <FaMapMarkerAlt />
                  <span>{restaurant?.restaurantName}</span>
                </div>
                <button onClick={getDirections} className="popup-directions-btn">
                  <FaDirections /> Get Directions
                </button>
                <button onClick={retryLocation} className="popup-retry-btn">
                  Try Again
                </button>
              </div>
            )}
            
            {locationStatus === 'denied' && (
              <div className="location-popup-content error">
                <FaExclamationTriangle className="popup-icon" />
                <h3>Location Access Required</h3>
                <p>We need your location to verify you're within ordering range.</p>
                <p className="location-help">Please enable location access in your browser settings to continue.</p>
                <button onClick={retryLocation} className="popup-retry-btn">
                  Try Again
                </button>
              </div>
            )}
            
            {locationStatus === 'error' && (
              <div className="location-popup-content error">
                <FaExclamationTriangle className="popup-icon" />
                <h3>Location Error</h3>
                <p>{locationError}</p>
                <button onClick={retryLocation} className="popup-retry-btn">
                  Retry Location
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup-overlay">
          <div className="success-popup">
            <div className="popup-icon">{popupIcon}</div>
            <div className="popup-message">{popupMessage}</div>
            <button className="popup-close" onClick={() => setShowSuccessPopup(false)}><FaTimes /></button>
          </div>
        </div>
      )}

      {/* Request Button - Only show when within range */}
      {isOrderingAllowed() && (
        <button 
          className="request-fab"
          onClick={() => { setSelectedRequestType(null); setShowRequestMenu(true); }}
          disabled={submittingRequest}
        >
          {submittingRequest ? <FaSpinner className="spinner" /> : <FaCommentDots />}
        </button>
      )}

      {/* Request Popup */}
      {showRequestMenu && (
        <div className="request-menu-overlay" onClick={() => { setShowRequestMenu(false); setSelectedRequestType(null); }}>
          <div className="request-menu" onClick={e => e.stopPropagation()}>
            <div className="request-menu-header">
              <h3>{selectedRequestType ? getRequestTitle(selectedRequestType) : 'Request Something?'}</h3>
              <button className="close-request-menu" onClick={() => { setShowRequestMenu(false); setSelectedRequestType(null); }}>
                <FaTimes />
              </button>
            </div>
            <div className="request-menu-body">
              {!selectedRequestType ? (
                <div className="request-options">
                  <button className="request-option water" onClick={() => openRequestPopup('water')}>
                    <FaGlassWhiskey className="request-icon" />
                    <div className="request-text">
                      <span className="request-title">Bottle of Water</span>
                      <span className="request-desc">Request drinking water</span>
                    </div>
                  </button>
                  <button className="request-option tissue" onClick={() => openRequestPopup('tissue')}>
                    <FaRegStickyNote className="request-icon" />
                    <div className="request-text">
                      <span className="request-title">Tissue Paper</span>
                      <span className="request-desc">Request tissue paper</span>
                    </div>
                  </button>
                  <button className="request-option bill" onClick={() => openRequestPopup('bill')}>
                    <FaReceipt className="request-icon" />
                    <div className="request-text">
                      <span className="request-title">Call Waiter</span>
                      <span className="request-desc">Request waiter assistance</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="request-details-form">
                  <div className="form-description">
                    <p>Please provide your details to send {getRequestTitle(selectedRequestType).toLowerCase()}</p>
                  </div>
                  <div className="form-group">
                    <label><FaUser className="field-icon" /> Your Name</label>
                    <input type="text" placeholder="Enter your name" value={customerName}
                      onChange={(e) => { setCustomerName(e.target.value); setNameError(false); }}
                      className={nameError ? 'error' : ''} />
                    {nameError && <small className="error-text">Please enter your name</small>}
                  </div>
                  <div className="form-group">
                    <label><FaChair className="field-icon" /> Table Number</label>
                    <input type="text" placeholder="Enter table number (1-50)" value={tableNumber}
                      onChange={handleTableNumberChange} className={tableError ? 'error' : ''} />
                    {tableError && <small className="error-text">Please enter valid table number (1-50)</small>}
                  </div>
                  <div className="form-actions">
                    <button className="back-btn" onClick={() => { setSelectedRequestType(null); setNameError(false); setTableError(false); }}>Back</button>
                    <button className="send-request-btn" onClick={handleSendRequest} disabled={submittingRequest}>
                      {submittingRequest ? <FaSpinner className="spinner" /> : <FaPaperPlane />} Send Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Cart Button - Only show when within range */}
      {orderItems.length > 0 && isOrderingAllowed() && (
        <button className="cart-button" onClick={() => setShowOrderSummary(true)}>
          <FaShoppingCart />
          <span className="cart-count">{orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </button>
      )}

      <header className="menu-header">
        <div className="header-content">
          <h1>{restaurant?.restaurantName || 'Loading...'}</h1>
          <p className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </header>

      {/* Show these elements ONLY when within range */}
      {isOrderingAllowed() && (
        <>
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search menu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
            {searchTerm && <button className="clear-search" onClick={() => setSearchTerm('')}><FaTimes /></button>}
          </div>

          <div className="type-filter-container">
            <button className={`type-filter-btn ${activeTypeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveTypeFilter('all')}>All</button>
            <button className={`type-filter-btn veg-btn ${activeTypeFilter === 'veg' ? 'active' : ''}`} onClick={() => setActiveTypeFilter('veg')}>🟢 Veg</button>
            <button className={`type-filter-btn nonveg-btn ${activeTypeFilter === 'non-veg' ? 'active' : ''}`} onClick={() => setActiveTypeFilter('non-veg')}>🔴 Non-Veg</button>
          </div>

          <nav className="menu-categories">
            {allCategories.map(category => (
              <button key={category.id} className={`category-btn ${activeCategory === category.id ? 'active' : ''}`} onClick={() => setActiveCategory(category.id)}>
                {category.name}
              </button>
            ))}
          </nav>
        </>
      )}

      <main className="menu-items-container">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading delicious menu...</p>
          </div>
        )}
        
        {!loading && isOrderingAllowed() && filteredItems.length > 0 && (
          filteredItems.map(item => {
            const quantity = getItemQuantity(item._id);
            const imageUrl = getImageUrl(item.image);
            const hasImage = imageUrl && !imageErrors[item._id];
            
            return (
              <div key={item._id} className="menu-item">
                <div className="item-image-wrapper">
                  {hasImage ? (
                    <img src={imageUrl} alt={item.name} className="item-image" onError={() => handleImageError(item._id)} loading="lazy" />
                  ) : (
                    <div className="image-fallback">
                      <div className="fallback-content">
                        <FaUtensils className="fallback-icon" />
                        <span className="fallback-text">{getInitials(item.name)}</span>
                      </div>
                    </div>
                  )}
                  <div className={`item-type-badge ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>
                    {item.type === 'Veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                  </div>
                </div>
                <div className="item-details">
                  <div className="item-header">
                    <h3>{item.name}</h3>
                    <span className="price">₹{Number(item.price).toFixed(2)}</span>
                  </div>
                  <div className="item-meta"><span className="category">{item.category}</span></div>
                  <div className="item-actions">
                    <button onClick={() => removeFromOrder(item._id)} className="quantity-btn" disabled={quantity === 0}>−</button>
                    <span className="quantity">{quantity}</span>
                    <button onClick={() => addToOrder(item)} className="quantity-btn">+</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {!loading && isOrderingAllowed() && filteredItems.length === 0 && (
          <div className="no-items">
            <p>No menu items found</p>
            {(searchTerm || activeTypeFilter !== 'all') && (
              <button onClick={() => { setSearchTerm(''); setActiveTypeFilter('all'); }} className="clear-search-btn">Clear Filters</button>
            )}
          </div>
        )}
      </main>

      {/* Order Summary with Customer Name and Table Number Fields */}
      {showOrderSummary && isOrderingAllowed() && (
        <div className="order-summary-overlay" onClick={() => setShowOrderSummary(false)}>
          <div className="order-summary" onClick={e => e.stopPropagation()}>
            <div className="summary-header">
              <h2><FaShoppingCart /> Your Order</h2>
              <button className="close-btn" onClick={() => setShowOrderSummary(false)}><FaTimes /></button>
            </div>
            <div className="order-summary-content">
              {orderItems.length > 0 ? (
                <>
                  <div className="order-items">
                    {orderItems.map(item => (
                      <div key={item._id} className="order-item">
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-price">₹{item.price}</span>
                          <span className="item-quantity-label">× {item.quantity}</span>
                        </div>
                        {/*<div className="item-controls">
                          <button onClick={() => removeFromOrder(item._id)} className="control-btn">−</button>
                          <span className="item-quantity">{item.quantity}</span>
                          <button onClick={() => addToOrder(item)} className="control-btn">+</button>
                        </div>*/}
                      </div>
                    ))}
                  </div>
                  <div className="order-totals">
                    <div className="total-row"><span>Subtotal</span><span>₹{getTotal().toFixed(2)}</span></div>
                    <div className="total-row"><span>GST ({restaurant?.gstPercentage || 18}%)</span><span>₹{getGstAmount().toFixed(2)}</span></div>
                    <div className="total-row grand-total"><span>Total (incl. GST)</span><span>₹{getGrandTotal().toFixed(2)}</span></div>
                  </div>
                  
                  {/* Customer Name and Table Number Input Fields */}
                  <div className="customer-info-section-order">
                    <h3>Customer Details</h3>
                    <div className="customer-input-group">
                      <div className="input-wrapper">
                        <FaUser className="input-icon" />
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
                      </div>
                      {nameError && <span className="error-text-order">Please enter your name</span>}
                    </div>
                    
                    <div className="customer-input-group">
                      <div className="input-wrapper">
                        <FaChair className="input-icon" />
                        <input
                          type="text"
                          placeholder="Table Number (1-50) *"
                          value={tableNumber}
                          onChange={handleTableNumberChange}
                          className={tableError ? 'error' : ''}
                        />
                      </div>
                      {tableError && <span className="error-text-order">Please enter valid table number (1-50)</span>}
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-order">
                  <p>Your order is empty</p>
                  <button onClick={() => setShowOrderSummary(false)}>Continue Browsing</button>
                </div>
              )}
            </div>
            {orderItems.length > 0 && (
              <div className="order-actions">
                <button onClick={handleOrder} className="place-order-btn" disabled={submitting}>
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </button>
                <button onClick={clearOrder} className="clear-order-btn">Clear Order</button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {isMobile && orderItems.length > 0 && !showOrderSummary && isOrderingAllowed() && (
        <button className="mobile-order-toggle" onClick={() => setShowOrderSummary(true)}>
          <FaShoppingCart /> View Order ({orderItems.reduce((sum, item) => sum + item.quantity, 0)} items)
        </button>
      )}
    </div>
  );
};

export default Publicmenu;