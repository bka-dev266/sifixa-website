import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastContainer } from './components/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import CustomerLayout from './systems/customer/components/CustomerLayout';
import Home from './systems/customer/pages/Home';
import Services from './systems/customer/pages/Services';
import Contact from './systems/customer/pages/Contact';
import Booking from './systems/customer/pages/Booking';
import BookingPage from './pages/BookingPage';
import TrackBooking from './systems/customer/pages/TrackBooking';
import SellDevice from './systems/customer/pages/SellDevice';
import CustomerLogin from './systems/customer/pages/CustomerLogin';
import StaffLogin from './systems/staff/pages/StaffLogin';
import PrivacyPolicy from './systems/customer/pages/PrivacyPolicy';
import TermsOfUse from './systems/customer/pages/TermsOfUse';
import RefundPolicy from './systems/customer/pages/RefundPolicy';
import WarrantyPolicy from './systems/customer/pages/WarrantyPolicy';
import CookiePolicy from './systems/customer/pages/CookiePolicy';
import FAQPage from './systems/customer/pages/FAQPage';
import CustomerProfile from './systems/customer/pages/CustomerProfile';
import AdminDashboard from './systems/staff/pages/AdminDashboard';
import LandingEditor from './systems/staff/pages/LandingEditor';
import EmployeeDashboard from './systems/staff/pages/EmployeeDashboard';
import SupportDashboard from './systems/staff/pages/SupportDashboard';
import InventoryDashboard from './systems/staff/pages/InventoryDashboard';
import POSDashboard from './systems/staff/pages/POSDashboard';
import './services/debug'; // Debug utilities - available as window.sifixaDebug
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                {/* System 1: Customer Website (Public) */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/book-repair" element={<Booking />} />
                  <Route path="/track" element={<TrackBooking />} />
                  <Route path="/sell" element={<SellDevice />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfUse />} />
                  <Route path="/refund" element={<RefundPolicy />} />
                  <Route path="/warranty" element={<WarrantyPolicy />} />
                  <Route path="/cookies" element={<CookiePolicy />} />
                  <Route path="/faq" element={<FAQPage />} />
                </Route>

                {/* Customer Profile (Standalone - no navbar/footer, Protected) */}
                <Route
                  path="/customer/profile"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <CustomerProfile />
                    </ProtectedRoute>
                  }
                />

                {/* Login Pages (Separate from layout) */}
                <Route path="/login" element={<CustomerLogin />} />
                <Route path="/staff/login" element={<StaffLogin />} />

                {/* Booking Page (Standalone full-screen wizard) */}
                <Route path="/booking" element={<Booking />} />

                {/* System 2: Staff Portal (Private Dashboards) */}

                {/* Technicians */}
                <Route
                  path="/employee"
                  element={
                    <ProtectedRoute allowedRoles={['employee', 'admin']}>
                      <EmployeeDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Customer Support */}
                <Route
                  path="/support"
                  element={
                    <ProtectedRoute allowedRoles={['support', 'admin']}>
                      <SupportDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Inventory/Data Entry */}
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute allowedRoles={['inventory', 'admin']}>
                      <InventoryDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* POS/Sales */}
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute allowedRoles={['sales', 'admin']}>
                      <POSDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Administrator */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Landing Page CMS */}
                <Route
                  path="/admin/landing"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <LandingEditor />
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <ToastContainer />
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
