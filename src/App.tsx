import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavProvider, useNav } from './contexts/NavContext';
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
import Breadcrumbs from './components/Breadcrumbs';
import SiteDetail from './components/detail/SiteDetail';
import WorkerDetail from './components/detail/WorkerDetail';
import TaskDetail from './components/detail/TaskDetail';
import WorkerTaskDetail from './components/detail/WorkerTaskDetail';
import { Hammer, LayoutDashboard, ListTodo, Package, MapPin, Clock, LogOut, Sparkles, Camera, FileText, Users, User, MessageCircle, MoreHorizontal, X } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const { activeView } = useNav();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <Hammer className="w-12 h-12 text-brand-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth />;
  }

  const isManager = profile.role === 'manager';

  const managerTabs = [
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
  ];

  const workerTabs = [
    { id: 'dashboard', label: 'My Tasks', icon: ListTodo },
    { id: 'hours', label: 'My Hours', icon: Clock },
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'drawings', label: 'Drawings', icon: FileText },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const tabs = isManager ? managerTabs : workerTabs;

  // For mobile bottom nav: first 4 tabs + More
  const mobilePrimaryTabs = tabs.slice(0, 4);
  const mobileMoreTabs = tabs.slice(4);

  const rootLabel = activeTab === 'dashboard'
    ? (isManager ? 'Dashboard' : 'My Tasks')
    : tabs.find(t => t.id === activeTab)?.label || 'Dashboard';

  function handleTabClick(tabId: string) {
    setActiveTab(tabId);
    setMoreMenuOpen(false);
  }

  function renderDetail() {
    if (!activeView) return null;
    if (activeView.type === 'site') return <SiteDetail siteId={activeView.id} />;
    if (activeView.type === 'worker') return <WorkerDetail workerId={activeView.id} />;
    if (activeView.type === 'task') return <TaskDetail taskId={activeView.id} />;
    if (activeView.type === 'worker_task') return <WorkerTaskDetail taskId={activeView.id} />;
    return null;
  }

  function renderTab() {
    if (activeTab === 'photos') return <PhotoManager />;
    if (activeTab === 'drawings') return <DrawingsManager />;
    if (activeTab === 'profile') return <AccountProfile />;
    if (activeTab === 'messages') return <Messages />;
    if (isManager) {
      if (activeTab === 'dashboard') return <ManagerDashboard />;
      if (activeTab === 'tasks') return <TasksManager />;
      if (activeTab === 'workers') return <WorkersManager />;
      if (activeTab === 'timesheets') return <TimesheetsManager />;
      if (activeTab === 'materials') return <MaterialsManager />;
      if (activeTab === 'sites') return <SitesManager />;
    } else {
      if (activeTab === 'dashboard') return <WorkerDashboard />;
      if (activeTab === 'hours') return <HoursBooking />;
      if (activeTab === 'materials') return <MaterialsRequest />;
    }
    return null;
  }

  function TabButton({ tab, onClick, isActive }: { tab: { id: string; label: string; icon: any }; onClick: () => void; isActive: boolean }) {
    const Icon = tab.icon;
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
          isActive
            ? 'bg-brand-500 text-white shadow-lg shadow-brand-900/50'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
        }`}
      >
        <Icon className="w-4 h-4" />
        {tab.label}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-navy pb-28 md:pb-0">
      {/* Top bar — always visible */}
      <nav className="bg-slate-900 border-b border-brand-500/20 sticky top-0 z-40 backdrop-blur-md bg-opacity-90 shadow-lg shadow-brand-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-500 rounded-xl blur opacity-50"></div>
                <div className="relative bg-brand-500 p-2 md:p-2.5 rounded-xl shadow-lg">
                  <Hammer className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
                    BuildFlow
                  </h1>
                  <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5 hidden sm:block">
                  {profile.full_name} <span className="text-brand-500">•</span> <span className="capitalize">{profile.role}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => { setActiveTab('dashboard'); signOut(); }}
              className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-semibold hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Desktop tab bar — always visible */}
        <div className="hidden md:flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <TabButton key={tab.id} tab={tab} onClick={() => handleTabClick(tab.id)} isActive={activeTab === tab.id} />
          ))}
        </div>

        {/* Content area */}
        {activeView ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 p-4 md:p-6">
            <Breadcrumbs rootLabel={rootLabel} />
            {renderDetail()}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 p-4 md:p-6">
            {renderTab()}
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-brand-500/20 backdrop-blur-md bg-opacity-95" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16 px-1">
          {mobilePrimaryTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && !activeView;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors flex-1 ${
                  isActive ? 'text-brand-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors flex-1 ${
              mobileMoreTabs.some(t => t.id === activeTab) ? 'text-brand-400' : 'text-slate-400'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </div>

      {/* Mobile More menu */}
      {moreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMoreMenuOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl border-t border-slate-700 p-4 pb-6" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">More</h3>
              <button onClick={() => setMoreMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {mobileMoreTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${
                      activeTab === tab.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NavProvider>
        <AppContent />
      </NavProvider>
    </AuthProvider>
  );
}

export default App;
