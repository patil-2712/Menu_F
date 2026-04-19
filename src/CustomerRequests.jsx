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
  FaSearch
} from 'react-icons/fa';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurantData, setRestaurantData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('success');
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    requests: true
  });
  
  // Search state
  const [searchTable, setSearchTable] = useState('');
  
  const refreshInterval = useRef(null);
  const previousRequestsRef = useRef([]);
  const messagesEndRef = useRef(null);

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
        const allRequests = response.data.requests;
        const todayRequests = allRequests.filter(req => isToday(req.requestedAt));
        // Sort by newest first (latest on top)
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
        // Sort by newest first (latest on top)
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

  // Clear search filter
  const clearSearch = () => {
    setSearchTable('');
    showPopupNotification('Search cleared', 'info');
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const navItems = [
    { icon: FaWallet, label: 'Border', action: handleNavigateToBorder },
    { icon: FaReceipt, label: 'Total Bill', action: handleNavigateToTotalBill },
    { icon: FaCommentDots, label: 'Customer Requests', action: handleNavigateToCustomerRequests, active: true },
  ];

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
          <h1><FaCommentDots /> Customer Messages</h1>
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
        <button className="nav-tab active" onClick={handleNavigateToCustomerRequests}><FaCommentDots /> Customer Messages</button>
      </div>

      {/* Statistics Section */}
      <div className="summary-section">
        <div className="section-header" onClick={() => toggleSection('stats')}>
          <h2><FaChartLine /> Messages Statistics</h2>
          <button className="expand-toggle">
            {expandedSections.stats ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.stats && (
          <div className="summary-cards">
            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <div className="stat-content">
                <h3>Total Messages</h3>
                <p className="stat-number">{totalCount}</p>
              </div>
            </div>
            
            <div className="stat-card pending-stat">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>Pending</h3>
                <p className="stat-number">{pendingCount}</p>
              </div>
            </div>
            
            <div className="stat-card completed-stat">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Completed</h3>
                <p className="stat-number">{completedCount}</p>
              </div>
            </div>
            
            <div className="stat-card date-stat">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <h3>Today's Date</h3>
                <p className="stat-number date-value">{formattedDate}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar for Table Number */}
      <div className="search-section">
        <div className="search-container-requests">
          <FaSearch className="search-icon-requests" />
          <input
            type="text"
            placeholder="Search by table number..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            className="search-input-requests"
          />
          {searchTable && (
            <button className="clear-search-requests" onClick={clearSearch}>
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

      {/* Messages Feed - Single Frame */}
      <div className="summary-section">
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
                <div className="spinner"></div>
                <p>Loading messages...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="empty-state">
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
                  </div>
                )}
              </div>
            ) : (
              <div className="message-feed-container">
                {filteredRequests.map((request, index) => (
                  <div key={request._id} className={`message-thread ${request.status}`}>
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
      <div className="requests-footer">
        <p>
          {restaurantData?.restaurantName} • Customer Messages • 
          <span className="footer-code"> {restaurantData?.restaurantCode}</span> • 
          Today: {formattedDate}
        </p>
        <p className="footer-note">
          Auto-refreshes every 10 seconds • Latest messages shown first • Search by table number
        </p>
      </div>
    </div>
  );
};

export default CustomerRequests;