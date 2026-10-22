import RequireRole from './components/RequireRole';
import ProviderLanding from './pages/ProviderLanding';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './pages/Login';
import Registration from './pages/Registration';
import UserRegister from './pages/UserRegister';
import './App.css';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import Profile from './pages/Profile';
import PaymentDemo from './pages/PaymentDemo';
import AuthCallback from './pages/AuthCallback';

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin-dashboard" element={<RequireRole roles={['ADMIN']}><AdminDashboard /></RequireRole>} />
            <Route path="/client-dashboard" element={<RequireRole roles={['USER']}><ClientDashboard /></RequireRole>} />
            <Route path="/provider-dashboard" element={<RequireRole roles={['PROVIDER']}><ProviderDashboard /></RequireRole>} />
            <Route path="/become-a-provider" element={<ProviderLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/register/user" element={<UserRegister />} />
            <Route path="/register/provider" element={<Registration />} />
            <Route path="/profile" element={<RequireRole><Profile /></RequireRole>} />
            <Route path="/payment/callback" element={<PaymentDemo />} />
            <Route path="/payment-demo" element={<PaymentDemo />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
