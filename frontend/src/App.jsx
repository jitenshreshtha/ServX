import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/Homepage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import CreateListing from "../pages/CreateListing";
import ProfilePage from '../pages/ProfilePage';
import MyListingsPage from '../pages/MyListingsPage';
import Chat from "../components/Chat";
import { AuthProvider } from "./context/Authcontext";
import AdminLoginPage from "../pages/AdminLoginPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import ProtectedRoute from '../components/ProtectedRoute';
import AboutUsPage from '../pages/AboutUsPage';
import ContactUsPage from '../pages/ContactUsPage';
import InboxPage from "../pages/InboxPage";
import AuthCallback from '../components/AuthCallback';
import EditListingPage from "../pages/EditListingPage";
import UserReviews from '../components/UserReviews';
import AdminReportedMessagesPage from "../pages/AdminReportedMessagesPage";
import AdminTicketsPage from "../pages/AdminTicketsPage";
import EditUserPage from "../pages/EditUserPage";
import SupportCenterPage from "../pages/SupportCenterPage";
import PaymentSuccessPage from "../pages/PaymentSuccessPage";
import PaymentcancelledPage from "../pages/PaymentcancelledPage";
import Enable2FA from '../pages/Enable2FA';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* Protected Routes - Require Authentication */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/my-listings" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
          <Route path="/create-listing" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin-dashboard" element={<ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/edit-listing/:id" element={<ProtectedRoute adminOnly><EditListingPage mode="admin" /></ProtectedRoute>} />
          <Route path="/edit-listing/:id" element={<ProtectedRoute><EditListingPage mode="user" /></ProtectedRoute>} />
          <Route path="/admin/tickets" element={<ProtectedRoute adminOnly><AdminTicketsPage /></ProtectedRoute>} />
          <Route path="/admin/edit-user/:id" element={<ProtectedRoute adminOnly><EditUserPage /></ProtectedRoute>} />
          <Route path="/admin/reported-messages" element={<ProtectedRoute adminOnly><AdminReportedMessagesPage /></ProtectedRoute>} />

          {/* Legacy route for backward compatibility */}
          <Route path="/create-post" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
         <Route path="/enable-2fa" element={<ProtectedRoute><Enable2FA /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/my-profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/reviews/:userId" element={<UserReviews />} />
          <Route path="/my-reviews" element={
            <ProtectedRoute>
              <UserReviews />
            </ProtectedRoute>
          } />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportCenterPage />
              </ProtectedRoute>
            }
          />


          <Route path="*" element={
            <div className="container mt-5 text-center">
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <a href="/" className="btn btn-primary">Go Home</a>
            </div>
          }
          />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-cancelled" element={<PaymentcancelledPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
