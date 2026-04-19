import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RestaurantRegister.css";

function RestaurantRegister() {
  const navigate = useNavigate();
  
  // DIRECT RENDER BACKEND URL - Hardcoded
  const API_URL = 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Using Render Backend URL:', API_URL);
  
  // Initial empty form state
  const initialFormState = {
    restaurantCode: "",
    restaurantName: "",
    gstNumber: "",
    gstPercentage: "",
    foodLicense: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    state: "",
    country: "",
    nearestPlace: "",
    latitude: "",
    longitude: "",
    ownerName: "",
    ownerMobile: "",
    kitchenUsername: "",
    kitchenPassword: "",
    billingUsername: "",
    billingPassword: ""
  };

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [credentials, setCredentials] = useState(null);
  const [showKitchenPassword, setShowKitchenPassword] = useState(false);
  const [showBillingPassword, setShowBillingPassword] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    generateRestaurantCode();
  }, []);

  const generateRestaurantCode = () => {
    const code = "REST-" + Math.floor(100000 + Math.random() * 900000);
    setForm(prev => ({ ...prev, restaurantCode: code }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setErrors({});
    setTouched({});
    setCredentials(null);
    setServerError("");
    setShowKitchenPassword(false);
    setShowBillingPassword(false);
    setLocationError("");
    generateRestaurantCode();
  };

  // Get current location automatically
  const detectLocation = () => {
    setDetectingLocation(true);
    setLocationError("");
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setDetectingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setForm(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));
        
        // Optional: Reverse geocoding to get city, state, country
        try {
          const response = await axios.get(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (response.data) {
            const location = response.data;
            setForm(prev => ({
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
        setLocationError(errorMsg);
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const validateField = (name, value) => {
    const err = { ...errors };
    
    switch (name) {
      case "restaurantName":
        if (!value) err.restaurantName = "Restaurant name is required";
        else if (value.length < 3) err.restaurantName = "Restaurant name must be at least 3 characters";
        else delete err.restaurantName;
        break;
        
      case "mobile":
        if (!value) err.mobile = "Mobile number is required";
        else if (!/^\d+$/.test(value)) err.mobile = "Mobile must contain only numbers";
        else if (value.length !== 10) err.mobile = "Mobile must be exactly 10 digits";
        else delete err.mobile;
        break;
        
      case "email":
        if (!value) err.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(value)) err.email = "Invalid email format";
        else delete err.email;
        break;
        
      case "password":
        if (!value) err.password = "Password is required";
        else if (value.length < 6) err.password = "Password must be at least 6 characters";
        else if (form.confirmPassword && value !== form.confirmPassword) {
          err.confirmPassword = "Passwords do not match";
        } else {
          delete err.password;
          if (form.confirmPassword && value === form.confirmPassword) {
            delete err.confirmPassword;
          }
        }
        break;
        
      case "confirmPassword":
        if (!value) err.confirmPassword = "Please confirm your password";
        else if (value !== form.password) err.confirmPassword = "Passwords do not match";
        else delete err.confirmPassword;
        break;
        
      case "gstNumber":
        if (value && value.length !== 15) err.gstNumber = "GST number must be 15 characters";
        else delete err.gstNumber;
        break;
        
      case "gstPercentage":
        if (value) {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) err.gstPercentage = "GST percentage must be a number";
          else if (numValue < 0) err.gstPercentage = "GST percentage cannot be negative";
          else if (numValue > 100) err.gstPercentage = "GST percentage cannot exceed 100%";
          else delete err.gstPercentage;
        } else {
          delete err.gstPercentage;
        }
        break;
        
      case "latitude":
        if (value) {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) err.latitude = "Latitude must be a number";
          else if (numValue < -90 || numValue > 90) err.latitude = "Latitude must be between -90 and 90";
          else delete err.latitude;
        } else {
          delete err.latitude;
        }
        break;
        
      case "longitude":
        if (value) {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) err.longitude = "Longitude must be a number";
          else if (numValue < -180 || numValue > 180) err.longitude = "Longitude must be between -180 and 180";
          else delete err.longitude;
        } else {
          delete err.longitude;
        }
        break;
        
      case "ownerMobile":
        if (value && !/^\d+$/.test(value)) err.ownerMobile = "Owner mobile must contain only numbers";
        else if (value && value.length !== 10) err.ownerMobile = "Owner mobile must be 10 digits";
        else delete err.ownerMobile;
        break;
        
      case "kitchenUsername":
        if (!value) err.kitchenUsername = "Kitchen username is required";
        else if (value.length < 3) err.kitchenUsername = "Kitchen username must be at least 3 characters";
        else delete err.kitchenUsername;
        break;
        
      case "kitchenPassword":
        if (!value) err.kitchenPassword = "Kitchen password is required";
        else if (value.length < 6) err.kitchenPassword = "Kitchen password must be at least 6 characters";
        else delete err.kitchenPassword;
        break;
        
      case "billingUsername":
        if (!value) err.billingUsername = "Billing username is required";
        else if (value.length < 3) err.billingUsername = "Billing username must be at least 3 characters";
        else delete err.billingUsername;
        break;
        
      case "billingPassword":
        if (!value) err.billingPassword = "Billing password is required";
        else if (value.length < 6) err.billingPassword = "Billing password must be at least 6 characters";
        else delete err.billingPassword;
        break;
        
      case "city":
        if (!value) err.city = "City is required";
        else if (value.length < 2) err.city = "City must be at least 2 characters";
        else delete err.city;
        break;
        
      case "state":
        if (!value) err.state = "State is required";
        else if (value.length < 2) err.state = "State must be at least 2 characters";
        else delete err.state;
        break;
        
      case "country":
        if (!value) err.country = "Country is required";
        else if (value.length < 2) err.country = "Country must be at least 2 characters";
        else delete err.country;
        break;
        
      case "nearestPlace":
        if (!value) err.nearestPlace = "Nearest place is required";
        else if (value.length < 3) err.nearestPlace = "Nearest place must be at least 3 characters";
        else delete err.nearestPlace;
        break;
        
      default:
        break;
    }
    
    setErrors(err);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const validateForm = () => {
    const newTouched = {};
    Object.keys(form).forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);
    
    validateField("restaurantName", form.restaurantName);
    validateField("mobile", form.mobile);
    validateField("email", form.email);
    validateField("password", form.password);
    validateField("confirmPassword", form.confirmPassword);
    validateField("gstNumber", form.gstNumber);
    validateField("gstPercentage", form.gstPercentage);
    validateField("latitude", form.latitude);
    validateField("longitude", form.longitude);
    validateField("ownerMobile", form.ownerMobile);
    validateField("kitchenUsername", form.kitchenUsername);
    validateField("kitchenPassword", form.kitchenPassword);
    validateField("billingUsername", form.billingUsername);
    validateField("billingPassword", form.billingPassword);
    validateField("city", form.city);
    validateField("state", form.state);
    validateField("country", form.country);
    validateField("nearestPlace", form.nearestPlace);
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setCredentials(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Send request directly to Render backend
      const response = await axios.post(
        `${API_URL}/api/restaurant/register`,
        {
          ...form,
          gstPercentage: form.gstPercentage ? parseFloat(form.gstPercentage) : null,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      setCredentials(response.data);
      alert("Restaurant Registered Successfully! Redirecting to login page...");
      
      setTimeout(() => {
        resetForm();
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      console.error('❌ Registration error:', err);
      
      let errorMessage = "Registration failed. ";
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Server is not responding.";
      } else if (err.response) {
        if (err.response.status === 503) {
          errorMessage = "Server is temporarily unavailable. Please try again later.";
        } else if (err.response.status === 502) {
          errorMessage = "Bad gateway. Server might be restarting. Please wait a moment.";
        } else if (err.response.status === 500) {
          errorMessage = "Internal server error. Please check MongoDB connection.";
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = `Cannot connect to server at ${API_URL}. Make sure backend is running.`;
      } else {
        errorMessage += err.message;
      }
      
      setServerError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="page-header">
          <div className="header-left">
            <h1 className="app-title">🍽️ Restaurant Management</h1>
          </div>
          <div className="header-right">
            <button 
              className="login-nav-btn"
              onClick={() => navigate("/login")}
            >
              ← Back to Login
            </button>
          </div>
        </div>

        <div className="register-header">
          <h2>Restaurant Registration</h2>
          <p>Register your restaurant to start managing orders</p>
        </div>

        {serverError && (
          <div className="server-error">{serverError}</div>
        )}

        {credentials && (
          <div className="credentials-card">
            <h3>📋 Save These Credentials</h3>
            <div className="credential-item">
              <strong>Restaurant Slug:</strong> {credentials.restaurantSlug}
            </div>
            <div className="credential-item">
              <strong>Your Restaurant URL:</strong> {API_URL}/{credentials.restaurantSlug}/setmenu
            </div>
            <div className="credential-item">
              <strong>Owner Login:</strong> Use email/mobile and your password
            </div>
            <div className="credential-item">
              <strong>Kitchen Username:</strong> {form.kitchenUsername}
            </div>
            <div className="credential-item">
              <strong>Kitchen Password:</strong> {form.kitchenPassword}
            </div>
            <div className="credential-item">
              <strong>Billing Username:</strong> {form.billingUsername}
            </div>
            <div className="credential-item">
              <strong>Billing Password:</strong> {form.billingPassword}
            </div>
            <div className="credential-note">
              <strong>Note:</strong> Save these credentials. You will need them to login.
            </div>
            <div className="redirect-message">
              ⏳ Redirecting to login page in 2 seconds...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label className="form-label">
              Restaurant Code <span className="required">*</span>
            </label>
            <input
              className="form-input"
              value={form.restaurantCode}
              readOnly
            />
            <div className="helper-text">Auto-generated unique code</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Restaurant Name <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.restaurantName ? 'error' : ''}`}
                name="restaurantName"
                placeholder="Enter restaurant name"
                value={form.restaurantName}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.restaurantName && errors.restaurantName && (
                <span className="error-text">{errors.restaurantName}</span>
              )}
              <div className="helper-text">This will create your restaurant URL</div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                className={`form-input ${errors.gstNumber ? 'error' : ''}`}
                name="gstNumber"
                placeholder="15-digit GST number"
                value={form.gstNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength="15"
              />
              {touched.gstNumber && errors.gstNumber && (
                <span className="error-text">{errors.gstNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">GST Percentage (%)</label>
              <input
                className={`form-input ${errors.gstPercentage ? 'error' : ''}`}
                name="gstPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="e.g., 18, 12, 5"
                value={form.gstPercentage}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.gstPercentage && errors.gstPercentage && (
                <span className="error-text">{errors.gstPercentage}</span>
              )}
              <div className="helper-text">GST rate charged on food items</div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Food License</label>
              <input
                className="form-input"
                name="foodLicense"
                placeholder="Food license number"
                value={form.foodLicense}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Mobile <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.mobile ? 'error' : ''}`}
                name="mobile"
                placeholder="10-digit mobile number"
                value={form.mobile}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength="10"
              />
              {touched.mobile && errors.mobile && (
                <span className="error-text">{errors.mobile}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Email <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.email ? 'error' : ''}`}
                name="email"
                placeholder="example@domain.com"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                type="email"
              />
              {touched.email && errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>
          </div>

          {/* Location Section with Latitude/Longitude */}
          <div className="location-section">
            <h3 className="section-title">📍 Restaurant Location</h3>
            
            {/* Auto-detect Location Button */}
            <div className="location-detect-section">
              <button 
                type="button"
                className="detect-location-btn"
                onClick={detectLocation}
                disabled={detectingLocation}
              >
                {detectingLocation ? "📍 Detecting..." : "📍 Detect Current Location"}
              </button>
              {locationError && <div className="location-error">{locationError}</div>}
              <div className="helper-text">Click to automatically fill coordinates and location details</div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input
                  className={`form-input ${errors.latitude ? 'error' : ''}`}
                  name="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 19.0760"
                  value={form.latitude}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.latitude && errors.latitude && (
                  <span className="error-text">{errors.latitude}</span>
                )}
                <div className="helper-text">Enter restaurant latitude (e.g., 19.0760)</div>
              </div>

              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input
                  className={`form-input ${errors.longitude ? 'error' : ''}`}
                  name="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 72.8777"
                  value={form.longitude}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.longitude && errors.longitude && (
                  <span className="error-text">{errors.longitude}</span>
                )}
                <div className="helper-text">Enter restaurant longitude (e.g., 72.8777)</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  City <span className="required">*</span>
                </label>
                <input
                  className={`form-input ${errors.city ? 'error' : ''}`}
                  name="city"
                  placeholder="Enter city"
                  value={form.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.city && errors.city && (
                  <span className="error-text">{errors.city}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  State <span className="required">*</span>
                </label>
                <input
                  className={`form-input ${errors.state ? 'error' : ''}`}
                  name="state"
                  placeholder="Enter state"
                  value={form.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.state && errors.state && (
                  <span className="error-text">{errors.state}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Country <span className="required">*</span>
                </label>
                <input
                  className={`form-input ${errors.country ? 'error' : ''}`}
                  name="country"
                  placeholder="Enter country"
                  value={form.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.country && errors.country && (
                  <span className="error-text">{errors.country}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Nearest Place <span className="required">*</span>
                </label>
                <input
                  className={`form-input ${errors.nearestPlace ? 'error' : ''}`}
                  name="nearestPlace"
                  placeholder="e.g., Near Metro Station, Shopping Mall"
                  value={form.nearestPlace}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.nearestPlace && errors.nearestPlace && (
                  <span className="error-text">{errors.nearestPlace}</span>
                )}
                <div className="helper-text">Landmark or nearest popular place</div>
              </div>
            </div>
          </div>

          <div className="credentials-section">
            <h3 className="section-title">Kitchen Credentials</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Kitchen Username <span className="required">*</span>
                </label>
                <input
                  className={`form-input ${errors.kitchenUsername ? 'error' : ''}`}
                  name="kitchenUsername"
                  placeholder="Enter kitchen username"
                  value={form.kitchenUsername}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.kitchenUsername && errors.kitchenUsername && (
                  <span className="error-text">{errors.kitchenUsername}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Kitchen Password <span className="required">*</span>
                </label>
                <div className="password-input-group">
                  <input
                    className={`form-input ${errors.kitchenPassword ? 'error' : ''}`}
                    type={showKitchenPassword ? "text" : "password"}
                    name="kitchenPassword"
                    placeholder="Enter kitchen password"
                    value={form.kitchenPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <button 
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowKitchenPassword(!showKitchenPassword)}
                  >
                    {showKitchenPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {touched.kitchenPassword && errors.kitchenPassword && (
                  <span className="error-text">{errors.kitchenPassword}</span>
                )}
                <div className="helper-text">Minimum 6 characters</div>
              </div>
            </div>
          </div>

          <div className="credentials-section">
            <h3 className="section-title">Billing Credentials</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Billing Username <span className="required">*</span>
                </label>
                <input
                  className={`form-input ${errors.billingUsername ? 'error' : ''}`}
                  name="billingUsername"
                  placeholder="Enter billing username"
                  value={form.billingUsername}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.billingUsername && errors.billingUsername && (
                  <span className="error-text">{errors.billingUsername}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Billing Password <span className="required">*</span>
                </label>
                <div className="password-input-group">
                  <input
                    className={`form-input ${errors.billingPassword ? 'error' : ''}`}
                    type={showBillingPassword ? "text" : "password"}
                    name="billingPassword"
                    placeholder="Enter billing password"
                    value={form.billingPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <button 
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowBillingPassword(!showBillingPassword)}
                  >
                    {showBillingPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {touched.billingPassword && errors.billingPassword && (
                  <span className="error-text">{errors.billingPassword}</span>
                )}
                <div className="helper-text">Minimum 6 characters</div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Owner Password <span className="required">*</span>
              </label>
              <div className="password-input-group">
                <input
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {touched.password && errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Owner Name</label>
              <input
                className="form-input"
                name="ownerName"
                placeholder="Owner's full name"
                value={form.ownerName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Owner Mobile</label>
              <input
                className={`form-input ${errors.ownerMobile ? 'error' : ''}`}
                name="ownerMobile"
                placeholder="Owner's 10-digit mobile"
                value={form.ownerMobile}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength="10"
              />
              {touched.ownerMobile && errors.ownerMobile && (
                <span className="error-text">{errors.ownerMobile}</span>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Register Restaurant"}
          </button>
          
          <div className="login-redirect">
            <p>Already have a restaurant account?</p>
            <button 
              type="button"
              className="login-redirect-btn"
              onClick={() => navigate("/login")}
            >
              Go to Login Page →
            </button>
          </div>
          
          <p className="terms">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
}

export default RestaurantRegister;