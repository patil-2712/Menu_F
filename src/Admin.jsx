//import React, { useState, useEffect } from "react";
//import { useParams, useNavigate } from "react-router-dom";
//import axios from "axios";
//import { 
//  FaTachometerAlt, 
//  FaChartLine, 
//  FaDatabase, 
//  FaHome,
//  FaSignOutAlt,
//  FaUserCircle,
//  FaBuilding,
//  FaEnvelope,
//  FaPhone,
//  FaMapMarkerAlt,
//  FaIdCard,
//  FaLock,
//  FaUnlock,
//  FaEye,
//  FaEyeSlash,
//  FaKey,
//  FaSave,
//  FaTimes,
//  FaEdit,
//  FaArrowLeft,
//  FaCopy,
//  FaCheckCircle,
//  FaExclamationTriangle,
//  FaSpinner,
//  FaPercentage,
//  FaBars,
//  FaTimesCircle,
//  FaGlobe,
//  FaLocationArrow,
//  FaMoneyBillWave,
//  FaUniversity,
//  FaQrcode,
//  FaCcVisa,
//  FaReceipt,
//  FaWallet,
//  FaMobileAlt,
//  FaChartLine as FaAnalytics,
//  FaChevronDown,
//  FaChevronUp
//} from 'react-icons/fa';
//import "./Admin.css";
//
//const Admin = () => {
//  const { restaurantSlug } = useParams();
//  const navigate = useNavigate();
//  
//  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
//  
//  console.log('🔧 Admin using backend:', API_URL);
//  
//  const [restaurantData, setRestaurantData] = useState(null);
//  const [loading, setLoading] = useState(true);
//  const [error, setError] = useState("");
//  const [isEditing, setIsEditing] = useState(false);
//  const [editForm, setEditForm] = useState({});
//  const [saving, setSaving] = useState(false);
//  const [userName, setUserName] = useState('');
//  const [userRole, setUserRole] = useState('');
//  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//  const [detectingLocation, setDetectingLocation] = useState(false);
//  const [expandedSections, setExpandedSections] = useState({
//    basic: true,
//    contact: true,
//    location: true,
//    business: true,
//    bank: true,
//    credentials: true,
//    urls: true
//  });
//  
//  // Password update states
//  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
//  const [passwordUpdateForm, setPasswordUpdateForm] = useState({
//    currentPassword: "",
//    newOwnerPassword: "",
//    newKitchenPassword: "",
//    newBillingPassword: "",
//    confirmPassword: ""
//  });
//  const [passwordErrors, setPasswordErrors] = useState({});
//  const [updatingPassword, setUpdatingPassword] = useState(false);
//  const [showPasswords, setShowPasswords] = useState({
//    current: false,
//    owner: false,
//    kitchen: false,
//    billing: false,
//    confirm: false
//  });
//  const [copySuccess, setCopySuccess] = useState('');
//
//  const toggleSection = (section) => {
//    setExpandedSections(prev => ({
//      ...prev,
//      [section]: !prev[section]
//    }));
//  };
//
//  useEffect(() => {
//    checkAuthentication();
//  }, [restaurantSlug]);
//
//  const checkAuthentication = () => {
//    const token = localStorage.getItem("token");
//    const role = localStorage.getItem("userRole");
//    const name = localStorage.getItem("userName") || 'Owner';
//    const storedRestaurantSlug = localStorage.getItem("restaurantSlug");
//    
//    if (!token) {
//      navigate("/");
//      return;
//    }
//    
//    setUserRole(role);
//    setUserName(name);
//    
//    if (role !== "owner") {
//      navigate(`/${storedRestaurantSlug}/dashboard`);
//      return;
//    }
//    
//    if (storedRestaurantSlug !== restaurantSlug) {
//      navigate(`/${storedRestaurantSlug}/admin`);
//      return;
//    }
//    
//    fetchRestaurantData();
//  };
//
//  const fetchRestaurantData = async () => {
//    try {
//      setLoading(true);
//      setError("");
//      
//      const token = localStorage.getItem("token");
//      
//      const response = await axios.get(
//        `${API_URL}/api/restaurant/by-slug/${restaurantSlug}`,
//        {
//          headers: { Authorization: `Bearer ${token}` }
//        }
//      );
//      
//      setRestaurantData(response.data);
//      setEditForm(response.data);
//    } catch (err) {
//      console.error("Error fetching restaurant data:", err);
//      setError("Failed to load restaurant data. Please try again.");
//    } finally {
//      setLoading(false);
//    }
//  };
//
//  const detectCurrentLocation = () => {
//    setDetectingLocation(true);
//    
//    if (!navigator.geolocation) {
//      setError("Geolocation is not supported by your browser");
//      setDetectingLocation(false);
//      return;
//    }
//    
//    navigator.geolocation.getCurrentPosition(
//      async (position) => {
//        const { latitude, longitude } = position.coords;
//        
//        setEditForm({
//          ...editForm,
//          latitude: latitude.toString(),
//          longitude: longitude.toString()
//        });
//        
//        try {
//          const response = await axios.get(
//            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
//          );
//          if (response.data) {
//            const location = response.data;
//            setEditForm(prev => ({
//              ...prev,
//              city: location.city || prev.city,
//              state: location.principalSubdivision || prev.state,
//              country: location.countryName || prev.country
//            }));
//          }
//        } catch (geoErr) {
//          console.error("Reverse geocoding error:", geoErr);
//        }
//        
//        setDetectingLocation(false);
//        showSuccessMessage("📍 Location detected successfully!");
//      },
//      (error) => {
//        console.error("Location error:", error);
//        let errorMsg = "Unable to get location. ";
//        switch(error.code) {
//          case error.PERMISSION_DENIED:
//            errorMsg += "Please allow location access.";
//            break;
//          case error.POSITION_UNAVAILABLE:
//            errorMsg += "Location information unavailable.";
//            break;
//          case error.TIMEOUT:
//            errorMsg += "Location request timed out.";
//            break;
//          default:
//            errorMsg += "Please enter coordinates manually.";
//        }
//        setError(errorMsg);
//        setDetectingLocation(false);
//      },
//      {
//        enableHighAccuracy: true,
//        timeout: 10000,
//        maximumAge: 0
//      }
//    );
//  };
//
//  const handleEditClick = () => {
//    setIsEditing(true);
//    setEditForm(restaurantData);
//  };
//
//  const handleCancelEdit = () => {
//    setIsEditing(false);
//    setEditForm(restaurantData);
//  };
//
//  const handleInputChange = (e) => {
//    const { name, value } = e.target;
//    setEditForm({
//      ...editForm,
//      [name]: value
//    });
//  };
//
//  const handleSaveChanges = async () => {
//    try {
//      setSaving(true);
//      setError("");
//      
//      const token = localStorage.getItem("token");
//      
//      const dataToSend = {};
//      Object.keys(editForm).forEach(key => {
//        if (editForm[key] !== undefined && editForm[key] !== null) {
//          if (key === 'gstPercentage') {
//            dataToSend[key] = editForm[key] ? parseFloat(editForm[key]) : null;
//          } else if (key === 'latitude' || key === 'longitude') {
//            dataToSend[key] = editForm[key] ? parseFloat(editForm[key]) : null;
//          } else if (typeof editForm[key] === 'string') {
//            dataToSend[key] = editForm[key].trim();
//          } else {
//            dataToSend[key] = editForm[key];
//          }
//        }
//      });
//      
//      const response = await axios.put(
//        `${API_URL}/api/restaurant/update/${restaurantSlug}`,
//        dataToSend,
//        {
//          headers: { 
//            Authorization: `Bearer ${token}`,
//            'Content-Type': 'application/json'
//          }
//        }
//      );
//      
//      setRestaurantData(response.data.restaurant);
//      setIsEditing(false);
//      
//      showSuccessMessage("✅ Restaurant data updated successfully!");
//      
//      if (response.data.restaurant.restaurantName) {
//        localStorage.setItem("restaurantName", response.data.restaurant.restaurantName);
//      }
//      if (response.data.restaurant.restaurantSlug) {
//        localStorage.setItem("restaurantSlug", response.data.restaurant.restaurantSlug);
//        if (response.data.restaurant.restaurantSlug !== restaurantSlug) {
//          navigate(`/${response.data.restaurant.restaurantSlug}/admin`);
//        }
//      }
//      
//    } catch (err) {
//      console.error("Error updating restaurant:", err);
//      setError(err.response?.data?.message || "Failed to update restaurant data.");
//    } finally {
//      setSaving(false);
//    }
//  };
//
//  const showSuccessMessage = (message) => {
//    const successDiv = document.createElement('div');
//    successDiv.className = 'success-toast';
//    successDiv.innerHTML = message;
//    document.body.appendChild(successDiv);
//    setTimeout(() => successDiv.remove(), 3000);
//  };
//
//  const handlePasswordUpdateClick = () => {
//    setShowPasswordUpdate(!showPasswordUpdate);
//    setPasswordErrors({});
//    setPasswordUpdateForm({
//      currentPassword: "",
//      newOwnerPassword: "",
//      newKitchenPassword: "",
//      newBillingPassword: "",
//      confirmPassword: ""
//    });
//  };
//
//  const handlePasswordInputChange = (e) => {
//    const { name, value } = e.target;
//    setPasswordUpdateForm({
//      ...passwordUpdateForm,
//      [name]: value
//    });
//    if (passwordErrors[name]) {
//      setPasswordErrors({
//        ...passwordErrors,
//        [name]: ""
//      });
//    }
//  };
//
//  const validatePasswordForm = () => {
//    const errors = {};
//    
//    if (!passwordUpdateForm.currentPassword.trim()) {
//      errors.currentPassword = "Current password is required";
//    }
//    
//    if (passwordUpdateForm.newOwnerPassword && passwordUpdateForm.newOwnerPassword.length < 6) {
//      errors.newOwnerPassword = "Owner password must be at least 6 characters";
//    }
//    
//    if (passwordUpdateForm.newKitchenPassword && passwordUpdateForm.newKitchenPassword.length < 6) {
//      errors.newKitchenPassword = "Kitchen password must be at least 6 characters";
//    }
//    
//    if (passwordUpdateForm.newBillingPassword && passwordUpdateForm.newBillingPassword.length < 6) {
//      errors.newBillingPassword = "Billing password must be at least 6 characters";
//    }
//    
//    if ((passwordUpdateForm.newOwnerPassword || passwordUpdateForm.newKitchenPassword || passwordUpdateForm.newBillingPassword) && 
//        !passwordUpdateForm.confirmPassword) {
//      errors.confirmPassword = "Please confirm your new password";
//    }
//    
//    if (passwordUpdateForm.newOwnerPassword && 
//        passwordUpdateForm.confirmPassword &&
//        passwordUpdateForm.newOwnerPassword !== passwordUpdateForm.confirmPassword) {
//      errors.confirmPassword = "Passwords do not match";
//    }
//    
//    setPasswordErrors(errors);
//    return Object.keys(errors).length === 0;
//  };
//
//  const handleUpdatePasswords = async () => {
//    if (!validatePasswordForm()) {
//      return;
//    }
//    
//    try {
//      setUpdatingPassword(true);
//      setError("");
//      
//      const token = localStorage.getItem("token");
//      
//      const passwordData = {
//        currentPassword: passwordUpdateForm.currentPassword,
//        newOwnerPassword: passwordUpdateForm.newOwnerPassword || undefined,
//        newKitchenPassword: passwordUpdateForm.newKitchenPassword || undefined,
//        newBillingPassword: passwordUpdateForm.newBillingPassword || undefined
//      };
//      
//      Object.keys(passwordData).forEach(key => {
//        if (passwordData[key] === undefined || passwordData[key] === "") {
//          delete passwordData[key];
//        }
//      });
//      
//      const response = await axios.put(
//        `${API_URL}/api/restaurant/update-passwords/${restaurantSlug}`,
//        passwordData,
//        {
//          headers: { 
//            Authorization: `Bearer ${token}`,
//            'Content-Type': 'application/json'
//          }
//        }
//      );
//      
//      setPasswordUpdateForm({
//        currentPassword: "",
//        newOwnerPassword: "",
//        newKitchenPassword: "",
//        newBillingPassword: "",
//        confirmPassword: ""
//      });
//      setShowPasswordUpdate(false);
//      setPasswordErrors({});
//      
//      showSuccessMessage("✅ Passwords updated successfully!");
//      
//    } catch (err) {
//      console.error("Error updating passwords:", err);
//      setError(err.response?.data?.message || "Failed to update passwords.");
//    } finally {
//      setUpdatingPassword(false);
//    }
//  };
//
//  const togglePasswordVisibility = (field) => {
//    setShowPasswords({
//      ...showPasswords,
//      [field]: !showPasswords[field]
//    });
//  };
//
//  const handleBackToDashboard = () => {
//    navigate(`/${restaurantSlug}/dashboard`);
//  };
//
//  const handleLogout = () => {
//    console.log("🔓 Logging out from Admin...");
//    localStorage.clear();
//    sessionStorage.clear();
//    navigate("/", { replace: true });
//    setTimeout(() => {
//      window.location.href = "/";
//    }, 50);
//  };
//
//  const copyToClipboard = (text) => {
//    navigator.clipboard.writeText(text);
//    setCopySuccess('Copied!');
//    setTimeout(() => setCopySuccess(''), 2000);
//  };
//
//  const generatePassword = (type) => {
//    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
//    let password = "";
//    for (let i = 0; i < 10; i++) {
//      password += chars.charAt(Math.floor(Math.random() * chars.length));
//    }
//    
//    setPasswordUpdateForm({
//      ...passwordUpdateForm,
//      [type]: password
//    });
//  };
//
//  const handleNavigateToAnalytics = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/analytics`);
//  };
//
//  const handleNavigateToRecords = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/records`);
//  };
//
//  const handleNavigateToFeedback = () => {
//    setMobileMenuOpen(false);
//    navigate(`/${restaurantSlug}/feedback`);
//  };
//
//  const navItems = [
//    { icon: FaTachometerAlt, label: 'Admin Dashboard', action: handleBackToDashboard },
//    { icon: FaAnalytics, label: 'Analytics', action: handleNavigateToAnalytics },
//    { icon: FaDatabase, label: 'Records', action: handleNavigateToRecords },
//    { icon: FaReceipt, label: 'Feedback', action: handleNavigateToFeedback }
//  ];
//
//  const getStatusBadgeClass = (status) => {
//    if (!status) return 'status-badge unknown';
//    switch(status.toLowerCase()) {
//      case 'verified': return 'status-badge verified';
//      case 'approved': return 'status-badge approved';
//      case 'pending': return 'status-badge pending';
//      case 'rejected': return 'status-badge rejected';
//      case 'not_created': return 'status-badge not-created';
//      default: return 'status-badge unknown';
//    }
//  };
//
//  const getStatusText = (status) => {
//    if (!status) return 'Not Submitted';
//    switch(status.toLowerCase()) {
//      case 'verified': return '✓ Verified';
//      case 'approved': return '✓ Approved';
//      case 'pending': return '⏳ Pending';
//      case 'rejected': return '✗ Rejected';
//      case 'not_created': return 'Not Created';
//      default: return status;
//    }
//  };
//
//  if (loading) {
//    return (
//      <div className="loading-container">
//        <div className="loading-spinner"></div>
//        <p>Loading restaurant data...</p>
//      </div>
//    );
//  }
//
//  return (
//    <div className="admin-container">
//      {/* Mobile Menu Toggle */}
//      <button 
//        className="mobile-menu-toggle"
//        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//      >
//        {mobileMenuOpen ? <FaTimesCircle /> : <FaBars />}
//      </button>
//
//      {/* Mobile Navigation Overlay */}
//      {mobileMenuOpen && (
//        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
//          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
//            <div className="mobile-nav-header">
//              <h3>Menu</h3>
//              <button onClick={() => setMobileMenuOpen(false)}>
//                <FaTimes />
//              </button>
//            </div>
//            {navItems.map((item, index) => (
//              <button 
//                key={index}
//                className="mobile-nav-item"
//                onClick={item.action}
//              >
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
//      <div className="admin-header">
//        <div className="header-content">
//          <h1>
//            <FaBuilding /> Restaurant Admin
//          </h1>
//          <p className="subtitle">
//            {restaurantData?.restaurantName} • {restaurantData?.restaurantCode}
//          </p>
//        </div>
//        <div className="header-right desktop-only">
//          <button className="logout-button" onClick={handleLogout}>
//            <FaSignOutAlt /> Logout
//          </button>
//        </div>
//      </div>
//
//      {/* Desktop Navigation Tabs */}
//      <div className="navigation-tabs desktop-only">
//        {navItems.map((item, index) => (
//          <button 
//            key={index}
//            className="nav-tab" 
//            onClick={item.action}
//          >
//            <item.icon /> {item.label}
//          </button>
//        ))}
//      </div>
//
//      {/* Error Display */}
//      {error && (
//        <div className="error-message">
//          <FaExclamationTriangle /> {error}
//          <button onClick={() => setError("")}>✕</button>
//        </div>
//      )}
//
//      {/* Action Buttons */}
//      <div className="action-buttons-container">
//        <div className="action-buttons-left">
//          {!isEditing ? (
//            <button className="edit-btn" onClick={handleEditClick}>
//              <FaEdit /> Edit Restaurant
//            </button>
//          ) : (
//            <>
//              <button 
//                className="save-btn" 
//                onClick={handleSaveChanges}
//                disabled={saving}
//              >
//                {saving ? <FaSpinner className="spinner" /> : <FaSave />}
//                {saving ? "Saving..." : "Save"}
//              </button>
//              <button 
//                className="cancel-btn" 
//                onClick={handleCancelEdit}
//                disabled={saving}
//              >
//                <FaTimes /> Cancel
//              </button>
//            </>
//          )}
//          
//          <button 
//            className={`password-btn ${showPasswordUpdate ? 'active' : ''}`}
//            onClick={handlePasswordUpdateClick}
//          >
//            {showPasswordUpdate ? <FaUnlock /> : <FaLock />}
//            {showPasswordUpdate ? 'Hide' : 'Update Passwords'}
//          </button>
//        </div>
//      </div>
//
//      {/* Password Update Section */}
//      {showPasswordUpdate && (
//        <div className="password-update-section">
//          <h3>
//            <FaKey /> Update Passwords
//          </h3>
//          <p className="section-description">
//            Update passwords for owner, kitchen, and billing accounts.
//          </p>
//          
//          <div className="password-form">
//            <div className="form-row">
//              <div className="form-group">
//                <label>Current Password <span className="required">*</span></label>
//                <div className="password-input-wrapper">
//                  <input
//                    type={showPasswords.current ? "text" : "password"}
//                    name="currentPassword"
//                    value={passwordUpdateForm.currentPassword}
//                    onChange={handlePasswordInputChange}
//                    placeholder="Enter your current password"
//                    className={`password-input ${passwordErrors.currentPassword ? 'error' : ''}`}
//                  />
//                  <button
//                    type="button"
//                    className="toggle-password-btn"
//                    onClick={() => togglePasswordVisibility('current')}
//                  >
//                    {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
//                  </button>
//                </div>
//                {passwordErrors.currentPassword && (
//                  <span className="error-text">{passwordErrors.currentPassword}</span>
//                )}
//              </div>
//            </div>
//
//            <div className="password-grid">
//              <div className="form-group">
//                <label>New Owner Password</label>
//                <div className="password-input-wrapper">
//                  <input
//                    type={showPasswords.owner ? "text" : "password"}
//                    name="newOwnerPassword"
//                    value={passwordUpdateForm.newOwnerPassword}
//                    onChange={handlePasswordInputChange}
//                    placeholder="Leave empty to keep current"
//                    className={`password-input ${passwordErrors.newOwnerPassword ? 'error' : ''}`}
//                  />
//                  <button
//                    type="button"
//                    className="toggle-password-btn"
//                    onClick={() => togglePasswordVisibility('owner')}
//                  >
//                    {showPasswords.owner ? <FaEyeSlash /> : <FaEye />}
//                  </button>
//                </div>
//                <button
//                  type="button"
//                  className="generate-btn"
//                  onClick={() => generatePassword('newOwnerPassword')}
//                >
//                  🎲 Generate
//                </button>
//                {passwordErrors.newOwnerPassword && (
//                  <span className="error-text">{passwordErrors.newOwnerPassword}</span>
//                )}
//              </div>
//
//              <div className="form-group">
//                <label>New Kitchen Password</label>
//                <div className="password-input-wrapper">
//                  <input
//                    type={showPasswords.kitchen ? "text" : "password"}
//                    name="newKitchenPassword"
//                    value={passwordUpdateForm.newKitchenPassword}
//                    onChange={handlePasswordInputChange}
//                    placeholder="Leave empty to keep current"
//                    className={`password-input ${passwordErrors.newKitchenPassword ? 'error' : ''}`}
//                  />
//                  <button
//                    type="button"
//                    className="toggle-password-btn"
//                    onClick={() => togglePasswordVisibility('kitchen')}
//                  >
//                    {showPasswords.kitchen ? <FaEyeSlash /> : <FaEye />}
//                  </button>
//                </div>
//                <button
//                  type="button"
//                  className="generate-btn"
//                  onClick={() => generatePassword('newKitchenPassword')}
//                >
//                  🎲 Generate
//                </button>
//                {passwordErrors.newKitchenPassword && (
//                  <span className="error-text">{passwordErrors.newKitchenPassword}</span>
//                )}
//              </div>
//
//              <div className="form-group">
//                <label>New Billing Password</label>
//                <div className="password-input-wrapper">
//                  <input
//                    type={showPasswords.billing ? "text" : "password"}
//                    name="newBillingPassword"
//                    value={passwordUpdateForm.newBillingPassword}
//                    onChange={handlePasswordInputChange}
//                    placeholder="Leave empty to keep current"
//                    className={`password-input ${passwordErrors.newBillingPassword ? 'error' : ''}`}
//                  />
//                  <button
//                    type="button"
//                    className="toggle-password-btn"
//                    onClick={() => togglePasswordVisibility('billing')}
//                  >
//                    {showPasswords.billing ? <FaEyeSlash /> : <FaEye />}
//                  </button>
//                </div>
//                <button
//                  type="button"
//                  className="generate-btn"
//                  onClick={() => generatePassword('newBillingPassword')}
//                >
//                  🎲 Generate
//                </button>
//                {passwordErrors.newBillingPassword && (
//                  <span className="error-text">{passwordErrors.newBillingPassword}</span>
//                )}
//              </div>
//
//              {(passwordUpdateForm.newOwnerPassword || 
//                passwordUpdateForm.newKitchenPassword || 
//                passwordUpdateForm.newBillingPassword) && (
//                <div className="form-group">
//                  <label>Confirm New Password <span className="required">*</span></label>
//                  <div className="password-input-wrapper">
//                    <input
//                      type={showPasswords.confirm ? "text" : "password"}
//                      name="confirmPassword"
//                      value={passwordUpdateForm.confirmPassword}
//                      onChange={handlePasswordInputChange}
//                      placeholder="Re-enter new password"
//                      className={`password-input ${passwordErrors.confirmPassword ? 'error' : ''}`}
//                    />
//                    <button
//                      type="button"
//                      className="toggle-password-btn"
//                      onClick={() => togglePasswordVisibility('confirm')}
//                    >
//                      {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
//                    </button>
//                  </div>
//                  {passwordErrors.confirmPassword && (
//                    <span className="error-text">{passwordErrors.confirmPassword}</span>
//                  )}
//                </div>
//              )}
//            </div>
//
//            <div className="password-form-actions">
//              <button
//                className="update-password-btn"
//                onClick={handleUpdatePasswords}
//                disabled={updatingPassword}
//              >
//                {updatingPassword ? (
//                  <>
//                    <FaSpinner className="spinner" />
//                    Updating...
//                  </>
//                ) : (
//                  <>
//                    <FaKey /> Update Passwords
//                  </>
//                )}
//              </button>
//              <button
//                className="cancel-password-btn"
//                onClick={handlePasswordUpdateClick}
//                disabled={updatingPassword}
//              >
//                <FaTimes /> Cancel
//              </button>
//            </div>
//          </div>
//        </div>
//      )}
//
//      {/* Restaurant Data Display/Edit */}
//      <div className="restaurant-data">
//        <div className="data-section">
//          
//          {/* Basic Information Section */}
//          <div className="info-card-section">
//            <div className="section-header" onClick={() => toggleSection('basic')}>
//              <h2><FaBuilding /> Basic Information</h2>
//              <button className="expand-toggle">{expandedSections.basic ? <FaChevronUp /> : <FaChevronDown />}</button>
//            </div>
//            {expandedSections.basic && (
//              <div className="info-card">
//                <div className="info-field">
//                  <label>Restaurant Code:</label>
//                  <div className="value-with-copy">
//                    <span className="data-value code-value">{restaurantData?.restaurantCode}</span>
//                    <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.restaurantCode)}>
//                      <FaCopy />
//                    </button>
//                  </div>
//                </div>
//                
//                <div className="info-field">
//                  <label>Restaurant Name:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="restaurantName"
//                      value={editForm.restaurantName || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <div className="value-with-copy">
//                      <span className="data-value">{restaurantData?.restaurantName}</span>
//                      <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.restaurantName)}>
//                        <FaCopy />
//                      </button>
//                    </div>
//                  )}
//                </div>
//                
//                <div className="info-field">
//                  <label>Restaurant Slug:</label>
//                  <div className="value-with-copy">
//                    <span className="data-value slug-value">{restaurantData?.restaurantSlug}</span>
//                    <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.restaurantSlug)}>
//                      <FaCopy />
//                    </button>
//                  </div>
//                </div>
//                
//                <div className="info-field">
//                  <label>Created:</label>
//                  <span className="data-value">
//                    {restaurantData?.createdAt ? new Date(restaurantData.createdAt).toLocaleDateString() : 'N/A'}
//                  </span>
//                </div>
//              </div>
//            )}
//          </div>
//
//          {/* Contact Information Section */}
//          <div className="info-card-section">
//            <div className="section-header" onClick={() => toggleSection('contact')}>
//              <h2><FaPhone /> Contact Information</h2>
//              <button className="expand-toggle">{expandedSections.contact ? <FaChevronUp /> : <FaChevronDown />}</button>
//            </div>
//            {expandedSections.contact && (
//              <div className="info-card">
//                <div className="info-field">
//                  <label>Email:</label>
//                  {isEditing ? (
//                    <input
//                      type="email"
//                      name="email"
//                      value={editForm.email || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <div className="value-with-copy">
//                      <span className="data-value">{restaurantData?.email}</span>
//                      <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.email)}>
//                        <FaCopy />
//                      </button>
//                    </div>
//                  )}
//                </div>
//                
//                <div className="info-field">
//                  <label>Mobile:</label>
//                  {isEditing ? (
//                    <input
//                      type="tel"
//                      name="mobile"
//                      value={editForm.mobile || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <div className="value-with-copy">
//                      <span className="data-value">{restaurantData?.mobile}</span>
//                      <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.mobile)}>
//                        <FaCopy />
//                      </button>
//                    </div>
//                  )}
//                </div>
//                
//                <div className="info-field">
//                  <label>Owner Name:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="ownerName"
//                      value={editForm.ownerName || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <span className="data-value">{restaurantData?.ownerName || "N/A"}</span>
//                  )}
//                </div>
//                
//                <div className="info-field">
//                  <label>Owner Mobile:</label>
//                  {isEditing ? (
//                    <input
//                      type="tel"
//                      name="ownerMobile"
//                      value={editForm.ownerMobile || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <span className="data-value">{restaurantData?.ownerMobile || "N/A"}</span>
//                  )}
//                </div>
//              </div>
//            )}
//          </div>
//
//          {/* Location Information Section */}
//          <div className="info-card-section">
//            <div className="section-header" onClick={() => toggleSection('location')}>
//              <h2><FaMapMarkerAlt /> Location</h2>
//              <button className="expand-toggle">{expandedSections.location ? <FaChevronUp /> : <FaChevronDown />}</button>
//            </div>
//            {expandedSections.location && (
//              <div className="info-card location-card">
//                {isEditing && (
//                  <div className="detect-location-btn-container">
//                    <button
//                      type="button"
//                      className="detect-location-edit-btn"
//                      onClick={detectCurrentLocation}
//                      disabled={detectingLocation}
//                    >
//                      {detectingLocation ? (
//                        <>
//                          <FaSpinner className="spinner" /> Detecting...
//                        </>
//                      ) : (
//                        <>
//                          <FaLocationArrow /> Detect Current Location
//                        </>
//                      )}
//                    </button>
//                    <p className="helper-text">Auto-fill coordinates from your current location</p>
//                  </div>
//                )}
//                
//                <div className="info-field">
//                  <label><FaGlobe /> Latitude:</label>
//                  {isEditing ? (
//                    <input
//                      type="number"
//                      step="any"
//                      name="latitude"
//                      value={editForm.latitude || ""}
//                      onChange={handleInputChange}
//                      placeholder="e.g., 19.0760"
//                      className="edit-input"
//                    />
//                  ) : (
//                    <span className="data-value">
//                      {restaurantData?.latitude ? restaurantData.latitude : "Not set"}
//                    </span>
//                  )}
//                </div>
//                
//                <div className="info-field">
//                  <label><FaGlobe /> Longitude:</label>
//                  {isEditing ? (
//                    <input
//                      type="number"
//                      step="any"
//                      name="longitude"
//                      value={editForm.longitude || ""}
//                      onChange={handleInputChange}
//                      placeholder="e.g., 72.8777"
//                      className="edit-input"
//                    />
//                  ) : (
//                    <span className="data-value">
//                      {restaurantData?.longitude ? restaurantData.longitude : "Not set"}
//                    </span>
//                  )}
//                </div>
//                
//                {restaurantData?.latitude && restaurantData?.longitude && (
//                  <div className="info-field">
//                    <label>Map View:</label>
//                    <a
//                      href={`https://www.google.com/maps?q=${restaurantData.latitude},${restaurantData.longitude}`}
//                      target="_blank"
//                      rel="noopener noreferrer"
//                      className="map-link"
//                    >
//                      <FaMapMarkerAlt /> View on Google Maps
//                    </a>
//                  </div>
//                )}
//                
//                <div className="info-field">
//                  <label>City:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="city"
//                      value={editForm.city || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <span className="data-value">{restaurantData?.city}</span>
//                  )}
//                </div>
//                
//                <div className="info-field">
//                  <label>State:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="state"
//                      value={editForm.state || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <span className="data-value">{restaurantData?.state}</span>
//                  )}
//                </div>
//                
//                <div className="info-field">
//                  <label>Country:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="country"
//                      value={editForm.country || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <span className="data-value">{restaurantData?.country}</span>
//                  )}
//                </div>
//                
//                <div className="info-field">
//                  <label>Nearest Place:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="nearestPlace"
//                      value={editForm.nearestPlace || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <span className="data-value">{restaurantData?.nearestPlace}</span>
//                  )}
//                </div>
//              </div>
//            )}
//          </div>
//
//          {/* Business Information Section */}
//          <div className="info-card-section">
//            <div className="section-header" onClick={() => toggleSection('business')}>
//              <h2><FaIdCard /> Business Info</h2>
//              <button className="expand-toggle">{expandedSections.business ? <FaChevronUp /> : <FaChevronDown />}</button>
//            </div>
//            {expandedSections.business && (
//              <div className="info-card">
//                <div className="info-field">
//                  <label>GST Number:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="gstNumber"
//                      value={editForm.gstNumber || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                      maxLength="15"
//                    />
//                  ) : (
//                    <span className="data-value">{restaurantData?.gstNumber || "N/A"}</span>
//                  )}
//                </div>
//
//                <div className="info-field">
//                  <label>GST Percentage:</label>
//                  {isEditing ? (
//                    <div className="percentage-input-wrapper">
//                      <input
//                        type="number"
//                        name="gstPercentage"
//                        value={editForm.gstPercentage || ""}
//                        onChange={handleInputChange}
//                        className="edit-input percentage-input"
//                        placeholder="e.g., 18"
//                        min="0"
//                        max="100"
//                        step="0.01"
//                      />
//                      <span className="percentage-symbol">%</span>
//                    </div>
//                  ) : (
//                    <span className="data-value percentage-value">
//                      {restaurantData?.gstPercentage ? `${restaurantData.gstPercentage}%` : "Not Set"}
//                    </span>
//                  )}
//                </div>
//                
//                <div className="info-field">
//                  <label>Food License (FSSAI):</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="foodLicense"
//                      value={editForm.foodLicense || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <span className="data-value">{restaurantData?.foodLicense || "N/A"}</span>
//                  )}
//                </div>
//
//                <div className="info-field">
//                  <label>PAN Number:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="panNumber"
//                      value={editForm.panNumber || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                      maxLength="10"
//                    />
//                  ) : (
//                    <span className="data-value">{restaurantData?.panNumber || "N/A"}</span>
//                  )}
//                </div>
//              </div>
//            )}
//          </div>
//
//          {/* Bank & Payment Details Section */}
//          <div className="info-card-section">
//            <div className="section-header" onClick={() => toggleSection('bank')}>
//              <h2><FaUniversity /> Bank & Payment Details</h2>
//              <button className="expand-toggle">{expandedSections.bank ? <FaChevronUp /> : <FaChevronDown />}</button>
//            </div>
//            {expandedSections.bank && (
//              <div className="info-card bank-card">
//                {/* UPI ID */}
//                <div className="info-field">
//                  <label><FaMobileAlt /> UPI ID:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="upiId"
//                      value={editForm.upiId || ""}
//                      onChange={handleInputChange}
//                      placeholder="e.g., restaurant@okhdfcbank"
//                      className="edit-input"
//                    />
//                  ) : (
//                    <div className="value-with-copy">
//                      <span className="data-value upi-value">{restaurantData?.upiId || "Not Set"}</span>
//                      {restaurantData?.upiId && (
//                        <button className="copy-btn" onClick={() => copyToClipboard(restaurantData.upiId)}>
//                          <FaCopy />
//                        </button>
//                      )}
//                    </div>
//                  )}
//                </div>
//
//                {/* Bank Name */}
//                <div className="info-field">
//                  <label><FaUniversity /> Bank Name:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="bankName"
//                      value={editForm.bankName || ""}
//                      onChange={handleInputChange}
//                      placeholder="e.g., State Bank of India"
//                      className="edit-input"
//                    />
//                  ) : (
//                    <span className="data-value">{restaurantData?.bankName || "Not Set"}</span>
//                  )}
//                </div>
//
//                {/* Account Holder Name */}
//                <div className="info-field">
//                  <label>Account Holder Name:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="bankAccountHolderName"
//                      value={editForm.bankAccountHolderName || ""}
//                      onChange={handleInputChange}
//                      placeholder="e.g., John Doe"
//                      className="edit-input"
//                    />
//                  ) : (
//                    <span className="data-value">{restaurantData?.bankAccountHolderName || "Not Set"}</span>
//                  )}
//                </div>
//
//                {/* Account Number */}
//                <div className="info-field">
//                  <label>Bank Account Number:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="bankAccountNumber"
//                      value={editForm.bankAccountNumber || ""}
//                      onChange={handleInputChange}
//                      placeholder="e.g., 1234567890"
//                      className="edit-input"
//                    />
//                  ) : (
//                    <div className="value-with-copy">
//                      <span className="data-value account-number">
//                        {restaurantData?.bankAccountNumber ? "••••" + restaurantData.bankAccountNumber.slice(-4) : "Not Set"}
//                      </span>
//                      {restaurantData?.bankAccountNumber && (
//                        <button className="copy-btn" onClick={() => copyToClipboard(restaurantData.bankAccountNumber)}>
//                          <FaCopy />
//                        </button>
//                      )}
//                    </div>
//                  )}
//                </div>
//
//                {/* IFSC Code */}
//                <div className="info-field">
//                  <label>IFSC Code:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="bankIfscCode"
//                      value={editForm.bankIfscCode || ""}
//                      onChange={handleInputChange}
//                      placeholder="e.g., SBIN0001234"
//                      className="edit-input"
//                    />
//                  ) : (
//                    <div className="value-with-copy">
//                      <span className="data-value ifsc-value">{restaurantData?.bankIfscCode || "Not Set"}</span>
//                      {restaurantData?.bankIfscCode && (
//                        <button className="copy-btn" onClick={() => copyToClipboard(restaurantData.bankIfscCode)}>
//                          <FaCopy />
//                        </button>
//                      )}
//                    </div>
//                  )}
//                </div>
//
//                {/* Bank Verification Status */}
//                {restaurantData?.bankVerificationStatus && (
//                  <div className="info-field">
//                    <label>Verification Status:</label>
//                    <span className={getStatusBadgeClass(restaurantData.bankVerificationStatus)}>
//                      {getStatusText(restaurantData.bankVerificationStatus)}
//                    </span>
//                  </div>
//                )}
//
//                {/* Cashfree Status */}
//                {restaurantData?.cashfreeStatus && (
//                  <div className="info-field">
//                    <label>Cashfree Status:</label>
//                    <span className={getStatusBadgeClass(restaurantData.cashfreeStatus)}>
//                      {getStatusText(restaurantData.cashfreeStatus)}
//                    </span>
//                  </div>
//                )}
//
//                {/* Note about payment setup */}
//                <div className="payment-note">
//                  <FaQrcode /> <strong>Note:</strong> UPI ID is used for receiving online payments. 
//                  Please ensure your bank details are verified to enable online payments.
//                </div>
//              </div>
//            )}
//          </div>
//
//          {/* Login Credentials Section */}
//          <div className="info-card-section">
//            <div className="section-header" onClick={() => toggleSection('credentials')}>
//              <h2><FaKey /> Login Credentials</h2>
//              <button className="expand-toggle">{expandedSections.credentials ? <FaChevronUp /> : <FaChevronDown />}</button>
//            </div>
//            {expandedSections.credentials && (
//              <div className="info-card credentials-card">
//                <div className="info-field">
//                  <label>Owner Email:</label>
//                  {isEditing ? (
//                    <input
//                      type="email"
//                      name="email"
//                      value={editForm.email || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <div className="value-with-copy">
//                      <span className="data-value">{restaurantData?.email}</span>
//                      <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.email)}>
//                        <FaCopy />
//                      </button>
//                    </div>
//                  )}
//                </div>
//                
//                <div className="info-field">
//                  <label>Kitchen Username:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="kitchenUsername"
//                      value={editForm.kitchenUsername || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <div className="value-with-copy">
//                      <span className="data-value">{restaurantData?.kitchenUsername}</span>
//                      <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.kitchenUsername)}>
//                        <FaCopy />
//                      </button>
//                    </div>
//                  )}
//                </div>
//                
//                <div className="info-field">
//                  <label>Billing Username:</label>
//                  {isEditing ? (
//                    <input
//                      type="text"
//                      name="billingUsername"
//                      value={editForm.billingUsername || ""}
//                      onChange={handleInputChange}
//                      className="edit-input"
//                    />
//                  ) : (
//                    <div className="value-with-copy">
//                      <span className="data-value">{restaurantData?.billingUsername}</span>
//                      <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.billingUsername)}>
//                        <FaCopy />
//                      </button>
//                    </div>
//                  )}
//                </div>
//              </div>
//            )}
//          </div>
//
//          {/* URLs Section */}
//          <div className="info-card-section">
//            <div className="section-header" onClick={() => toggleSection('urls')}>
//              <h2><FaGlobe /> Restaurant URLs</h2>
//              <button className="expand-toggle">{expandedSections.urls ? <FaChevronUp /> : <FaChevronDown />}</button>
//            </div>
//            {expandedSections.urls && (
//              <div className="info-card urls-card">
//                <div className="info-field">
//                  <label>Admin Panel:</label>
//                  <div className="url-value">
//                    <code>/{restaurantSlug}/admin</code>
//                    <button className="copy-btn" onClick={() => copyToClipboard(`/${restaurantSlug}/admin`)}>
//                      <FaCopy />
//                    </button>
//                  </div>
//                </div>
//                
//                <div className="info-field">
//                  <label>Dashboard:</label>
//                  <div className="url-value">
//                    <code>/{restaurantSlug}/dashboard</code>
//                    <button className="copy-btn" onClick={() => copyToClipboard(`/${restaurantSlug}/dashboard`)}>
//                      <FaCopy />
//                    </button>
//                  </div>
//                </div>
//                
//                <div className="info-field">
//                  <label>Set Menu:</label>
//                  <div className="url-value">
//                    <code>/{restaurantSlug}/setmenu</code>
//                    <button className="copy-btn" onClick={() => copyToClipboard(`/${restaurantSlug}/setmenu`)}>
//                      <FaCopy />
//                    </button>
//                  </div>
//                </div>
//                
//                <div className="info-field">
//                  <label>Public Menu (QR Code):</label>
//                  <div className="url-value">
//                    <code>/{restaurantSlug}/menu</code>
//                    <button className="copy-btn" onClick={() => copyToClipboard(`/${restaurantSlug}/menu`)}>
//                      <FaCopy />
//                    </button>
//                  </div>
//                </div>
//              </div>
//            )}
//          </div>
//        </div>
//      </div>
//
//      {/* Quick Stats */}
//      <div className="quick-stats">
//        <h3>Restaurant Statistics</h3>
//        <div className="stat-grid">
//          <div className="stat-item">
//            <span className="stat-label">Restaurant Code</span>
//            <span className="stat-value">{restaurantData?.restaurantCode}</span>
//          </div>
//          <div className="stat-item">
//            <span className="stat-label">Account Type</span>
//            <span className="stat-value role-stat">{restaurantData?.role?.toUpperCase() || 'OWNER'}</span>
//          </div>
//          <div className="stat-item">
//            <span className="stat-label">Registration</span>
//            <span className="stat-value">
//              {restaurantData?.createdAt ? new Date(restaurantData.createdAt).toLocaleDateString() : 'N/A'}
//            </span>
//          </div>
//          <div className="stat-item">
//            <span className="stat-label">GST Rate</span>
//            <span className="stat-value">
//              {restaurantData?.gstPercentage ? `${restaurantData.gstPercentage}%` : 'Not Set'}
//            </span>
//          </div>
//          {restaurantData?.upiId && (
//            <div className="stat-item">
//              <span className="stat-label">UPI ID</span>
//              <span className="stat-value">{restaurantData.upiId.substring(0, 15)}...</span>
//            </div>
//          )}
//          {restaurantData?.bankVerificationStatus === 'verified' && (
//            <div className="stat-item">
//              <span className="stat-label">Bank Status</span>
//              <span className="stat-value verified">✓ Verified</span>
//            </div>
//          )}
//        </div>
//      </div>
//
//      {/* Copy Success Toast */}
//      {copySuccess && (
//        <div className="copy-toast">
//          <FaCheckCircle /> {copySuccess}
//        </div>
//      )}
//    </div>
//  );
//};
//
//export default Admin;
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaTachometerAlt, 
  FaChartLine, 
  FaDatabase, 
  FaHome,
  FaSignOutAlt,
  FaUserCircle,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaIdCard,
  FaLock,
  FaUnlock,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaSave,
  FaTimes,
  FaEdit,
  FaArrowLeft,
  FaCopy,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaPercentage,
  FaBars,
  FaTimesCircle,
  FaGlobe,
  FaLocationArrow,
  FaMoneyBillWave,
  FaUniversity,
  FaQrcode,
  FaCcVisa,
  FaReceipt,
  FaWallet,
  FaMobileAlt,
  FaChartLine as FaAnalytics,
  FaChevronDown,
  FaChevronUp,
  FaCommentDots,
  FaClipboardList,
  FaUtensils
} from 'react-icons/fa';
import "./Admin.css";

