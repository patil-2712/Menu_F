import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { 
  FaPlus, 
  FaSearch, 
  FaTimes, 
  FaPrint, 
  FaMoneyBillWave, 
  FaStar,
  FaArrowLeft,
  FaWhatsapp,
  FaPercent,
  FaIdCard,
  FaUtensils,
  FaCheckCircle,
  FaBuilding,
  FaDownload,
  FaShare,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import './MyOrderPage.css';

const MyOrderPage = () => {
  // CHANGE: Use orderId instead of billNumber
  const { restaurantSlug, orderId } = useParams();
  const navigate = useNavigate();
  
  // Get backend URL from environment variable or use Render URL
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

  // Helper function to get full image URL
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

  // Fetch order from backend using orderId (_id)
  const fetchOrderFromBackend = async () => {
    try {
      console.log(`🔍 Fetching order with ID: ${orderId} for ${restaurantSlug}`);
      
      // CHANGED: Use full URL with API_URL
      const orderResponse = await axios.get(`${API_URL}/api/order/${orderId}`);
      
      if (orderResponse.data) {
        console.log('Order fetched by _id:', orderResponse.data);
        return orderResponse.data;
      }
    } catch (error) {
      console.error('Error fetching order by _id:', error);
      
      // If fetching by _id fails, try fetching by billNumber as fallback
      try {
        console.log('Trying to fetch by bill number as fallback...');
        // CHANGED: Use full URL with API_URL
        const restaurantResponse = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
        const restaurantCode = restaurantResponse.data?.restaurantCode;
        
        if (restaurantCode) {
          // CHANGED: Use full URL with API_URL
          const fallbackResponse = await axios.get(
            `${API_URL}/api/order/${restaurantCode}/${orderId}` // orderId might be a billNumber in this case
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

  // Initialize page
  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        
        // Check localStorage first
        const savedOrder = localStorage.getItem(`currentOrder_${restaurantSlug}`);
        let foundOrder = null;
        
        if (savedOrder) {
          try {
            const parsedOrder = JSON.parse(savedOrder);
            // Check if the saved order matches either _id or billNumber
            if (parsedOrder._id === orderId || parsedOrder.billNumber == orderId) {
              foundOrder = parsedOrder;
              console.log('Order found in localStorage:', foundOrder);
            }
          } catch (e) {
            console.error('Error parsing saved order:', e);
          }
        }
        
        // If not in localStorage, fetch from backend
        if (!foundOrder && orderId) {
          foundOrder = await fetchOrderFromBackend();
        }
        
        if (!foundOrder) {
          setError('Order not found. Please check your order details.');
          setLoading(false);
          return;
        }
        
        setOrder(foundOrder);
        
        // Fetch restaurant details
        await fetchRestaurantDetails();
        
        // Fetch menu items for add items modal
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

  // Fetch restaurant details
  const fetchRestaurantDetails = async () => {
    try {
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
      setRestaurant(response.data);
      console.log('Restaurant details fetched:', response.data);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    }
  };

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      // CHANGED: Use full URL with API_URL
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

  // Filter menu items
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

  // Format currency
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      amount = 0;
    }
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calculate totals
  const getDisplayTotals = () => {
    if (!order) return { subtotal: 0, gst: 0, total: 0 };
    
    const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gst = order.gstAmount || (subtotal * (order.gstPercentage || (restaurant?.gstPercentage || 18)) / 100);
    const total = order.total || (subtotal + gst);
    
    return { subtotal, gst, total };
  };

  // Convert number to words (Indian Rupees)
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

  // Add menu item to new items
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

  // Remove menu item from new items
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

  // Save new items to existing order
  const handleSaveNewItems = async () => {
    if (newItems.length === 0) {
      setShowAddItemsModal(false);
      return;
    }

    setAddingItems(true);
    
    try {
      console.log('🔄 Adding new items to existing order...');
      
      const existingItemsMap = {};
      order.items.forEach(item => {
        existingItemsMap[item.itemId] = item;
      });
      
      const combinedItems = [];
      
      order.items.forEach(item => {
        combinedItems.push({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          type: item.type,
          gstPercentage: item.gstPercentage,
          total: item.total || item.price * item.quantity,
          itemStatus: item.itemStatus
        });
      });
      
      newItems.forEach(newItem => {
        if (existingItemsMap[newItem.itemId]) {
          const existingItemIndex = combinedItems.findIndex(
            item => item.itemId === newItem.itemId
          );
          if (existingItemIndex >= 0) {
            combinedItems[existingItemIndex].quantity += newItem.quantity;
            combinedItems[existingItemIndex].total = 
              combinedItems[existingItemIndex].price * 
              combinedItems[existingItemIndex].quantity;
          }
        } else {
          combinedItems.push({
            itemId: newItem.itemId,
            name: newItem.name,
            price: newItem.price,
            quantity: newItem.quantity,
            category: newItem.category,
            type: newItem.type,
            gstPercentage: newItem.gstPercentage || order.gstPercentage || restaurant?.gstPercentage || 18,
            total: newItem.total,
            itemStatus: newItem.itemStatus || 'pending'
          });
        }
      });
      
      const newSubtotal = combinedItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      const newGstAmount = newSubtotal * (order.gstPercentage || restaurant?.gstPercentage || 18) / 100;
      const newTotal = newSubtotal + newGstAmount;

      const updatePayload = {
        items: combinedItems,
        subtotal: newSubtotal,
        gstAmount: newGstAmount,
        total: newTotal
      };

      // CHANGED: Use full URL with API_URL
      const response = await axios.put(
        `${API_URL}/api/order/${order._id}`,
        updatePayload
      );

      const updatedOrder = response.data.order || response.data;
      
      setOrder(updatedOrder);
      
      localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(updatedOrder));
      
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

  // Star Rating Component
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

  // Handle star click
  const handleStarClick = (category, rating) => {
    setFeedbackForm(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  // Handle feedback submit
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

      // CHANGED: Use full URL with API_URL
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

  // Download PDF with professional bill format
  const handleDownloadPDF = () => {
    if (!order) return;

    const doc = new jsPDF();
    const { subtotal, gst, total } = getDisplayTotals();
    const gstPercentage = order.gstPercentage || restaurant?.gstPercentage || 18;
    
    // Clear any existing content and start fresh
    doc.deletePage(1);
    doc.addPage();
    
    // Set up document with monospace font for bill style
    doc.setFont('courier', 'normal');
    
    let y = 25; // Starting Y position
    
    // 1. Restaurant Header - ALL CAPS as in screenshot
    doc.setFontSize(24);
    doc.setFont('courier', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(restaurant?.restaurantName?.toUpperCase() || 'RESTAURANT NAME', 105, y, { align: 'center' });
    y += 8;
    
    // 2. Complete Address - ALL CAPS
    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    const address = [
      restaurant?.nearestPlace,
      restaurant?.city,
      restaurant?.state,
      restaurant?.country
    ].filter(Boolean).join(', ').toUpperCase();
    doc.text(address || 'ADDRESS NOT AVAILABLE', 105, y, { align: 'center' });
    y += 5;
    
    // 3. Contact Information - Phone and Email
    const contactInfo = [];
    if (restaurant?.mobile) contactInfo.push(restaurant.mobile);
    doc.text(contactInfo.join(' | ') || '', 105, y, { align: 'center' });
    y += 5;
    
    if (restaurant?.email) {
      doc.text(restaurant.email.toLowerCase(), 105, y, { align: 'center' });
      y += 5;
    }
    
    // 4. Separator Line
    y += 2;
    doc.setDrawColor(0, 0, 0);
    doc.line(14, y, 196, y);
    y += 8;
    
    // 5. Bill Number
    doc.setFontSize(14);
    doc.setFont('courier', 'bold');
    doc.text(`BILL NO: ${order.billNumber}`, 105, y, { align: 'center' });
    y += 8;
    
    // 6. Business Information Section
    doc.setFontSize(11);
    doc.setFont('courier', 'normal');
    
    // GST Number
    if (restaurant?.gstNumber) {
      doc.text(`GSTIN: ${restaurant.gstNumber}`, 20, y);
      y += 6;
    }
    
    // GST Rate
    if (gstPercentage) {
      doc.text(`GST Rate: ${gstPercentage}%`, 20, y);
      y += 6;
    }
    
    // FSSAI License
    if (restaurant?.foodLicense) {
      doc.text(`FSSAI License: ${restaurant.foodLicense}`, 20, y);
      y += 6;
    }
    
    // Mobile
    if (restaurant?.mobile) {
      doc.text(`Mobile: ${restaurant.mobile}`, 20, y);
      y += 6;
    }
    
    // Email
    if (restaurant?.email) {
      doc.text(`Email: ${restaurant.email}`, 20, y);
      y += 6;
    }
    
    // Location
    doc.text(`Location: ${address || 'N/A'}`, 20, y);
    y += 8;
    
    // 7. Location Details Grid - City, State, Country table
    doc.setFontSize(10);
    doc.setFont('courier', 'bold');
    
    // Draw table header
    const col1 = 20;
    const col2 = 80;
    const col3 = 140;
    
    doc.text('CITY', col1, y);
    doc.text('STATE', col2, y);
    doc.text('COUNTRY', col3, y);
    y += 2;
    doc.line(14, y, 196, y);
    y += 4;
    
    // Draw table values
    doc.setFont('courier', 'normal');
    doc.text((restaurant?.city || 'N/A').toUpperCase(), col1, y);
    doc.text((restaurant?.state || 'N/A').toUpperCase(), col2, y);
    doc.text((restaurant?.country || 'N/A').toUpperCase(), col3, y);
    y += 6;
    doc.line(14, y, 196, y);
    y += 8;
    
    // 8. Bill Meta Information - Date, Time, Customer, Table
    doc.setFontSize(11);
    doc.setFont('courier', 'normal');
    
    doc.text(`DATE: ${order.date}`, 20, y);
    doc.text(`TIME: ${order.time}`, 120, y);
    y += 6;
    
    doc.text(`CUSTOMER NAME: ${(order.customerName || 'GUEST').toUpperCase()}`, 20, y);
    doc.text(`TABLE: ${order.tableNumber ? `TABLE ${order.tableNumber}` : 'TAKEAWAY'}`, 120, y);
    y += 8;
    
    // 9. Items Table Header
    doc.setFillColor(0, 0, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    
    // Draw header background
    doc.setFillColor(0, 0, 0);
    doc.rect(14, y - 4, 182, 7, 'F');
    
    // Header text
    doc.text('#', 16, y);
    doc.text('ITEM DESCRIPTION', 30, y);
    doc.text('QTY', 110, y);
    doc.text('PRICE', 135, y);
    doc.text('TOTAL', 170, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('courier', 'normal');
    y += 6;
    
    // 10. Table Rows
    order.items.forEach((item, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
        
        // Repeat header on new page
        doc.setFillColor(0, 0, 0);
        doc.setTextColor(255, 255, 255);
        doc.setFont('courier', 'bold');
        doc.rect(14, y - 4, 182, 7, 'F');
        doc.text('#', 16, y);
        doc.text('ITEM DESCRIPTION', 30, y);
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
    
    // 11. Totals Section
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;
    
    // Subtotal
    doc.setFont('courier', 'normal');
    doc.text('Subtotal:', 120, y);
    doc.text(`${formatCurrency(subtotal)}`, 180, y, { align: 'right' });
    y += 6;
    
    // GST
    doc.text(`GST @ ${gstPercentage}%:`, 120, y);
    doc.text(`${formatCurrency(gst)}`, 180, y, { align: 'right' });
    y += 6;
    
    // Grand Total
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', 120, y);
    doc.text(`${formatCurrency(total)}`, 180, y, { align: 'right' });
    y += 8;
    
    // 12. Amount in words - UPPERCASE as in screenshot
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    const amountInWords = numberToWords(total).toUpperCase();
    doc.text(`AMOUNT IN WORDS: ${amountInWords}`, 14, y);
    y += 8;
    
    // Save PDF
    doc.save(`Invoice_${order.billNumber}_${restaurant?.restaurantName || 'Restaurant'}.pdf`);
  };

  // Get item quantity in new items
  const getItemQuantity = (menuItemId) => {
    const itemInOrder = newItems.find(item => item.itemId === menuItemId);
    return itemInOrder ? itemInOrder.quantity : 0;
  };

  // Calculate new items total
  const getNewItemsTotal = () => {
    return newItems.reduce((sum, item) => sum + item.total, 0);
  };

  // Handle go back to menu
  const handleGoBackToMenu = () => {
    localStorage.removeItem(`currentOrder_${restaurantSlug}`);
    navigate(`/${restaurantSlug}/menu`);
  };

  // Get category display name
  const getCategoryDisplayName = (category) => {
    if (!category) return 'Uncategorized';
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format GST number with proper spacing
  const formatGSTNumber = (gst) => {
    if (!gst) return 'N/A';
    return gst;
  };

  // Get full address
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

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your bill...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">📄</div>
        <h2>Bill Not Found</h2>
        <p>{error}</p>
        <button 
          className="action-btn"
          onClick={handleGoBackToMenu}
        >
          <FaArrowLeft /> Back to Menu
        </button>
      </div>
    );
  }

  // No order found
  if (!order || !order.items || order.items.length === 0) {
    return (
      <div className="error-container">
        <div className="error-icon">📄</div>
        <h2>No Order Found</h2>
        <p>You haven't placed any order yet.</p>
        <button 
          className="action-btn"
          onClick={handleGoBackToMenu}
        >
          <FaArrowLeft /> Back to Menu
        </button>
      </div>
    );
  }

  const { subtotal, gst, total } = getDisplayTotals();
  const newItemsTotal = getNewItemsTotal();
  const amountInWords = numberToWords(total);
  const gstPercentage = order.gstPercentage || restaurant?.gstPercentage || 18;

  return (
    <div className="modern-order-container">
      {/* Main Bill Card */}
      <div className="order-card">
        {/* Restaurant Header */}
        <div className="restaurant-header">
          <h1 className="restaurant-name">
            {restaurant?.restaurantName?.toUpperCase() || 'RESTAURANT NAME'}
          </h1>
          <div className="restaurant-address">
            <FaMapMarkerAlt className="icon" /> {getFullAddress()}
          </div>
          <div className="restaurant-contact-row">
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

        {/* Bill Title */}
        <div className="bill-header">
          <div className="bill-title-wrapper">
            <div className="bill-number-wrapper">
              <span className="bill-number-label">Bill No:</span>
              <span className="bill-number-value">{order.billNumber}</span>
            </div>
          </div>
        </div>

        {/* Complete Business Information */}
        <div className="business-info-section">
          {/* GST Information */}
          {restaurant?.gstNumber && (
            <div className="business-info-row">
              <span className="business-label">
                <FaIdCard className="icon" /> GSTIN:
              </span>
              <span className="business-value gst-number">{formatGSTNumber(restaurant.gstNumber)}</span>
            </div>
          )}
          
          {/* GST Percentage */}
          {gstPercentage > 0 && (
            <div className="business-info-row">
              <span className="business-label">
                <FaPercent className="icon" /> GST Rate:
              </span>
              <span className="business-value gst-rate">{gstPercentage}%</span>
              <span className="gst-badge">INPUT TAX CREDIT AVAILABLE</span>
            </div>
          )}
          
          {/* Food License */}
          {restaurant?.foodLicense && (
            <div className="business-info-row">
              <span className="business-label">
                <FaUtensils className="icon" /> FSSAI License:
              </span>
              <span className="business-value license-number">{restaurant.foodLicense}</span>
            </div>
          )}
          
          {/* Mobile Number */}
          {restaurant?.mobile && (
            <div className="business-info-row">
              <span className="business-label">
                <FaPhone className="icon" /> Mobile:
              </span>
              <span className="business-value">{restaurant.mobile}</span>
            </div>
          )}
          
          {/* Email */}
          {restaurant?.email && (
            <div className="business-info-row">
              <span className="business-label">
                <FaEnvelope className="icon" /> Email:
              </span>
              <span className="business-value">{restaurant.email}</span>
            </div>
          )}
          
          {/* Location Details */}
          <div className="business-info-row location-row">
            <span className="business-label">
              <FaMapMarkerAlt className="icon" /> Location:
            </span>
            <span className="business-value location-value">
              {getFullAddress()}
            </span>
          </div>
          
          {/* City, State, Country separate for clarity */}
          <div className="location-details-grid">
            {restaurant?.city && (
              <div className="location-detail-item">
                <span className="detail-label">City:</span>
                <span className="detail-value">{restaurant.city}</span>
              </div>
            )}
            {restaurant?.state && (
              <div className="location-detail-item">
                <span className="detail-label">State:</span>
                <span className="detail-value">{restaurant.state}</span>
              </div>
            )}
            {restaurant?.country && (
              <div className="location-detail-item">
                <span className="detail-label">Country:</span>
                <span className="detail-value">{restaurant.country}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bill Meta Information */}
        <div className="bill-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Invoice Date</span>
            <span className="meta-value">{order.date}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Invoice Time</span>
            <span className="meta-value">{order.time}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Customer Name</span>
            <span className="meta-value">{order.customerName || 'Guest'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Table/Order Type</span>
            <span className="meta-value">{order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}</span>
          </div>
        </div>

        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>#</th>
              <th style={{ width: '42%' }}>Item Description</th>
              <th style={{ width: '12%' }}>Qty</th>
              <th style={{ width: '18%' }}>Unit Price</th>
              <th style={{ width: '20%' }}>Total</th>
             </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
              const itemTotal = item.total || item.price * item.quantity;
              return (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td>
                    <div className="item-name">{item.name}</div>
                    <div className="item-meta">
                      <span className={`item-type-indicator ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}></span>
                      {item.category}
                    </div>
                  </td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹{formatCurrency(item.price)}</td>
                  <td className="text-right">₹{formatCurrency(itemTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="totals-section">
          <div className="total-row">
            <span className="total-label">Subtotal:</span>
            <span className="total-value">₹{formatCurrency(subtotal)}</span>
          </div>
          <div className="total-row gst-row">
            <span className="total-label">
              GST @ {gstPercentage}%:
            </span>
            <span className="total-value">₹{formatCurrency(gst)}</span>
          </div>
          <div className="total-row grand-total">
            <span className="total-label">Grand Total:</span>
            <span className="total-value">₹{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="amount-words">
          <span className="words-label">Amount in words:</span>
          <span className="words-value">{amountInWords}</span>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="action-btn add-items-btn"
            onClick={() => setShowAddItemsModal(true)}
          >
            <FaPlus /> Add Items
          </button>
          
          <button 
            className="action-btn print-btn"
            onClick={handleDownloadPDF}
          >
            <FaDownload /> Download PDF
          </button>
          
          <button 
            className="action-btn share-btn"
            onClick={() => {
              const message = `*${restaurant?.restaurantName || 'Restaurant'}*\n` +
                `Bill No: ${order.billNumber}\n` +
                `Date: ${order.date}\n` +
                `Customer: ${order.customerName || 'Guest'}\n` +
                `Table: ${order.tableNumber || 'Takeaway'}\n` +
                `Subtotal: ₹${formatCurrency(subtotal)}\n` +
                `GST @ ${gstPercentage}%: ₹${formatCurrency(gst)}\n` +
                `*Total: ₹${formatCurrency(total)}*\n\n` +
                `📍 ${getFullAddress()}\n` +
                (restaurant?.mobile ? `📞 ${restaurant.mobile}\n` : '') +
                (restaurant?.gstNumber ? `GST: ${restaurant.gstNumber}\n` : '') +
                (restaurant?.foodLicense ? `FSSAI: ${restaurant.foodLicense}\n` : '') +
                `\nThank you for your order!`;
              const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
              window.open(url, '_blank');
            }}
          >
            <FaWhatsapp /> Share
          </button>
        </div>

        {/* Feedback Section */}
        {!feedbackSubmitted && (
          <div className="feedback-section">
            {!showFeedbackForm ? (
              <button 
                className="feedback-btn"
                onClick={() => setShowFeedbackForm(true)}
              >
                📝 Rate Your Experience
              </button>
            ) : (
              <div className="feedback-form-card">
                <h3>Rate Your Experience</h3>
                
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="rating-category">
                    <label>Service Quality</label>
                    <StarRating 
                      rating={feedbackForm.serviceRating}
                      onRatingChange={handleStarClick}
                      category="serviceRating"
                    />
                  </div>
                  
                  <div className="rating-category">
                    <label>Food Quality</label>
                    <StarRating 
                      rating={feedbackForm.foodRating}
                      onRatingChange={handleStarClick}
                      category="foodRating"
                    />
                  </div>
                  
                  <div className="rating-category">
                    <label>Cleanliness</label>
                    <StarRating 
                      rating={feedbackForm.cleanlinessRating}
                      onRatingChange={handleStarClick}
                      category="cleanlinessRating"
                    />
                  </div>
                  
                  <div className="comments-section">
                    <textarea
                      value={feedbackForm.comments}
                      onChange={(e) => setFeedbackForm(prev => ({...prev, comments: e.target.value}))}
                      placeholder="Share your thoughts..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="feedback-actions">
                    <button 
                      type="button" 
                      className="feedback-cancel-btn"
                      onClick={() => setShowFeedbackForm(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="feedback-submit-btn"
                      disabled={submittingFeedback}
                    >
                      {submittingFeedback ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {feedbackSubmitted && (
          <div className="thank-you-feedback">
            <div className="thank-you-icon">🎉</div>
            <h3>Thank You for Your Feedback!</h3>
          </div>
        )}
        
        {/* Display Order ID for reference */}
        <div className="order-id-reference">
          <small>Order ID: {order._id}</small>
        </div>
      </div>

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
              <button 
                className="close-modal-btn"
                onClick={() => {
                  setShowAddItemsModal(false);
                  setNewItems([]);
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
                disabled={addingItems}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-content">
              {/* Search */}
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

              {/* Categories */}
              <div className="modal-categories">
                <button
                  className={`modal-category-btn ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  All ({menuItems.length})
                </button>
                
                {categories.map((category, index) => (
                  <button
                    key={index}
                    className={`modal-category-btn ${activeCategory === category.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category.toLowerCase())}
                  >
                    {getCategoryDisplayName(category)} 
                    ({menuItems.filter(item => 
                      item.category && 
                      item.category.trim().toLowerCase() === category.toLowerCase()
                    ).length})
                  </button>
                ))}
              </div>

              {/* Menu Items */}
              <div className="modal-items-grid">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => {
                    const quantity = getItemQuantity(item._id);
                    
                    return (
                      <div key={item._id} className="modal-item-card">
                        <div className="modal-item-image-container">
                          {!imageErrors[item._id] ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="modal-item-image"
                              onError={() => handleImageError(item._id)}
                            />
                          ) : (
                            <div className="modal-image-fallback">
                              <span>{item.name.charAt(0)}</span>
                            </div>
                          )}
                          <span className={`modal-item-type-badge ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>
                            {item.type === 'Veg' ? '🟢' : '🔴'}
                          </span>
                        </div>
                        
                        <div className="modal-item-info">
                          <h4>{item.name}</h4>
                          <div className="modal-item-meta">
                            <span className="modal-item-category">{item.category}</span>
                            <span className="modal-item-price">₹{item.price.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="modal-item-actions">
                          <button 
                            onClick={() => removeMenuItemFromOrder(item._id)}
                            className="modal-qty-btn"
                            disabled={quantity === 0 || addingItems}
                          >
                            −
                          </button>
                          <span className="modal-qty-display">{quantity}</span>
                          <button 
                            onClick={() => addMenuItemToOrder(item)}
                            className="modal-qty-btn"
                            disabled={addingItems}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-modal-items">
                    <p>No items found</p>
                  </div>
                )}
              </div>

              {/* New Items Summary */}
              {newItems.length > 0 && (
                <div className="new-items-summary">
                  <h4>Items to Add:</h4>
                  {newItems.map((item, index) => (
                    <div key={index} className="new-item">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  <div className="new-items-total">
                    <span>Additional Total:</span>
                    <span>₹{formatCurrency(newItemsTotal)}</span>
                  </div>
                  <div className="gst-note">
                    <FaPercent /> GST @ {gstPercentage}% will be applied
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="modal-actions">
                <button 
                  onClick={() => {
                    setShowAddItemsModal(false);
                    setNewItems([]);
                    setSearchTerm('');
                    setActiveCategory('all');
                  }}
                  className="modal-cancel-btn"
                  disabled={addingItems}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveNewItems}
                  className="modal-confirm-btn"
                  disabled={newItems.length === 0 || addingItems}
                >
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