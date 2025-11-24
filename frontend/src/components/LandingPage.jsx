import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Mail, Zap, Lock, Shield, Sparkles, ArrowRight, Globe, TrendingUp } from 'lucide-react';
import useWalletStore from '@store/walletStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, wallet } = useWalletStore();

  useEffect(() => {
    if (isAuthenticated && wallet) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, wallet, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
        <div className="max-w-6xl w-full">
          
          {/* Hero Section */}
<div className="text-center mb-16 animate-fade-in">
  {/* Logo */}
  <div className="flex items-center justify-center mb-12">
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-2xl animate-glow opacity-60"></div>
      <div className="relative w-28 h-28 gradient-primary rounded-3xl flex items-center justify-center shadow-dark-lg">
        <Wallet className="w-14 h-14 text-white" />
      </div>
    </div>
  </div>


  <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tight leading-none">
    <span className="block text-white drop-shadow-2xl">NLP Crypto</span>
    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-2xl">
      Wallet
    </span>
  </h1>

  {/* Subtitle */}
  <div className="max-w-4xl mx-auto mb-10">
    <p className="text-2xl md:text-3xl text-white/80 leading-relaxed font-semibold">
      Your <span className="text-orange-400 font-black">AI-Powered</span> Ethereum Wallet
    </p>
    <p className="text-xl md:text-2xl text-white/70 mt-2 font-medium">
      with <span className="text-indigo-400 font-bold">Natural Language</span> Commands
    </p>
  </div>

  {/* Badge */}
  <div className="inline-flex items-center gap-3 px-6 py-3 glass-light rounded-full border border-white/20 hover:border-white/30 transition">
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    <span className="text-sm text-white/90 font-bold tracking-wider uppercase">
      Powered by Sepolia Testnet
    </span>
  </div>
</div>
          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12 animate-fade-in">
            
            {/* Create Account Card */}
            <div className="group relative overflow-hidden glass-dark rounded-3xl p-8 border border-white/10 shadow-dark-lg hover:shadow-dark-lg transition-all duration-300 card-hover">
              {/* Gradient Overlay */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center w-20 h-20 gradient-primary rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-center mb-4 text-white">Create Account</h2>
                <p className="text-white/70 text-center mb-8 leading-relaxed">
                  Create a new wallet with email backup and secure recovery options
                </p>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full py-4 gradient-primary text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105"
                >
                  <Sparkles className="w-5 h-5" />
                  Sign Up
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/60">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Secure
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email Recovery
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Free Testnet
                  </span>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="group relative overflow-hidden glass-dark rounded-3xl p-8 border border-white/10 shadow-dark-lg hover:shadow-dark-lg transition-all duration-300 card-hover">
              {/* Gradient Overlay */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center w-20 h-20 gradient-purple rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-center mb-4 text-white">Login</h2>
                <p className="text-white/70 text-center mb-8 leading-relaxed">
                 Access your existing wallet with email and password 
                 
                </p>
                <br></br>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-4 gradient-purple text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105"
                >
                  <Shield className="w-5 h-5" />
                  Log In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/60">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Secure Login
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Assistant
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="glass-dark rounded-3xl p-8 md:p-12 border border-white/10 shadow-dark-lg animate-fade-in">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-white mb-3">Why Choose Us?</h3>
              <p className="text-white/70">Experience the future of crypto wallets</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-indigo-500/30 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                  <div className="relative flex items-center justify-center w-16 h-16 gradient-primary rounded-2xl group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">Natural Language</h4>
                <p className="text-white/70 leading-relaxed">
                  Send crypto using plain English commands powered by advanced AI
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-green-500/30 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                  <div className="relative flex items-center justify-center w-16 h-16 gradient-green rounded-2xl group-hover:scale-110 transition-transform">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">Secure & Encrypted</h4>
                <p className="text-white/70 leading-relaxed">
                  Military-grade AES-256 encryption with multiple recovery options
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-purple-500/30 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                  <div className="relative flex items-center justify-center w-16 h-16 gradient-purple rounded-2xl group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">Testnet Safe</h4>
                <p className="text-white/70 leading-relaxed">
                  Practice with free Sepolia ETH - absolutely zero financial risk
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-4 mt-8 animate-fade-in">
            <div className="glass-light rounded-2xl p-6 text-center border border-white/10">
              <div className="text-3xl font-bold text-white mb-2">100%</div>
              <div className="text-sm text-white/70">Secure</div>
            </div>
            <div className="glass-light rounded-2xl p-6 text-center border border-white/10">
              <div className="text-3xl font-bold text-indigo-400 mb-2">AI</div>
              <div className="text-sm text-white/70">Powered</div>
            </div>
            <div className="glass-light rounded-2xl p-6 text-center border border-white/10">
              <div className="text-3xl font-bold text-green-400 mb-2">Free</div>
              <div className="text-sm text-white/70">Testnet</div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-12 animate-fade-in">
            <div className="inline-flex items-center gap-3 px-6 py-3 glass-light rounded-full border border-white/10">
              <Lock className="w-5 h-5 text-green-400" />
              <p className="text-white/80 text-sm font-medium">
                Your keys, your crypto. Recovery phrase secured via email.
              </p>
            </div>
          </div>

          {/* Tech Stack Badge */}
          <div className="flex items-center justify-center gap-4 mt-8 text-xs text-white/50 animate-fade-in">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> React
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Ethers.js
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> Web3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
