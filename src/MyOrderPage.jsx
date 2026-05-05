//import React, { useEffect, useState } from 'react';
//import { useNavigate, useParams } from 'react-router-dom';
//import { jsPDF } from 'jspdf';
//import axios from 'axios';
//import {
//  FaPlus,
//  FaSearch,
//  FaTimes,
//  FaStar,
//  FaArrowLeft,
//  FaWhatsapp,
//  FaPercent,
//  FaCheckCircle,
//  FaDownload,
//  FaMapMarkerAlt,
//  FaPhone,
//  FaEnvelope,
//  FaSpinner,
//  FaGlassWhiskey,
//  FaRegStickyNote,
//  FaReceipt,
//  FaCommentDots,
//  FaUtensils
//} from 'react-icons/fa';
//import './MyOrderPage.css';
//
///* ─── Sub-components ─── */
//
//const StarRating = ({ rating, onRatingChange, category }) => (
//  <div className="star-rating">
//    {[1, 2, 3, 4, 5].map((star) => (
//      <span
//        key={star}
//        className={star <= rating ? 'star filled' : 'star'}
//        onClick={() => onRatingChange(category, star)}
//      >
//        ★
//      </span>
//    ))}
//  </div>
//);
//
///* ─── Main Component ─── */
//
//const MyOrderPage = () => {
//  const { restaurantSlug, orderId } = useParams();
//  const navigate = useNavigate();
//
//  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
//
//  /* ── State ── */
//  const [order, setOrder] = useState(null);
//  const [loading, setLoading] = useState(true);
//  const [menuItems, setMenuItems] = useState([]);
//  const [filteredItems, setFilteredItems] = useState([]);
//  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
//  const [activeCategory, setActiveCategory] = useState('all');
//  const [searchTerm, setSearchTerm] = useState('');
//  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
//  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
//  const [submittingFeedback, setSubmittingFeedback] = useState(false);
//  const [newItems, setNewItems] = useState([]);
//  const [addingItems, setAddingItems] = useState(false);
//  const [restaurant, setRestaurant] = useState(null);
//  const [error, setError] = useState(null);
//  const [categories, setCategories] = useState([]);
//  const [imageErrors, setImageErrors] = useState({});
//  const [showRequestMenu, setShowRequestMenu] = useState(false);
//  const [submittingRequest, setSubmittingRequest] = useState(false);
//  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
//  const [popupMessage, setPopupMessage] = useState('');
//  const [popupIcon, setPopupIcon] = useState('');
//
//  const [feedbackForm, setFeedbackForm] = useState({
//    serviceRating: 0,
//    foodRating: 0,
//    cleanlinessRating: 0,
//    overallRating: 0,
//    comments: '',
//  });
//
//  /* ── Helpers ── */
//
//  const getImageUrl = (imageName) => {
//    if (!imageName) return null;
//    if (imageName.startsWith('http')) return imageName;
//    if (imageName.startsWith('/uploads/')) return `${API_URL}${imageName}`;
//    return `${API_URL}/uploads/menu/${imageName}`;
//  };
//
//  const handleImageError = (itemId) => setImageErrors((prev) => ({ ...prev, [itemId]: true }));
//
//  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '?');
//
//  const formatCurrency = (amount) => {
//    if (typeof amount !== 'number' || isNaN(amount)) amount = 0;
//    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
//  };
//
//  const getDisplayTotals = () => {
//    if (!order) return { subtotal: 0, gst: 0, total: 0 };
//    const subtotal =
//      order.subtotal ||
//      order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
//    const gst =
//      order.gstAmount ||
//      (subtotal * (order.gstPercentage || restaurant?.gstPercentage || 18)) / 100;
//    const total = order.total || subtotal + gst;
//    return { subtotal, gst, total };
//  };
//
//  const getFullAddress = () => {
//    if (!restaurant) return '';
//    return [restaurant.nearestPlace, restaurant.city, restaurant.state, restaurant.country]
//      .filter(Boolean)
//      .join(', ');
//  };
//
//  const getCategoryDisplayName = (category) => {
//    if (!category) return 'Uncategorized';
//    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
//  };
//
//  const showPopup = (message, type = 'success') => {
//    setPopupMessage(message);
//    setPopupIcon(type === 'success' ? '✅' : '❌');
//    setShowSuccessPopup(true);
//    setTimeout(() => setShowSuccessPopup(false), 3000);
//  };
//
//  /* ── Data Fetching ── */
//
//  const fetchOrderFromBackend = async () => {
//    try {
//      const res = await axios.get(`${API_URL}/api/order/${orderId}`);
//      if (res.data) return res.data;
//    } catch {
//      try {
//        const rRes = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
//        const code = rRes.data?.restaurantCode;
//        if (code) {
//          const res2 = await axios.get(`${API_URL}/api/order/${code}/${orderId}`);
//          if (res2.data) return res2.data;
//        }
//      } catch {
//        return null;
//      }
//    }
//    return null;
//  };
//
//  const fetchRestaurantDetails = async () => {
//    try {
//      const res = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
//      setRestaurant(res.data);
//    } catch (e) {
//      console.error('Error fetching restaurant details:', e);
//    }
//  };
//
//  const fetchMenuItems = async () => {
//    try {
//      const res = await axios.get(`${API_URL}/api/menu/restaurant/${restaurantSlug}`);
//      const items = res.data || [];
//      setMenuItems(items);
//      setFilteredItems(items);
//      const uniqueCategories = [
//        ...new Set(
//          items
//            .map((i) => i.category)
//            .filter((c) => c && c.trim() !== '')
//            .map((c) => c.trim())
//        ),
//      ];
//      setCategories(uniqueCategories);
//    } catch (e) {
//      console.error('Error fetching menu items:', e);
//    }
//  };
//
//  /* ── Effects ── */
//
//  useEffect(() => {
//    const initializePage = async () => {
//      try {
//        setLoading(true);
//        let foundOrder = null;
//
//        const saved = localStorage.getItem(`currentOrder_${restaurantSlug}`);
//        if (saved) {
//          try {
//            const parsed = JSON.parse(saved);
//            if (parsed._id === orderId || parsed.billNumber == orderId) foundOrder = parsed;
//          } catch {}
//        }
//
//        if (!foundOrder && orderId) foundOrder = await fetchOrderFromBackend();
//
//        if (!foundOrder) {
//          setError('Order not found. Please check your order details.');
//          setLoading(false);
//          return;
//        }
//
//        setOrder(foundOrder);
//        await fetchRestaurantDetails();
//        await fetchMenuItems();
//      } catch {
//        setError('Failed to load order details. Please try again.');
//      } finally {
//        setLoading(false);
//      }
//    };
//
//    if (restaurantSlug && orderId) initializePage();
//  }, [restaurantSlug, orderId]);
//
//  useEffect(() => {
//    let result = menuItems;
//    if (activeCategory !== 'all')
//      result = result.filter(
//        (item) =>
//          item.category &&
//          item.category.trim().toLowerCase() === activeCategory.toLowerCase()
//      );
//    if (searchTerm)
//      result = result.filter(
//        (item) => item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
//      );
//    setFilteredItems(result);
//  }, [activeCategory, searchTerm, menuItems]);
//
//  /* ── Cart handlers ── */
//
//  const addMenuItemToOrder = (menuItem) => {
//    setNewItems((prev) => {
//      const existing = prev.find((i) => i.itemId === menuItem._id);
//      if (existing)
//        return prev.map((i) =>
//          i.itemId === menuItem._id
//            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
//            : i
//        );
//      return [
//        ...prev,
//        {
//          itemId: menuItem._id,
//          name: menuItem.name,
//          price: menuItem.price,
//          category: menuItem.category,
//          type: menuItem.type,
//          gstPercentage: order?.gstPercentage || restaurant?.gstPercentage || 18,
//          quantity: 1,
//          total: menuItem.price,
//          itemStatus: 'pending',
//        },
//      ];
//    });
//  };
//
//  const removeMenuItemFromOrder = (menuItemId) => {
//    setNewItems((prev) =>
//      prev
//        .map((i) =>
//          i.itemId === menuItemId && i.quantity > 1
//            ? { ...i, quantity: i.quantity - 1, total: (i.quantity - 1) * i.price }
//            : i
//        )
//        .filter((i) => i.quantity > 0)
//    );
//  };
//
//  const getItemQuantity = (menuItemId) =>
//    newItems.find((i) => i.itemId === menuItemId)?.quantity || 0;
//
//  const getNewItemsTotal = () => newItems.reduce((sum, i) => sum + i.total, 0);
//
//  const closeAddModal = () => {
//    if (addingItems) return;
//    setShowAddItemsModal(false);
//    setNewItems([]);
//    setSearchTerm('');
//    setActiveCategory('all');
//  };
//
//  /* ── Save new items ── */
//
//  const handleSaveNewItems = async () => {
//    if (newItems.length === 0) { setShowAddItemsModal(false); return; }
//    setAddingItems(true);
//    try {
//      const restaurantCode = restaurant?.restaurantCode || localStorage.getItem('restaurantCode');
//      if (!restaurantCode) throw new Error('Restaurant code not found');
//      const billNumber = order.billNumber;
//
//      for (const item of newItems) {
//        const res = await axios.post(
//          `${API_URL}/api/order/${restaurantCode}/${billNumber}/items`,
//          {
//            name: item.name, price: item.price, quantity: item.quantity,
//            category: item.category, type: item.type,
//            gstPercentage: item.gstPercentage || 18, itemId: item.itemId,
//          },
//          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
//        );
//        if (!res.data.success) throw new Error(`Failed to add item: ${item.name}`);
//      }
//
//      let updated = null;
//      try {
//        const r = await axios.get(`${API_URL}/api/order/${order._id}`);
//        if (r.data) updated = r.data;
//      } catch {
//        const r2 = await axios.get(`${API_URL}/api/order/${restaurantCode}/${billNumber}`);
//        if (r2.data) updated = r2.data;
//      }
//
//      if (updated) {
//        setOrder(updated);
//        localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(updated));
//      }
//
//      closeAddModal();
//      showPopup('Items added successfully!', 'success');
//    } catch (err) {
//      showPopup(`Failed to add items: ${err.response?.data?.error || err.message}`, 'error');
//    } finally {
//      setAddingItems(false);
//    }
//  };
//
//  /* ── Feedback ── */
//
//  const handleStarClick = (category, rating) =>
//    setFeedbackForm((prev) => ({ ...prev, [category]: rating }));
//
//  const handleFeedbackSubmit = async (e) => {
//    e.preventDefault();
//    setSubmittingFeedback(true);
//    try {
//      const overallRating = parseFloat(
//        ((feedbackForm.serviceRating + feedbackForm.foodRating + feedbackForm.cleanlinessRating) / 3).toFixed(1)
//      );
//      const res = await axios.post(`${API_URL}/api/feedback/submit`, {
//        orderId: order._id, restaurantSlug, billNumber: order.billNumber,
//        serviceRating: feedbackForm.serviceRating, foodRating: feedbackForm.foodRating,
//        cleanlinessRating: feedbackForm.cleanlinessRating, overallRating,
//        comments: feedbackForm.comments, customerEmail: '', customerPhone: '',
//      });
//      if (res.status === 201) {
//        setFeedbackSubmitted(true);
//        setShowFeedbackForm(false);
//        showPopup('Feedback submitted successfully!', 'success');
//      }
//    } catch (err) {
//      showPopup(`Failed to submit feedback: ${err.response?.data?.error || err.message}`, 'error');
//    } finally {
//      setSubmittingFeedback(false);
//    }
//  };
//
//  /* ── Request handler ── */
//
//  const handleRequestOption = async (option) => {
//    const map = {
//      water:  { requestType: 'water',  requestMessage: 'Customer requested bottle of water', popupTitle: '💧 Water Request Sent!' },
//      tissue: { requestType: 'tissue', requestMessage: 'Customer requested tissue paper',    popupTitle: '🧻 Tissue Request Sent!' },
//      bill:   { requestType: 'bill',   requestMessage: 'Customer requested the bill',        popupTitle: '🧾 Bill Request Sent!' },
//    };
//    const cfg = map[option];
//    if (!cfg) return;
//
//    setSubmittingRequest(true);
//    try {
//      const token = localStorage.getItem('token');
//      const res = await axios.post(
//        `${API_URL}/api/order/customer-request/create`,
//        {
//          orderId: order._id, billNumber: order.billNumber, restaurantSlug,
//          restaurantCode: restaurant?.restaurantCode, customerName: order.customerName,
//          tableNumber: order.tableNumber, requestType: cfg.requestType,
//          requestMessage: cfg.requestMessage,
//        },
//        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
//      );
//      if (res.data.success) {
//        showPopup(
//          `${cfg.popupTitle}\n\nTable: ${order.tableNumber}\nStaff will attend shortly.`,
//          'success'
//        );
//        setShowRequestMenu(false);
//      }
//    } catch (err) {
//      showPopup(`Failed to send request: ${err.response?.data?.error || err.message}`, 'error');
//    } finally {
//      setSubmittingRequest(false);
//    }
//  };
//
//  /* ── PDF Download ── */
//
//  const numberToWords = (num) => {
//    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
//      'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
//    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
//    const cvt = (n) => {
//      if (n === 0) return '';
//      if (n < 20) return ones[n];
//      if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
//      return ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+cvt(n%100) : '');
//    };
//    if (num === 0) return 'Zero';
//    const rupees = Math.floor(num);
//    const paise = Math.round((num - rupees) * 100);
//    let words = '';
//    const cr = Math.floor(rupees/10000000);
//    const lk = Math.floor((rupees%10000000)/100000);
//    const th = Math.floor((rupees%100000)/1000);
//    const hd = rupees%1000;
//    if (cr) words += cvt(cr)+' Crore ';
//    if (lk) words += cvt(lk)+' Lakh ';
//    if (th) words += cvt(th)+' Thousand ';
//    if (hd) words += cvt(hd);
//    words += ' Rupees';
//    if (paise) words += ' and '+cvt(paise)+' Paise';
//    return (words+' Only').trim().replace(/\s+/g,' ');
//  };
//
//  const handleDownloadPDF = () => {
//    if (!order) return;
//    const doc = new jsPDF();
//    const { subtotal, gst, total } = getDisplayTotals();
//    const gstPct = order.gstPercentage || restaurant?.gstPercentage || 18;
//    doc.deletePage(1); doc.addPage();
//    doc.setFont('courier','normal');
//    let y = 25;
//    const address = [restaurant?.nearestPlace, restaurant?.city, restaurant?.state, restaurant?.country]
//      .filter(Boolean).join(', ').toUpperCase();
//
//    doc.setFontSize(24); doc.setFont('courier','bold');
//    doc.text(restaurant?.restaurantName?.toUpperCase() || 'RESTAURANT', 105, y, { align:'center' }); y += 8;
//    doc.setFontSize(10); doc.setFont('courier','normal');
//    doc.text(address || 'ADDRESS NOT AVAILABLE', 105, y, { align:'center' }); y += 5;
//    if (restaurant?.mobile) { doc.text(restaurant.mobile, 105, y, { align:'center' }); y += 5; }
//    if (restaurant?.email)  { doc.text(restaurant.email.toLowerCase(), 105, y, { align:'center' }); y += 5; }
//
//    y += 2; doc.line(14,y,196,y); y += 8;
//    doc.setFontSize(14); doc.setFont('courier','bold');
//    doc.text(`BILL NO: ${order.billNumber}`, 105, y, { align:'center' }); y += 8;
//    doc.setFontSize(11); doc.setFont('courier','normal');
//    if (restaurant?.gstNumber)  { doc.text(`GSTIN: ${restaurant.gstNumber}`, 20, y); y += 6; }
//    if (gstPct)                 { doc.text(`GST Rate: ${gstPct}%`, 20, y); y += 6; }
//    if (restaurant?.foodLicense){ doc.text(`FSSAI: ${restaurant.foodLicense}`, 20, y); y += 6; }
//    doc.text(`Location: ${address || 'N/A'}`, 20, y); y += 8;
//
//    doc.setFontSize(10); doc.setFont('courier','bold');
//    const c1=20,c2=80,c3=140;
//    doc.text('CITY',c1,y); doc.text('STATE',c2,y); doc.text('COUNTRY',c3,y); y += 2;
//    doc.line(14,y,196,y); y += 4; doc.setFont('courier','normal');
//    doc.text((restaurant?.city||'N/A').toUpperCase(),c1,y);
//    doc.text((restaurant?.state||'N/A').toUpperCase(),c2,y);
//    doc.text((restaurant?.country||'N/A').toUpperCase(),c3,y); y += 6;
//    doc.line(14,y,196,y); y += 8;
//
//    doc.setFontSize(11);
//    doc.text(`DATE: ${order.date}`, 20, y); doc.text(`TIME: ${order.time}`, 120, y); y += 6;
//    doc.text(`CUSTOMER: ${(order.customerName||'GUEST').toUpperCase()}`, 20, y);
//    doc.text(`TABLE: ${order.tableNumber||'TAKEAWAY'}`, 120, y); y += 8;
//
//    doc.setFillColor(0,0,0); doc.setTextColor(255,255,255);
//    doc.setFont('courier','bold'); doc.setFontSize(10);
//    doc.rect(14,y-4,182,7,'F');
//    doc.text('#',16,y); doc.text('ITEM',30,y); doc.text('QTY',110,y);
//    doc.text('PRICE',135,y); doc.text('TOTAL',170,y);
//    doc.setTextColor(0,0,0); doc.setFont('courier','normal'); y += 6;
//
//    order.items.forEach((item, idx) => {
//      if (y > 250) {
//        doc.addPage(); y = 20;
//        doc.setFillColor(0,0,0); doc.setTextColor(255,255,255); doc.setFont('courier','bold');
//        doc.rect(14,y-4,182,7,'F');
//        doc.text('#',16,y); doc.text('ITEM',30,y); doc.text('QTY',110,y);
//        doc.text('PRICE',135,y); doc.text('TOTAL',170,y);
//        doc.setTextColor(0,0,0); doc.setFont('courier','normal'); y += 6;
//      }
//      const iTotal = item.total || item.price * item.quantity;
//      doc.text((idx+1).toString(),16,y);
//      doc.text(item.name.substring(0,20).toUpperCase(),30,y);
//      doc.text(item.quantity.toString(),115,y);
//      doc.text(formatCurrency(item.price),135,y);
//      doc.text(formatCurrency(iTotal),180,y,{align:'right'}); y += 6;
//    });
//
//    y += 4; doc.line(14,y,196,y); y += 6;
//    doc.setFont('courier','normal');
//    doc.text('Subtotal:',120,y); doc.text(formatCurrency(subtotal),180,y,{align:'right'}); y += 6;
//    doc.text(`GST @ ${gstPct}%:`,120,y); doc.text(formatCurrency(gst),180,y,{align:'right'}); y += 6;
//    doc.setFont('courier','bold'); doc.setFontSize(12);
//    doc.text('Grand Total:',120,y); doc.text(formatCurrency(total),180,y,{align:'right'}); y += 8;
//    doc.setFont('courier','normal'); doc.setFontSize(9);
//    doc.text(`AMOUNT IN WORDS: ${numberToWords(total).toUpperCase()}`,14,y);
//
//    doc.save(`Invoice_${order.billNumber}_${restaurant?.restaurantName||'Restaurant'}.pdf`);
//  };
//
//  /* ── Navigation ── */
//
//  const handleGoBackToMenu = () => {
//    localStorage.removeItem(`currentOrder_${restaurantSlug}`);
//    navigate(`/${restaurantSlug}/menu`);
//  };
//
//  /* ── Derived values ── */
//  const gstPercentage = order?.gstPercentage || restaurant?.gstPercentage || 18;
//
//  /* ─────────────────────────────────────
//     RENDER STATES
//  ───────────────────────────────────── */
//
//  if (loading) {
//    return (
//      <div className="loading-container">
//        <div className="loading-spinner" />
//        <p>Loading your bill…</p>
//      </div>
//    );
//  }
//
//  if (error) {
//    return (
//      <div className="error-container">
//        <div className="error-icon">📄</div>
//        <h2>Bill Not Found</h2>
//        <p>{error}</p>
//        <button className="action-btn print-btn" onClick={handleGoBackToMenu}>
//          <FaArrowLeft /> Back to Menu
//        </button>
//      </div>
//    );
//  }
//
//  if (!order || !order.items || order.items.length === 0) {
//    return (
//      <div className="error-container">
//        <div className="error-icon">📄</div>
//        <h2>No Order Found</h2>
//        <p>You haven't placed any order yet.</p>
//        <button className="action-btn print-btn" onClick={handleGoBackToMenu}>
//          <FaArrowLeft /> Back to Menu
//        </button>
//      </div>
//    );
//  }
//
//  const { subtotal, gst, total } = getDisplayTotals();
//
//  /* ─────────────────────────────────────
//     MAIN RENDER
//  ───────────────────────────────────── */
//
//  return (
//    <div className="bill-container">
//
//      {/* ── Toast Notification ── */}
//      {showSuccessPopup && (
//        <div className="success-popup-overlay">
//          <div className="success-popup">
//            <span className="popup-icon">{popupIcon}</span>
//            <span className="popup-message">{popupMessage}</span>
//            <button className="popup-close" onClick={() => setShowSuccessPopup(false)}>
//              <FaTimes />
//            </button>
//          </div>
//        </div>
//      )}
//
//      {/* ── FAB: Add Items ── */}
//      <button className="floating-add-btn" onClick={() => setShowAddItemsModal(true)} title="Add items">
//        <FaPlus />
//      </button>
//
//      {/* ── FAB: Request ── */}
//      <button
//        className="request-fab"
//        onClick={() => setShowRequestMenu(true)}
//        disabled={submittingRequest}
//        title="Request something"
//      >
//        {submittingRequest ? <FaSpinner className="spinner" /> : <FaCommentDots />}
//      </button>
//
//      {/* ── Request Sheet ── */}
//      {showRequestMenu && (
//        <div className="request-menu-overlay" onClick={() => setShowRequestMenu(false)}>
//          <div className="request-menu" onClick={(e) => e.stopPropagation()}>
//            <div className="request-menu-header">
//              <h3>Need something?</h3>
//              <button className="close-request-menu" onClick={() => setShowRequestMenu(false)}>
//                <FaTimes />
//              </button>
//            </div>
//            <div className="request-options">
//              <button className="request-option water" onClick={() => handleRequestOption('water')}>
//                <span className="request-icon"><FaGlassWhiskey /></span>
//                <div className="request-text">
//                  <span className="request-title">Bottle of Water</span>
//                  <span className="request-desc">Request drinking water</span>
//                </div>
//              </button>
//              <button className="request-option tissue" onClick={() => handleRequestOption('tissue')}>
//                <span className="request-icon"><FaRegStickyNote /></span>
//                <div className="request-text">
//                  <span className="request-title">Tissue Paper</span>
//                  <span className="request-desc">Request tissue paper</span>
//                </div>
//              </button>
//              <button className="request-option bill" onClick={() => handleRequestOption('bill')}>
//                <span className="request-icon"><FaReceipt /></span>
//                <div className="request-text">
//                  <span className="request-title">Get Bill</span>
//                  <span className="request-desc">Request your bill</span>
//                </div>
//              </button>
//            </div>
//          </div>
//        </div>
//      )}
//
//      {/* ══════════════════════
//          MAIN BILL CARD
//      ══════════════════════ */}
//      <div className="bill-card">
//
//        {/* Restaurant Header */}
//        <div className="restaurant-header">
//          <h1 className="restaurant-name">
//            {restaurant?.restaurantName || 'Restaurant'}
//          </h1>
//          {getFullAddress() && (
//            <div className="restaurant-address">
//              <FaMapMarkerAlt className="icon" />
//              {getFullAddress()}
//            </div>
//          )}
//          <div className="restaurant-contact">
//            {restaurant?.mobile && (
//              <span className="contact-item"><FaPhone className="icon" />{restaurant.mobile}</span>
//            )}
//            {restaurant?.email && (
//              <span className="contact-item"><FaEnvelope className="icon" />{restaurant.email}</span>
//            )}
//          </div>
//        </div>
//
//        {/* Bill Meta */}
//        <div className="bill-info">
//          <div style={{ display:'flex', justifyContent:'center', marginBottom: 4 }}>
//            <span className="bill-number-badge">
//              <FaReceipt style={{ fontSize: 13 }} /> Bill #{order.billNumber}
//            </span>
//          </div>
//          <div className="bill-info-row">
//            <span className="bill-label">📅 Date</span>
//            <span className="bill-value">{order.date}</span>
//            <span className="bill-label" style={{ marginLeft: 8 }}>🕒</span>
//            <span className="bill-value">{order.time}</span>
//          </div>
//          <div className="bill-info-row">
//            <span className="bill-label">👤</span>
//            <span className="bill-value">{order.customerName || 'Guest'}</span>
//            <span className="bill-label" style={{ marginLeft: 8 }}>🪑</span>
//            <span className="bill-value">{order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}</span>
//          </div>
//          <div className="bill-info-row">
//            <span className="bill-label">💰 GST</span>
//            <span className="bill-value">{gstPercentage}%</span>
//            {restaurant?.gstNumber && (
//              <>
//                <span className="bill-label" style={{ marginLeft: 8 }}>GSTIN</span>
//                <span className="bill-value">{restaurant.gstNumber}</span>
//              </>
//            )}
//          </div>
//          {restaurant?.foodLicense && (
//            <div className="bill-info-row">
//              <span className="bill-label">✅ FSSAI</span>
//              <span className="bill-value">{restaurant.foodLicense}</span>
//            </div>
//          )}
//        </div>
//
//        {/* Items Table */}
//        <div className="items-container">
//          <table className="items-table">
//            <thead>
//              <tr>
//                <th>Item</th>
//                <th>Qty</th>
//                <th>Price</th>
//                <th>Total</th>
//              </tr>
//            </thead>
//            <tbody>
//              {order.items.map((item, idx) => {
//                const itemTotal = item.total || item.price * item.quantity;
//                return (
//                  <tr key={idx}>
//                    <td className="item-name">{item.name}</td>
//                    <td className="item-qty">{item.quantity}</td>
//                    <td className="item-price">₹{formatCurrency(item.price)}</td>
//                    <td className="item-total">₹{formatCurrency(itemTotal)}</td>
//                  </tr>
//                );
//              })}
//            </tbody>
//          </table>
//        </div>
//
//        {/* Totals */}
//        <div className="totals">
//          <div className="total-row">
//            <span>Subtotal</span>
//            <span>₹{formatCurrency(subtotal)}</span>
//          </div>
//          <div className="total-row">
//            <span>GST ({gstPercentage}%)</span>
//            <span>₹{formatCurrency(gst)}</span>
//          </div>
//          <div className="total-row grand-total">
//            <span><strong>Grand Total</strong></span>
//            <span><strong>₹{formatCurrency(total)}</strong></span>
//          </div>
//        </div>
//
//        {/* Thank You */}
//        <div className="thank-you">
//          <p>Thank you for dining with us!</p>
//          <p>Please visit again.</p>
//        </div>
//
//        {/* Actions */}
//        <div className="action-buttons">
//          <button className="action-btn print-btn" onClick={handleDownloadPDF}>
//            <FaDownload /> Download PDF
//          </button>
//          <button
//            className="action-btn share-btn"
//            onClick={() => {
//              const msg =
//                `*${restaurant?.restaurantName || 'Restaurant'}*\n` +
//                `Bill No: ${order.billNumber}\n` +
//                `Date: ${order.date} | Time: ${order.time}\n` +
//                `Customer: ${order.customerName || 'Guest'} | Table: ${order.tableNumber || 'Takeaway'}\n` +
//                `--------------------------------\n` +
//                order.items.map(i => `${i.name} x${i.quantity} = ₹${(i.price * i.quantity).toFixed(2)}`).join('\n') +
//                `\n--------------------------------\n` +
//                `Subtotal: ₹${formatCurrency(subtotal)}\n` +
//                `GST (${gstPercentage}%): ₹${formatCurrency(gst)}\n` +
//                `*Grand Total: ₹${formatCurrency(total)}*\n\n` +
//                `📍 ${getFullAddress()}\n` +
//                (restaurant?.mobile ? `📞 ${restaurant.mobile}\n` : '') +
//                (restaurant?.gstNumber ? `GST: ${restaurant.gstNumber}\n` : '') +
//                `\nThank you for your order!`;
//              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
//            }}
//          >
//            <FaWhatsapp /> Share
//          </button>
//        </div>
//      </div>
//
//      {/* ══════════════════════
//          FEEDBACK SECTION
//      ══════════════════════ */}
//      {!feedbackSubmitted ? (
//        <div className="feedback-section">
//          {!showFeedbackForm ? (
//            <button className="feedback-btn" onClick={() => setShowFeedbackForm(true)}>
//              <FaStar /> Rate Your Experience
//            </button>
//          ) : (
//            <div className="feedback-form">
//              <h3>Rate Your Experience</h3>
//              {[
//                { key: 'serviceRating', label: 'Service Quality' },
//                { key: 'foodRating',    label: 'Food Quality' },
//                { key: 'cleanlinessRating', label: 'Cleanliness' },
//              ].map(({ key, label }) => (
//                <div className="rating-group" key={key}>
//                  <label>{label}</label>
//                  <StarRating rating={feedbackForm[key]} onRatingChange={handleStarClick} category={key} />
//                </div>
//              ))}
//              <textarea
//                value={feedbackForm.comments}
//                onChange={(e) => setFeedbackForm((prev) => ({ ...prev, comments: e.target.value }))}
//                placeholder="Share your thoughts…"
//                rows={3}
//              />
//              <div className="feedback-actions">
//                <button type="button" className="cancel-btn" onClick={() => setShowFeedbackForm(false)}>
//                  Cancel
//                </button>
//                <button
//                  type="button"
//                  className="submit-btn"
//                  onClick={handleFeedbackSubmit}
//                  disabled={submittingFeedback}
//                >
//                  {submittingFeedback ? 'Submitting…' : 'Submit Feedback'}
//                </button>
//              </div>
//            </div>
//          )}
//        </div>
//      ) : (
//        <div className="feedback-success">
//          <FaCheckCircle className="success-icon" />
//          <h3>Thank You for Your Feedback!</h3>
//        </div>
//      )}
//
//      {/* ══════════════════════
//          ADD ITEMS MODAL
//      ══════════════════════ */}
//      {showAddItemsModal && (
//        <div className="modal-overlay" onClick={closeAddModal}>
//          <div className="add-items-modal-new" onClick={(e) => e.stopPropagation()}>
//
//            {/* Header */}
//            <div className="modal-header-new">
//              <h3>Add to Bill #{order.billNumber}</h3>
//              <button className="close-modal-btn-new" onClick={closeAddModal} disabled={addingItems}>
//                <FaTimes />
//              </button>
//            </div>
//
//            <div className="modal-content-new">
//
//              {/* Search */}
//              <div className="search-container-new">
//                <FaSearch className="search-icon-new" />
//                <input
//                  type="text"
//                  placeholder="Search menu…"
//                  value={searchTerm}
//                  onChange={(e) => setSearchTerm(e.target.value)}
//                  className="search-input-new"
//                />
//                {searchTerm && (
//                  <button className="clear-search-new" onClick={() => setSearchTerm('')}>
//                    <FaTimes />
//                  </button>
//                )}
//              </div>
//
//              {/* Categories */}
//              <div className="categories-container-new">
//                <button
//                  className={`category-chip-new ${activeCategory === 'all' ? 'active' : ''}`}
//                  onClick={() => setActiveCategory('all')}
//                >
//                  All ({menuItems.length})
//                </button>
//                {categories.map((cat, idx) => (
//                  <button
//                    key={idx}
//                    className={`category-chip-new ${activeCategory === cat.toLowerCase() ? 'active' : ''}`}
//                    onClick={() => setActiveCategory(cat.toLowerCase())}
//                  >
//                    {getCategoryDisplayName(cat)} (
//                    {menuItems.filter((i) => i.category?.trim().toLowerCase() === cat.toLowerCase()).length})
//                  </button>
//                ))}
//              </div>
//
//              {/* Menu Items */}
//              <div className="menu-items-grid-new">
//                {filteredItems.length > 0 ? (
//                  filteredItems.map((item) => {
//                    const qty = getItemQuantity(item._id);
//                    const imageUrl = getImageUrl(item.image);
//                    const hasImage = imageUrl && !imageErrors[item._id];
//                    return (
//                      <div key={item._id} className="menu-item-card-new">
//                        <div className="item-image-wrapper-new">
//                          {hasImage ? (
//                            <img
//                              src={imageUrl}
//                              alt={item.name}
//                              className="item-image-new"
//                              onError={() => handleImageError(item._id)}
//                              loading="lazy"
//                            />
//                          ) : (
//                            <div className="image-fallback-new">
//                              <FaUtensils className="fallback-icon-new" />
//                              <span className="fallback-text-new">{getInitials(item.name)}</span>
//                            </div>
//                          )}
//                          <div className={`item-type-badge-new ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>
//                            {item.type === 'Veg' ? '● Veg' : '● Non-Veg'}
//                          </div>
//                        </div>
//
//                        <div className="item-details-new">
//                          <div className="item-header-new">
//                            <h3 className="item-name-new">{item.name}</h3>
//                            <span className="item-price-new">₹{Number(item.price).toFixed(2)}</span>
//                          </div>
//                          <div className="item-category-new">
//                            <span className="category-badge-new">{item.category || 'Uncategorized'}</span>
//                          </div>
//                          <div className="item-actions-new">
//                            <button
//                              className="quantity-btn-new"
//                              onClick={() => removeMenuItemFromOrder(item._id)}
//                              disabled={qty === 0 || addingItems}
//                            >−</button>
//                            <span className="quantity-new">{qty}</span>
//                            <button
//                              className="quantity-btn-new"
//                              onClick={() => addMenuItemToOrder(item)}
//                              disabled={addingItems}
//                            >+</button>
//                          </div>
//                        </div>
//                      </div>
//                    );
//                  })
//                ) : (
//                  <div className="no-items-new">
//                    <p>No menu items found</p>
//                    {(searchTerm || activeCategory !== 'all') && (
//                      <button
//                        className="clear-filters-btn-new"
//                        onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
//                      >
//                        Clear Filters
//                      </button>
//                    )}
//                  </div>
//                )}
//              </div>
//
//              {/* New Items Summary */}
//              {newItems.length > 0 && (
//                <div className="new-items-summary-new">
//                  <h4>Items to Add</h4>
//                  {newItems.map((item, idx) => (
//                    <div key={idx} className="new-item-row-new">
//                      <span>{item.name} × {item.quantity}</span>
//                      <span>₹{formatCurrency(item.total)}</span>
//                    </div>
//                  ))}
//                  <div className="new-total-new">
//                    <span>Additional Total</span>
//                    <span>₹{formatCurrency(getNewItemsTotal())}</span>
//                  </div>
//                  <div className="gst-note-new">
//                    <FaPercent style={{ fontSize: 10 }} /> GST @ {gstPercentage}% will be applied
//                  </div>
//                </div>
//              )}
//
//              {/* Modal Actions */}
//              <div className="modal-actions-new">
//                <button className="modal-cancel-new" onClick={closeAddModal} disabled={addingItems}>
//                  Cancel
//                </button>
//                <button
//                  className="modal-confirm-new"
//                  onClick={handleSaveNewItems}
//                  disabled={newItems.length === 0 || addingItems}
//                >
//                  {addingItems
//                    ? 'Adding…'
//                    : `Add ${newItems.length} Item${newItems.length !== 1 ? 's' : ''}`}
//                </button>
//              </div>
//
//            </div>
//          </div>
//        </div>
//      )}
//
//    </div>
//  );
//};
//
//export default MyOrderPage;
import React, { useEffect, useState, useRef } from 'react';
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
  FaCheckCircle,
  FaDownload,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaSpinner,
  FaGlassWhiskey,
  FaRegStickyNote,
  FaReceipt,
  FaCommentDots,
  FaUtensils,
  FaWallet,
  FaMobileAlt,
  FaQrcode,
  FaTrash,
  FaInfoCircle,
  FaRupeeSign
} from 'react-icons/fa';
import './MyOrderPage.css';

