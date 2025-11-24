import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Phone, AlertCircle } from 'lucide-react';
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
    
    // Validation
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
      
      // Call registration API
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || null
      });
      
      toast.dismiss(loadingToast);
      
      if (response.data.success) {
        // Store mnemonic to show to user
        setMnemonic(response.data.mnemonic);
        setShowMnemonic(true);
        
        // Login user
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

  // Show mnemonic modal after successful registration
  if (showMnemonic && mnemonic) {
    return <MnemonicBackupModal mnemonic={mnemonic} onConfirm={handleMnemonicConfirmed} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-gray-600">Sign up to create your wallet</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 XXXXXXXXXX"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                disabled={loading}
                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="text-sm text-gray-600">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Log In
            </Link>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">🔐 What happens next?</p>
          <p>A wallet will be created for you. You'll receive a 12-word recovery phrase - save it securely!</p>
        </div>
      </div>
    </div>
  );
}

// Mnemonic Backup Modal Component
function MnemonicBackupModal({ mnemonic, onConfirm }) {
  const [confirmed, setConfirmed] = useState(false);
  const words = mnemonic.split(' ');

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    toast.success('Recovery phrase copied to clipboard!');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-amber-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-600" />
            <div>
              <h2 className="text-2xl font-bold">Save Your Recovery Phrase</h2>
              <p className="text-sm text-amber-800 mt-1">
                This is the ONLY way to recover your wallet. Write it down and keep it safe!
              </p>
            </div>
          </div>
        </div>

        {/* Mnemonic Display */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
            <div className="grid grid-cols-3 gap-3">
              {words.map((word, index) => (
                <div key={index} className="flex items-center gap-2 bg-white p-3 rounded border">
                  <span className="text-xs text-gray-500 font-mono">{index + 1}.</span>
                  <span className="font-mono font-semibold">{word}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
            >
              📋 Copy to Clipboard
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
            >
              💾 Download as File
            </button>
          </div>

          {/* Warning */}
          <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 font-semibold mb-2">⚠️ Important Security Warnings:</p>
            <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
              <li>Never share your recovery phrase with anyone</li>
              <li>Store it offline in a secure location</li>
              <li>Anyone with this phrase can access your funds</li>
              <li>We cannot recover your wallet if you lose this phrase</li>
            </ul>
          </div>

          {/* Confirmation Checkbox */}
          <div className="mt-6 flex items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label className="text-sm text-gray-700">
              I have written down my recovery phrase and stored it in a secure location. 
              I understand that losing this phrase means losing access to my wallet.
            </label>
          </div>

          {/* Continue Button */}
          <button
            onClick={onConfirm}
            disabled={!confirmed}
            className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            I've Saved My Recovery Phrase - Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
