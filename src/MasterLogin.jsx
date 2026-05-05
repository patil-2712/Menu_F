// frontend/src/pages/MasterLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaEnvelope,
  FaLock,
  FaPhone,
  FaKey,
  FaSpinner,
  FaExclamationTriangle,
  FaClock,
  FaShieldAlt
} from "react-icons/fa";
import "./MasterLogin.css";

const MasterLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailId: "",
    password: "",
    phoneNumber: "",
    phonePassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockInfo, setLockInfo] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "https://menu-b-ym9l.onrender.com";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
    setLockInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLockInfo(null);

    try {
      const response = await axios.post(`${API_URL}/api/master/login`, formData);

      if (response.data.success) {
        localStorage.setItem("masterToken", response.data.token);
        localStorage.setItem("masterUser", JSON.stringify(response.data.user));
        navigate("/master-dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      if (err.response?.data) {
        const data = err.response.data;
        setError(data.message);
        
        if (data.locked) {
          setLockInfo({
            remainingTime: data.remainingTime,
            failedAttempts: data.failedAttempts
          });
        }
        
        if (data.failedAttempts) {
          setLockInfo({
            failedAttempts: data.failedAttempts,
            remainingAttempts: 3 - data.failedAttempts
          });
        }
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="master-login-container">
      <div className="master-login-card">
        <div className="login-header">
          <FaShieldAlt className="header-icon" />
          <h1>Master Admin Login</h1>
          <p>Enter all four credentials to access</p>
        </div>

        {error && (
          <div className="error-message">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {lockInfo && lockInfo.remainingTime && (
          <div className="lock-message">
            <FaClock />
            <div>
              <strong>Account Locked</strong>
              <p>Please try again after {lockInfo.remainingTime}</p>
              <small>Failed attempts: {lockInfo.failedAttempts}/3</small>
            </div>
          </div>
        )}

        {lockInfo && lockInfo.remainingAttempts && lockInfo.remainingAttempts > 0 && (
          <div className="warning-message">
            <FaExclamationTriangle />
            <div>
              <strong>Warning!</strong>
              <p>{lockInfo.remainingAttempts} attempt(s) remaining before account lockout</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              name="emailId"
              placeholder="Email ID"
              value={formData.emailId}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <FaPhone className="input-icon" />
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              disabled={loading}
              pattern="[0-9]{10}"
            />
          </div>

          <div className="input-group">
            <FaKey className="input-icon" />
            <input
              type="password"
              name="phonePassword"
              placeholder="Phone Password"
              value={formData.phonePassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <FaSpinner className="spinner" /> : "Login"}
          </button>
        </form>

       
      </div>
    </div>
  );
};

export default MasterLogin;