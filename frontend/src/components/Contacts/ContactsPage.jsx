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
  ArrowDownLeft
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            My Contacts
          </h1>
          <p className="text-gray-600 mt-1">
            Save wallet addresses with custom names for easy sending
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or address..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? 'No contacts found' : 'No contacts yet. Add your first contact!'}
          </div>
        ) : (
          <div className="divide-y">
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
  );
}

// Contact Card Component
function ContactCard({ contact, onDelete, onToggleFavorite, onViewDetails }) {
  return (
    <div className="p-4 hover:bg-gray-50 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {contact.alias[0].toUpperCase()}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{contact.alias}</h3>
              {contact.favorite && (
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <p className="text-sm text-gray-600 font-mono truncate">
              {contact.walletAddress}
            </p>
            {contact.transactionCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {contact.transactionCount} transaction{contact.transactionCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(contact)}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
            title={contact.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${contact.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
          </button>
          
          <button
            onClick={() => onViewDetails(contact)}
            className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium flex items-center gap-1 transition"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
          
          <button
            onClick={() => onDelete(contact._id, contact.alias)}
            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
            title="Delete contact"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="flex gap-2 mt-2 ml-16">
          {contact.tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Add New Contact</h2>
          <p className="text-gray-600 text-sm mt-1">
            Save a wallet address with a custom name
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Alias */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Name / Alias *
            </label>
            <input
              type="text"
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              placeholder="e.g., Alice, Bob's Wallet"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              maxLength={50}
            />
          </div>

          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Wallet Address *
            </label>
            <input
              type="text"
              value={formData.walletAddress}
              onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
              placeholder="0x..."
              className="w-full px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes about this contact..."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tags (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-indigo-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Favorite */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.favorite}
              onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label className="text-sm font-medium">
              Add to favorites
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
            >
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
    // Navigate to send page with pre-filled address
    navigate('/send', { 
      state: { 
        recipientAddress: contact.walletAddress,
        recipientName: contact.alias 
      } 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {contact.alias[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {contact.alias}
                  {contact.favorite && (
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  )}
                </h2>
                <p className="text-sm text-gray-600 font-mono mt-1">
                  {contact.walletAddress}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ×
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{contact.transactionCount || 0}</p>
              <p className="text-xs text-gray-600">Transactions</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">
                {parseFloat(contact.totalReceived || 0).toFixed(4)}
              </p>
              <p className="text-xs text-gray-600">Received (ETH)</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">
                {parseFloat(contact.totalSent || 0).toFixed(4)}
              </p>
              <p className="text-xs text-gray-600">Sent (ETH)</p>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendTo}
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send to {contact.alias}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 py-3 font-medium ${
                activeTab === 'transactions'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-3 font-medium ${
                activeTab === 'details'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600'
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
              <h3 className="font-semibold mb-3">Transaction History</h3>
              {loading ? (
                <p className="text-center py-8 text-gray-500">Loading...</p>
              ) : transactions.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  No transactions yet with this contact
                </p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.hash}
                      className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'received' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {tx.type === 'received' ? (
                            <ArrowDownLeft className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {tx.type === 'received' ? 'Received from' : 'Sent to'} {contact.alias}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.timestamp * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {tx.type === 'received' ? '+' : '-'}{tx.value} ETH
                        </p>
                        <p className="text-xs text-gray-500">{tx.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">Contact Details</h3>
              
              {contact.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {contact.notes}
                  </p>
                </div>
              )}

              {contact.tags && contact.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Added</p>
                <p className="text-sm text-gray-600">
                  {new Date(contact.createdAt).toLocaleString()}
                </p>
              </div>

              {contact.lastTransactionDate && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Last Transaction</p>
                  <p className="text-sm text-gray-600">
                    {new Date(contact.lastTransactionDate).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
