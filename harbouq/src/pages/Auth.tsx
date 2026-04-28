import { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center mesh-gradient p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-10 space-y-10 text-white"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center font-bold text-4xl shadow-xl">ح</div>
          </div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic font-serif text-white">Harbouq</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-medium opacity-60">Smart Financial Advisor</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white text-indigo-950 py-4 px-6 text-lg font-bold tracking-tight rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg"
          >
            <LogIn size={24} />
            {loading ? 'Initializing...' : 'Get Started'}
          </button>
          
          {error && (
            <p className="text-red-400 text-sm font-medium text-center">{error}</p>
          )}
        </div>

        <div className="pt-8 border-t border-white/10 opacity-40 text-[10px] uppercase tracking-widest text-center italic">
          High Performance Enterprise Intelligence
        </div>
      </motion.div>
    </div>
  );
}
