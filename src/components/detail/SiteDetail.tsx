import { useState, useEffect } from 'react';
import { supabase, Site, Task, Profile, Material, Timesheet, Trade, Drawing } from '../../lib/supabase';
import { useNav } from '../../contexts/NavContext';
import { MapPin, CheckCircle2, Clock, ListTodo, Package, FileText, Camera, MessageCircle, BarChart3, ArrowRight } from 'lucide-react';

const SUB_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'timesheets', label: 'Timesheets', icon: Clock },
  { id: 'materials', label: 'Materials', icon: Package },
  { id: 'drawings', label: 'Drawings', icon: FileText },
  { id: 'photos', label: 'Photos', icon: Camera },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
];

export default function SiteDetail({ siteId }: { siteId: string }) {
  const { activeView, setSubTab, pushView } = useNav();
  const [site, setSite] = useState<Site | null>(null);
  const [tasks, setTasks] = useState<(Task & { assignee?: Profile; trade?: Trade })[]>([]);
  const [timesheets, setTimesheets] = useState<(Timesheet & { worker?: Profile })[]>([]);
  const [materials, setMaterials] = useState<(Material & { requester?: Profile })[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentSubTab = activeView?.subTab || 'overview';

  useEffect(() => {
    loadAllData(siteId);
  }, [siteId]);

  async function loadAllData(id: string) {
    const [
      siteRes, tasksRes, timesheetsRes, materialsRes, drawingsRes, photosRes
    ] = await Promise.all([
      supabase.from('sites').select('*').eq('id', id).maybeSingle(),
      supabase.from('tasks').select('*, assignee:profiles!assigned_to(*), trade:trades(*)').eq('site_id', id).order('created_at', { ascending: false }),
      supabase.from('timesheets').select('*, worker:profiles!worker_id(*)').eq('site_id', id).order('date_worked', { ascending: false }),
      supabase.from('materials').select('*, requester:profiles!requested_by(*)').eq('site_id', id).order('created_at', { ascending: false }),
      supabase.from('drawings').select('*').eq('site_id', id).order('created_at', { ascending: false }),
      supabase.from('construction_photos').select('*').eq('site_id', id).order('created_at', { ascending: false }),
    ]);

    if (siteRes.data) setSite(siteRes.data);
    if (tasksRes.data) setTasks(tasksRes.data as any);
    if (timesheetsRes.data) setTimesheets(timesheetsRes.data as any);
    if (materialsRes.data) setMaterials(materialsRes.data as any);
    if (drawingsRes.data) setDrawings(drawingsRes.data);
    if (photosRes.data) setPhotos(photosRes.data);

    const workerIds = [...new Set((tasksRes.data || []).map((t: any) => t.assigned_to).filter(Boolean))] as string[];
    if (workerIds.length > 0) {
      const { data: workerData } = await supabase.from('profiles').select('*').in('id', workerIds);
      if (workerData) setWorkers(workerData);
    }

    setLoading(false);
  }

  if (loading || !site) {
    return <div className="flex items-center justify-center h-64"><Clock className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'complete');
  const progress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Site Header */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{site.name}</h2>
              {site.description && <p className="text-sm text-slate-400 mt-0.5">{site.description}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{Math.round(progress)}%</div>
            <div className="text-xs text-slate-400">Complete</div>
          </div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                isActive
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

      {/* Sub-tab content */}
      {currentSubTab === 'overview' && (
        <SiteOverview
          tasks={tasks}
          todoTasks={todoTasks}
          inProgressTasks={inProgressTasks}
          completedTasks={completedTasks}
          workers={workers}
          timesheets={timesheets}
          materials={materials}
          drawings={drawings}
          photos={photos}
          onTaskClick={(taskId, title) => pushView({ type: 'task', id: taskId, label: title })}
          onWorkerClick={(workerId, name) => pushView({ type: 'worker', id: workerId, label: name })}
          onSubTab={setSubTab}
        />
      )}

      {currentSubTab === 'tasks' && (
        <SiteTasks
          tasks={tasks}
          onTaskClick={(taskId, title) => pushView({ type: 'task', id: taskId, label: title })}
          onWorkerClick={(workerId, name) => pushView({ type: 'worker', id: workerId, label: name })}
        />
      )}

      {currentSubTab === 'timesheets' && (
        <SiteTimesheets timesheets={timesheets} onWorkerClick={(workerId, name) => pushView({ type: 'worker', id: workerId, label: name })} />
      )}

      {currentSubTab === 'materials' && (
        <SiteMaterials materials={materials} onWorkerClick={(workerId, name) => pushView({ type: 'worker', id: workerId, label: name })} />
      )}

      {currentSubTab === 'drawings' && <SiteDrawings drawings={drawings} />}

      {currentSubTab === 'photos' && <SitePhotos photos={photos} />}

      {currentSubTab === 'messages' && <SiteMessages siteName={site.name} />}
    </div>
  );
}

// ---- Overview ----
function SiteOverview({ tasks, todoTasks, inProgressTasks, completedTasks, workers, timesheets, materials, drawings, photos, onTaskClick, onWorkerClick, onSubTab }: {
  tasks: (Task & { assignee?: Profile; trade?: Trade })[];
  todoTasks: (Task & { assignee?: Profile; trade?: Trade })[];
  inProgressTasks: (Task & { assignee?: Profile; trade?: Trade })[];
  completedTasks: (Task & { assignee?: Profile; trade?: Trade })[];
  workers: Profile[];
  timesheets: (Timesheet & { worker?: Profile })[];
  materials: (Material & { requester?: Profile })[];
  drawings: Drawing[];
  photos: any[];
  onTaskClick: (taskId: string, title: string) => void;
  onWorkerClick: (workerId: string, name: string) => void;
  onSubTab: (tab: string) => void;
}) {
  const totalHours = timesheets.filter(e => e.work_type === 'daywork').reduce((sum, e) => sum + (e.hours_worked || 0), 0);
  const totalPrice = timesheets.filter(e => e.work_type === 'price').reduce((sum, e) => sum + (e.pricework_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => onSubTab('tasks')} className="bg-slate-700 border border-slate-600 rounded-lg p-4 text-left hover:border-orange-500/50 transition-colors">
          <ListTodo className="w-5 h-5 text-slate-400 mb-2" />
          <div className="text-2xl font-bold text-white">{tasks.length}</div>
          <div className="text-sm text-slate-400">Total Tasks</div>
        </button>
        <div className="bg-orange-900/30 border border-orange-800/30 rounded-lg p-4">
          <Clock className="w-5 h-5 text-orange-400 mb-2" />
          <div className="text-2xl font-bold text-white">{todoTasks.length}</div>
          <div className="text-sm text-orange-400">To Do</div>
        </div>
        <div className="bg-blue-900/30 border border-blue-800/30 rounded-lg p-4">
          <BarChart3 className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-white">{inProgressTasks.length}</div>
          <div className="text-sm text-blue-400">In Progress</div>
        </div>
        <div className="bg-green-900/30 border border-green-800/30 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-green-400 mb-2" />
          <div className="text-2xl font-bold text-white">{completedTasks.length}</div>
          <div className="text-sm text-green-400">Complete</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Crew */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Crew on Site</h3>
            <span className="text-sm text-slate-400">({workers.length})</span>
          </div>
          {workers.length > 0 ? (
            <div className="space-y-2">
              {workers.map(w => {
                const workerTasks = tasks.filter(t => t.assigned_to === w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => onWorkerClick(w.id, w.full_name)}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-600/50 rounded-lg transition-colors text-left"
                  >
                    <span className="text-sm text-slate-300">{w.full_name}</span>
                    <span className="text-xs text-slate-500">{workerTasks.length} task{workerTasks.length !== 1 ? 's' : ''}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No workers assigned</p>
          )}
        </div>

        {/* Hours & Materials summary */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Site Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Daywork Hours</span>
              <span className="text-blue-300 font-medium">{totalHours.toFixed(1)} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pricework Total</span>
              <span className="text-orange-300 font-medium">£{totalPrice.toFixed(2)}</span>
            </div>
            <button onClick={() => onSubTab('materials')} className="w-full flex justify-between items-center p-1 hover:text-orange-400 transition-colors">
              <span className="text-slate-400">Material Requests</span>
              <span className="flex items-center gap-1 text-slate-300">{materials.length} <ArrowRight className="w-3 h-3" /></span>
            </button>
            <button onClick={() => onSubTab('drawings')} className="w-full flex justify-between items-center p-1 hover:text-orange-400 transition-colors">
              <span className="text-slate-400">Drawings</span>
              <span className="flex items-center gap-1 text-slate-300">{drawings.length} <ArrowRight className="w-3 h-3" /></span>
            </button>
            <button onClick={() => onSubTab('photos')} className="w-full flex justify-between items-center p-1 hover:text-orange-400 transition-colors">
              <span className="text-slate-400">Photos</span>
              <span className="flex items-center gap-1 text-slate-300">{photos.length} <ArrowRight className="w-3 h-3" /></span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {[...tasks.slice(0, 3).map(t => ({ type: 'task', date: t.created_at, title: t.title, id: t.id }))]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(item => (
              <button
                key={item.id}
                onClick={() => onTaskClick(item.id, item.title)}
                className="w-full flex items-center justify-between p-2 hover:bg-slate-600/50 rounded-lg transition-colors text-left"
              >
                <span className="text-sm text-slate-300">{item.title}</span>
                <span className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
              </button>
            ))}
          {tasks.length === 0 && <p className="text-sm text-slate-400">No recent activity</p>}
        </div>
      </div>
    </div>
  );
}

// ---- Tasks ----
function SiteTasks({ tasks, onTaskClick, onWorkerClick }: {
  tasks: (Task & { assignee?: Profile; trade?: Trade })[];
  onTaskClick: (taskId: string, title: string) => void;
  onWorkerClick: (workerId: string, name: string) => void;
}) {
  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <div key={task.id} className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-orange-500/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {task.trade && (
                  <span className="text-xs font-medium text-orange-300 bg-orange-900/30 px-2 py-1 rounded">{task.trade.name}</span>
                )}
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  task.status === 'complete' ? 'bg-green-900/50 text-green-400' :
                  task.status === 'in_progress' ? 'bg-blue-900/50 text-blue-400' :
                  'bg-slate-600 text-white'
                }`}>{task.status.replace('_', ' ')}</span>
              </div>
              <button onClick={() => onTaskClick(task.id, task.title)} className="text-left">
                <h3 className="font-medium text-white hover:text-orange-400 transition-colors">{task.title}</h3>
              </button>
              {task.description && <p className="text-sm text-slate-300 mt-1">{task.description}</p>}
              {task.assignee && (
                <button onClick={() => onWorkerClick(task.assignee!.id, task.assignee!.full_name)} className="text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                  {task.assignee.full_name}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {tasks.length === 0 && <p className="text-slate-400 text-center py-8">No tasks for this site</p>}
    </div>
  );
}

// ---- Timesheets ----
function SiteTimesheets({ timesheets, onWorkerClick }: {
  timesheets: (Timesheet & { worker?: Profile })[];
  onWorkerClick: (workerId: string, name: string) => void;
}) {
  return (
    <div className="space-y-3">
      {timesheets.map(entry => (
        <div key={entry.id} className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-400">Plot {entry.plot_number}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${entry.work_type === 'daywork' ? 'bg-blue-900/30 text-blue-300' : 'bg-orange-900/30 text-orange-300'}`}>
                  {entry.work_type === 'daywork' ? 'Daywork' : 'Price'}
                </span>
              </div>
              <h3 className="font-medium text-white">{entry.task_description}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                {entry.worker && (
                  <button onClick={() => onWorkerClick(entry.worker!.id, entry.worker!.full_name)} className="text-blue-400 hover:text-blue-300 transition-colors">
                    {entry.worker.full_name}
                  </button>
                )}
                <span>{new Date(entry.date_worked).toLocaleDateString()}</span>
              </div>
              {entry.notes && <p className="text-sm text-slate-400 mt-2">{entry.notes}</p>}
            </div>
            <div className="ml-4 text-right">
              {entry.work_type === 'daywork' ? (
                <><div className="text-2xl font-bold text-white">{entry.hours_worked}</div><div className="text-xs text-slate-400">hours</div></>
              ) : (
                <><div className="text-2xl font-bold text-white">£{entry.pricework_amount?.toFixed(2)}</div><div className="text-xs text-slate-400">price</div></>
              )}
            </div>
          </div>
        </div>
      ))}
      {timesheets.length === 0 && <p className="text-slate-400 text-center py-8">No timesheet entries for this site</p>}
    </div>
  );
}

