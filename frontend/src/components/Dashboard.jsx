import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bug, History, User, LogOut, Terminal, Activity, ShieldAlert, Cpu } from 'lucide-react';
import axios from 'axios';
import logo from '../assets/logo.png';

const Dashboard = ({ token, onLogout, onNavigate }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setResults(null);
    try {
      const res = await axios.post('/api/analyze', { repo_url: repoUrl, token });
      setResults(res.data);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Analysis failed. Ensure backend is running and valid Gemini API key is provided.";
      alert(errorMsg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
      {/* Navigation Header */}
      <header className="glass fixed top-6 left-6 right-6 h-16 px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="GitSpect Logo" className="w-8 h-8 rounded-lg object-contain bg-white/5" />
          <span className="font-bold text-xl tracking-tight">GitSpect</span>
        </div>
        
        <nav className="flex items-center gap-8">
          <button onClick={() => onNavigate('dashboard')} className="text-primary font-medium flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => onNavigate('history')} className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
            <History className="w-4 h-4" /> History
          </button>
          <button onClick={() => onNavigate('profile')} className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </button>
          <button onClick={onLogout} className="text-danger/70 hover:text-danger transition-colors flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </nav>
      </header>

      <main className="pt-32 px-12 max-w-7xl mx-auto pb-24">
        {/* Hero Input Section */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold mb-6"
          >
            Autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">GitSpect</span> Detection
          </motion.h1>
          <p className="text-white/50 text-xl max-w-2xl mx-auto mb-10">
            Powered by Gemini AI and static heuristics. Clone, Scan, and Analyze in seconds.
          </p>

          <form onSubmit={handleAnalyze} className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500" />
            <div className="relative glass-card flex items-center p-2 rounded-2xl overflow-hidden shadow-2xl">
              <div className="pl-4 pr-3">
                <Search className="w-6 h-6 text-white/30" />
              </div>
              <input 
                type="text" 
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository.git" 
                className="bg-transparent border-none outline-none w-full py-4 text-lg font-medium placeholder:text-white/20"
                required
              />
              <button 
                type="submit" 
                disabled={analyzing}
                className="btn-primary ml-2 flex items-center gap-2 pr-6"
              >
                {analyzing ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Terminal className="w-5 h-5" /> Analyze Repo</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results View */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.div 
               initial={{ opacity: 0, y: 40 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 40 }}
               className="space-y-8"
            >
              <div className="glass-card p-10">
                <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-8">
                   <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                      <ShieldAlert className="w-10 h-10" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-bold">Analysis Synthesis</h2>
                      <p className="text-white/40 mt-1">{repoUrl}</p>
                   </div>
                </div>
                <p className="text-xl text-white/80 leading-relaxed font-light">
                  {results.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(results.bugs || []).map((bug, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card p-6 flex flex-col h-full border-l-4 border-l-primary"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        bug.severity === 'High' ? 'bg-danger/20 text-danger' : 
                        bug.severity === 'Medium' ? 'bg-orange-500/20 text-orange-500' : 
                        'bg-accent/20 text-accent'
                      }`}>
                        {bug.severity} Severity
                      </span>
                      <Bug className="w-5 h-5 text-white/20" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{bug.title}</h3>
                    <p className="text-white/50 text-sm mb-4 line-clamp-3">{bug.description}</p>
                    
                    <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs font-mono text-white/30 truncate">
                        <Terminal className="w-3 h-3" />
                        {bug.file}
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <h4 className="text-xs font-bold text-accent uppercase tracking-widest mb-1.5">Mitigation Plan</h4>
                        <p className="text-xs text-white/70 italic leading-normal">
                          {bug.mitigation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {!results && !analyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 opacity-20 filter grayscale"
            >
              <Activity className="w-32 h-32 mb-6" />
              <p className="text-2xl font-light">Idle System. Awaiting Target Repository.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;
