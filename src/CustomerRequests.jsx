//import React, { useEffect, useState, useRef } from 'react';
//import axios from 'axios';
//import { useParams, useNavigate } from 'react-router-dom';
//import {
//  FaSignOutAlt,
//  FaTimes,
//  FaCheckDouble,
//  FaCheckCircle,
//  FaReply,
//  FaCommentDots,
//  FaBars,
//  FaTimesCircle,
//  FaWallet,
//  FaReceipt,
//  FaSpinner,
//  FaClock,
//  FaUser,
//  FaChair,
//  FaChartLine,
//  FaChevronDown,
//  FaChevronUp,
//  FaReplyAll,
//  FaSearch,
//  FaVolumeUp,
//  FaBell,
//  FaMicrophone,
//  FaVolumeMute
//} from 'react-icons/fa';
//import './CustomerRequests.css';
//
//const CustomerRequests = () => {
//  const { restaurantSlug } = useParams();
//  const navigate = useNavigate();
//  
//  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
//  
//  const [customerRequests, setCustomerRequests] = useState([]);
//  const [filteredRequests, setFilteredRequests] = useState([]);
//  const [requestsStats, setRequestsStats] = useState(null);
//  const [loading, setLoading] = useState(true);
//  const [selectedRequest, setSelectedRequest] = useState(null);
//  const [showResponseModal, setShowResponseModal] = useState(false);
//  const [staffResponse, setStaffResponse] = useState('');
//  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//  const [restaurantData, setRestaurantData] = useState(null);
//  const [showPopup, setShowPopup] = useState(false);
//  const [popupMessage, setPopupMessage] = useState('');
//  const [popupType, setPopupType] = useState('success');
//  const [expandedSections, setExpandedSections] = useState({
//    stats: true,
//    requests: true
//  });
//  
//  // Sound and Voice settings
//  const [voiceEnabled, setVoiceEnabled] = useState(true);
//  const [selectedVoice, setSelectedVoice] = useState(null);
//  const [availableVoices, setAvailableVoices] = useState([]);
//  const [showSoundNotification, setShowSoundNotification] = useState(false);
//  const [lastPlayedRequest, setLastPlayedRequest] = useState(null);
//  const [isSpeaking, setIsSpeaking] = useState(false);
//  
//  // Search state
//  const [searchTable, setSearchTable] = useState('');
//  
//  const refreshInterval = useRef(null);
//  const previousRequestsRef = useRef([]);
//  const messagesEndRef = useRef(null);
//  const speechSynthesisRef = useRef(null);
//
//  // Initialize speech synthesis
//  const initSpeechSynthesis = () => {
//    if (window.speechSynthesis) {
//      speechSynthesisRef.current = window.speechSynthesis;
//      loadVoices();
//      
//      // Load voices when they change
//      window.speechSynthesis.onvoiceschanged = () => {
//        loadVoices();
//      };
//    }
//  };
//
//  // Load available voices
//  const loadVoices = () => {
//    if (window.speechSynthesis) {
//      const voices = window.speechSynthesis.getVoices();
//      setAvailableVoices(voices);
//      
//      // Find a good Indian English or clear English voice
//      const preferredVoice = voices.find(voice => 
//        voice.lang.includes('en-IN') || 
//        voice.lang.includes('en-GB') || 
//        voice.name.includes('Google UK') ||
//        voice.name.includes('Samantha')
//      );
//      setSelectedVoice(preferredVoice || voices[0]);
//    }
//  };
//
//  // Speak text function
//  const speakText = (text, requestType, tableNumber, customerName) => {
//    if (!voiceEnabled) return;
//    
//    // Cancel any ongoing speech
//    if (speechSynthesisRef.current) {
//      speechSynthesisRef.current.cancel();
//    }
//    
//    setIsSpeaking(true);
//    
//    // Create different message formats based on request type
//    let message = '';
//    switch(requestType) {
//      case 'water':
//        message = `Attention! Table number ${tableNumber}, ${customerName} wants water. Please send water to table ${tableNumber}.`;
//        break;
//      case 'tissue':
//        message = `Attention! Table number ${tableNumber}, ${customerName} needs tissue paper. Please provide tissue at table ${tableNumber}.`;
//        break;
//      case 'bill':
//        message = `Attention! Table number ${tableNumber}, ${customerName} requested the bill. Please prepare bill for table ${tableNumber}.`;
//        break;
//      default:
//        message = `New request from table number ${tableNumber}, ${customerName}. ${text}`;
//    }
//    
//    // Create utterance
//    const utterance = new SpeechSynthesisUtterance(message);
//    
//    // Select voice
//    if (selectedVoice) {
//      utterance.voice = selectedVoice;
//    }
//    
//    // Set properties for better clarity
//    utterance.rate = 0.9;      // Slightly slower for clarity
//    utterance.pitch = 1.1;     // Slightly higher pitch
//    utterance.volume = 1;      // Full volume
//    
//    // Add event handlers
//    utterance.onstart = () => {
//      console.log('🔊 Speaking:', message);
//      setShowSoundNotification(true);
//      setTimeout(() => setShowSoundNotification(false), 4000);
//    };
//    
//    utterance.onend = () => {
//      console.log('🔊 Speaking finished');
//      setIsSpeaking(false);
//    };
//    
//    utterance.onerror = (event) => {
//      console.error('Speech error:', event);
//      setIsSpeaking(false);
//    };
//    
//    // Speak
//    speechSynthesisRef.current.speak(utterance);
//  };
//
//  // Play beep sound as additional alert
//  const playBeepSound = (frequency, duration, type = 'sine') => {
//    try {
//      if (!window.AudioContext && !window.webkitAudioContext) return;
//      
//      const AudioCtx = window.AudioContext || window.webkitAudioContext;
//      const audioCtx = new AudioCtx();
//      
//      const oscillator = audioCtx.createOscillator();
//      const gainNode = audioCtx.createGain();
//      
//      oscillator.connect(gainNode);
//      gainNode.connect(audioCtx.destination);
//      
//      oscillator.frequency.value = frequency;
//      oscillator.type = type;
//      
//      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
//      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
//      
//      oscillator.start();
//      oscillator.stop(audioCtx.currentTime + duration);
//      
//      // Clean up
//      setTimeout(() => audioCtx.close(), duration * 1000);
//    } catch (err) {
//      console.log('Beep error:', err);
//    }
//  };
//
//  // Alert for new request with voice
//  const announceNewRequest = (request) => {
//    setLastPlayedRequest(request);
//    
//    // Play beep sound first
//    playBeepSound(800, 0.2, 'sine');
//    setTimeout(() => playBeepSound(1000, 0.2, 'sine'), 200);
//    
//    // Then speak the message
//    setTimeout(() => {
//      speakText(
//        request.requestMessage,
//        request.requestType,
//        request.tableNumber,
//        request.customerName
//      );
//    }, 300);
//    
//    // Show browser notification
//    if (Notification.permission === 'granted') {
//      const notificationMessage = `Table ${request.tableNumber} (${request.customerName}) requested ${request.requestType}`;
//      new Notification(`🔔 New Request`, {
//        body: notificationMessage,
//        icon: '/favicon.ico',
//        tag: request._id
//      });
//    }
//  };
//
//  // Get today's date in YYYY-MM-DD format
//  const getTodayDate = () => {
//    const today = new Date();
//    const year = today.getFullYear();
//    const month = String(today.getMonth() + 1).padStart(2, '0');
//    const day = String(today.getDate()).padStart(2, '0');
//    return `${year}-${month}-${day}`;
//  };
//
//  // Check if a date is today
//  const isToday = (dateString) => {
//    const today = getTodayDate();
//    const requestDate = new Date(dateString).toISOString().split('T')[0];
//    return requestDate === today;
//  };
//
//  // Show popup notification
//  const showPopupNotification = (message, type = 'success') => {
//    setPopupMessage(message);
//    setPopupType(type);
//    setShowPopup(true);
//    setTimeout(() => {
//      setShowPopup(false);
//    }, 3000);
//  };
//
//  // Test voice functionality
//  const testVoice = () => {
//    speakText(
//      "This is a test message. Voice notifications are working properly.",
//      "test",
//      "1",
//      "Test"
//    );
//    showPopupNotification('🔊 Testing voice notification...', 'info');
//  };
//
//  useEffect(() => {
//    checkAuthentication();
//    initSpeechSynthesis();
//    
//    // Request notification permission on mount
//    if (Notification.permission === 'default') {
//      Notification.requestPermission();
//    }
//  }, []);
//
//  const checkAuthentication = () => {
//    const userRole = localStorage.getItem('userRole');
//    const userRestaurantSlug = localStorage.getItem('restaurantSlug');
//    const token = localStorage.getItem('token');
//    
//    if (!token) {
//      navigate('/');
//      return;
//    }
//    
//    if (userRole !== 'billing' && userRole !== 'owner') {
//      navigate('/');
//      return;
//    }
//    
//    if (userRestaurantSlug !== restaurantSlug) {
//      navigate('/');
//      return;
//    }
//  };
//
//  useEffect(() => {
//    if (restaurantSlug) {
//      fetchRestaurantData();
//      fetchCustomerRequests();
//      startAutoRefresh();
//    }
//    
//    return () => {
//      if (refreshInterval.current) {
//        clearInterval(refreshInterval.current);
//      }
//      if (speechSynthesisRef.current) {
//        speechSynthesisRef.current.cancel();
//      }
//    };
//  }, [restaurantSlug]);
//
//  // Filter requests when search term changes
//  useEffect(() => {
//    if (searchTable.trim()) {
//      const filtered = customerRequests.filter(request => 
//        request.tableNumber && 
//        request.tableNumber.toString().toLowerCase().includes(searchTable.toLowerCase())
//      );
//      setFilteredRequests(filtered);
//    } else {
//      setFilteredRequests(customerRequests);
//    }
//  }, [searchTable, customerRequests]);
//
//  // Auto-scroll to bottom when new messages arrive
//  useEffect(() => {
//    if (messagesEndRef.current) {
//      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
//    }
//  }, [filteredRequests]);
//
//  const startAutoRefresh = () => {
//    if (refreshInterval.current) {
//      clearInterval(refreshInterval.current);
//    }
//    
//    refreshInterval.current = setInterval(() => {
//      checkForNewRequests();
//    }, 5000);
//  };
//
//  const checkForNewRequests = async () => {
//    try {
//      const token = localStorage.getItem('token');
//      const response = await axios.get(
//        `${API_URL}/api/order/customer-request/list/${restaurantSlug}`,
//        { headers: { 'Authorization': `Bearer ${token}` } }
//      );
//      
//      if (response.data.success) {
//        const allRequests = response.data.requests;
//        const todayRequests = allRequests.filter(req => isToday(req.requestedAt));
//        const sortedRequests = [...todayRequests].sort((a, b) => 
//          new Date(b.requestedAt) - new Date(a.requestedAt)
//        );
//        const oldTodayRequests = previousRequestsRef.current;
//        
//        // Find new pending requests
//        const newPendingRequests = sortedRequests.filter(
//          newReq => 
//            newReq.status === 'pending' && 
//            !oldTodayRequests.some(oldReq => oldReq._id === newReq._id)
//        );
//        
//        if (newPendingRequests.length > 0) {
//          // Announce each new request with voice
//          newPendingRequests.forEach(request => {
//            announceNewRequest(request);
//          });
//          
//          showPopupNotification(`${newPendingRequests.length} new request${newPendingRequests.length > 1 ? 's' : ''} received!`, 'info');
//          setCustomerRequests(sortedRequests);
//          setFilteredRequests(sortedRequests);
//          const stats = {
//            total: sortedRequests.length,
//            pending: sortedRequests.filter(r => r.status === 'pending').length,
//            acknowledged: sortedRequests.filter(r => r.status === 'acknowledged').length,
//            completed: sortedRequests.filter(r => r.status === 'completed').length
//          };
//          setRequestsStats(stats);
//        }
//        
//        previousRequestsRef.current = sortedRequests;
//      }
//    } catch (err) {
//      console.error('Error checking for new requests:', err);
//    }
//  };
//
//  const fetchRestaurantData = async () => {
//    try {
//      const token = localStorage.getItem('token');
//      const response = await axios.get(
//        `${API_URL}/api/restaurant/by-slug/${restaurantSlug}`,
//        { headers: { 'Authorization': `Bearer ${token}` } }
//      );
//      
//      if (response.data) {
//        setRestaurantData(response.data);
//      }
//    } catch (err) {
//      console.error('Error fetching restaurant info:', err);
//      setRestaurantData({
//        restaurantName: localStorage.getItem('restaurantName') || restaurantSlug,
//        restaurantCode: localStorage.getItem('restaurantCode') || 'N/A'
//      });
//    }
//  };
//
//  const fetchCustomerRequests = async () => {
//    try {
//      setLoading(true);
//      const token = localStorage.getItem('token');
//      
//      const response = await axios.get(
//        `${API_URL}/api/order/customer-request/list/${restaurantSlug}`,
//        { headers: { 'Authorization': `Bearer ${token}` } }
//      );
//      
//      if (response.data.success) {
//        const allRequests = response.data.requests;
//        const todayRequests = allRequests.filter(req => isToday(req.requestedAt));
//        const sortedRequests = [...todayRequests].sort((a, b) => 
//          new Date(b.requestedAt) - new Date(a.requestedAt)
//        );
//        
//        setCustomerRequests(sortedRequests);
//        setFilteredRequests(sortedRequests);
//        
//        const stats = {
//          total: sortedRequests.length,
//          pending: sortedRequests.filter(r => r.status === 'pending').length,
//          acknowledged: sortedRequests.filter(r => r.status === 'acknowledged').length,
//          completed: sortedRequests.filter(r => r.status === 'completed').length
//        };
//        setRequestsStats(stats);
//        previousRequestsRef.current = sortedRequests;
//      }
//    } catch (err) {
//      console.error('Error fetching customer requests:', err);
//      showPopupNotification('Failed to fetch requests', 'error');
//    } finally {
//      setLoading(false);
//    }
//  };
//
//  const updateRequestStatus = async (requestId, status, responseMsg = '') => {
//    try {
//      const token = localStorage.getItem('token');
//      
//      const updateData = { status };
//      if (responseMsg) {
//        updateData.staffResponse = responseMsg;
//      }
//      
//      await axios.put(
//        `${API_URL}/api/order/customer-request/update/${requestId}`,
//        updateData,
//        { headers: { 'Authorization': `Bearer ${token}` } }
//      );
//      
//      await fetchCustomerRequests();
//      
//      const statusMessages = {
//        acknowledged: 'Request acknowledged',
//        completed: 'Request completed',
//        cancelled: 'Request cancelled'
//      };
//      showPopupNotification(`✅ ${statusMessages[status] || 'Request updated'}`, 'success');
//      
//    } catch (err) {
//      console.error('Error updating request:', err);
//      showPopupNotification('Failed to update request', 'error');
//    }
//  };
//
//  const handleAcknowledgeWithResponse = async () => {
//    if (staffResponse.trim() && selectedRequest) {
//      await updateRequestStatus(selectedRequest._id, 'acknowledged', staffResponse);
//      setShowResponseModal(false);
//      setStaffResponse('');
//      setSelectedRequest(null);
//    } else {
//      showPopupNotification('Please enter a response message', 'error');
//    }
//  };
//
//  const handleManualRefresh = () => {
//    fetchCustomerRequests();
//    showPopupNotification('Refreshed successfully', 'success');
//  };
//
//  const clearSearch = () => {
//    setSearchTable('');
//    showPopupNotification('Search cleared', 'info');
//  };
//
//  const handleNavigateToBorder = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/border`);
//  };
//  
//  const handleNavigateToTotalBill = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/totalbill`);
//  };
//
//  const handleNavigateToCustomerRequests = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/customer-requests`);
//  };
//
//  const handleLogout = () => {
//    if (refreshInterval.current) {
//      clearInterval(refreshInterval.current);
//    }
//    if (speechSynthesisRef.current) {
//      speechSynthesisRef.current.cancel();
//    }
//    localStorage.clear();
//    sessionStorage.clear();
//    navigate("/", { replace: true });
//    setTimeout(() => {
//      window.location.href = "/";
//    }, 50);
//  };
//
//  const getRequestIcon = (type) => {
//    switch(type) {
//      case 'water': return '💧';
//      case 'tissue': return '🧻';
//      case 'bill': return '🧾';
//      default: return '💬';
//    }
//  };
//
//  const getRequestTitle = (type) => {
//    switch(type) {
//      case 'water': return 'Water Request';
//      case 'tissue': return 'Tissue Request';
//      case 'bill': return 'Bill Request';
//      default: return 'Request';
//    }
//  };
//
//  const toggleSection = (section) => {
//    setExpandedSections(prev => ({
//      ...prev,
//      [section]: !prev[section]
//    }));
//  };
//
//  const navItems = [
//    { icon: FaWallet, label: 'Border', action: handleNavigateToBorder },
//    { icon: FaReceipt, label: 'Total Bill', action: handleNavigateToTotalBill },
//    { icon: FaCommentDots, label: 'Customer Requests', action: handleNavigateToCustomerRequests, active: true },
//  ];
//
//  const formattedDate = new Date().toLocaleDateString('en-IN', {
//    day: '2-digit',
//    month: '2-digit',
//    year: 'numeric'
//  });
//
//  const pendingCount = requestsStats?.pending || 0;
//  const completedCount = requestsStats?.completed || 0;
//  const totalCount = filteredRequests.length;
//
//  return (
//    <div className="customer-requests-container">
//      {/* Voice Notification Banner */}
//      {showSoundNotification && lastPlayedRequest && (
//        <div className="voice-notification-banner">
//          <div className="voice-notification-content">
//            <FaMicrophone className="voice-icon-animate" />
//            <div className="voice-message">
//              <span className="voice-label">🔊 Speaking:</span>
//              <span className="voice-text">
//                Table {lastPlayedRequest.tableNumber}, {lastPlayedRequest.customerName} wants {lastPlayedRequest.requestType}
//              </span>
//            </div>
//          </div>
//        </div>
//      )}
//
//      {/* Popup Notification */}
//      {showPopup && (
//        <div className="popup-overlay">
//          <div className={`popup-notification ${popupType}`}>
//            <div className="popup-icon">
//              {popupType === 'success' && '✅'}
//              {popupType === 'error' && '❌'}
//              {popupType === 'info' && 'ℹ️'}
//            </div>
//            <div className="popup-content">
//              <p>{popupMessage}</p>
//            </div>
//            <button className="popup-close-btn" onClick={() => setShowPopup(false)}>
//              <FaTimes />
//            </button>
//          </div>
//        </div>
//      )}
//
//      {/* Mobile Menu Toggle */}
//      <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
//        {mobileMenuOpen ? <FaTimesCircle /> : <FaBars />}
//      </button>
//
//      {/* Mobile Navigation Overlay */}
//      {mobileMenuOpen && (
//        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
//          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
//            <div className="mobile-nav-header">
//              <h3>Menu</h3>
//              <button onClick={() => setMobileMenuOpen(false)}><FaTimes /></button>
//            </div>
//            {navItems.map((item, index) => (
//              <button key={index} className={`mobile-nav-item ${item.active ? 'active' : ''}`} onClick={item.action}>
//                <item.icon /> {item.label}
//              </button>
//            ))}
//            <button className="mobile-nav-item logout" onClick={handleLogout}>
//              <FaSignOutAlt /> Logout
//            </button>
//          </div>
//        </div>
//      )}
//
//      {/* Header */}
//      <div className="requests-header">
//        <div className="header-content">
//          <h1><FaCommentDots /> Customer Messages</h1>
//          <p className="subtitle">{restaurantData?.restaurantName} • {restaurantData?.restaurantCode}</p>
//        </div>
//        <div className="header-right desktop-only">
//          {/* Voice Toggle Button */}
//          <button 
//            className={`voice-toggle-btn ${voiceEnabled ? 'enabled' : 'disabled'}`}
//            onClick={() => setVoiceEnabled(!voiceEnabled)}
//            title={voiceEnabled ? 'Voice Notifications On' : 'Voice Notifications Off'}
//          >
//            {voiceEnabled ? <FaMicrophone /> : <FaVolumeMute />} 
//            {voiceEnabled ? 'Voice On' : 'Voice Off'}
//          </button>
//          
//          {/* Test Voice Button */}
//          <button className="test-voice-btn" onClick={testVoice} title="Test Voice">
//            <FaVolumeUp /> Test Voice
//          </button>
//          
//          {/* Voice Selector Dropdown */}
//          {availableVoices.length > 0 && (
//            <select 
//              className="voice-selector"
//              value={selectedVoice?.name || ''}
//              onChange={(e) => {
//                const voice = availableVoices.find(v => v.name === e.target.value);
//                setSelectedVoice(voice);
//              }}
//              title="Select Voice"
//            >
//              {availableVoices.map(voice => (
//                <option key={voice.name} value={voice.name}>
//                  {voice.name} ({voice.lang})
//                </option>
//              ))}
//            </select>
//          )}
//          
//          <button className="refresh-btn" onClick={handleManualRefresh}>
//            <FaSpinner /> Refresh
//          </button>
//          <button className="logout-button" onClick={handleLogout}>
//            <FaSignOutAlt /> Logout
//          </button>
//        </div>
//      </div>
//
//      {/* Desktop Navigation Tabs */}
//      <div className="navigation-tabs desktop-only">
//        <button className="nav-tab" onClick={handleNavigateToBorder}><FaWallet /> Border</button>
//        <button className="nav-tab" onClick={handleNavigateToTotalBill}><FaReceipt /> Total Bill</button>
//        <button className="nav-tab active" onClick={handleNavigateToCustomerRequests}><FaCommentDots /> Customer Messages</button>
//      </div>
//
//      {/* Statistics Section */}
//      <div className="summary-section">
//        <div className="section-header" onClick={() => toggleSection('stats')}>
//          <h2><FaChartLine /> Messages Statistics</h2>
//          <button className="expand-toggle">
//            {expandedSections.stats ? <FaChevronUp /> : <FaChevronDown />}
//          </button>
//        </div>
//        
//        {expandedSections.stats && (
//          <div className="summary-cards">
//            <div className="stat-card">
//              <div className="stat-icon">💬</div>
//              <div className="stat-content">
//                <h3>Total Messages</h3>
//                <p className="stat-number">{totalCount}</p>
//              </div>
//            </div>
//            
//            <div className="stat-card pending-stat">
//              <div className="stat-icon">⏳</div>
//              <div className="stat-content">
//                <h3>Pending</h3>
//                <p className="stat-number">{pendingCount}</p>
//              </div>
//            </div>
//            
//            <div className="stat-card completed-stat">
//              <div className="stat-icon">✅</div>
//              <div className="stat-content">
//                <h3>Completed</h3>
//                <p className="stat-number">{completedCount}</p>
//              </div>
//            </div>
//            
//            <div className="stat-card date-stat">
//              <div className="stat-icon">📅</div>
//              <div className="stat-content">
//                <h3>Today's Date</h3>
//                <p className="stat-number date-value">{formattedDate}</p>
//              </div>
//            </div>
//          </div>
//        )}
//      </div>
//
//      {/* Search Bar for Table Number */}
//      <div className="search-section">
//        <div className="search-container-requests">
//          <FaSearch className="search-icon-requests" />
//          <input
//            type="text"
//            placeholder="Search by table number..."
//            value={searchTable}
//            onChange={(e) => setSearchTable(e.target.value)}
//            className="search-input-requests"
//          />
//          {searchTable && (
//            <button className="clear-search-requests" onClick={clearSearch}>
//              <FaTimes />
//            </button>
//          )}
//        </div>
//        {searchTable && filteredRequests.length === 0 && customerRequests.length > 0 && (
//          <div className="no-search-results">
//            No requests found for Table {searchTable}
//          </div>
//        )}
//      </div>
//
//      {/* Voice Status Indicator */}
//      <div className={`voice-status ${voiceEnabled ? 'active' : 'inactive'}`}>
//        {voiceEnabled ? (
//          <span><FaMicrophone /> Voice notifications are ACTIVE - New requests will be read aloud</span>
//        ) : (
//          <span><FaVolumeMute /> Voice notifications are OFF - Click "Voice On" to enable</span>
//        )}
//      </div>
//
//      {/* Messages Feed */}
//      <div className="summary-section">
//        <div className="section-header" onClick={() => toggleSection('requests')}>
//          <h2><FaCommentDots /> Message Feed</h2>
//          <div className="header-actions">
//            <button className="refresh-btn-small" onClick={handleManualRefresh}>
//              <FaSpinner /> Refresh
//            </button>
//            <button className="expand-toggle">
//              {expandedSections.requests ? <FaChevronUp /> : <FaChevronDown />}
//            </button>
//          </div>
//        </div>
//        
//        {expandedSections.requests && (
//          <div className="messages-feed">
//            {loading ? (
//              <div className="loading-state">
//                <div className="spinner"></div>
//                <p>Loading messages...</p>
//              </div>
//            ) : filteredRequests.length === 0 ? (
//              <div className="empty-state">
//                <div className="empty-icon">💬</div>
//                <h3>{searchTable ? `No Requests for Table ${searchTable}` : 'No Messages Today'}</h3>
//                <p>{searchTable ? `No customer messages found for table number ${searchTable}` : 'No customer messages have been received today'}</p>
//                {searchTable && (
//                  <button className="clear-search-btn" onClick={clearSearch}>
//                    Clear Search
//                  </button>
//                )}
//                {!searchTable && (
//                  <div className="empty-tips">
//                    <p>📅 Date: {formattedDate}</p>
//                    <p>💡 New messages will appear here automatically</p>
//                    <p>🔊 Voice notifications will read out new requests</p>
//                  </div>
//                )}
//              </div>
//            ) : (
//              <div className="message-feed-container">
//                {filteredRequests.map((request, index) => (
//                  <div 
//                    key={request._id} 
//                    className={`message-thread ${request.status} ${request.status === 'pending' ? 'new-message-pulse' : ''}`}
//                    data-type={request.requestType}
//                  >
//                    {/* Message Header */}
//                    <div className="thread-header">
//                      <div className="customer-avatar">
//                        {getRequestIcon(request.requestType)}
//                      </div>
//                      <div className="thread-info">
//                        <div className="customer-name-row">
//                          <span className="customer-name">{request.customerName}</span>
//                          <span className="table-number">Table {request.tableNumber}</span>
//                        </div>
//                        <div className="message-time">
//                          <FaClock /> {new Date(request.requestedAt).toLocaleTimeString()}
//                        </div>
//                      </div>
//                      <div className={`status-badge ${request.status}`}>
//                        {request.status === 'pending' && '⏳ Pending'}
//                        {request.status === 'acknowledged' && '✓ Acknowledged'}
//                        {request.status === 'completed' && '✅ Completed'}
//                      </div>
//                    </div>
//                    
//                    {/* Customer Message */}
//                    <div className="customer-message">
//                      <div className="message-bubble customer-bubble">
//                        <div className="request-type-label">
//                          {getRequestTitle(request.requestType)}
//                        </div>
//                        <div className="message-text">{request.requestMessage}</div>
//                      </div>
//                    </div>
//                    
//                    {/* Staff Response if exists */}
//                    {request.staffResponse && (
//                      <div className="staff-response">
//                        <div className="response-label">
//                          <FaReplyAll /> Staff Response:
//                        </div>
//                        <div className="message-bubble staff-bubble">
//                          <div className="message-text">{request.staffResponse}</div>
//                          <div className="response-time">
//                            {request.acknowledgedAt ? new Date(request.acknowledgedAt).toLocaleTimeString() : 'Just now'}
//                          </div>
//                        </div>
//                      </div>
//                    )}
//                    
//                    {/* Action Buttons */}
//                    <div className="thread-actions">
//                      {request.status === 'pending' && (
//                        <>
//                          <button 
//                            className="action-btn acknowledge-btn"
//                            onClick={() => {
//                              setSelectedRequest(request);
//                              setShowResponseModal(true);
//                            }}
//                          >
//                            <FaReply /> Reply
//                          </button>
//                          <button 
//                            className="action-btn complete-btn"
//                            onClick={() => updateRequestStatus(request._id, 'completed', 'Request fulfilled')}
//                          >
//                            <FaCheckCircle /> Complete
//                          </button>
//                        </>
//                      )}
//                      {request.status === 'acknowledged' && (
//                        <button 
//                          className="action-btn complete-btn full-width"
//                          onClick={() => updateRequestStatus(request._id, 'completed')}
//                        >
//                          <FaCheckCircle /> Mark as Completed
//                        </button>
//                      )}
//                      {request.status === 'completed' && (
//                        <div className="completed-label">
//                          <FaCheckCircle /> Completed
//                        </div>
//                      )}
//                    </div>
//                  </div>
//                ))}
//                <div ref={messagesEndRef} />
//              </div>
//            )}
//          </div>
//        )}
//      </div>
//
//      {/* Response Modal */}
//      {showResponseModal && selectedRequest && (
//        <div className="modal-overlay" onClick={() => setShowResponseModal(false)}>
//          <div className="response-modal" onClick={e => e.stopPropagation()}>
//            <div className="modal-header">
//              <h3>Reply to {selectedRequest.customerName}</h3>
//              <button className="close-modal-btn" onClick={() => setShowResponseModal(false)}>
//                <FaTimes />
//              </button>
//            </div>
//            <div className="modal-body">
//              <div className="request-info-card">
//                <div className="info-item">
//                  <FaChair /> Table: {selectedRequest.tableNumber}
//                </div>
//                <div className="info-item">
//                  <FaUser /> Customer: {selectedRequest.customerName}
//                </div>
//                <div className="info-item message-preview">
//                  <FaCommentDots /> Message: {selectedRequest.requestMessage}
//                </div>
//              </div>
//              <div className="response-input">
//                <label>Your Reply:</label>
//                <textarea
//                  value={staffResponse}
//                  onChange={(e) => setStaffResponse(e.target.value)}
//                  placeholder="Type your response here..."
//                  rows={3}
//                  autoFocus
//                />
//              </div>
//            </div>
//            <div className="modal-footer">
//              <button className="cancel-btn" onClick={() => setShowResponseModal(false)}>Cancel</button>
//              <button className="send-btn" onClick={handleAcknowledgeWithResponse}>Send Reply</button>
//            </div>
//          </div>
//        </div>
//      )}
//
//      {/* Footer */}
//      <div className="requests-footer">
//        <p>
//          {restaurantData?.restaurantName} • Customer Messages • 
//          <span className="footer-code"> {restaurantData?.restaurantCode}</span> • 
//          Today: {formattedDate}
//        </p>
//        <p className="footer-note">
//          🔊 Voice notifications enabled • Auto-refreshes every 5 seconds • New requests are read aloud
//        </p>
//      </div>
//    </div>
//  );
//};
//
//export default CustomerRequests;
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaSignOutAlt,
  FaTimes,
  FaCheckDouble,
  FaCheckCircle,
  FaReply,
  FaCommentDots,
  FaBars,
  FaTimesCircle,
  FaWallet,
  FaReceipt,
  FaSpinner,
  FaClock,
  FaUser,
  FaChair,
  FaChartLine,
  FaChevronDown,
  FaChevronUp,
  FaReplyAll,
  FaSearch,
  FaVolumeUp,
  FaBell,
  FaMicrophone,
  FaVolumeMute
} from 'react-icons/fa';
import BNavbar from './components/BNavbar';
import './CustomerRequests.css';

