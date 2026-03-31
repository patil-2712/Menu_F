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

  const getRoleIcon = (role) => {
    switch(role) {
      case 'owner': return '👑';
      case 'kitchen': return '👨‍🍳';
      case 'billing': return '💰';
      default: return '👤';
    }
  };

  const getRoleDescription = (role) => {
    switch(role) {
      case 'owner': return 'Full access to restaurant management';
      case 'kitchen': return 'View and manage orders';
      case 'billing': return 'Process payments and invoices';
      default: return '';
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <div className="logo-icon">🍽️</div>
              <h1 className="brand-name">Menu</h1>
            </div>
            <div className="brand-tagline">
              <p>Streamline your restaurant operations with our all-in-one management solution</p>
            </div>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Real-time Analytics</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔄</span>
                <span>Order Management</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💳</span>
                <span>Smart Billing</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Secure Access</span>
              </div>
            </div>
            <div className="brand-quote">
              <p>"Efficient, reliable, and user-friendly — the perfect solution for modern restaurants."</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <div className="form-header">
            <h2>Welcome Back</h2>
           
          </div>

          {/* Backend Status Indicator */}
          <div className={`backend-status ${backendStatus}`}>
            {backendStatus === "connected" && (
              <span className="status-connected">✅ Backend Connected</span>
            )}
            {backendStatus === "checking" && (
              <span className="status-checking">🔄 Checking Connection...</span>
            )}
            {backendStatus === "error" && (
              <div className="status-error">
                <span>⚠️ Backend Connection Error</span>
                <button onClick={handleRetryConnection} className="retry-btn">
                  Retry
                </button>
              </div>
            )}
          </div>

          {serverError && (
            <div className="server-error">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{serverError}</span>
            </div>
          )}

          {/* Restaurant Info Preview */}
          {localStorage.getItem('restaurantName') && (
            <div className="restaurant-preview">
              <div className="preview-card">
                <span className="preview-icon">🏢</span>
                <div className="preview-details">
                  <span className="preview-label">Last Login:</span>
                  <strong className="preview-name">{localStorage.getItem('restaurantName')}</strong>
                  <small className="preview-slug">{localStorage.getItem('restaurantSlug')}</small>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Role Selection Dropdown */}
            <div className="form-group">
              <label className="form-label">
                Select Role
                <span className="required-star">*</span>
              </label>
              <div className="select-wrapper">
                <span className="select-icon">
                  {getRoleIcon(form.role)}
                </span>
                <select
                  className={`form-select ${errors.role ? 'error' : ''}`}
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  disabled={isSubmitting || backendStatus === "error"}
                >
                  <option value="owner">👑 Owner - Full Access</option>
                  <option value="kitchen">👨‍🍳 Kitchen - Order Management</option>
                  <option value="billing">💰 Billing - Payment Processing</option>
                </select>
                <span className="select-arrow">▼</span>
              </div>
              {getRoleDescription(form.role) && (
                <span className="role-description-hint">
                  {getRoleDescription(form.role)}
                </span>
              )}
            </div>

            {/* Username Field */}
            <div className="form-group">
              <label className="form-label">
                {form.role === 'owner' ? 'Email or Mobile Number' : 'Username'}
                <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
               
                <input
                  className={`form-input ${errors.username ? 'error' : ''}`}
                  name="username"
                  placeholder={
                    form.role === 'owner' 
                      ? "Enter email or 10-digit mobile number" 
                      : `Enter your ${form.role} username`
                  }
                  value={form.username}
                  onChange={handleChange}
                  disabled={isSubmitting || backendStatus === "error"}
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <span className="error-text">{errors.username}</span>
              )}
              {form.role === 'owner' && form.username && !errors.username && (
                <span className="input-hint success">
                  {form.username.includes('@') ? '✓ Valid email format' : '✓ Valid mobile number format'}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">
                Password
                <span className="required-star">*</span>
                {form.password.length > 0 && (
                  <span className={`password-strength ${form.password.length < 6 ? 'weak' : form.password.length < 10 ? 'good' : 'strong'}`}>
                    {form.password.length < 6 ? 'Weak' : form.password.length < 10 ? 'Good' : 'Strong'}
                  </span>
                )}
              </label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={isSubmitting || backendStatus === "error"}
                  autoComplete="current-password"
                />
                <button 
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || backendStatus === "error"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
              {form.password.length > 0 && !errors.password && (
                <div className="password-meter">
                  <div 
                    className={`meter-fill ${form.password.length < 6 ? 'weak' : form.password.length < 10 ? 'good' : 'strong'}`}
                    style={{width: `${Math.min(form.password.length * 10, 100)}%`}}
                  />
                </div>
              )}
            </div>

            {/* Form Options */}
            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox-input"
                  disabled={isSubmitting || backendStatus === "error"}
                />
                <span className="checkbox-label">Remember me</span>
              </label>
              
              <button 
                type="button" 
                className="forgot-password-link"
                onClick={handleForgotPassword}
                disabled={isSubmitting || backendStatus === "error"}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="login-submit-btn"
              disabled={isSubmitting || backendStatus === "error"}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Login as {form.role.charAt(0).toUpperCase() + form.role.slice(1)}</span>
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>
            
            {/* Form Footer */}
            <div className="form-footer">
              <p className="register-prompt">
                Don't have an account?{" "}
                <button 
                  type="button"
                  className="register-link"
                  onClick={() => navigate("/register")}
                >
                  Register Now
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;