import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import useWalletStore from '@store/walletStore';
import { 
  LogOut, 
  Users, 
  Send, 
  ArrowLeftRight, 
  MessageSquare, 
  LayoutDashboard,
  Clock,
  Settings2,
  ChevronDown,
  Copy,
  Zap,
  Wallet
} from 'lucide-react';

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

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast.success('Address copied!');
  };

  const isActive = (path) => location.pathname === path;

  // Don't show navbar on landing/auth pages
  if (!isAuthenticated || !wallet) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 glass-dark backdrop-blur-lg border-b border-white/10 shadow-dark animate-fade-in-down">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-3">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">NLP Wallet</span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* User Info */}
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-2 glass-light rounded-lg">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="text-sm text-white/90 font-medium">{user.name}</span>
              </div>
            )}

            {/* Demo Mode Toggle */}
            <label className="flex items-center gap-2 px-3 py-2 glass-light rounded-lg cursor-pointer hover:bg-white/10 transition group">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => {
                  setDemoMode(e.target.checked);
                  toast.success(e.target.checked ? '🎮 Demo mode enabled' : '⚡ Live mode enabled');
                }}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <Zap className={`w-4 h-4 ${demoMode ? 'text-amber-400' : 'text-white/50'} group-hover:text-amber-400 transition`} />
              <span className="text-sm text-white/80 font-medium hidden lg:inline">Demo</span>
            </label>

            {/* Network Selector */}
            <div className="relative">
              <select
                value={network}
                onChange={(e) => {
                  setNetwork(e.target.value);
                  toast.success(`Switched to ${e.target.value}`);
                }}
                className="appearance-none pl-4 pr-10 py-2 glass-light rounded-lg text-sm font-semibold text-white cursor-pointer hover:bg-white/10 transition border border-white/10"
              >
                {networks.map(n => (
                  <option key={n} value={n} className="bg-slate-800">
                    {n.charAt(0).toUpperCase() + n.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
            </div>

            {/* Wallet Address */}
            <button
              onClick={copyAddress}
              className="flex items-center gap-2 px-3 py-2 glass-light rounded-lg hover:bg-white/10 transition group"
              title="Click to copy address"
            >
              <code className="text-xs font-mono text-white/90">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </code>
              <Copy className="w-3 h-3 text-white/60 group-hover:text-white transition" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
              isActive('/dashboard')
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/send"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
              isActive('/send')
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </Link>

          <Link
            to="/swap"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
              isActive('/swap')
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Swap</span>
          </Link>

          <Link
            to="/contacts"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
              isActive('/contacts')
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Contacts</span>
          </Link>

          <Link
            to="/history"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
              isActive('/history')
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>History</span>
          </Link>

          <Link
            to="/settings"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
              isActive('/settings')
                ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Settings</span>
          </Link>

          <Link
            to="/chat"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
              isActive('/chat')
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Chat</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(30, 41, 59, 0.95)',
            color: '#f1f5f9',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />

      {/* Main App Container - No background here, CSS handles it */}
      <div className="min-h-screen">
        <NavBar />
        <main>
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
