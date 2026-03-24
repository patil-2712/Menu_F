import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import Login from "./Login";
import RestaurantRegister from "./RestaurantRegister";
import Setmenu from "./Setmenu";
import Publicmenu from "./Publicmenu";
import MyOrderPage from "./MyOrderPage";
import Korder from "./Korder";
import Border from "./Border";
import TotalBill from "./TotalBill";
import AllRecord from "./AllRecord";
import Analytics from "./Analytics";
import Admin from "./Admin";
import FeedbackPage from "./FeedbackPage";
import ForgotPassword from "./ForgotPassword";

// Session management hook - SINGLE SOURCE OF TRUTH
const useSessionCheck = () => {
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem("token");
      const expiry = localStorage.getItem("sessionExpiry");
      const currentRestaurant = localStorage.getItem("restaurantSlug");
      
      if (!token || !currentRestaurant) {
        setIsValid(false);
        return false;
      }
      
      // Check if session has expired
      if (expiry && Date.now() > parseInt(expiry)) {
        console.log("Session expired, logging out");
        localStorage.clear();
        setIsValid(false);
        return false;
      }
      
      return true;
    };

    // Initial check
    checkSession();
    
    // Check every 5 minutes instead of 30 seconds to reduce unnecessary checks
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return isValid;
};

