import React, { useState, useEffect } from 'react';
import useWalletStore from '@store/walletStore';
import { Link } from 'react-router-dom';
import { transactionAPI, contactAPI } from '@services/api';
import toast from 'react-hot-toast';
import { 
  Filter, 
  Download, 
  Search,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  X,
  ExternalLink
} from 'lucide-react';
import { getExplorerUrl } from '@utils/formatters';

export default function TransactionHistory() {
  const { isAuthenticated, network } = useWalletStore();
  
  const [transactions, setTransactions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    contactAddress: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    status: '',
    search: '',
    limit: 20,
    skip: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
      fetchContacts();
    }
  }, [isAuthenticated, network]);

  const fetchTransactions = async (customFilters = {}) => {
    try {
      setLoading(true);
      
      const params = {
        ...filters,
        ...customFilters,
        network
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      console.log('Fetching with filters:', params);
      
      const { data } = await transactionAPI.getHistory(params);
      
      if (data.success) {
        setTransactions(data.transactions);
        setTotal(data.total);
        console.log('✅ Loaded', data.transactions.length, 'transactions');
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data } = await contactAPI.getAll();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchTransactions();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      contactAddress: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      status: '',
      search: '',
      limit: 20,
      skip: 0
    });
    fetchTransactions({
      type: '',
      contactAddress: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      status: '',
      search: '',
      limit: 20,
      skip: 0
    });
  };

  const exportToCSV = () => {
    const csv = [
      ['Date', 'Type', 'From', 'To', 'Amount', 'Token', 'Hash', 'Status'].join(','),
      ...transactions.map(tx => [
        new Date(tx.timestamp).toLocaleString(),
        tx.type,
        tx.from,
        tx.to,
        tx.value,
        tx.token || 'ETH',
        tx.hash,
        tx.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    
    toast.success('Transactions exported!');
  };

  const getContactName = (address) => {
    const contact = contacts.find(c => 
      c.walletAddress.toLowerCase() === address.toLowerCase()
    );
    return contact ? contact.alias : null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-gray-600 mt-1">
            {total} total transaction{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.values(filters).some(v => v !== '' && v !== 0 && v !== 20) && (
              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
            )}
          </button>
          <button
            onClick={exportToCSV}
            disabled={transactions.length === 0}
            className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => fetchTransactions()}
            className="p-2 border rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Hash or address..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
                <option value="swap">Swap</option>
              </select>
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium mb-2">Contact</label>
              <select
                value={filters.contactAddress}
                onChange={(e) => handleFilterChange('contactAddress', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              >
                <option value="">All Contacts</option>
                {contacts.map(contact => (
                  <option key={contact._id} value={contact.walletAddress}>
                    {contact.alias}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Min Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Min Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
            </div>

            {/* Max Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Max Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
            >
              Clear All
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((tx) => {
              const contactName = getContactName(tx.type === 'sent' ? tx.to : tx.from);
              
              return (
                <div
                  key={tx.hash}
                  className="p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Icon + Details */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'received' ? 'bg-green-100' : 
                        tx.type === 'swap' ? 'bg-blue-100' : 'bg-orange-100'
                      }`}>
                        {tx.type === 'received' ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">
                            {tx.type}
                          </p>
                          {contactName && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                              {contactName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 font-mono truncate">
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount + Status */}
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="font-semibold">
                          {tx.type === 'received' ? '+' : '-'}{tx.value} {tx.token || 'ETH'}
                        </p>
                        <p className={`text-xs ${
                          tx.status === 'success' ? 'text-green-600' :
                          tx.status === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {tx.status}
                        </p>
                      </div>
                      
                      <a
                        href={getExplorerUrl(tx.hash, network)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 hover:bg-gray-200 rounded-lg transition"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > filters.limit && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              const newSkip = Math.max(0, filters.skip - filters.limit);
              handleFilterChange('skip', newSkip);
              fetchTransactions({ skip: newSkip });
            }}
            disabled={filters.skip === 0}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {Math.floor(filters.skip / filters.limit) + 1} of {Math.ceil(total / filters.limit)}
          </span>
          <button
            onClick={() => {
              const newSkip = filters.skip + filters.limit;
              handleFilterChange('skip', newSkip);
              fetchTransactions({ skip: newSkip });
            }}
            disabled={filters.skip + filters.limit >= total}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