const CustomerRequests = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  const [customerRequests, setCustomerRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [requestsStats, setRequestsStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [staffResponse, setStaffResponse] = useState('');
  const [restaurantData, setRestaurantData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('success');
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    requests: true
  });
  
  // Sound and Voice settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [showSoundNotification, setShowSoundNotification] = useState(false);
  const [lastPlayedRequest, setLastPlayedRequest] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Search state
  const [searchTable, setSearchTable] = useState('');
  
  const refreshInterval = useRef(null);
  const previousRequestsRef = useRef([]);
  const messagesEndRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  // Initialize speech synthesis
  const initSpeechSynthesis = () => {
    if (window.speechSynthesis) {
      speechSynthesisRef.current = window.speechSynthesis;
      loadVoices();
      
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
    }
  };

  // Load available voices
  const loadVoices = () => {
    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      const preferredVoice = voices.find(voice => 
        voice.lang.includes('en-IN') || 
        voice.lang.includes('en-GB') || 
        voice.name.includes('Google UK') ||
        voice.name.includes('Samantha')
      );
      setSelectedVoice(preferredVoice || voices[0]);
    }
  };

  // Speak text function
  const speakText = (text, requestType, tableNumber, customerName) => {
    if (!voiceEnabled) return;
    
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    
    setIsSpeaking(true);
    
    let message = '';
    switch(requestType) {
      case 'water':
        message = `Attention! Table number ${tableNumber}, ${customerName} wants water. Please send water to table ${tableNumber}.`;
        break;
      case 'tissue':
        message = `Attention! Table number ${tableNumber}, ${customerName} needs tissue paper. Please provide tissue at table ${tableNumber}.`;
        break;
      case 'bill':
        message = `Attention! Table number ${tableNumber}, ${customerName} requested the bill. Please prepare bill for table ${tableNumber}.`;
        break;
      default:
        message = `New request from table number ${tableNumber}, ${customerName}. ${text}`;
    }
    
    const utterance = new SpeechSynthesisUtterance(message);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    
    utterance.onstart = () => {
      console.log('🔊 Speaking:', message);
      setShowSoundNotification(true);
      setTimeout(() => setShowSoundNotification(false), 4000);
    };
    
    utterance.onend = () => {
      console.log('🔊 Speaking finished');
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      setIsSpeaking(false);
    };
    
    speechSynthesisRef.current.speak(utterance);
  };

  // Play beep sound as additional alert
  const playBeepSound = (frequency, duration, type = 'sine') => {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) return;
      
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
      
      setTimeout(() => audioCtx.close(), duration * 1000);
    } catch (err) {
      console.log('Beep error:', err);
    }
  };

  // Alert for new request with voice
  const announceNewRequest = (request) => {
    setLastPlayedRequest(request);
    
    playBeepSound(800, 0.2, 'sine');
    setTimeout(() => playBeepSound(1000, 0.2, 'sine'), 200);
    
    setTimeout(() => {
      speakText(
        request.requestMessage,
        request.requestType,
        request.tableNumber,
        request.customerName
      );
    }, 300);
    
    if (Notification.permission === 'granted') {
      const notificationMessage = `Table ${request.tableNumber} (${request.customerName}) requested ${request.requestType}`;
      new Notification(`🔔 New Request`, {
        body: notificationMessage,
        icon: '/favicon.ico',
        tag: request._id
      });
    }
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a date is today
  const isToday = (dateString) => {
    const today = getTodayDate();
    const requestDate = new Date(dateString).toISOString().split('T')[0];
    return requestDate === today;
  };

  // Show popup notification
  const showPopupNotification = (message, type = 'success') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  // Test voice functionality
  const testVoice = () => {
    speakText(
      "This is a test message. Voice notifications are working properly.",
      "test",
      "1",
      "Test"
    );
    showPopupNotification('🔊 Testing voice notification...', 'info');
  };

  useEffect(() => {
    checkAuthentication();
    initSpeechSynthesis();
    
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const checkAuthentication = () => {
    const userRole = localStorage.getItem('userRole');
    const userRestaurantSlug = localStorage.getItem('restaurantSlug');
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/');
      return;
    }
    
    if (userRole !== 'billing' && userRole !== 'owner') {
      navigate('/');
      return;
    }
    
    if (userRestaurantSlug !== restaurantSlug) {
      navigate('/');
      return;
    }
  };

  useEffect(() => {
    if (restaurantSlug) {
      fetchRestaurantData();
      fetchCustomerRequests();
      startAutoRefresh();
    }
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, [restaurantSlug]);

  // Filter requests when search term changes
  useEffect(() => {
    if (searchTable.trim()) {
      const filtered = customerRequests.filter(request => 
        request.tableNumber && 
        request.tableNumber.toString().toLowerCase().includes(searchTable.toLowerCase())
      );
      setFilteredRequests(filtered);
    } else {
      setFilteredRequests(customerRequests);
    }
  }, [searchTable, customerRequests]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredRequests]);

  const startAutoRefresh = () => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
    
    refreshInterval.current = setInterval(() => {
      checkForNewRequests();
    }, 5000);
  };

  const checkForNewRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/order/customer-request/list/${restaurantSlug}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const allRequests = response.data.requests;
        const todayRequests = allRequests.filter(req => isToday(req.requestedAt));
        const sortedRequests = [...todayRequests].sort((a, b) => 
          new Date(b.requestedAt) - new Date(a.requestedAt)
        );
        const oldTodayRequests = previousRequestsRef.current;
        
        const newPendingRequests = sortedRequests.filter(
          newReq => 
            newReq.status === 'pending' && 
            !oldTodayRequests.some(oldReq => oldReq._id === newReq._id)
        );
        
        if (newPendingRequests.length > 0) {
          newPendingRequests.forEach(request => {
            announceNewRequest(request);
          });
          
          showPopupNotification(`${newPendingRequests.length} new request${newPendingRequests.length > 1 ? 's' : ''} received!`, 'info');
          setCustomerRequests(sortedRequests);
          setFilteredRequests(sortedRequests);
          const stats = {
            total: sortedRequests.length,
            pending: sortedRequests.filter(r => r.status === 'pending').length,
            acknowledged: sortedRequests.filter(r => r.status === 'acknowledged').length,
            completed: sortedRequests.filter(r => r.status === 'completed').length
          };
          setRequestsStats(stats);
        }
        
        previousRequestsRef.current = sortedRequests;
      }
    } catch (err) {
      console.error('Error checking for new requests:', err);
    }
  };

  const fetchRestaurantData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/restaurant/by-slug/${restaurantSlug}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data) {
        setRestaurantData(response.data);
      }
    } catch (err) {
      console.error('Error fetching restaurant info:', err);
      setRestaurantData({
        restaurantName: localStorage.getItem('restaurantName') || restaurantSlug,
        restaurantCode: localStorage.getItem('restaurantCode') || 'N/A'
      });
    }
  };

  const fetchCustomerRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/order/customer-request/list/${restaurantSlug}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const allRequests = response.data.requests;
        const todayRequests = allRequests.filter(req => isToday(req.requestedAt));
        const sortedRequests = [...todayRequests].sort((a, b) => 
          new Date(b.requestedAt) - new Date(a.requestedAt)
        );
        
        setCustomerRequests(sortedRequests);
        setFilteredRequests(sortedRequests);
        
        const stats = {
          total: sortedRequests.length,
          pending: sortedRequests.filter(r => r.status === 'pending').length,
          acknowledged: sortedRequests.filter(r => r.status === 'acknowledged').length,
          completed: sortedRequests.filter(r => r.status === 'completed').length
        };
        setRequestsStats(stats);
        previousRequestsRef.current = sortedRequests;
      }
    } catch (err) {
      console.error('Error fetching customer requests:', err);
      showPopupNotification('Failed to fetch requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status, responseMsg = '') => {
    try {
      const token = localStorage.getItem('token');
      
      const updateData = { status };
      if (responseMsg) {
        updateData.staffResponse = responseMsg;
      }
      
      await axios.put(
        `${API_URL}/api/order/customer-request/update/${requestId}`,
        updateData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      await fetchCustomerRequests();
      
      const statusMessages = {
        acknowledged: 'Request acknowledged',
        completed: 'Request completed',
        cancelled: 'Request cancelled'
      };
      showPopupNotification(`✅ ${statusMessages[status] || 'Request updated'}`, 'success');
      
    } catch (err) {
      console.error('Error updating request:', err);
      showPopupNotification('Failed to update request', 'error');
    }
  };

  const handleAcknowledgeWithResponse = async () => {
    if (staffResponse.trim() && selectedRequest) {
      await updateRequestStatus(selectedRequest._id, 'acknowledged', staffResponse);
      setShowResponseModal(false);
      setStaffResponse('');
      setSelectedRequest(null);
    } else {
      showPopupNotification('Please enter a response message', 'error');
    }
  };

  const handleManualRefresh = () => {
    fetchCustomerRequests();
    showPopupNotification('Refreshed successfully', 'success');
  };

  const clearSearch = () => {
    setSearchTable('');
    showPopupNotification('Search cleared', 'info');
  };

  const getRequestIcon = (type) => {
    switch(type) {
      case 'water': return '💧';
      case 'tissue': return '🧻';
      case 'bill': return '🧾';
      default: return '💬';
    }
  };

  const getRequestTitle = (type) => {
    switch(type) {
      case 'water': return 'Water Request';
      case 'tissue': return 'Tissue Request';
      case 'bill': return 'Bill Request';
      default: return 'Request';
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const pendingCount = requestsStats?.pending || 0;
  const completedCount = requestsStats?.completed || 0;
  const totalCount = filteredRequests.length;

  return (
    <div className="customer-requests-container">
      {/* Voice Notification Banner */}
      {showSoundNotification && lastPlayedRequest && (
        <div className="voice-notification-banner">
          <div className="voice-notification-content">
            <FaMicrophone className="voice-icon-animate" />
            <div className="voice-message">
              <span className="voice-label">🔊 Speaking:</span>
              <span className="voice-text">
                Table {lastPlayedRequest.tableNumber}, {lastPlayedRequest.customerName} wants {lastPlayedRequest.requestType}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Popup Notification */}
      {showPopup && (
        <div className="popup-overlay">
          <div className={`popup-notification ${popupType}`}>
            <div className="popup-icon">
              {popupType === 'success' && '✅'}
              {popupType === 'error' && '❌'}
              {popupType === 'info' && 'ℹ️'}
            </div>
            <div className="popup-content">
              <p>{popupMessage}</p>
            </div>
            <button className="popup-close-btn" onClick={() => setShowPopup(false)}>
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Billing Navbar */}
      <BNavbar 
        restaurantSlug={restaurantSlug}
        restaurantName={restaurantData?.restaurantName}
        activePage="customer-requests"
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="content-header">
          <div className="header-info">
            <h1>Customer Messages</h1>
            <p className="restaurant-subtitle">{restaurantData?.restaurantName} • {restaurantData?.restaurantCode}</p>
          </div>
          <div className="header-actions">
            {/* Voice Toggle Button */}
            <button 
              className={`voice-toggle-btn ${voiceEnabled ? 'enabled' : 'disabled'}`}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? 'Voice Notifications On' : 'Voice Notifications Off'}
            >
              {voiceEnabled ? <FaMicrophone /> : <FaVolumeMute />} 
              {voiceEnabled ? 'Voice On' : 'Voice Off'}
            </button>
            
            {/* Test Voice Button */}
            <button className="test-voice-btn" onClick={testVoice} title="Test Voice">
              <FaVolumeUp /> Test Voice
            </button>
            
            {/* Voice Selector Dropdown */}
            {availableVoices.length > 0 && (
              <select 
                className="voice-selector"
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = availableVoices.find(v => v.name === e.target.value);
                  setSelectedVoice(voice);
                }}
                title="Select Voice"
              >
                {availableVoices.map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            )}
            
            <button className="refresh-btn" onClick={handleManualRefresh}>
              <FaSpinner /> Refresh
            </button>
          </div>
        </div>

        {/* Voice Status Indicator */}
        <div className={`voice-status ${voiceEnabled ? 'active' : 'inactive'}`}>
          {voiceEnabled ? (
            <span><FaMicrophone /> Voice notifications are ACTIVE - New requests will be read aloud</span>
          ) : (
            <span><FaVolumeMute /> Voice notifications are OFF - Click "Voice On" to enable</span>
          )}
        </div>

        {/* Statistics Section */}
        <div className="stats-section">
          <div className="section-header" onClick={() => toggleSection('stats')}>
            <h2><FaChartLine /> Messages Statistics</h2>
            <button className="expand-toggle">
              {expandedSections.stats ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
          
          {expandedSections.stats && (
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon">💬</div>
                <div className="stat-info">
                  <h3>Total Messages</h3>
                  <p className="stat-number">{totalCount}</p>
                </div>
              </div>
              
              <div className="stat-card pending-stat">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>Pending</h3>
                  <p className="stat-number">{pendingCount}</p>
                </div>
              </div>
              
              <div className="stat-card completed-stat">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Completed</h3>
                  <p className="stat-number">{completedCount}</p>
                </div>
              </div>
              
              <div className="stat-card date-stat">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>Today's Date</h3>
                  <p className="stat-number date-value">{formattedDate}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar for Table Number */}
        <div className="search-section">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by table number..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="search-input"
            />
            {searchTable && (
              <button className="clear-search" onClick={clearSearch}>
                <FaTimes />
              </button>
            )}
          </div>
          {searchTable && filteredRequests.length === 0 && customerRequests.length > 0 && (
            <div className="no-search-results">
              No requests found for Table {searchTable}
            </div>
          )}
        </div>

        {/* Messages Feed */}
        <div className="stats-section">
          <div className="section-header" onClick={() => toggleSection('requests')}>
            <h2><FaCommentDots /> Message Feed</h2>
            <div className="header-actions">
              <button className="refresh-btn-small" onClick={handleManualRefresh}>
                <FaSpinner /> Refresh
              </button>
              <button className="expand-toggle">
                {expandedSections.requests ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>
          </div>
          
          {expandedSections.requests && (
            <div className="messages-feed">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading messages...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="empty-state-messages">
                  <div className="empty-icon">💬</div>
                  <h3>{searchTable ? `No Requests for Table ${searchTable}` : 'No Messages Today'}</h3>
                  <p>{searchTable ? `No customer messages found for table number ${searchTable}` : 'No customer messages have been received today'}</p>
                  {searchTable && (
                    <button className="clear-search-btn" onClick={clearSearch}>
                      Clear Search
                    </button>
                  )}
                  {!searchTable && (
                    <div className="empty-tips">
                      <p>📅 Date: {formattedDate}</p>
                      <p>💡 New messages will appear here automatically</p>
                      <p>🔊 Voice notifications will read out new requests</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="message-feed-container">
                  {filteredRequests.map((request, index) => (
                    <div 
                      key={request._id} 
                      className={`message-thread ${request.status} ${request.status === 'pending' ? 'new-message-pulse' : ''}`}
                      data-type={request.requestType}
                    >
                      {/* Message Header */}
                      <div className="thread-header">
                        <div className="customer-avatar">
                          {getRequestIcon(request.requestType)}
                        </div>
                        <div className="thread-info">
                          <div className="customer-name-row">
                            <span className="customer-name">{request.customerName}</span>
                            <span className="table-number">Table {request.tableNumber}</span>
                          </div>
                          <div className="message-time">
                            <FaClock /> {new Date(request.requestedAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className={`status-badge ${request.status}`}>
                          {request.status === 'pending' && '⏳ Pending'}
                          {request.status === 'acknowledged' && '✓ Acknowledged'}
                          {request.status === 'completed' && '✅ Completed'}
                        </div>
                      </div>
                      
                      {/* Customer Message */}
                      <div className="customer-message">
                        <div className="message-bubble customer-bubble">
                          <div className="request-type-label">
                            {getRequestTitle(request.requestType)}
                          </div>
                          <div className="message-text">{request.requestMessage}</div>
                        </div>
                      </div>
                      
                      {/* Staff Response if exists */}
                      {request.staffResponse && (
                        <div className="staff-response">
                          <div className="response-label">
                            <FaReplyAll /> Staff Response:
                          </div>
                          <div className="message-bubble staff-bubble">
                            <div className="message-text">{request.staffResponse}</div>
                            <div className="response-time">
                              {request.acknowledgedAt ? new Date(request.acknowledgedAt).toLocaleTimeString() : 'Just now'}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="thread-actions">
                        {request.status === 'pending' && (
                          <>
                            <button 
                              className="action-btn acknowledge-btn"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowResponseModal(true);
                              }}
                            >
                              <FaReply /> Reply
                            </button>
                            <button 
                              className="action-btn complete-btn"
                              onClick={() => updateRequestStatus(request._id, 'completed', 'Request fulfilled')}
                            >
                              <FaCheckCircle /> Complete
                            </button>
                          </>
                        )}
                        {request.status === 'acknowledged' && (
                          <button 
                            className="action-btn complete-btn full-width"
                            onClick={() => updateRequestStatus(request._id, 'completed')}
                          >
                            <FaCheckCircle /> Mark as Completed
                          </button>
                        )}
                        {request.status === 'completed' && (
                          <div className="completed-label">
                            <FaCheckCircle /> Completed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Response Modal */}
        {showResponseModal && selectedRequest && (
          <div className="modal-overlay" onClick={() => setShowResponseModal(false)}>
            <div className="response-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Reply to {selectedRequest.customerName}</h3>
                <button className="close-modal-btn" onClick={() => setShowResponseModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="request-info-card">
                  <div className="info-item">
                    <FaChair /> Table: {selectedRequest.tableNumber}
                  </div>
                  <div className="info-item">
                    <FaUser /> Customer: {selectedRequest.customerName}
                  </div>
                  <div className="info-item message-preview">
                    <FaCommentDots /> Message: {selectedRequest.requestMessage}
                  </div>
                </div>
                <div className="response-input">
                  <label>Your Reply:</label>
                  <textarea
                    value={staffResponse}
                    onChange={(e) => setStaffResponse(e.target.value)}
                    placeholder="Type your response here..."
                    rows={3}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowResponseModal(false)}>Cancel</button>
                <button className="send-btn" onClick={handleAcknowledgeWithResponse}>Send Reply</button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <p>
            {restaurantData?.restaurantName} • Customer Messages • 
            <span className="footer-code"> {restaurantData?.restaurantCode}</span> • 
            Today: {formattedDate}
          </p>
          <p className="footer-note">
            🔊 Voice notifications enabled • Auto-refreshes every 5 seconds • New requests are read aloud
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerRequests;