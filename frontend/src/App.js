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
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/register/user" element={<UserRegister />} />
            <Route path="/register/provider" element={<Registration />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;