import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import WorkerDashboard from './components/worker/WorkerDashboard';
import MaterialsRequest from './components/worker/MaterialsRequest';
import HoursBooking from './components/worker/HoursBooking';
import ManagerDashboard from './components/manager/ManagerDashboard';
import TasksManager from './components/manager/TasksManager';
import MaterialsManager from './components/manager/MaterialsManager';
import SitesManager from './components/manager/SitesManager';
import TimesheetsManager from './components/manager/TimesheetsManager';
import DrawingsManager from './components/manager/DrawingsManager';
import WorkersManager from './components/manager/WorkersManager';
import PhotoManager from './components/photo/PhotoManager';
import AccountProfile from './components/AccountProfile';
import Messages from './components/Messages';
import AIAssistant from './components/AIAssistant';
import { Hammer, LayoutDashboard, ListTodo, Package, MapPin, Clock, LogOut, Sparkles, Camera, FileText, Users, User, MessageCircle } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Hammer className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth />;
  }

  const isManager = profile.role === 'manager';

  const tabs = isManager
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'tasks', label: 'Tasks', icon: ListTodo },
        { id: 'workers', label: 'Workers', icon: Users },
        { id: 'timesheets', label: 'Timesheets', icon: Clock },
        { id: 'materials', label: 'Materials', icon: Package },
        { id: 'sites', label: 'Sites', icon: MapPin },
        { id: 'drawings', label: 'Drawings', icon: FileText },
        { id: 'photos', label: 'Photos', icon: Camera },
        { id: 'messages', label: 'Messages', icon: MessageCircle },
        { id: 'profile', label: 'Profile', icon: User },
      ]
    : [
        { id: 'dashboard', label: 'My Tasks', icon: ListTodo },
        { id: 'hours', label: 'My Hours', icon: Clock },
        { id: 'materials', label: 'Request Materials', icon: Package },
        { id: 'drawings', label: 'Drawings', icon: FileText },
        { id: 'photos', label: 'Photos', icon: Camera },
        { id: 'messages', label: 'Messages', icon: MessageCircle },
        { id: 'profile', label: 'Profile', icon: User },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-orange-500/20 sticky top-0 z-40 backdrop-blur-md bg-opacity-90 shadow-lg shadow-orange-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl blur opacity-50"></div>
                <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-lg">
                  <Hammer className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
                    BuildFlow
                  </h1>
                  <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {profile.full_name} <span className="text-orange-500">•</span> <span className="capitalize">{profile.role}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-semibold">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-900/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 p-6">
          {activeTab === 'photos' ? (
            <PhotoManager />
          ) : activeTab === 'drawings' ? (
            <DrawingsManager />
          ) : activeTab === 'profile' ? (
            <AccountProfile />
          ) : activeTab === 'messages' ? (
            <Messages />
          ) : isManager ? (
            <>
              {activeTab === 'dashboard' && <ManagerDashboard />}
              {activeTab === 'tasks' && <TasksManager />}
              {activeTab === 'workers' && <WorkersManager />}
              {activeTab === 'timesheets' && <TimesheetsManager />}
              {activeTab === 'materials' && <MaterialsManager />}
              {activeTab === 'sites' && <SitesManager />}
            </>
          ) : (
            <>
              {activeTab === 'dashboard' && <WorkerDashboard />}
              {activeTab === 'hours' && <HoursBooking />}
              {activeTab === 'materials' && <MaterialsRequest />}
            </>
          )}
        </div>
      </div>

      <AIAssistant />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
