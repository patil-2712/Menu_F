import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get backend URL from environment variable or use Render URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://menu-b-ym9l.onrender.com';
  
  console.log('🔧 ForgotPassword using backend:', API_URL);
  
  // Get role from location state or default to owner
  const initialRole = location.state?.role || "owner";
  
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: "",
    email: "", // Will store full email
    maskedEmail: "", // Will store masked email for display
    role: initialRole,
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    
    if (name === "newPassword") {
      checkPasswordStrength(value);
    }
    
    setServerError("");
  };
  
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength("");
    } else if (password.length < 6) {
      setPasswordStrength("weak");
    } else if (password.length < 10) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  };
  
  const handleRoleSelect = (role) => {
    setForm({ ...form, role: role, username: "", email: "", maskedEmail: "" });
    setErrors({});
    setServerError("");
  };
  
  const validateRequestOtp = () => {
    const newErrors = {};
    
    if (!form.username.trim()) {
      newErrors.username = `${form.role === 'owner' ? 'Email/Mobile' : 'Username'} is required`;
    } else if (form.role === 'owner') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const mobileRegex = /^[0-9]{10}$/;
      if (!emailRegex.test(form.username) && !mobileRegex.test(form.username)) {
        newErrors.username = "Please enter valid email or 10-digit mobile";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateVerifyOtp = () => {
    const newErrors = {};
    
    if (!form.otp.trim()) {
      newErrors.otp = "OTP is required";
    } else if (!/^\d{6}$/.test(form.otp)) {
      newErrors.otp = "OTP must be 6 digits";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateResetPassword = () => {
    const newErrors = {};
    
    if (!form.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (form.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setServerError("");
    
    if (!validateRequestOtp()) return;
    
    setIsSubmitting(true);
    
    try {
      // CHANGED: Use full URL with API_URL
      const response = await axios.post(
        `${API_URL}/api/restaurant/request-otp`,
        {
          username: form.username.trim(),
          role: form.role
        },
        { timeout: 10000 }
      );
      
      console.log("OTP request response:", response.data);
      
      // Store both masked and full email
      setForm({ 
        ...form, 
        email: response.data.fullEmail, // Store full email for verification
        maskedEmail: response.data.maskedEmail // Store masked email for display
      });
      
      setSuccessMessage(`OTP sent to ${response.data.maskedEmail}`);
      setStep(2);
      setTimer(300); // 5 minutes timer
      setCanResend(false);
      
    } catch (err) {
      console.error("OTP request error:", err);
      
      if (err.response) {
        setServerError(err.response.data.message || "Failed to send OTP");
      } else if (err.request) {
        setServerError("Cannot connect to server. Please check your connection.");
      } else {
        setServerError("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setServerError("");
    
    if (!validateVerifyOtp()) return;
    
    setIsSubmitting(true);
    
    try {
      // CHANGED: Use full URL with API_URL
      const response = await axios.post(
        `${API_URL}/api/restaurant/verify-otp`,
        {
          email: form.email, // This is the full email
          otp: form.otp,
          role: form.role
        },
        { timeout: 10000 }
      );
      
      console.log("OTP verification response:", response.data);
      
      setTempToken(response.data.tempToken);
      setSuccessMessage("OTP verified successfully!");
      setStep(3);
      
    } catch (err) {
      console.error("OTP verification error:", err);
      
      if (err.response) {
        setServerError(err.response.data.message || "Invalid OTP");
      } else if (err.request) {
        setServerError("Cannot connect to server. Please check your connection.");
      } else {
        setServerError("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setServerError("");
    setIsSubmitting(true);
    
    try {
      // CHANGED: Use full URL with API_URL
      const response = await axios.post(
        `${API_URL}/api/restaurant/resend-otp`,
        {
          email: form.email, // Use full email
          role: form.role
        },
        { timeout: 10000 }
      );
      
      console.log("Resend OTP response:", response.data);
      
      setSuccessMessage("New OTP sent successfully!");
      setTimer(300);
      setCanResend(false);
      setForm({ ...form, otp: "" });
      
    } catch (err) {
      console.error("Resend OTP error:", err);
      
      if (err.response) {
        setServerError(err.response.data.message || "Failed to resend OTP");
      } else {
        setServerError("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setServerError("");
    
    if (!validateResetPassword()) return;
    
    setIsSubmitting(true);
    
    try {
      // CHANGED: Use full URL with API_URL
      const response = await axios.post(
        `${API_URL}/api/restaurant/reset-password`,
        {
          email: form.email,
          role: form.role,
          newPassword: form.newPassword,
          tempToken: tempToken
        },
        { timeout: 10000 }
      );
      
      console.log("Password reset response:", response.data);
      
      setSuccessMessage("Password reset successfully! Redirecting to login...");
      
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: "Password reset successful. Please login with your new password.",
            role: form.role 
          } 
        });
      }, 3000);
      
    } catch (err) {
      console.error("Password reset error:", err);
      
      if (err.response) {
        setServerError(err.response.data.message || "Failed to reset password");
      } else if (err.request) {
        setServerError("Cannot connect to server. Please check your connection.");
      } else {
        setServerError("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        {/* Header */}
        <div className="forgot-header">
          <button 
            className="back-btn"
            onClick={() => navigate("/login")}
          >
            ← Back to Login
          </button>
          <h2>Reset Password</h2>
          <p className="step-indicator">Step {step} of 3</p>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>
        
        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            <p>{successMessage}</p>
          </div>
        )}
        
        {/* Error Message */}
        {serverError && (
          <div className="server-error">
            <span className="error-icon">❌</span>
            <p>{serverError}</p>
          </div>
        )}
        
        {/* Role Selection (Only in step 1) */}
        {step === 1 && (
          <div className="role-selection">
            <h4>Select Account Type</h4>
            <div className="role-buttons">
              <button
                className={`role-btn ${form.role === 'owner' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('owner')}
                type="button"
              >
                <span className="role-icon">👑</span>
                <span className="role-label">Owner</span>
              </button>
              <button
                className={`role-btn ${form.role === 'kitchen' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('kitchen')}
                type="button"
              >
                <span className="role-icon">👨‍🍳</span>
                <span className="role-label">Kitchen</span>
              </button>
              <button
                className={`role-btn ${form.role === 'billing' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('billing')}
                type="button"
              >
                <span className="role-icon">💰</span>
                <span className="role-label">Billing</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Step 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="forgot-form">
            <div className="form-group">
              <label className="form-label">
                {form.role === 'owner' ? 'Email or Mobile Number' : `${form.role.charAt(0).toUpperCase() + form.role.slice(1)} Username`}
                <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.username ? 'error' : ''}`}
                name="username"
                placeholder={
                  form.role === 'owner' 
                    ? "Enter your email or mobile number"
                    : `Enter your ${form.role} username`
                }
                value={form.username}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="off"
              />
              {errors.username && (
                <span className="error-text">{errors.username}</span>
              )}
              <p className="input-hint">
                We'll send a 6-digit OTP to your registered email
              </p>
            </div>
            
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        )}
        
        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="forgot-form">
            <div className="form-group">
              <label className="form-label">
                Enter OTP
                <span className="required">*</span>
              </label>
              <div className="otp-input-group">
                <input
                  className={`form-input otp-input ${errors.otp ? 'error' : ''}`}
                  name="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  value={form.otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setForm({ ...form, otp: value });
                    if (errors.otp) setErrors({ ...errors, otp: "" });
                  }}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                <span className="timer">{formatTime(timer)}</span>
              </div>
              {errors.otp && (
                <span className="error-text">{errors.otp}</span>
              )}
              <p className="input-hint">
                OTP sent to {form.maskedEmail || form.email}
              </p>
            </div>
            
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
            
            <div className="resend-section">
              <p>Didn't receive OTP?</p>
              <button
                type="button"
                className={`resend-btn ${!canResend ? 'disabled' : ''}`}
                onClick={handleResendOtp}
                disabled={!canResend || isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Resend OTP"}
              </button>
            </div>
          </form>
        )}
        
        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="forgot-form">
            <div className="form-group">
              <label className="form-label">
                New Password
                <span className="required">*</span>
                {form.newPassword && (
                  <span className={`password-strength ${passwordStrength}`}>
                    {passwordStrength}
                  </span>
                )}
              </label>
              <div className="password-input-group">
                <input
                  className={`form-input ${errors.newPassword ? 'error' : ''}`}
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Enter new password (min 6 characters)"
                  value={form.newPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.newPassword && (
                <span className="error-text">{errors.newPassword}</span>
              )}
              {form.newPassword && (
                <div className="password-meter">
                  <div 
                    className={`meter-bar ${passwordStrength}`}
                    style={{width: `${Math.min(form.newPassword.length * 10, 100)}%`}}
                  ></div>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Confirm Password
                <span className="required">*</span>
              </label>
              <div className="password-input-group">
                <input
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword}</span>
              )}
              {form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword && (
                <span className="success-text">✓ Passwords match</span>
              )}
            </div>
            
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;