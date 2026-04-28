import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCircle, 
  MessageSquare, 
  History, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/profile', icon: UserCircle, label: 'Profile & Business' },
  { path: '/chat', icon: MessageSquare, label: 'AI Advisor' },
  { path: '/history', icon: History, label: 'Operation Logs' },
];

export default function Sidebar() {
  const handleLogout = () => auth.signOut();

  return (
    <div className="w-64 glass flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-2xl shadow-lg">ح</div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tighter uppercase italic font-serif text-white">Harbouq</h1>
            <span className="text-[8px] uppercase tracking-[0.2em] opacity-40 font-black">Financial Intelligence</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300",
              isActive 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? "text-indigo-400" : ""} />
                  <span className={cn("text-xs font-semibold uppercase tracking-wider", isActive ? "opacity-100" : "opacity-70")}>{item.label}</span>
                </div>
                <ChevronRight size={14} className="opacity-30" />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="glass-dark p-3 mb-4 flex justify-between items-center text-[10px]">
          <span className="text-indigo-300 font-bold uppercase tracking-widest">AI Status</span>
          <span className="text-green-400 font-medium">Online</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-red-500/20 transition-all rounded-xl"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
