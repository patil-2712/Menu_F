// components/BNavbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaWallet, 
  FaReceipt, 
  FaCommentDots, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaUserCircle,
  FaMoneyBillWave
} from 'react-icons/fa';
import './BNavbar.css';

const BNavbar = ({ restaurantSlug, restaurantName, activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userRole');
    const storedName = localStorage.getItem('userName') || 'Staff';
    
    if (!token) {
      return;
    }
    
    setUserRole(storedRole);
    setUserName(storedName);
  }, []);

  // Navigation WITHOUT page reload - uses React Router
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
    console.log("🔓 Logging out from Billing...");
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  // Get current active page based on URL or prop
  const isActive = (page) => {
    if (activePage) return activePage === page;
    const path = location.pathname;
    if (page === 'border' && path.includes('/border')) return true;
    if (page === 'totalbill' && path.includes('/totalbill')) return true;
    if (page === 'customer-requests' && path.includes('/customer-requests')) return true;
    return false;
  };

  return (
    <>
      {/* Sidebar Navigation - LEFT SIDE */}
      <div className={`bnavbar-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="bnavbar-sidebar-header">
          <div className="bnavbar-logo">
            <FaMoneyBillWave className="bnavbar-logo-icon" />
            <span>{restaurantName?.split(' ')[0] || 'Billing'}</span>
          </div>
        </div>
        
        <nav className="bnavbar-sidebar-nav">
          <button 
            className={`bnavbar-nav-item ${isActive('border') ? 'active' : ''}`} 
            onClick={() => handleNavigation(`/${restaurantSlug}/border`)}
          >
            <FaWallet /> Border
          </button>
          <button 
            className={`bnavbar-nav-item ${isActive('totalbill') ? 'active' : ''}`} 
            onClick={() => handleNavigation(`/${restaurantSlug}/totalbill`)}
          >
            <FaReceipt /> Total Bill
          </button>
          <button 
            className={`bnavbar-nav-item ${isActive('customer-requests') ? 'active' : ''}`} 
            onClick={() => handleNavigation(`/${restaurantSlug}/customer-requests`)}
          >
            <FaCommentDots /> Customer Messages
          </button>
        </nav>

        {/* User info section */}
        <div className="bnavbar-user-info">
          <div className="bnavbar-user-details">
            <FaUserCircle className="bnavbar-user-icon" />
            <div className="bnavbar-user-text">
              <span className="bnavbar-user-name">{userName}</span>
              <span className="bnavbar-user-role">{userRole || 'Billing'}</span>
            </div>
          </div>
        </div>

        <div className="bnavbar-sidebar-footer">
          <button className="bnavbar-nav-item logout" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="bnavbar-mobile-menu-toggle" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div className="bnavbar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
    </>
  );
};

export default BNavbar;