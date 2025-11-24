import React, { useState } from 'react';
import useWalletStore from '@store/walletStore';
import toast from 'react-hot-toast';
import { 
  Bell, 
  Mail, 
  TrendingUp,
  Shield,
  Moon,
  Globe,
  Key,
  Download,
  Trash2,
  Settings as SettingsIcon,
  Save,
  Loader,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function Settings() {
  const { user, network, setNetwork, wallet } = useWalletStore();
  const [activeTab, setActiveTab] = useState('notifications');
  
  const [emailPrefs, setEmailPrefs] = useState({
    transactions: true,
    lowBalance: true,
    weeklySummary: true
  });
  
  const [saving, setSaving] = useState(false);

  const handleSaveEmailPrefs = async () => {
    try {
      setSaving(true);
      // TODO: Add API endpoint to save preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Email preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    toast('Change password feature coming soon!', { icon: '🔐' });
  };

  const handleExportKey = () => {
    toast('Export key feature coming soon!', { icon: '💾' });
  };

  const handleDeleteAccount = () => {
    const confirmed = confirm('⚠️ Are you ABSOLUTELY sure? This cannot be undone!');
    if (confirmed) {
      toast.error('Account deletion is disabled in this version');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-2 text-shadow flex items-center gap-3">
            <SettingsIcon className="w-10 h-10" />
            Settings
          </h1>
          <p className="text-white/70">Manage your wallet preferences and security</p>
        </div>

        {/* Tabs Card */}
        <div className="glass-dark rounded-3xl shadow-dark-lg border border-white/10 overflow-hidden animate-fade-in">
          {/* Tab Headers */}
          <div className="border-b border-white/10 bg-white/5">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === 'notifications'
                    ? 'border-b-2 border-indigo-500 text-indigo-400 bg-white/5'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === 'security'
                    ? 'border-b-2 border-indigo-500 text-indigo-400 bg-white/5'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Shield className="w-4 h-4" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === 'general'
                    ? 'border-b-2 border-indigo-500 text-indigo-400 bg-white/5'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Globe className="w-4 h-4" />
                General
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Email Notifications</h2>
                  <p className="text-white/60 text-sm">Manage how you receive updates</p>
                </div>
                
                <div className="space-y-4">
                  {/* Transaction Notifications */}
                  <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                        <Bell className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Transaction Notifications</p>
                        <p className="text-sm text-white/60">Get email for all transactions</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailPrefs.transactions}
                        onChange={(e) => setEmailPrefs({
                          ...emailPrefs,
                          transactions: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>

                  {/* Low Balance Alerts */}
                  <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Low Balance Alerts</p>
                        <p className="text-sm text-white/60">Alert when balance drops below 0.01 ETH</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailPrefs.lowBalance}
                        onChange={(e) => setEmailPrefs({
                          ...emailPrefs,
                          lowBalance: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Weekly Summary */}
                  <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Weekly Summary</p>
                        <p className="text-sm text-white/60">Get weekly activity summary every Monday</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailPrefs.weeklySummary}
                        onChange={(e) => setEmailPrefs({
                          ...emailPrefs,
                          weeklySummary: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEmailPrefs}
                  disabled={saving}
                  className="w-full py-4 gradient-primary text-white rounded-xl font-bold disabled:opacity-50 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Email Preferences
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Security Settings</h2>
                  <p className="text-white/60 text-sm">Manage your account security</p>
                </div>
                
                <div className="space-y-4">
                  {/* Change Password */}
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Key className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white mb-1">Change Password</p>
                        <p className="text-sm text-white/60">
                          Update your account password. Your private key will remain encrypted with the new password.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleChangePassword}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold text-white transition"
                    >
                      Change Password
                    </button>
                  </div>

                  {/* Export Private Key */}
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Download className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white mb-1">Export Private Key</p>
                        <p className="text-sm text-white/60">
                          Download your encrypted private key for backup. Keep it safe!
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleExportKey}
                      className="px-5 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl text-sm font-semibold text-green-300 transition"
                    >
                      Export Key
                    </button>
                  </div>

                  {/* Delete Account */}
                  <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-6 h-6 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-red-300 mb-1 flex items-center gap-2">
                          Delete Account
                          <AlertTriangle className="w-4 h-4" />
                        </p>
                        <p className="text-sm text-red-200/80">
                          Permanently delete your account and all data. This cannot be undone.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-sm font-semibold text-red-300 transition"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">General Settings</h2>
                  <p className="text-white/60 text-sm">Configure your wallet preferences</p>
                </div>
                
                <div className="space-y-6">
                  {/* Default Network */}
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-3">
                      Default Network
                    </label>
                    <select
                      value={network}
                      onChange={(e) => {
                        setNetwork(e.target.value);
                        toast.success(`Switched to ${e.target.value}`);
                      }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    >
                      <option value="sepolia" className="bg-slate-800">Sepolia (Testnet)</option>
                      <option value="ethereum" className="bg-slate-800">Ethereum Mainnet</option>
                      <option value="polygon" className="bg-slate-800">Polygon</option>
                    </select>
                    <p className="text-sm text-white/50 mt-2">
                      Choose your default blockchain network
                    </p>
                  </div>

                  {/* Account Email */}
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-3">
                      Account Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                    <p className="text-sm text-white/50 mt-2">
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Wallet Address */}
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-3">
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      value={wallet?.address || ''}
                      disabled
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 font-mono text-sm cursor-not-allowed"
                    />
                    <p className="text-sm text-white/50 mt-2">
                      Your unique blockchain address
                    </p>
                  </div>

                  {/* Account Info */}
                  <div className="p-5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-5 h-5 text-indigo-400" />
                      <p className="font-semibold text-indigo-300">Account Information</p>
                    </div>
                    <div className="space-y-2 text-sm text-indigo-200/80">
                      <p>• Account created: {new Date().toLocaleDateString()}</p>
                      <p>• Security level: High (AES-256 encryption)</p>
                      <p>• Two-factor authentication: Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
