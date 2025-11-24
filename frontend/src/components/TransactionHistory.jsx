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
  ExternalLink,
  Clock,
  TrendingUp,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight
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

  const activeFilterCount = Object.values(filters).filter((v, i) => 
    v !== '' && v !== 0 && v !== 20 && i < 8
  ).length;

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 text-shadow flex items-center gap-3">
              <Clock className="w-10 h-10" />
              Transaction History
            </h1>
            <p className="text-white/70">
              {total} total transaction{total !== 1 ? 's' : ''} • {network}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 glass-light border border-white/20 rounded-xl font-semibold hover:bg-white/10 flex items-center gap-2 text-white transition relative"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={exportToCSV}
              disabled={transactions.length === 0}
              className="px-4 py-2.5 glass-light border border-white/20 rounded-xl font-semibold hover:bg-white/10 flex items-center gap-2 text-white disabled:opacity-50 transition"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => fetchTransactions()}
              className="p-2.5 glass-light border border-white/20 rounded-xl hover:bg-white/10 text-white transition"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="glass-dark rounded-3xl shadow-dark-lg p-6 space-y-4 border border-white/10 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white">Filter Transactions</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Hash or address..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="" className="bg-slate-800">All Types</option>
                  <option value="sent" className="bg-slate-800">Sent</option>
                  <option value="received" className="bg-slate-800">Received</option>
                  <option value="swap" className="bg-slate-800">Swap</option>
                </select>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Contact</label>
                <select
                  value={filters.contactAddress}
                  onChange={(e) => handleFilterChange('contactAddress', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="" className="bg-slate-800">All Contacts</option>
                  {contacts.map(contact => (
                    <option key={contact._id} value={contact.walletAddress} className="bg-slate-800">
                      {contact.alias}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="" className="bg-slate-800">All Status</option>
                  <option value="success" className="bg-slate-800">Success</option>
                  <option value="pending" className="bg-slate-800">Pending</option>
                  <option value="failed" className="bg-slate-800">Failed</option>
                </select>
              </div>

              {/* Min Amount */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Min Amount (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Max Amount */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Max Amount (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-white transition"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="px-5 py-2.5 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="glass-dark rounded-3xl shadow-dark-lg border border-white/10 overflow-hidden animate-fade-in">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/70">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70">No transactions found</p>
              <p className="text-sm text-white/50 mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((tx) => {
                const contactName = getContactName(tx.type === 'sent' ? tx.to : tx.from);
                
                return (
                  <div
                    key={tx.hash}
                    className="p-5 hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Icon + Details */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          tx.type === 'received' ? 'bg-green-500/20' : 
                          tx.type === 'swap' ? 'bg-purple-500/20' : 'bg-orange-500/20'
                        }`}>
                          {tx.type === 'received' ? (
                            <ArrowDownLeft className="w-6 h-6 text-green-400" />
                          ) : tx.type === 'swap' ? (
                            <ArrowLeftRight className="w-6 h-6 text-purple-400" />
                          ) : (
                            <ArrowUpRight className="w-6 h-6 text-orange-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white capitalize">
                              {tx.type}
                            </p>
                            {contactName && (
                              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded-lg font-semibold">
                                {contactName}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white/60 font-mono truncate">
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          </p>
                          <p className="text-xs text-white/50 mt-0.5">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Right: Amount + Status */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-white text-lg">
                            {tx.type === 'received' ? '+' : '-'}{tx.value} {tx.token || 'ETH'}
                          </p>
                          <p className={`text-xs font-semibold ${
                            tx.status === 'success' ? 'text-green-400' :
                            tx.status === 'pending' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {tx.status}
                          </p>
                        </div>
                        
                        <a
                          href={getExplorerUrl(tx.hash, network)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 hover:bg-white/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4 text-white/70" />
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
          <div className="flex justify-center items-center gap-3 animate-fade-in">
            <button
              onClick={() => {
                const newSkip = Math.max(0, filters.skip - filters.limit);
                handleFilterChange('skip', newSkip);
                fetchTransactions({ skip: newSkip });
              }}
              disabled={filters.skip === 0}
              className="px-4 py-2.5 glass-light border border-white/20 rounded-xl disabled:opacity-50 font-semibold text-white hover:bg-white/10 transition flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="px-5 py-2.5 glass-light border border-white/20 rounded-xl text-white font-semibold">
              Page {Math.floor(filters.skip / filters.limit) + 1} of {Math.ceil(total / filters.limit)}
            </span>
            <button
              onClick={() => {
                const newSkip = filters.skip + filters.limit;
                handleFilterChange('skip', newSkip);
                fetchTransactions({ skip: newSkip });
              }}
              disabled={filters.skip + filters.limit >= total}
              className="px-4 py-2.5 glass-light border border-white/20 rounded-xl disabled:opacity-50 font-semibold text-white hover:bg-white/10 transition flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
