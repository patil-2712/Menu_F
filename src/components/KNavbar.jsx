// components/KNavbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaClipboardList, 
  FaUtensils, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaChartLine,
  FaReceipt,
  FaUserCircle
} from 'react-icons/fa';
import './KNavbar.css';

const KNavbar = ({ restaurantSlug, restaurantName, activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');

  // Check token validity
  const isTokenValid = () => {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('sessionExpiry');
    
    if (!token) {
      return false;
    }
    
    if (expiry && Date.now() > parseInt(expiry)) {
      localStorage.clear();
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userRole');
    const storedName = localStorage.getItem('userName') || 'Staff';
    
    if (!token || !isTokenValid()) {
      return;
    }
    
    setUserRole(storedRole);
    setUserName(storedName);
  }, []);

  // Navigation without page reload
  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
    
    // Quick token check before navigation
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

  // Logout with full page reload to clear all state
  const handleLogout = () => {
    console.log("🔓 Logging out...");
    localStorage.clear();
    sessionStorage.clear();
    // Use hard reload only for logout, not for navigation
    window.location.href = "/";
  };

  // Get current active page
  const isActive = (page) => {
    if (activePage) return activePage === page;
    return location.pathname.includes(page.toLowerCase());
  };

  return (
    <>
      {/* Sidebar Navigation - LEFT SIDE */}
      <div className={`knavbar-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="knavbar-sidebar-header">
          <div className="knavbar-logo">
            <FaUtensils className="knavbar-logo-icon" />
            <span>{restaurantName?.split(' ')[0] || 'Menu'}</span>
          </div>
        </div>
        
        <nav className="knavbar-sidebar-nav">
          <button 
            className={`knavbar-nav-item ${isActive('Korder') ? 'active' : ''}`} 
            onClick={() => handleNavigation(`/${restaurantSlug}/Korder`)}
          >
            <FaClipboardList /> KOT
          </button>
          <button 
            className={`knavbar-nav-item ${isActive('setmenu') ? 'active' : ''}`} 
            onClick={() => handleNavigation(`/${restaurantSlug}/setmenu`)}
          >
            <FaUtensils /> Set Menu
          </button>
          
          {/* Show admin link only for owner role */}
          {userRole === 'owner' && (
            <button 
              className={`knavbar-nav-item ${isActive('admin') ? 'active' : ''}`} 
              onClick={() => handleNavigation(`/${restaurantSlug}/admin`)}
            >
              <FaChartLine /> Admin
            </button>
          )}
          
          {/* Show billing link for billing/owner roles */}
          {(userRole === 'billing' || userRole === 'owner') && (
            <button 
              className={`knavbar-nav-item ${isActive('border') ? 'active' : ''}`} 
              onClick={() => handleNavigation(`/${restaurantSlug}/border`)}
            >
              <FaReceipt /> Billing
            </button>
          )}
        </nav>

        {/* User info section */}
        <div className="knavbar-user-info">
          <div className="knavbar-user-details">
            <FaUserCircle className="knavbar-user-icon" />
            <div className="knavbar-user-text">
              <span className="knavbar-user-name">{userName}</span>
              <span className="knavbar-user-role">{userRole || 'Staff'}</span>
            </div>
          </div>
        </div>

        <div className="knavbar-sidebar-footer">
          <button className="knavbar-nav-item logout" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="knavbar-mobile-menu-toggle" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div className="knavbar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
    </>
  );
};

export default KNavbar;