// Enhanced Protected Route component with restaurant validation
const ProtectedRoute = ({ children, allowedRoles = [], allowedPages = [] }) => {
  const location = useLocation();
  const { restaurantSlug } = useParams();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const userRestaurant = localStorage.getItem("restaurantSlug");
  const isValidSession = useSessionCheck();
  
  // If no token or session invalid
  if (!token || !isValidSession) {
    console.log("No valid session, redirecting to login");
    return <Navigate to="/" replace />;
  }
  
  // Check if user belongs to this restaurant
  if (restaurantSlug && userRestaurant !== restaurantSlug) {
    console.log(`Access denied: User belongs to ${userRestaurant}, trying to access ${restaurantSlug}`);
    localStorage.clear();
    return <Navigate to="/" replace />;
  }
  
  // Check role permissions
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log(`Role ${userRole} not allowed for this route`);
    
    // Redirect based on role
    if (userRole === 'kitchen') {
      return <Navigate to={`/${userRestaurant}/Korder`} replace />;
    } else if (userRole === 'billing') {
      return <Navigate to={`/${userRestaurant}/border`} replace />;
    } else if (userRole === 'owner') {
      return <Navigate to={`/${userRestaurant}/admin`} replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  // Check if specific pages are allowed for this role
  if (allowedPages.length > 0) {
    const currentPath = location.pathname.split('/').pop();
    if (!allowedPages.includes(currentPath)) {
      console.log(`Page ${currentPath} not allowed for role ${userRole}`);
      
      // Redirect to first allowed page
      if (allowedPages.length > 0) {
        return <Navigate to={`/${restaurantSlug}/${allowedPages[0]}`} replace />;
      }
    }
  }
  
  return children;
};

// Kitchen Protected Route - can access both Korder and Setmenu
const KitchenProtectedRoute = ({ children }) => {
  const { restaurantSlug } = useParams();
  const userRole = localStorage.getItem("userRole");
  const location = useLocation();
  
  // Kitchen can only access Korder and Setmenu
  const allowedPages = ['Korder', 'setmenu'];
  const currentPath = location.pathname.split('/').pop();
  
  if (!allowedPages.includes(currentPath)) {
    console.log(`Kitchen staff cannot access ${currentPath}`);
    return <Navigate to={`/${restaurantSlug}/Korder`} replace />;
  }
  
  return (
    <ProtectedRoute allowedRoles={['kitchen']} allowedPages={allowedPages}>
      {children}
    </ProtectedRoute>
  );
};

// Owner Protected Route - can access all owner pages
const OwnerProtectedRoute = ({ children }) => {
  const allowedPages = ['admin', 'analytics', 'records', 'feedback', 'border', 'totalbill', 'setmenu'];
  return (
    <ProtectedRoute allowedRoles={['owner']} allowedPages={allowedPages}>
      {children}
    </ProtectedRoute>
  );
};

// Billing Protected Route - can access billing pages only
const BillingProtectedRoute = ({ children }) => {
  const allowedPages = ['border', 'totalbill'];
  return (
    <ProtectedRoute allowedRoles={['billing', 'owner']} allowedPages={allowedPages}>
      {children}
    </ProtectedRoute>
  );
};

// Simplified Restaurant Layout wrapper - REMOVED AUTO-LOGOUT ON REFRESH
const RestaurantLayout = ({ children }) => {
  const { restaurantSlug } = useParams();
  const location = useLocation();
  
  useEffect(() => {
    if (restaurantSlug) {
      // Validate restaurant access
      const userRestaurant = localStorage.getItem("restaurantSlug");
      const token = localStorage.getItem("token");
      
      if (token && userRestaurant && userRestaurant !== restaurantSlug) {
        console.log("Restaurant mismatch, logging out");
        localStorage.clear();
        window.location.href = '/';
        return;
      }
      
      // Store current restaurant slug if not set
      if (!userRestaurant) {
        localStorage.setItem("restaurantSlug", restaurantSlug);
      }
      
      // Track activity for inactivity timeout - BUT DON'T CLEAR ON REFRESH
      localStorage.setItem("lastActivity", Date.now().toString());
      
      // REMOVED the interval that was causing issues
      // Only update activity on actual user interaction
    }
  }, [restaurantSlug, location.pathname]);

  // REMOVED the beforeunload handler that was clearing token
  // This was the main culprit causing logout on refresh

  // SIMPLIFIED inactivity check - only check on route changes
  useEffect(() => {
    const lastActivity = localStorage.getItem("lastActivity");
    const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour instead of 15 minutes
    
    if (lastActivity && Date.now() - parseInt(lastActivity) > INACTIVITY_LIMIT) {
      console.log("Inactivity timeout, logging out");
      localStorage.clear();
      window.location.href = '/';
    } else {
      // Update activity on route change
      localStorage.setItem("lastActivity", Date.now().toString());
    }
  }, [location.pathname]);

  return children;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [initialized, setInitialized] = useState(false);

  const logout = () => {
    localStorage.clear();
    setToken("");
  }

  useEffect(() => {
    // Single source of truth for authentication
    const checkAuth = () => {
      const storedToken = localStorage.getItem("token");
      const expiry = localStorage.getItem("sessionExpiry");
      
      // Check session expiry - but only if it's actually expired
      if (expiry && Date.now() > parseInt(expiry)) {
        console.log("Session expired on check");
        localStorage.clear();
        setToken("");
      } else if (storedToken !== token) {
        setToken(storedToken || "");
      }
      
      setInitialized(true);
    };

    checkAuth();
    
    // Listen for storage changes from other tabs
    window.addEventListener("storage", checkAuth);
    
    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [token]);

  // Show nothing until initialized to prevent flash of wrong content
  if (!initialized) {
    return null; // or a loading spinner
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Root route - redirects based on role */}
          <Route path="/" element={
            token ? (
              (() => {
                const restaurantSlug = localStorage.getItem("restaurantSlug");
                const userRole = localStorage.getItem("userRole");
                
                if (!restaurantSlug) {
                  return <Navigate to="/register" replace />;
                }
                
                // Redirect to appropriate page based on role
                if (userRole === 'kitchen') {
                  return <Navigate to={`/${restaurantSlug}/Korder`} replace />;
                } else if (userRole === 'billing') {
                  return <Navigate to={`/${restaurantSlug}/border`} replace />;
                } else if (userRole === 'owner') {
                  return <Navigate to={`/${restaurantSlug}/admin`} replace />;
                }
                return <Navigate to="/" replace />;
              })()
            ) : (
              <Login setToken={setToken} />
            )
          } />
          
          {/* Restaurant registration */}
          <Route path="/register" element={
            token ? <Navigate to="/" replace /> : <RestaurantRegister />
          } />
          
          {/* Restaurant-specific login */}
          <Route path="/:restaurantSlug/login" element={
            token ? <Navigate to="/" replace /> : <Login setToken={setToken} />
          } />
          
          {/* Public routes */}
          <Route path="/:restaurantSlug/menu" element={
            <RestaurantLayout>
              <Publicmenu />
            </RestaurantLayout>
          } />
          
          {/* UPDATED: Changed from billNumber to orderId for MongoDB _id */}
          <Route path="/:restaurantSlug/order/:orderId" element={
            <RestaurantLayout>
              <MyOrderPage />
            </RestaurantLayout>
          } />
          
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Kitchen routes - can access both Korder and Setmenu */}
          <Route path="/:restaurantSlug/setmenu" element={
            <KitchenProtectedRoute>
              <RestaurantLayout>
                <Setmenu />
              </RestaurantLayout>
            </KitchenProtectedRoute>
          } />
          
          <Route path="/:restaurantSlug/Korder" element={
            <KitchenProtectedRoute>
              <RestaurantLayout>
                <Korder />
              </RestaurantLayout>
            </KitchenProtectedRoute>
          } />
          
          {/* Billing routes - can access only Border and TotalBill */}
          <Route path="/:restaurantSlug/border" element={
            <BillingProtectedRoute>
              <RestaurantLayout>
                <Border />
              </RestaurantLayout>
            </BillingProtectedRoute>
          } />
          
          <Route path="/:restaurantSlug/totalbill" element={
            <BillingProtectedRoute>
              <RestaurantLayout>
                <TotalBill />
              </RestaurantLayout>
            </BillingProtectedRoute>
          } />
          
          {/* Owner routes - can access all pages */}
          <Route path="/:restaurantSlug/admin" element={
            <OwnerProtectedRoute>
              <RestaurantLayout>
                <Admin />
              </RestaurantLayout>
            </OwnerProtectedRoute>
          } />
          
          <Route path="/:restaurantSlug/analytics" element={
            <OwnerProtectedRoute>
              <RestaurantLayout>
                <Analytics />
              </RestaurantLayout>
            </OwnerProtectedRoute>
          } />
          
          <Route path="/:restaurantSlug/records" element={
            <OwnerProtectedRoute>
              <RestaurantLayout>
                <AllRecord />
              </RestaurantLayout>
            </OwnerProtectedRoute>
          } />
          
          <Route path="/:restaurantSlug/feedback" element={
            <OwnerProtectedRoute>
              <RestaurantLayout>
                <FeedbackPage />
              </RestaurantLayout>
            </OwnerProtectedRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;