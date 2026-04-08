import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Trash2, AlertTriangle, ShieldCheck, Edit2 } from 'lucide-react';
import axios from 'axios';
import logo from '../assets/logo.png';

const Profile = ({ token, onLogout, onNavigate }) => {
  const [profile, setProfile] = useState(null);
  const [developerName, setDeveloperName] = useState(() => localStorage.getItem('developerName') || '');

  useEffect(() => {
    let email = "user@gitspect.com";
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) {
          email = payload.sub;
        }
      } catch (e) {
        console.error("Could not parse token", e);
      }
    }
    
    setProfile({
      email: email, 
      is_email_verified: true,
      created_at: new Date().toISOString()
    });
  }, [token]);

  const handleNameChange = (e) => {
    setDeveloperName(e.target.value);
    localStorage.setItem('developerName', e.target.value);
  };

  const handleDelete = async () => {
    if (window.confirm("ARE YOU SURE? This will permanently wipe your account and all history.")) {
      try {
        await axios.delete('/api/profile/me', { data: { token } });
        onLogout();
      } catch (err) {
        onLogout(); // Force logout for demo
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-12 pt-32">
       {/* Top Navigation */}
       <header className="glass fixed top-6 left-6 right-6 h-16 px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="GitSpect Logo" className="w-8 h-8 rounded-lg object-contain bg-white/5" />
          <span className="font-bold text-xl tracking-tight">GitSpect</span>
        </div>
        <nav className="flex items-center gap-8">
          <button onClick={() => onNavigate('dashboard')} className="text-white/60 hover:text-white transition-colors">Dashboard</button>
          <button onClick={() => onNavigate('history')} className="text-white/60 hover:text-white transition-colors">History</button>
          <button onClick={() => onNavigate('profile')} className="text-primary font-medium">Profile</button>
          <button onClick={onLogout} className="text-danger/70 hover:text-danger">Log Out</button>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 flex items-center gap-8"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-4xl font-bold shadow-xl">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <input 
                type="text" 
                value={developerName}
                onChange={handleNameChange}
                placeholder="What is your name?"
                className="bg-transparent border-b border-white/20 hover:border-white/40 text-3xl font-bold focus:outline-none focus:border-primary placeholder:text-white/20 pb-1 w-full max-w-sm transition-colors"
              />
              <Edit2 className="w-5 h-5 text-white/30" />
            </div>
            <div className="flex items-center gap-4 text-white/50">
               <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {profile?.email}</span>
               <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-accent" /> Verified</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8">
          {/* Danger Zone */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 border-danger/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-danger/20 rounded-xl flex items-center justify-center text-danger">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-danger">Danger Zone</h3>
            </div>
            <p className="text-sm text-white/40 mb-6">Permanently delete your GitSpect account and all analysis history. This action cannot be undone.</p>
            <button 
              onClick={handleDelete}
              className="px-6 py-3 border border-danger/30 text-danger hover:bg-danger hover:text-white rounded-xl transition-all duration-300 w-full font-bold flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              Terminate Account
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
