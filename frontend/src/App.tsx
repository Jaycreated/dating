import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CompleteProfile from './pages/CompleteProfile';
import SelectInterests from './pages/SelectInterests';
import UploadPhotos from './pages/UploadPhotos';
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

// Layout component that includes the header
const Layout = () => {
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
    return <div>Loading...</div>; // Or a proper loading component
  }

  if (!user) {
    return <Login />;
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/support" element={<HelpSupport />} />
          
          {/* Protected routes with layout */}
          <Route element={<Layout />}>
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/select-interests" element={<SelectInterests />} />
            <Route path="/upload-photos" element={<UploadPhotos />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/swipe" element={<ProtectedRoute element={<Swipe />} />} />
            <Route path="/matches" element={<ProtectedRoute element={<Matches />} />} />
            <Route path="/notifications" element={<ProtectedRoute element={<Notifications />} />} />
            <Route path="/chats" element={<ProtectedRoute element={<ChatList />} />} />
            <Route path="/chat/:matchId" element={<ProtectedRoute element={<Chat />} />} />
            <Route path="/payment/chat" element={<ProtectedRoute element={<ChatPaymentPage />} />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />
            <Route path="/profile" element={<ProtectedRoute element={<UserProfile />} />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
            <Route path="/profile/:id" element={<PublicProfile />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
