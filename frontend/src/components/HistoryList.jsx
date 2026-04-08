import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, ExternalLink, Calendar, Database, Shield, Trash2 } from 'lucide-react';
import axios from 'axios';
import logo from '../assets/logo.png';

const HistoryList = ({ token, onLogout, onNavigate }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.post('/api/history', { token });
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this analysis?")) {
      try {
        await axios.delete(`/api/history/${id}`, { data: { token } });
        setHistory(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete history item.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-12 pt-32">
       {/* (Same Header) */}
       <header className="glass fixed top-6 left-6 right-6 h-16 px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="GitSpect Logo" className="w-8 h-8 rounded-lg object-contain bg-white/5" />
          <span className="font-bold text-xl tracking-tight">GitSpect</span>
        </div>
        <nav className="flex items-center gap-8">
          <button onClick={() => onNavigate('dashboard')} className="text-white/60 hover:text-white transition-colors">Dashboard</button>
          <button onClick={() => onNavigate('history')} className="text-primary font-medium">History</button>
          <button onClick={() => onNavigate('profile')} className="text-white/60 hover:text-white transition-colors">Profile</button>
          <button onClick={onLogout} className="text-danger/70 hover:text-danger">Log Out</button>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary">
             <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-4xl font-bold">Persistent Analysis Vault</h2>
            <p className="text-white/40 mt-1">Directly query past autonomous sweeps.</p>
          </div>
        </div>

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 rounded-2xl" />)}
           </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 glass-card">
              <Database className="w-16 h-16 mx-auto mb-4 text-white/10" />
              <p className="text-xl text-white/30">Your analysis vault is currently empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-6 flex flex-col cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                     <Shield className="w-5 h-5 text-white/40 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 z-10 relative">
                    <button onClick={(e) => handleDelete(e, item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-danger/20 text-white/20 hover:text-danger transition-colors" title="Delete Analysis">
                       <Trash2 className="w-4 h-4" />
                    </button>
                    <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white" />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold mb-1 truncate">{item.repo_name}</h3>
                <p className="text-xs text-white/30 font-mono mb-4 truncate">{item.repo_url}</p>
                
                <p className="text-xs text-white/50 mb-6 line-clamp-3 leading-relaxed italic">
                  "{item.summary}"
                </p>

                <div className="flex items-center gap-2 text-[10px] text-white/20 mt-auto border-t border-white/5 pt-4">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryList;
