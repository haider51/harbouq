import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen mesh-gradient text-white font-sans p-6 gap-6">
      <Sidebar />
      <main className="flex-1 overflow-y-auto glass p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
