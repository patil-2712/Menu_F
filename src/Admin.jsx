// src/Admin.jsx
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
  FaPercentage
} from 'react-icons/fa';
import "./Admin.css";

const Admin = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  
  // Get backend URL from environment variable or use Render URL
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
    localStorage.clear();
    navigate('/');
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

  const handleNavigateToAnalytics = () => {
    navigate(`/${restaurantSlug}/analytics`);
  };

  const handleNavigateToRecords = () => {
    navigate(`/${restaurantSlug}/records`);
  };

  const handleNavigateToFeedback = () => {
    navigate(`/${restaurantSlug}/feedback`);
  };

  const handleNavigateToSetMenu = () => {
    navigate(`/${restaurantSlug}/setmenu`);
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
     
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <h1>
            <FaBuilding /> Restaurant Admin Panel
          </h1>
          <p className="subtitle">
            {restaurantData?.restaurantName} • {restaurantData?.restaurantCode}
          </p>
        </div>
        <div className="header-right">
         <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="navigation-tabs">
        <button 
          className="nav-tab" 
          onClick={handleBackToDashboard}
          title="Go to Dashboard"
        >
          <FaTachometerAlt />Admin Dashboard
        </button>
        
        <button 
          className="nav-tab" 
          onClick={handleNavigateToAnalytics}
          title="Go to Analytics"
        >
          <FaChartLine /> Analytics
        </button>
        
        <button 
          className="nav-tab" 
          onClick={handleNavigateToRecords}
          title="Go to Records"
        >
          <FaDatabase /> Records
        </button>
        
        <button 
          className="nav-tab" 
          onClick={handleNavigateToFeedback}
          title="Go to Feedback"
        >
          <FaDatabase /> Feedback
        </button>
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
              <FaEdit /> Edit Restaurant Data
            </button>
          ) : (
            <div className="edit-controls">
              <button 
                className="save-btn" 
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? <FaSpinner className="spinner" /> : <FaSave />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button 
                className="cancel-btn" 
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          )}
          
          <button 
            className={`password-btn ${showPasswordUpdate ? 'active' : ''}`}
            onClick={handlePasswordUpdateClick}
          >
            {showPasswordUpdate ? <FaUnlock /> : <FaLock />}
            {showPasswordUpdate ? 'Hide Password Update' : 'Update Passwords'}
          </button>
        </div>
      </div>

      {/* Password Update Section */}
      {showPasswordUpdate && (
        <div className="password-update-section">
          <h3>
            <FaKey /> Update Login Passwords
          </h3>
          <p className="section-description">
            Update passwords for owner, kitchen, and billing accounts. You must provide your current password.
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
              {/* Owner Password */}
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
                <div className="password-actions">
                  <button
                    type="button"
                    className="generate-btn"
                    onClick={() => generatePassword('newOwnerPassword')}
                  >
                    🎲 Generate
                  </button>
                </div>
                {passwordErrors.newOwnerPassword && (
                  <span className="error-text">{passwordErrors.newOwnerPassword}</span>
                )}
              </div>

              {/* Kitchen Password */}
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
                <div className="password-actions">
                  <button
                    type="button"
                    className="generate-btn"
                    onClick={() => generatePassword('newKitchenPassword')}
                  >
                    🎲 Generate
                  </button>
                </div>
                {passwordErrors.newKitchenPassword && (
                  <span className="error-text">{passwordErrors.newKitchenPassword}</span>
                )}
              </div>

              {/* Billing Password */}
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
                <div className="password-actions">
                  <button
                    type="button"
                    className="generate-btn"
                    onClick={() => generatePassword('newBillingPassword')}
                  >
                    🎲 Generate
                  </button>
                </div>
                {passwordErrors.newBillingPassword && (
                  <span className="error-text">{passwordErrors.newBillingPassword}</span>
                )}
              </div>

              {/* Confirm Password */}
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
                  {passwordUpdateForm.newOwnerPassword && 
                   passwordUpdateForm.confirmPassword &&
                   passwordUpdateForm.newOwnerPassword === passwordUpdateForm.confirmPassword && (
                    <span className="success-text">
                      <FaCheckCircle /> Passwords match
                    </span>
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
          <h2>
            <FaBuilding /> Restaurant Information
          </h2>
          
          <div className="data-grid">
            {/* Basic Information */}
            <div className="info-card">
              <h3>
                <FaIdCard /> Basic Information
              </h3>
              
              <div className="info-field">
                <label>Restaurant Code:</label>
                <div className="value-with-copy">
                  <span className="data-value code-value">{restaurantData?.restaurantCode}</span>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(restaurantData?.restaurantCode)}
                    title="Copy to clipboard"
                  >
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
                    placeholder="Restaurant Name"
                  />
                ) : (
                  <div className="value-with-copy">
                    <span className="data-value">{restaurantData?.restaurantName}</span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(restaurantData?.restaurantName)}
                    >
                      <FaCopy />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="info-field">
                <label>Restaurant Slug:</label>
                <div className="value-with-copy">
                  <span className="data-value slug-value">
                    {restaurantData?.restaurantSlug}
                  </span>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(restaurantData?.restaurantSlug)}
                  >
                    <FaCopy />
                  </button>
                </div>
                <small className="slug-hint">
                  URL: /{restaurantData?.restaurantSlug}/admin
                </small>
              </div>
              
              <div className="info-field">
                <label>Created At:</label>
                <span className="data-value">
                  {restaurantData?.createdAt ? 
                    new Date(restaurantData.createdAt).toLocaleString() : 
                    'N/A'}
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="info-card">
              <h3>
                <FaEnvelope /> Contact Information
              </h3>
              
              <div className="info-field">
                <label>Email:</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm.email || ""}
                    onChange={handleInputChange}
                    className="edit-input"
                    placeholder="owner@example.com"
                  />
                ) : (
                  <div className="value-with-copy">
                    <span className="data-value">{restaurantData?.email}</span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(restaurantData?.email)}
                    >
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
                    placeholder="9876543210"
                  />
                ) : (
                  <div className="value-with-copy">
                    <span className="data-value">{restaurantData?.mobile}</span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(restaurantData?.mobile)}
                    >
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
                    placeholder="Owner Full Name"
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
                    placeholder="Owner Mobile Number"
                  />
                ) : (
                  <span className="data-value">{restaurantData?.ownerMobile || "N/A"}</span>
                )}
              </div>
            </div>

            {/* Login Credentials */}
            <div className="info-card credentials-card">
              <h3>
                <FaLock /> Login Credentials
              </h3>
              
              <div className="info-field">
                <label>Owner Login (Email):</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm.email || ""}
                    onChange={handleInputChange}
                    className="edit-input"
                    placeholder="owner@example.com"
                  />
                ) : (
                  <div className="value-with-copy">
                    <span className="data-value">{restaurantData?.email}</span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(restaurantData?.email)}
                    >
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
                    placeholder="kitchen_username"
                  />
                ) : (
                  <div className="value-with-copy">
                    <span className="data-value">{restaurantData?.kitchenUsername}</span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(restaurantData?.kitchenUsername)}
                    >
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
                    placeholder="billing_username"
                  />
                ) : (
                  <div className="value-with-copy">
                    <span className="data-value">{restaurantData?.billingUsername}</span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(restaurantData?.billingUsername)}
                    >
                      <FaCopy />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="info-field">
                <label>Last Updated:</label>
                <span className="data-value">
                  {restaurantData?.updatedAt ? 
                    new Date(restaurantData.updatedAt).toLocaleDateString() : 
                    'Never'}
                </span>
              </div>
            </div>

            {/* Location Information */}
            <div className="info-card">
              <h3>
                <FaMapMarkerAlt /> Location Information
              </h3>
              
              <div className="info-field">
                <label>City:</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={editForm.city || ""}
                    onChange={handleInputChange}
                    className="edit-input"
                    placeholder="City"
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
                    placeholder="State"
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
                    placeholder="Country"
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
                    placeholder="Nearest landmark"
                  />
                ) : (
                  <span className="data-value">{restaurantData?.nearestPlace || "N/A"}</span>
                )}
              </div>
            </div>

            {/* Business Information */}
            <div className="info-card">
              <h3>
                <FaIdCard /> Business Information
              </h3>
              
              <div className="info-field">
                <label>GST Number:</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="gstNumber"
                    value={editForm.gstNumber || ""}
                    onChange={handleInputChange}
                    className="edit-input"
                    placeholder="GSTIN Number"
                    maxLength="15"
                  />
                ) : (
                  <span className="data-value">{restaurantData?.gstNumber || "N/A"}</span>
                )}
              </div>

              <div className="info-field">
                <label>
                  <FaPercentage /> GST Percentage:
                </label>
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
                {isEditing && (
                  <small className="input-hint">
                    Enter GST rate charged on food items (0-100%)
                  </small>
                )}
              </div>
              
              <div className="info-field">
                <label>Food License:</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="foodLicense"
                    value={editForm.foodLicense || ""}
                    onChange={handleInputChange}
                    className="edit-input"
                    placeholder="Food License Number"
                  />
                ) : (
                  <span className="data-value">{restaurantData?.foodLicense || "N/A"}</span>
                )}
              </div>
            </div>

            {/* Restaurant URLs */}
            <div className="info-card urls-card">
              <h3>
                <FaHome /> Restaurant URLs
              </h3>
              
              <div className="info-field">
                <label>Admin Panel:</label>
                <div className="url-value">
                  <code>/{restaurantSlug}/admin</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(`/${restaurantSlug}/admin`)}
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>
              
              <div className="info-field">
                <label>Dashboard:</label>
                <div className="url-value">
                  <code>/{restaurantSlug}/dashboard</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(`/${restaurantSlug}/dashboard`)}
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>
              
              <div className="info-field">
                <label>Set Menu:</label>
                <div className="url-value">
                  <code>/{restaurantSlug}/setmenu</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(`/${restaurantSlug}/setmenu`)}
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>
              
              <div className="info-field">
                <label>Public Menu:</label>
                <div className="url-value">
                  <code>/{restaurantSlug}/menu</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(`/${restaurantSlug}/menu`)}
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <h3>📊 Restaurant Statistics</h3>
        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-label">Restaurant Code</span>
            <span className="stat-value">{restaurantData?.restaurantCode}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Account Type</span>
            <span className="stat-value role-stat">
              {restaurantData?.role?.toUpperCase() || 'OWNER'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Registration Date</span>
            <span className="stat-value">
              {restaurantData?.createdAt ? 
                new Date(restaurantData.createdAt).toLocaleDateString() : 
                'N/A'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last Updated</span>
            <span className="stat-value">
              {restaurantData?.updatedAt ? 
                new Date(restaurantData.updatedAt).toLocaleDateString() : 
                'Never'}
            </span>
          </div>
          <div className="stat-item gst-stat">
            <span className="stat-label">GST Rate</span>
            <span className="stat-value">
              {restaurantData?.gstPercentage ? 
                `${restaurantData.gstPercentage}%` : 
                'Not Set'}
            </span>
          </div>
        </div>
      </div>

      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="copy-toast">
          <FaCheckCircle /> {copySuccess}
        </div>
      )}
    </div>
  );
};

export default Admin;