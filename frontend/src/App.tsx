import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { AuthLayout } from './layouts/AuthLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CompleteProfile from './pages/CompleteProfile';
import SelectInterests from './pages/SelectInterests';
import UploadPhotos from './pages/UploadPhotos';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Swipe from './pages/Swipe';
import Matches from './pages/Matches';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import PricingPage from './pages/PricingPage';
import ChatList from './pages/ChatList';
import ChatPaymentPage from './pages/ChatPaymentPage';
import PaymentCallback from './pages/PaymentCallback';
import UserProfile from './pages/UserProfile';
import PublicProfile from './pages/PublicProfile';
import Settings from './pages/Settings';
import HelpSupport from './pages/HelpSupport';

// Layout component that includes the full header
const MainLayout = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-4">
        <Outlet />
      </main>
    </div>
  );
};

// Protected route component
const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return element;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth and registration flow routes with minimal header */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/select-interests" element={<SelectInterests />} />
            <Route path="/upload-photos" element={<UploadPhotos />} />
          </Route>
          
          {/* Public pages with minimal header */}
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/support" element={<HelpSupport />} />
          
          {/* Protected routes with full layout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/swipe" element={<ProtectedRoute element={<Swipe />} />} />
            <Route path="/matches" element={<ProtectedRoute element={<Matches />} />} />
            <Route path="/notifications" element={<ProtectedRoute element={<Notifications />} />} />
            <Route path="/chats" element={<ProtectedRoute element={<ChatList />} />} />
            <Route path="/chat/:matchId" element={<ProtectedRoute element={<Chat />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<UserProfile />} />} />
            <Route path="/profile/:userId" element={<ProtectedRoute element={<PublicProfile />} />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
            <Route path="/help" element={<ProtectedRoute element={<HelpSupport />} />} />
            <Route path="/chat-payment" element={<ProtectedRoute element={<ChatPaymentPage />} />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />
          </Route>
          
          {/* Catch all other routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
