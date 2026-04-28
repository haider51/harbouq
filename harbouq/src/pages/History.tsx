import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  History, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  Receipt,
  Plus,
  Loader2
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { LogEntry } from '../types';

export default function HistoryPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLog, setNewLog] = useState<Partial<LogEntry>>({
    type: 'sale',
    description: '',
    amount: 0,
    date: new Date().toISOString()
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/history`;
    try {
      const q = query(
        collection(db, path),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LogEntry)));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/history`;
    try {
      const logData = {
        ...newLog,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, path), logData);
      setLogs([{ id: docRef.id, ...logData } as any, ...logs]);
      setShowAdd(false);
      setNewLog({ type: 'sale', description: '', amount: 0 });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/history/${id}`;
    try {
      await deleteDoc(doc(db, path));
      setLogs(logs.filter(l => l.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-8 pb-12 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight italic font-serif">Operations Ledger</h2>
          <p className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Chronological record of all business actions</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white px-6 py-3 font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} />
          {showAdd ? 'Close' : 'Record Action'}
        </button>
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 max-w-2xl border-white/10"
        >
          <form onSubmit={handleAddLog} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold opacity-30 tracking-widest">Entry Type</label>
                <select 
                  value={newLog.type}
                  onChange={e => setNewLog({...newLog, type: e.target.value as any})}
                  className="w-full border-b border-white/20 py-2 bg-transparent text-white focus:outline-none"
                >
                  <option value="sale" className="bg-[#020617]">Revenue (Sale)</option>
                  <option value="purchase" className="bg-[#020617]">Operating (Expense)</option>
                  <option value="other" className="bg-[#020617]">Special Adjustment</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold opacity-30 tracking-widest">Amount</label>
                <input 
                  type="number"
                  value={newLog.amount}
                  onChange={e => setNewLog({...newLog, amount: Number(e.target.value)})}
                  className="w-full border-b border-white/20 py-2 bg-transparent focus:outline-none font-bold text-white"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold opacity-30 tracking-widest">Description</label>
              <input 
                type="text"
                value={newLog.description}
                onChange={e => setNewLog({...newLog, description: e.target.value})}
                className="w-full border-b border-white/20 py-2 bg-transparent focus:outline-none text-white placeholder:text-white/10"
                placeholder="e.g. Sold 5 Custom Suits"
                required
              />
            </div>
            <button className="w-full bg-white text-indigo-950 py-4 font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs">
              Commit to Registry
            </button>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin opacity-20" size={48} />
        </div>
      ) : (
        <div className="glass-dark border border-white/5 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-5 border-b border-white/10 text-[10px] uppercase font-black tracking-[0.3em] opacity-30">
            <div className="col-span-2">Identity/Date</div>
            <div className="col-span-2">Nature</div>
            <div className="col-span-5">Activity</div>
            <div className="col-span-2 text-right">Value</div>
            <div className="col-span-1"></div>
          </div>
          {logs.length === 0 ? (
            <div className="py-20 text-center opacity-20 italic font-serif">"No activities recorded in the persistent ledger."</div>
          ) : (
            <div className="divide-y divide-white/5">
              {logs.map((log) => (
                <div key={log.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-white/5 transition-all group border-b border-white/5">
                  <div className="col-span-2 text-[10px] font-mono opacity-40">
                    {formatDate(log.date)}
                  </div>
                  <div className="col-span-2">
                    <TypeBadge type={log.type} />
                  </div>
                  <div className="col-span-5 text-sm font-medium text-slate-200 truncate">
                    {log.description}
                  </div>
                  <div className={cn(
                    "col-span-2 text-right font-bold tracking-tight text-base",
                    log.type === 'sale' ? 'text-green-400' : 'text-slate-300'
                  )}>
                    {log.type === 'sale' ? '+' : '-'}{formatCurrency(log.amount)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button 
                      onClick={() => handleDelete(log.id!)}
                      className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: LogEntry['type'] }) {
  const icons = {
    sale: ShoppingBag,
    purchase: Receipt,
    expense: CreditCard,
    other: History
  };
  const Icon = icons[type] || History;
  
  const colors = {
    sale: 'bg-green-500/10 text-green-400 border-green-500/20',
    purchase: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    expense: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    other: 'bg-white/5 text-slate-400 border-white/10'
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest rounded-sm",
      colors[type] || colors.other
    )}>
      <Icon size={10} />
      {type}
    </span>
  );
}
