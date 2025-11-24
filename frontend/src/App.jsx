import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import useWalletStore from '@store/walletStore';
import { LogOut, Users, Send, ArrowLeftRight, MessageSquare, LayoutDashboard ,Clock,Settings2} from 'lucide-react';

// Import components
import LandingPage from '@components/LandingPage';
import LoginForm from '@components/Auth/LoginForm';
import SignupForm from '@components/Auth/SignupForm';
import Dashboard from '@components/Dashboard';
import ChatInterface from '@components/ChatInterface';
import SendTransaction from '@components/SendTransaction';
import SwapTokens from '@components/SwapTokens';
import ContactsPage from './components/Contacts/ContactsPage';
import TransactionHistory from './components/TransactionHistory';
import Settings from './components/Settings';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, wallet } = useWalletStore();
  return isAuthenticated && wallet ? children : <Navigate to="/" replace />;
}

// Navbar Component
function NavBar() {
  const { wallet, network, setNetwork, demoMode, setDemoMode, logout, isAuthenticated, user } = useWalletStore();
  const location = useLocation();
  const networks = ['sepolia', 'ethereum', 'polygon'];

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      toast.success('Logged out successfully');
    }
  };

  // Helper to check if current route is active
  const isActive = (path) => location.pathname === path;

  // Don't show navbar on landing/auth pages
  if (!isAuthenticated || !wallet) {
    return null;
  }

  return (
    <header className="w-full bg-white/70 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Top Row: Logo + Right Side */}
        <div className="flex items-center justify-between mb-3">
          <Link to="/dashboard" className="text-xl font-bold gradient-text">
            NLP Crypto Wallet
          </Link>

          <div className="flex items-center gap-3">
            {/* User Info */}
            {user && (
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user.name}</span>
              </div>
            )}

            {/* Demo Mode Toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => {
                  setDemoMode(e.target.checked);
                  toast.success(e.target.checked ? 'Demo mode enabled' : 'Live mode enabled');
                }}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Demo Mode</span>
            </label>

            {/* Network Selector */}
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              title="Network"
            >
              {networks.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            {/* Wallet Info */}
            <code className="text-xs px-3 py-1 bg-gray-100 rounded">
              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </code>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Navigation Links */}
        <nav className="flex items-center gap-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${isActive('/dashboard')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          <Link
            to="/send"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${isActive('/send')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Send className="w-4 h-4" />
            Send
          </Link>

          <Link
            to="/swap"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${isActive('/swap')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Swap
          </Link>

          <Link
            to="/contacts"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${isActive('/contacts')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Users className="w-4 h-4" />
            Contacts
          </Link>
        <Link
            to="/history"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              isActive('/history')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            History
          </Link>
          <Link
    to="/settings"
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
      isActive('/settings')
        ? 'bg-indigo-100 text-indigo-700'
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <Settings2 className="w-4 h-4" />
    Settings
  </Link>


          <Link
            to="/chat"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${isActive('/chat')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            AI Chat
          </Link>
        </nav>
      </div>
    </header>
  );
}



export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <NavBar />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <ChatInterface />
              </ProtectedRoute>
            } />
            <Route path="/send" element={
              <ProtectedRoute>
                <SendTransaction />
              </ProtectedRoute>
            } />
            <Route path="/swap" element={
              <ProtectedRoute>
                <SwapTokens />
              </ProtectedRoute>
            } />
            <Route path="/contacts" element={
              <ProtectedRoute>
                <ContactsPage />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <TransactionHistory />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
