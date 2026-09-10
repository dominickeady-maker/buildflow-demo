import { useState, useEffect } from 'react';
import { supabase, Profile, Task, Site, Timesheet, Material, Trade } from '../../lib/supabase';
import { useNav } from '../../contexts/NavContext';
import { UserCheck, Mail, MapPin, Briefcase, Clock, Package, CheckCircle2, ArrowRight } from 'lucide-react';

export default function WorkerDetail({ workerId }: { workerId: string }) {
  const { pushView } = useNav();
  const [worker, setWorker] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<(Task & { site: Site; trade?: Trade })[]>([]);
  const [timesheets, setTimesheets] = useState<(Timesheet & { site: Site })[]>([]);
  const [materials, setMaterials] = useState<(Material & { site: Site })[]>([]);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData(workerId);
  }, [workerId]);

  async function loadAllData(id: string) {
    const [workerRes, tasksRes, timesheetsRes, materialsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('tasks').select('*, site:sites(*), trade:trades(*)').eq('assigned_to', id).order('created_at', { ascending: false }),
      supabase.from('timesheets').select('*, site:sites(*)').eq('worker_id', id).order('date_worked', { ascending: false }),
      supabase.from('materials').select('*, site:sites(*)').eq('requested_by', id).order('created_at', { ascending: false }),
    ]);

    if (workerRes.data) {
      setWorker(workerRes.data);
      if (workerRes.data) {
        const taskWithTrade = tasksRes.data?.[0];
        if (taskWithTrade?.trade_id) {
          const { data: tradeData } = await supabase.from('trades').select('*').eq('id', taskWithTrade.trade_id).maybeSingle();
          if (tradeData) setTrade(tradeData);
        }
      }
    }
    if (tasksRes.data) setTasks(tasksRes.data as any);
    if (timesheetsRes.data) setTimesheets(timesheetsRes.data as any);
    if (materialsRes.data) setMaterials(materialsRes.data as any);
    setLoading(false);
  }

  if (loading || !worker) {
    return <div className="flex items-center justify-center h-64"><Clock className="w-8 h-8 animate-spin text-brand-500" /></div>;
  }

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'complete');
  const siteIds = [...new Set(tasks.map(t => t.site_id))];
  const totalHours = timesheets.filter(e => e.work_type === 'daywork').reduce((sum, e) => sum + (e.hours_worked || 0), 0);

  return (
    <div className="space-y-6">
      {/* Worker Header */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-5">
        <div className="flex items-center gap-4">
          <div className="bg-brand-500 rounded-full p-3">
            <UserCheck className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{worker.full_name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-brand-400 capitalize">{worker.role}</span>
              {trade && <span className="text-sm text-slate-400">· {trade.name}</span>}
            </div>
            <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
              <Mail className="w-3 h-3" /> {worker.email}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <Briefcase className="w-5 h-5 text-green-400 mb-2" />
          <div className="text-2xl font-bold text-white">{tasks.length}</div>
          <div className="text-sm text-slate-400">Total Tasks</div>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-green-400 mb-2" />
          <div className="text-2xl font-bold text-white">{completedTasks.length}</div>
          <div className="text-sm text-slate-400">Completed</div>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <Clock className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-white">{totalHours.toFixed(1)}</div>
          <div className="text-sm text-slate-400">Daywork Hours</div>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <Package className="w-5 h-5 text-brand-400 mb-2" />
          <div className="text-2xl font-bold text-white">{materials.length}</div>
          <div className="text-sm text-slate-400">Material Requests</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sites */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Sites ({siteIds.length})</h3>
          </div>
          <div className="space-y-2">
            {siteIds.map(siteId => {
              const site = tasks.find(t => t.site_id === siteId)?.site;
              if (!site) return null;
              const siteTaskCount = tasks.filter(t => t.site_id === siteId).length;
              return (
                <button
                  key={siteId}
                  onClick={() => pushView({ type: 'site', id: siteId, label: site.name, subTab: 'overview' })}
                  className="w-full flex items-center justify-between p-2 hover:bg-slate-600/50 rounded-lg transition-colors text-left"
                >
                  <span className="text-sm text-slate-300">{site.name}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">{siteTaskCount} tasks <ArrowRight className="w-3 h-3" /></span>
                </button>
              );
            })}
            {siteIds.length === 0 && <p className="text-sm text-slate-400">No sites assigned</p>}
          </div>
        </div>

        {/* Task Status Breakdown */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Task Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-400">To Do</span>
              <span className="text-white font-medium">{todoTasks.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-400">In Progress</span>
              <span className="text-white font-medium">{inProgressTasks.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Complete</span>
              <span className="text-white font-medium">{completedTasks.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">Tasks</h3>
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center justify-between p-2 hover:bg-slate-600/50 rounded-lg transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <span className={`w-2 h-2 rounded-full ${
                  task.status === 'todo' ? 'bg-brand-500' :
                  task.status === 'in_progress' ? 'bg-blue-500' :
                  'bg-green-500'
                }`} />
                <button onClick={() => pushView({ type: 'task', id: task.id, label: task.title })} className="text-sm text-white hover:text-brand-400 transition-colors">
                  {task.title}
                </button>
              </div>
              <button onClick={() => pushView({ type: 'site', id: task.site_id, label: task.site.name, subTab: 'overview' })} className="text-xs text-blue-400 hover:text-blue-300 transition-colors ml-2">
                {task.site.name}
              </button>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-sm text-slate-400">No tasks assigned</p>}
        </div>
      </div>

      {/* Timesheets */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">Logged Hours</h3>
        <div className="space-y-2">
          {timesheets.map(entry => (
            <div key={entry.id} className="flex items-center justify-between p-2 hover:bg-slate-600/50 rounded-lg transition-colors">
              <div className="flex-1">
                <span className="text-sm text-slate-300">{entry.task_description}</span>
                <button onClick={() => pushView({ type: 'site', id: entry.site_id, label: entry.site.name, subTab: 'overview' })} className="text-xs text-blue-400 hover:text-blue-300 ml-2">
                  {entry.site.name}
                </button>
              </div>
              <span className="text-sm text-white font-medium">
                {entry.work_type === 'daywork' ? `${entry.hours_worked}h` : `£${entry.pricework_amount?.toFixed(2)}`}
              </span>
            </div>
          ))}
          {timesheets.length === 0 && <p className="text-sm text-slate-400">No timesheet entries</p>}
        </div>
      </div>

      {/* Materials */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">Material Requests</h3>
        <div className="space-y-2">
          {materials.map(m => (
            <div key={m.id} className="flex items-center justify-between p-2 hover:bg-slate-600/50 rounded-lg transition-colors">
              <div className="flex-1">
                <span className="text-sm text-slate-300">{m.item_name}</span>
                <button onClick={() => pushView({ type: 'site', id: m.site_id, label: m.site.name, subTab: 'overview' })} className="text-xs text-blue-400 hover:text-blue-300 ml-2">
                  {m.site.name}
                </button>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                m.status === 'delivered' ? 'bg-green-900/50 text-green-400' :
                m.status === 'ordered' ? 'bg-purple-900/30 text-purple-400' :
                m.status === 'approved' ? 'bg-blue-900/30 text-blue-400' :
                'bg-brand-900/30 text-brand-400'
              }`}>{m.status}</span>
            </div>
          ))}
          {materials.length === 0 && <p className="text-sm text-slate-400">No material requests</p>}
        </div>
      </div>
    </div>
  );
}
