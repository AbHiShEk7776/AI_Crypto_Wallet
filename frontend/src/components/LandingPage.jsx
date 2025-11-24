import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Mail, Zap, Lock, Shield } from 'lucide-react';
import useWalletStore from '@store/walletStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, wallet } = useWalletStore();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && wallet) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, wallet, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
              <Wallet className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            NLP Crypto Wallet
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI-Powered Ethereum Wallet with Natural Language Commands on Sepolia Testnet
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          {/* Create Account */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-200 hover:border-indigo-400 transition transform hover:scale-105">
            <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4">
              <Mail className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-3">Create Account</h2>
            <p className="text-gray-600 text-center mb-6">
              Create a new wallet with email backup and recovery options
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
            >
              Sign Up
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              ✓ Secure • ✓ Recovery via email • ✓ Free testnet ETH
            </p>
          </div>

          {/* Login */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-200 hover:border-purple-400 transition transform hover:scale-105">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-3">Login</h2>
            <p className="text-gray-600 text-center mb-6">
              Access your existing wallet with email and password
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
            >
              Log In
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              ✓ Secure login • ✓ AI assistant ready
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-center mb-6">Why Choose Us?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-3">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <h4 className="font-semibold mb-2">Natural Language</h4>
              <p className="text-sm text-gray-600">
                Send crypto using plain English commands powered by AI
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Secure & Encrypted</h4>
              <p className="text-sm text-gray-600">
                AES-256 encryption with email recovery options
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">Testnet Safe</h4>
              <p className="text-sm text-gray-600">
                Practice with free Sepolia ETH - zero financial risk
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>🔒 Your keys, your crypto. Recovery phrase sent to your email.</p>
        </div>
      </div>
    </div>
  );
}
