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
  Trash2
} from 'lucide-react';

export default function Settings() {
  const { user, network, setNetwork } = useWalletStore();
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your wallet preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600'
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'security'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'general'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              General
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-medium">Transaction Notifications</p>
                      <p className="text-sm text-gray-600">Get email for all transactions</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailPrefs.transactions}
                    onChange={(e) => setEmailPrefs({
                      ...emailPrefs,
                      transactions: e.target.checked
                    })}
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Low Balance Alerts</p>
                      <p className="text-sm text-gray-600">Alert when balance drops below 0.01 ETH</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailPrefs.lowBalance}
                    onChange={(e) => setEmailPrefs({
                      ...emailPrefs,
                      lowBalance: e.target.checked
                    })}
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-gray-600">Get weekly activity summary every Monday</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailPrefs.weeklySummary}
                    onChange={(e) => setEmailPrefs({
                      ...emailPrefs,
                      weeklySummary: e.target.checked
                    })}
                    className="w-5 h-5"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveEmailPrefs}
                disabled={saving}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Email Preferences'}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Key className="w-5 h-5 text-indigo-600" />
                    <p className="font-medium">Change Password</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Update your account password. Your private key will remain encrypted with the new password.
                  </p>
                  <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">
                    Change Password
                  </button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Download className="w-5 h-5 text-green-600" />
                    <p className="font-medium">Export Private Key</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Download your encrypted private key for backup. Keep it safe!
                  </p>
                  <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">
                    Export Key
                  </button>
                </div>

                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <p className="font-medium text-red-900">Delete Account</p>
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    Permanently delete your account and all data. This cannot be undone.
                  </p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">General Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Default Network</label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="sepolia">Sepolia (Testnet)</option>
                    <option value="ethereum">Ethereum Mainnet</option>
                    <option value="polygon">Polygon</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose your default blockchain network
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Account Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Wallet Address</label>
                  <input
                    type="text"
                    value={user?.walletAddress || ''}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
