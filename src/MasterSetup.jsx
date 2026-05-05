// frontend/src/pages/MasterSetup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaEnvelope,
  FaLock,
  FaPhone,
  FaKey,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser,
  FaArrowLeft
} from "react-icons/fa";
import "./MasterSetup.css";

const MasterSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailId: "patilavdhut198@gmail.com",
    password: "PALLAVI",
    phoneNumber: "7410568477",
    phonePassword: "SHOBHA",
    name: "Master Admin",
    secretKey: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPhonePassword, setShowPhonePassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "https://menu-b-ym9l.onrender.com";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/master/create-master-user`, formData);

      if (response.data.success) {
        setResult(response.data);
        // Auto clear form after success
        setTimeout(() => {
          navigate("/master-login");
        }, 3000);
      }
    } catch (err) {
      console.error("Setup error:", err);
      setError(err.response?.data || { message: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="master-setup-container">
      <div className="master-setup-card">
        <div className="setup-header">
          <button className="back-btn" onClick={() => navigate("/")}>
            <FaArrowLeft /> Back
          </button>
          <h1>🔐 Master User Setup</h1>
          <p>Create the master administrator account</p>
        </div>

        <div className="setup-warning">
          <FaExclamationTriangle />
          <div>
            <strong>⚠️ WARNING:</strong> This page should be removed after creating the master user!
            <br />
            <small>This is a one-time setup page.</small>
          </div>
        </div>

        {result && (
          <div className="setup-success">
            <FaCheckCircle />
            <div>
              <strong>✅ {result.message}</strong>
              <div className="credentials-box">
                <h4>📋 Login Credentials:</h4>
                <p><strong>Email ID:</strong> patilavdhut198@gmail.com</p>
                <p><strong>Password:</strong> PALLAVI</p>
                <p><strong>Phone Number:</strong> 7410568477</p>
                <p><strong>Phone Password:</strong> SHOBHA</p>
              </div>
              <p className="redirect-note">Redirecting to login page...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="setup-error">
            <FaExclamationTriangle />
            <div>
              <strong>❌ Error:</strong> {error.message || "Failed to create master user"}
              {error.user && (
                <p className="error-detail">User already exists: {error.user.emailId}</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label>Email ID *</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                name="emailId"
                value={formData.emailId}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password *</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <small>Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <div className="input-wrapper">
              <FaPhone className="input-icon" />
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="10 digit mobile number"
                pattern="[0-9]{10}"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Phone Password *</label>
            <div className="input-wrapper">
              <FaKey className="input-icon" />
              <input
                type={showPhonePassword ? "text" : "password"}
                name="phonePassword"
                value={formData.phonePassword}
                onChange={handleChange}
                placeholder="Enter phone password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPhonePassword(!showPhonePassword)}
              >
                {showPhonePassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Name (Optional)</label>
            <div className="input-wrapper">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Master Admin"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Setup Secret Key *</label>
            <div className="input-wrapper">
              <FaKey className="input-icon" />
              <input
                type="password"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleChange}
                placeholder="Enter setup secret key"
                required
                disabled={loading}
              />
            </div>
            <small>Contact developer for the secret key</small>
          </div>

          <button type="submit" className="setup-btn" disabled={loading}>
            {loading ? <FaSpinner className="spinner" /> : "Create Master User"}
            {!loading && " →"}
          </button>
        </form>

        <div className="setup-footer">
          <p>⚠️ After successful creation:</p>
          <ul>
            <li>1. Go to <strong>/master-login</strong> to login</li>
            <li>2. Remove or disable this setup page</li>
            <li>3. Keep credentials secure</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MasterSetup;