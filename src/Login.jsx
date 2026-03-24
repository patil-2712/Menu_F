import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login({ setToken }) {
  const navigate = useNavigate();
  
  // Get backend URL from environment variable or use Render URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 Login using backend:', API_URL);
  
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "billing"
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [connectionRetryCount, setConnectionRetryCount] = useState(0);

  useEffect(() => {
    checkBackendConnection();
    
    const savedUsername = localStorage.getItem('savedUsername');
    const savedRole = localStorage.getItem('savedRole');
    
    if (savedUsername && savedRole) {
      setForm({
        username: savedUsername,
        password: "",
        role: savedRole
      });
      setRememberMe(true);
    }
  }, []);

  const checkBackendConnection = async () => {
    try {
      console.log("🔍 Checking backend connection...");
      setBackendStatus("checking");
      
      // CHANGED: Use full URL with API_URL
      const response = await axios.get(`${API_URL}/api/test`, { 
        timeout: 3000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log("✅ Backend connected:", response.data);
      setBackendStatus("connected");
      setServerError("");
      return true;
    } catch (err) {
      console.error("❌ Backend not connected:", err.message);
      setBackendStatus("error");
      
      if (connectionRetryCount < 3) {
        setConnectionRetryCount(prev => prev + 1);
        setServerError(`Backend connection failed (Attempt ${connectionRetryCount + 1}/3). Retrying...`);
        
        setTimeout(() => {
          checkBackendConnection();
        }, 2000);
      } else {
        setServerError(`Backend server is not running. Please start the backend server.`);
      }
      
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    setServerError("");
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.username.trim()) {
      newErrors.username = form.role === 'owner' 
        ? "Email or mobile number is required" 
        : "Username is required";
    } else if (form.role === 'owner') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const mobileRegex = /^[0-9]{10}$/;
      
      if (!emailRegex.test(form.username) && !mobileRegex.test(form.username)) {
        newErrors.username = "Please enter a valid email or 10-digit mobile number";
      }
    }
    
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setConnectionRetryCount(0);
    
    if (!validateForm()) return;
    
    if (backendStatus === "error") {
      const connected = await checkBackendConnection();
      if (!connected) {
        setServerError(`Cannot connect to backend server. Please start the backend server.`);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("🔐 Sending login request for role:", form.role);
      
      const dataToSend = {
        ...form,
        username: form.username.trim(),
        timestamp: new Date().toISOString(),
        client: "web-dashboard"
      };
      
      document.body.style.cursor = 'wait';
      
      // CHANGED: Use full URL with API_URL
      const response = await axios.post(
        `${API_URL}/api/restaurant/login`,
        dataToSend,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Version': '1.0.0'
          },
          timeout: 10000
        }
      );
      
      console.log("✅ Login response received:", response.data);
      
      let token, user;
      
      if (response.data.token) {
        token = response.data.token;
        user = response.data.user || response.data;
      } else if (response.data.accessToken) {
        token = response.data.accessToken;
        user = response.data.user || response.data;
      } else if (response.data.jwtToken) {
        token = response.data.jwtToken;
        user = response.data;
      } else {
        console.error("❌ ERROR: Token missing from response");
        setServerError("Server error: Invalid response format (no token received)");
        return;
      }
      
      console.log("👤 User data from backend:", user);
      
      const restaurantName = user.restaurantName || user.name || "My Restaurant";
      const restaurantCode = user.restaurantCode || user.code || "REST001";
      const restaurantSlug = user.restaurantSlug || 
                            user.slug || 
                            restaurantName.toLowerCase().replace(/\s+/g, '-');
      
      console.log("🏢 Restaurant info:", {
        name: restaurantName,
        code: restaurantCode,
        slug: restaurantSlug
      });
      
      if (rememberMe) {
        localStorage.setItem('savedUsername', form.username.trim());
        localStorage.setItem('savedRole', form.role);
        localStorage.setItem('lastLoginTimestamp', Date.now().toString());
      } else {
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedRole');
        localStorage.removeItem('lastLoginTimestamp');
      }
      
      localStorage.setItem("token", token);
      localStorage.setItem("tokenTimestamp", Date.now().toString());
      localStorage.setItem("userRole", form.role);
      localStorage.setItem("userName", user.name || form.username);
      localStorage.setItem("restaurantSlug", restaurantSlug);
      localStorage.setItem("restaurantName", restaurantName);
      localStorage.setItem("restaurantCode", restaurantCode);
      
      const sessionDuration = 8;
      localStorage.setItem("sessionExpiry", (Date.now() + (sessionDuration * 60 * 60 * 1000)).toString());
      localStorage.setItem("lastActivity", Date.now().toString());
      
      if (setToken) setToken(token);
      
      setServerError("");
      
      setTimeout(() => {
        if (form.role === 'kitchen') {
          console.log("👨‍🍳 Redirecting kitchen staff to Korder:", `/${restaurantSlug}/Korder`);
          navigate(`/${restaurantSlug}/Korder`, { replace: true });
        } else if (form.role === 'billing') {
          console.log("💰 Redirecting billing staff to Border:", `/${restaurantSlug}/border`);
          navigate(`/${restaurantSlug}/border`, { replace: true });
        } else if (form.role === 'owner') {
          console.log("👑 Redirecting owner to Admin:", `/${restaurantSlug}/admin`);
          navigate(`/${restaurantSlug}/admin`, { replace: true });
        } else {
          navigate(`/${restaurantSlug}/admin`, { replace: true });
        }
      }, 500);
      
    } catch (err) {
      console.error("❌ Login error details:", err);
      
      let errorMessage = "Login failed. Please try again.";
      let showRetry = false;
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Server is not responding.";
        showRetry = true;
      } else if (err.response) {
        console.error("📊 Response error:", err.response.data);
        console.error("📊 Status code:", err.response.status);
        
        if (err.response.status === 400) {
          errorMessage = err.response.data?.message || "Invalid credentials. Please check your username and password.";
        } else if (err.response.status === 401) {
          errorMessage = "Unauthorized access. Please contact administrator.";
        } else if (err.response.status === 403) {
          errorMessage = "Access denied. Your account may be suspended.";
        } else if (err.response.status === 404) {
          errorMessage = "Account not found. Please check your credentials.";
        } else if (err.response.status === 422) {
          errorMessage = "Invalid input data. Please check your details.";
        } else if (err.response.status === 429) {
          errorMessage = "Too many login attempts. Please try again in 15 minutes.";
        } else if (err.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
          showRetry = true;
        } else if (err.response.status === 503) {
          errorMessage = "Service temporarily unavailable. Please try again later.";
          showRetry = true;
        } else {
          errorMessage = `Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`;
        }
      } else if (err.request) {
        console.error("🌐 No response received:", err.request);
        errorMessage = `Cannot connect to server. Please check if backend is running at ${API_URL}`;
        showRetry = true;
        setBackendStatus("error");
      } else {
        console.error("⚡ Other error:", err.message);
      }
      
      setServerError(errorMessage);
      
      if (showRetry) {
        setTimeout(() => {
          setServerError(prev => prev + " Click 'Retry Connection' to try again.");
        }, 1000);
      }
      
    } finally {
      setIsSubmitting(false);
      document.body.style.cursor = 'default';
    }
  };

  const handleRetryConnection = async () => {
    setServerError("");
    setIsSubmitting(true);
    setConnectionRetryCount(0);
    
    const connected = await checkBackendConnection();
    
    if (!connected) {
      setServerError(`Cannot connect to backend. Make sure server is running.`);
    } else {
      setServerError("✅ Backend connected! Try logging in again.");
    }
    
    setIsSubmitting(false);
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleRoleSelect = (role) => {
    setForm({...form, role: role});
    setErrors({});
    setServerError("");
  };

  const handleQuickLogin = (credentials) => {
    setForm(credentials);
    setTimeout(() => {
      document.querySelector('.submit-btn').focus();
    }, 100);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Connection Status */}
        <div className="connection-status">
          <span className={`status-indicator ${backendStatus}`}>
            {backendStatus === "connected" ? "●" : backendStatus === "checking" ? "⏳" : "○"}
          </span>
          <span className="status-text">
            {backendStatus === "connected" 
              ? `Connected to backend server (${API_URL})` 
              : backendStatus === "checking"
              ? "Checking backend connection..."
              : "Disconnected from backend server"}
          </span>
        </div>

        {/* Backend Connection Alert */}
        {backendStatus === "error" && (
          <div className="connection-alert">
            <div className="alert-header">
              <span className="alert-icon">⚠️</span>
              <strong>Backend Connection Error</strong>
            </div>
            <p>Cannot connect to backend server at {API_URL}</p>
            <div className="alert-tips">
              <small>• Make sure backend server is running</small>
              <small>• Check if backend is deployed on Render</small>
              <small>• Verify network connection</small>
            </div>
            <div className="alert-actions">
              <button 
                className="retry-btn"
                onClick={handleRetryConnection}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="mini-spinner"></span>
                    Retrying...
                  </>
                ) : (
                  <>
                    🔄 Retry Connection
                  </>
                )}
              </button>
              <button 
                className="help-btn"
                onClick={() => window.open(API_URL, "_blank")}
              >
                🌐 Open Backend
              </button>
            </div>
          </div>
        )}

        {/* Restaurant Info Preview */}
        <div className="restaurant-info-preview">
          {localStorage.getItem('restaurantName') && (
            <div className="restaurant-badge">
              <span className="badge-icon">🏢</span>
              <div className="badge-content">
                <strong>Last Restaurant:</strong>
                <span className="restaurant-name">{localStorage.getItem('restaurantName')}</span>
                <small className="restaurant-slug">{localStorage.getItem('restaurantSlug')}</small>
              </div>
            </div>
          )}
        </div>

        {/* Server Error Display */}
        {serverError && !serverError.includes("Backend Connection") && (
          <div className="server-error">
            <div className="error-header">
              <span className="error-icon">❌</span>
              <strong>Login Failed</strong>
            </div>
            <p className="error-message">{serverError}</p>
            <div className="error-tips">
              <small>• Check your username and password</small>
              <small>• Make sure you're using the correct role</small>
              <small>• Contact admin if issues persist</small>
            </div>
            {serverError.includes("Retry Connection") && (
              <button 
                className="inline-retry-btn"
                onClick={handleRetryConnection}
              >
                🔄 Retry Connection
              </button>
            )}
          </div>
        )}

        {/* Quick Demo Login */}
        <div className="demo-login-section">
          <h4>Quick Login</h4>
          <div className="demo-buttons">
            <button 
              className="demo-btn owner-demo"
              onClick={() => handleQuickLogin({
                username: "",
                password: "",
                role: "owner"
              })}
              disabled={isSubmitting || backendStatus === "error"}
            >
              👑 Owner Demo
            </button>
            <button 
              className="demo-btn billing-demo"
              onClick={() => handleQuickLogin({
                username: "",
                password: "",
                role: "billing"
              })}
              disabled={isSubmitting || backendStatus === "error"}
            >
              💰 Billing Demo
            </button>
            <button 
              className="demo-btn kitchen-demo"
              onClick={() => handleQuickLogin({
                username: "",
                password: "",
                role: "kitchen"
              })}
              disabled={isSubmitting || backendStatus === "error"}
            >
              👨‍🍳 Kitchen Demo
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">Select Role</label>
            <div className="role-selection">
              <div 
                className={`role-card ${form.role === 'owner' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('owner')}
              >
                <span className="role-icon">👑</span>
                <span className="role-name">Owner</span>
                <div className="role-check">
                  {form.role === 'owner' && '✓'}
                </div>
              </div>
              
              <div 
                className={`role-card ${form.role === 'kitchen' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('kitchen')}
              >
                <span className="role-icon">👨‍🍳</span>
                <span className="role-name">Kitchen</span>
                <div className="role-check">
                  {form.role === 'kitchen' && '✓'}
                </div>
              </div>
              
              <div 
                className={`role-card ${form.role === 'billing' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('billing')}
              >
                <span className="role-icon">💰</span>
                <span className="role-name">Billing</span>
                <div className="role-check">
                  {form.role === 'billing' && '✓'}
                </div>
              </div>
            </div>
          </div>

          {/* Username Field */}
          <div className="form-group">
            <label className="form-label">
              {form.role === 'owner' ? 'Email or Mobile Number' : 'Username'} 
              <span className="required">*</span>
            </label>
            <input
              className={`form-input ${errors.username ? 'error' : ''}`}
              name="username"
              placeholder={
                form.role === 'owner' 
                  ? "Enter email (owner@example.com) or 10-digit mobile" 
                  : `Enter your ${form.role} username`
              }
              value={form.username}
              onChange={handleChange}
              disabled={isSubmitting || backendStatus === "error"}
              autoComplete="username"
            />
            {errors.username && (
              <span className="error-text">{errors.username}</span>
            )}
            {form.role === 'owner' && form.username && !errors.username && (
              <span className="input-hint">
                {form.username.includes('@') ? '✓ Valid email format' : '✓ Mobile number'}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">
              Password <span className="required">*</span>
              <span className="password-strength">
                {form.password.length > 0 && (
                  form.password.length < 6 ? 'Weak' :
                  form.password.length < 10 ? 'Good' : 'Strong'
                )}
              </span>
            </label>
            <div className="password-input-group">
              <input
                className={`form-input ${errors.password ? 'error' : ''}`}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={
                  form.role === 'owner' 
                    ? "Enter owner password (min 6 characters)" 
                    : `Enter ${form.role} password (min 6 characters)`
                }
                value={form.password}
                onChange={handleChange}
                disabled={isSubmitting || backendStatus === "error"}
                autoComplete="current-password"
              />
              <button 
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting || backendStatus === "error"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
            {form.password.length > 0 && !errors.password && (
              <div className="password-meter">
                <div 
                  className={`meter-bar ${form.password.length < 6 ? 'weak' : form.password.length < 10 ? 'good' : 'strong'}`}
                  style={{width: `${Math.min(form.password.length * 10, 100)}%`}}
                ></div>
              </div>
            )}
          </div>

          {/* Form Options */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox-input"
                disabled={isSubmitting || backendStatus === "error"}
              />
              <span className="checkbox-text">Remember username & role</span>
            </label>
            
            <button 
              type="button" 
              className="forgot-password-btn"
              onClick={handleForgotPassword}
              disabled={isSubmitting || backendStatus === "error"}
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting || backendStatus === "error"}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Logging in...
                <span className="login-progress">Please wait</span>
              </>
            ) : (
              <>
                <span className="btn-icon">
                  {form.role === 'kitchen' ? '👨‍🍳' : 
                   form.role === 'owner' ? '👑' : '💰'}
                </span>
                Login as {form.role.charAt(0).toUpperCase() + form.role.slice(1)}
                <span className="btn-hint">
                  {form.role === 'kitchen' ? '→ Korder Page' :
                   form.role === 'owner' ? '→ Admin Page' : '→ Border Page'}
                </span>
              </>
            )}
          </button>
          
          {/* Form Footer */}
          <div className="form-footer">
            <p className="switch-text">
              Don't have a restaurant account?{" "}
              <span 
                className="switch-link"
                onClick={() => navigate("/register")}
                role="button"
                tabIndex={0}
              >
                Register Now
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;