const Admin = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Admin using backend:', API_URL);
  
  const [restaurantData, setRestaurantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    contact: true,
    location: true,
    business: true,
    bank: true,
    credentials: true,
    urls: true
  });
  
  // Password update states
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [passwordUpdateForm, setPasswordUpdateForm] = useState({
    currentPassword: "",
    newOwnerPassword: "",
    newKitchenPassword: "",
    newBillingPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    owner: false,
    kitchen: false,
    billing: false,
    confirm: false
  });
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    const handleLinkClick = (e) => {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    checkAuthentication();
  }, [restaurantSlug]);

  const checkAuthentication = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("userName") || 'Owner';
    const storedRestaurantSlug = localStorage.getItem("restaurantSlug");
    
    if (!token) {
      navigate("/");
      return;
    }
    
    setUserRole(role);
    setUserName(name);
    
    if (role !== "owner") {
      navigate(`/${storedRestaurantSlug}/dashboard`);
      return;
    }
    
    if (storedRestaurantSlug !== restaurantSlug) {
      navigate(`/${storedRestaurantSlug}/admin`);
      return;
    }
    
    fetchRestaurantData();
  };

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `${API_URL}/api/restaurant/by-slug/${restaurantSlug}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setRestaurantData(response.data);
      setEditForm(response.data);
    } catch (err) {
      console.error("Error fetching restaurant data:", err);
      setError("Failed to load restaurant data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const detectCurrentLocation = () => {
    setDetectingLocation(true);
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setDetectingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setEditForm({
          ...editForm,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        });
        
        try {
          const response = await axios.get(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (response.data) {
            const location = response.data;
            setEditForm(prev => ({
              ...prev,
              city: location.city || prev.city,
              state: location.principalSubdivision || prev.state,
              country: location.countryName || prev.country
            }));
          }
        } catch (geoErr) {
          console.error("Reverse geocoding error:", geoErr);
        }
        
        setDetectingLocation(false);
        showSuccessMessage("📍 Location detected successfully!");
      },
      (error) => {
        console.error("Location error:", error);
        let errorMsg = "Unable to get location. ";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += "Please allow location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMsg += "Location request timed out.";
            break;
          default:
            errorMsg += "Please enter coordinates manually.";
        }
        setError(errorMsg);
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditForm(restaurantData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(restaurantData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value
    });
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError("");
      
      const token = localStorage.getItem("token");
      
      const dataToSend = {};
      Object.keys(editForm).forEach(key => {
        if (editForm[key] !== undefined && editForm[key] !== null) {
          if (key === 'gstPercentage') {
            dataToSend[key] = editForm[key] ? parseFloat(editForm[key]) : null;
          } else if (key === 'latitude' || key === 'longitude') {
            dataToSend[key] = editForm[key] ? parseFloat(editForm[key]) : null;
          } else if (typeof editForm[key] === 'string') {
            dataToSend[key] = editForm[key].trim();
          } else {
            dataToSend[key] = editForm[key];
          }
        }
      });
      
      const response = await axios.put(
        `${API_URL}/api/restaurant/update/${restaurantSlug}`,
        dataToSend,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setRestaurantData(response.data.restaurant);
      setIsEditing(false);
      
      showSuccessMessage("✅ Restaurant data updated successfully!");
      
      if (response.data.restaurant.restaurantName) {
        localStorage.setItem("restaurantName", response.data.restaurant.restaurantName);
      }
      if (response.data.restaurant.restaurantSlug) {
        localStorage.setItem("restaurantSlug", response.data.restaurant.restaurantSlug);
        if (response.data.restaurant.restaurantSlug !== restaurantSlug) {
          navigate(`/${response.data.restaurant.restaurantSlug}/admin`);
        }
      }
      
    } catch (err) {
      console.error("Error updating restaurant:", err);
      setError(err.response?.data?.message || "Failed to update restaurant data.");
    } finally {
      setSaving(false);
    }
  };

  const showSuccessMessage = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.innerHTML = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
  };

  const handlePasswordUpdateClick = () => {
    setShowPasswordUpdate(!showPasswordUpdate);
    setPasswordErrors({});
    setPasswordUpdateForm({
      currentPassword: "",
      newOwnerPassword: "",
      newKitchenPassword: "",
      newBillingPassword: "",
      confirmPassword: ""
    });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordUpdateForm({
      ...passwordUpdateForm,
      [name]: value
    });
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: ""
      });
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordUpdateForm.currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
    }
    
    if (passwordUpdateForm.newOwnerPassword && passwordUpdateForm.newOwnerPassword.length < 6) {
      errors.newOwnerPassword = "Owner password must be at least 6 characters";
    }
    
    if (passwordUpdateForm.newKitchenPassword && passwordUpdateForm.newKitchenPassword.length < 6) {
      errors.newKitchenPassword = "Kitchen password must be at least 6 characters";
    }
    
    if (passwordUpdateForm.newBillingPassword && passwordUpdateForm.newBillingPassword.length < 6) {
      errors.newBillingPassword = "Billing password must be at least 6 characters";
    }
    
    if ((passwordUpdateForm.newOwnerPassword || passwordUpdateForm.newKitchenPassword || passwordUpdateForm.newBillingPassword) && 
        !passwordUpdateForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    }
    
    if (passwordUpdateForm.newOwnerPassword && 
        passwordUpdateForm.confirmPassword &&
        passwordUpdateForm.newOwnerPassword !== passwordUpdateForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdatePasswords = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      setUpdatingPassword(true);
      setError("");
      
      const token = localStorage.getItem("token");
      
      const passwordData = {
        currentPassword: passwordUpdateForm.currentPassword,
        newOwnerPassword: passwordUpdateForm.newOwnerPassword || undefined,
        newKitchenPassword: passwordUpdateForm.newKitchenPassword || undefined,
        newBillingPassword: passwordUpdateForm.newBillingPassword || undefined
      };
      
      Object.keys(passwordData).forEach(key => {
        if (passwordData[key] === undefined || passwordData[key] === "") {
          delete passwordData[key];
        }
      });
      
      const response = await axios.put(
        `${API_URL}/api/restaurant/update-passwords/${restaurantSlug}`,
        passwordData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setPasswordUpdateForm({
        currentPassword: "",
        newOwnerPassword: "",
        newKitchenPassword: "",
        newBillingPassword: "",
        confirmPassword: ""
      });
      setShowPasswordUpdate(false);
      setPasswordErrors({});
      
      showSuccessMessage("✅ Passwords updated successfully!");
      
    } catch (err) {
      console.error("Error updating passwords:", err);
      setError(err.response?.data?.message || "Failed to update passwords.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const handleBackToDashboard = () => {
    navigate(`/${restaurantSlug}/dashboard`);
  };

  const handleLogout = () => {
    console.log("🔓 Logging out from Admin...");
    localStorage.clear();
    sessionStorage.clear();
    navigate("/", { replace: true });
    setTimeout(() => {
      window.location.href = "/";
    }, 50);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const generatePassword = (type) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setPasswordUpdateForm({
      ...passwordUpdateForm,
      [type]: password
    });
  };

  // Navigation handlers
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

 

 

  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-badge unknown';
    switch(status.toLowerCase()) {
      case 'verified': return 'status-badge verified';
      case 'approved': return 'status-badge approved';
      case 'pending': return 'status-badge pending';
      case 'rejected': return 'status-badge rejected';
      case 'not_created': return 'status-badge not-created';
      default: return 'status-badge unknown';
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Not Submitted';
    switch(status.toLowerCase()) {
      case 'verified': return '✓ Verified';
      case 'approved': return '✓ Approved';
      case 'pending': return '⏳ Pending';
      case 'rejected': return '✗ Rejected';
      case 'not_created': return 'Not Created';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading restaurant data...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Sidebar Navigation - LEFT SIDE */}
      <div className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <FaBuilding className="logo-icon" />
            <span>{restaurantData?.restaurantName?.split(' ')[0] || 'Admin'}</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item active" onClick={handleNavigateToAdmin}>
            <FaBuilding /> Admin
          </button>
         
          <button className="nav-item" onClick={handleNavigateToAnalytics}>
            <FaAnalytics /> Analytics
          </button>
          <button className="nav-item" onClick={handleNavigateToRecords}>
            <FaDatabase /> Records
          </button>
          <button className="nav-item" onClick={handleNavigateToFeedback}>
            <FaCommentDots /> Feedback
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="content-header">
          <div className="header-info">
            <h1><FaBuilding /> Restaurant Admin</h1>
            <p className="restaurant-subtitle">{restaurantData?.restaurantName} • {restaurantData?.restaurantCode}</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <FaExclamationTriangle /> {error}
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons-container">
          <div className="action-buttons-left">
            {!isEditing ? (
              <button className="edit-btn" onClick={handleEditClick}>
                <FaEdit /> Edit Restaurant
              </button>
            ) : (
              <>
                <button 
                  className="save-btn" 
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? <FaSpinner className="spinner" /> : <FaSave />}
                  {saving ? "Saving..." : "Save"}
                </button>
                <button 
                  className="cancel-btn" 
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <FaTimes /> Cancel
                </button>
              </>
            )}
            
            <button 
              className={`password-btn ${showPasswordUpdate ? 'active' : ''}`}
              onClick={handlePasswordUpdateClick}
            >
              {showPasswordUpdate ? <FaUnlock /> : <FaLock />}
              {showPasswordUpdate ? 'Hide' : 'Update Passwords'}
            </button>
          </div>
        </div>

        {/* Password Update Section */}
        {showPasswordUpdate && (
          <div className="password-update-section">
            <h3><FaKey /> Update Passwords</h3>
            <p className="section-description">
              Update passwords for owner, kitchen, and billing accounts.
            </p>
            
            <div className="password-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Current Password <span className="required">*</span></label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordUpdateForm.currentPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Enter your current password"
                      className={`password-input ${passwordErrors.currentPassword ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <span className="error-text">{passwordErrors.currentPassword}</span>
                  )}
                </div>
              </div>

              <div className="password-grid">
                <div className="form-group">
                  <label>New Owner Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.owner ? "text" : "password"}
                      name="newOwnerPassword"
                      value={passwordUpdateForm.newOwnerPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Leave empty to keep current"
                      className={`password-input ${passwordErrors.newOwnerPassword ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => togglePasswordVisibility('owner')}
                    >
                      {showPasswords.owner ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="generate-btn"
                    onClick={() => generatePassword('newOwnerPassword')}
                  >
                    🎲 Generate
                  </button>
                  {passwordErrors.newOwnerPassword && (
                    <span className="error-text">{passwordErrors.newOwnerPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>New Kitchen Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.kitchen ? "text" : "password"}
                      name="newKitchenPassword"
                      value={passwordUpdateForm.newKitchenPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Leave empty to keep current"
                      className={`password-input ${passwordErrors.newKitchenPassword ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => togglePasswordVisibility('kitchen')}
                    >
                      {showPasswords.kitchen ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="generate-btn"
                    onClick={() => generatePassword('newKitchenPassword')}
                  >
                    🎲 Generate
                  </button>
                  {passwordErrors.newKitchenPassword && (
                    <span className="error-text">{passwordErrors.newKitchenPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>New Billing Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.billing ? "text" : "password"}
                      name="newBillingPassword"
                      value={passwordUpdateForm.newBillingPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Leave empty to keep current"
                      className={`password-input ${passwordErrors.newBillingPassword ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => togglePasswordVisibility('billing')}
                    >
                      {showPasswords.billing ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="generate-btn"
                    onClick={() => generatePassword('newBillingPassword')}
                  >
                    🎲 Generate
                  </button>
                  {passwordErrors.newBillingPassword && (
                    <span className="error-text">{passwordErrors.newBillingPassword}</span>
                  )}
                </div>

                {(passwordUpdateForm.newOwnerPassword || 
                  passwordUpdateForm.newKitchenPassword || 
                  passwordUpdateForm.newBillingPassword) && (
                  <div className="form-group">
                    <label>Confirm New Password <span className="required">*</span></label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordUpdateForm.confirmPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Re-enter new password"
                        className={`password-input ${passwordErrors.confirmPassword ? 'error' : ''}`}
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <span className="error-text">{passwordErrors.confirmPassword}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="password-form-actions">
                <button
                  className="update-password-btn"
                  onClick={handleUpdatePasswords}
                  disabled={updatingPassword}
                >
                  {updatingPassword ? (
                    <>
                      <FaSpinner className="spinner" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaKey /> Update Passwords
                    </>
                  )}
                </button>
                <button
                  className="cancel-password-btn"
                  onClick={handlePasswordUpdateClick}
                  disabled={updatingPassword}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Data Display/Edit */}
        <div className="restaurant-data">
          <div className="data-section">
            
            {/* Basic Information Section */}
            <div className="stats-section">
              <div className="section-header" onClick={() => toggleSection('basic')}>
                <h2><FaBuilding /> Basic Information</h2>
                <button className="expand-toggle">
                  {expandedSections.basic ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              {expandedSections.basic && (
                <div className="info-card">
                  <div className="info-field">
                    <label>Restaurant Code:</label>
                    <div className="value-with-copy">
                      <span className="data-value code-value">{restaurantData?.restaurantCode}</span>
                      <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.restaurantCode)}>
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  
                  <div className="info-field">
                    <label>Restaurant Name:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="restaurantName"
                        value={editForm.restaurantName || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <div className="value-with-copy">
                        <span className="data-value">{restaurantData?.restaurantName}</span>
                        <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.restaurantName)}>
                          <FaCopy />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label>Restaurant Slug:</label>
                    <div className="value-with-copy">
                      <span className="data-value slug-value">{restaurantData?.restaurantSlug}</span>
                      <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.restaurantSlug)}>
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  
                  <div className="info-field">
                    <label>Created:</label>
                    <span className="data-value">
                      {restaurantData?.createdAt ? new Date(restaurantData.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information Section */}
            <div className="stats-section">
              <div className="section-header" onClick={() => toggleSection('contact')}>
                <h2><FaPhone /> Contact Information</h2>
                <button className="expand-toggle">
                  {expandedSections.contact ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              {expandedSections.contact && (
                <div className="info-card">
                  <div className="info-field">
                    <label>Email:</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editForm.email || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <div className="value-with-copy">
                        <span className="data-value">{restaurantData?.email}</span>
                        <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.email)}>
                          <FaCopy />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label>Mobile:</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="mobile"
                        value={editForm.mobile || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <div className="value-with-copy">
                        <span className="data-value">{restaurantData?.mobile}</span>
                        <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.mobile)}>
                          <FaCopy />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label>Owner Name:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="ownerName"
                        value={editForm.ownerName || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <span className="data-value">{restaurantData?.ownerName || "N/A"}</span>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label>Owner Mobile:</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="ownerMobile"
                        value={editForm.ownerMobile || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <span className="data-value">{restaurantData?.ownerMobile || "N/A"}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Location Information Section */}
            <div className="stats-section">
              <div className="section-header" onClick={() => toggleSection('location')}>
                <h2><FaMapMarkerAlt /> Location</h2>
                <button className="expand-toggle">
                  {expandedSections.location ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              {expandedSections.location && (
                <div className="info-card location-card">
                  {isEditing && (
                    <div className="detect-location-btn-container">
                      <button
                        type="button"
                        className="detect-location-edit-btn"
                        onClick={detectCurrentLocation}
                        disabled={detectingLocation}
                      >
                        {detectingLocation ? (
                          <>
                            <FaSpinner className="spinner" /> Detecting...
                          </>
                        ) : (
                          <>
                            <FaLocationArrow /> Detect Current Location
                          </>
                        )}
                      </button>
                      <p className="helper-text">Auto-fill coordinates from your current location</p>
                    </div>
                  )}
                  
                  <div className="info-field">
                    <label><FaGlobe /> Latitude:</label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={editForm.latitude || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., 19.0760"
                        className="edit-input"
                      />
                    ) : (
                      <span className="data-value">
                        {restaurantData?.latitude ? restaurantData.latitude : "Not set"}
                      </span>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label><FaGlobe /> Longitude:</label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={editForm.longitude || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., 72.8777"
                        className="edit-input"
                      />
                    ) : (
                      <span className="data-value">
                        {restaurantData?.longitude ? restaurantData.longitude : "Not set"}
                      </span>
                    )}
                  </div>
                  
                  {restaurantData?.latitude && restaurantData?.longitude && (
                    <div className="info-field">
                      <label>Map View:</label>
                      <a
                        href={`https://www.google.com/maps?q=${restaurantData.latitude},${restaurantData.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-link"
                      >
                        <FaMapMarkerAlt /> View on Google Maps
                      </a>
                    </div>
                  )}
                  
                  <div className="info-field">
                    <label>City:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="city"
                        value={editForm.city || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <span className="data-value">{restaurantData?.city}</span>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label>State:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="state"
                        value={editForm.state || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <span className="data-value">{restaurantData?.state}</span>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label>Country:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="country"
                        value={editForm.country || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <span className="data-value">{restaurantData?.country}</span>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label>Nearest Place:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="nearestPlace"
                        value={editForm.nearestPlace || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <span className="data-value">{restaurantData?.nearestPlace}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Business Information Section */}
            <div className="stats-section">
              <div className="section-header" onClick={() => toggleSection('business')}>
                <h2><FaIdCard /> Business Info</h2>
                <button className="expand-toggle">
                  {expandedSections.business ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              {expandedSections.business && (
                <div className="info-card">
                  <div className="info-field">
                    <label>GST Number:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="gstNumber"
                        value={editForm.gstNumber || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                        maxLength="15"
                      />
                    ) : (
                      <span className="data-value">{restaurantData?.gstNumber || "N/A"}</span>
                    )}
                  </div>

                  <div className="info-field">
                    <label>GST Percentage:</label>
                    {isEditing ? (
                      <div className="percentage-input-wrapper">
                        <input
                          type="number"
                          name="gstPercentage"
                          value={editForm.gstPercentage || ""}
                          onChange={handleInputChange}
                          className="edit-input percentage-input"
                          placeholder="e.g., 18"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="percentage-symbol">%</span>
                      </div>
                    ) : (
                      <span className="data-value percentage-value">
                        {restaurantData?.gstPercentage ? `${restaurantData.gstPercentage}%` : "Not Set"}
                      </span>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label>Food License (FSSAI):</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="foodLicense"
                        value={editForm.foodLicense || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <span className="data-value">{restaurantData?.foodLicense || "N/A"}</span>
                    )}
                  </div>

                  <div className="info-field">
                    <label>PAN Number:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="panNumber"
                        value={editForm.panNumber || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                        maxLength="10"
                      />
                    ) : (
                      <span className="data-value">{restaurantData?.panNumber || "N/A"}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bank & Payment Details Section */}
            <div className="stats-section">
              <div className="section-header" onClick={() => toggleSection('bank')}>
                <h2><FaUniversity /> Bank & Payment Details</h2>
                <button className="expand-toggle">
                  {expandedSections.bank ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              {expandedSections.bank && (
                <div className="info-card bank-card">
                  <div className="info-field">
                    <label><FaMobileAlt /> UPI ID:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="upiId"
                        value={editForm.upiId || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., restaurant@okhdfcbank"
                        className="edit-input"
                      />
                    ) : (
                      <div className="value-with-copy">
                        <span className="data-value upi-value">{restaurantData?.upiId || "Not Set"}</span>
                        {restaurantData?.upiId && (
                          <button className="copy-btn" onClick={() => copyToClipboard(restaurantData.upiId)}>
                            <FaCopy />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="info-field">
                    <label><FaUniversity /> Bank Name:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="bankName"
                        value={editForm.bankName || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., State Bank of India"
                        className="edit-input"
                      />
                    ) : (
                      <span className="data-value">{restaurantData?.bankName || "Not Set"}</span>
                    )}
                  </div>

                  <div className="info-field">
                    <label>Account Holder Name:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="bankAccountHolderName"
                        value={editForm.bankAccountHolderName || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., John Doe"
                        className="edit-input"
                      />
                    ) : (
                      <span className="data-value">{restaurantData?.bankAccountHolderName || "Not Set"}</span>
                    )}
                  </div>

                  <div className="info-field">
                    <label>Bank Account Number:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="bankAccountNumber"
                        value={editForm.bankAccountNumber || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., 1234567890"
                        className="edit-input"
                      />
                    ) : (
                      <div className="value-with-copy">
                        <span className="data-value account-number">
                          {restaurantData?.bankAccountNumber ? "••••" + restaurantData.bankAccountNumber.slice(-4) : "Not Set"}
                        </span>
                        {restaurantData?.bankAccountNumber && (
                          <button className="copy-btn" onClick={() => copyToClipboard(restaurantData.bankAccountNumber)}>
                            <FaCopy />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="info-field">
                    <label>IFSC Code:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="bankIfscCode"
                        value={editForm.bankIfscCode || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., SBIN0001234"
                        className="edit-input"
                      />
                    ) : (
                      <div className="value-with-copy">
                        <span className="data-value ifsc-value">{restaurantData?.bankIfscCode || "Not Set"}</span>
                        {restaurantData?.bankIfscCode && (
                          <button className="copy-btn" onClick={() => copyToClipboard(restaurantData.bankIfscCode)}>
                            <FaCopy />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {restaurantData?.bankVerificationStatus && (
                    <div className="info-field">
                      <label>Verification Status:</label>
                      <span className={getStatusBadgeClass(restaurantData.bankVerificationStatus)}>
                        {getStatusText(restaurantData.bankVerificationStatus)}
                      </span>
                    </div>
                  )}

                  {restaurantData?.cashfreeStatus && (
                    <div className="info-field">
                      <label>Cashfree Status:</label>
                      <span className={getStatusBadgeClass(restaurantData.cashfreeStatus)}>
                        {getStatusText(restaurantData.cashfreeStatus)}
                      </span>
                    </div>
                  )}

                  <div className="payment-note">
                    <FaQrcode /> <strong>Note:</strong> UPI ID is used for receiving online payments. 
                    Please ensure your bank details are verified to enable online payments.
                  </div>
                </div>
              )}
            </div>

            {/* Login Credentials Section */}
            <div className="stats-section">
              <div className="section-header" onClick={() => toggleSection('credentials')}>
                <h2><FaKey /> Login Credentials</h2>
                <button className="expand-toggle">
                  {expandedSections.credentials ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              {expandedSections.credentials && (
                <div className="info-card credentials-card">
                  <div className="info-field">
                    <label>Owner Email:</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editForm.email || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <div className="value-with-copy">
                        <span className="data-value">{restaurantData?.email}</span>
                        <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.email)}>
                          <FaCopy />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label>Kitchen Username:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="kitchenUsername"
                        value={editForm.kitchenUsername || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <div className="value-with-copy">
                        <span className="data-value">{restaurantData?.kitchenUsername}</span>
                        <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.kitchenUsername)}>
                          <FaCopy />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label>Billing Username:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="billingUsername"
                        value={editForm.billingUsername || ""}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                    ) : (
                      <div className="value-with-copy">
                        <span className="data-value">{restaurantData?.billingUsername}</span>
                        <button className="copy-btn" onClick={() => copyToClipboard(restaurantData?.billingUsername)}>
                          <FaCopy />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* URLs Section */}
            <div className="stats-section">
              <div className="section-header" onClick={() => toggleSection('urls')}>
                <h2><FaGlobe /> Restaurant URLs</h2>
                <button className="expand-toggle">
                  {expandedSections.urls ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              {expandedSections.urls && (
                <div className="info-card urls-card">
                  <div className="info-field">
                    <label>Admin Panel:</label>
                    <div className="url-value">
                      <code>/{restaurantSlug}/admin</code>
                      <button className="copy-btn" onClick={() => copyToClipboard(`/${restaurantSlug}/admin`)}>
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  
                  <div className="info-field">
                    <label>Dashboard:</label>
                    <div className="url-value">
                      <code>/{restaurantSlug}/dashboard</code>
                      <button className="copy-btn" onClick={() => copyToClipboard(`/${restaurantSlug}/dashboard`)}>
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  
                  <div className="info-field">
                    <label>Set Menu:</label>
                    <div className="url-value">
                      <code>/{restaurantSlug}/setmenu</code>
                      <button className="copy-btn" onClick={() => copyToClipboard(`/${restaurantSlug}/setmenu`)}>
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  
                  <div className="info-field">
                    <label>Public Menu (QR Code):</label>
                    <div className="url-value">
                      <code>/{restaurantSlug}/menu</code>
                      <button className="copy-btn" onClick={() => copyToClipboard(`/${restaurantSlug}/menu`)}>
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <h3>Restaurant Statistics</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Restaurant Code</span>
              <span className="stat-value">{restaurantData?.restaurantCode}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Account Type</span>
              <span className="stat-value role-stat">{restaurantData?.role?.toUpperCase() || 'OWNER'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Registration</span>
              <span className="stat-value">
                {restaurantData?.createdAt ? new Date(restaurantData.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">GST Rate</span>
              <span className="stat-value">
                {restaurantData?.gstPercentage ? `${restaurantData.gstPercentage}%` : 'Not Set'}
              </span>
            </div>
            {restaurantData?.upiId && (
              <div className="stat-item">
                <span className="stat-label">UPI ID</span>
                <span className="stat-value">{restaurantData.upiId.substring(0, 15)}...</span>
              </div>
            )}
            {restaurantData?.bankVerificationStatus === 'verified' && (
              <div className="stat-item">
                <span className="stat-label">Bank Status</span>
                <span className="stat-value verified">✓ Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Copy Success Toast */}
        {copySuccess && (
          <div className="copy-toast">
            <FaCheckCircle /> {copySuccess}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;