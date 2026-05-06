// components/ONavbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaBuilding, 
  FaChartLine, 
  FaDatabase, 
  FaEye,
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaUserCircle
} from 'react-icons/fa';
import './ONavbar.css';

const ONavbar = ({ restaurantSlug, restaurantName, activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userRole');
    const storedName = localStorage.getItem('userName') || 'Owner';
    
    if (!token) {
      return;
    }
    
    setUserRole(storedRole);
    setUserName(storedName);
  }, []);

  // Navigation WITHOUT page reload
  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
    
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('sessionExpiry');
    
    if (!token) {
      window.location.href = "/";
      return;
    }
    
    if (expiry && Date.now() > parseInt(expiry)) {
      window.location.href = "/";
      return;
    }
    
    // Use React Router navigate - NO PAGE RELOAD
    navigate(path);
  };

  const handleLogout = () => {
    console.log("🔓 Logging out from Owner Panel...");
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  // Get current active page based on URL or prop
  const isActive = (page) => {
    if (activePage) return activePage === page;
    const path = location.pathname;
    if (page === 'admin' && path.includes('/admin')) return true;
    if (page === 'analytics' && path.includes('/analytics')) return true;
    if (page === 'records' && path.includes('/records')) return true;
    if (page === 'feedback' && path.includes('/feedback')) return true;
    return false;
  };

  return (
    <>
      {/* Sidebar Navigation - LEFT SIDE */}
      <div className={`onavbar-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="onavbar-sidebar-header">
          <div className="onavbar-logo">
            <FaBuilding className="onavbar-logo-icon" />
            <span>{restaurantName?.split(' ')[0] || 'Owner'}</span>
          </div>
        </div>
        
        <nav className="onavbar-sidebar-nav">
          <button 
            className={`onavbar-nav-item ${isActive('admin') ? 'active' : ''}`} 
            onClick={() => handleNavigation(`/${restaurantSlug}/admin`)}
          >
            <FaBuilding /> Admin
          </button>
          <button 
            className={`onavbar-nav-item ${isActive('analytics') ? 'active' : ''}`} 
            onClick={() => handleNavigation(`/${restaurantSlug}/analytics`)}
          >
            <FaChartLine /> Analytics
          </button>
          <button 
            className={`onavbar-nav-item ${isActive('records') ? 'active' : ''}`} 
            onClick={() => handleNavigation(`/${restaurantSlug}/records`)}
          >
            <FaDatabase /> Records
          </button>
          <button 
            className={`onavbar-nav-item ${isActive('feedback') ? 'active' : ''}`} 
            onClick={() => handleNavigation(`/${restaurantSlug}/feedback`)}
          >
            <FaEye /> Feedback
          </button>
        </nav>

        {/* User info section */}
        <div className="onavbar-user-info">
          <div className="onavbar-user-details">
            <FaUserCircle className="onavbar-user-icon" />
            <div className="onavbar-user-text">
              <span className="onavbar-user-name">{userName}</span>
              <span className="onavbar-user-role">{userRole || 'Owner'}</span>
            </div>
          </div>
        </div>

        <div className="onavbar-sidebar-footer">
          <button className="onavbar-nav-item logout" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="onavbar-mobile-menu-toggle" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div className="onavbar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
    </>
  );
};

export default ONavbar;