// ---- Materials ----
function SiteMaterials({ materials, onWorkerClick }: {
  materials: (Material & { requester?: Profile })[];
  onWorkerClick: (workerId: string, name: string) => void;
}) {
  return (
    <div className="space-y-3">
      {materials.map(m => (
        <div key={m.id} className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  m.status === 'delivered' ? 'bg-green-900/50 text-green-400' :
                  m.status === 'ordered' ? 'bg-purple-900/30 text-purple-400' :
                  m.status === 'approved' ? 'bg-blue-900/30 text-blue-400' :
                  'bg-orange-900/30 text-orange-400'
                }`}>{m.status}</span>
              </div>
              <h3 className="font-medium text-white">{m.item_name}</h3>
              <p className="text-sm text-slate-300">Quantity: {m.quantity}</p>
              {m.comment && <p className="text-sm text-slate-300 mt-1">{m.comment}</p>}
              {m.requester && (
                <button onClick={() => onWorkerClick(m.requester!.id, m.requester!.full_name)} className="text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                  Requested by: {m.requester.full_name}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {materials.length === 0 && <p className="text-slate-400 text-center py-8">No material requests for this site</p>}
    </div>
  );
}

// ---- Drawings ----
function SiteDrawings({ drawings }: { drawings: Drawing[] }) {
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg overflow-hidden">
      {drawings.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No drawings for this site</p>
      ) : (
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Title</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Category</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Version</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Date</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">View</th>
            </tr>
          </thead>
          <tbody>
            {drawings.map(d => (
              <tr key={d.id} className="border-t border-slate-600 hover:bg-slate-600/50">
                <td className="py-3 px-4 text-white font-medium">{d.title}</td>
                <td className="py-3 px-4 text-slate-300">{d.category}</td>
                <td className="py-3 px-4 text-slate-300">{d.version}</td>
                <td className="py-3 px-4 text-slate-400 text-sm">{new Date(d.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => window.open(d.file_url, '_blank')} className="text-blue-400 hover:text-blue-300 text-sm">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---- Photos ----
function SitePhotos({ photos }: { photos: any[] }) {
  if (photos.length === 0) return <p className="text-slate-400 text-center py-8">No photos for this site</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {photos.map(p => (
        <div key={p.id} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-800">
          <img src={p.image_url} alt={p.description || ''} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
            {p.description && <p className="text-white text-xs line-clamp-2">{p.description}</p>}
            <p className="text-slate-300 text-xs">{new Date(p.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Messages ----
function SiteMessages({ siteName }: { siteName: string }) {
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-8 text-center">
      <MessageCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
      <p className="text-slate-400">Messages for {siteName}</p>
      <p className="text-slate-500 text-sm mt-1">Use the Messages tab in the top bar to communicate with the team about this site.</p>
    </div>
  );
}
