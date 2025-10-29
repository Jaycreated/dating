import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/select-interests" element={<SelectInterests />} />
        <Route path="/upload-photos" element={<UploadPhotos />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/swipe" element={<Swipe />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/chats" element={<ChatList />} />
        <Route path="/chat/:matchId" element={<Chat />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/payment/chat" element={<ChatPaymentPage />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
