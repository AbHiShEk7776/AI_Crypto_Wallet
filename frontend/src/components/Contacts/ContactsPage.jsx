import React, { useState, useEffect } from 'react';
import { contactAPI } from '@services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Star, 
  Edit2, 
  Trash2, 
  Send,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import useWalletStore from '@store/walletStore';

export default function ContactsPage() {
  const { isAuthenticated } = useWalletStore();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchContacts();
    }
  }, [isAuthenticated]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data } = await contactAPI.getAll();
      
      if (data.success) {
        setContacts(data.contacts);
        console.log('✅ Contacts loaded:', data.contacts.length);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (contactData) => {
    try {
      const { data } = await contactAPI.add(contactData);
      
      if (data.success) {
        toast.success(`Contact "${contactData.alias}" added!`);
        fetchContacts();
        setShowAddModal(false);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to add contact';
      toast.error(errorMsg);
    }
  };

  const handleDeleteContact = async (id, alias) => {
    if (!confirm(`Delete contact "${alias}"?`)) return;
    
    try {
      const { data } = await contactAPI.delete(id);
      
      if (data.success) {
        toast.success(`Contact "${alias}" deleted`);
        fetchContacts();
      }
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const handleToggleFavorite = async (contact) => {
    try {
      await contactAPI.update(contact._id, { 
        favorite: !contact.favorite 
      });
      fetchContacts();
    } catch (error) {
      toast.error('Failed to update contact');
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 text-shadow flex items-center gap-3">
              <Users className="w-10 h-10" />
              My Contacts
            </h1>
            <p className="text-white/70">
              Save wallet addresses with custom names for easy sending
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 gradient-pink text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Add Contact
          </button>
        </div>

        {/* Search */}
        <div className="glass-dark rounded-2xl p-4 shadow-dark animate-fade-in">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or address..."
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition"
            />
          </div>
        </div>

        {/* Contacts Grid */}
        <div className="animate-fade-in">
          {loading ? (
            <div className="glass-dark rounded-2xl p-12 text-center">
              <div className="w-12 h-12 border-4 border-white/20 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/70">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="glass-dark rounded-2xl p-12 text-center">
              <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70">
                {searchQuery ? 'No contacts found' : 'No contacts yet. Add your first contact!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContacts.map((contact) => (
                <ContactCard
                  key={contact._id}
                  contact={contact}
                  onDelete={handleDeleteContact}
                  onToggleFavorite={handleToggleFavorite}
                  onViewDetails={setSelectedContact}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Contact Modal */}
        {showAddModal && (
          <AddContactModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddContact}
          />
        )}

        {/* Contact Details Modal */}
        {selectedContact && (
          <ContactDetailsModal
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            onUpdate={fetchContacts}
          />
        )}
      </div>
    </div>
  );
}

// Contact Card Component
function ContactCard({ contact, onDelete, onToggleFavorite, onViewDetails }) {
  return (
    <div className="glass-dark rounded-2xl p-6 shadow-dark hover:shadow-dark-lg transition-all duration-300 card-hover group border border-white/10">
      <div className="flex items-start justify-between mb-4">
        {/* Avatar & Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 gradient-pink rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {contact.alias[0].toUpperCase()}
            </div>
            {contact.favorite && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-900" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-white mb-1 truncate">{contact.alias}</h3>
            <p className="text-sm text-white/60 font-mono truncate">
              {contact.walletAddress.slice(0, 10)}...{contact.walletAddress.slice(-8)}
            </p>
            {contact.transactionCount > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-white/70">
                    {contact.transactionCount} tx{contact.transactionCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite(contact)}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <Star className={`w-5 h-5 ${contact.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-white/40'}`} />
        </button>
      </div>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {contact.tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-lg"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(contact)}
          className="flex-1 py-3 gradient-pink text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
        <button
          onClick={() => onDelete(contact._id, contact.alias)}
          className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Add Contact Modal
function AddContactModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    alias: '',
    walletAddress: '',
    notes: '',
    tags: [],
    favorite: false
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-dark border border-white/20 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-dark-lg">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Add New Contact</h2>
              <p className="text-white/60 text-sm mt-1">
                Save a wallet address with a custom name
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Alias */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Name / Alias *
            </label>
            <input
              type="text"
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              placeholder="e.g., Alice, Bob's Wallet"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition"
              required
              maxLength={50}
            />
          </div>

          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Wallet Address *
            </label>
            <input
              type="text"
              value={formData.walletAddress}
              onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-mono text-sm text-white placeholder-white/40 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes about this contact..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Tags (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:border-pink-500 transition"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold text-white transition"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-lg text-sm flex items-center gap-2 border border-pink-500/30"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-pink-200 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Favorite */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <input
              type="checkbox"
              checked={formData.favorite}
              onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
            />
            <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Add to favorites
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 gradient-pink text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Add Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Contact Details Modal
function ContactDetailsModal({ contact, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
  }, [contact._id]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data } = await contactAPI.getTransactions(contact._id);
      
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTo = () => {
    navigate('/send', { 
      state: { 
        recipientAddress: contact.walletAddress,
        recipientName: contact.alias 
      } 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-dark border border-white/20 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-dark-lg">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 gradient-pink rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                {contact.alias[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {contact.alias}
                  {contact.favorite && (
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  )}
                </h2>
                <p className="text-sm text-white/60 font-mono mt-1">
                  {contact.walletAddress}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-white">{contact.transactionCount || 0}</p>
              <p className="text-xs text-white/60 mt-1">Transactions</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/30">
              <p className="text-2xl font-bold text-green-400">
                {parseFloat(contact.totalReceived || 0).toFixed(4)}
              </p>
              <p className="text-xs text-green-300/80 mt-1">Received (ETH)</p>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <p className="text-2xl font-bold text-blue-400">
                {parseFloat(contact.totalSent || 0).toFixed(4)}
              </p>
              <p className="text-xs text-blue-300/80 mt-1">Sent (ETH)</p>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendTo}
            className="w-full mt-4 py-3 gradient-pink text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Send className="w-4 h-4" />
            Send to {contact.alias}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10">
          <div className="flex">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 py-3 font-semibold transition ${
                activeTab === 'transactions'
                  ? 'border-b-2 border-pink-500 text-pink-400'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-3 font-semibold transition ${
                activeTab === 'details'
                  ? 'border-b-2 border-pink-500 text-pink-400'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Details
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'transactions' ? (
            <div>
              <h3 className="font-semibold text-white mb-4">Transaction History</h3>
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-white/20 border-t-pink-500 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-white/60 text-sm">Loading...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/60">No transactions yet with this contact</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.hash}
                      className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.type === 'received' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {tx.type === 'received' ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {tx.type === 'received' ? 'Received from' : 'Sent to'} {contact.alias}
                          </p>
                          <p className="text-xs text-white/50">
                            {new Date(tx.timestamp * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {tx.type === 'received' ? '+' : '-'}{tx.value} ETH
                        </p>
                        <p className="text-xs text-white/50">{tx.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <h3 className="font-semibold text-white">Contact Details</h3>
              
              {contact.notes && (
                <div>
                  <p className="text-sm font-semibold text-white/90 mb-2">Notes</p>
                  <p className="text-sm text-white/70 bg-white/5 p-4 rounded-xl border border-white/10">
                    {contact.notes}
                  </p>
                </div>
              )}

              {contact.tags && contact.tags.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-white/90 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-lg text-sm border border-pink-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm font-semibold text-white/90 mb-1">Added</p>
                  <p className="text-sm text-white/70">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {contact.lastTransactionDate && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm font-semibold text-white/90 mb-1">Last Transaction</p>
                    <p className="text-sm text-white/70">
                      {new Date(contact.lastTransactionDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