const StarRating = ({ rating, onRatingChange, category }) => (
  <div className="star-rating">
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={star <= rating ? 'star filled' : 'star'} onClick={() => onRatingChange(category, star)}>★</span>
    ))}
  </div>
);

// UPI App Selector Component - Using Razorpay only
const UpiAppSelector = ({ onSelectApp, loading, selectedApp, totalAmount, processPayment }) => {
  const upiApps = [
    { name: 'Google Pay', package: 'com.google.android.apps.nbu.pay', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg', color: '#4285f4' },
    { name: 'PhonePe', package: 'com.phonepe.app', icon: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/PhonePe_Logo.png', color: '#5c2d91' },
    { name: 'Paytm', package: 'net.one97.paytm', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo.png', color: '#00baf2' },
    { name: 'Amazon Pay', package: 'in.amazon.mShop.android.shopping', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', color: '#ff9900' },
    { name: 'BHIM', package: 'in.org.npci.upiapp', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Bhim_UPI_App_Logo.png', color: '#2c6e9e' },
  ];

  const isAndroid = /Android/i.test(navigator.userAgent);
  
  if (!isAndroid) {
    return (
      <div className="upi-qr-fallback">
        <p className="upi-instruction">💰 Click the button below to pay securely via Razorpay</p>
        <div className="payment-modal-actions">
          <button 
            className="confirm-payment-btn"
            onClick={processPayment}
            disabled={loading}
          >
            {loading ? <FaSpinner className="spinner" /> : `Pay ₹${totalAmount}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="upi-apps-grid">
      <p className="upi-instruction">Select your UPI app to pay securely via Razorpay:</p>
      <div className="apps-grid">
        {upiApps.map((app) => (
          <button
            key={app.name}
            className={`upi-app-button ${selectedApp?.name === app.name ? 'selected' : ''}`}
            onClick={() => onSelectApp(app)}
            disabled={loading}
            style={{ borderColor: selectedApp?.name === app.name ? app.color : '#e0e0e0' }}
          >
            <img 
              src={app.icon} 
              alt={app.name} 
              className="upi-app-icon"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://via.placeholder.com/50?text=${app.name.charAt(0)}`;
              }}
            />
            <span>{app.name}</span>
          </button>
        ))}
      </div>
      
      <div className="payment-modal-actions">
        <button 
          className="confirm-payment-btn alternative-btn"
          onClick={processPayment}
          disabled={loading}
        >
          {loading ? <FaSpinner className="spinner" /> : `Pay ₹${totalAmount} via Razorpay`}
        </button>
      </div>
      
      <p className="upi-note">You'll be redirected to Razorpay secure payment gateway</p>
    </div>
  );
};

const MyOrderPage = () => {
  const { restaurantSlug, orderId } = useParams();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';

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
  const [showRequestMenu, setShowRequestMenu] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupIcon, setPopupIcon] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(false);
  
  // Payment states
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const [feedbackForm, setFeedbackForm] = useState({
    serviceRating: 0,
    foodRating: 0,
    cleanlinessRating: 0,
    overallRating: 0,
    comments: '',
  });

  let pollInterval = useRef(null);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        setRazorpayLoaded(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Razorpay script loaded');
        setRazorpayLoaded(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
      };
      document.body.appendChild(script);
    };
    loadRazorpayScript();
    
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    if (imageName.startsWith('http')) return imageName;
    if (imageName.startsWith('/uploads/')) return `${API_URL}${imageName}`;
    return `${API_URL}/uploads/menu/${imageName}`;
  };

  const handleImageError = (itemId) => setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '?');
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) amount = 0;
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getDisplayTotals = () => {
    if (!order) return { subtotal: 0, gst: 0, total: 0 };
    const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const gst = order.gstAmount || (subtotal * (order.gstPercentage || restaurant?.gstPercentage || 18)) / 100;
    const total = order.total || subtotal + gst;
    const discountedTotal = order.discountedTotal || total;
    return { subtotal, gst, total: discountedTotal };
  };

  const getFullAddress = () => {
    if (!restaurant) return '';
    return [restaurant.nearestPlace, restaurant.city, restaurant.state, restaurant.country].filter(Boolean).join(', ');
  };

  const getCategoryDisplayName = (category) => {
    if (!category) return 'Uncategorized';
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  const showPopup = (message, type = 'success') => {
    setPopupMessage(message);
    setPopupIcon(type === 'success' ? '✅' : '❌');
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000);
  };

  // =========== FETCH PAYMENT STATUS ===========
  const fetchPaymentStatus = async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/api/payments/status/${orderId}`);
      setPaymentStatus(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return null;
    }
  };

  // =========== FETCH ORDER FROM BACKEND ===========
  const fetchOrderFromBackend = async () => {
    try {
      console.log('🔍 Fetching fresh order data from backend for ID:', orderId);
      const res = await axios.get(`${API_URL}/api/order/id/${orderId}`);
      if (res.data) {
        console.log('✅ Fresh order data from backend');
        console.log('💰 Payment status:', res.data.paymentStatus);
        console.log('💳 Payment method:', res.data.paymentMethod);
        
        localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(res.data));
        return res.data;
      }
    } catch (error) {
      console.log('Backend fetch failed:', error.response?.status, error.message);
    }
    
    const savedOrder = localStorage.getItem(`currentOrder_${restaurantSlug}`);
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        console.log('📦 Using order from localStorage');
        return parsed;
      } catch (e) {
        console.log('Error parsing saved order:', e);
      }
    }
    
    return null;
  };

  const fetchRestaurantDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurant/by-slug/${restaurantSlug}`);
      setRestaurant(res.data);
    } catch (e) {
      console.error('Error fetching restaurant details:', e);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/menu/restaurant/${restaurantSlug}`);
      const items = res.data || [];
      setMenuItems(items);
      setFilteredItems(items);
      const uniqueCategories = [...new Set(items.map(i => i.category).filter(c => c && c.trim() !== ''))];
      setCategories(uniqueCategories);
    } catch (e) {
      console.error('Error fetching menu items:', e);
    }
  };

  // =========== PROCESS STANDARD CHECKOUT ===========
  const processStandardCheckout = async () => {
    if (!order || !order._id) {
      showPopup('Order data missing. Please try again.', 'error');
      return;
    }
    
    if (!razorpayLoaded) {
      showPopup('Payment gateway is loading. Please try again.', 'error');
      return;
    }
    
    setPaymentLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/payments/create-order`, {
        orderId: order._id,
        amount: getDisplayTotals().total,
        currency: 'INR'
      });
      
      if (response.data.success) {
        const options = {
          key: response.data.keyId,
          amount: response.data.amount,
          currency: response.data.currency,
          name: restaurant?.restaurantName || 'Restaurant',
          description: `Order #${order.billNumber}`,
          order_id: response.data.razorpayOrderId,
          handler: async (paymentResponse) => {
            try {
              const verifyResponse = await axios.post(`${API_URL}/api/payments/verify-payment`, {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                orderId: order._id
              });
              
              if (verifyResponse.data.success) {
                showPopup('✅ Payment successful!', 'success');
                
                if (verifyResponse.data.order) {
                  setOrder(verifyResponse.data.order);
                  localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(verifyResponse.data.order));
                } else {
                  const freshOrder = await axios.get(`${API_URL}/api/order/id/${order._id}`);
                  if (freshOrder.data) {
                    setOrder(freshOrder.data);
                    localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(freshOrder.data));
                  }
                }
                
                setShowPaymentModal(false);
              } else {
                showPopup('Payment verification failed. Please contact support.', 'error');
              }
            } catch (error) {
              console.error('Verification error:', error);
              showPopup('Payment verification failed. Please contact support.', 'error');
            }
          },
          prefill: {
            name: order.customerName,
            email: order.customerEmail || '',
            contact: order.customerPhone
          },
          theme: { color: '#F37254' },
          modal: {
            ondismiss: () => {
              setPaymentLoading(false);
              showPopup('Payment cancelled. You can pay later.', 'warning');
            }
          }
        };
        
        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
        
      } else {
        showPopup('Failed to create payment order. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      showPopup('Payment failed. Please try again.', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  // =========== PROCESS CASH PAYMENT ===========
  const processCashPayment = async () => {
    if (!order || !order._id) {
      showPopup('Order data missing. Please try again.', 'error');
      return;
    }
    
    setPaymentLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/payments/cash/${order._id}`, {
        amount: getDisplayTotals().total
      });
      
      console.log('Cash payment response:', response.data);
      
      if (response.data.success) {
        setShowPaymentModal(false);
        showPopup('💵 Cash payment selected. Please pay at the counter. Order pending confirmation.', 'success');
        
        const freshOrder = await axios.get(`${API_URL}/api/order/id/${order._id}`);
        if (freshOrder.data) {
          console.log('Fresh order after cash selection:', freshOrder.data);
          setOrder(freshOrder.data);
          localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(freshOrder.data));
        }
        
        setPaymentLoading(false);
        setPaymentMethod('upi');
        setSelectedUpiApp(null);
        
      } else {
        showPopup('Failed to select cash payment. Please try again.', 'error');
        setPaymentLoading(false);
      }
    } catch (error) {
      console.error('Cash payment selection failed:', error);
      showPopup('Failed to select cash payment. Please try again.', 'error');
      setPaymentLoading(false);
    }
  };

  // =========== MAIN PAYMENT HANDLER ===========
  const handlePayment = async () => {
    if (paymentMethod === 'cash') {
      await processCashPayment();
    } else if (paymentMethod === 'upi') {
      await processStandardCheckout();
    }
  };

  // =========== HANDLE UPI APP SELECT ===========
  const handleUpiAppSelect = (app) => {
    setSelectedUpiApp(app);
    // This will open Razorpay checkout with the selected app preference
    processStandardCheckout();
  };

  // =========== REMOVE ITEM FROM ORDER ===========
  const removeItemFromOrder = async (itemId, itemName) => {
    if (!order || !order._id) {
      showPopup('Order data missing.', 'error');
      return;
    }
    
    if (window.confirm(`Remove "${itemName}" from this order?`)) {
      setUpdatingOrder(true);
      
      try {
        const restaurantCode = restaurant?.restaurantCode || localStorage.getItem('restaurantCode');
        const billNumber = order.billNumber;
        
        const response = await axios.delete(
          `${API_URL}/api/order/${restaurantCode}/${billNumber}/items/${itemId}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (response.data.success) {
          showPopup(`"${itemName}" removed from order`, 'success');
          
          const updatedOrder = await fetchOrderFromBackend();
          if (updatedOrder) {
            setOrder(updatedOrder);
            localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(updatedOrder));
          }
          
          if (updatedOrder && updatedOrder.items.length === 0) {
            showPopup('Order is empty. Redirecting to menu...', 'warning');
            setTimeout(() => {
              navigate(`/${restaurantSlug}/menu`);
            }, 2000);
          }
        } else {
          showPopup('Failed to remove item', 'error');
        }
      } catch (error) {
        console.error('Remove item error:', error);
        showPopup('Failed to remove item. Please try again.', 'error');
      } finally {
        setUpdatingOrder(false);
      }
    }
  };

  // =========== REMOVE NEW ITEM FROM ADD MODAL ===========
  const removeNewItem = (itemId) => {
    setNewItems(prev => prev.filter(item => item.itemId !== itemId));
  };

  // =========== ADD ITEM TO ORDER (from modal) ===========
  const addMenuItemToOrder = (menuItem) => {
    if (isPaid) {
      showPopup('Cannot add items. Order is already paid.', 'error');
      return;
    }
    
    setNewItems((prev) => {
      const existing = prev.find((i) => i.itemId === menuItem._id);
      if (existing) {
        return prev.map((i) =>
          i.itemId === menuItem._id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
            : i
        );
      }
      return [...prev, {
        itemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        category: menuItem.category,
        type: menuItem.type,
        gstPercentage: order?.gstPercentage || restaurant?.gstPercentage || 18,
        quantity: 1,
        total: menuItem.price,
        itemStatus: 'pending',
      }];
    });
  };

  const removeMenuItemFromOrder = (menuItemId) => {
    setNewItems((prev) =>
      prev
        .map((i) =>
          i.itemId === menuItemId && i.quantity > 1
            ? { ...i, quantity: i.quantity - 1, total: (i.quantity - 1) * i.price }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const getItemQuantity = (menuItemId) => newItems.find((i) => i.itemId === menuItemId)?.quantity || 0;
  const getNewItemsTotal = () => newItems.reduce((sum, i) => sum + i.total, 0);

  const closeAddModal = () => {
    if (addingItems) return;
    setShowAddItemsModal(false);
    setNewItems([]);
    setSearchTerm('');
    setActiveCategory('all');
  };

  const handleSaveNewItems = async () => {
    if (newItems.length === 0) {
      closeAddModal();
      return;
    }
    
    if (isPaid) {
      showPopup('Cannot add items. Order is already paid.', 'error');
      return;
    }
    
    setAddingItems(true);
    try {
      const restaurantCode = restaurant?.restaurantCode || localStorage.getItem('restaurantCode');
      if (!restaurantCode) throw new Error('Restaurant code not found');
      const billNumber = order.billNumber;

      for (const item of newItems) {
        await axios.post(
          `${API_URL}/api/order/${restaurantCode}/${billNumber}/items`,
          {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category,
            type: item.type,
            gstPercentage: item.gstPercentage || 18,
            itemId: item.itemId,
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );
      }

      let updated = null;
      try {
        const r = await axios.get(`${API_URL}/api/order/id/${order._id}`);
        if (r.data) updated = r.data;
      } catch {
        const r2 = await axios.get(`${API_URL}/api/order/${restaurantCode}/${billNumber}`);
        if (r2.data) updated = r2.data;
      }

      if (updated) {
        setOrder(updated);
        localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(updated));
        showPopup(`Added ${newItems.length} item(s) successfully! New total: ₹${formatCurrency(updated.total)}`, 'success');
      }

      closeAddModal();
      
      if (order.paymentStatus === 'paid' && updated && updated.paymentStatus !== 'paid') {
        showPopup('New items added. Please complete payment for the updated order.', 'warning');
      }
      
    } catch (err) {
      showPopup(`Failed to add items: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setAddingItems(false);
    }
  };

  // =========== INITIALIZE PAGE ===========
  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const foundOrder = await fetchOrderFromBackend();

        if (!foundOrder) {
          setError('Order not found. Please check your order details.');
          setLoading(false);
          return;
        }

        setOrder(foundOrder);
        await fetchRestaurantDetails();
        await fetchMenuItems();
        await fetchPaymentStatus(foundOrder._id);
      } catch {
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (restaurantSlug && orderId) initializePage();
  }, [restaurantSlug, orderId]);

  // Poll for order updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (order?._id) {
        try {
          const freshOrder = await axios.get(`${API_URL}/api/order/id/${order._id}`);
          if (freshOrder.data) {
            if (freshOrder.data.paymentStatus !== order.paymentStatus || 
                freshOrder.data.paymentMethod !== order.paymentMethod) {
              console.log('Order updated via polling:', freshOrder.data);
              setOrder(freshOrder.data);
              localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(freshOrder.data));
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [order?._id, order?.paymentStatus, order?.paymentMethod, restaurantSlug]);

  useEffect(() => {
    let result = menuItems;
    if (activeCategory !== 'all')
      result = result.filter(item => item.category && item.category.trim().toLowerCase() === activeCategory.toLowerCase());
    if (searchTerm)
      result = result.filter(item => item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredItems(result);
  }, [activeCategory, searchTerm, menuItems]);

  const handleStarClick = (category, rating) => setFeedbackForm((prev) => ({ ...prev, [category]: rating }));

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const overallRating = parseFloat(((feedbackForm.serviceRating + feedbackForm.foodRating + feedbackForm.cleanlinessRating) / 3).toFixed(1));
      await axios.post(`${API_URL}/api/feedback/submit`, {
        orderId: order._id, restaurantSlug, billNumber: order.billNumber,
        serviceRating: feedbackForm.serviceRating, foodRating: feedbackForm.foodRating,
        cleanlinessRating: feedbackForm.cleanlinessRating, overallRating,
        comments: feedbackForm.comments, customerEmail: order.customerEmail || '', customerPhone: order.customerPhone || '',
      });
      setFeedbackSubmitted(true);
      setShowFeedbackForm(false);
      showPopup('Feedback submitted successfully!', 'success');
    } catch (err) {
      showPopup(`Failed to submit feedback: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleRequestOption = async (option) => {
    const map = {
      water: { requestType: 'water', requestMessage: 'Customer requested bottle of water', popupTitle: '💧 Water Request Sent!' },
      tissue: { requestType: 'tissue', requestMessage: 'Customer requested tissue paper', popupTitle: '🧻 Tissue Request Sent!' },
      bill: { requestType: 'bill', requestMessage: 'Customer requested the bill', popupTitle: '🧾 Bill Request Sent!' },
    };
    const cfg = map[option];
    if (!cfg) return;

    setSubmittingRequest(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/order/customer-request/create`, {
        orderId: order._id, billNumber: order.billNumber, restaurantSlug,
        restaurantCode: restaurant?.restaurantCode, customerName: order.customerName,
        tableNumber: order.tableNumber, requestType: cfg.requestType,
        requestMessage: cfg.requestMessage,
      }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      showPopup(`${cfg.popupTitle}\n\nTable: ${order.tableNumber}\nStaff will attend shortly.`, 'success');
      setShowRequestMenu(false);
    } catch (err) {
      showPopup(`Failed to send request: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const numberToWords = (num) => {
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const cvt = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
      return ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+cvt(n%100) : '');
    };
    if (num === 0) return 'Zero';
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    let words = '';
    const cr = Math.floor(rupees/10000000);
    const lk = Math.floor((rupees%10000000)/100000);
    const th = Math.floor((rupees%100000)/1000);
    const hd = rupees%1000;
    if (cr) words += cvt(cr)+' Crore ';
    if (lk) words += cvt(lk)+' Lakh ';
    if (th) words += cvt(th)+' Thousand ';
    if (hd) words += cvt(hd);
    words += ' Rupees';
    if (paise) words += ' and '+cvt(paise)+' Paise';
    return (words+' Only').trim().replace(/\s+/g,' ');
  };

  const handleDownloadPDF = () => {
    if (!order) return;
    const doc = new jsPDF();
    const { subtotal, gst, total } = getDisplayTotals();
    const gstPct = order.gstPercentage || restaurant?.gstPercentage || 18;
    doc.deletePage(1); doc.addPage();
    doc.setFont('courier','normal');
    let y = 25;
    const address = [restaurant?.nearestPlace, restaurant?.city, restaurant?.state, restaurant?.country].filter(Boolean).join(', ').toUpperCase();

    doc.setFontSize(24); doc.setFont('courier','bold');
    doc.text(restaurant?.restaurantName?.toUpperCase() || 'RESTAURANT', 105, y, { align:'center' }); y += 8;
    doc.setFontSize(10); doc.setFont('courier','normal');
    doc.text(address || 'ADDRESS NOT AVAILABLE', 105, y, { align:'center' }); y += 5;
    if (restaurant?.mobile) { doc.text(restaurant.mobile, 105, y, { align:'center' }); y += 5; }
    if (restaurant?.email) { doc.text(restaurant.email.toLowerCase(), 105, y, { align:'center' }); y += 5; }

    y += 2; doc.line(14,y,196,y); y += 8;
    doc.setFontSize(14); doc.setFont('courier','bold');
    doc.text(`BILL NO: ${order.billNumber}`, 105, y, { align:'center' }); y += 8;
    doc.setFontSize(11); doc.setFont('courier','normal');
    if (restaurant?.gstNumber) { doc.text(`GSTIN: ${restaurant.gstNumber}`, 20, y); y += 6; }
    if (gstPct) { doc.text(`GST Rate: ${gstPct}%`, 20, y); y += 6; }
    if (restaurant?.foodLicense) { doc.text(`FSSAI: ${restaurant.foodLicense}`, 20, y); y += 6; }
    doc.text(`Location: ${address || 'N/A'}`, 20, y); y += 8;

    doc.setFontSize(10); doc.setFont('courier','bold');
    const c1=20,c2=80,c3=140;
    doc.text('CITY',c1,y); doc.text('STATE',c2,y); doc.text('COUNTRY',c3,y); y += 2;
    doc.line(14,y,196,y); y += 4; doc.setFont('courier','normal');
    doc.text((restaurant?.city||'N/A').toUpperCase(),c1,y);
    doc.text((restaurant?.state||'N/A').toUpperCase(),c2,y);
    doc.text((restaurant?.country||'N/A').toUpperCase(),c3,y); y += 6;
    doc.line(14,y,196,y); y += 8;

    doc.setFontSize(11);
    doc.text(`DATE: ${order.date}`, 20, y); doc.text(`TIME: ${order.time}`, 120, y); y += 6;
    doc.text(`CUSTOMER: ${(order.customerName||'GUEST').toUpperCase()}`, 20, y);
    doc.text(`TABLE: ${order.tableNumber||'TAKEAWAY'}`, 120, y); y += 6;
    
    if (order.customerPhone) {
      doc.text(`MOBILE: ${order.customerPhone}`, 20, y); y += 6;
    }

    doc.setFillColor(0,0,0); doc.setTextColor(255,255,255);
    doc.setFont('courier','bold'); doc.setFontSize(10);
    doc.rect(14,y-4,182,7,'F');
    doc.text('#',16,y); doc.text('ITEM',30,y); doc.text('QTY',110,y);
    doc.text('PRICE',135,y); doc.text('TOTAL',170,y);
    doc.setTextColor(0,0,0); doc.setFont('courier','normal'); y += 6;

    order.items.forEach((item, idx) => {
      if (y > 250) { doc.addPage(); y = 20; }
      const iTotal = item.total || item.price * item.quantity;
      doc.text((idx+1).toString(),16,y);
      doc.text(item.name.substring(0,20).toUpperCase(),30,y);
      doc.text(item.quantity.toString(),115,y);
      doc.text(formatCurrency(item.price),135,y);
      doc.text(formatCurrency(iTotal),180,y,{align:'right'}); y += 6;
    });

    y += 4; doc.line(14,y,196,y); y += 6;
    doc.setFont('courier','normal');
    doc.text('Subtotal:',120,y); doc.text(formatCurrency(subtotal),180,y,{align:'right'}); y += 6;
    doc.text(`GST @ ${gstPct}%:`,120,y); doc.text(formatCurrency(gst),180,y,{align:'right'}); y += 6;
    doc.setFont('courier','bold'); doc.setFontSize(12);
    doc.text('Grand Total:',120,y); doc.text(formatCurrency(total),180,y,{align:'right'}); y += 8;
    doc.setFont('courier','normal'); doc.setFontSize(9);
    doc.text(`AMOUNT IN WORDS: ${numberToWords(total).toUpperCase()}`,14,y);
    
    y += 8;
    doc.setFont('courier','bold');
    doc.text(`PAYMENT STATUS: ${isPaid ? 'PAID' : order?.paymentMethod === 'cash' ? 'CASH PENDING' : 'PENDING'}`, 14, y);

    doc.save(`Invoice_${order.billNumber}_${restaurant?.restaurantName||'Restaurant'}.pdf`);
  };

  const handleGoBackToMenu = () => {
    localStorage.removeItem(`currentOrder_${restaurantSlug}`);
    navigate(`/${restaurantSlug}/menu`);
  };

  const refreshOrderData = async () => {
    try {
      const freshOrder = await axios.get(`${API_URL}/api/order/id/${order._id}`);
      if (freshOrder.data) {
        setOrder(freshOrder.data);
        localStorage.setItem(`currentOrder_${restaurantSlug}`, JSON.stringify(freshOrder.data));
        showPopup('Order status refreshed!', 'success');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      showPopup('Failed to refresh order status', 'error');
    }
  };

  const gstPercentage = order?.gstPercentage || restaurant?.gstPercentage || 18;
  const isPaid = order?.paymentStatus === 'paid';
  const isCashSelected = order?.paymentMethod === 'cash';

  console.log('🔍 Order payment status:', order?.paymentStatus);
  console.log('🔍 Order payment method:', order?.paymentMethod);
  console.log('🔍 Is paid?', isPaid);
  console.log('🔍 Is cash selected?', isCashSelected);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading your bill…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">📄</div>
        <h2>Bill Not Found</h2>
        <p>{error}</p>
        <button className="action-btn print-btn" onClick={handleGoBackToMenu}><FaArrowLeft /> Back to Menu</button>
      </div>
    );
  }

  if (!order || !order.items || order.items.length === 0) {
    return (
      <div className="error-container">
        <div className="error-icon">📄</div>
        <h2>No Order Found</h2>
        <p>You haven't placed any order yet.</p>
        <button className="action-btn print-btn" onClick={handleGoBackToMenu}><FaArrowLeft /> Back to Menu</button>
      </div>
    );
  }

  const { subtotal, gst, total } = getDisplayTotals();

  return (
    <div className="bill-container">
      {/* Toast Notification */}
      {showSuccessPopup && (
        <div className="success-popup-overlay">
          <div className="success-popup">
            <span className="popup-icon">{popupIcon}</span>
            <span className="popup-message">{popupMessage}</span>
            <button className="popup-close" onClick={() => setShowSuccessPopup(false)}><FaTimes /></button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && !isPaid && !isCashSelected && (
        <div className="payment-modal-overlay" onClick={() => { if (!paymentLoading) { setShowPaymentModal(false); setSelectedUpiApp(null); } }}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3><FaWallet /> Complete Payment</h3>
              {!paymentLoading && <button className="close-payment-modal" onClick={() => { setShowPaymentModal(false); setSelectedUpiApp(null); }}><FaTimes /></button>}
            </div>
            <div className="payment-modal-body">
              <div className="order-summary-preview">
                <p><strong>Bill Amount: ₹{formatCurrency(total)}</strong></p>
                <p className="order-id-text">Bill Number: {order.billNumber}</p>
              </div>
              
              <div className="payment-options">
                <button 
                  className={`payment-option-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => { setPaymentMethod('upi'); setSelectedUpiApp(null); }}
                  disabled={paymentLoading}
                >
                  <FaMobileAlt /> Pay via UPI
                </button>
                <button 
                  className={`payment-option-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => { setPaymentMethod('cash'); setSelectedUpiApp(null); }}
                  disabled={paymentLoading}
                >
                  💵 Pay by Cash
                </button>
              </div>
              
              {paymentMethod === 'upi' && (
                <UpiAppSelector 
                  onSelectApp={handleUpiAppSelect}
                  loading={paymentLoading}
                  selectedApp={selectedUpiApp}
                  totalAmount={total}
                  processPayment={handlePayment}
                />
              )}
              
              {paymentMethod === 'cash' && (
                <div className="payment-modal-actions">
                  <button 
                    className="confirm-payment-btn cash-btn"
                    onClick={handlePayment}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? <FaSpinner className="spinner" /> : `Confirm Cash Payment`}
                  </button>
                  <p className="cash-note">💡 You will pay at the counter. Order will be pending until payment is confirmed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAB: Add Items - Only show if not paid and not cash selected */}
      {!isPaid && !isCashSelected && (
        <button className="floating-add-btn" onClick={() => setShowAddItemsModal(true)} title="Add items" disabled={updatingOrder}>
          <FaPlus />
        </button>
      )}

      {/* FAB: Request */}
      <button className="request-fab" onClick={() => setShowRequestMenu(true)} disabled={submittingRequest} title="Request something">
        {submittingRequest ? <FaSpinner className="spinner" /> : <FaCommentDots />}
      </button>

      {/* Request Sheet */}
      {showRequestMenu && (
        <div className="request-menu-overlay" onClick={() => setShowRequestMenu(false)}>
          <div className="request-menu" onClick={(e) => e.stopPropagation()}>
            <div className="request-menu-header">
              <h3>Need something?</h3>
              <button className="close-request-menu" onClick={() => setShowRequestMenu(false)}><FaTimes /></button>
            </div>
            <div className="request-options">
              <button className="request-option water" onClick={() => handleRequestOption('water')}>
                <span className="request-icon"><FaGlassWhiskey /></span>
                <div className="request-text">
                  <span className="request-title">Bottle of Water</span>
                  <span className="request-desc">Request drinking water</span>
                </div>
              </button>
              <button className="request-option tissue" onClick={() => handleRequestOption('tissue')}>
                <span className="request-icon"><FaRegStickyNote /></span>
                <div className="request-text">
                  <span className="request-title">Tissue Paper</span>
                  <span className="request-desc">Request tissue paper</span>
                </div>
              </button>
              <button className="request-option bill" onClick={() => handleRequestOption('bill')}>
                <span className="request-icon"><FaReceipt /></span>
                <div className="request-text">
                  <span className="request-title">Get Bill</span>
                  <span className="request-desc">Request your bill</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bill Card */}
      <div className="bill-card">
        {/* Payment Status Badge */}
        <div className={`payment-status-badge ${isPaid ? 'paid' : isCashSelected ? 'cash-pending' : 'pending'}`}>
          {isPaid ? '✓ Payment Completed' : isCashSelected ? '⏳ Awaiting Cash Payment' : '⏳ Payment Pending'}
        </div>

        {!isPaid && isCashSelected && (
          <div className="payment-warning cash-warning">
            <FaInfoCircle /> Cash payment selected. Please pay at the counter to confirm your order.
          </div>
        )}

        {!isPaid && !isCashSelected && (
          <div className="payment-warning">
            <FaInfoCircle /> Please complete payment for this order.
          </div>
        )}

        {/* Restaurant Header */}
        <div className="restaurant-header">
          <h1 className="restaurant-name">{restaurant?.restaurantName || 'Restaurant'}</h1>
          {getFullAddress() && (
            <div className="restaurant-address"><FaMapMarkerAlt className="icon" /> {getFullAddress()}</div>
          )}
          <div className="restaurant-contact">
            {restaurant?.mobile && <span className="contact-item"><FaPhone className="icon" />{restaurant.mobile}</span>}
            {restaurant?.email && <span className="contact-item"><FaEnvelope className="icon" />{restaurant.email}</span>}
          </div>
        </div>

        {/* Bill Meta */}
        <div className="bill-info">
          <div style={{ display:'flex', justifyContent:'center', marginBottom: 4 }}>
            <span className="bill-number-badge"><FaReceipt style={{ fontSize: 13 }} /> Bill #{order.billNumber}</span>
          </div>
          <div className="bill-info-row">
            <span className="bill-label">📅 Date</span>
            <span className="bill-value">{order.date}</span>
            <span className="bill-label" style={{ marginLeft: 8 }}>🕒</span>
            <span className="bill-value">{order.time}</span>
          </div>
          <div className="bill-info-row">
            <span className="bill-label">👤</span>
            <span className="bill-value">{order.customerName || 'Guest'}</span>
            <span className="bill-label" style={{ marginLeft: 8 }}>🪑</span>
            <span className="bill-value">{order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}</span>
          </div>
          {order.customerPhone && (
            <div className="bill-info-row">
              <span className="bill-label">📞</span>
              <span className="bill-value">{order.customerPhone}</span>
            </div>
          )}
          <div className="bill-info-row">
            <span className="bill-label">💰 GST</span>
            <span className="bill-value">{gstPercentage}%</span>
            {restaurant?.gstNumber && (
              <>
                <span className="bill-label" style={{ marginLeft: 8 }}>GSTIN</span>
                <span className="bill-value">{restaurant.gstNumber}</span>
              </>
            )}
          </div>
          {restaurant?.foodLicense && (
            <div className="bill-info-row">
              <span className="bill-label">✅ FSSAI</span>
              <span className="bill-value">{restaurant.foodLicense}</span>
            </div>
          )}
        </div>

        {/* Items Table with Remove Button */}
        <div className="items-container">
          <table className="items-table">
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                const itemTotal = item.total || item.price * item.quantity;
                return (
                  <tr key={idx}>
                    <td className="item-name">{item.name}</td>
                    <td className="item-qty">{item.quantity}</td>
                    <td className="item-price">₹{formatCurrency(item.price)}</td>
                    <td className="item-total">₹{formatCurrency(itemTotal)}</td>
                   
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="totals">
          <div className="total-row"><span>Subtotal</span><span>₹{formatCurrency(subtotal)}</span></div>
          <div className="total-row"><span>GST ({gstPercentage}%)</span><span>₹{formatCurrency(gst)}</span></div>
          <div className="total-row grand-total"><span><strong>Grand Total</strong></span><span><strong>₹{formatCurrency(total)}</strong></span></div>
        </div>

        {/* Payment Details Section */}
        <div className="payment-details">
          <h3>Payment Details</h3>
          <div className="payment-info-row">
            <span>Payment Method:</span>
            <span className={`payment-method ${order?.paymentMethod}`}>
              {order?.paymentMethod === 'cash' && '💵 Cash (Pending Confirmation)'}
              {order?.paymentMethod === 'upi' && '💳 UPI / Card (Paid)'}
              {(!order?.paymentMethod || order?.paymentMethod === 'pending') && '⏳ Not Selected'}
            </span>
          </div>
          <div className="payment-info-row">
            <span>Payment Status:</span>
            <span className={`payment-status ${order?.paymentStatus}`}>
              {order?.paymentStatus === 'paid' && '✅ Paid'}
              {order?.paymentStatus === 'pending' && order?.paymentMethod === 'cash' && '⏳ Waiting for Cash Payment at Counter'}
              {order?.paymentStatus === 'pending' && order?.paymentMethod !== 'cash' && '⏳ Pending'}
            </span>
          </div>
          {order?.paymentCompletedAt && (
            <div className="payment-info-row">
              <span>Paid At:</span>
              <span>{new Date(order.paymentCompletedAt).toLocaleString()}</span>
            </div>
          )}
          {order?.razorpayPaymentId && (
            <div className="payment-info-row">
              <span>Transaction ID:</span>
              <span className="transaction-id">{order.razorpayPaymentId}</span>
            </div>
          )}
        </div>

        {/* Thank You */}
        <div className="thank-you">
          <p>Thank you for dining with us!</p>
          <p>Please visit again.</p>
        </div>

        {/* Actions */}
        <div className="action-buttons">
          {!isPaid && !isCashSelected && (
            <button className="action-btn pay-btn" onClick={() => setShowPaymentModal(true)} disabled={updatingOrder}>
              <FaWallet /> Pay Now ₹{formatCurrency(total)}
            </button>
          )}
          {!isPaid && isCashSelected && (
            <button className="action-btn cash-pending-btn" disabled>
              <FaWallet /> Cash Payment Pending at Counter
            </button>
          )}
          <button className="action-btn refresh-btn" onClick={refreshOrderData}>
            🔄 Refresh Status
          </button>
          <button className="action-btn print-btn" onClick={handleDownloadPDF}>
            <FaDownload /> Download PDF
          </button>
          <button className="action-btn share-btn" onClick={() => {
            const msg = `*${restaurant?.restaurantName || 'Restaurant'}*\nBill No: ${order.billNumber}\nDate: ${order.date} | Time: ${order.time}\nCustomer: ${order.customerName || 'Guest'} | Mobile: ${order.customerPhone || 'N/A'} | Table: ${order.tableNumber || 'Takeaway'}\n--------------------------------\n${order.items.map(i => `${i.name} x${i.quantity} = ₹${(i.price * i.quantity).toFixed(2)}`).join('\n')}\n--------------------------------\nSubtotal: ₹${formatCurrency(subtotal)}\nGST (${gstPercentage}%): ₹${formatCurrency(gst)}\n*Grand Total: ₹${formatCurrency(total)}*\n\nPayment: ${isPaid ? 'PAID' : isCashSelected ? 'CASH PENDING' : 'PENDING'}\n📍 ${getFullAddress()}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          }}>
            <FaWhatsapp /> Share
          </button>
        </div>
      </div>

      {/* Add Items Modal */}
      {showAddItemsModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="add-items-modal-new" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-new">
              <h3>Add Items to Bill #{order.billNumber}</h3>
              <button className="close-modal-btn-new" onClick={closeAddModal} disabled={addingItems}><FaTimes /></button>
            </div>
            <div className="modal-content-new">
              {!isPaid && !isCashSelected && (
                <div className="add-items-warning">
                  <FaInfoCircle /> Adding items will update your bill total.
                </div>
              )}
              {isCashSelected && (
                <div className="add-items-warning cash-warning">
                  <FaInfoCircle /> Cannot add items after selecting cash payment. Please contact staff.
                </div>
              )}
              <div className="search-container-new">
                <FaSearch className="search-icon-new" />
                <input type="text" placeholder="Search menu…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input-new" />
                {searchTerm && <button className="clear-search-new" onClick={() => setSearchTerm('')}><FaTimes /></button>}
              </div>
              <div className="categories-container-new">
                <button className={`category-chip-new ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All ({menuItems.length})</button>
                {categories.map((cat, idx) => (
                  <button key={idx} className={`category-chip-new ${activeCategory === cat.toLowerCase() ? 'active' : ''}`} onClick={() => setActiveCategory(cat.toLowerCase())}>
                    {getCategoryDisplayName(cat)} ({menuItems.filter((i) => i.category?.trim().toLowerCase() === cat.toLowerCase()).length})
                  </button>
                ))}
              </div>
              <div className="menu-items-grid-new">
                {filteredItems.length > 0 ? filteredItems.map((item) => {
                  const qty = getItemQuantity(item._id);
                  const imageUrl = getImageUrl(item.image);
                  const hasImage = imageUrl && !imageErrors[item._id];
                  return (
                    <div key={item._id} className="menu-item-card-new">
                      <div className="item-image-wrapper-new">
                        {hasImage ? <img src={imageUrl} alt={item.name} className="item-image-new" onError={() => handleImageError(item._id)} loading="lazy" /> :
                          <div className="image-fallback-new"><FaUtensils className="fallback-icon-new" /><span className="fallback-text-new">{getInitials(item.name)}</span></div>}
                        <div className={`item-type-badge-new ${item.type === 'Veg' ? 'veg' : 'non-veg'}`}>{item.type === 'Veg' ? '● Veg' : '● Non-Veg'}</div>
                      </div>
                      <div className="item-details-new">
                        <div className="item-header-new"><h3 className="item-name-new">{item.name}</h3><span className="item-price-new">₹{Number(item.price).toFixed(2)}</span></div>
                        <div className="item-category-new"><span className="category-badge-new">{item.category || 'Uncategorized'}</span></div>
                        <div className="item-actions-new">
                          <button className="quantity-btn-new" onClick={() => removeMenuItemFromOrder(item._id)} disabled={qty === 0 || addingItems || isCashSelected}>−</button>
                          <span className="quantity-new">{qty}</span>
                          <button className="quantity-btn-new" onClick={() => addMenuItemToOrder(item)} disabled={addingItems || isCashSelected}>+</button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="no-items-new"><p>No menu items found</p>{(searchTerm || activeCategory !== 'all') && <button className="clear-filters-btn-new" onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>Clear Filters</button>}</div>
                )}
              </div>
              {newItems.length > 0 && !isCashSelected && (
                <div className="new-items-summary-new">
                  <h4>Items to Add</h4>
                  {newItems.map((item, idx) => (
                    <div key={idx} className="new-item-row-new">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{formatCurrency(item.total)}</span>
                      <button className="remove-new-item" onClick={() => removeNewItem(item.itemId)}>✕</button>
                    </div>
                  ))}
                  <div className="new-total-new">
                    <span>Additional Total</span>
                    <span>₹{formatCurrency(getNewItemsTotal())}</span>
                  </div>
                  <div className="new-grand-total">
                    <span>New Bill Total</span>
                    <span>₹{formatCurrency(total + getNewItemsTotal())}</span>
                  </div>
                </div>
              )}
              <div className="modal-actions-new">
                <button className="modal-cancel-new" onClick={closeAddModal} disabled={addingItems}>Cancel</button>
                {!isCashSelected && (
                  <button className="modal-confirm-new" onClick={handleSaveNewItems} disabled={newItems.length === 0 || addingItems}>
                    {addingItems ? 'Adding…' : `Add ${newItems.length} Item${newItems.length !== 1 ? 's' : ''}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Section - Only show after payment */}
      {order.paymentStatus === 'paid' && !feedbackSubmitted && (
        <div className="feedback-section">
          {!showFeedbackForm ? (
            <button className="feedback-btn" onClick={() => setShowFeedbackForm(true)}><FaStar /> Rate Your Experience</button>
          ) : (
            <div className="feedback-form">
              <h3>Rate Your Experience</h3>
              {['serviceRating', 'foodRating', 'cleanlinessRating'].map((key, idx) => {
                const labels = ['Service Quality', 'Food Quality', 'Cleanliness'];
                return (
                  <div className="rating-group" key={key}>
                    <label>{labels[idx]}</label>
                    <StarRating rating={feedbackForm[key]} onRatingChange={handleStarClick} category={key} />
                  </div>
                );
              })}
              <textarea value={feedbackForm.comments} onChange={(e) => setFeedbackForm((prev) => ({ ...prev, comments: e.target.value }))} placeholder="Share your thoughts…" rows={3} />
              <div className="feedback-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowFeedbackForm(false)}>Cancel</button>
                <button type="button" className="submit-btn" onClick={handleFeedbackSubmit} disabled={submittingFeedback}>{submittingFeedback ? 'Submitting…' : 'Submit Feedback'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {order.paymentStatus === 'paid' && feedbackSubmitted && (
        <div className="feedback-success"><FaCheckCircle className="success-icon" /><h3>Thank You for Your Feedback!</h3></div>
      )}
    </div>
  );
};

export default MyOrderPage;