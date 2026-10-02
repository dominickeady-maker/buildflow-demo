// © 2026 DM.AI 4U. All rights reserved. Unauthorised copying prohibited.
import { useState, useEffect, Component, ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavProvider, useNav } from './contexts/NavContext';
import { DemoModeProvider, useDemoMode } from './contexts/DemoModeContext';
import { BrandingProvider, useBranding } from './contexts/BrandingContext';
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
import CustomersAdmin from './components/admin/CustomersAdmin';
import SetPassword from './components/SetPassword';
import { LayoutDashboard, ListTodo, Package, MapPin, Clock, LogOut, Camera, FileText, Users, User, MessageCircle, MoreHorizontal, X, Info, Building2, Menu } from 'lucide-react';
import Footer from './components/Footer';
import TermsOfService from './components/TermsOfService';
import NotificationBell from './components/NotificationBell';
import { useNotificationsState } from './contexts/NotificationsContext';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('App error boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-700 text-center">
            <h2 className="text-xl font-bold text-white mb-3">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-6">
              An unexpected error occurred. Reloading the page should fix it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, profile, loading, passwordRecovery, signOut } = useAuth();
  const { activeView, activeTab, setActiveTab } = useNav();
  const { isDemoMode } = useDemoMode();
  const { branding } = useBranding();
  const { unreadCount: unreadNotifications } = useNotificationsState();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [burgerMenuOpen, setBurgerMenuOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Apply text size preference on profile load
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-large', 'text-extra-large');
    if (profile?.text_size === 'large') root.classList.add('text-large');
    else if (profile?.text_size === 'extra_large') root.classList.add('text-extra-large');
  }, [profile?.text_size]);

  // Platform admins land on the Customers page by default, not the dashboard.
  useEffect(() => {
    if (profile?.is_platform_admin && activeTab === 'dashboard') {
      setActiveTab('customers');
    }
  }, [profile, activeTab, setActiveTab]);

  // All hooks are above every conditional return. No early return can skip a hook.

  const isAuthConfirmPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/confirm');

  // Show SetPassword on ANY path when Supabase fires a PASSWORD_RECOVERY
  // event or the URL hash contains type=recovery / type=invite, or when
  // the user is on /auth/confirm. This takes priority over the dashboard.
  if (passwordRecovery || isAuthConfirmPath) {
    return <SetPassword />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          {branding.isBranded && branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.displayName || 'Company'} className="h-7 md:h-8 mx-auto mb-4 animate-pulse" />
          ) : branding.isBranded && branding.displayName ? (
            <span className="text-2xl font-bold mx-auto mb-4 animate-pulse" style={{ color: branding.primaryColor }}>
              {branding.displayName}
            </span>
          ) : (
            <img src="/banksman-header-logo-dark-bg.png" alt="Banksman" className="h-7 md:h-8 mx-auto mb-4 animate-pulse" />
          )}
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth onTermsClick={() => setShowTerms(true)} showTerms={showTerms} onCloseTerms={() => setShowTerms(false)} />;
  }

  const isManager = profile.role === 'manager';
  const isPlatformAdmin = profile.is_platform_admin === true;

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

  const adminTabs = [
    { id: 'customers', label: 'Customers', icon: Building2 },
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

  const tabs = isPlatformAdmin ? adminTabs : isManager ? managerTabs : workerTabs;
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
    if (activeView.type === 'task') return <TaskDetail taskId={activeView.id} isDemoMode={isDemoMode} />;
    if (activeView.type === 'worker_task') return <TaskDetail taskId={activeView.id} isDemoMode={isDemoMode} />;
    return null;
  }

  function renderTab() {
    if (activeTab === 'photos') return <PhotoManager isDemoMode={isDemoMode} />;
    if (activeTab === 'drawings') return <DrawingsManager isDemoMode={isDemoMode} />;
    if (activeTab === 'profile') return <AccountProfile />;
    if (activeTab === 'messages') return <Messages />;
    if (isPlatformAdmin) {
      if (activeTab === 'customers') return <CustomersAdmin />;
    }
    if (isManager) {
      if (activeTab === 'dashboard') return <ManagerDashboard />;
      if (activeTab === 'tasks') return <TasksManager isDemoMode={isDemoMode} />;
      if (activeTab === 'workers') return <WorkersManager isDemoMode={isDemoMode} />;
      if (activeTab === 'timesheets') return <TimesheetsManager />;
      if (activeTab === 'materials') return <MaterialsManager />;
      if (activeTab === 'sites') return <SitesManager isDemoMode={isDemoMode} />;
    } else {
      if (activeTab === 'dashboard') return <WorkerDashboard />;
      if (activeTab === 'hours') return <HoursBooking />;
      if (activeTab === 'materials') return <MaterialsRequest />;
    }
    return null;
  }

  function TabButton({ tab, onClick, isActive, hasBadge }: { tab: { id: string; label: string; icon: any }; onClick: () => void; isActive: boolean; hasBadge?: boolean }) {
    const Icon = tab.icon;
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap relative ${
          isActive
            ? 'bg-brand-500 text-white shadow-lg shadow-brand-900/50'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
        }`}
      >
        <Icon className="w-4 h-4" />
        {tab.label}
        {hasBadge && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">!</span>}
      </button>
    );
  }

  const headerLogo = branding.isBranded && branding.logoUrl
    ? branding.logoUrl
    : null;
  const headerAlt = branding.isBranded && branding.displayName
    ? branding.displayName
    : 'Banksman';

  return (
    <div className="min-h-screen bg-navy pb-28 md:pb-0">
      <div className="sticky top-0 z-50">
      {isDemoMode && (
        <div className="bg-amber-500/95 text-amber-950 text-center py-1.5 px-4 text-xs font-medium flex items-center justify-center gap-2">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Demo environment — not for redistribution · data resets regularly</span>
        </div>
      )}
      <nav className="bg-slate-900 border-b border-brand-500/20 backdrop-blur-md bg-opacity-90 shadow-lg shadow-brand-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3 md:gap-4">
              {headerLogo ? (
                <img src={headerLogo} alt={headerAlt} className="h-[26px] md:h-8 max-w-[200px] object-contain" />
              ) : branding.isBranded && branding.displayName ? (
                <span className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: branding.primaryColor }}>
                  {branding.displayName}
                </span>
              ) : (
                <img src="/banksman-header-logo-dark-bg.png" alt="Banksman" className="h-[26px] md:h-8" />
              )}
              <div className="flex items-center gap-2">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <p className="text-xs text-slate-400 font-medium mt-0.5 hidden sm:block">
                  {profile.full_name} <span className="text-brand-500">•</span> <span className="capitalize">{isPlatformAdmin ? 'Platform Admin' : profile.role}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <NotificationBell />
              <button
                onClick={() => setBurgerMenuOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="hidden md:flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <TabButton key={tab.id} tab={tab} onClick={() => handleTabClick(tab.id)} isActive={activeTab === tab.id} hasBadge={tab.id === 'messages' && unreadNotifications > 0} />
          ))}
        </div>

        {activeView ? (
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-4 md:p-6">
            <Breadcrumbs rootLabel={rootLabel} />
            {renderDetail()}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-4 md:p-6">
            {renderTab()}
          </div>
        )}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-brand-500/20 backdrop-blur-md bg-opacity-95" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16 px-1">
          {mobilePrimaryTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && !activeView;
            const hasBadge = tab.id === 'messages' && unreadNotifications > 0;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors flex-1 relative ${
                  isActive ? 'text-brand-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {hasBadge && <span className="absolute top-0 right-1/2 translate-x-3 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </button>
            );
          })}

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hidden md:block">
        <Footer onTermsClick={() => setShowTerms(true)} />
      </div>

      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}

      {burgerMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setBurgerMenuOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-slate-800 border-l border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="bg-brand-500 rounded-full p-2">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{profile.full_name}</p>
                  <p className="text-xs text-slate-400 capitalize">{isPlatformAdmin ? 'Platform Admin' : profile.role}</p>
                </div>
              </div>
              <button onClick={() => setBurgerMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id && !activeView;
                const hasBadge = tab.id === 'messages' && unreadNotifications > 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { handleTabClick(tab.id); setBurgerMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                      isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                    {hasBadge && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
                  </button>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-700">
              <button
                onClick={() => { handleTabClick('profile'); setBurgerMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'profile' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </button>
              <button
                onClick={() => { setBurgerMenuOpen(false); setActiveTab('dashboard'); signOut(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/30 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

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
    <ErrorBoundary>
      <BrandingProvider>
        <AuthProvider>
          <DemoModeProvider>
            <NavProvider>
              <AppContent />
            </NavProvider>
          </DemoModeProvider>
        </AuthProvider>
      </BrandingProvider>
    </ErrorBoundary>
  );
}

export default App;
