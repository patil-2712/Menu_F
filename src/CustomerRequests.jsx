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
  FaChevronRight,
  FaClock,
  FaUser,
  FaChair,
  FaEnvelope,
  FaCalendarAlt
} from 'react-icons/fa';
import './CustomerRequests.css';

const CustomerRequests = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  const [customerRequests, setCustomerRequests] = useState([]);
  const [requestsStats, setRequestsStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [staffResponse, setStaffResponse] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurantData, setRestaurantData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('success');
  
  const refreshInterval = useRef(null);
  const previousRequestsRef = useRef([]);

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

  useEffect(() => {
    checkAuthentication();
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
    };
  }, [restaurantSlug]);

  const startAutoRefresh = () => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
    
    refreshInterval.current = setInterval(() => {
      checkForNewRequests();
    }, 10000);
  };

  const checkForNewRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/order/customer-request/list/${restaurantSlug}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Filter only today's requests
        const allRequests = response.data.requests;
        const todayRequests = allRequests.filter(req => isToday(req.requestedAt));
        const oldTodayRequests = previousRequestsRef.current;
        
        const newPendingRequests = todayRequests.filter(
          newReq => 
            newReq.status === 'pending' && 
            !oldTodayRequests.some(oldReq => oldReq._id === newReq._id)
        );
        
        if (newPendingRequests.length > 0) {
          showPopupNotification(`${newPendingRequests.length} new request${newPendingRequests.length > 1 ? 's' : ''} received!`, 'info');
          setCustomerRequests(todayRequests);
          // Update stats based on today's requests
          const stats = {
            total: todayRequests.length,
            pending: todayRequests.filter(r => r.status === 'pending').length,
            acknowledged: todayRequests.filter(r => r.status === 'acknowledged').length,
            completed: todayRequests.filter(r => r.status === 'completed').length
          };
          setRequestsStats(stats);
        }
        
        previousRequestsRef.current = todayRequests;
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
        // Filter only today's requests
        const allRequests = response.data.requests;
        const todayRequests = allRequests.filter(req => isToday(req.requestedAt));
        
        setCustomerRequests(todayRequests);
        
        // Calculate stats for today's requests only
        const stats = {
          total: todayRequests.length,
          pending: todayRequests.filter(r => r.status === 'pending').length,
          acknowledged: todayRequests.filter(r => r.status === 'acknowledged').length,
          completed: todayRequests.filter(r => r.status === 'completed').length
        };
        setRequestsStats(stats);
        previousRequestsRef.current = todayRequests;
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

  // Navigation Functions
  const handleNavigateToBorder = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/border`);
  };
  
  const handleNavigateToTotalBill = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/totalbill`);
  };

  const handleNavigateToCustomerRequests = () => {
    setMobileMenuOpen(false);
    navigate(`/${restaurantSlug}/customer-requests`);
  };

  const handleLogout = () => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
    localStorage.clear();
    sessionStorage.clear();
    navigate("/", { replace: true });
    setTimeout(() => {
      window.location.href = "/";
    }, 50);
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

  const navItems = [
    { icon: FaWallet, label: 'Border', action: handleNavigateToBorder },
    { icon: FaReceipt, label: 'Total Bill', action: handleNavigateToTotalBill },
    { icon: FaCommentDots, label: 'Customer Requests', action: handleNavigateToCustomerRequests, active: true },
  ];

  const todayDate = getTodayDate();
  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const pendingCount = requestsStats?.pending || 0;

  return (
    <div className="customer-requests-container">
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

      {/* Mobile Menu Toggle */}
      <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <FaTimesCircle /> : <FaBars />}
      </button>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <h3>Menu</h3>
              <button onClick={() => setMobileMenuOpen(false)}><FaTimes /></button>
            </div>
            {navItems.map((item, index) => (
              <button key={index} className={`mobile-nav-item ${item.active ? 'active' : ''}`} onClick={item.action}>
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
      <div className="requests-header">
        <div className="header-content">
          <h1><FaCommentDots /> Customer Requests</h1>
          <p className="subtitle">{restaurantData?.restaurantName} • {restaurantData?.restaurantCode}</p>
        </div>
        <div className="header-right desktop-only">
          <button className="refresh-btn" onClick={handleManualRefresh}>
            <FaSpinner /> Refresh
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="navigation-tabs desktop-only">
        <button className="nav-tab" onClick={handleNavigateToBorder}><FaWallet /> Border</button>
        <button className="nav-tab" onClick={handleNavigateToTotalBill}><FaReceipt /> Total Bill</button>
        <button className="nav-tab active" onClick={handleNavigateToCustomerRequests}><FaCommentDots /> Customer Requests</button>
      </div>

      {/* Stats Bar - Single Rectangle */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-icon">📋</span>
          <span className="stat-label">Today's Requests</span>
          <span className="stat-value">{customerRequests.length}</span>
        </div>
        <div className="stat-item pending">
          <span className="stat-icon">⏳</span>
          <span className="stat-label">Pending</span>
          <span className="stat-value">{pendingCount}</span>
        </div>
        <div className="stat-item completed">
          <span className="stat-icon">✅</span>
          <span className="stat-label">Completed</span>
          <span className="stat-value">{customerRequests.filter(r => r.status === 'completed').length}</span>
        </div>
        <div className="stat-item date">
          <span className="stat-icon">📅</span>
          <span className="stat-label">Date</span>
          <span className="stat-value">{formattedDate}</span>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="auto-refresh-indicator">
        <span>🔄 Auto-refreshing every 10 seconds • Showing today's requests only</span>
      </div>

      {/* Requests List */}
      <div className="requests-list-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading today's requests...</p>
          </div>
        ) : customerRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No Requests Today</h3>
            <p>No customer requests have been made today</p>
            <div className="empty-tips">
              <p>📅 Date: {formattedDate}</p>
              <p>💡 New requests will appear here automatically when customers make them</p>
            </div>
          </div>
        ) : (
          <div className="requests-grid">
            {customerRequests.map(request => (
              <div key={request._id} className={`request-card ${request.status}`}>
                {/* Card Header */}
                <div className="card-header">
                  <div className="request-type-badge">
                    <span className="type-icon">{getRequestIcon(request.requestType)}</span>
                    <span className="type-name">{getRequestTitle(request.requestType)}</span>
                  </div>
                  <div className={`status-indicator ${request.status}`}>
                    <span className="status-dot"></span>
                    <span className="status-text">
                      {request.status === 'pending' && 'Pending'}
                      {request.status === 'acknowledged' && 'Acknowledged'}
                      {request.status === 'completed' && 'Completed'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <div className="info-row">
                    <div className="info-icon">
                      <FaChair />
                    </div>
                    <div className="info-content">
                      <span className="info-label">Table Number</span>
                      <span className="info-value">{request.tableNumber}</span>
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-icon">
                      <FaUser />
                    </div>
                    <div className="info-content">
                      <span className="info-label">Customer Name</span>
                      <span className="info-value">{request.customerName}</span>
                    </div>
                  </div>

                  <div className="info-row message-row">
                    <div className="info-icon">
                      <FaCommentDots />
                    </div>
                    <div className="info-content">
                      <span className="info-label">Request Message</span>
                      <span className="info-value message">{request.requestMessage}</span>
                    </div>
                  </div>

                  <div className="info-row time-row">
                    <div className="info-icon">
                      <FaClock />
                    </div>
                    <div className="info-content">
                      <span className="info-label">Requested At</span>
                      <span className="info-value time">
                        {new Date(request.requestedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {request.staffResponse && (
                    <div className="info-row response-row">
                      <div className="info-icon">
                        <FaReply />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Staff Response</span>
                        <span className="info-value response">{request.staffResponse}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="card-footer">
                  {request.status === 'pending' && (
                    <>
                      <button 
                        className="card-btn acknowledge"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowResponseModal(true);
                        }}
                      >
                        <FaCheckDouble /> Acknowledge
                      </button>
                      <button 
                        className="card-btn complete"
                        onClick={() => updateRequestStatus(request._id, 'completed', 'Request fulfilled')}
                      >
                        <FaCheckCircle /> Complete
                      </button>
                    </>
                  )}
                  {request.status === 'acknowledged' && (
                    <button 
                      className="card-btn complete full-width"
                      onClick={() => updateRequestStatus(request._id, 'completed')}
                    >
                      <FaCheckCircle /> Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowResponseModal(false)}>
          <div className="response-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Respond to Request</h3>
              <button className="close-modal-btn" onClick={() => setShowResponseModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="request-info-card">
                <div className="info-item">
                  <FaChair className="info-icon-small" />
                  <span><strong>Table:</strong> {selectedRequest.tableNumber}</span>
                </div>
                <div className="info-item">
                  <FaUser className="info-icon-small" />
                  <span><strong>Customer:</strong> {selectedRequest.customerName}</span>
                </div>
                <div className="info-item">
                  <FaCommentDots className="info-icon-small" />
                  <span><strong>Request:</strong> {selectedRequest.requestMessage}</span>
                </div>
              </div>
              <div className="response-input">
                <label>Your Response:</label>
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
              <button className="send-btn" onClick={handleAcknowledgeWithResponse}>Send Response</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="requests-footer">
        <p>{restaurantData?.restaurantName} • Today's Customer Requests • Auto-refreshes every 10 seconds</p>
      </div>
    </div>
  );
};

export default CustomerRequests;