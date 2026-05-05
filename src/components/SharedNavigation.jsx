import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaSignOutAlt,
  FaWallet,
  FaReceipt,
  FaCommentDots,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import './SharedNavigation.css';

const SharedNavigation = ({ 
  restaurantSlug, 
  restaurantName, 
  mobileMenuOpen, 
  setMobileMenuOpen,
  activePage = 'border' 
}) => {
  const navigate = useNavigate();

  const handleNavigate = (path, e) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    // Use navigate with replace: false to prevent full reload
    navigate(path, { replace: false });
  };

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    // Clear all auth data
    localStorage.clear();
    sessionStorage.clear();
    // Use navigate for logout
    navigate("/", { replace: true });
  };

  const navItems = [
    { 
      icon: FaWallet, 
      label: 'Border', 
      path: `/${restaurantSlug}/border`, 
      key: 'border' 
    },
    { 
      icon: FaReceipt, 
      label: 'Total Bill', 
      path: `/${restaurantSlug}/totalbill`, 
      key: 'totalbill' 
    },
    { 
      icon: FaCommentDots, 
      label: 'Customer Messages', 
      path: `/${restaurantSlug}/customer-requests`, 
      key: 'customer-requests' 
    },
  ];

  const getLogoIcon = () => {
    switch(activePage) {
      case 'border': return <FaWallet className="logo-icon" />;
      case 'totalbill': return <FaReceipt className="logo-icon" />;
      case 'customer-requests': return <FaCommentDots className="logo-icon" />;
      default: return <FaWallet className="logo-icon" />;
    }
  };

  const getLogoText = () => {
    const name = restaurantName?.split(' ')[0] || 'Menu';
    return name;
  };

  return (
    <>
      {/* Sidebar Navigation - LEFT side */}
      <div className={`shared-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="shared-sidebar-header">
          <div className="shared-logo">
            {getLogoIcon()}
            <span>{getLogoText()}</span>
          </div>
        </div>
        
        <nav className="shared-sidebar-nav">
          {navItems.map((item) => (
            <button 
              key={item.key}
              type="button"
              className={`shared-nav-item ${activePage === item.key ? 'active' : ''}`}
              onClick={(e) => handleNavigate(item.path, e)}
            >
              <item.icon /> {item.label}
            </button>
          ))}
        </nav>

        <div className="shared-sidebar-footer">
          <button 
            type="button"
            className="shared-nav-item logout" 
            onClick={handleLogout}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        type="button"
        className="shared-mobile-menu-toggle"
        onClick={(e) => {
          e.preventDefault();
          setMobileMenuOpen(!mobileMenuOpen);
        }}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>
    </>
  );
};

export default SharedNavigation;