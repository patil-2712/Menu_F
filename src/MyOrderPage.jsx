// MyOrderPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { 
  FaPlus, 
  FaSearch, 
  FaTimes, 
  FaStar,
  FaArrowLeft,
  FaWhatsapp,
  FaPercent,
  FaIdCard,
  FaUtensils,
  FaCheckCircle,
  FaDownload,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaSignOutAlt
} from 'react-icons/fa';
import './MyOrderPage.css';

const MyOrderPage = () => {
  const { restaurantSlug, orderId } = useParams();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 MyOrderPage using backend:', API_URL);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [newItems, setNewItems] = useState([]);
  const [addingItems, setAddingItems] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  const getImageUrl = (imageName) => {
    if (!imageName) return '/placeholder.jpg';
    if (imageName.startsWith('http')) return imageName;
    if (imageName.startsWith('/uploads/')) return imageName;
    return `/uploads/${imageName}`;
  };

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const [feedbackForm, setFeedbackForm] = useState({
    serviceRating: 0,
    foodRating: 0,
    cleanlinessRating: 0,
    overallRating: 0,
    comments: '',
    orderId: ''
  });

  const fetchOrderFromBackend = async () => {
    try {
      console.log(`🔍 Fetching order with ID: ${orderId} for ${restaurantSlug}`);
      const orderResponse = await axios.get(`${API_URL}/api/order/${orderId}`);
      
      if (orderResponse.data) {
        console.log('Order fetched by _id:', orderResponse.data);
        return orderResponse.data;
      }
    } catch (error) {
      console.error('Error fetching order by _id:', error);
      try {
        console.log('Trying to fetch by bill number as fallback...');
        const restaurantResponse = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
        const restaurantCode = restaurantResponse.data?.restaurantCode;
        
        if (restaurantCode) {
          const fallbackResponse = await axios.get(
            `${API_URL}/api/order/${restaurantCode}/${orderId}`
          );
          
          if (fallbackResponse.data) {
            console.log('Order fetched by bill number:', fallbackResponse.data);
            return fallbackResponse.data;
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
      }
      return null;
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        
        const savedOrder = localStorage.getItem(`currentOrder_${restaurantSlug}`);
        let foundOrder = null;
        
        if (savedOrder) {
          try {
            const parsedOrder = JSON.parse(savedOrder);
            if (parsedOrder._id === orderId || parsedOrder.billNumber == orderId) {
              foundOrder = parsedOrder;
              console.log('Order found in localStorage:', foundOrder);
            }
          } catch (e) {
            console.error('Error parsing saved order:', e);
          }
        }
        
        if (!foundOrder && orderId) {
          foundOrder = await fetchOrderFromBackend();
        }
        
        if (!foundOrder) {
          setError('Order not found. Please check your order details.');
          setLoading(false);
          return;
        }
        
        setOrder(foundOrder);
        await fetchRestaurantDetails();
        await fetchMenuItems();
        setLoading(false);
        
      } catch (error) {
        console.error('Error initializing page:', error);
        setError('Failed to load order details. Please try again.');
        setLoading(false);
      }
    };

    if (restaurantSlug && orderId) {
      initializePage();
    }
  }, [restaurantSlug, orderId]);

  const fetchRestaurantDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
      setRestaurant(response.data);
      console.log('Restaurant details fetched:', response.data);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/menu/restaurant/${restaurantSlug}`);
      const items = response.data || [];
      setMenuItems(items);
      setFilteredItems(items);
      
      const uniqueCategories = [...new Set(items
        .map(item => item.category)
        .filter(category => category && category.trim() !== '')
        .map(category => category.trim())
      )];
      
      setCategories(uniqueCategories);
      
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  useEffect(() => {
    let result = menuItems;
    
    if (activeCategory !== 'all') {
      result = result.filter(item => 
        item.category && 
        item.category.trim().toLowerCase() === activeCategory.toLowerCase()
      );
    }
    
    if (searchTerm) {
      result = result.filter(item => 
        item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredItems(result);
  }, [activeCategory, searchTerm, menuItems]);

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      amount = 0;
    }
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getDisplayTotals = () => {
    if (!order) return { subtotal: 0, gst: 0, total: 0 };
    
    const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gst = order.gstAmount || (subtotal * (order.gstPercentage || (restaurant?.gstPercentage || 18)) / 100);
    const total = order.total || (subtotal + gst);
    
    return { subtotal, gst, total };
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
    };

    if (num === 0) return 'Zero';
    
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    
    let words = '';
    
    if (rupees > 0) {
      const crores = Math.floor(rupees / 10000000);
      const lakhs = Math.floor((rupees % 10000000) / 100000);
      const thousands = Math.floor((rupees % 100000) / 1000);
      const hundreds = rupees % 1000;
      
      if (crores > 0) words += convertLessThanThousand(crores) + ' Crore ';
      if (lakhs > 0) words += convertLessThanThousand(lakhs) + ' Lakh ';
      if (thousands > 0) words += convertLessThanThousand(thousands) + ' Thousand ';
      if (hundreds > 0) words += convertLessThanThousand(hundreds);
    }
    
    words += ' Rupees';
    
    if (paise > 0) {
      words += ' and ' + convertLessThanThousand(paise) + ' Paise';
    }
    
    words += ' Only';
    
    return words.trim().replace(/\s+/g, ' ');
  };

  const addMenuItemToOrder = (menuItem) => {
    setNewItems(prev => {
      const existingItem = prev.find(item => item.itemId === menuItem._id);
      
      if (existingItem) {
        return prev.map(item => 
          item.itemId === menuItem._id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      } else {
        return [...prev, { 
          itemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          category: menuItem.category,
          type: menuItem.type,
          gstPercentage: order?.gstPercentage || restaurant?.gstPercentage || 18,
          quantity: 1,
          total: menuItem.price,
          itemStatus: 'pending'
        }];
      }
    });
  };

  const removeMenuItemFromOrder = (menuItemId) => {
    setNewItems(prev => {
      const updatedItems = prev
        .map(item => {
          if (item.itemId === menuItemId && item.quantity > 1) {
            return { 
              ...item, 
              quantity: item.quantity - 1,
              total: (item.quantity - 1) * item.price
            };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
      
      return updatedItems;
    });
  };

const handleSaveNewItems = async () => {
  if (newItems.length === 0) {
    setShowAddItemsModal(false);
    return;
  }

  setAddingItems(true);
  
  try {
    console.log('🔄 Adding new items to existing order...');
    
    // Get restaurantCode from localStorage or restaurant object
    const restaurantCode = restaurant?.restaurantCode || localStorage.getItem('restaurantCode');
    const billNumber = order.billNumber;
    
    if (!restaurantCode) {
      throw new Error('Restaurant code not found');
    }
    
    // Prepare items to add
    const itemsToAdd = newItems.map(newItem => ({
      name: newItem.name,
      price: newItem.price,
      quantity: newItem.quantity,
      category: newItem.category,
      type: newItem.type,
      gstPercentage: newItem.gstPercentage || gstPercentage,
      itemId: newItem.itemId
    }));
    
    // Add items one by one using the add-item endpoint
    for (const item of itemsToAdd) {
      console.log(`Adding item: ${item.name} x${item.quantity}`);
      
      const response = await axios.post(
        `${API_URL}/api/order/${restaurantCode}/${billNumber}/items`,
        item,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      
      if (!response.data.success) {
        throw new Error(`Failed to add item: ${item.name}`);
      }
    }
    
    // IMPORTANT: Fetch the updated order from backend
    // First try by _id, then by bill number
    let updatedOrderData = null;
    
    try {
      // Try fetching by order ID
      const orderResponse = await axios.get(`${API_URL}/api/order/${order._id}`);
      if (orderResponse.data) {
        updatedOrderData = orderResponse.data;
      }
    } catch (err) {
      console.log('Fetch by _id failed, trying by bill number...');
      // Try fetching by restaurant code and bill number
      const orderResponse = await axios.get(
        `${API_URL}/api/order/${restaurantCode}/${billNumber}`
      );
      if (orderResponse.data) {
        updatedOrderData = orderResponse.data;
      }
    }
    
    if (updatedOrderData) {
      console.log('✅ Updated order fetched:', updatedOrderData);
      setOrder(updatedOrderData);
      // Update localStorage
      localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(updatedOrderData));
    } else {
      // If fetch fails, refresh the page data
      await fetchOrderFromBackend();
      await fetchRestaurantDetails();
    }
    
    setShowAddItemsModal(false);
    setNewItems([]);
    setSearchTerm('');
    setActiveCategory('all');
    
    alert('✅ New items added to your order successfully!');
    
  } catch (err) {
    console.error('❌ Error updating order:', err);
    alert(`Failed to add items: ${err.response?.data?.error || err.message}`);
  } finally {
    setAddingItems(false);
  }
};
  const StarRating = ({ rating, onRatingChange, category }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? "star filled" : "star"}
            onClick={() => onRatingChange(category, star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleStarClick = (category, rating) => {
    setFeedbackForm(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    
    try {
      const overallRating = (
        feedbackForm.serviceRating + 
        feedbackForm.foodRating + 
        feedbackForm.cleanlinessRating
      ) / 3;

      const finalFeedback = {
        orderId: order._id,
        restaurantSlug: restaurantSlug,
        billNumber: order.billNumber,
        serviceRating: feedbackForm.serviceRating,
        foodRating: feedbackForm.foodRating,
        cleanlinessRating: feedbackForm.cleanlinessRating,
        overallRating: parseFloat(overallRating.toFixed(1)),
        comments: feedbackForm.comments,
        customerEmail: '',
        customerPhone: ''
      };

      const response = await axios.post(`${API_URL}/api/feedback/submit`, finalFeedback);
      
      if (response.status === 201) {
        setFeedbackSubmitted(true);
        setShowFeedbackForm(false);
        alert('✅ Feedback submitted successfully!');
      }
    } catch (err) {
      console.error('❌ Error submitting feedback:', err);
      alert(`Failed to submit feedback: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!order) return;

    const doc = new jsPDF();
    const { subtotal, gst, total } = getDisplayTotals();
    const gstPercentage = order.gstPercentage || restaurant?.gstPercentage || 18;
    
    doc.deletePage(1);
    doc.addPage();
    doc.setFont('courier', 'normal');
    
    let y = 25;
    
    doc.setFontSize(24);
    doc.setFont('courier', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(restaurant?.restaurantName?.toUpperCase() || 'RESTAURANT NAME', 105, y, { align: 'center' });
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    const address = [restaurant?.nearestPlace, restaurant?.city, restaurant?.state, restaurant?.country]
      .filter(Boolean).join(', ').toUpperCase();
    doc.text(address || 'ADDRESS NOT AVAILABLE', 105, y, { align: 'center' });
    y += 5;
    
    const contactInfo = restaurant?.mobile ? [restaurant.mobile] : [];
    doc.text(contactInfo.join(' | ') || '', 105, y, { align: 'center' });
    y += 5;
    
    if (restaurant?.email) {
      doc.text(restaurant.email.toLowerCase(), 105, y, { align: 'center' });
      y += 5;
    }
    
    y += 2;
    doc.setDrawColor(0, 0, 0);
    doc.line(14, y, 196, y);
    y += 8;
    
    doc.setFontSize(14);
    doc.setFont('courier', 'bold');
    doc.text(`BILL NO: ${order.billNumber}`, 105, y, { align: 'center' });
    y += 8;
    
    doc.setFontSize(11);
    doc.setFont('courier', 'normal');
    
    if (restaurant?.gstNumber) {
      doc.text(`GSTIN: ${restaurant.gstNumber}`, 20, y);
      y += 6;
    }
    
    if (gstPercentage) {
      doc.text(`GST Rate: ${gstPercentage}%`, 20, y);
      y += 6;
    }
    
    if (restaurant?.foodLicense) {
      doc.text(`FSSAI License: ${restaurant.foodLicense}`, 20, y);
      y += 6;
    }
    
    doc.text(`Location: ${address || 'N/A'}`, 20, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('courier', 'bold');
    
    const col1 = 20, col2 = 80, col3 = 140;
    
    doc.text('CITY', col1, y);
    doc.text('STATE', col2, y);
    doc.text('COUNTRY', col3, y);
    y += 2;
    doc.line(14, y, 196, y);
    y += 4;
    
    doc.setFont('courier', 'normal');
    doc.text((restaurant?.city || 'N/A').toUpperCase(), col1, y);
    doc.text((restaurant?.state || 'N/A').toUpperCase(), col2, y);
    doc.text((restaurant?.country || 'N/A').toUpperCase(), col3, y);
    y += 6;
    doc.line(14, y, 196, y);
    y += 8;
    
    doc.setFontSize(11);
    doc.setFont('courier', 'normal');
    
    doc.text(`DATE: ${order.date}`, 20, y);
    doc.text(`TIME: ${order.time}`, 120, y);
    y += 6;
    
    doc.text(`CUSTOMER: ${(order.customerName || 'GUEST').toUpperCase()}`, 20, y);
    doc.text(`TABLE: ${order.tableNumber ? `TABLE ${order.tableNumber}` : 'TAKEAWAY'}`, 120, y);
    y += 8;
    
    doc.setFillColor(0, 0, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.rect(14, y - 4, 182, 7, 'F');
    doc.text('#', 16, y);
    doc.text('ITEM', 30, y);
    doc.text('QTY', 110, y);
    doc.text('PRICE', 135, y);
    doc.text('TOTAL', 170, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('courier', 'normal');
    y += 6;
    
    order.items.forEach((item, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
        doc.setFillColor(0, 0, 0);
        doc.setTextColor(255, 255, 255);
        doc.setFont('courier', 'bold');
        doc.rect(14, y - 4, 182, 7, 'F');
        doc.text('#', 16, y);
        doc.text('ITEM', 30, y);
        doc.text('QTY', 110, y);
        doc.text('PRICE', 135, y);
        doc.text('TOTAL', 170, y);
        doc.setTextColor(0, 0, 0);
        doc.setFont('courier', 'normal');
        y += 6;
      }
      
      const itemTotal = item.total || item.price * item.quantity;
      
      doc.text((index + 1).toString(), 16, y);
      doc.text(item.name.substring(0, 20).toUpperCase(), 30, y);
      doc.text(item.quantity.toString(), 115, y);
      doc.text(`${formatCurrency(item.price)}`, 135, y);
      doc.text(`${formatCurrency(itemTotal)}`, 180, y, { align: 'right' });
      
      y += 6;
    });
    
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;
    
    doc.setFont('courier', 'normal');
    doc.text('Subtotal:', 120, y);
    doc.text(`${formatCurrency(subtotal)}`, 180, y, { align: 'right' });
    y += 6;
    
    doc.text(`GST @ ${gstPercentage}%:`, 120, y);
    doc.text(`${formatCurrency(gst)}`, 180, y, { align: 'right' });
    y += 6;
    
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', 120, y);
    doc.text(`${formatCurrency(total)}`, 180, y, { align: 'right' });
    y += 8;
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    const amountInWords = numberToWords(total).toUpperCase();
    doc.text(`AMOUNT IN WORDS: ${amountInWords}`, 14, y);
    
    doc.save(`Invoice_${order.billNumber}_${restaurant?.restaurantName || 'Restaurant'}.pdf`);
  };

  const getItemQuantity = (menuItemId) => {
    const itemInOrder = newItems.find(item => item.itemId === menuItemId);
    return itemInOrder ? itemInOrder.quantity : 0;
  };

  const getNewItemsTotal = () => {
    return newItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleGoBackToMenu = () => {
    localStorage.removeItem(`currentOrder_${restaurantSlug}`);
    navigate(`/${restaurantSlug}/menu`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getCategoryDisplayName = (category) => {
    if (!category) return 'Uncategorized';
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatGSTNumber = (gst) => {
    if (!gst) return 'N/A';
    return gst;
  };

  const getFullAddress = () => {
    if (!restaurant) return '';
    const parts = [
      restaurant.nearestPlace,
      restaurant.city,
      restaurant.state,
      restaurant.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const gstPercentage = order?.gstPercentage || restaurant?.gstPercentage || 18;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your bill...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">📄</div>
        <h2>Bill Not Found</h2>
        <p>{error}</p>
        <button className="action-btn" onClick={handleGoBackToMenu}>
          <FaArrowLeft /> Back to Menu
        </button>
      </div>
    );
  }

  if (!order || !order.items || order.items.length === 0) {
    return (
      <div className="error-container">
        <div className="error-icon">📄</div>
        <h2>No Order Found</h2>
        <p>You haven't placed any order yet.</p>
        <button className="action-btn" onClick={handleGoBackToMenu}>
          <FaArrowLeft /> Back to Menu
        </button>
      </div>
    );
  }

  const { subtotal, gst, total } = getDisplayTotals();
  const amountInWords = numberToWords(total);

  return (
    <div className="bill-container">
      

      {/* Main Bill Card */}
      <div className="bill-card">
        {/* Restaurant Header */}
        <div className="restaurant-header">
          <h1 className="restaurant-name">
            {restaurant?.restaurantName?.toUpperCase() || 'RESTAURANT NAME'}
          </h1>
          <div className="restaurant-address">
            <FaMapMarkerAlt className="icon" /> {getFullAddress()}
          </div>
          <div className="restaurant-contact">
            {restaurant?.mobile && (
              <span className="contact-item">
                <FaPhone className="icon" /> {restaurant.mobile}
              </span>
            )}
            {restaurant?.email && (
              <span className="contact-item">
                <FaEnvelope className="icon" /> {restaurant.email}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="divider"></div>

        {/* Bill Info */}
        <div className="bill-info">
          <span className="bill-number">Bill No: {order.billNumber}</span>
          <span>Date: {order.date}</span>
          <span>Time: {order.time}</span>
        </div>

        {/* Customer Info */}
        <div className="customer-info">
          <span>Customer: {order.customerName || 'Guest'}</span>
          <span>Table: {order.tableNumber || 'Takeaway'}</span>
        </div>

        {/* GST Info */}
        <div className="gst-info">
          {restaurant?.gstNumber && <span>GSTIN: {formatGSTNumber(restaurant.gstNumber)}</span>}
          <span>GST Rate: {gstPercentage}%</span>
          {restaurant?.foodLicense && <span>FSSAI: {restaurant.foodLicense}</span>}
        </div>

        {/* Divider */}
        <div className="divider"></div>

        {/* Items Container - Div based layout for better mobile */}
        {/* Items Container */}
<div className="items-container">
  {/* Desktop Header - hidden on mobile */}
  <div className="items-header">
    <div className="item-details">Item</div>
    <div className="item-qty">Qty</div>
    <div className="item-price">Price</div>
    <div className="item-total">Total</div>
  </div>
  
  {order.items.map((item, index) => {
    const itemTotal = item.total || item.price * item.quantity;
    return (
      <div key={index} className="item-row">
        {/* Item Name and Details */}
        <div className="item-details">
          <div className="item-name">{item.name}</div>
          <div className="item-meta">
           
            <span className="item-category">{item.category}</span>
          </div>
        </div>
        
        {/* Desktop View - Qty, Price, Total */}
        <div className="item-qty">{item.quantity}</div>
        <div className="item-price">₹{formatCurrency(item.price)}</div>
        <div className="item-total">₹{formatCurrency(itemTotal)}</div>
        
        {/* Mobile View - Qty, Price, Total as cards */}
        <div className="item-details-row">
          <div className="item-detail-item">
            <span className="item-detail-label">Qty</span>
            <span className="item-detail-value item-qty-value">{item.quantity}</span>
          </div>
          <div className="item-detail-item">
            <span className="item-detail-label">Price</span>
            <span className="item-detail-value item-price-value">₹{formatCurrency(item.price)}</span>
          </div>
          <div className="item-detail-item">
            <span className="item-detail-label">Total</span>
            <span className="item-detail-value item-total-value">₹{formatCurrency(itemTotal)}</span>
          </div>
        </div>
      </div>
    );
  })}
</div>

        {/* Divider */}
        <div className="divider"></div>

        {/* Totals */}
        <div className="totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>₹{formatCurrency(subtotal)}</span>
          </div>
          <div className="total-row">
            <span>GST ({gstPercentage}%):</span>
            <span>₹{formatCurrency(gst)}</span>
          </div>
          <div className="total-row grand-total">
            <span><strong>Grand Total:</strong></span>
            <span><strong>₹{formatCurrency(total)}</strong></span>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="amount-words">
          <span>Amount in words:</span>
          <span>{amountInWords}</span>
        </div>

        {/* Thank You Message */}
        <div className="thank-you">
          <p>🙏 Thank you for dining with us!</p>
          <p>😊 Please visit again!</p>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="action-btn add-btn" onClick={() => setShowAddItemsModal(true)}>
            <FaPlus /> Add Items
          </button>
          <button className="action-btn print-btn" onClick={handleDownloadPDF}>
            <FaDownload /> Download PDF
          </button>
          <button className="action-btn share-btn" onClick={() => {
            const message = `*${restaurant?.restaurantName || 'Restaurant'}*\n` +
              `Bill No: ${order.billNumber}\n` +
              `Date: ${order.date} | Time: ${order.time}\n` +
              `Customer: ${order.customerName || 'Guest'}\n` +
              `Table: ${order.tableNumber || 'Takeaway'}\n` +
              `--------------------------------\n` +
              `${order.items.map(item => `${item.name} x${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`).join('\n')}\n` +
              `--------------------------------\n` +
              `Subtotal: ₹${formatCurrency(subtotal)}\n` +
              `GST (${gstPercentage}%): ₹${formatCurrency(gst)}\n` +
              `*Grand Total: ₹${formatCurrency(total)}*\n\n` +
              `📍 ${getFullAddress()}\n` +
              (restaurant?.mobile ? `📞 ${restaurant.mobile}\n` : '') +
              (restaurant?.gstNumber ? `GST: ${restaurant.gstNumber}\n` : '') +
              `\nThank you for your order!`;
            const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
          }}>
            <FaWhatsapp /> Share
          </button>
        </div>
      </div>

      {/* Feedback Section */}
      {!feedbackSubmitted && (
        <div className="feedback-section">
          {!showFeedbackForm ? (
            <button className="feedback-btn" onClick={() => setShowFeedbackForm(true)}>
              <FaStar /> Rate Your Experience
            </button>
          ) : (
            <div className="feedback-form">
              <h3>Rate Your Experience</h3>
              <form onSubmit={handleFeedbackSubmit}>
                <div className="rating-group">
                  <label>Service Quality</label>
                  <StarRating 
                    rating={feedbackForm.serviceRating}
                    onRatingChange={handleStarClick}
                    category="serviceRating"
                  />
                </div>
                <div className="rating-group">
                  <label>Food Quality</label>
                  <StarRating 
                    rating={feedbackForm.foodRating}
                    onRatingChange={handleStarClick}
                    category="foodRating"
                  />
                </div>
                <div className="rating-group">
                  <label>Cleanliness</label>
                  <StarRating 
                    rating={feedbackForm.cleanlinessRating}
                    onRatingChange={handleStarClick}
                    category="cleanlinessRating"
                  />
                </div>
                <textarea
                  value={feedbackForm.comments}
                  onChange={(e) => setFeedbackForm(prev => ({...prev, comments: e.target.value}))}
                  placeholder="Share your thoughts..."
                  rows={3}
                />
                <div className="feedback-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowFeedbackForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={submittingFeedback}>
                    {submittingFeedback ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {feedbackSubmitted && (
        <div className="feedback-success">
          <FaCheckCircle className="success-icon" />
          <h3>Thank You for Your Feedback!</h3>
        </div>
      )}

      {/* Add Items Modal */}
      {showAddItemsModal && (
        <div className="modal-overlay" onClick={() => {
          if (!addingItems) {
            setShowAddItemsModal(false);
            setNewItems([]);
            setSearchTerm('');
            setActiveCategory('all');
          }
        }}>
          <div className="add-items-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Items to Bill #{order.billNumber}</h3>
              <button className="close-modal-btn" onClick={() => {
                setShowAddItemsModal(false);
                setNewItems([]);
                setSearchTerm('');
                setActiveCategory('all');
              }} disabled={addingItems}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-content">
              <div className="modal-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="modal-categories">
                <button
                  className={`category-chip ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  All ({menuItems.length})
                </button>
                {categories.map((category, index) => (
                  <button
                    key={index}
                    className={`category-chip ${activeCategory === category.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category.toLowerCase())}
                  >
                    {getCategoryDisplayName(category)} 
                    ({menuItems.filter(item => item.category?.trim().toLowerCase() === category.toLowerCase()).length})
                  </button>
                ))}
              </div>

              <div className="modal-items-grid">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => {
                    const quantity = getItemQuantity(item._id);
                    return (
                      <div key={item._id} className="menu-item-card">
                        <div className="item-image-container">
                          {!imageErrors[item._id] ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="item-image"
                              onError={() => handleImageError(item._id)}
                            />
                          ) : (
                            <div className="image-fallback">{item.name.charAt(0)}</div>
                          )}
                          <span className={`item-type ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>
                            {item.type === 'Veg' ? '🟢' : '🔴'}
                          </span>
                        </div>
                        <div className="item-info">
                          <h4>{item.name}</h4>
                          <div className="item-meta-row">
                            <span className="item-category">{item.category}</span>
                            <span className="item-price">₹{item.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="item-actions">
                          <button onClick={() => removeMenuItemFromOrder(item._id)} className="qty-btn" disabled={quantity === 0 || addingItems}>−</button>
                          <span className="qty-display">{quantity}</span>
                          <button onClick={() => addMenuItemToOrder(item)} className="qty-btn" disabled={addingItems}>+</button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-items">No items found</div>
                )}
              </div>

              {newItems.length > 0 && (
                <div className="new-items-summary">
                  <h4>Items to Add:</h4>
                  {newItems.map((item, index) => (
                    <div key={index} className="new-item-row">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  <div className="new-total">
                    <span>Additional Total:</span>
                    <span>₹{formatCurrency(getNewItemsTotal())}</span>
                  </div>
                  <div className="gst-note">
                    <FaPercent /> GST @ {gstPercentage}% will be applied
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button onClick={() => {
                  setShowAddItemsModal(false);
                  setNewItems([]);
                  setSearchTerm('');
                  setActiveCategory('all');
                }} className="modal-cancel" disabled={addingItems}>
                  Cancel
                </button>
                <button onClick={handleSaveNewItems} className="modal-confirm" disabled={newItems.length === 0 || addingItems}>
                  {addingItems ? 'Adding...' : `Add ${newItems.length} Item${newItems.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrderPage;