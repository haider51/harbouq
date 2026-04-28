import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Product, 
  Material, 
  Employee, 
  Credit,
  LogEntry 
} from '../types';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;
      
      const fetchCol = async (name: string, setter: any) => {
        const snapshot = await getDocs(collection(db, 'users', userId, name));
        setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };

      await Promise.all([
        fetchCol('products', setProducts),
        fetchCol('materials', setMaterials),
        fetchCol('employees', setEmployees),
        fetchCol('credits', setCredits),
        fetchCol('history', setHistory),
      ]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalSalaries = employees.reduce((sum, e) => sum + e.salary, 0);
    const totalMaterialsCost = materials.reduce((sum, m) => sum + m.cost, 0);
    const receivables = credits.filter(c => c.type === 'owed_to_me').reduce((sum, c) => sum + c.amount, 0);
    const payables = credits.filter(c => c.type === 'owed_by_me').reduce((sum, c) => sum + c.amount, 0);
    
    // Profit margin calc per product
    const productMargins = products.map(p => ({
      name: p.name,
      margin: p.price - (p.rawMaterialCost + p.manufacturingPrice),
      percentage: ((p.price - (p.rawMaterialCost + p.manufacturingPrice)) / p.price) * 100
    }));

    const avgMargin = productMargins.length > 0 
      ? productMargins.reduce((sum, p) => sum + p.percentage, 0) / productMargins.length 
      : 0;

    return {
      totalSalaries,
      totalMaterialsCost,
      monthlyBurn: totalSalaries + totalMaterialsCost,
      receivables,
      payables,
      avgMargin,
      productMargins
    };
  }, [products, materials, employees, credits]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#141414]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 text-white">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter font-serif">Executive Summary</h1>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Real-time Financial Pointers</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-dark px-6 py-3 border border-indigo-500/30">
            <p className="text-[10px] uppercase font-bold opacity-40">Monthly Burn Rate</p>
            <p className="text-2xl font-bold text-indigo-300">{formatCurrency(stats.monthlyBurn)}</p>
          </div>
          <div className="glass-dark px-6 py-3 border border-white/10">
            <p className="text-[10px] uppercase font-bold opacity-40">Avg. Gross Margin</p>
            <p className="text-2xl font-bold text-white">{stats.avgMargin.toFixed(1)}%</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={TrendingUp} label="Receivables" value={formatCurrency(stats.receivables)} color="text-green-400" />
        <StatCard icon={TrendingDown} label="Payables" value={formatCurrency(stats.payables)} color="text-red-400" />
        <StatCard icon={Users} label="Team Size" value={employees.length.toString()} color="text-indigo-300" />
        <StatCard icon={Package} label="Core Products" value={products.length.toString()} color="text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="glass-dark p-6 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
              <BarChartIcon size={14} />
              Product Profitability
            </h3>
            <span className="text-[8px] font-bold opacity-30 uppercase">Net Margin per Unit</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.productMargins}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#ffffff40" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#ffffff40" />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }} 
                  contentStyle={{ background: '#000000cc', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="margin" fill="#6366f1" barSize={32} radius={[4, 4, 0, 0]}>
                  {stats.productMargins.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.margin > 0 ? '#6366f199' : '#f8717199'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-dark p-6 border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-8 text-slate-400">
              <AlertCircle size={14} />
              Monthly Expense Structure
            </h3>
            <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Salaries', value: stats.totalSalaries },
                      { name: 'Materials', value: stats.totalMaterialsCost }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" stroke="none" />
                    <Cell fill="#6366f133" stroke="none" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#000000cc', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[8px] uppercase font-bold opacity-30 leading-none">Total Burn</p>
                <p className="text-lg font-bold">{formatCurrency(stats.monthlyBurn)}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold border-b border-white/5 pb-2">
              <span className="uppercase opacity-30 tracking-wider">Salary Pool</span>
              <span>{formatCurrency(stats.totalSalaries)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold border-b border-white/5 pb-2">
              <span className="uppercase opacity-30 tracking-wider">Operating Ops</span>
              <span>{formatCurrency(stats.totalMaterialsCost)}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="glass-dark p-6 border border-white/5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6 text-slate-400">
          <FileText size={14} />
          Recent Operations
        </h3>
        {history.length > 0 ? (
          <div className="space-y-1">
            {history.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all border-b border-white/5">
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-[8px] font-bold uppercase px-2 py-0.5 rounded-sm",
                    log.type === 'sale' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  )}>
                    {log.type}
                  </span>
                  <span className="text-sm font-medium opacity-80">{log.description}</span>
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  log.type === 'sale' ? 'text-green-400' : 'text-slate-300'
                )}>{log.type === 'sale' ? '+' : '-'}{formatCurrency(log.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center">
            <AlertCircle className="opacity-10 mb-2" size={32} />
            <p className="text-[10px] uppercase font-bold opacity-20">No transaction logs available</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="glass-dark p-5 flex flex-col justify-between border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30">{label}</span>
        <Icon size={14} className="opacity-20" />
      </div>
      <p className={cn("text-2xl font-black tracking-tighter truncate", color)}>{value}</p>
    </div>
  );
}
