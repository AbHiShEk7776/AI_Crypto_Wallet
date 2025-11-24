import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Phone, AlertCircle, Copy, Download, CheckCircle, Shield, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@services/api';
import useWalletStore from '@store/walletStore';

export default function SignupForm() {
  const navigate = useNavigate();
  const { login } = useWalletStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState(null);
  const [showMnemonic, setShowMnemonic] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error('Please fill in all required fields');
    }
    
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    if (formData.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading('Creating your account and wallet...');
      
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || null
      });
      
      toast.dismiss(loadingToast);
      
      if (response.data.success) {
        setMnemonic(response.data.mnemonic);
        setShowMnemonic(true);
        
        login(
          response.data.token,
          response.data.user,
          response.data.wallet
        );
        
        toast.success('Account created successfully!');
      }
      
    } catch (error) {
      toast.dismiss();
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMnemonicConfirmed = () => {
    toast.success('Welcome! Redirecting to dashboard...');
    navigate('/dashboard');
  };

  if (showMnemonic && mnemonic) {
    return <MnemonicBackupModal mnemonic={mnemonic} onConfirm={handleMnemonicConfirmed} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        {/* Signup Card */}
        <div className="glass-dark rounded-3xl p-8 shadow-dark-lg animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 gradient-purple rounded-2xl animate-glow"></div>
              <div className="absolute inset-0 gradient-purple rounded-2xl flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 text-shadow">Create Account</h1>
            <p className="text-white/70">Sign up to create your wallet</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-white/40 transition"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-white/40 transition"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 XXXXXXXXXX"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-white/40 transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-white/40 transition"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-white/50 mt-1">At least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-white/40 transition"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <input
                type="checkbox"
                required
                disabled={loading}
                className="mt-0.5 w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              <label className="text-sm text-white/80 leading-tight">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 gradient-purple text-white rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition">
                Log In
              </Link>
            </p>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 glass-light rounded-2xl p-4 border border-blue-500/20">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white text-sm mb-1">🔐 What happens next?</p>
              <p className="text-white/70 text-sm">A wallet will be created for you. You'll receive a 12-word recovery phrase - save it securely!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mnemonic Backup Modal Component
function MnemonicBackupModal({ mnemonic, onConfirm }) {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const words = mnemonic.split(' ');

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    toast.success('Recovery phrase copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([`Your Wallet Recovery Phrase:\n\n${mnemonic}\n\nKeep this safe and never share it with anyone!`], 
      { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'wallet-recovery-phrase.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Recovery phrase downloaded!');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-dark border-2 border-yellow-500/30 rounded-3xl shadow-dark-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Save Your Recovery Phrase</h2>
              <p className="text-sm text-yellow-200">
                This is the ONLY way to recover your wallet. Write it down and keep it safe!
              </p>
            </div>
          </div>
        </div>

        {/* Mnemonic Display */}
        <div className="p-6">
          <div className="bg-black/40 rounded-2xl p-6 border border-white/10">
            <div className="grid grid-cols-3 gap-3">
              {words.map((word, index) => (
                <div key={index} className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10 hover:border-white/20 transition">
                  <span className="text-xs text-white/50 font-mono w-6">{index + 1}.</span>
                  <span className="font-mono font-semibold text-white">{word}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2"
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>

          {/* Warning */}
          <div className="mt-6 bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-5">
            <p className="text-sm text-red-200 font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Important Security Warnings:
            </p>
            <ul className="text-sm text-red-200/90 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Never share your recovery phrase with anyone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Store it offline in a secure location</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Anyone with this phrase can access your funds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>We cannot recover your wallet if you lose this phrase</span>
              </li>
            </ul>
          </div>

          {/* Confirmation Checkbox */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              <label className="text-sm text-white/90 leading-tight">
                I have written down my recovery phrase and stored it in a secure location. 
                I understand that losing this phrase means losing access to my wallet.
              </label>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={onConfirm}
            disabled={!confirmed}
            className="w-full mt-6 py-4 gradient-purple text-white rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            I've Saved My Recovery Phrase - Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
