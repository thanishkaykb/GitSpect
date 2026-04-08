import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import axios from 'axios';
import logo from '../assets/logo.png';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const res = await axios.post('https://gitspect.onrender.com/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.access_token);
        onLogin(res.data.access_token);
      } else {
        await axios.post('https://gitspect.onrender.com/api/auth/register', { email, password });
        setMessage("Success! Verification link printed to terminal console.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Check terminal console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10 rounded-full" />
        
        <div className="flex justify-center mb-8">
          <img src={logo} alt="GitSpect Logo" className="w-20 h-20 rounded-2xl object-contain bg-white/5 p-2 shadow-xl shadow-primary/10" />
        </div>

        <h2 className="text-4xl font-bold tracking-tight mb-2">GitSpect</h2>
        <p className="text-white/40 text-lg font-medium mb-10">Autonomous Security Detection</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-11" 
                placeholder="developer@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-11" 
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </motion.div>
            )}
            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-6 py-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isLogin ? <><LogIn className="w-5 h-5" /> Sign In</> : <><UserPlus className="w-5 h-5" /> Create Account</>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-white/40">{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-primary font-semibold hover:underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
