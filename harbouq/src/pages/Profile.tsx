import React, { useState, useEffect } from 'react';
import { db, auth, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { 
  Package, 
  Truck, 
  Users, 
  Settings, 
  CreditCard,
  Plus,
  Trash2,
  Save,
  Loader2,
  UserCircle
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, 
  Product, 
  Material, 
  Employee, 
  Machine, 
  Credit 
} from '../types';

type Tab = 'profile' | 'products' | 'materials' | 'employees' | 'machines' | 'credits';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ 
    name: '', 
    projectName: '', 
    projectDescription: '', 
    createdAt: '' 
  });
  
  // Lists
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    
    // Profile
    try {
      const profileDoc = await getDoc(doc(db, 'users', userId));
      if (profileDoc.exists()) {
        setProfile(profileDoc.data() as UserProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${userId}`);
    }

    // Collections
    const fetchCollection = async (name: string, setter: any) => {
      const path = `users/${userId}/${name}`;
      try {
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    };

    fetchCollection('products', setProducts);
    fetchCollection('materials', setMaterials);
    fetchCollection('employees', setEmployees);
    fetchCollection('machines', setMachines);
    fetchCollection('credits', setCredits);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    const path = `users/${auth.currentUser.uid}`;
    try {
      await setDoc(doc(db, path), {
        ...profile,
        createdAt: profile.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (col: string, data: any, setter: any) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const path = `users/${userId}/${col}`;
    try {
      const newData = { ...data, createdAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, path), newData);
      setter((prev: any) => [{ id: docRef.id, ...newData }, ...prev]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const deleteItem = async (col: string, id: string, setter: any) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const path = `users/${userId}/${col}/${id}`;
    try {
      await deleteDoc(doc(db, path));
      setter((prev: any) => prev.filter((item: any) => item.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-8 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight italic font-serif text-white">Management Console</h2>
          <p className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Define your business structure and assets</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={UserCircle} label="Profile" />
        <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={Package} label="Products" />
        <TabButton active={activeTab === 'materials'} onClick={() => setActiveTab('materials')} icon={Truck} label="Materials" />
        <TabButton active={activeTab === 'employees'} onClick={() => setActiveTab('employees')} icon={Users} label="Team" />
        <TabButton active={activeTab === 'machines'} onClick={() => setActiveTab('machines')} icon={Settings} label="Equipment" />
        <TabButton active={activeTab === 'credits'} onClick={() => setActiveTab('credits')} icon={CreditCard} label="Finance" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'profile' && (
            <div className="max-w-2xl glass p-8">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">Business Name</label>
                  <input 
                    type="text" 
                    value={profile.projectName}
                    onChange={e => setProfile({ ...profile, projectName: e.target.value })}
                    className="w-full border-b border-white/20 bg-transparent py-2 focus:outline-none focus:border-indigo-500 text-xl font-medium text-white"
                    placeholder="e.g. Al-Fajr Textiles"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">Owner Name</label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    className="w-full border-b border-white/20 bg-transparent py-2 focus:outline-none focus:border-indigo-500 text-white"
                    placeholder="Your Full Name"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">Description</label>
                  <textarea 
                    value={profile.projectDescription}
                    onChange={e => setProfile({ ...profile, projectDescription: e.target.value })}
                    className="w-full border border-white/10 bg-white/5 p-4 min-h-[120px] focus:outline-none rounded-xl text-white"
                    placeholder="Tell us about what you do..."
                  />
                </div>
                <button 
                  disabled={loading}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Save Profile
                </button>
              </form>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <AddProduct onAdd={(d) => addItem('products', d, setProducts)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(p => (
                  <ItemCard key={p.id} title={p.name} subtitle={`${formatCurrency(p.price)} / unit`} details={[
                    { label: 'Raw Cost', value: formatCurrency(p.rawMaterialCost) },
                    { label: 'Mfg Cost', value: formatCurrency(p.manufacturingPrice) }
                  ]} onDelete={() => deleteItem('products', p.id!, setProducts)} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-6">
              <AddMaterial onAdd={(d) => addItem('materials', d, setMaterials)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map(m => (
                  <ItemCard key={m.id} title={m.name} subtitle={formatCurrency(m.cost)} details={[
                    { label: 'Qty', value: m.quantity.toString() },
                    { label: 'Freq', value: m.duration }
                  ]} onDelete={() => deleteItem('materials', m.id!, setMaterials)} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-6">
              <AddEmployee onAdd={(d) => addItem('employees', d, setEmployees)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employees.map(e => (
                  <ItemCard key={e.id} title={e.name} subtitle={`Monthly: ${formatCurrency(e.salary)}`} onDelete={() => deleteItem('employees', e.id!, setEmployees)} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'machines' && (
            <div className="space-y-6">
              <AddMachine onAdd={(d) => addItem('machines', d, setMachines)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {machines.map(m => (
                  <ItemCard key={m.id} title={m.name} details={[
                    { label: 'Last Mnt', value: m.lastMaintenance },
                    { label: 'Next Mnt', value: m.nextMaintenance }
                  ]} onDelete={() => deleteItem('machines', m.id!, setMachines)} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="space-y-6">
              <AddCredit onAdd={(d) => addItem('credits', d, setCredits)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {credits.map(c => (
                  <ItemCard 
                    key={c.id} 
                    title={c.party} 
                    subtitle={formatCurrency(c.amount)} 
                    label={c.type === 'owed_to_me' ? 'Receivable' : 'Payable'}
                    labelColor={c.type === 'owed_to_me' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}
                    details={[{ label: 'Due Date', value: c.dueDate }]} 
                    onDelete={() => deleteItem('credits', c.id!, setCredits)} 
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 border-b-2 transition-all whitespace-nowrap",
        active ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-white"
      )}
    >
      <Icon size={14} />
      <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
    </button>
  );
}

function ItemCard({ title, subtitle, details, onDelete, label, labelColor }: any) {
  return (
    <div className="glass-dark p-5 flex justify-between items-start group hover:border-white/10 transition-all">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-bold text-base text-white">{title}</h4>
          {label && (
            <span className={cn("text-[8px] px-2 py-0.5 font-bold uppercase rounded-sm", labelColor)}>{label}</span>
          )}
        </div>
        {subtitle && <p className="text-sm opacity-40 mb-3">{subtitle}</p>}
        {details && (
          <div className="flex gap-6">
            {details.map((d: any, i: number) => (
              <div key={i}>
                <p className="text-[8px] uppercase opacity-20 font-black tracking-widest">{d.label}</p>
                <p className="text-[11px] font-semibold opacity-60">{d.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={onDelete} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all rounded-lg">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// Forms
function AddProduct({ onAdd }: any) {
  const [data, setData] = useState({ name: '', price: 0, rawMaterialCost: 0, manufacturingPrice: 0 });
  return (
    <div className="glass-dark p-6 border-white/5 bg-indigo-500/5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Input label="Product Name" value={data.name} onChange={v => setData({...data, name: v})} />
        <Input label="Retail Price" type="number" value={data.price} onChange={v => setData({...data, price: Number(v)})} />
        <Input label="Raw Costs" type="number" value={data.rawMaterialCost} onChange={v => setData({...data, rawMaterialCost: Number(v)})} />
        <Input label="Mfg Price" type="number" value={data.manufacturingPrice} onChange={v => setData({...data, manufacturingPrice: Number(v)})} />
      </div>
      <button onClick={() => { onAdd(data); setData({ name: '', price: 0, rawMaterialCost: 0, manufacturingPrice: 0 }); }} className="flex items-center gap-2 bg-white/10 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-white/20 transition-all uppercase tracking-widest">
        <Plus size={16} /> Register Component
      </button>
    </div>
  );
}

function AddMaterial({ onAdd }: any) {
  const [data, setData] = useState({ name: '', cost: 0, quantity: 0, duration: '' });
  return (
    <div className="glass-dark p-6 border-white/5 bg-white/5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Input label="Resource Name" value={data.name} onChange={v => setData({...data, name: v})} />
        <Input label="Fixed Cost" type="number" value={data.cost} onChange={v => setData({...data, cost: Number(v)})} />
        <Input label="Quantity" type="number" value={data.quantity} onChange={v => setData({...data, quantity: Number(v)})} />
        <Input label="Frequency" value={data.duration} placeholder="e.g. Monthly" onChange={v => setData({...data, duration: v})} />
      </div>
      <button onClick={() => { onAdd(data); setData({ name: '', cost: 0, quantity: 0, duration: '' }); }} className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-indigo-400 transition-all uppercase tracking-widest">
        <Plus size={16} /> Add Material
      </button>
    </div>
  );
}

function AddEmployee({ onAdd }: any) {
  const [data, setData] = useState({ name: '', salary: 0 });
  return (
    <div className="glass-dark p-6 border-white/5 bg-white/5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Input label="Employee Full Name" value={data.name} onChange={v => setData({...data, name: v})} />
        <Input label="Monthly Salary" type="number" value={data.salary} onChange={v => setData({...data, salary: Number(v)})} />
      </div>
      <button onClick={() => { onAdd(data); setData({ name: '', salary: 0 }); }} className="flex items-center gap-2 bg-white/10 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-white/20 transition-all uppercase tracking-widest">
        <Plus size={16} /> Add Personnel
      </button>
    </div>
  );
}

function AddMachine({ onAdd }: any) {
  const [data, setData] = useState({ name: '', lastMaintenance: '', nextMaintenance: '' });
  return (
    <div className="glass-dark p-6 border-white/5 bg-white/5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Input label="Equipment Name" value={data.name} onChange={v => setData({...data, name: v})} />
        <Input label="Last Service" type="date" value={data.lastMaintenance} onChange={v => setData({...data, lastMaintenance: v})} />
        <Input label="Next Checkup" type="date" value={data.nextMaintenance} onChange={v => setData({...data, nextMaintenance: v})} />
      </div>
      <button onClick={() => { onAdd(data); setData({ name: '', lastMaintenance: '', nextMaintenance: '' }); }} className="flex items-center gap-2 bg-white/10 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-white/20 transition-all uppercase tracking-widest">
        <Plus size={16} /> Register Asset
      </button>
    </div>
  );
}

function AddCredit({ onAdd }: any) {
  const [data, setData] = useState({ type: 'owed_to_me', amount: 0, party: '', dueDate: '' });
  return (
    <div className="glass-dark p-6 border-white/5 bg-white/5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold opacity-30 tracking-widest">Flow Type</label>
          <select 
            value={data.type} 
            onChange={e => setData({...data, type: e.target.value as any})}
            className="w-full border-b border-white/20 py-2 bg-transparent text-white focus:outline-none"
          >
            <option value="owed_to_me" className="bg-[#020617]">Incoming (Receivable)</option>
            <option value="owed_by_me" className="bg-[#020617]">Outgoing (Payable)</option>
          </select>
        </div>
        <Input label="Amount" type="number" value={data.amount} onChange={v => setData({...data, amount: Number(v)})} />
        <Input label="Entity/Person" value={data.party} onChange={v => setData({...data, party: v})} />
        <Input label="Term Date" type="date" value={data.dueDate} onChange={v => setData({...data, dueDate: v})} />
      </div>
      <button onClick={() => { onAdd(data); setData({ type: 'owed_to_me', amount: 0, party: '', dueDate: '' }); }} className="flex items-center gap-2 bg-white/10 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-white/20 transition-all uppercase tracking-widest">
        <Plus size={16} /> Record Transaction
      </button>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase font-bold opacity-30 tracking-widest">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full border-b border-white/20 py-2 focus:outline-none focus:border-indigo-500 bg-transparent text-white placeholder:text-white/20"
      />
    </div>
  );
}
